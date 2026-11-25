(() => {
    'use strict';

    const tasks = [
        {
            id: 'kite', title: 'Цаасан шувуу', skill: 'Нөхцөл ба заагийн утга',
            instructions: 'Талын салхи хэдэн м/с байгааг wind, бороо орж байгаа эсэхийг raining заана. Бороотой эсвэл салхи 8 м/с-ээс хүчтэй бол "хураа", салхи 3 м/с-ээс сул бол "хүлээ", бусад үед "нисгэ" гэж буцаагаарай.',
            example: 'kite(5, False) → "нисгэ"',
            hint: 'Шиврээ бороотой үед салхи сул байсан ч шувуугаа хураана. Яг 3, яг 8 дээр аль нөхцөл үнэн болохыг шалгаарай.',
            starter: 'def kite(wind, raining):\n    pass',
            checks: [
                ['kite', [1, false], 'хүлээ'], ['kite', [3, false], 'нисгэ'],
                ['kite', [8, false], 'нисгэ'], ['kite', [9, false], 'хураа'], ['kite', [2, true], 'хураа']
            ]
        },
        {
            id: 'stones', title: 'Голын чулуун зам', skill: 'Жагсаалт ба давталт',
            instructions: 'Голыг гатлах чулуунууд дарааллаараа байрлана. depths жагсаалтын тоо бүр тухайн чулууны дээрх усны гүн. 5 см буюу түүнээс бага бол гишгэж болно. Эхний гүн чулуутай таарах хүртэл дараалан гишгэж болох чулууны тоог буцаагаарай.',
            example: 'crossable([1, 3, 7, 2]) → 2',
            hint: 'Гүн чулуу гармагц зам дуусна. Түүний цаадах намхан чулууг тоондоо оруулсан эсэхээ шалгаарай.',
            starter: 'def crossable(depths):\n    pass',
            checks: [
                ['crossable', [[]], 0], ['crossable', [[8, 2]], 0], ['crossable', [[0, 5, 3]], 3],
                ['crossable', [[4, 2, 6, 1, 0]], 2], ['crossable', [[5, 6, 5]], 1]
            ]
        },
        {
            id: 'post', title: 'Шуудангийн уут', skill: 'Хоёр функц хамт ажиллах нь',
            instructions: 'Нэг илгээмжийн жин бүхэл, эерэг тоо. 1–3 кг хүртэл 4 зоос, 3 кг-аас илүү кг бүрд 2 зоос нэмж төлнө. postage(weight) нэг илгээмжийн үнийг, mailbag(weights) жагсаалтад буй бүх илгээмжийн нийт үнийг буцаана. Нийт дүнг бодохдоо эхний функцээ дуудаж болно. Хоосон уут 0 зоос.',
            example: 'postage(5) → 8  ·  mailbag([3, 5]) → 12',
            hint: 'Эхлээд postage(3), postage(4) хоёрын ялгааг шалгаарай. Дараа нь илгээмж бүрийн тусдаа үнийг нэмж үзээрэй.',
            starter: 'def postage(weight):\n    pass\n\ndef mailbag(weights):\n    pass',
            checks: [
                ['postage', [1], 4], ['postage', [3], 4], ['postage', [4], 6], ['postage', [9], 16],
                ['mailbag', [[]], 0], ['mailbag', [[1, 4, 2]], 14], ['mailbag', [[3, 5, 8]], 26]
            ]
        }
    ];
    const maxCode = 16000;
    function readSave(raw) {
        const records = {};
        for (const {id} of tasks) {
            const record = raw?.records?.[id];
            if (!record || typeof record !== 'object') continue;
            records[id] = {passed: record.passed === true};
            if (typeof record.code === 'string') records[id].code = record.code.slice(0, maxCode);
        }
        const selected = tasks.some(task => task.id === raw?.selected) ? raw.selected : tasks[0].id;
        return {selected, records};
    }
    function request(check, code) {
        const [fn, args, expected] = check;
        return window.WeeklyPython.caseRequest({fn, cases: [[args, expected]]}, code, 0);
    }
    function literal(value) {
        if (value === true) return 'True';
        if (value === false) return 'False';
        if (Array.isArray(value)) return '[' + value.map(literal).join(', ') + ']';
        return JSON.stringify(value);
    }
    function element(tag, cls, content) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (content !== undefined) node.textContent = content;
        return node;
    }
    function button(cls, text, action) {
        const node = element('button', cls, text);
        node.type = 'button';
        node.onclick = action;
        return node;
    }

    class Exam {
        constructor(root, ctx) {
            this.root = root;
            this.ctx = ctx;
            this.render();
        }
        stop() {
            clearTimeout(this.timer);
            this.worker?.terminate();
            this.worker = null;
        }
        record() {
            return this.ctx.getSave().records[this.task.id] ??= {passed: false};
        }
        updateProgress() {
            const {records} = this.ctx.getSave();
            const count = tasks.filter(task => records[task.id]?.passed).length;
            this.count.textContent = count + ' / ' + tasks.length + ' бодлого давсан';
            this.complete.hidden = count !== tasks.length;
            for (const tab of this.tabs.children) {
                const task = tasks.find(item => item.id === tab.dataset.task);
                tab.textContent = (records[task.id]?.passed ? '✓ ' : '') + task.title;
            }
        }
        render() {
            this.stop();
            const save = this.ctx.getSave();
            const task = this.task = tasks.find(item => item.id === save.selected) || tasks[0];
            const section = element('section', 'ce-shell');
            section.append(element('h1', '', 'Python төгсгөлийн сорил'),
                element('p', 'ce-intro', 'Гурван бодлогоор сурсан зүйлээ шалгаарай. Аль ч бодлогоос эхэлж, кодоо засаад дахин шалгаж болно.'));
            this.count = element('strong', 'ce-count');
            this.complete = element('p', 'ce-complete', '✓ Төгсгөлийн сорилыг давлаа. Гурван бодлогод бүх шалгалтыг давсан шийдэл бичсэн байна.');
            this.complete.setAttribute('role', 'status');
            this.tabs = element('div', 'ce-tabs');
            this.tabs.setAttribute('role', 'group');
            this.tabs.setAttribute('aria-label', 'Сорилын бодлогууд');
            for (const item of tasks) {
                const tab = button('ce-task', item.title, () => {
                    if (task.id === item.id) return;
                    this.ctx.getSave().selected = item.id;
                    this.ctx.save();
                    this.render();
                    this.tabs.querySelector('[aria-pressed="true"]').focus();
                });
                tab.dataset.task = item.id;
                tab.setAttribute('aria-pressed', String(task.id === item.id));
                this.tabs.append(tab);
            }
            section.append(this.count, this.tabs, this.complete);
            const layout = element('div', 'ce-layout');
            const brief = element('article', 'ce-brief');
            brief.append(element('h2', '', task.title), element('p', 'ce-skill', task.skill),
                element('p', '', task.instructions), element('h3', '', 'Жишээ'), element('code', 'ce-example',
                    task.id === 'kite' ? 'kite(5, False) → '+literal(WeeklyPython.displayExpected('kite','нисгэ')) : task.example));
            const editor = element('section', 'ce-editor');
            const label = element('label', 'ce-file', task.id + '.py');
            label.htmlFor = 'ce-code';
            this.field = element('textarea', 'ce-code');
            this.field.id = 'ce-code';
            this.field.maxLength = maxCode;
            this.field.spellcheck = false;
            this.field.wrap = 'off';
            this.field.value = save.records[task.id]?.code ?? task.starter;
            this.field.oninput = () => {
                this.record().code = this.field.value;
                this.ctx.save();
                this.clearResults();
            };
            this.field.onkeydown = event => {
                if (event.isComposing || this.field.readOnly) return;
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    this.run();
                    return;
                }
                if (event.shiftKey || (event.key !== 'Tab' && event.key !== 'Enter')) return;
                const field = this.field;
                const line = field.value.slice(0, field.selectionStart).split('\n').pop();
                const indent = line.match(/^ */)[0] + (line.trimEnd().endsWith(':') ? '    ' : '');
                const replacement = event.key === 'Tab' ? '    ' : '\n' + indent;
                event.preventDefault();
                if (field.value.length + replacement.length - (field.selectionEnd - field.selectionStart) > maxCode) return;
                field.setRangeText(replacement, field.selectionStart, field.selectionEnd, 'end');
                field.dispatchEvent(new Event('input', {bubbles: true}));
            };
            this.runBtn = button('ce-run', 'Кодоо шалгах', () => this.run());
            this.stopBtn = button('ce-stop', 'Зогсоох', () => this.finish('Шалгалтыг зогсоолоо.'));
            const controls = element('div', 'ce-controls');
            controls.append(this.runBtn, this.stopBtn);
            editor.append(label, this.field, controls);
            layout.append(brief, editor);
            section.append(layout);
            const checks = element('section', 'ce-checks');
            checks.append(element('h3', '', 'Оролт бүрийн үр дүн'));
            this.rows = task.checks.map(([fn, args, expected]) => {
                const row = element('div', 'ce-row');
                const result = element('span', 'ce-result');
                row.append(element('code', '', fn + '(' + args.map(literal).join(', ') + ')'),
                    element('span', 'ce-expected', 'Хүлээх утга · ' + literal(WeeklyPython.displayExpected(fn,expected))), result);
                checks.append(row);
                return result;
            });
            this.status = element('p', 'ce-status');
            this.status.setAttribute('role', 'status');
            section.append(checks, this.status);
            this.root.replaceChildren(section);
            this.setRunning(false);
            this.clearResults();
            this.updateProgress();
        }
        clearResults() {
            this.status.textContent = '';
            for (const row of this.rows) {
                row.textContent = 'Хүлээж байна';
                delete row.dataset.result;
            }
        }
        setRunning(value) {
            this.field.readOnly = value;
            this.runBtn.disabled = value;
            this.stopBtn.hidden = !value;
        }
        finish(message) {
            this.stop();
            this.setRunning(false);
            this.status.textContent = message;
        }
        run() {
            if (this.worker) return;
            const code = this.field.value, task = this.task;
            this.clearResults();
            if (!code.trim()) return this.finish('Эхлээд шийдлээ бичээрэй.');
            let worker;
            try { worker = this.worker = new Worker('worker.js?v=exam1'); }
            catch { return this.finish('Python хөдөлгүүр нээгдсэнгүй. Дахин шалгаарай.'); }
            let index = 0, passed = 0;
            const send = () => {
                clearTimeout(this.timer);
                this.rows[index].textContent = 'Шалгаж байна…';
                this.timer = setTimeout(() => {
                    this.rows[index].textContent = 'Хугацаа хэтэрлээ';
                    this.rows[index].dataset.result = 'error';
                    this.finish('Код хугацаандаа дууссангүй. Давталтын төгсөх нөхцөлийг шалгаарай.');
                }, 6000);
                worker.postMessage(request(task.checks[index], code));
            };
            this.setRunning(true);
            this.status.textContent = 'Python ачаалж байна…';
            this.timer = setTimeout(() => this.finish('Хөдөлгүүр ачаалахад хугацаа хэтэрлээ. Дахин оролдоорой.'), 90000);
            worker.onerror = () => { if (worker === this.worker) this.finish('Python ажиллаж чадсангүй. Дахин оролдоорой.'); };
            worker.onmessage = ({data}) => {
                if (worker !== this.worker) return;
                if (data.type === 'fatal') return this.finish(data.error);
                if (data.type === 'ready') {
                    this.status.textContent = 'Таны функцийг ажиллуулж байна…';
                    send();
                    return;
                }
                if (data.type !== 'result') return;
                const row = this.rows[index];
                row.dataset.result = data.ok ? 'pass' : 'error';
                row.textContent = data.ok ? '✓ Зөв' : data.error || 'Буцаасан утга зөрлөө';
                if (!data.ok && data.kind !== 'test') return this.finish('Алдаа гарсан мөрөө засаад дахин шалгаарай.');
                if (data.ok) passed++;
                if (++index < task.checks.length) return send();
                if (passed === index) {
                    this.record().passed = true;
                    this.record().code = code;
                    this.ctx.save();
                    this.updateProgress();
                    this.finish('Бүх ' + index + ' оролтод зөв хариуллаа.');
                } else {
                    this.finish(globalThis.GameLocale?.lang === 'en' ?
                        passed + ' / ' + index + ' cases passed. ' + globalThis.GameLocale.text(task.hint) :
                        passed + ' / ' + index + ' оролт зөв. ' + task.hint);
                }
            };
        }
    }
    let active;
    window.CourseExam = {
        tasks, readSave, request,
        mount(root, ctx) { active?.stop(); active = new Exam(root, ctx); },
        leave() { active?.stop(); active = null; }
    };
})();
