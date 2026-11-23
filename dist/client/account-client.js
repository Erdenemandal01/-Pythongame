/* Account sessions use the active host. Guest progress stays on the device. */
window.GameAccount = (() => {
    'use strict';
    const avatars = {scout: 'Хайгуулч', mage: 'Шидтэн', ranger: 'Ойн харуул', mechanic: 'Зохион бүтээгч'};
    const syncText = {idle: '', dirty: 'Хадгалахаар хүлээж байна', saving: 'Хадгалж байна…', saved: 'Бүртгэлд хадгалагдсан', conflict: 'Хоёр өөр хадгаламж байна', error: 'Ахиц илгээгдээгүй'};
    const offline = location.protocol === 'file:' || Boolean(window.PQ_CLASSROOM_KIT);
    const usernameAccount = offline ? null : window.PQUsernameAccount;
    let hooks, dialog, body, heading, phase = offline ? 'offline' : 'loading', sync = 'idle';
    let cloud = false, profile = null, accountKey = '', contextKey = '', revision = 0;
    let generation = 0, committed = '', pending = null, timer = 0, checking = null;
    let newerRevision = 0;
    let syncMessage = '', formBusy = false, authNotice = '', editing = false, leaving = false, switching = false;
    let authMode = 'signin', usernameValue = '', authUser, authReady = false, authStarting;

    function status() { return {phase, sync, profile: profile && {...profile}, cloud, offline, authAvailable: !offline, newer: newerRevision > revision}; }
    function notify() {
        const detail = status();
        hooks?.onStatus?.(detail);
        window.dispatchEvent(new CustomEvent('pq-account-change', {detail}));
        updateSyncUI();
    }
    function setSync(value, message = '') {
        if (sync === value && syncMessage === message) return;
        sync = value;
        syncMessage = message;
        notify();
    }
    function node(tag, cls, content) {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (content !== undefined) el.textContent = content;
        return el;
    }
    function action(label, fn, secondary = false) {
        const el = node('button', secondary ? 'secondary' : '', label);
        el.type = 'button';
        el.addEventListener('click', fn);
        return el;
    }
    function portrait(avatar) {
        const img = node('img', 'account-portrait');
        img.alt = '';
        img.src = 'art/avatars/' + (Object.hasOwn(avatars, avatar) ? avatar : 'scout') + '.png';
        return img;
    }
    function authLink(signOut = false, discard = false) {
        if (usernameAccount && signOut) {
            const btn = action(discard ? 'Хадгалаагүй өөрчлөлтөө орхиод гарах' : 'Бүртгэлээс гарах', async () => {
                if (formBusy) return;
                if (discard) {
                    if (!window.confirm('Энэ цонхонд хадгалаагүй ахиц үлдсэн байна. Бүртгэлээс гарах уу?')) return;
                } else if (cloud && (sync !== 'saved' || changedSinceSave())) {
                    if (sync === 'saved') changed();
                    if (sync === 'dirty') void flush();
                    return;
                }
                formBusy = true;
                updateSyncUI();
                try {
                    await usernameAccount.signOut();
                    await useIdentity(null);
                } catch {
                    authNotice = 'Бүртгэлээс гарч чадсангүй. Холболтоо шалгаад дахин оролдоорой.';
                    render();
                } finally { formBusy = false; updateSyncUI(); }
            }, true);
            btn.classList.add('account-link', 'quiet');
            if (!discard) btn.dataset.accountLogout = '';
            return btn;
        }
        const dest = new URL(location.href);
        if (signOut) dest.searchParams.delete('pq_account');
        else dest.searchParams.set('pq_account', 'open');
        let path = dest.pathname + dest.search + dest.hash;
        if (!path.startsWith('/') || path.startsWith('//') || ['/signin-with-chatgpt','/signout-with-chatgpt','/callback'].includes(dest.pathname)) path = '/';
        const el = node('a', signOut ? 'account-link quiet' : 'account-link', signOut ? 'Бүртгэлээс гарах' : 'ChatGPT-ээр нэвтрэх');
        el.target = '_top';
        el.href = (signOut ? '/signout-with-chatgpt' : '/signin-with-chatgpt') + '?return_to=' + encodeURIComponent(path);
        if (discard) {
            el.textContent = 'Хадгалаагүй өөрчлөлтөө орхиод гарах';
            el.addEventListener('click', event => {
                if (formBusy || !window.confirm('Энэ цонхонд хадгалаагүй ахиц үлдсэн байна. Бүртгэлээс гарах уу?')) { event.preventDefault(); return; }
                leaving = true;
                setTimeout(() => { leaving = false; }, 15000);
            });
        } else if (signOut) {
            el.dataset.accountLogout = '';
            el.addEventListener('click', event => {
                if (formBusy || (cloud && (sync !== 'saved' || changedSinceSave()))) {
                    event.preventDefault();
                    if (cloud && sync === 'saved') changed();
                    if (cloud && sync === 'dirty') void flush();
                } else { leaving = true; setTimeout(() => { leaving = false; }, 15000); }
            });
        }
        return el;
    }
    async function api(path, method = 'GET', data, key, enrollment) {
        if (usernameAccount) return usernameAccount.api(path, method, data, key, enrollment);
        const headers = {Accept: 'application/json'};
        if (key) headers['X-PQ-Account'] = key;
        if (enrollment) headers['X-PQ-Enrollment'] = enrollment;
        if (data !== undefined) headers['Content-Type'] = 'application/json';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch('/api/account' + path, {method, headers, credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal, body: data === undefined ? undefined : JSON.stringify(data)});
            if (!res.ok) throw Object.assign(new Error('Account request failed'), {status: res.status});
            return await res.json();
        } finally { clearTimeout(timeout); }
    }
    function resetSession() {
        generation++;
        clearTimeout(timer);
        pending = null;
        committed = '';
        const wasCloud = cloud;
        cloud = false;
        profile = null;
        accountKey = '';
        contextKey = '';
        revision = 0;
        newerRevision = 0;
        sync = 'idle';
        syncMessage = '';
        editing = false;
        formBusy = false;
        if (wasCloud) {
            switching = true;
            try { hooks.restoreGuest(); } finally { switching = false; }
        }
    }
    function setPhase(value) {
        phase = value;
        notify();
        if (dialog?.open) render();
    }
    async function useIdentity(id) {
        if (id === authUser) return checking;
        if (authUser !== undefined) { authMode = 'signin'; authNotice = ''; }
        authUser = id;
        resetSession();
        if (id === null) usernameValue = '';
        setPhase('loading');
        const at = generation;
        if (checking) await checking;
        if (at === generation) await check();
    }
    async function startUsernameAccount() {
        if (authReady) return check();
        if (authStarting) return authStarting;
        authStarting = (async () => {
            try {
                const id = await usernameAccount.userId();
                authReady = true;
                usernameAccount.watch(useIdentity);
                await useIdentity(id);
            } catch {
                authReady = false;
                authNotice = 'Бүртгэлийн үйлчилгээнд холбогдож чадсангүй. Дахин оролдоорой.';
                setPhase('error');
            }
        })();
        try { await authStarting; } finally { authStarting = null; }
    }
    function sessionChanged() {
        resetSession();
        authNotice = 'Нэвтэрсэн бүртгэл солигдсон байна. Аялагчийн мэдээллийг дахин шалгана уу.';
        setPhase('error');
    }
    function denied(error) { return [401, 403, 404, 412].includes(error?.status); }
    function validateMember(info) {
        if (!info.authenticated || !info.accountKey || typeof info.profile?.name !== 'string' || !Object.hasOwn(avatars, info.profile.avatar)) throw Error('Incomplete profile');
    }
    function validateSave(data, key) {
        if (data.accountKey !== key || !Number.isSafeInteger(data.revision) || data.revision < 0 || !(data.save === null || (data.save?.version === 1 && Array.isArray(data.save.done)))) throw Error('Invalid account save');
    }
    function enter(info, save) {
        validateMember(info);
        validateSave(save, info.accountKey);
        const next = save.save ?? hooks.fresh();
        next.name = info.profile.name;
        cloud = true;
        profile = info.profile;
        accountKey = info.accountKey;
        contextKey = '';
        revision = save.revision;
        newerRevision = 0;
        switching = true;
        try { hooks.replace(next, profile); }
        catch (error) { resetSession(); throw error; }
        finally { switching = false; }
        committed = JSON.stringify(hooks.getState());
        sync = 'saved';
        syncMessage = '';
        setPhase('member');
        if (save.save === null) { committed = ''; changed(); }
    }
    async function check(applyNewer = false) {
        if (offline || checking || (usernameAccount && !authReady)) return checking;
        let at = generation;
        checking = (async () => {
            try {
                const info = await api('');
                if (at !== generation) return;
                if (typeof info.authenticated !== 'boolean') throw Error('Invalid account response');
                if (cloud && accountKey === info.accountKey) {
                    if (sync !== 'saved' || formBusy || changedSinceSave() || !(info.revision > revision)) return;
                    const mayApply = () => applyNewer || (!dialog?.open && hooks.canRefresh?.() !== false);
                    if (!mayApply()) {
                        if (newerRevision !== info.revision) { newerRevision = info.revision; notify(); }
                        return;
                    }
                    const before = revision;
                    const latest = await api('/save', 'GET', undefined, accountKey);
                    if (at === generation && before === revision && sync === 'saved' && !formBusy && !changedSinceSave()) {
                        if (mayApply()) enter(info, latest);
                        else { newerRevision = latest.revision; notify(); }
                    }
                    return;
                }
                if (cloud) { resetSession(); at = generation; setPhase('loading'); }
                if (!info.authenticated) { contextKey = ''; if (phase !== 'guest') setPhase('guest'); return; }
                if (!info.profile) {
                    if (!info.contextKey) throw Error('Missing enrollment context');
                    if (phase === 'enroll' && info.contextKey === contextKey) return;
                    contextKey = info.contextKey;
                    setPhase('enroll');
                    return;
                }
                validateMember(info);
                const until = generation;
                const save = await api('/save', 'GET', undefined, info.accountKey);
                if (until !== generation) return;
                enter(info, save);
                authNotice = '';
            } catch (error) {
                if (at !== generation) return;
                if (denied(error)) { sessionChanged(); return; }
                if (!cloud && at === generation) setPhase('error');
                else if (applyNewer && cloud && at === generation && sync === 'saved') {
                    setSync('saved','Шинэ ахицыг татаж чадсангүй. Дахин оролдоно уу.');
                }
            }
        })();
        try { await checking; } finally { checking = null; }
    }
    function changedSinceSave() { return JSON.stringify(hooks.getState()) !== committed; }
    function changed() {
        if (switching) return true;
        if (!cloud) return false;
        if (sync === 'conflict' || sync === 'error' || pending) return true;
        clearTimeout(timer);
        if (!changedSinceSave()) { setSync('saved'); return true; }
        setSync('dirty');
        timer = setTimeout(flush, 550);
        return true;
    }
    async function flush() {
        clearTimeout(timer);
        if (!cloud || sync === 'conflict' || pending) return pending;
        const json = JSON.stringify(hooks.getState());
        if (committed === json) { setSync('saved'); return; }
        const at = generation, key = accountKey;
        setSync('saving');
        pending = (async () => {
            try {
                const result = await api('/save', 'PUT', {revision, save: JSON.parse(json)}, key);
                if (at !== generation) return;
                if (result.accountKey !== key || !Number.isSafeInteger(result.revision) || result.revision <= revision) throw Error('Unexpected save receipt');
                committed = json;
                revision = result.revision;
                setSync('saved');
            } catch (error) {
                if (at !== generation) return;
                if (denied(error)) { sessionChanged(); return; }
                if (error.status === 409) setSync('conflict');
                else setSync('error', error.status === 413 ? 'Хадгаламжийн хэмжээ хэтэрлээ. Ахицын хуулбараа татаж аваарай.' : 'Ахиц энэ цонхонд байна. Холболтоо сэргээж дахин хадгална уу.');
            } finally {
                if (at === generation) {
                    pending = null;
                    if (cloud && sync === 'saved' && changedSinceSave()) changed();
                }
            }
        })();
        return pending;
    }
    function download() { hooks.download(hooks.getState()); }
    async function resolveConflict(localWins) {
        if (formBusy) return;
        const question = localWins ? 'Бүртгэлд байгаа хувилбарыг энэ цонхны ахицаар солих уу?' : 'Энэ цонхны ахицыг бүртгэлд байгаа хувилбараар солих уу?';
        if (!window.confirm(question)) return;
        const at = generation;
        formBusy = true;
        updateSyncUI();
        try {
            const latest = await api('/save', 'GET', undefined, accountKey);
            if (at !== generation) return;
            validateSave(latest, accountKey);
            if (localWins) {
                revision = latest.revision;
                committed = JSON.stringify(latest.save);
                setSync('dirty');
                await flush();
            } else enter({authenticated: true, profile, accountKey}, latest);
        } catch (error) {
            if (at !== generation) return;
            if (denied(error)) sessionChanged();
            else setSync('conflict', 'Хадгаламжийг уншиж чадсангүй. Дахин оролдоно уу.');
        } finally {
            if (at === generation) { formBusy = false; updateSyncUI(); }
        }
    }

    function makeDialog() {
        dialog = node('dialog', 'account-dialog');
        dialog.id = 'accountDialog';
        dialog.setAttribute('aria-labelledby', 'accountHeading');
        const top = node('div', 'account-top');
        const label = node('span', 'account-kicker', 'КОДЫН НҮҮДЭЛ');
        const close = action('×', () => dialog.close(), true);
        close.classList.add('account-close');
        close.setAttribute('aria-label', 'Хаах');
        heading = node('h2');
        heading.id = 'accountHeading';
        top.append(label, close, heading);
        body = node('div', 'account-body');
        dialog.append(top, body);
        document.body.append(dialog);
    }
    function offerLocal() {
        const btn = action('Төхөөрөмжийн тоглогчид ба JSON файл', () => {
            dialog.close();
            hooks.showLocalProfile();
        }, true);
        btn.classList.add('account-local');
        return btn;
    }
    function actions(...children) {
        const row = node('div', 'account-actions');
        row.append(...children);
        return row;
    }
    function note(text) { return node('p', 'account-copy', text); }
    const usernameHelp = 'Хэрэглэгчийн нэрээ 3–24 тэмдэгтээр бичнэ. Монгол, англи үсэг, тоо, доогуур зураас (_) болон зураас (-) ашиглаарай.';
    function authError(error) {
        const duplicate = 'Энэ хэрэглэгчийн нэрийг өөр тоглогч авсан байна. Өөр нэр сонгоорой.';
        const messages = {
            invalid_username: usernameHelp,
            invalid_credentials: 'Хэрэглэгчийн нэр эсвэл нууц үг таарсангүй.',
            user_already_exists: duplicate,
            email_exists: duplicate,
            weak_password: 'Илүү урт, таахад хэцүү нууц үг сонгоорой.',
            over_request_rate_limit: 'Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоорой.',
            signup_disabled: 'Шинэ бүртгэл одоогоор хаалттай байна.',
            signup_unavailable: 'Бүртгэлээр нэвтэрч чадсангүй. Дахин оролдоод, асуудал хэвээр байвал сайтын хариуцагчтай холбогдоорой.'
        };
        return messages[error?.code] || (error?.status === 429 ? messages.over_request_rate_limit : 'Хүсэлтийг гүйцэтгэж чадсангүй. Холболтоо шалгаад дахин оролдоорой.');
    }
    function usernameForm() {
        const signup = authMode === 'signup';
        const form = node('form', 'account-form');
        heading.textContent = signup ? 'Шинээр бүртгүүлэх' : 'Бүртгэлээрээ нэвтрэх';
        if (signup) form.append(note('Хэрэглэгчийн нэр, нууц үгээ сонгоод Python хичээлээ бие даан эхлүүлээрэй. Та өөр компьютер дээр ч бүртгэлээрээ нэвтэрч ахицаа үргэлжлүүлж болно.'));
        const label = node('label', 'account-name', 'Хэрэглэгчийн нэр');
        const username = node('input');
        username.type = 'text'; username.name = 'username'; username.required = true;
        username.autocomplete = 'username'; username.autocapitalize = 'none'; username.spellcheck = false;
        username.value = usernameValue;
        username.addEventListener('input', () => { usernameValue = username.value; username.setCustomValidity(''); });
        label.append(username);
        form.append(label);
        if (signup) {
            const hint = note(usernameHelp); hint.id = 'username-hint';
            username.setAttribute('aria-describedby', hint.id); form.append(hint);
        }
        const passwordLabel = node('label', 'account-name', signup ? 'Шинэ нууц үг (8-аас доошгүй тэмдэгт)' : 'Нууц үг');
        const password = node('input');
        password.type = 'password'; password.name = 'password'; password.required = true;
        password.autocomplete = signup ? 'new-password' : 'current-password';
        if (signup) password.minLength = 8;
        passwordLabel.append(password);
        form.append(passwordLabel);
        const message = node('p', 'account-form-message');
        message.setAttribute('role', 'status');
        const submit = node('button', '', signup ? 'Бүртгэл үүсгэх' : 'Нэвтрэх');
        submit.type = 'submit';
        const toggle = action(signup ? 'Нэвтрэх рүү буцах' : 'Шинээр бүртгүүлэх', () => {
            authMode = signup ? 'signin' : 'signup';
            authNotice = '';
            render();
            body.querySelector('input')?.focus();
        }, true);
        form.append(message, actions(submit, toggle));
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (formBusy) return;
            if (!usernameAccount.validUsername(username.value)) {
                username.setCustomValidity(usernameHelp);
                username.reportValidity();
                return;
            }
            const at = generation;
            formBusy = true;
            for (const control of form.elements) control.disabled = true;
            message.textContent = 'Түр хүлээнэ үү…';
            try {
                const id = await usernameAccount.identify(signup, username.value, password.value);
                password.value = '';
                authMode = 'signin';
                authNotice = '';
                await useIdentity(id);
            } catch (error) {
                if (at === generation) message.textContent = authError(error);
            } finally {
                if (at === generation) {
                    formBusy = false;
                    for (const control of form.elements) control.disabled = false;
                    updateSyncUI();
                }
            }
        });
        return form;
    }
    function makeForm(enroll) {
        const form = node('form', 'account-form');
        const label = node('label', 'account-name', 'Тоглоомын хоч');
        const name = node('input');
        name.type = 'text';
        name.name = 'nickname';
        name.autocomplete = 'nickname';
        name.placeholder = 'Жишээ нь, Саран';
        name.value = enroll ? '' : profile.name;
        name.maxLength = 48;
        name.required = true;
        name.addEventListener('input', () => name.setCustomValidity(''));
        label.append(name);
        const roles = node('fieldset', 'account-roles');
        roles.append(node('legend', '', 'Баатраа сонго'));
        const grid = node('div', 'account-avatar-grid');
        Object.entries(avatars).forEach(([id, title]) => {
            const option = node('label', 'account-avatar');
            const radio = node('input');
            radio.type = 'radio'; radio.name = 'avatar'; radio.value = id;
            radio.checked = (enroll ? 'scout' : profile.avatar) === id;
            option.append(radio, portrait(id), node('span', '', title));
            grid.append(option);
        });
        roles.append(grid);
        form.append(label, roles);
        if (enroll) {
            const origin = node('fieldset', 'account-source');
            origin.append(node('legend', '', 'Аяллаа хаанаас эхлэх вэ?'));
            const guest = hooks.getState();
            const count = guest.done?.length ?? 0, projects = guest.academy?.won?.length ?? 0;
            const choices = [
                ['fresh', 'Шинэ аялал эхлүүлэх', 'Анхны даалгавраас эхэлнэ.'],
                ['device', 'Энэ төхөөрөмжийн ахицыг авах', `${guest.name || 'Аялагч'} · ${count} даалгавар · ${projects} хичээл`]
            ];
            for (const [value, title, subtitle] of choices) {
                const opt = node('label', 'account-source-option'), radio = node('input');
                radio.type = 'radio'; radio.name = 'origin'; radio.value = value; radio.checked = value === 'fresh';
                const lines = node('span');
                lines.append(node('b', '', title), node('small', '', subtitle));
                opt.append(radio, lines);
                origin.append(opt);
            }
            form.append(origin);
        }
        const submit = node('button', '', enroll ? 'Аялагчаа үүсгэх' : 'Өөрчлөлт хадгалах');
        submit.type = 'submit';
        const row = actions(submit);
        if (!enroll) row.append(action('Буцах', () => { editing = false; render(); }, true));
        const message = node('p', 'account-form-message');
        message.setAttribute('role', 'status');
        form.append(message, row);
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (formBusy) return;
            const alias = name.value.trim().normalize('NFC');
            if ([...alias].length < 2 || [...alias].length > 24 || /[<>\p{Cc}\p{Cf}]/u.test(alias)) {
                name.setCustomValidity('Хочоо 2–24 харагдах тэмдэгтээр бичээрэй.');
                name.reportValidity();
                return;
            }
            const fields = new FormData(form);
            const payload = {name: alias, avatar: fields.get('avatar')};
            const at = generation;
            formBusy = true;
            for (const input of form.elements) input.disabled = true;
            message.textContent = 'Хадгалж байна…';
            updateSyncUI();
            try {
                if (enroll) {
                    const chosen = fields.get('origin') === 'device' ? hooks.getState() : hooks.fresh();
                    payload.save = {...chosen, name: alias};
                    const info = await api('/register', 'POST', payload, undefined, contextKey);
                    if (at !== generation) return;
                    validateMember(info);
                    const save = await api('/save', 'GET', undefined, info.accountKey);
                    if (at !== generation) return;
                    enter(info, save);
                } else {
                    const info = await api('/profile', 'PATCH', payload, accountKey);
                    if (at !== generation) return;
                    validateMember(info);
                    if (info.accountKey !== accountKey) { sessionChanged(); return; }
                    profile = info.profile;
                    hooks.getState().name = profile.name;
                    editing = false;
                    changed();
                    notify();
                    render();
                }
            } catch (error) {
                if (at !== generation) return;
                if (denied(error)) { sessionChanged(); return; }
                if (enroll && error.status === 409) { await check(); return; }
                message.textContent = [400, 422].includes(error.status) ? 'Хоч болон баатрын сонголтоо шалгаарай.' : error.status === 413 ? 'Энэ төхөөрөмжийн хадгаламж хэт том байна. Хуулбараа татаж аваад шинэ аялал сонгоорой.' : 'Хадгалж чадсангүй. Холболтоо шалгаад дахин оролдоорой.';
            } finally {
                if (at === generation) {
                    for (const input of form.elements) input.disabled = false;
                    formBusy = false;
                    updateSyncUI();
                }
            }
        });
        return form;
    }
    function syncPanel() {
        const box = node('section', 'account-sync');
        const title = node('strong'); title.dataset.syncTitle = '';
        title.setAttribute('role', 'status');
        const desc = note(''); desc.dataset.syncBody = '';
        const operations = actions(); operations.dataset.syncActions = '';
        box.append(title, desc, operations);
        return box;
    }
    function updateSyncUI() {
        const logout = body?.querySelector('[data-account-logout]');
        if (logout) {
            const disabled = formBusy || (cloud && sync !== 'saved');
            logout.setAttribute('aria-disabled', String(disabled));
            if (logout.tagName === 'BUTTON') logout.disabled = disabled;
            if (disabled && logout.hasAttribute('href')) {
                logout.dataset.destination = logout.getAttribute('href');
                logout.removeAttribute('href');
            } else if (!disabled && logout.dataset.destination) logout.href = logout.dataset.destination;
        }
        const box = body?.querySelector('.account-sync');
        if (!box) return;
        box.dataset.sync = sync;
        box.querySelector('[data-sync-title]').textContent = syncText[sync];
        const details = box.querySelector('[data-sync-body]');
        const newer = sync === 'saved' && newerRevision > revision;
        const message = syncMessage || (sync === 'conflict' ? 'Өөр цонх эсвэл төхөөрөмжөөс ахиц хадгалагджээ. Хүсвэл энэ цонхны хуулбарыг эхлээд татаарай.' : newer ? 'Өөр компьютер дээр шинэ ахиц хадгалагдсан байна.' : '');
        details.textContent = message;
        details.hidden = !message;
        const row = box.querySelector('[data-sync-actions]');
        row.replaceChildren();
        if (newer) {
            row.append(action('Шинэ ахицыг нээх', async () => {
                if (checking) await checking;
                if (cloud && sync === 'saved' && !changedSinceSave()) await check(true);
            }));
        } else if (sync === 'conflict') {
            row.append(action('Бүртгэлийн хувилбарыг нээх', () => resolveConflict(false), true), action('Энэ цонхны ахицыг хадгалах', () => resolveConflict(true), true));
        } else if (sync === 'error') row.append(action('Дахин хадгалах', flush, true));
        if (sync === 'conflict' || sync === 'error') row.append(action('Ахицын хуулбар татах', download, true), authLink(true, true));
        row.hidden = row.childElementCount === 0;
        for (const button of row.children) button.disabled = formBusy;
    }
    function render() {
        body.replaceChildren();
        if (usernameAccount && authNotice && phase !== 'error') {
            const notice = note(authNotice); notice.setAttribute('role', 'status'); body.append(notice);
        }
        if (phase === 'member') {
            heading.textContent = editing ? 'Баатрын тохиргоо' : 'Миний аялагч';
            if (editing) body.append(makeForm(false));
            else {
                const badge = node('div', 'account-identity');
                const copy = node('div'); copy.append(node('h3', '', profile.name), note(avatars[profile.avatar]));
                badge.append(portrait(profile.avatar), copy);
                body.append(badge, syncPanel(), actions(action('Баатраа засах', () => { editing = true; render(); }, true), action('Ахиц татах', download, true)), authLink(true));
                if (usernameAccount) body.append(note('Дундын компьютер ашиглаж байгаа бол хичээлээ дуусгаад бүртгэлээсээ гараарай.'));
            }
        } else if (phase === 'enroll') {
            heading.textContent = 'Аялагчаа үүсгэе';
            body.append(note(usernameAccount ? 'Хоч, баатраа сонгоорой. Дараагийн удаа хэрэглэгчийн нэрээрээ нэвтрэхэд аяллаа үргэлжлүүлнэ.' : 'Хоч, баатраа сонгоорой. Дараагийн удаа энэ ChatGPT бүртгэлээр нэвтрэхэд аяллаа үргэлжлүүлнэ.'), makeForm(true), authLink(true));
        } else if (phase === 'guest' && usernameAccount) {
            body.append(usernameForm(), offerLocal());
        } else if (phase === 'guest') {
            heading.textContent = authMode === 'signup' ? 'Шинээр бүртгүүлэх' : 'Аяллаа үргэлжлүүлээрэй';
            body.append(note('ChatGPT-ээр нэвтэрч өөрийн тоглогчийн бүртгэл үүсгээрэй. Хичээл, бичсэн код, бүтээлүүдээ өөр компьютероос нээж болно.'), actions(authLink()), note('13-аас доош насны сурагч төхөөрөмжийн профайлаар тоглоно. 13–17 настай бол ChatGPT-д эцэг эх, асран хамгаалагчийн зөвшөөрлөөр нэвтэрнэ.'), offerLocal());
        } else if (phase === 'offline') {
            heading.textContent = 'Төхөөрөмж дээрх аялагч';
            body.append(note('Ангийн багцад сурагч бүр тусдаа аялагчтай байж болно. Ахицын JSON файлаа татаж аваад өөр компьютерт үргэлжлүүлээрэй.'), offerLocal());
        } else if (phase === 'loading') {
            heading.textContent = 'Бүртгэл';
            const msg = note('Таны бүртгэлийг шалгаж байна…'); msg.setAttribute('role', 'status'); body.append(msg);
        } else {
            heading.textContent = 'Бүртгэлтэй холбогдох';
            body.append(note(authNotice || 'Бүртгэлийн үйлчилгээнд хүрч чадсангүй. Энэ төхөөрөмж дээрх аяллаа үргэлжлүүлж болно.'), actions(action('Дахин шалгах', () => { authNotice = ''; setPhase('loading'); if (usernameAccount) void startUsernameAccount(); else void check(); })), offerLocal());
            if (usernameAccount && authUser) body.append(authLink(true));
        }
        updateSyncUI();
    }
    function open(mode) {
        if (!hooks) return;
        if (!dialog) makeDialog();
        const chooseMode = (mode === 'signup' || mode === 'signin') &&
            !offline && !formBusy && ['loading', 'guest', 'error'].includes(phase);
        if (chooseMode) {
            if (dialog.open && authMode === mode) return;
            authMode = mode;
            if (phase === 'guest') authNotice = '';
        } else if (dialog.open) return;
        editing = false;
        render();
        if (!dialog.open) dialog.showModal();
        if (cloud && !formBusy) void check();
    }
    async function init(callbacks) {
        if (hooks) return checking;
        hooks = callbacks;
        if (offline) { notify(); return; }
        const url = new URL(location.href);
        if (url.searchParams.get('pq_account') === 'open') {
            url.searchParams.delete('pq_account');
            history.replaceState(history.state, '', url);
            open();
        }
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (sync === 'dirty') void flush();
            } else if (!formBusy) void check();
        });
        window.addEventListener('online', async () => {
            await check();
            if (cloud && sync === 'error') void flush();
        });
        window.addEventListener('pageshow', event => { if (event.persisted) void check(); });
        window.addEventListener('focus', () => {
            if (cloud && document.visibilityState === 'visible' && !formBusy) void check();
        });
        window.addEventListener('pagehide', () => {
            if (leaving && cloud) {
                resetSession();
                dialog?.close();
                leaving = false;
                setPhase('guest');
            }
        });
        window.addEventListener('beforeunload', e => {
            if (cloud && !leaving && (pending || changedSinceSave())) { e.preventDefault(); e.returnValue = ''; }
        });
        notify();
        if (usernameAccount) await startUsernameAccount();
        else await check();
    }
    return Object.freeze({init, open, changed, status, isCloud: () => cloud});
})();
