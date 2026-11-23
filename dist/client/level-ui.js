(() => {
    'use strict';
    const starter = '# Эхний өндгөө авъя. Дараагийн өндөг хаана байна вэ?\nmove("right")\ncollect()\nsaved = eggs()\nprint(saved)';
    const freshCode = '# Газрын зургаа харж эхний нүүдлээ бичээрэй.\nprint(eggs())';
    const tasks = [
        ['Давталттай зам', 'Нэг нь нүүдэл бүрээ тусдаа мөрөөр бич. Нөгөө нь давтагдсан хэсгийг for ашиглан бич. Зам нэг нүдээр уртасвал аль мөрийг засах вэ?'],
        ['Лууг тойрох', 'Нэг нь аюулгүй замаа харж төлөвлө. Нөгөө нь ahead() ашиглан дараагийн нүдээ шалга. Луу эсвэл хадны байрлал солигдвол юу болохыг ярилцаарай.'],
        ['Дараагийн мөр', 'Жолооч кодоо мөрөөр тоглуулна. Хамтрагч нь товч дарахаас өмнө баатрын байрлал, өндөгний тоог таамаглана. Дараа нь үүргээ солиорой.']
    ];
    const signature = map => JSON.stringify([map.title, ...map.rows]);
    const copyMap = map => ({title:map.title, rows:[...map.rows]});
    function levelWork(source) {
        const map=source.map?copyMap(source.map):LevelBoard.defaultMap();
        const firstCode=signature(map)===signature(LevelBoard.defaultMap())?starter:freshCode;
        return {map,code:source.code??firstCode,peerCode:source.peerCode??freshCode,
            verified:source.verified||'',pairTask:source.pairTask??0,pairNotes:source.pairNotes||''};
    }
    const node = (tag, cls, value) => {
        const item = document.createElement(tag);
        if (cls) item.className = cls;
        if (value !== undefined) item.textContent = value;
        return item;
    };
    function button(title, cls, action) {
        const control = node('button',cls,title);
        control.type = 'button';
        control.onclick = action;
        return control;
    }
    function label(title, control) {
        const wrapper=node('label','lv-label');
        wrapper.append(node('span','',title),control);
        return wrapper;
    }
    function initial(map) {
        const remaining=[];
        let x=0,y=0;
        map.rows.forEach((row,iy)=>Array.from(row).forEach((c,ix)=>{
            if(c==='E')remaining.push([ix,iy]);
            if(c==='S'){x=ix;y=iy;}
        }));
        return {line:0,x,y,held:0,remaining,locals:{},event:''};
    }
    let active;

    class Studio {
        constructor(root, adapter) {
            this.root=root;
            this.adapter=adapter;
            this.data=adapter.getSave();
            Object.assign(this.data,levelWork(this.data));
            this.slot='code';
            this.traces={};
            this.position=-1;
            this.mode=['play','edit','pair'].includes(adapter.startMode)?adapter.startMode:'play';
            this.render();
        }
        save() { this.adapter.save(); }
        stopWorker() {
            clearTimeout(this.timeout);
            this.worker?.terminate();
            this.worker=null;
            this.busy=false;
        }
        pause() {
            clearInterval(this.timer);
            this.timer=null;
        }
        leave() {
            this.pause();
            this.stopWorker();
            this.editor?.destroy?.();
            this.editor=null;
        }
        open(mode) {
            this.leave();
            this.extraMessage='';
            this.mode=mode;
            this.adapter.onMode?.(mode);
            if(mode!=='pair' && this.slot!=='code'){this.slot='code';this.position=-1;}
            this.render();
        }
        render() {
            this.refs={};
            const page=node('div','lv-shell');
            const head=node('div','lv-page-head'), intro=node('div');
            intro.append(node('h1','','Миний түвшин'),node('p','','Лууг сэрээлгүй өндгүүдийг цуглуулаад агуйд хүрээрэй.'));
            if(this.data.other||this.data.visiting)intro.append(node('strong','lv-owner',this.data.visiting?'Найзын түвшин':'Өөрийн түвшин'));
            head.append(intro);
            const modes=node('nav','lv-mode-bar');
            modes.setAttribute('aria-label','Түвшний горим');
            for(const [key,name] of [['play','Тоглох'],['edit','Түвшин зохиох'],['pair','Хосын сорил']]){
                const tab=button(name,'lv-mode lv-mode-'+key,()=>{if(this.mode!==key)this.open(key);});
                tab.setAttribute('aria-pressed',String(key===this.mode));
                modes.append(tab);
            }
            head.append(modes);
            page.append(head);
            this.root.replaceChildren(page);
            if(this.mode==='edit') this.buildEditor(page);
            else {
                if(this.mode==='pair')this.buildPair(page);
                this.buildPlay(page);
                if(this.mode==='pair')this.buildComparison(page);
            }
            this.buildExchange(page);
            this.refresh();
        }
        buildEditor(page) {
            const card=node('section','lv-panel lv-designer');
            card.append(node('h2','','Газрын зургаа зохио'));
            const host=node('div','lv-design-host');
            const tools=node('div','lv-design-actions');
            tools.append(button('Кодоороо турших','lv-primary lv-test-map',()=>this.open('play')));
            if(this.adapter.openDragon)
                tools.append(button('Энэ талбайд луугаа сургах','lv-quiet',()=>this.adapter.openDragon()));
            this.refs.validity=node('span','lv-hint');
            this.refs.validity.setAttribute('aria-live','polite');
            tools.append(this.refs.validity);
            card.append(host,tools);page.append(card);
            this.editor=LevelBoard.createEditor(host,copyMap(this.data.map),map=>{
                if(signature(map)===signature(this.data.map))return;
                this.data.map=copyMap(map);
                this.data.verified='';
                this.traces={};this.position=-1;
                this.save();this.refresh();
            });
        }
        buildPair(page) {
            const card=node('section','lv-pair-card');
            const copy=node('div');
            copy.append(node('h2','','Баасан гарагийн хосын сорил'));
            const prompt=node('p','lv-pair-prompt');
            const choice=node('select','lv-pair-task');
            tasks.forEach(([title],i)=>{
                const option=node('option','',title);
                option.value=String(i);choice.append(option);
            });
            choice.value=String(this.data.pairTask);
            const change=()=>{prompt.textContent=tasks[Number(choice.value)][1];};
            choice.onchange=()=>{this.data.pairTask=Number(choice.value);change();this.save();};
            change();copy.append(prompt);
            card.append(copy,label('Сорил сонгох',choice));page.append(card);
        }
        buildPlay(page) {
            const workspace=node('div','lv-workspace');
            const mapCard=node('section','lv-panel lv-map-card');
            const mapHead=node('div','lv-panel-head');
            mapHead.append(node('h2','lv-map-title',this.data.map.title||'Нэргүй түвшин'));
            this.refs.eggCount=node('b','lv-egg');
            mapHead.append(this.refs.eggCount);
            this.refs.board=node('div','lv-stage');
            const display=node('div','lv-board-footer');
            this.refs.at=node('span','lv-at');
            this.refs.turn=node('span','lv-turn');
            this.refs.finish=button('Төгсгөлийг харах','lv-text lv-last',()=>{
                const result=this.traces[this.slot];
                if(!result?.frames.length)return;
                this.pause();this.position=result.frames.length-2;this.advance('step');
            });
            display.append(this.refs.at,this.refs.turn,this.refs.finish);
            mapCard.append(mapHead,this.refs.board,display);
            const editor=node('section','lv-panel lv-code-card');
            const file=node('div','lv-panel-head lv-file-head');
            file.append(node('strong','lv-file','rescue.py'));
            if(this.mode==='pair'){
                const slots=node('div','lv-slots');
                for(const [key,title] of [['code','Миний код'],['peerCode','Найзын код']]){
                    const b=button(title,'lv-slot '+(key==='code'?'lv-slot-own':'lv-slot-peer'),()=>{
                        if(this.slot===key)return;
                        this.leave();this.slot=key;this.position=-1;this.render();
                    });
                    b.setAttribute('aria-pressed',String(this.slot===key));
                    slots.append(b);
                }
                file.append(slots);
            }
            file.append(button('.py татах','lv-text lv-download-code',()=>{
                const blob=new Blob([this.data[this.slot]],{type:'text/plain;charset=utf-8'});
                const url=URL.createObjectURL(blob),a=document.createElement('a');
                a.href=url;a.download=this.slot==='code'?'rescue.py':'partner.py';a.click();
                setTimeout(()=>URL.revokeObjectURL(url),3000);
            }));
            const field=node('div','lv-code-field');
            const gutter=node('div','lv-gutter');
            gutter.setAttribute('aria-hidden','true');
            this.refs.numbers=node('div','lv-numbers');gutter.append(this.refs.numbers);
            const pane=node('div','lv-code-pane');
            this.refs.highlight=node('div','lv-highlight');
            this.refs.highlight.setAttribute('aria-hidden','true');
            const input=node('textarea','lv-code');
            input.value=this.data[this.slot];
            input.maxLength=16000;
            input.wrap='off';input.spellcheck=false;
            input.setAttribute('aria-label',this.slot==='code'?'Миний Python код':'Найзын Python код');
            input.setAttribute('autocapitalize','off');input.setAttribute('autocorrect','off');
            input.oninput=()=>{
                this.pause();this.stopWorker();delete this.traces[this.slot];
                this.data[this.slot]=input.value;this.position=-1;this.extraMessage='';
                this.save();this.numberLines();this.refresh();
            };
            input.onscroll=()=>this.alignCode();
            input.onkeydown=event=>{
                if(event.key==='Enter' && (event.ctrlKey||event.metaKey)){event.preventDefault();this.run('auto');}
                else if(event.key==='Tab' && !event.shiftKey){
                    event.preventDefault();input.setRangeText('    ',input.selectionStart,input.selectionEnd,'end');input.oninput();
                }
            };
            this.refs.input=input;
            pane.append(this.refs.highlight,input);field.append(gutter,pane);
            const actions=node('div','lv-controls');
            this.refs.step=button('Нэг алхам','lv-primary lv-step',()=>this.run('step'));
            this.refs.play=button('Тоглуулах','lv-quiet lv-play',()=>{
                if(this.busy){this.stopWorker();this.extraMessage='Кодыг зогсоолоо. Засаж дахин ажиллуулж болно.';this.refresh();}
                else if(this.timer){this.pause();this.refresh();}
                else this.run('auto');
            });
            this.refs.rewind=button('Эхлэлд буцах','lv-text lv-rewind',()=>{this.pause();this.position=-1;this.refresh(true);});
            actions.append(this.refs.step,this.refs.play,this.refs.rewind);
            editor.append(file,field,actions);
            workspace.append(mapCard,editor);page.append(workspace);
            const metrics=node('section','lv-panel lv-debugger');
            const state=node('div','lv-runtime');
            this.refs.status=node('p','lv-status');
            this.refs.status.setAttribute('role','status');
            this.refs.event=node('p','lv-event');
            state.append(this.refs.status,this.refs.event);
            const values=node('div','lv-values');
            values.append(node('h3','','Хувьсагчид'));
            this.refs.variables=node('div','lv-variables');values.append(this.refs.variables);
            metrics.append(state,values);
            const consoleBox=node('div','lv-console-box');
            consoleBox.append(node('h3','','Python гаралт'));
            this.refs.output=node('pre','lv-output');consoleBox.append(this.refs.output);
            metrics.append(consoleBox);page.append(metrics);
            this.numberLines();
            this.buildCommands(page);
        }
        buildCommands(page) {
            const help=node('details','lv-details lv-command-guide');
            help.append(node('summary','','Команд ба эхлэх санаа'));
            const commands=node('dl','lv-command-list');
            for(const [line,description] of [
                ['move("right")','Нэг нүд алхана. Чиглэл нь right (баруун), left (зүүн), up (дээш), down (доош).'],
                ['collect()','Баатрын байгаа нүдний өндгийг авна.'],
                ['eggs()','Авсан өндөгний тоог буцаана.'],
                ['ahead("right")','Зэргэлдээ нүдний төрлийг хэлнэ. Хариу нь path, egg, cave, rock, dragon эсвэл edge.']
            ])commands.append(node('dt','',line),node('dd','',description));
            help.append(commands,node('p','lv-hint','Эхлээд нэг нүүдлээ турш. Адилхан нүүдлүүдийг for давталтад оруулж, хэрэгтэй нүдэндээ collect() дуудаарай.'));
            page.append(help);
        }
        buildComparison(page) {
            const card=node('section','lv-panel lv-compare');
            card.append(node('h2','','Хоёр шийдлээ харьцуулъя'));
            this.refs.comparison=node('div','lv-results');
            const notes=node('textarea','lv-notes');
            notes.rows=2;notes.maxLength=2000;notes.value=this.data.pairNotes||'';
            notes.placeholder='Бидний хоёр кодын ялгаа…';
            notes.oninput=()=>{this.data.pairNotes=notes.value;this.save();};
            card.append(this.refs.comparison,label('Юуг өөрөөр шийдэв? Яаж шалгав?',notes));
            page.append(card);
        }
        compare() {
            if(!this.refs.comparison)return;
            const rows=[];
            for(const [key,title] of [['code','Миний код'],['peerCode','Найзын код']]){
                const result=this.traces[key],summary=node('div','lv-score');
                const n=(this.data[key]||'').split('\n').filter(l=>l.trim()&&!l.trim().startsWith('#')).length;
                summary.append(node('b','',title),node('span','',n+' мөр код'));
                const last=result?.frames.at(-1);
                const verdict=!result?'Ажиллуулаагүй':result.won?'Агуйд хүрсэн':result.ok?'Зорилго дутуу':'Код зогссон';
                summary.append(node('span','',result?result.frames.length+' алхам · '+(last?.held||0)+' өндөг':'—'),node('strong','',verdict));
                rows.push(summary);
            }
            this.refs.comparison.replaceChildren(...rows);
        }
        loadWork(next,parked,visiting) {
            this.leave();
            Object.assign(this.data,levelWork(next),{other:parked,visiting});
            this.slot='code';this.traces={};this.position=-1;this.extraMessage='';
            this.save();this.open('play');
        }
        switchWork() {
            if(!this.data.other)return;
            const parked=levelWork(this.data);
            this.loadWork(this.data.other,parked,!this.data.visiting);
        }
        visit(map) {
            const guest=this.data.visiting?this.data:this.data.other;
            if(guest?.map && signature(guest.map)===signature(map)){
                if(!this.data.visiting)this.switchWork();
                this.adapter.notify('Найзын түвшин нээгдлээ. Өмнөх кодоо үргэлжлүүлээрэй.');
                return;
            }
            if(guest && !confirm('Найзын «'+(guest.map?.title||'Нэргүй түвшин')+'» зураг, түүн дээр бичсэн код, тэмдэглэлийг «'+map.title+'» түвшнээр солих уу? Өөрийн түвшин тусдаа хадгалагдана.'))return;
            const home=this.data.visiting?this.data.other:levelWork(this.data);
            this.loadWork({map,code:freshCode,peerCode:freshCode},home,true);
            this.adapter.notify('Найзын түвшин нээгдлээ.');
        }
        buildExchange(page) {
            const card=node('section','lv-exchange');
            const title=node('div');
            title.append(node('h2','','Найзтайгаа түвшин солилцох'));
            this.refs.exportHint=node('p','lv-hint');title.append(this.refs.exportHint);
            const actions=node('div','lv-exchange-actions');
            if(this.data.other){
                const title=this.data.visiting?'Өөрийн түвшинд буцах':'Найзын түвшнийг үргэлжлүүлэх';
                actions.append(button(title,'lv-quiet lv-switch-level',()=>this.switchWork()));
            }
            this.refs.export=button('Түвшнээ татах','lv-quiet lv-export',()=>this.export());
            const file=node('input','lv-import-file');
            file.type='file';file.accept='.json,application/json';file.hidden=true;
            file.setAttribute('aria-label','Найзын түвшний JSON файл');
            file.onchange=async()=>{
                const chosen=file.files[0];
                file.value='';
                if(!chosen)return;
                try{
                    if(chosen.size>65536)throw Error('64 КБ хүртэлх түвшний файл сонгоорой.');
                    const map=LevelBoard.decode(await chosen.text());
                    if(active!==this)return;
                    this.visit(map);
                }catch(e){if(active===this)this.adapter.notify(e.message||'Түвшний файлыг уншиж чадсангүй.');}
            };
            actions.append(this.refs.export,button('Файлаас нээх','lv-quiet lv-import',()=>file.click()),file);
            card.append(title,actions);page.append(card);
        }
        export() {
            try{
                const map=LevelBoard.validate(this.data.map);
                if(this.data.verified!==signature(this.data.map))return;
                const blob=new Blob([LevelBoard.encode(map)],{type:'application/json;charset=utf-8'});
                const url=URL.createObjectURL(blob),link=document.createElement('a');
                link.href=url;link.download='python-quest-'+(map.title.replace(/[^\p{L}\p{N}-]+/gu,'_').slice(0,60)||'level')+'.json';
                link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
                this.adapter.notify('Түвшний файлаа найздаа өгч тоглуулаарай.');
            }catch(e){this.adapter.notify(e.message);}
        }
        numberLines() {
            const input=this.refs.input;
            if(!input)return;
            const count=input.value.split('\n').length;
            this.refs.numbers.textContent=Array.from({length:count},(_,i)=>String(i+1)).join('\n');
            this.alignCode();
        }
        alignCode() {
            const input=this.refs.input;
            if(!input)return;
            this.refs.numbers.style.transform='translateY('+(-input.scrollTop)+'px)';
            const f=this.traces[this.slot]?.frames[this.position];
            this.refs.highlight.hidden=!f?.line;
            if(!f?.line)return;
            this.refs.highlight.style.top=(12+(f.line-1)*24-input.scrollTop)+'px';
        }
        run(how) {
            if(this.busy)return;
            this.pause();this.extraMessage='';
            const result=this.traces[this.slot];
            if(result){
                if(this.position>=result.frames.length-1)this.position=-1;
                this.advance(how);return;
            }
            let map;
            try{map=LevelBoard.validate(this.data.map);}
            catch(e){this.extraMessage=e.message;this.refresh();return;}
            const code=this.data[this.slot]||'';
            if(!code.trim()){this.extraMessage='Python кодоо бичээд эхний алхмаа туршаарай.';this.refresh();return;}
            this.busy=true;this.refresh();
            const fail=message=>{this.stopWorker();this.extraMessage=message;this.refresh();};
            try{
                const worker=new Worker('worker.js?v=5');this.worker=worker;
                this.timeout=setTimeout(()=>fail('Python ачаалах хугацаа дууслаа. Дахин оролдоорой.'),90000);
                worker.onerror=e=>{if(this.worker===worker)fail('Python зогслоо. '+(e.message||'Дахин ажиллуулаарай.'));};
                worker.onmessage=({data})=>{
                    if(this.worker!==worker || active!==this)return;
                    if(data.type==='ready'){
                        clearTimeout(this.timeout);
                        this.timeout=setTimeout(()=>fail('Код удаан ажиллалаа. Давталтын төгсөх нөхцөлийг шалгаарай.'),5000);
                        worker.postMessage({code,level:map});return;
                    }
                    if(data.type==='fatal'){fail(data.error);return;}
                    if(data.type!=='result')return;
                    this.stopWorker();
                    const frames=Array.isArray(data.frames)?data.frames:[];
                    this.traces[this.slot]={...data,frames};
                    this.position=-1;
                    this.advance(how);
                };
            }catch(e){fail('Python ажиллаж чадсангүй. '+e.message);}
        }
        advance(how) {
            const result=this.traces[this.slot];
            const next=()=>{
                const end=result.frames.length-1;
                this.position=Math.min(end,this.position+1);
                if(this.position===end){
                    this.pause();
                    if(result.won&&this.slot==='code'){
                        this.data.verified=signature(this.data.map);this.save();
                    }
                }
                this.refresh(true);
            };
            if(how==='auto'&&this.position+1<result.frames.length-1)this.timer=setInterval(next,420);
            next();
        }
        refresh(follow=false) {
            const refs=this.refs;
            const result=this.traces[this.slot];
            const frame=result?.frames[this.position];
            const last=result&&this.position===result.frames.length-1;
            let valid,problem='';
            try{valid=LevelBoard.validate(this.data.map);}catch(e){problem=e.message;}
            const verified=valid&&this.data.verified===signature(this.data.map);
            refs.export.disabled=!verified;
            refs.exportHint.textContent=verified?'✓ Өөрийн кодоор давсан. Файлд газрын зураг орно.':'Өөрийн кодоор бүх өндгийг аваад агуйд хүрвэл зураг татах боломж нээгдэнэ.';
            if(refs.validity){refs.validity.textContent=problem||'Зураг дээрх өндөг, агуйд хүрэх зам байна.';return;}
            const start=initial(this.data.map),now=frame||start;
            LevelBoard.draw(refs.board,this.data.map,frame||null);
            refs.eggCount.textContent='🥚 '+now.held+' / '+start.remaining.length;
            refs.at.textContent='Байрлал ('+now.x+', '+now.y+')';
            refs.turn.textContent=this.busy?'Python ажиллаж байна…':result?'Алхам '+(this.position+1)+' / '+result.frames.length:'Эхлэх байрлал';
            refs.finish.hidden=!result?.frames.length||!!last;
            refs.step.disabled=this.busy||!valid;
            refs.play.disabled=!valid;
            refs.rewind.disabled=this.busy||this.position<0;
            refs.play.textContent=this.busy?'Зогсоох':this.timer?'Түр зогсоох':'Тоглуулах';
            refs.status.dataset.tone=last?(result.won?'pass':result.ok?'other':'error'):(problem||this.extraMessage?'other':'');
            if(this.extraMessage||problem)refs.status.textContent=this.extraMessage||problem;
            else if(this.busy)refs.status.textContent='Python кодыг ажиллуулж байна…';
            else if(last)refs.status.textContent=result.error||result.message||(result.won?'Бүх өндгөө аваад агуйд хүрлээ!':'Код дууслаа.');
            else if(frame)refs.status.textContent=frame.line+'-р мөр ажиллалаа.';
            else refs.status.textContent='Дараагийн мөр юу хийхийг таамаглаад «Нэг алхам» дар.';
            refs.event.textContent=last && result.error?.includes(frame?.event) ? '' : frame?.event||'';
            refs.event.hidden=!refs.event.textContent;
            refs.variables.replaceChildren();
            for(const [name,value] of Object.entries(now.locals||{})){
                const chip=node('span','lv-var');chip.append(node('code','',name),node('samp','',' = '+value));refs.variables.append(chip);
            }
            if(!refs.variables.childElementCount)refs.variables.append(node('span','lv-hint','Одоогоор утга оноогоогүй.'));
            const output=last?result.output:result?.frames.slice(0,this.position+1).map(f=>f.output||'').join('');
            refs.output.textContent=output||'—';
            if(follow&&frame?.line){
                const y=(frame.line-1)*24;
                const input=refs.input;
                if(y<input.scrollTop||y+24>input.scrollTop+input.clientHeight-24)input.scrollTop=Math.max(0,y-48);
            }
            this.alignCode();this.compare();
        }
    }
    window.LevelUI={
        mount(root,adapter){active?.leave();active=new Studio(root,adapter);},
        leave(){active?.leave();active=null;}
    };
})();
