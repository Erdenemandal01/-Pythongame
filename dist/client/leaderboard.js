window.Leaderboard = (() => {
    'use strict';
    const periods = {day: 'Өнөөдөр', month: 'Энэ сар'};
    const dates = {
        day: new Intl.DateTimeFormat('mn-MN', {timeZone:'Asia/Ulaanbaatar', month:'long', day:'numeric'}),
        month: new Intl.DateTimeFormat('mn-MN', {timeZone:'Asia/Ulaanbaatar', year:'numeric', month:'long'})
    };
    const format = new Intl.NumberFormat('mn-MN');
    function element(tag, cls, text) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    function button(cls, label, click) {
        const node = element('button', cls, label);
        node.type = 'button';
        node.addEventListener('click', click);
        return node;
    }
    function rankRow(score) {
        const row = element('tr', score.me ? 'lb-own' : '');
        const position = element('td', 'lb-rank');
        const marker = element('span', 'lb-marker', format.format(score.rank));
        if (score.rank >= 1 && score.rank <= 3) marker.classList.add('lb-medal-' + score.rank);
        position.append(marker);
        const player = element('th', 'lb-player', score.alias);
        player.scope = 'row';
        if (score.me) player.append(element('small', 'lb-me', 'Та'));
        row.append(position, player, element('td', 'lb-count', format.format(score.activities)),
            element('td', 'lb-xp', format.format(score.xp)));
        return row;
    }

    let active = null;
    let lastMembershipChange = Promise.resolve();
    class Board {
        constructor(root) {
            this.root = root;
            this.period = 'day';
            this.sequence = 0;
            this.phase = null;
            this.data = null;
            this.owner = null;
            this.error = '';
            this.busy = false;
            this.mutating = false;
            this.refreshPending = false;
            this.accountChanged = () => {
                const {phase, sync} = window.GameAccount.status();
                const justSaved = this.sync && this.sync !== 'saved' && sync === 'saved';
                this.sync = sync;
                if (phase !== this.phase) {
                    this.sequence++;
                    this.phase = phase;
                    this.owner = null;
                    this.data = null;
                    this.busy = this.mutating = this.refreshPending = false;
                    this.error = '';
                    if (phase === 'member' && window.PQUsernameAccount) void this.load();
                    else this.render();
                } else if (justSaved && phase === 'member') {
                    if (this.busy) this.refreshPending = true;
                    else void this.load();
                }
            };
            this.refreshWhenVisible = () => {
                if (!document.hidden && this.phase === 'member' && window.PQUsernameAccount &&
                    !this.busy && Date.now() - this.lastFetch >= 60000) void this.load();
            };
            const panel = element('section', 'lb-shell');
            const header = element('header', 'lb-hero');
            const chest = element('img', 'lb-chest');
            chest.src = 'art/chest.png'; chest.alt = ''; chest.width = 80; chest.height = 80;
            const intro = element('div', 'lb-intro');
            this.date = element('p', 'lb-date');
            intro.append(element('h1', '', 'Онооны самбар'), this.date);
            header.append(intro, chest);
            this.switcher = element('div', 'lb-switcher');
            this.switcher.setAttribute('role', 'group');
            this.switcher.setAttribute('aria-label', 'Онооны хугацаа');
            for (const [key, label] of Object.entries(periods)) {
                const choice = button('lb-period', label, () => {
                    if (this.period === key || this.mutating) return;
                    this.period = key;
                    this.data = null;
                    void this.load();
                });
                choice.dataset.period = key;
                this.switcher.append(choice);
            }
            this.content = element('div', 'lb-content');
            panel.append(header, this.switcher, this.content);
            root.replaceChildren(panel);
            window.addEventListener('pq-account-change', this.accountChanged);
            document.addEventListener('visibilitychange', this.refreshWhenVisible);
            this.timer = setInterval(this.refreshWhenVisible, 60000);
        }
        leave() {
            this.sequence++;
            clearInterval(this.timer);
            window.removeEventListener('pq-account-change', this.accountChanged);
            document.removeEventListener('visibilitychange', this.refreshWhenVisible);
            this.root.replaceChildren();
        }
        async load(join = null) {
            const api = window.PQUsernameAccount;
            if (!api || this.phase !== 'member') { this.render(); return; }
            const at = ++this.sequence;
            this.busy = true;
            this.mutating = join !== null;
            this.error = '';
            this.lastFetch = Date.now();
            if (this.mutating) this.data = null;
            this.render();
            try {
                await lastMembershipChange;
                const id = this.owner || await api.userId();
                if (this.sequence !== at) return;
                if (!id) throw Error('sign_in_required');
                this.owner = id;
                const query = api.leaderboard(this.period, join, id);
                if (this.mutating) lastMembershipChange = query.catch(() => {});
                const result = await query;
                if (this.sequence !== at || this.phase !== 'member') return;
                if (!result || !Array.isArray(result.rows) || typeof result.joined !== 'boolean') throw Error('invalid_result');
                this.data = result;
            } catch {
                if (this.sequence !== at) return;
                this.data = null;
                this.error = join === null ? 'Онооны самбарыг ачаалж чадсангүй.' :
                    'Оролцооны тохиргоог баталгаажуулж чадсангүй. Дахин шалгаарай.';
            } finally {
                if (this.sequence === at) {
                    this.mutating = this.busy = false;
                    this.render();
                    if (this.refreshPending) { this.refreshPending = false; void this.load(); }
                }
            }
        }
        table(rows, title) {
            const table = element('table', 'lb-table');
            table.setAttribute('aria-label', title);
            const head = table.createTHead().insertRow();
            for (const label of ['Байр','Тоглогч','Биелүүлсэн ажил','XP']) {
                const th = element('th','',label); th.scope = 'col'; head.append(th);
            }
            const body = table.createTBody();
            for (const row of rows) body.append(rankRow(row));
            return table;
        }
        render() {
            const available = Boolean(window.PQUsernameAccount) && this.phase === 'member';
            this.switcher.hidden = !available;
            this.date.textContent = dates[this.period].format(new Date()) + ' · Улаанбаатарын цагаар';
            for (const item of this.switcher.children) {
                item.disabled = this.mutating;
                item.setAttribute('aria-pressed', String(item.dataset.period === this.period));
            }
            this.content.replaceChildren();
            this.content.setAttribute('aria-busy', String(this.busy));
            const message = (title, description) => {
                const box = element('section', 'lb-message');
                box.append(element('h2','',title), element('p','',description));
                this.content.append(box);
                return box;
            };
            if (!window.PQUsernameAccount || this.phase === 'offline') {
                const box = message('Онлайн тоглоомын онооны самбар', 'Өдрийн болон сарын оноогоо харахын тулд онлайн тоглоомд өөрийн бүртгэлээр нэвтэрнэ.');
                const link = element('a','lb-action','Онлайн самбарыг нээх');
                link.href = 'https://kodyn-nuudel.vercel.app/#leaderboard'; link.target = '_blank'; link.rel = 'noopener';
                box.append(link);
                return;
            }
            if (this.phase === 'loading') {
                this.content.append(element('p','lb-wait','Бүртгэлийг шалгаж байна…')); return;
            }
            if (!available) {
                const box = message('Онооны самбарыг нээх', 'Нэвтэрсний дараа сурагчдын оноог харж, хүсвэл өөрөө эрэмбэд оролцоно.');
                box.append(button('lb-action', this.phase === 'enroll' ? 'Аялагчаа үүсгэх' : 'Бүртгэлээр нэвтрэх', () => window.GameAccount.open()));
                return;
            }
            if (this.error) {
                const box = message('Дахин шалгах шаардлагатай', this.error);
                box.setAttribute('role','status');
                box.append(button('lb-action', 'Дахин шалгах', () => void this.load())); return;
            }
            if (!this.data) {
                const waiting = element('p','lb-wait', this.mutating ? 'Оролцоог шинэчилж байна…' : 'Оноог уншиж байна…');
                waiting.setAttribute('role','status');
                this.content.append(waiting); return;
            }
            const {joined, alias, rows, self} = this.data;
            const section = element('section','lb-panel');
            section.append(element('h2','', this.period === 'day' ? 'Өнөөдрийн тэргүүлэгчид' : 'Энэ сарын тэргүүлэгчид'));
            if (rows.length) {
                section.append(this.table(rows, periods[this.period] + ' · Тэргүүлэгчид'));
            } else {
                section.append(element('p','lb-empty','Энэ хугацаанд оноо авсан оролцогч хараахан алга.'));
            }
            if (joined && self && !rows.some(row => row.me)) {
                section.append(element('h3','lb-own-title','Миний байр'), this.table([self],'Миний байр'));
            }
            section.append(element('p','lb-rule','Шинээр давсан даалгавар, тулаан, хичээл, хүлэмжийн сорилоос XP нэмэгдэнэ. Ижил XP-тэй тоглогчид ижил байр эзэлнэ.'));
            const consent = element('section','lb-consent');
            const copy = element('div');
            copy.append(element('h2','', joined ? 'Самбар дахь миний хоч' : 'Миний оролцоо'));
            if (joined) {
                copy.append(element('strong','lb-alias',alias));
                if (!self) copy.append(element('p','','Энэ хугацаанд оноо авахад таны байр гарна.'));
            } else copy.append(element('p','','Оролцвол бусад тоглогч таныг автоматаар өгсөн хочоор харна. Хүссэн үедээ жагсаалтаас гарч болно.'));
            const toggle = button('lb-action lb-membership', joined ? 'Жагсаалтаас гарах' : 'Эрэмбэд оролцох', () => void this.load(!joined));
            toggle.disabled = this.busy;
            if (joined) toggle.classList.add('lb-secondary');
            consent.append(copy,toggle);
            this.content.append(section,consent);
        }
    }
    return Object.freeze({
        mount(root) { active?.leave(); active = new Board(root); active.accountChanged(); },
        leave() { active?.leave(); active = null; }
    });
})();
