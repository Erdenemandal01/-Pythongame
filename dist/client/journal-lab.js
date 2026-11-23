window.JournalLab = (() => {
    'use strict';
    const experiments = [
        'Мэндчилгээнд өөрийн нэрийг оруулбал юу хэвлэгдэх вэ?',
        'Хоёр мөрийн байрыг солиод захиагаа уншаарай.',
        'name-д өөр нэр өгөөд гаралтаа харьцуулаарай.',
        '12 + 8-ыг 12 * 8 болговол хэд болох вэ?',
        'Баатрын нэрийг солиход мэндчилгээний аль хэсэг өөрчлөгдөх вэ?',
        'Сүүлийн collect()-ийг хасаад зоосоо тоолоорой.',
        'Түлхүүрийн тоог 2, дараа нь 3 болгож хаалга хэзээ нээгдэхийг шалгаарай.',
        'energy-г 1 болговол баатар яах вэ?',
        'Нууц үгийн эхний үсгийг том болгоод туршаарай.',
        'Газрын зургаа False болго. Дараа нь and-ийг or болговол юу өөрчлөгдөх вэ?',
        'Оноог 49, 50, 80 болгож гурван медалийг олоорой.',
        'Зоосоо авахаас өмнө бас нэг алхвал юу болох вэ?',
        'Таван удаа «Алхам» хэвлэхийн тулд юуг өөрчлөх вэ?',
        '6 тоог бас хэвлэхийн тулд range-ийн төгсгөлийг сонгоорой.',
        '1-ээс 10 хүртэлх тооны нийлбэрийг олоорой.',
        'Тоолуурыг 5-аас эхлүүлбэл сүүлчийн хэвлэсэн тоо өөрчлөгдөх үү?',
        'Тэгш тооны оронд сондгой тоог хэвлээрэй.',
        'Давталтыг нэгээр цөөрүүлбэл хэдэн зоос үлдэх вэ?',
        'Цүнхэндээ дөрөв дэх эд зүйл нэмээд жагсаалтаа хэвлээрэй.',
        'Хоёр дахь эрдэнэсийг ямар индексээр авах вэ?',
        'Дахин нэг зүйл append() хийгээд уртыг нь таагаарай.',
        'upper()-ийг title() болгож хоёр үгийн эхний үсгийг ажиглаарай.',
        'Баатрын түвшинг нэгээр ахиулаад хэвлээрэй.',
        '10-тай тэнцүү утгыг хасахад нийлбэр яаж өөрчлөгдөх вэ?',
        'greet()-ийг хоёр удаа дуудвал хэдэн мөр хэвлэгдэх вэ?',
        'double()-д сөрөг тоо өгөөд үр дүнг таагаарай.',
        'Нэг оролтод нь сөрөг тоо өгч нийлбэрийг шалгаарай.',
        '6-гийн оронд 7 өгөхөд функц ямар утга буцаах вэ?',
        'Хоосон жагсаалт өгвөл нийт зоос хэд болох вэ?',
        'cross()-ийг хоёр удаа ажиллуулаад үлдсэн эрдэнэсийг тоолоорой.'
    ];
    let active;
    function open(mission, draft, save) {
        close();
        const dialog = document.createElement('dialog');
        dialog.className = 'jl-dialog';
        dialog.setAttribute('aria-labelledby', 'jl-title');
        dialog.innerHTML = `<div class="jl-head"><div><small>Мэдлэгийн дэвтэр</small><h2 id="jl-title"></h2></div>
            <form method="dialog"><button class="secondary" aria-label="Дэвтэрт буцах">Хаах ✕</button></form></div>
            <p class="jl-prompt"></p>
            <div class="jl-layout"><section class="jl-editor"><label for="jl-code">Миний туршилт <span>Python</span></label>
            <textarea id="jl-code" class="jl-code" spellcheck="false" maxlength="20000" wrap="off"></textarea>
            <div class="jl-actions"><button class="jl-run">▶ Ажиллуулах</button><button class="jl-stop secondary" hidden>Зогсоох</button>
            <button class="jl-reset secondary">Эх жишээг сэргээх</button></div></section>
            <section class="jl-results"><h3>Эх жишээний үр дүн</h3><pre class="jl-original"></pre>
            <h3>Миний кодын үр дүн</h3><pre class="jl-output" aria-live="polite">Кодоо ажиллуулаад энд харьцуулаарай.</pre></section></div>`;
        const get = selector => dialog.querySelector(selector);
        const field = get('textarea'), output = get('.jl-output'), run = get('.jl-run'), stop = get('.jl-stop'), reset = get('.jl-reset');
        get('#jl-title').textContent = mission.title;
        get('.jl-prompt').textContent = experiments[mission.id];
        get('.jl-original').textContent = mission.game
            ? `Байрлал ${mission.game.goal + 1} / ${mission.game.width} · Зоос ${mission.game.coins.length} / ${mission.game.coins.length}`
            : mission.expected;
        field.value = draft ?? mission.solution;
        let worker = null, timeout;
        function end() {
            clearTimeout(timeout);
            if (worker) worker.terminate();
            worker = null;
            field.readOnly = false; run.disabled = false; reset.disabled = false; stop.hidden = true;
        }
        function finish(message) { end(); output.textContent = message; }
        function execute() {
            if (worker) return;
            if (!field.value.trim()) return finish('Турших Python кодоо бичээрэй.');
            try {
                worker = new Worker('worker.js?v=journal-1');
                const currentWorker = worker, lines = [];
                field.readOnly = true; run.disabled = true; reset.disabled = true; stop.hidden = false;
                output.textContent = 'Python ачаалж байна…';
                timeout = setTimeout(() => finish('Python хугацаандаа ачаалсангүй. Дахин ажиллуулж үзээрэй.'), 90000);
                worker.onerror = () => { if (worker === currentWorker) finish('Python ажиллаж чадсангүй. Дахин туршаарай.'); };
                worker.onmessage = ({data}) => {
                    if (worker !== currentWorker) return;
                    if (data.type === 'ready') {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => finish('Таван секунд өнгөрлөө. Давталтын нөхцөлөө шалгаарай.'), 5000);
                        output.textContent = 'Ажиллаж байна…';
                        worker.postMessage({code:field.value, game:mission.game});
                    } else if (data.type === 'stdout') lines.push(data.text);
                    else if (data.type === 'result' || data.type === 'fatal') {
                        if (mission.game && data.trace) {
                            const last = data.trace.at(-1);
                            const pos = last?.pos ?? mission.game.start;
                            const coins = (last?.coins ?? mission.game.coins).length;
                            lines.push(`Байрлал ${pos + 1} / ${mission.game.width} · Зоос ${mission.game.coins.length-coins} / ${mission.game.coins.length}`);
                        }
                        if (data.error && data.kind !== 'test') lines.push(data.error);
                        finish(lines.join('\n') || 'Код дууслаа. Хэвлэсэн гаралт алга.');
                    }
                };
            } catch (error) { finish(error.message); }
        }
        field.oninput = () => save(field.value);
        field.onkeydown = event => {
            if (field.readOnly || event.isComposing) return;
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); execute(); return; }
            if (event.key === 'Tab' && !event.shiftKey || event.key === 'Enter' && !event.shiftKey) {
                const line = field.value.slice(0,field.selectionStart).split('\n').pop();
                const insert = event.key === 'Tab' ? '    ' : '\n'+line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');
                event.preventDefault();
                if (field.value.length - (field.selectionEnd-field.selectionStart) + insert.length > field.maxLength) return;
                field.setRangeText(insert,field.selectionStart,field.selectionEnd,'end');
                field.dispatchEvent(new Event('input',{bubbles:true}));
            }
        };
        stop.onclick = () => finish('Зогсоолоо. Кодоо өөрчлөөд дахин туршаарай.');
        reset.onclick = () => {
            if (field.value !== mission.solution && !confirm('Энэ туршилтын кодыг эх жишээгээр солих уу?')) return;
            field.value = mission.solution; save(field.value); output.textContent = 'Эх жишээг сэргээв.'; field.focus();
        };
        run.onclick = execute;
        dialog.addEventListener('close', () => { end(); dialog.remove(); if (active === dialog) active = null; }, {once:true});
        document.body.append(dialog); active = dialog; dialog.showModal(); field.focus();
    }
    function close() { if (active?.open) active.close(); }
    return {open, close};
})();
