/* Classroom studio: lesson navigation, editable work, execution and milestones. */
(() => {
    'use strict';

    let active;

    function node(tag, className, text) {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (text !== undefined) item.textContent = text;
        return item;
    }

    function button(text, className, action) {
        const control = node('button', className, text);
        control.type = 'button';
        control.addEventListener('click', action);
        return control;
    }

    function option(value, title) {
        const entry = node('option', '', title);
        entry.value = value;
        return entry;
    }

    function wrappedLabel(title, control) {
        const label = node('label', 'ac-label');
        label.append(node('span', '', title), control);
        return label;
    }

    function details(title, text) {
        const panel = node('details', 'ac-hint');
        panel.append(node('summary', '', title), node('p', 'ac-prose', text));
        return panel;
    }

    function initialRecord() {
        return {answer:-1, choice:0, passed:[], drafts:{}, extension:'', reflection:''};
    }

    function grades(record, lesson) {
        return [
            record.answer === lesson.answer,
            record.passed.includes('lab'),
            record.passed.includes('p' + record.choice),
            record.passed.includes('debug'),
            Boolean(record.extension.trim()) && (!lesson.capstone || record.passed.includes('experiment'+record.choice)),
            Boolean(record.reflection.trim())
        ];
    }

    function saveFile(name, contents) {
        const value = URL.createObjectURL(new Blob([contents], {type:'text/plain;charset=utf-8'}));
        const link = document.createElement('a');
        link.href = value;
        link.download = name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(value), 1000);
    }

    function lanternStreet() {
        const locations=['Гүүр','Зах','Цэцэрлэг','Тайз','Булаг','Асар'];
        const panel=node('section','ac-lantern-street');
        const count=node('select','ac-select');
        for (const n of [3,5,6]) count.append(option(String(n),n+' дэнлүү'));
        count.value='5';
        const row=node('div','ac-lantern-row'), caption=node('small','ac-lantern-caption');
        caption.setAttribute('role','status');
        const names=()=>locations.slice(0,Number(count.value));
        function draw(lights) {
            const places=names(), hasResult=lights?.length===places.length;
            row.replaceChildren(...places.map((place,i)=>{
                const lamp=node('span','ac-lamp'+(hasResult&&lights[i]?' is-lit':''));
                lamp.append(node('i','ac-bulb'),node('span','',place));
                lamp.setAttribute('aria-label',place+(hasResult?(lights[i]?' ассан':' унтарсан'):''));
                return lamp;
            }));
            caption.textContent=hasResult?lights.filter(Boolean).length+' / '+places.length+' дэнлүү аслаа.':'Кодоо ажиллуулаад гудамжаа хараарай.';
        }
        count.onchange=()=>draw();
        panel.append(wrappedLabel('Баярын гудамж',count),row,caption);
        draw();
        return {panel,names,draw,count};
    }

    class Studio {
        constructor(root, adapter) {
            this.root = root;
            this.adapter = adapter;
            this.save = adapter.getSave();
            this.index = Math.min(Math.max(this.save.selected || 0, 0), ACADEMY.length - 1);
            this.runs = new Map();
            this.openLesson(this.index, false);
        }

        store() { this.adapter.save(); }
        get lesson() { return ACADEMY[this.index]; }
        get record() { return this.save.lessons[this.index]; }
        get completed() { return this.save.won.includes(this.index); }

        openLesson(index, focusTitle = true) {
            this.cancel();
            this.index = index;
            this.chapter = academyChapter(index);
            this.phases = this.chapter.timing;
            this.save.selected = index;
            this.save.lessons[index] ??= initialRecord();
            const progress = grades(this.record, this.lesson);
            const next = progress.indexOf(false);
            this.phase = this.record.phase ?? (this.completed ? 0 : next === -1 ? 5 : next);
            this.store();
            this.build();
            if (focusTitle) {
                this.heading.focus({preventScroll:true});
                this.heading.scrollIntoView({block:'start', behavior:'auto'});
            }
        }

        cancel() {
            this.generation = (this.generation || 0) + 1;
            clearTimeout(this.timeout);
            this.worker?.terminate();
            this.worker = null;
            this.ready = false;
            this.running = false;
        }

        build() {
            const section = node('section', 'ac-studio');
            this.root.replaceChildren(section);
            const tools = node('div', 'ac-toolbar');
            tools.append(
                node('strong', 'ac-studio-name','Python урлан'),
                button('Бүтээлийн тайз', 'ac-link', () => this.adapter.openMaker()),
                button('Бүтээлээ татах', 'ac-link', () => this.adapter.exportPortfolio()),
                button('Бүтээлээ сэргээх', 'ac-link', () => this.adapter.importPortfolio())
            );
            section.append(tools);
            const chapter = this.chapter;
            const banner = node('div', 'ac-banner');
            banner.style.setProperty('--ac-landscape', 'url("art/' + chapter.scene + '")');
            const copy = node('div', 'ac-banner-copy');
            copy.append(node('span', 'ac-chapter', chapter.title));
            this.heading = node('h1', 'ac-title', this.lesson.title);
            this.heading.tabIndex = -1;
            const meta = node('div', 'ac-meta');
            meta.append(
                node('span', '', 'Хичээл ' + (this.index + 1) + ' / ' + ACADEMY.length),
                node('span', '', chapter.minutes + ' минут')
            );
            this.count = node('span', 'ac-count');
            meta.append(this.count);
            copy.append(this.heading, meta);
            banner.append(copy);
            section.append(banner, this.catalogue());

            this.nav = node('nav', 'ac-phases');
            this.nav.setAttribute('aria-label', 'Хичээлийн алхмууд');
            this.steps = this.phases.map(([label, minutes], index) => {
                const step = button('', 'ac-step', () => this.selectPhase(index));
                step.append(node('span', 'ac-step-mark'), node('span', 'ac-step-name', label), node('small', '', minutes + ' мин'));
                this.nav.append(step);
                return step;
            });
            this.stage = node('section', 'ac-stage');
            this.stage.setAttribute('aria-label','Сонгосон алхам');
            section.append(this.nav, this.stage);
            this.renderStage();
        }

        catalogue() {
            const drawer = node('details', 'ac-library');
            drawer.append(node('summary', '', 'Бүлэг, хичээл сонгох'));
            const overview = node('div', 'ac-course-overview');
            CourseOverview.mount(overview);
            drawer.append(overview);
            const picker = node('div');
            CourseCatalog.mount(picker, {won:this.save.won, selected:this.index, openLesson:i => this.openLesson(i), compact:true});
            drawer.append(picker);
            return drawer;
        }

        selectPhase(next) {
            this.cancel();
            this.phase = next;
            this.record.phase = next;
            this.store();
            this.renderStage();
            this.phaseTitle.focus({preventScroll:true});
            this.nav.scrollIntoView({block:'start',behavior:'auto'});
        }

        refreshProgress() {
            const finished = grades(this.record, this.lesson);
            this.count.textContent = this.save.won.length + ' хичээл дуусгасан';
            this.steps.forEach((step, index) => {
                step.classList.toggle('is-done', finished[index]);
                step.firstElementChild.textContent = finished[index] ? '✓' : String(index + 1);
                if (index === this.phase) step.setAttribute('aria-current','step');
                else step.removeAttribute('aria-current');
                step.setAttribute('aria-label',this.phases[index][0] + ', ' + this.phases[index][1] + ' минут' + (finished[index] ? ', биелсэн' : ''));
            });
            if (this.finishButton) {
                this.finishButton.disabled = this.completed || !finished.every(Boolean);
                this.finishButton.textContent = this.completed ? '✓ Хичээл дууссан' : 'Хичээлээ дуусгах';
            }
            if (this.pending) {
                const missing = this.phases.flatMap((item, i) => finished[i] ? [] : [item[0]]);
                this.pending.textContent = this.completed ? 'Энэ хичээлийг дуусгасан. Бүтээлээ дахин засаж болно.' :
                    missing.length ? 'Үлдсэн алхам: ' + missing.join(', ') : 'Бүх алхам биеллээ. Хичээлээ дуусгаж ахицаа бүртгээрэй.';
            }
        }

        renderStage() {
            this.finishButton = null;
            this.pending = null;
            this.stage.replaceChildren();
            this.phaseTitle = node('h2', 'ac-phase-title', this.phases[this.phase][0]);
            this.phaseTitle.tabIndex = -1;
            this.stage.append(this.phaseTitle);
            switch (this.phase) {
                case 0: this.prediction(); break;
                case 1: this.codingTask('lab', this.lesson.lab); break;
                case 2: this.projects(); break;
                case 3: this.codingTask('debug', this.lesson.debug); break;
                case 4: this.experiment(); break;
                case 5: this.reflection(); break;
            }
            if (this.phase < 5) {
                const next = this.phase + 1;
                this.stage.append(button('Үргэлжлүүлэх · ' + this.phases[next][0], 'ac-forward', () => this.selectPhase(next)));
            }
            this.refreshProgress();
        }

        prediction() {
            const m = this.lesson;
            const split = node('div','ac-predict');
            const study = node('div','ac-study');
            study.append(node('p','ac-prose',m.intro),node('pre','ac-example',m.example));
            const exercise = node('div','ac-quiz');
            const options = node('div','ac-options');
            const feedback = node('p','ac-quiz-feedback');
            feedback.setAttribute('role','status');
            const update = () => {
                const answer = this.record.answer;
                Array.from(options.children).forEach((b,i) => {
                    b.setAttribute('aria-pressed', String(answer === i));
                    b.classList.toggle('is-correct', answer === i && i === m.answer);
                    b.classList.toggle('is-wrong', answer === i && i !== m.answer);
                });
                feedback.textContent = answer < 0 ? '' : answer === m.answer ? '✓ ' + m.why : 'Дахин оролдоорой. Кодыг мөр мөрөөр нь уншаад утга хэрхэн өөрчлөгдөхийг дагаарай.';
                feedback.classList.toggle('is-correct',answer === m.answer);
            };
            m.options.forEach((text, i) => options.append(button(text,'ac-option',() => {
                this.record.answer = i;
                this.store();
                update();
                this.refreshProgress();
            })));
            update();
            exercise.append(node('h3','',m.question),options,feedback);
            split.append(study,exercise);
            this.stage.append(split);
        }

        projects() {
            const select = node('div','ac-projects');
            select.setAttribute('aria-label','Хоёр төслөөс нэгийг сонго');
            this.lesson.projects.forEach((project,i) => {
                const choice = button('', 'ac-project', () => {
                    if (i === this.record.choice) return;
                    this.cancel();
                    this.record.choice = i;
                    this.store();
                    this.renderStage();
                    this.stage.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
                });
                choice.setAttribute('aria-pressed', String(this.record.choice === i));
                choice.append(node('small','',this.record.choice === i ? 'СОНГОСОН ТӨСӨЛ' : 'СОНГОХ ТӨСӨЛ'), node('b','',project.title));
                select.append(choice);
            });
            this.stage.append(select);
            this.codingTask('p' + this.record.choice, this.lesson.projects[this.record.choice]);
        }

        codingTask(key, task) {
            const grid = node('div', 'ac-workbench');
            const brief = node('div','ac-brief');
            brief.append(node('h3','',task.title),node('p','ac-prose',task.brief));
            if (task.workshop) {
                const link = node('a', 'ac-link', Workshops.describe(task.workshop)[0] + ' урланд турших');
                link.href = '#' + task.workshop;
                brief.append(link);
            }
            if (task.hint) brief.append(details('Санаа авах',task.hint));
            if (this.phase !== 0) brief.append(details('Хичээлийн жишээ', this.lesson.example));
            grid.append(brief, this.editor(key, task));
            this.stage.append(grid);
        }

        experiment() {
            const grid = node('div','ac-workbench');
            const brief = node('div','ac-brief');
            const {choice,drafts}=this.record;
            const capstone=this.lesson.capstone;
            const game=capstone?.games[choice];
            const key=game?'experiment'+choice:'experiment';
            const project=this.lesson.projects[choice];
            let code=drafts['p'+choice] ?? project.starter;
            let stdin=this.record.inputData || '';
            brief.append(node('h3','',game?project.title:'Өөр утгаар турших'),node('p','ac-prose',this.lesson.stretch));
            if (game) {
                const previous=capstone.carryPrevious?this.save.lessons[this.index-1]:null;
                const inherited=previous?.drafts[key];
                const ownMechanic=this.record.passed.includes('p'+choice) && typeof game.withProject==='function';
                code=inherited ?? (ownMechanic ? game.withProject(code) : game.code);
                stdin=this.record.gameInputs?.[key] ?? previous?.gameInputs?.[key] ?? game.stdin;
                if (inherited!=null && drafts[key]==null) brief.append(node('p','ac-prose','Өмнөх хичээлд бичсэн тоглоомоо эндээс үргэлжлүүлээрэй.'));
            }
            const inputs=node('details','ac-hint');
            inputs.open=Boolean(game);
            inputs.append(node('summary','','Гараас утга оруулах · input()'),
                node('p','ac-prose','Турших утга бүрээ тусдаа мөрөнд бичээрэй. Кодын input() дуудлага бүр дараагийн мөрийг уншина.'));
            const replies=node('textarea','ac-reply-input');
            replies.rows=3;
            replies.maxLength=4000;
            replies.value=stdin;
            replies.placeholder='агуй';
            replies.oninput=()=>{
                if (game) {
                    (this.record.gameInputs??={})[key]=replies.value;
                    this.record.passed=this.record.passed.filter(p=>p!==key);
                    this.runs.delete(this.index+'/'+key);
                    this.refreshProgress();
                } else this.record.inputData=replies.value;
                this.store();
            };
            inputs.append(wrappedLabel('Туршилтын хариултууд',replies));
            if (!game) inputs.append(node('pre','ac-example','path = input("Агуй эсвэл ой? ")\nif path == "агуй":\n    print("Луу сэрлээ!")\nelse:\n    print("Ойд эрдэнэ оллоо!")'));
            brief.append(inputs);
            if (!game) brief.append(button('Бүтээлийн тайз нээх','ac-link',()=>this.adapter.openMaker()));
            grid.append(brief, this.editor(key, {starter:code, check:'', replies}));
            this.stage.append(grid, this.notes('extension','Юуг өөрчилсөн бэ? Ямар үр дүн гарав?'));
        }

        notes(key, title) {
            const input = node('textarea','ac-note-input');
            input.rows = 3;
            input.maxLength = 4000;
            input.value = this.record[key];
            input.oninput = () => {
                this.record[key] = input.value;
                this.store();
                this.refreshProgress();
            };
            const label = wrappedLabel(title,input);
            label.classList.add('ac-notes');
            return label;
        }

        reflection() {
            this.stage.append(this.notes('reflection',this.lesson.reflect));
            this.pending = node('p','ac-pending');
            this.pending.setAttribute('role','status');
            this.finishButton = button('Хичээлээ дуусгах','ac-primary', () => {
                if (this.completed || !grades(this.record,this.lesson).every(Boolean)) return;
                this.adapter.reward(this.index);
                this.renderStage();
                const lib = this.root.querySelector('.ac-library');
                lib.replaceWith(this.catalogue());
            });
            const actions = node('div','ac-finish-actions');
            actions.append(this.finishButton, button('Бүтээлээ татах','ac-link',()=>this.adapter.exportPortfolio()));
            if (this.completed && this.index < ACADEMY.length - 1)
                actions.append(button('Дараагийн хичээл','ac-forward',()=>this.openLesson(this.index+1)));
            this.stage.append(this.pending,actions);
        }

        editor(key, task) {
            const box = node('div','ac-editor');
            const street=task.scene==='lanterns'?lanternStreet():null;
            const file = node('div','ac-filebar');
            const fname = 'lesson-' + String(this.index+1).padStart(2,'0') + '-' + key + '.py';
            file.append(node('span','ac-filename',fname));
            const input = node('textarea','ac-code');
            input.setAttribute('aria-label','Урлангийн Python код');
            input.spellcheck = false;
            input.setAttribute('autocapitalize','off');
            input.setAttribute('autocomplete','off');
            input.setAttribute('autocorrect','off');
            input.maxLength = 20000;
            input.value = this.record.drafts[key] ?? task.starter;
            const cacheKey = this.index + '/' + key;
            const commit = () => {
                this.record.drafts[key] = input.value;
                this.record.passed = this.record.passed.filter(p => p !== key);
                this.runs.delete(cacheKey);
                show({type:'idle',text:'Код өөрчлөгдлөө. Шинэ үр дүнг харахын тулд ажиллуулаарай.'});
                this.store();
                this.refreshProgress();
            };
            input.addEventListener('input',commit);
            const reset = button('Загварыг сэргээх','ac-file-button', () => {
                if (this.running || input.value === task.starter || !confirm('Энэ алхмын кодыг эхний загварт нь буцаах уу?')) return;
                input.value = task.starter;
                commit();
                show({type:'idle', text:'Кодын загварыг сэргээв.'});
                input.focus();
            });
            file.append(button('.py татах','ac-file-button',()=>saveFile(fname,input.value)),reset);
            const toolbar = node('div','ac-runbar');
            const run = button('▶ Ажиллуулах','ac-run', () => this.execute(input.value, key, task, callbacks));
            const stop = button('■ Зогсоох','ac-stop', () => {
                this.cancel();
                lock(false);
                show({type:'idle', text:'Код зогслоо. Засаж дахин ажиллуулж болно.'});
            });
            stop.hidden = true;
            toolbar.append(node('small','ac-hotkey','Ctrl / ⌘ + Enter'),run,stop);
            const terminal = node('div','ac-terminal');
            terminal.append(node('span','ac-terminal-label','PYTHON · ГАРАЛТ'));
            const output = node('pre','ac-output');
            const message = node('p','ac-feedback');
            message.setAttribute('aria-live','polite');
            const show = result => {
                output.textContent = result.out || '';
                output.hidden = !result.out;
                message.textContent = result.text;
                message.dataset.tone = result.type;
                street?.draw(result.lanterns);
            };
            const lock = active => {
                input.readOnly = active;
                if (task.replies) task.replies.readOnly=active;
                if (street) street.count.disabled=active;
                run.hidden = active;
                stop.hidden = !active;
                reset.disabled = active;
            };
            const callbacks = {show,lock,street,stdout: text => {
                output.textContent = text;
                output.hidden = false;
            }};
            if(this.runs.has(cacheKey)) show(this.runs.get(cacheKey));
            else if(this.record.passed.includes(key)) show({type:'pass',text:'✓ Энэ алхмын шалгалтыг давсан.'});
            else show({type:'idle',text:'Кодоо ажиллуулахад үр дүн энд гарна.'});
            input.onkeydown = e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {e.preventDefault(); run.click(); return;}
                if (this.running || e.isComposing) return;
                if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault(); input.setRangeText('    ',input.selectionStart,input.selectionEnd,'end'); commit();
                } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const last = input.value.slice(0,input.selectionStart).split('\n').pop();
                    const indent = last.match(/^ */)[0] + (last.trimEnd().endsWith(':')?'    ':'');
                    input.setRangeText('\n'+indent,input.selectionStart,input.selectionEnd,'end');
                    commit();
                }
            };
            terminal.append(output,message);
            box.append(file,input,toolbar,terminal);
            if (street) box.prepend(street.panel);
            return box;
        }

        execute(code, key, task, ui) {
            if (this.running) return;
            if (!code.trim()) {ui.show({type:'error',text:'Эхлээд Python кодоо бичээрэй.'});return;}
            this.running = true;
            ui.lock(true);
            ui.show({type:'idle', text:this.ready ? 'Код ажиллаж байна…' : 'Python хөдөлгүүр ачаалж байна…'});
            const generation = this.generation;
            const current = () => active === this && this.generation === generation;
            const lines = [];
            let length = 0;
            const fail = error => {
                if (!current()) return;
                this.cancel();
                ui.lock(false);
                ui.show({type:'error',text:error,out:lines.join('\n')});
            };
            const send = () => {
                clearTimeout(this.timeout);
                this.timeout = setTimeout(()=>fail('Код 5 секундээс удаан ажиллалаа. Давталтын төгсөх нөхцөлийг шалгаарай.'),5000);
                this.worker.postMessage({code,academy:{check:task.check,sandbox:Boolean(task.replies),
                    ...(ui.street ? {lanterns:ui.street.names()} : {}),
                    ...(task.replies ? {stdin:task.replies.value} : {})}});
            };
            try {
                if (!this.worker) this.worker = new Worker('worker.js?v=academy-8');
                this.worker.onerror = e => fail('Python эхэлж чадсангүй. ' + (e.message || 'Хуудсаа шинэчлээд дахин оролдоорой.'));
                this.worker.onmessage = ({data}) => {
                    if (!current()) return;
                    if (data.type === 'ready') {this.ready = true; send(); return;}
                    if (data.type === 'fatal') {fail(data.error);return;}
                    if (data.type === 'stdout') {
                        const line = String(data.text);
                        if (length < 20000) {lines.push(line.slice(0,20000-length)); length += line.length+1; ui.stdout(lines.join('\n'));}
                        return;
                    }
                    if (data.type !== 'result') return;
                    clearTimeout(this.timeout);
                    this.running = false;
                    ui.lock(false);
                    const experiment = Boolean(task.replies);
                    if (data.ok && (!experiment || this.lesson.capstone)) {
                        if (!this.record.passed.includes(key)) this.record.passed.push(key);
                        this.record.drafts[key] = code;
                        if (experiment) (this.record.gameInputs??={})[key]=task.replies.value;
                        this.store();
                    }
                    const result = {
                        type:data.ok ? 'pass' : 'error',
                        lanterns:data.lanterns,
                        text:data.ok ? (experiment ? '✓ Туршилт ажиллалаа. Ажиглалтаа доор тэмдэглээрэй.' : '✓ Шалгалт давлаа. Энэ алхам биелсэн.') : data.error || 'Даалгаврын нөхцөлийг дахин шалгаарай.',
                        out:lines.join('\n')
                    };
                    this.runs.set(this.index + '/' + key, result);
                    ui.show(result);
                    this.refreshProgress();
                };
                if (this.ready) send();
                else this.timeout = setTimeout(()=>fail('Python ачаалах хугацаа дууслаа. Дахин ажиллуулна уу.'),90000);
            } catch (error) {fail('Python ажиллаж чадсангүй. ' + error.message);}
        }
    }

    function leave() {
        active?.cancel();
        active = null;
    }
    window.AcademyUI = {
        mount(root, adapter) { leave(); active = new Studio(root,adapter); },
        leave
    };
})();
