window.PythonReference = (() => {
    'use strict';
    const tr = (mn, en) => window.GameLocale?.lang === 'en' ? en : mn;

    let active;

    function open(options = {}) {
        close();
        const {topics, search} = window.PythonReferenceData;
        const panel = document.createElement('dialog');
        panel.className = 'ref-dialog';
        panel.setAttribute('aria-labelledby', 'ref-title');
        panel.innerHTML = `<div class="ref-top">
            <h2 id="ref-title">${tr('Монгол Python лавлах', 'Python reference')}</h2>
            <button type="button" class="ref-return">${tr('Код руугаа буцах', 'Back to my code')}</button>
        </div>
        <div class="ref-layout">
            <section class="ref-library" aria-label="${tr('Лавлахаас хайх', 'Search the reference')}">
                <label class="ref-label" for="ref-search">${tr('Юу мэдмээр байна?', 'What would you like to know?')}</label>
                <div class="ref-search-box">
                    <input id="ref-search" class="ref-search" type="search" maxlength="240" autocomplete="off" placeholder="${tr('Яагаад 5 хэвлэгдэхгүй байна?', 'Why doesn’t range(1, 5) print 5?')}">
                    <button type="button" class="ref-clear" aria-label="${tr('Хайлтыг цэвэрлэх', 'Clear search')}" hidden>${tr('Арилгах', 'Clear')}</button>
                </div>
                <p class="ref-count" role="status"></p>
                <div class="ref-list" aria-label="${tr('Олдсон сэдвүүд', 'Matching topics')}" role="group"></div>
                <p class="ref-empty" hidden>${tr('«Давталт», «жагсаалт» эсвэл Python-ийн алдааны нэрээр хайж үзээрэй.', 'Try “loop”, “list” or a Python error such as IndexError.')}</p>
            </section>
            <section class="ref-topic" aria-labelledby="ref-topic-title" hidden>
                <div class="ref-topic-head"><h3 class="ref-topic-title" id="ref-topic-title"></h3>
                    <button type="button" class="ref-copy">${tr('Сэдвийн холбоос хуулах', 'Copy topic link')}</button>
                </div>
                <input class="ref-share-url" readonly aria-label="${tr('Хуулах сэдвийн холбоос', 'Topic link to copy')}" hidden>
                <p class="ref-explanation"></p>
                <div class="ref-editor">
                    <label for="ref-code" class="ref-file">${tr('Жишээг өөрчилж турших', 'Edit and run the example')}</label>
                    <textarea id="ref-code" class="ref-code" wrap="off" spellcheck="false" maxlength="16000" rows="5" autocomplete="off" autocapitalize="off"></textarea>
                    <div class="ref-actions">
                        <button type="button" class="ref-run" title="Ctrl + Enter">${tr('Ажиллуулах', 'Run')}</button>
                        <button type="button" class="ref-stop" hidden>${tr('Зогсоох', 'Stop')}</button>
                        <button type="button" class="ref-reset">${tr('Эх жишээг сэргээх', 'Restore example')}</button>
                    </div>
                </div>
                <p class="ref-try"></p>
                <div class="ref-outputs">
                    <div><h4>${tr('Эх жишээний гаралт', 'Original output')}</h4><pre class="ref-original"></pre></div>
                    <div><h4>${tr('Миний кодын гаралт', 'My output')}</h4><pre class="ref-output" role="status"></pre></div>
                </div>
            </section>
        </div>`;
        const get = name => panel.querySelector('.ref-' + name);
        const input = get('search'), list = get('list'), topicPane = get('topic');
        const field = get('code'), output = get('output');
        const run = get('run'), reset = get('reset'), stop = get('stop'), clear = get('clear');
        let topic, worker, timer;

        function stopWorker() {
            clearTimeout(timer);
            worker?.terminate();
            worker = null;
            run.disabled = false;
            stop.hidden = true;
            field.readOnly = false;
            reset.disabled = !topic || field.value === topic.code;
        }

        function finish(message, error = false) {
            stopWorker();
            output.textContent = message;
            output.classList.toggle('ref-error', error);
        }

        function execute() {
            if (!topic || worker) return;
            if (!field.value.trim()) { finish(tr('Эхлээд турших кодоо бичээрэй.', 'Write some code before running it.'), true); return; }
            const code = field.value;
            let current;
            try { current = new Worker('worker.js?v=reference1'); }
            catch { finish(tr('Python-ийг эхлүүлж чадсангүй. Дахин ажиллуулаарай.', 'Python could not start. Try running your code again.'), true); return; }
            worker = current;
            field.readOnly = run.disabled = reset.disabled = true;
            stop.hidden = false;
            output.classList.remove('ref-error');
            output.textContent = tr('Python ачаалж байна…', 'Loading Python…');
            const lines = [];
            timer = setTimeout(() => finish(tr('Python ачаалахад хугацаа хэтэрлээ. Дахин ажиллуулаарай.', 'Python took too long to load. Try again.'), true), 90000);
            current.onerror = () => {
                if (worker === current) finish(tr('Python ажиллах үед алдаа гарлаа. Дахин оролдоорой.', 'Python stopped unexpectedly. Try again.'), true);
            };
            current.onmessage = ({data}) => {
                if (worker !== current) return;
                if (data.type === 'ready') {
                    clearTimeout(timer);
                    timer = setTimeout(() => finish(tr('Код 5 секундэд дууссангүй. Давталтын төгсөх нөхцөлөө шалгаарай.', 'The code ran for five seconds. Check the condition that ends your loop.'), true), 5000);
                    output.textContent = tr('Ажиллаж байна…', 'Running…');
                    current.postMessage({code});
                } else if (data.type === 'stdout') {
                    lines.push(data.text);
                } else if (data.type === 'fatal' || data.type === 'result') {
                    if (data.error) lines.push(String(data.error).trimEnd());
                    finish(lines.length ? lines.join('\n') : tr('Код дууслаа. Хэвлэсэн гаралт алга.', 'Code finished with no printed output.'), !data.ok);
                }
            };
        }

        function select(next) {
            if (next?.id !== topic?.id) {
                stopWorker();
                topic = next;
                topicPane.hidden = !topic;
                if (topic) {
                    topicPane.dataset.topic = topic.id;
                    get('share-url').hidden = true;
                    get('copy').textContent = tr('Сэдвийн холбоос хуулах', 'Copy topic link');
                    get('topic-title').textContent = topic.question;
                    get('explanation').textContent = topic.explanation;
                    get('try').textContent = topic.tryThis;
                    get('original').textContent = topic.expected;
                    field.value = options.getDraft?.(topic.id) ?? topic.code;
                    finish(tr('Жишээг ажиллуулаад гаралтыг харьцуулаарай.', 'Run the example and compare the outputs.'));
                } else {
                    delete topicPane.dataset.topic;
                }
            }
            for (const button of list.children) {
                if (button.dataset.topic === topic?.id) button.setAttribute('aria-current', 'true');
                else button.removeAttribute('aria-current');
            }
        }

        function refresh(preferredId) {
            const query = input.value.trim();
            const found = query ? search(query) : topics;
            const buttons = found.map(item => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'ref-result';
                button.dataset.topic = item.id;
                const title = document.createElement('strong');
                title.textContent = item.title;
                const question = document.createElement('span');
                question.textContent = item.question;
                button.append(title, question);
                button.onclick = () => select(item);
                return button;
            });
            list.replaceChildren(...buttons);
            list.scrollTop = 0;
            clear.hidden = !input.value;
            get('count').textContent = found.length ? (query ? tr('Олдсон сэдэв · ', 'Matches · ') : tr('Бүх сэдэв · ', 'All topics · ')) + found.length : tr('Тохирох сэдэв олдсонгүй.', 'No matching topics.');
            get('empty').hidden = found.length > 0;
            select(found.find(item => item.id === preferredId) || found[0]);
        }

        function edited() {
            if (!topic) return;
            options.saveDraft?.(topic.id, field.value);
            reset.disabled = field.value === topic.code;
            output.classList.remove('ref-error');
            output.textContent = tr('Өөрчлөлтөө ажиллуулаад гаралтыг хараарай.', 'Run your changes to see the output.');
        }
        field.oninput = edited;
        field.onkeydown = event => {
            if (field.readOnly || event.isComposing) return;
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault(); execute(); return;
            }
            if (event.shiftKey || (event.key !== 'Tab' && event.key !== 'Enter')) return;
            event.preventDefault();
            const line = field.value.slice(0, field.selectionStart).split('\n').pop();
            const replacement = event.key === 'Tab' ? '    ' : '\n' + line.match(/^ */)[0] + (line.trimEnd().endsWith(':') ? '    ' : '');
            if (field.value.length - (field.selectionEnd - field.selectionStart) + replacement.length > field.maxLength) return;
            field.setRangeText(replacement, field.selectionStart, field.selectionEnd, 'end');
            field.dispatchEvent(new Event('input', {bubbles:true}));
        };
        reset.onclick = () => {
            if (!topic || !confirm(tr('Туршилтын өөрчлөлтөө арилгаад эх жишээг сэргээх үү?', 'Replace your edits with the original example?'))) return;
            field.value = topic.code;
            edited(); output.textContent = tr('Эх жишээг сэргээв.', 'Original example restored.'); field.focus();
        };
        run.onclick = execute;
        stop.onclick = () => finish(tr('Зогсоолоо. Кодоо засаад дахин ажиллуулж болно.', 'Stopped. Edit your code and run it again.'));
        get('copy').onclick = async () => {
            const id = topic.id;
            const url = new URL(location.protocol === 'file:' ? 'https://kodyn-nuudel.vercel.app/' : location.href);
            url.search = '';
            url.hash = 'reference/' + encodeURIComponent(id);
            try {
                await navigator.clipboard.writeText(url.href);
                if (panel.open && topic?.id === id) get('copy').textContent = tr('Холбоос хуулагдлаа', 'Link copied');
            } catch {
                if (!panel.open || topic?.id !== id) return;
                const share = get('share-url');
                share.value = url.href;
                share.hidden = false;
                share.focus();
                share.select();
                get('copy').textContent = tr('Ctrl + C дарж хуулаарай', 'Press Ctrl + C to copy');
            }
        };
        input.oninput = () => refresh();
        clear.onclick = () => { input.value = ''; refresh(); input.focus(); };
        input.onkeydown = event => {
            if (event.isComposing || !list.firstElementChild) return;
            if (event.key === 'ArrowDown') { event.preventDefault(); list.firstElementChild.focus(); }
            if (event.key === 'Enter') { event.preventDefault(); field.focus(); }
        };
        list.onkeydown = event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const next = event.key === 'ArrowDown' ? event.target.nextElementSibling : event.target.previousElementSibling || input;
                next?.focus();
            }
        };

        let disposed = false;
        function dismiss() {
            if (disposed) return;
            disposed = true;
            stopWorker();
            if (panel.open) panel.close();
            panel.remove();
            active = null;
            options.onClose?.();
        }
        panel.addEventListener('close', dismiss, {once:true});
        panel.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
        panel.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !event.isComposing) {
                event.preventDefault(); event.stopPropagation(); dismiss();
            }
        });
        const back = get('return');
        if (options.returnLabel) back.textContent = options.returnLabel;
        back.onclick = dismiss;
        input.value = options.query || '';
        refresh(options.topicId);
        active = dismiss;
        document.body.append(panel);
        panel.showModal();
        input.focus();
    }

    function close() { active?.(); }

    return {open, close};
})();
