(() => {
    'use strict';

    const english = GameLocale.lang === 'en';
    const t = (mn, en) => english ? en : mn;
    const guideName = t('Тэмүүлэн', 'Temuulen');
    const greeting = t('Сайн байна уу, Тэмүүлэн!', 'Hello, Temuulen!');
    const routes = ['home', 'map', 'quest'];
    const seen = new Set();
    const languageReturn = 'pq-temuulen-language-return';
    let active = null;
    let scheduled = false;

    function node(tag, className, label) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (label !== undefined) el.textContent = label;
        return el;
    }

    function button(className, label, onClick) {
        const el = node('button', className, label);
        el.type = 'button';
        el.addEventListener('click', onClick);
        return el;
    }

    function playerKey() {
        return 'pq-temuulen-welcome-v1:' + state.academy.portfolioId;
    }

    function remember(key) {
        seen.add(key);
        try { localStorage.setItem(key, 'seen'); } catch {}
    }

    function hasSeen(key) {
        if (seen.has(key)) return true;
        try { return localStorage.getItem(key) === 'seen'; } catch { return false; }
    }

    function targetMission() {
        if (view === 'quest') return current;
        if (state.resume?.view === 'quest' && !state.done.includes(state.resume.mission)) return state.resume.mission;
        return Math.min(state.done.length, MISSIONS.length - 1);
    }

    function dismiss(markSeen, restoreFocus = true) {
        if (!active) return;
        const {dialog, opener, key, route} = active;
        active = null;
        if (markSeen) remember(key);
        dialog.close();
        dialog.remove();
        if (restoreFocus && route === view) {
            const fallback = document.querySelector('#' + view + 'View .tg-replay');
            (opener?.isConnected ? opener : fallback)?.focus({preventScroll:true});
        }
    }

    function launch() {
        const missionId = targetMission();
        dismiss(true, false);
        if (view !== 'quest') openMission(missionId);
        const editor = document.getElementById('code');
        editor.focus({preventScroll:true});
        editor.scrollIntoView({behavior:'instant', block:'center'});
    }

    function artwork() {
        const scene = node('div', 'tg-scene');
        const img = node('img', 'tg-portrait');
        img.src = 'assets/temuulen-guide.webp?v=2';
        img.alt = t('Тэмүүлэн өдөн залаатай малгай, хуяг, ээтэн хоншоортой монгол гутал өмсжээ.',
            'Temuulen wears a plumed fur hat, lamellar armour and tall Mongolian boots with upturned toes.');
        img.draggable = false;
        scene.append(img, node('p', 'tg-art-caption', t('Орхоны хөндий', 'Orkhon Valley')));
        return scene;
    }

    function languageSelect(s) {
        const select = node('select', 'tg-language');
        select.dataset.gameLanguage = '';
        select.setAttribute('aria-label', 'Хэл / Language');
        select.translate = false;
        for (const [value, label] of [['mn', 'Монгол'], ['en', 'English']]) {
            const option = node('option', '', label);
            option.value = value;
            option.lang = value;
            select.append(option);
        }
        select.value = GameLocale.lang;
        select.addEventListener('change', () => {
            try {
                sessionStorage.setItem(languageReturn, JSON.stringify({
                    key:s.key, route:view, lang:select.value
                }));
            } catch {}
            // The shared language handler saves the active editor and switches locale.
        });
        return select;
    }

    function returningAfterLanguageChange() {
        try {
            const record = JSON.parse(sessionStorage.getItem(languageReturn));
            if (!record || record.lang !== GameLocale.lang) return false;
            sessionStorage.removeItem(languageReturn);
            return record.key === playerKey() && record.route === view;
        } catch { return false; }
    }

    function showStep(step) {
        const s = active;
        s.step = step;
        s.dialog.dataset.step = String(step);
        const toolbar = node('div', 'tg-toolbar');
        const progress = node('span', 'tg-progress', step + ' / 3');
        progress.setAttribute('aria-label', t('3 алхмын ' + step + '-р алхам', 'Step ' + step + ' of 3'));
        toolbar.append(progress);
        if (step === 1) toolbar.append(languageSelect(s));
        toolbar.append(button('tg-skip', t('Алгасах', 'Skip guide'), () => dismiss(true)));
        const speaker = node('p', 'tg-speaker', guideName + t(' · Замч', ' · Trail guide'));
        const title = node('h2', 'tg-title');
        title.id = 'tg-guide-title';
        title.tabIndex = -1;
        const body = node('p', 'tg-body');
        const actions = node('div', 'tg-actions');
        if (step > 1) actions.append(button('tg-back', t('Буцах', 'Back'), () => showStep(step - 1)));
        s.panel.replaceChildren(toolbar, speaker, title, body);

        if (step === 1) {
            title.textContent = t('Сайн явж ирэв үү, аяны анд аа?', 'Welcome to camp, traveller!');
            body.textContent = t('Намайг Тэмүүлэн гэдэг. Манайх Орхон голын эрэгт буусан. Замд гарахаасаа өмнө голын цаадах айлд Python-оор мэнд хүргэе.',
                'I’m Temuulen. Our camp is on the banks of the Orkhon. Before we set out, let’s send a greeting to the family across the river using Python.');
            actions.append(button('tg-next', t('Мэндчилгээ турших', 'Try a greeting'), () => showStep(2)));
        } else if (step === 2) {
            title.textContent = t('Голын цаана ямар үг хүрэх бол?', 'What message will reach the other bank?');
            body.textContent = t('Доорх кодыг ажиллуулбал дэлгэц дээр яг юу харагдахыг сонгоорой.',
                'Choose what will appear on the screen when this line of Python runs.');
            const code = node('pre', 'tg-code');
            code.dir = 'ltr';
            code.append(node('code', '', 'print("' + greeting + '")'));
            const options = node('div', 'tg-options');
            options.setAttribute('role', 'group');
            options.setAttribute('aria-labelledby', title.id);
            const feedback = node('p', 'tg-feedback');
            feedback.setAttribute('role', 'status');
            feedback.setAttribute('aria-live', 'polite');
            const next = button('tg-next', t('Цааш явах', 'Continue'), () => showStep(3));
            next.disabled = !s.correct;
            function report(correct) {
                feedback.dataset.tone = correct ? 'correct' : 'retry';
                feedback.textContent = correct
                    ? t('Яг зөв! Хашилт нь текстийн эхлэл, төгсгөлийг заадаг. Дэлгэц дээр доторх үгс нь гарна.',
                        'Exactly! The quotes mark where the text starts and ends. Only the words inside appear on the screen.')
                    : t('Дахиад нэг хараарай. print() командыг Python уншина. Хашилт дотор юу байна вэ?',
                        'Take another look. Python reads the print() instruction. Which words are inside the quotes?');
            }
            const answers = ['print', greeting, '"' + greeting + '"'];
            const choices = answers.map((answer, index) => {
                const choice = button('tg-choice', answer, () => {
                    s.selected = index;
                    s.correct = index === 1;
                    choices.forEach((el, i) => el.setAttribute('aria-pressed', String(i === index)));
                    next.disabled = !s.correct;
                    report(s.correct);
                });
                choice.setAttribute('aria-pressed', String(s.selected === index));
                return choice;
            });
            if (s.selected !== null) report(s.correct);
            options.append(...choices);
            actions.append(next);
            s.panel.append(code, options, feedback);
        } else {
            const first = targetMission() === 0;
            title.textContent = first ? t('Одоо чиний ээлж!', 'Your turn at the keyboard!')
                : t('Аян замдаа эргэн оръё.', 'Back to your trail');
            body.textContent = first
                ? t('adventure.py дотор print() ашиглаад өөрийн мэндчилгээг бичээрэй. «Код ажиллуулах» товчийг дарахад мэндчилгээ чинь терминалд гарна.',
                    'In adventure.py, use print() to write a greeting of your own. Select “Run code” and look for your message in the terminal.')
                : t('Чиний дараагийн буудал бол «' + MISSIONS[targetMission()].title + '». Даалгавраа нээгээд бичсэн кодоо тэндээс үргэлжлүүлээрэй.',
                    'Your next stop is “' + MISSIONS[targetMission()].title + '”. Open the mission to continue with your code.');
            actions.append(button('tg-next', first ? t('Мэндчилгээгээ бичих', 'Write my greeting')
                : t('Даалгавраа нээх', 'Open my mission'), launch));
        }
        s.panel.append(actions);
        if (s.dialog.open) title.focus({preventScroll:true});
    }

    function open(opener) {
        if (active || busy || document.querySelector('dialog[open]') || !routes.includes(view)) return;
        const dialog = node('dialog', 'tg-dialog');
        dialog.setAttribute('aria-labelledby', 'tg-guide-title');
        const shell = node('div', 'tg-shell');
        const panel = node('div', 'tg-panel');
        shell.append(artwork(), panel);
        dialog.append(shell);
        active = {dialog, panel, route:view, key:playerKey(), opener, selected:null, correct:false};
        dialog.addEventListener('cancel', event => {
            event.preventDefault();
            dismiss(true);
        });
        document.body.append(dialog);
        showStep(1);
        dialog.showModal();
        panel.querySelector('h2').focus({preventScroll:true});
    }

    function replayControl() {
        const selector = {home:'.ss-controls', map:'.map-heading', quest:'.quest-bar'}[view];
        const container = document.querySelector('#' + view + 'View ' + selector);
        if (!container || container.querySelector('.tg-replay')) return;
        const replay = button('tg-replay', t('Тэмүүлэнтэй уулзах', 'Meet Temuulen'), () => open(replay));
        replay.setAttribute('aria-haspopup', 'dialog');
        container.append(replay);
    }

    function refreshNow() {
        scheduled = false;
        if (active && (active.key !== playerKey() || active.route !== view)) dismiss(false, false);
        if (!routes.includes(view)) return;
        replayControl();
        if (active || busy || ReferenceAccess.isOpen() || document.querySelector('dialog[open]')) return;
        if (GameAccount.status().phase === 'loading') return;
        if (returningAfterLanguageChange()) return open(null);
        if (hasSeen(playerKey())) return;
        if (state.done.length || Object.keys(state.attempts).length ||
            Object.entries(state.drafts).some(([id, draft]) => draft !== MISSIONS[id]?.start)) return;
        if (view === 'home' && (state.resume || state.days.length || state.academy.won.length ||
            Object.keys(state.academy.lessons).length || state.battles.won.length)) return;
        open(null);
    }

    function refresh() {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(refreshNow);
    }

    function celebrate(missionId, first) {
        if (missionId !== 0 || !first) return;
        const mark = node('span', 'tg-milestone');
        const portrait = node('img', 'tg-milestone-portrait');
        portrait.src = 'assets/temuulen-guide.webp?v=2';
        portrait.alt = '';
        mark.append(portrait, node('span', '', t('Тэмүүлэн: «Мэндчилгээ чинь голын цаана хүрлээ. Дараагийн өртөө рүү хамт явъя!»',
            'Temuulen: “Your greeting made it across the river. On to the next camp!”')));
        document.getElementById('feedback').append(mark);
    }

    window.TemuulenGuide = {refresh, celebrate};
})();
