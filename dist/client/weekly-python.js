(() => {
    'use strict';

    const challenges = [
        {title:'Нүүдлийн ачаа', skill:'Бүхэл тоо · үлдэгдэл', fn:'bag_count', args:'items, capacity',
            task:'Бүх ачааг багтаахад хэдэн уут хэрэгтэй вэ? Нэг уутанд capacity ширхэг ачаа багтана. Сүүлийн уут дутуу дүүрч болно. Ачаагүй үед 0 буцаана.',
            example:[[7,3],3,'Хоёр уутанд гурав гурваар, сүүлийн уутанд нэг ачаа орно.'],
            cases:[[[0,5],0],[[12,4],3],[[1,7],1]],
            extra:n=>[[n*4+2,4],n+1]},
        {title:'Манан дундах цамхаг', skill:'Нөхцөл · заагийн утга', fn:'beacon', args:'light',
            task:'Цамхгийн гэрлийн хүч 70 буюу түүнээс их бол "ногоон", 30–69 бол "шар", 30-аас бага бол "улаан" гэж буцаагаарай.',
            example:[[48],'шар','48 нь 30-аас их, 70-аас бага тул шар гэрэл асна.'],
            cases:[[[29],'улаан'],[[30],'шар'],[[70],'ногоон']],
            extra:n=>[[45+n],'шар']},
        {title:'Худаг дээрх савнууд', skill:'Жагсаалт · давталт', fn:'water_needed', args:'pots',
            task:'Аялагч сав бүрд дор хаяж 5 аяга ус үлдээнэ. pots жагсаалт сав бүрийн одоогийн усыг заана. Савнуудад нэмж хийх нийт усны хэмжээг буцаагаарай.',
            example:[[[2,5,4]],4,'Эхний саванд 3, сүүлийн саванд 1 аяга нэмнэ.'],
            cases:[[[[]],0],[[[5,8]],0],[[[0,1,5]],9]],
            extra:n=>[[[n%5,1,7]],9-n%5]},
        {title:'Цасан дээрх мөр', skill:'Текст · тэмдэгт тоолох', fn:'count_tracks', args:'trail',
            task:'Цасны зураг дээр * нь амьтны мөр, цэг болон зураас нь цас, мөсийг заана. trail текстэд байгаа мөрийн тоог буцаагаарай.',
            example:[['.*-**'],3,'Нэг одны араас зай гарч, дараа нь хоёр од залгасан байна.'],
            cases:[[[''],0],[['.-..'],0],[['**.*'],3]],
            extra:n=>[['-*'.repeat(n)+'.'],n]},
        {title:'Тамганы цуглуулга', skill:'Жагсаалт · давхардал', fn:'new_stamps', args:'stamps',
            task:'Аялагч зочилсон газар бүрийнхээ тамгыг цуглуулжээ. Тамга тус бүрийг анх таарсан дарааллаар ганц удаа багтаасан жагсаалт буцаагаарай.',
            example:[[['нар','сар','нар']],['нар','сар'],'Дэвтэрт нарны тамга түрүүлж орсон тул эхний байраа хадгална.'],
            cases:[[[[]],[]],[[['од','од']],['од']],[[['уул','гол','тал','гол']],['уул','гол','тал']]],
            extra:n=>[[[String(n),'үүл',String(n),'нар']], [String(n),'үүл','нар']]},
        {title:'Тойрог замын өртөө', skill:'Индекс · жагсаалт', fn:'next_stop', args:'stops, index',
            task:'Өртөөнүүд тойрог зам дагуу дарааллаараа байрлана. Робот index дугаартай өртөөн дээр байна. Дараагийн өртөөний нэрийг буцаана. Сүүлийн өртөөний дараа эхнийх ирнэ. Хоосон жагсаалтад "" буцаагаарай.',
            example:[[['Бүрд','Хөвч','Тал'],2],'Бүрд','2 дугаартай Тал нь сүүлийн өртөө учраас робот Бүрд рүү буцна.'],
            cases:[[[[],0],''],[[['Говь'],0],'Говь'],[[['Гол','Уул','Тал'],0],'Уул']],
            extra:n=>[[['А','Б','В','Г'],n%4],['Б','В','Г','А'][n%4]]},
        {title:'Оёдолчны хайрцаг', skill:'Толь бичиг · нийлбэр', fn:'bead_total', args:'stock, colors',
            task:'stock нь өнгө тус бүрд хэдэн шүр байгааг хадгална. colors жагсаалтад хүссэн өнгө бүр нэг удаа орно. Эдгээр өнгийн шүрийн нийт тоог буцаана. Хайрцагт байхгүй өнгийг 0 гэж тооцоорой.',
            example:[[{улаан:4,хөх:2},['хөх','ногоон']],2,'Хөх өнгийн 2 шүр байна. Ногоон шүр хайрцагт алга.'],
            cases:[[[{},['хөх']],0],[[{улаан:5},[]],0],[[{нар:3,сар:2,од:6},['нар','од']],9]],
            extra:n=>[[{алт:n,мөнгө:2},['мөнгө','алт','зэс']],n+2]},
        {title:'Шөнийн гэрлэн дохио', skill:'Давталт · дараалал', fn:'longest_glow', args:'signals',
            task:'1 бол гэрэл асаалттай, 0 бол унтарсан агшин. signals жагсаалтад гэрэл хамгийн удаан хэдэн агшин дараалан ассан бэ? Асаагүй бол 0 буцаагаарай.',
            example:[[[1,0,1,1,0]],2,'Эхэнд нэг удаа, дараа нь хоёр удаа дараалан ассан байна.'],
            cases:[[[[]],0],[[[0,0,0]],0],[[[1,1,0,1,1,1]],3]],
            extra:n=>[[[0,...Array(n).fill(1),0,1]],n]}
    ];
    const day = 86400000;
    const anchor = Date.UTC(2026,10,23);
    const calendar = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ulaanbaatar',year:'numeric',month:'2-digit',day:'2-digit'});
    const iso = stamp => new Date(stamp).toISOString().slice(0,10);
    const weekTime = week => Date.parse(week+'T00:00:00Z');
    function monday(date) {
        const fields = Object.fromEntries(calendar.formatToParts(date).map(p=>[p.type,p.value]));
        const stamp=Date.UTC(Number(fields.year),Number(fields.month)-1,Number(fields.day));
        return iso(stamp-((new Date(stamp).getUTCDay()+6)%7)*day);
    }
    function challenge(week) {
        const index=Math.round((weekTime(week)-anchor)/(7*day));
        const data=challenges[((index%challenges.length)+challenges.length)%challenges.length];
        const n=2+((index%11)+11)%11;
        return {...data,week,cases:[...data.cases,data.extra(n)]};
    }
    function current(date=new Date()) { return challenge(monday(date)); }
    function previous(week) { return iso(weekTime(week)-7*day); }
    function readSave(raw,date=new Date()) {
        const records={};
        const week=monday(date);
        for(const key of [previous(week),week]){
            const value=raw?.records?.[key];
            if(!value || typeof value!=='object')continue;
            records[key]={completed:value.completed===true};
            if(typeof value.code==='string')records[key].code=value.code.slice(0,16000);
        }
        return {records};
    }

    // Values shown in the problem use Python's syntax, including quotes for text.
    function python(value) {
        if(Array.isArray(value))return '['+value.map(python).join(', ')+']';
        if(value && typeof value==='object')return '{'+Object.entries(value).map(([k,v])=>python(k)+': '+python(v)).join(', ')+'}';
        return JSON.stringify(value);
    }
    function call(task,args){return task.fn+'('+args.map(python).join(', ')+')';}
    const outputAliases = {
        beacon:{улаан:'red', шар:'yellow', ногоон:'green'},
        kite:{хураа:'pack', хүлээ:'wait', нисгэ:'fly'}
    };
    function displayExpected(fn, expected) {
        return globalThis.GameLocale?.lang === 'en' && typeof expected === 'string'
            ? outputAliases[fn]?.[expected] ?? expected : expected;
    }
    function caseRequest(task,code,index) {
        const [args,expected]=task.cases[index];
        const alias = typeof expected === 'string' ? outputAliases[task.fn]?.[expected] : undefined;
        const english = globalThis.GameLocale?.lang === 'en';
        const missing = english ? 'Define the function ' + task.fn + '.' : task.fn + ' нэртэй функцээ тодорхойлоорой.';
        const check=[
            'import json',
            'solve = g.get('+JSON.stringify(task.fn)+')',
            'assert callable(solve), '+JSON.stringify(missing),
            'got = solve(*json.loads('+JSON.stringify(JSON.stringify(args))+'))',
            'want = json.loads('+JSON.stringify(JSON.stringify(expected))+')',
            'assert type(got) is type(want) and ' + (alias ? 'got in (want, '+JSON.stringify(alias)+')' : 'got == want') +
                ', ' + JSON.stringify(english ? 'Returned value: ' : 'Буцаасан утга: ') + ' + repr(got)[:120]'
        ].join('\n');
        return {code,academy:{check}};
    }

    function el(tag,cls,text) {
        const n=document.createElement(tag);
        if(cls)n.className=cls;
        if(text!==undefined)n.textContent=text;
        return n;
    }
    function button(cls,text,fn) {
        const n=el('button',cls,text);n.type='button';n.onclick=fn;return n;
    }
    let active;
    class Weekly {
        constructor(root,ctx) {
            this.root=root;this.ctx=ctx;this.currentWeek=monday(new Date());this.week=this.currentWeek;
            this.worker=null;this.render();
            this.watch=()=>this.roll();
            this.clock=setInterval(this.watch,60000);
            document.addEventListener('visibilitychange',this.watch);
        }
        roll() {
            const week=monday(new Date());
            if(week===this.currentWeek)return false;
            this.stop();
            const save=this.ctx.getSave();save.records=readSave(save).records;
            this.currentWeek=this.week=week;this.ctx.save();this.render();return true;
        }
        record() {
            const records=this.ctx.getSave().records;
            return records[this.week] ??= {completed:false};
        }
        stop() {
            clearTimeout(this.timeout);this.worker?.terminate();this.worker=null;
        }
        leave() {
            this.stop();clearInterval(this.clock);document.removeEventListener('visibilitychange',this.watch);
        }
        render() {
            this.stop();
            const task=challenge(this.week), record=this.ctx.getSave().records[this.week];
            const shell=el('section','wk-shell');
            const head=el('div','wk-header');
            const info=el('div');info.append(el('h1','','Долоо хоногийн Python сорил'),
                el('p','','Даваа гараг бүр Улаанбаатарын цагаар ангийн шинэ бодлого нээгдэнэ.'));
            const tabs=el('div','wk-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Сорилын долоо хоног');
            for(const [week,label] of [[this.currentWeek,'Энэ долоо хоног'],[previous(this.currentWeek),'Өмнөх долоо хоног']]){
                const tab=button('wk-tab',label,()=>{if(this.week!==week){this.week=week;this.render();}});
                tab.setAttribute('aria-pressed',String(this.week===week));tabs.append(tab);
            }
            head.append(info,tabs);shell.append(head);
            const layout=el('div','wk-layout');
            const brief=el('section','wk-brief');this.badge=el('span','wk-completed','✓ Давсан');this.badge.hidden=!record?.completed;
            const dates=el('p','wk-date',this.week+' — '+iso(weekTime(this.week)+6*day));
            brief.append(dates,el('h2','',task.title),el('p','wk-skill',task.skill),this.badge,el('p','wk-task',task.task));
            const example=el('section','wk-example');
            example.append(el('h3','','Жишээ'),el('code','',call(task,task.example[0])+' → '+python(displayExpected(task.fn,task.example[1]))),el('p','',task.example[2]));
            brief.append(example);
            const editor=el('section','wk-editor');
            const label=el('label','wk-file','weekly.py');label.htmlFor='wk-source';
            this.field=el('textarea','wk-code');this.field.id='wk-source';this.field.rows=10;this.field.maxLength=16000;
            this.field.spellcheck=false;this.field.autocapitalize='off';this.field.autocomplete='off';
            const comment=globalThis.GameLocale?.lang === 'en' ? '# Write your solution here' : '# Шийдлээ энд бичээрэй';
            this.field.value=record?.code ?? ('def '+task.fn+'('+task.args+'):\n    '+comment+'\n    pass');
            const edit=()=>{this.record().code=this.field.value;this.ctx.save();this.resetFeedback();};
            this.field.oninput=edit;
            this.field.onkeydown=e=>{
                if(e.isComposing || this.field.readOnly)return;
                if(e.key==='Enter' && (e.ctrlKey || e.metaKey)){e.preventDefault();this.run();return;}
                if(e.key!=='Tab' && e.key!=='Enter' || e.shiftKey)return;
                e.preventDefault();
                const line=this.field.value.slice(0,this.field.selectionStart).split('\n').pop();
                const insert=e.key==='Tab'?'    ':'\n'+line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');
                if(this.field.value.length-(this.field.selectionEnd-this.field.selectionStart)+insert.length<=16000){
                    this.field.setRangeText(insert,this.field.selectionStart,this.field.selectionEnd,'end');edit();
                }
            };
            const controls=el('div','wk-controls');
            this.runBtn=button('wk-run','Шийдлээ шалгах',()=>this.run());
            this.stopBtn=button('wk-stop','Зогсоох',()=>this.finish('Шалгалтыг зогсоолоо. Дахин ажиллуулж болно.'));
            controls.append(this.runBtn,this.stopBtn);
            editor.append(label,this.field,controls);layout.append(brief,editor);shell.append(layout);
            const checks=el('section','wk-results');
            checks.append(el('h3','','Оролт бүрийн шалгалт'));
            this.rows=task.cases.map(([args,expected])=>{
                const line=el('div','wk-row');const name=el('code','',call(task,args));
                const goal=el('span','wk-expect','Хүлээх утга · '+python(displayExpected(task.fn,expected)));
                const status=el('span','wk-case-status');line.append(name,goal,status);checks.append(line);return status;
            });
            this.status=el('p','wk-status');this.status.setAttribute('role','status');
            shell.append(checks,this.status);this.root.replaceChildren(shell);
            this.resetFeedback();this.setRunning(false);
        }
        setRunning(on) {
            this.field.readOnly=on;this.runBtn.disabled=on;this.stopBtn.hidden=!on;
        }
        resetFeedback() {
            this.status.textContent='';
            for(const row of this.rows){row.textContent='Хүлээж байна';delete row.dataset.result;}
        }
        finish(message) {
            this.stop();this.setRunning(false);this.status.textContent=message;
        }
        run() {
            if(this.roll() || this.worker)return;
            const code=this.field.value, task=challenge(this.week);
            if(!code.trim()){this.status.textContent='Эхлээд функцээ бичээрэй.';return;}
            this.resetFeedback();this.setRunning(true);
            let worker;
            try {worker=this.worker=new Worker('worker.js?v=weekly1');}
            catch{this.finish('Python хөдөлгүүрийг эхлүүлж чадсангүй. Дахин оролдоорой.');return;}
            let index=0,passed=0;
            const send=()=>{
                clearTimeout(this.timeout);const row=this.rows[index];
                row.textContent='Шалгаж байна…';this.status.textContent=(index+1)+' / '+task.cases.length+' оролтыг шалгаж байна…';
                this.timeout=setTimeout(()=>{
                    row.textContent='Хугацаа хэтэрлээ';row.dataset.result='error';
                    this.finish('Функц хариу буцааж амжсангүй. Давталтын төгсөх нөхцөлөө шалгаарай.');
                },6000);
                worker.postMessage(caseRequest(task,code,index));
            };
            this.status.textContent='Python ачаалж байна…';
            this.timeout=setTimeout(()=>this.finish('Python ачаалахад хугацаа хэтэрлээ. Дахин ажиллуулаарай.'),90000);
            worker.onerror=()=>{if(worker===this.worker)this.finish('Python ажиллаж чадсангүй. Дахин оролдоорой.');};
            worker.onmessage=({data})=>{
                if(worker!==this.worker)return;
                if(data.type==='ready'){send();return;}
                if(data.type==='fatal'){this.finish(data.error);return;}
                if(data.type!=='result')return;
                clearTimeout(this.timeout);
                const row=this.rows[index];row.dataset.result=data.ok?'pass':'error';
                row.textContent=data.ok?'✓ Таарлаа':data.error || 'Утга зөрлөө';
                if(!data.ok && data.kind!=='test'){this.finish('Кодын алдаагаа засаад дахин шалгаарай.');return;}
                if(data.ok)passed++;
                if(++index<task.cases.length){send();return;}
                if(passed===index){const r=this.record();r.code=code;r.completed=true;this.ctx.save();this.badge.hidden=false;}
                this.finish(passed===index?'Бүх оролтод зөв хариуллаа. Сорилыг давлаа!':passed+' / '+index+' оролт зөв. Зөрсөн утгуудаа харьцуулаарай.');
            };
        }
    }
    window.WeeklyPython=Object.freeze({readSave,current,caseRequest,displayExpected,
        mount(root,ctx){active?.leave();active=new Weekly(root,ctx);},
        leave(){active?.leave();active=null;}
    });
})();
