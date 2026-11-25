/* The prediction quiz always refers to the original example. This editor runs a private copy. */
(() => {
    'use strict';
    const sessions = new WeakMap();
    const t = (mn, en) => globalThis.GameLocale?.lang === 'en' ? en : mn;
    let active;

    function node(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }
    function button(label, className, click) {
        const el = node('button',className,label);
        el.type = 'button';
        el.addEventListener('click',click);
        return el;
    }
    function normalized(value) {
        return value.normalize('NFC').trim().split(/\r?\n/)
            .map(line => line.trim().replace(/\s+/g,' '))
            .join('\n');
    }
    function runnerText(source) {
        if (!source || globalThis.GameLocale?.lang !== 'en') return source;
        const hints = {
            'Блок доторх мөрүүдийг ижил тооны зайгаар догол мөр болгоорой.':'Indent lines in the same block by the same amount.',
            'Энэ мөр болон өмнөх мөрийн хаалт, хашилт, хоёр цэгийг шалгаарай.':'Check the brackets, quotes and colons on this line and the line before it.',
            'Хувьсагчийн нэрийг анх утга оноосон мөртэй нь тулгаарай.':'Check the spelling against the line where you first assigned that name.',
            'Жагсаалтын эхний нүд 0. Сүүлийн нүдний дугаар нь уртаас нэгээр бага.':'List positions start at 0. The last index is one less than the length.',
            'Хайсан түлхүүр толь бичигт байгаа эсэхийг шалгаарай.':'Check whether that key exists in the dictionary.',
            'Энэ үйлдэлд өгсөн утгууд тоо, текст эсвэл жагсаалтын аль нь болохыг шалгаарай.':'Check which of these values are numbers, strings or lists.',
            'Хуваагчийн утга яагаад тэг болсныг шалгаарай.':'Check why the divisor became zero.',
            '«Гараас утга оруулах» хэсэгт энэ асуултын хариуг дараагийн мөрөнд бичээрэй.':'Enter another answer under Keyboard input, one per line.',
            'Гаралт хэт урт байна. Давталтын тоогоо багасгаарай.':'The output is too long. Try a smaller loop.'
        };
        return source.split('\n').map(line => {
            const numbered = /^(\d+)-р мөр · (.*)$/.exec(line);
            const body = numbered ? numbered[2] : line;
            const python = /^(EOFError|ValueError): (.+)$/.exec(body);
            const message = python && hints[python[2]] ? python[1]+': '+hints[python[2]]
                : hints[body] || GameLocale.text(body);
            return numbered ? 'Line '+numbered[1]+' · '+message : message;
        }).join('\n');
    }
    function pause() { active?.pause(); }
    function leave() { pause(); active = null; }

    function mount(host,{lesson,drafts,save,execute,stop,onOutput}) {
        leave();
        let running = false, generation = 0;
        const starter = lesson.example;
        const state = sessions.get(drafts) || {guess:'', stdin:''};
        sessions.set(drafts,state);
        const panel=node('section','ac-playground');
        const editor=node('div','ac-editor ac-play-editor');
        const file=node('div','ac-filebar');
        file.append(node('span','ac-filename','example.py'));
        const field=node('textarea','ac-code ac-play-code');
        field.value=drafts.predictExample ?? starter;
        field.maxLength=20000;
        field.spellcheck=false;
        field.setAttribute('autocapitalize','off');
        field.setAttribute('autocomplete','off');
        field.setAttribute('autocorrect','off');
        field.setAttribute('aria-label',t('Өөрчлөн турших Python жишээ','Editable Python example'));
        const reset=button(t('Анхны жишээ','Restore example'),'ac-file-button ac-play-reset',()=>{
            if(running || field.value===starter || !window.confirm(t('Өөрчилсөн кодоо анхны жишээгээр солих уу?','Replace your edited code with the original example?'))) return;
            field.value=starter;
            commit();
            status(t('Анхны жишээг сэргээв.','Original example restored.'));
            field.focus();
        });
        file.append(reset);

        const options=node('div','ac-play-options');
        const guessLabel=node('label','ac-label ac-play-guess');
        const guess=node('textarea','ac-play-forecast');
        guess.value=state.guess;
        guess.rows=2; guess.maxLength=4000;
        guessLabel.append(node('span','',t('Миний бодлоор юу хэвлэгдэх вэ? (заавал биш)','What do you think it will print? (optional)')),guess);
        const inputDetails=node('details','ac-play-stdin');
        const inputs=node('textarea','ac-play-inputs');
        inputs.rows=2;inputs.maxLength=4000;inputs.value=state.stdin;
        const inputLabel=node('label','ac-label');
        inputLabel.append(node('span','',t('input() бүрийн хариуг тусдаа мөрөнд бичээрэй.','Enter one answer per line for input().')),inputs);
        inputDetails.append(node('summary','',t('Гараас утга оруулах · input()','Keyboard input · input()')),inputLabel);
        if (state.stdin) inputDetails.open=true;
        options.append(guessLabel,inputDetails);
        const toolbar=node('div','ac-runbar');
        const run=button(t('▶ Ажиллуулах','▶ Run example'),'ac-run',start);
        const stopButton=button(t('■ Зогсоох','■ Stop'),'ac-stop',pauseRun);
        toolbar.append(node('small','ac-hotkey','Ctrl / ⌘ + Enter'),run,stopButton);
        const terminal=node('div','ac-terminal ac-play-terminal');
        const out=node('pre','ac-output');
        out.setAttribute('translate','no');
        const feedback=node('p','ac-feedback');
        feedback.setAttribute('role','status');
        terminal.append(node('span','ac-terminal-label',t('Python · Гаралт','Python · Output')),out,feedback);
        editor.append(file,field,options,toolbar,terminal);
        panel.append(editor);
        host.replaceChildren(panel);

        function status(message,tone='idle') {
            feedback.textContent=message;
            feedback.dataset.tone=tone;
        }
        function output(text) { out.textContent=text;out.hidden=!text; }
        function lock(value) {
            running=value;run.hidden=value;stopButton.hidden=!value;
            field.readOnly=inputs.readOnly=guess.readOnly=value;
            reset.disabled=value || field.value===starter;
        }
        function display(result) {
            output(result.out || '');
            if(result.type!=='pass') {
                status(runnerText(result.text),result.type);
            } else if(!result.out?.trim()) {
                status(t('Харагдах текст гарсангүй. Утгаа харахын тулд print() ашиглаарай.','No text was printed. Use print() to display a value.'));
            } else if(!guess.value.trim()) {
                const count=result.out.split('\n').length;
                status(t(count+' мөр хэвлэлээ.',count===1?'Printed one line.':'Printed '+count+' lines.'));
            } else if(normalized(guess.value)===normalized(result.out)) {
                status(t('Чиний таамаг хэвлэгдсэн утгатай таарлаа.','Your prediction matches the output.'),'pass');
            } else {
                status(t('Таамгаа гаралттай мөр мөрөөр нь харьцуулаарай.','Compare your prediction with the output, one line at a time.'));
            }
        }
        function changed() {
            delete state.result;
            onOutput?.(null);
            output('');
            status(t('Шинэ үр дүнг харахын тулд ажиллуулаарай.','Run the example to see your changes.'));
        }
        function commit() {
            if(field.value===starter) delete drafts.predictExample;
            else drafts.predictExample=field.value;
            reset.disabled=running || field.value===starter;
            changed();save();
        }
        function pauseRun() {
            if(!running) return;
            generation++;stop();lock(false);
            onOutput?.(null);
            status(t('Код зогслоо. Засаж дахин ажиллуулж болно.','Stopped. You can edit and run the example again.'));
        }
        const session={pause:pauseRun};
        active=session;
        function start() {
            if(running || active!==session) return;
            if(!field.value.trim()) {
                onOutput?.(null);
                status(t('Эхлээд Python кодоо бичээрэй.','Write some Python code first.'));
                field.focus();return;
            }
            delete state.result;
            onOutput?.(null);
            const ticket=++generation;
            const current=()=>active===session && generation===ticket;
            execute(field.value,{preview:true,replies:inputs},{
                lock:value=>{if(current())lock(value);},
                stdout:text=>{if(current())output(text);},
                show:result=>{
                    if(!current()) return;
                    if(result.type!=='idle') state.result={...result,code:field.value,stdin:inputs.value};
                    if(result.type==='pass') onOutput?.(result.out || '');
                    else if(result.type==='error') onOutput?.(null);
                    display(result);
                }
            });
        }
        field.addEventListener('input',commit);
        field.addEventListener('keydown',event=>{
            if(event.isComposing || event.key!=='Enter') return;
            if(event.ctrlKey||event.metaKey) {event.preventDefault();start();return;}
            if(running||event.shiftKey) return;
            const line=field.value.slice(0,field.selectionStart).split('\n').pop();
            const indent=line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');
            if(!indent || field.value.length+1+indent.length-(field.selectionEnd-field.selectionStart)>field.maxLength) return;
            event.preventDefault();
            field.setRangeText('\n'+indent,field.selectionStart,field.selectionEnd,'end');
            commit();
        });
        guess.addEventListener('input',()=>{
            state.guess=guess.value;
            if(state.result) display(state.result);
        });
        inputs.addEventListener('input',()=>{state.stdin=inputs.value;changed();});
        lock(false);
        if(state.result?.code===field.value && state.result.stdin===inputs.value) {
            display(state.result);
            onOutput?.(state.result.type==='pass' ? state.result.out || '' : null);
        }
        else {delete state.result;output('');status('');}
        return session;
    }
    globalThis.AcademyPlayground={mount,leave,pause};
})();
