(() => {
    'use strict';
    const workshopText = globalThis.PQEnglishWorkshops?.literal || (text => text);
    const roles=['signal','bus','lamps'];
    const specs={
        signal:{title:workshopText('Гэрлэн дохио'),file:'signal.py',prompt:workshopText('Хоёр өнгийг ээлжлүүл. Эхний 12 мөчид автобусанд дор хаяж нэг удаа зам тавьж өгөөрэй.'),
            api:workshopText('signal(tick) → "red" эсвэл "green". tick нь 0–23. % нь хуваасны үлдэгдлийг өгнө.'),
            starter:workshopText('def signal(tick):\n    if tick % 4 < 2:\n        return "red"\n    # Энэ хоёр мөчид замыг нээ.\n    return "red"'),
            sample:'def signal(tick):\n    if tick % 4 < 2:\n        return "red"\n    return "green"'},
        bus:{title:workshopText('Автобус'),file:'bus.py',prompt:workshopText('Уулзвар улаан бол хүлээ. Зорчигчтой буудалд нэг мөч саатан хүнээ суулгаад аяллаа үргэлжлүүл.'),
            api:workshopText('bus(signal, crossing, waiting) → "go", "wait", "board". crossing нь уулзварт, waiting нь зорчигч хүлээж буйг хэлнэ.'),
            starter:workshopText('def bus(signal, crossing, waiting):\n    if crossing and signal == "red":\n        return "wait"\n    # Зорчигч хүлээж байвал яах вэ?\n    return "go"'),
            sample:'def bus(signal, crossing, waiting):\n    if crossing and signal == "red":\n        return "wait"\n    if waiting:\n        return "board"\n    return "go"'},
        lamps:{title:workshopText('Гудамжны гэрэл'),file:'lamps.py',prompt:workshopText('Үдэд цахилгаанаа хэмнэ. Орой 21 цагт болон үүрийн 03 цагт буудал дээр гэрэл асдаг болгоорой.'),
            api:workshopText('lamps(hour) → True эсвэл False. hour нь 0–23. or ашиглан хоёр цагийн нөхцөлийг нэгтгэж болно.'),
            starter:workshopText('def lamps(hour):\n    # Шөнө дунд өнгөрвөл цаг 0-ээс эхэлнэ.\n    return hour >= 18'),
            sample:'def lamps(hour):\n    return hour >= 18 or hour < 6'}
    };
    const actionText={go:workshopText('Автобус нэг буудлын нүд урагшлав.'),wait:workshopText('Жолооч хүлээж байна.'),board:workshopText('Нэг зорчигч суулаа.'),blocked:workshopText('Улаан дохио явуулахгүй байна. Автобусны дүрмээ шалгаарай.'),empty:workshopText('Энэ нүдэнд суух зорчигч алга.')};
    const firstFrame={tick:-1,hour:16,pos:0,signal:'red',lamps:false,action:'',riders:0};
    const make=(tag,cls='',label='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(label)e.textContent=label;return e;};
    const button=(name,cls,click)=>{const b=make('button',cls,name);b.type='button';b.onclick=click;return b;};
    function label(name,control){const l=make('label','ct-label');l.append(make('span','',name),control);return l;}
    function contribution(input) {
        if(!input || input.format!=='python-quest-city' || input.version!==1 || !roles.includes(input.role) ||
            typeof input.team!=='string' || !input.team.trim() || input.team.length>30 || /[\u0000-\u001f\u007f]/.test(input.team) ||
            typeof input.code!=='string' || !input.code.trim() || input.code.length>6000)
            throw Error(workshopText('«Ангийн хот»-оос татсан багийн JSON файл сонгоорой.'));
        return {format:'python-quest-city',version:1,role:input.role,team:input.team.trim(),code:input.code};
    }
    function normalize(raw) {
        const source=raw && typeof raw==='object'?raw:{}, drafts={},imports={};
        for(const k of roles) {
            const old=source.drafts?.[k];
            const code=typeof old?.code==='string'?old.code.slice(0,6000):specs[k].starter;
            const team=typeof old?.team==='string'?old.team.slice(0,30):'';
            drafts[k]={code,team,proof:old?.proof===code?code:null};
            try{const item=contribution(source.imports?.[k]);if(item.role===k)imports[k]=item;}catch{}
        }
        return {role:roles.includes(source.role)?source.role:'signal',drafts,imports};
    }
    function review(raw) {
        const state=normalize(raw), notes=[];
        for(const key of roles){
            const d=state.drafts[key], imported=state.imports[key];
            if(d.team.trim() || d.code!==specs[key].starter || d.proof)
                notes.push({title:specs[key].title+(d.team.trim()?' · '+d.team.trim():''),
                    text:(d.proof===d.code?workshopText('Шалгалтыг давсан.'):workshopText('Туршиж буй код.'))+'\n'+d.code});
            if(imported)notes.push({title:workshopText('Хамтарсан хот · ')+specs[key].title,text:imported.team+'\n'+imported.code});
        }
        return notes;
    }

    // The city is drawn on a low-resolution grid so that its stops, lights and bus
    // stay in the same positions at classroom-projector and phone sizes.
    function paint(canvas,f) {
        const g=canvas.getContext('2d'),W=384,H=152;
        if(!g)return;
        const night=f.hour>=19||f.hour<6, dusk=f.hour===18||f.hour===6;
        const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
        const dot=(x,y,c)=>rect(x,y,2,2,c);
        const sky=night?'#222e51':dusk?'#cf8890':'#8fc8d4';
        rect(0,0,W,H,sky);rect(0,36,W,18,night?'#323b60':dusk?'#e4ac91':'#accfd5');
        if(night){for(let i=0;i<17;i++)dot((i*41+9)%W,4+(i*13)%32,'#e5dcab');rect(343,9,12,11,'#eee3b3');rect(348,6,8,9,sky);}
        else{rect(340,8,15,14,'#ffeab2');for(const cx of [18,116,238]){rect(cx,18,28,4,'#e7eaed');rect(cx+5,14,14,4,'#e7eaed');}}
        // A valley skyline and a felt ger at the edge of the neighbourhood.
        for(let x=0;x<W;x+=3){
            const y=25+Math.round(8*Math.sin(x/26)+5*Math.sin(x/12));
            rect(x,y,3,57-y,night?'#374a58':dusk?'#9e8588':'#779d9d');
        }
        for(let i=0;i<17;i++){
            const x=i*25-4,h=15+(i*13)%30;
            rect(x,68-h,20,h,night?'#3b4767':'#879eae');
            rect(x+3,64-h,10,4,night?'#3b4767':'#879eae');
        }
        const windowColor=night?'#dfba75':'#b7d9d2',buildingShade=night?'#45435b':'#916d6b';
        function house(x,y,w,h,wall,roof){
            rect(x-1,y-3,w+2,4,roof);rect(x,y,w,h,wall);rect(x+w-4,y,4,h,buildingShade);
            for(let yy=y+5;yy<y+h-4;yy+=10)for(let xx=x+4;xx<x+w-6;xx+=10){
                rect(xx,yy,6,6,roof);rect(xx+1,yy+1,4,4,windowColor);
            }
        }
        house(5,50,40,32,night?'#655463':'#ce9785','#574956');
        house(54,35,38,47,night?'#5c6176':'#c1b7a4','#475466');
        house(111,53,62,29,night?'#685968':'#e2b990','#584957');
        rect(108,61,68,5,'#9e5c65');
        for(let x=109;x<176;x+=12)rect(x,61,6,5,'#ebbb98');
        house(199,44,48,38,night?'#5a6277':'#a4bdba','#4f626b');
        house(274,34,32,48,night?'#615d77':'#ae9fa5','#534e69');
        const felt=night?'#a09e91':'#f0e4c8', seam=night?'#776e67':'#bca88a';
        for(let j=0;j<7;j++)rect(317+j*4,62-j*2,56-j*8,3,j%3?felt:seam);
        rect(319,64,52,17,felt);rect(319,67,52,2,seam);rect(319,77,52,2,'#a67561');
        rect(341,49,9,3,'#6b635a');rect(344,44,3,6,'#575553');
        rect(339,63,13,18,'#8c513f');rect(341,65,9,14,night?'#965f48':'#c07948');
        rect(342,67,7,3,'#dda66f');rect(342,73,7,3,'#dda66f');
        for(const x of [46,98,183,253,375]){
            rect(x,64,3,19,'#6f5d51');rect(x-6,58,15,12,'#3c625b');rect(x-4,53,11,15,night?'#41645c':'#6a9671');
        }
        rect(0,82,W,7,night?'#858595':'#c6bca9');rect(0,89,W,3,'#5d5965');
        rect(0,92,W,36,night?'#3c4153':'#606676');
        for(let x=0;x<W;x+=22)rect(x,113,12,2,'#d6c5a0');
        rect(0,128,W,5,'#666675');rect(0,133,W,19,night?'#334c50':'#79a278');
        const roadX=n=>10+n*32;
        for(const index of [1,7]) {
            const x=roadX(index);rect(x+1,63,2,19,'#434655');rect(x,60,20,3,'#536778');
            rect(x+4,63,13,9,'#94b2bb');rect(x+3,75,13,3,'#825e4d');rect(x+16,63,2,19,'#434655');
        }
        for(const index of [3,9]) {
            const x=roadX(index)+17;
            for(let y=95;y<127;y+=6)rect(x,y,7,3,'#d6d6d0');
            rect(x-4,71,3,16,'#444653');rect(x-7,58,9,15,'#292e40');
            rect(x-5,60,5,4,f.signal==='red'?'#ff7b72':'#6f4851');rect(x-5,67,5,4,f.signal==='green'?'#95ef9b':'#416554');
        }
        for(const x of [19,84,149,212,291,361]){
            rect(x,70,2,15,'#51505a');rect(x-5,68,7,3,'#555461');
            if(f.lamps){g.globalAlpha=.14;rect(x-10,73,13,10,'#ffec9e');g.globalAlpha=1;}
            rect(x-5,71,5,2,f.lamps?'#ffe79d':'#757779');
        }
        const bx=roadX(f.pos)-6,by=98;
        rect(bx-1,by+2,23,12,'#383b49');rect(bx,by,19,12,'#de8958');rect(bx+19,by+3,3,9,'#e7ad6e');
        rect(bx+2,by+2,15,5,'#3b5467');for(const off of [3,8,13])rect(bx+off,by+3,3,3,'#acd6dc');
        rect(bx+2,by+8,17,2,'#f6c46f');rect(bx+20,by+8,2,2,'#fff1b3');
        for(const off of [3,15]){rect(bx+off,by+11,5,4,'#222b36');rect(bx+off+1,by+12,3,2,'#b0ac9f');}
        for(let i=0;i<12;i++){rect(roadX(i),138,2,4,i===f.pos?'#fae5a5':'#5c8072');}
        canvas.setAttribute('aria-label',workshopText('Хотын зураг. Автобус ')+f.pos+workshopText('-р нүдэнд. ')+(f.signal==='red'?workshopText('Улаан'):workshopText('Ногоон'))+workshopText(' дохио. Гудамжны гэрэл ')+(f.lamps?workshopText('асаалттай.'):workshopText('унтраалттай.')));
    }

    let active;
    function leave(){
        if(!active)return;
        clearInterval(active.timer);active.sequence++;active.ctx.stop();active=null;
    }
    function mount(root,ctx) {
        leave();
        const state=ctx.state, session={ctx,sequence:0,timer:null,busy:false};
        active=session;
        let mode=ctx.startMode==='teacher'?'teacher':'student', frames=[],index=-1, checks=[], message='', tone='', selectedResult='';
        let refs={};
        function pause(){clearInterval(session.timer);session.timer=null;}
        function cancel(){
            pause();session.sequence++;
            if(session.busy)ctx.stop();session.busy=false;
        }
        function invalidate(){cancel();frames=[];checks=[];index=-1;message='';tone='';selectedResult='';}
        function buttonState(){
            const r=refs;
            if(!r.run)return;
            const count=Object.keys(state.imports).length;
            r.run.disabled=session.busy||(mode==='teacher'&&count!==3);
            if(r.demo)r.demo.disabled=session.busy;
            r.stop.hidden=!session.busy;
            r.next.disabled=!frames.length||index>=frames.length-1;r.prev.disabled=!frames.length||index<0;
            r.auto.disabled=!frames.length;r.auto.textContent=session.timer?workshopText('Түр зогсоох'):index===frames.length-1?workshopText('Дахин тоглуулах'):workshopText('Тоглуулах');
            r.status.textContent=message;r.status.dataset.tone=tone;
            if(r.exchange){
                const draft=state.drafts[state.role];
                r.exchange.disabled=session.busy||draft.proof!==draft.code||!draft.team.trim();
                r.exportHint.textContent=!draft.team.trim()?workshopText('Файлдаа багийн нэр өгнө үү.'):draft.proof!==draft.code?workshopText('Кодоо туршиж бүх шалгалтыг давбал багийн файл бэлэн болно.'):workshopText('«Багуудын хот» хэсэгт энэ файлыг оруулаад дүрмээ нэгтгээрэй.');
            }
        }
        function showFrame(){
            const f=index<0?firstFrame:frames[index]||firstFrame;
            paint(refs.canvas,f);
            refs.clock.textContent=String(f.hour).padStart(2,'0')+':00';
            refs.turn.textContent=index<0?workshopText('Эхлэл'):workshopText('Мөч ')+(index+1)+' / '+frames.length;
            refs.readout.textContent=(f.signal==='red'?workshopText('Улаан дохио'):workshopText('Ногоон дохио'))+' · '+(f.lamps?workshopText('Гэрэл ассан'):workshopText('Гэрэл унтарсан'))+' · '+f.riders+workshopText(' зорчигч');
            refs.event.textContent=actionText[f.action]||workshopText('Зургийн хоёр саравч нь автобусны буудал. Цагаан гарцан дээр гэрлэн дохио бий.');
            buttonState();
        }
        function advance(){
            if(index<frames.length-1)index++;
            if(index>=frames.length-1)pause();
            showFrame();
        }
        function animate(){
            if(session.timer){pause();buttonState();return;}
            if(index===frames.length-1)index=-1;
            advance();
            if(index<frames.length-1)session.timer=setInterval(advance,550);
            buttonState();
        }
        function renderChecks(){
            refs.checks.replaceChildren();
            for(const test of checks){
                const item=make('li',test.pass?'ct-pass':'ct-fail',(test.pass?'✓ ':'✕ ')+(mode==='teacher'?specs[test.role].title+' · ':'')+test.label);
                refs.checks.append(item);
            }
        }
        async function execute(demo=false) {
            invalidate();
            const job=++session.sequence;
            session.busy=true;message=workshopText('Python хотын дүрмүүдийг туршиж байна…');tone='';showFrame();renderChecks();
            const role=mode==='student'?state.role:'combined';
            const codes={};
            if(role==='combined')for(const k of roles)codes[k]=demo?specs[k].sample:state.imports[k]?.code;
            const source=role==='combined'?'':state.drafts[role].code;
            try {
                const result=await ctx.run(source,{role,codes});
                if(active!==session||job!==session.sequence)return;
                if(!result.ok)throw Error(result.error||workshopText('Кодоо дахин шалгаарай.'));
                frames=result.frames;checks=result.checks;index=0;
                selectedResult=demo?workshopText('Жишээ хот'):mode==='teacher'?workshopText('Ангийн хамтарсан хот'):specs[role].title;
                message=selectedResult+' · '+(result.passed?workshopText('Бүх шалгалт амжилттай.'):workshopText('Тэмдэглэсэн дүрмээ засаад дахин туршаарай.'));
                tone=result.passed?'pass':'warn';
                if(role!=='combined'){state.drafts[role].proof=result.passed?source:null;ctx.save();}
            } catch(e) {
                if(active!==session||job!==session.sequence)return;
                message=e.message;tone='error';
            } finally {
                if(active===session&&job===session.sequence){session.busy=false;renderChecks();showFrame();}
            }
        }
        function open(next){invalidate();mode=next;render();}
        function scene(parent){
            const fig=make('section','ct-screen'),top=make('div','ct-scene-head');
            const clock=make('b','ct-clock'), turn=make('span','ct-turn');
            top.append(make('strong','',workshopText('Нарлагийн уулзвар')),clock,turn);
            const canvas=make('canvas','ct-scene');canvas.width=384;canvas.height=152;canvas.setAttribute('role','img');
            const readout=make('p','ct-readout'),event=make('p','ct-event');
            const prev=button(workshopText('Өмнөх мөч'),'ct-prev secondary',()=>{pause();index=Math.max(-1,index-1);showFrame();});
            const next=button(workshopText('Нэг мөч'),'ct-next secondary',()=>{pause();advance();});
            const auto=button(workshopText('Тоглуулах'),'ct-auto secondary',animate);
            const transport=make('div','ct-transport');transport.append(prev,next,auto);
            fig.append(top,canvas,readout,event,transport);parent.append(fig);
            Object.assign(refs,{canvas,clock,turn,readout,event,prev,next,auto});
        }
        function exportPart(){
            const entry=state.drafts[state.role];if(entry.proof!==entry.code||!entry.team.trim())return;
            const data=contribution({format:'python-quest-city',version:1,role:state.role,team:entry.team,code:entry.code});
            const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
            const link=make('a');link.href=url;link.download='city-'+data.role+'-'+data.team.replace(/[^\p{L}\p{N}-]/gu,'_')+'.json';link.click();
            setTimeout(()=>URL.revokeObjectURL(url),1000);
        }
        function student(parent){
            const box=make('section','ct-desk'),draft=state.drafts[state.role],spec=specs[state.role],role=make('select','ct-role');
            for(const k of roles){const option=make('option','',specs[k].title);option.value=k;role.append(option);}
            role.value=state.role;role.onchange=()=>{invalidate();state.role=role.value;ctx.save();render();};
            box.append(label(workshopText('Багийн үүрэг'),role),make('p','ct-prompt',spec.prompt),make('p','ct-api',spec.api));
            const source=make('textarea','ct-code');source.value=draft.code;source.rows=8;source.wrap='off';source.maxLength=6000;
            source.spellcheck=false;source.setAttribute('aria-label',spec.file+workshopText(' Python код'));source.setAttribute('autocapitalize','off');
            source.oninput=()=>{invalidate();draft.code=source.value;draft.proof=null;ctx.save();renderChecks();showFrame();};
            source.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();execute();}else if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();source.setRangeText('    ',source.selectionStart,source.selectionEnd,'end');source.oninput();}};
            box.append(label(spec.file,source));
            const team=make('input','ct-team');team.maxLength=30;team.value=draft.team;team.placeholder=workshopText('Жишээ нь Манлай');
            team.oninput=()=>{draft.team=team.value.replace(/[\u0000-\u001f\u007f]/g,'');if(team.value!==draft.team)team.value=draft.team;ctx.save();buttonState();};
            const run=button(workshopText('Кодоо турших'),'ct-run',()=>execute()),stop=button(workshopText('Зогсоох'),'ct-stop secondary',stopRun);
            const controls=make('div','ct-actions');controls.append(run,stop);
            box.append(controls);
            const share=make('section','ct-share');
            const exchange=button(workshopText('Багийн файл татах'),'ct-export secondary',exportPart),hint=make('p','ct-muted');
            share.append(label(workshopText('Багийн нэр'),team),exchange,hint);
            Object.assign(refs,{run,stop,exchange,exportHint:hint});parent.append(box);return share;
        }
        function stopRun(){cancel();message=workshopText('Ажиллуулалтыг зогсоолоо. Кодоо засаад дахин туршаарай.');tone='';buttonState();}
        async function importFiles(files){
            const entries=[],seen=new Set();
            try{
                if(!files.length)return;
                if(files.length>3)throw Error(workshopText('Нэг удаа гурав хүртэлх багийн файл сонгоорой.'));
                for(const file of files){
                    if(file.size>64000)throw Error(workshopText('Багийн файл хэт том байна.'));
                    let raw;try{raw=JSON.parse(await file.text());}catch{throw Error(workshopText('JSON файлыг уншиж чадсангүй.'));}
                    const part=contribution(raw);
                    if(seen.has(part.role))throw Error(specs[part.role].title+workshopText(' үүргийн хоёр файл давхардлаа. Нэгийг нь сонгоорой.'));
                    seen.add(part.role);entries.push(part);
                }
                if(active!==session||mode!=='teacher')return;
                const replacing=entries.filter(p=>state.imports[p.role]&&(state.imports[p.role].team!==p.team||state.imports[p.role].code!==p.code));
                if(replacing.length&&!confirm(replacing.map(p=>specs[p.role].title).join(', ')+workshopText(' багийн өмнөх хотын дүрмийг солих уу?')))return;
                invalidate();for(const part of entries)state.imports[part.role]=part;
                ctx.save();message=entries.length+workshopText(' файл уншлаа. Хотыг ажиллуулахад сонгосон кодууд хамт туршигдана.');tone='pass';render();
            }catch(e){if(active===session&&mode==='teacher'){message=e.message;tone='error';buttonState();}}
        }
        function teacher(parent){
            const box=make('section','ct-desk');
            box.append(make('h2','',workshopText('Багуудын бүтээл')),make('p','ct-muted',workshopText('Гэрлэн дохио, автобус, гудамжны гэрлийн файлуудаа сонго. Жишээ хотыг хүссэн үедээ тусад нь туршиж болно.')));
            const file=make('input','ct-file');file.type='file';file.multiple=true;file.accept='.json,application/json';file.setAttribute('aria-label',workshopText('Багуудын JSON файлууд'));
            file.onchange=()=>{const files=Array.from(file.files);file.value='';importFiles(files);};
            box.append(label(workshopText('Багийн файл оруулах'),file));
            for(const k of roles){
                const part=state.imports[k],row=make('details','ct-part');
                row.append(make('summary','',specs[k].title+' · '+(part?part.team:workshopText('Файл хүлээж байна'))));
                if(part)row.append(make('pre','ct-import-code',part.code));else row.append(make('p','ct-muted',specs[k].api));
                box.append(row);
            }
            const run=button(workshopText('Хамтарсан хотыг ажиллуулах'),'ct-run',()=>execute()),demo=button(workshopText('Жишээ хотыг харах'),'ct-demo secondary',()=>execute(true)),stop=button(workshopText('Зогсоох'),'ct-stop secondary',stopRun);
            const controls=make('div','ct-actions');controls.append(run,demo,stop);box.append(controls);
            Object.assign(refs,{run,demo,stop});parent.append(box);
        }
        function render(){
            refs={};
            const section=make('section','ct-shell'),header=make('div','ct-header'),text=make('div');
            text.append(make('h1','',workshopText('Ангийн хот')),make('p','ct-muted',workshopText('Гурван баг нэг хотын гэрэл, тээврийг Python-оор удирдана.')));
            const modes=make('nav','ct-modes');modes.setAttribute('aria-label',workshopText('Хотын горим'));
            for(const [key,title] of [['student',workshopText('Манай баг')],['teacher',workshopText('Багуудын хот')]]){
                const b=button(title,'ct-mode ct-mode-'+key,()=>{if(mode!==key)open(key);});b.setAttribute('aria-pressed',String(mode===key));modes.append(b);
            }
            header.append(text,modes);const layout=make('div','ct-layout');
            section.append(header,layout);scene(layout);
            const share=mode==='student'?student(layout):teacher(layout);
            const feedback=make('section','ct-feedback'),status=make('p','ct-status'),items=make('ul','ct-checks');
            status.setAttribute('role','status');feedback.append(status,items);
            section.append(feedback);if(share)section.append(share);
            Object.assign(refs,{status,checks:items});
            root.replaceChildren(section);renderChecks();showFrame();
        }
        render();
    }
    window.CityStudio={normalize,mount,leave,review};
})();
