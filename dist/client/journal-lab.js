window.JournalLab = (() => {
    'use strict';
    const tr = (mn, en) => window.GameLocale?.lang === 'en' ? en : mn;
    const experiments = window.GameLocale?.lang === 'en' ? [
        "Add your name to the greeting. What gets printed?",
        "Swap the two lines, then read the letter again.",
        "Give name a different value and compare the output.",
        "What happens if you replace 12 + 8 with 12 * 8?",
        "Change the hero’s name. Which part of the greeting changes?",
        "Remove the last collect() call and count the coins you picked up.",
        "Try 2 keys and then 3. When does the door open?",
        "Set energy to 1. What will the hero do?",
        "Capitalize the first letter in the password and test it.",
        "Set has_map to False. Now change and to or. What happens?",
        "Try scores of 49, 50 and 80 to find all three medals.",
        "What happens if you move one more step before collecting the coin?",
        "What needs to change to print five steps?",
        "Change the stop value so the loop also prints 6.",
        "Find the sum of the numbers from 1 through 10.",
        "Start your countdown at 5. Will the last number change?",
        "Print the odd numbers instead of the even ones.",
        "Run the loop one fewer time and count the coins left.",
        "Add a fourth item to the backpack and print every item.",
        "Which index gives you the second gem?",
        "Append one more item and predict the new length.",
        "Replace upper() with title() and look at the first letter in each word.",
        "Raise the hero’s level by one and print it.",
        "If you exclude the value 10, how does the sum change?",
        "Call greet() twice. How many lines appear?",
        "Give double() a negative number and predict the result.",
        "Try a negative number as one input and check the sum.",
        "Pass 7 instead of 6. What does the function return?",
        "How many coins do you get when the list is empty?",
        "Call cross() twice. How many gems are still on the map?"
    ] : [
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
        dialog.innerHTML = `<div class="jl-head"><div><small>${tr('Мэдлэгийн дэвтэр', 'Python notebook')}</small><h2 id="jl-title"></h2></div>
            <form method="dialog"><button class="secondary" aria-label="${tr('Дэвтэрт буцах', 'Back to notebook')}">${tr('Хаах ✕', 'Close ✕')}</button></form></div>
            <p class="jl-prompt"></p>
            <div class="jl-layout"><section class="jl-editor"><label for="jl-code">${tr('Миний туршилт', 'My experiment')} <span>Python</span></label>
            <textarea id="jl-code" class="jl-code" spellcheck="false" maxlength="20000" wrap="off"></textarea>
            <div class="jl-actions"><button class="jl-run">${tr('▶ Ажиллуулах', '▶ Run')}</button><button class="jl-stop secondary" hidden>${tr('Зогсоох', 'Stop')}</button>
            <button class="jl-reset secondary">${tr('Эх жишээг сэргээх', 'Restore example')}</button></div></section>
            <section class="jl-results"><h3>${tr('Эх жишээний үр дүн', 'Original output')}</h3><pre class="jl-original"></pre>
            <h3>${tr('Миний кодын үр дүн', 'My output')}</h3><pre class="jl-output" aria-live="polite">${tr('Кодоо ажиллуулаад энд харьцуулаарай.', 'Run your code to compare the results.')}</pre></section></div>`;
        const get = selector => dialog.querySelector(selector);
        const field = get('textarea'), output = get('.jl-output'), run = get('.jl-run'), stop = get('.jl-stop'), reset = get('.jl-reset');
        get('#jl-title').textContent = mission.title;
        get('.jl-prompt').textContent = experiments[mission.id];
        get('.jl-original').textContent = mission.game
            ? `${tr('Байрлал', 'Position')} ${mission.game.goal + 1} / ${mission.game.width} · ${tr('Зоос', 'Coins')} ${mission.game.coins.length} / ${mission.game.coins.length}`
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
            if (!field.value.trim()) return finish(tr('Турших Python кодоо бичээрэй.', 'Enter some Python code to try.'));
            try {
                worker = new Worker('worker.js?v=journal-1');
                const currentWorker = worker, lines = [];
                field.readOnly = true; run.disabled = true; reset.disabled = true; stop.hidden = false;
                output.textContent = tr('Python ачаалж байна…', 'Loading Python…');
                timeout = setTimeout(() => finish(tr('Python хугацаандаа ачаалсангүй. Дахин ажиллуулж үзээрэй.', 'Python took too long to load. Try again.')), 90000);
                worker.onerror = () => { if (worker === currentWorker) finish(tr('Python ажиллаж чадсангүй. Дахин туршаарай.', 'Python could not start. Try again.')); };
                worker.onmessage = ({data}) => {
                    if (worker !== currentWorker) return;
                    if (data.type === 'ready') {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => finish(tr('Таван секунд өнгөрлөө. Давталтын нөхцөлөө шалгаарай.', 'The code ran for five seconds. Check the condition that ends your loop.')), 5000);
                        output.textContent = tr('Ажиллаж байна…', 'Running…');
                        worker.postMessage({code:field.value, game:mission.game});
                    } else if (data.type === 'stdout') lines.push(data.text);
                    else if (data.type === 'result' || data.type === 'fatal') {
                        if (mission.game && data.trace) {
                            const last = data.trace.at(-1);
                            const pos = last?.pos ?? mission.game.start;
                            const coins = (last?.coins ?? mission.game.coins).length;
                            lines.push(`${tr('Байрлал', 'Position')} ${pos + 1} / ${mission.game.width} · ${tr('Зоос', 'Coins')} ${mission.game.coins.length-coins} / ${mission.game.coins.length}`);
                        }
                        if (data.error && data.kind !== 'test') lines.push(data.error);
                        finish(lines.join('\n') || tr('Код дууслаа. Хэвлэсэн гаралт алга.', 'Code finished with no printed output.'));
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
        stop.onclick = () => finish(tr('Зогсоолоо. Кодоо өөрчлөөд дахин туршаарай.', 'Stopped. Edit your code and try again.'));
        reset.onclick = () => {
            if (field.value !== mission.solution && !confirm(tr('Энэ туршилтын кодыг эх жишээгээр солих уу?', 'Replace the code in this experiment with the original example?'))) return;
            field.value = mission.solution; save(field.value); output.textContent = tr('Эх жишээг сэргээв.', 'Original example restored.'); field.focus();
        };
        run.onclick = execute;
        dialog.addEventListener('close', () => { end(); dialog.remove(); if (active === dialog) active = null; }, {once:true});
        document.body.append(dialog); active = dialog; dialog.showModal(); field.focus();
    }
    function close() { if (active?.open) active.close(); }
    return {open, close};
})();
