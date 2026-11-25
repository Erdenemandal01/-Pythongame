(() => {
    'use strict';
    const el = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    function button(cls, label, action) {
        const node = el('button', cls, label);
        node.type = 'button';
        node.addEventListener('click', action);
        return node;
    }
    const names = {host:'Цэнхэр робот', guest:'Улбар робот'};
    const actions = {move:'Урагш алхав', collect:'Эрдэнэ түүх', right:'Баруун тийш эргэв'};
    const sides = ['host','guest'];
    function storage(key, value) {
        try {
            if (value === undefined) return sessionStorage.getItem(key);
            if (value === null) sessionStorage.removeItem(key);
            else sessionStorage.setItem(key,value);
        } catch {}
        return null;
    }
    function robot(g, x, y, dir, side) {
        const ink = '#152437', metal = side === 'guest' ? '#f08d58' : '#66cef4';
        const shine = side === 'guest' ? '#ffd391' : '#c8f3ff';
        const rect = (a,b,w,h,color) => { g.fillStyle = color; g.fillRect(x+a,y+b,w,h); };
        rect(6,23,20,3,'#152636'); rect(5,17,5,6,ink); rect(24,17,4,6,ink);
        rect(9,20,6,5,ink); rect(18,20,6,5,ink);
        rect(9,22,6,2,metal); rect(18,22,6,2,metal);
        rect(8,8,18,14,ink); rect(6,10,22,10,ink); rect(8,10,18,9,metal);
        rect(10,8,14,2,shine); rect(10,19,14,2,metal);
        rect(10,12,14,5,ink); rect(13+(dir===2?-2:dir===0?1:0),13,2,2,shine);
        rect(18+(dir===2?-2:dir===0?1:0),13,2,2,shine);
        // A pointed cap, crossed collar and brass belt keep the two couriers
        // recognizable at the board's native 32-pixel scale.
        rect(8,8,18,2,'#703e36'); rect(10,7,14,1,'#dbaf6c');
        rect(13,5,8,2,metal); rect(15,3,4,2,shine); rect(16,2,2,1,'#dfb971');
        rect(12,17,3,1,shine); rect(15,18,3,1,shine); rect(18,19,3,1,shine);
        rect(10,20,14,2,'#844b38'); rect(17,20,3,2,'#edc271');
        const tips = [[26,13],[15,25],[1,13],[15,0]];
        const [a,b] = tips[dir];
        if (dir%2) { rect(a,b,3,3,'#fff3ba'); rect(a-2,dir===1?b:b+2,7,1,'#fff3ba'); }
        else { rect(a,b,3,3,'#fff3ba'); rect(dir===0?a:a+2,b-2,1,7,'#fff3ba'); }
    }
    function drawBoard(canvas, board, frame, side) {
        const t=32, pad=4, rows=board.rows;
        canvas.width=rows[0].length*t+pad*2;
        canvas.height=rows.length*t+pad*2;
        const g=canvas.getContext('2d');
        if (!g) return;
        const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
        rect(0,0,canvas.width,canvas.height,'#243c38');
        rows.forEach((row,y)=>[...row].forEach((cell,x)=>{
            const u=pad+x*t, v=pad+y*t;
            if (cell==='#') {
                rect(u,v,31,31,'#4e423e');rect(u+1,v+1,30,24,'#986d54');
                rect(u+2,v+2,27,2,'#c1a17f');rect(u+3,v+7,25,13,'#765243');
                for(const offset of [0,12]){
                    rect(u+4+offset,v+9,9,2,'#c99967');rect(u+4+offset,v+10,2,7,'#c99967');
                    rect(u+10+offset,v+10,3,4,'#c99967');rect(u+7+offset,v+15,3,2,'#c99967');
                }
                rect(u+3,v+23,24,2,'#bd8e65');return;
            }
            rect(u,v,31,31,(x+y)%2?'#42645a':'#496a5b');
            rect(u+1,v+1,29,1,'#68816f');rect(u+1,v+2,1,27,'#587661');
            rect(u+26,v+26,2,1,'#829575');rect(u+4,v+4,1,1,'#91a47f');
        }));
        frame.remaining.forEach(([x,y])=>{
            const u=pad+x*t, v=pad+y*t;
            rect(u+11,v+22,10,2,'#2b4151');rect(u+13,v+7,6,17,'#59466b');
            rect(u+10,v+10,12,11,'#835897');rect(u+8,v+13,16,5,'#bb81d4');
            rect(u+12,v+10,8,10,'#e6a1e9');rect(u+14,v+8,4,14,'#ffd1fb');
            rect(u+12,v+12,4,3,'#fff4fb');
        });
        robot(g,pad+frame.x*t,pad+frame.y*t,frame.dir,side);
        canvas.setAttribute('aria-label', board.title+' · '+names[side]+' · '+(frame.x+1)+'-р багана, '+(frame.y+1)+'-р мөр · үлдсэн эрдэнэ '+frame.remaining.length);
    }
    function icon(side) {
        const c=el('canvas','rd-bot');c.width=c.height=32;c.setAttribute('aria-hidden','true');
        const g=c.getContext('2d');
        if (g) robot(g,0,0,side==='guest'?2:0,side);
        return c;
    }
    function legend() {
        const row=el('div','rd-legend');
        for (const [cls,label] of [['gem','Эрдэнэ'],['wall','Хана'],['nose','Харах зүг']]){
            const entry=el('span');entry.append(el('i','rd-key-'+cls),document.createTextNode(label));row.append(entry);
        }
        return row;
    }
    class Arena {
        constructor(root,options) {
            this.root=root;this.options=options || {};this.rules=window.RobotDuelRules;
            this.mode='practice';this.owner=null;this.room=null;this.mapIndex=0;
            this.practiceCode=this.draft('practice') ?? this.rules.starter;
            this.onlineCode=this.practiceCode;this.readId=0;this.authId=0;this.runId=0;
            this.live=true;this.mutating=false;this.running=false;this.reading=false;
            this.message='';this.trainingResult=null;this.roomTraining=null;this.ownResult=null;
            this.onAccount=()=>void this.checkAccount();
            this.onVisible=()=>{if (!document.hidden) this.poll();};
            window.addEventListener('pq-account-change',this.onAccount);
            document.addEventListener('visibilitychange',this.onVisible);
            this.pollTimer=setInterval(()=>this.poll(),4000);
            this.render();this.onAccount();
        }
        get api(){return window.PQUsernameAccount;}
        get phase(){ return window.GameAccount?.status().phase || 'offline'; }
        key(section){return 'pq-robot-duel-v1:'+ (this.owner || 'device')+':'+section;}
        draft(section,value){return storage(this.key(section),value);}
        setMode(next){
            if(next===this.mode || this.mutating)return;
            this.userChoseMode=true;this.stopRun();this.stopReplay();
            this.mode=next;this.message='';this.render();
            if(next==='online')this.poll();
        }
        note(text,bad=false){
            this.message=text;this.bad=bad;
            if(this.notice){this.notice.textContent=text;this.notice.classList.toggle('rd-bad',bad);}
        }
        async checkAccount(){
            const ticket=++this.authId;
            const phase=this.phase, online=Boolean(this.api);
            let id=null;
            if(online && phase==='member'){
                try {id=await this.api.userId();} catch {return;}
            }
            if(!this.live || ticket!==this.authId)return;
            if(id===this.owner && this.lastPhase===phase)return;
            this.lastPhase=phase;
            if(id!==this.owner) {
                this.cancelNetwork();this.stopRun();this.stopReplay();
                this.owner=id;this.room=null;this.trainingResult=this.roomTraining=this.ownResult=null;this.message='';
                this.practiceCode=this.draft('practice') ?? this.rules.starter;
                this.onlineCode=this.practiceCode;
                if(id) void this.restore();
            }
            this.render();
        }
        cancelNetwork(){this.readId++;this.mutating=false;this.reading=false;}
        async restore(){
            const owner=this.owner, stamp=++this.readId;
            this.reading=true;
            try {
                let room=null;
                const saved=this.draft('room');
                if(saved) {
                    try {room=await this.api.duel('read',saved,null,owner);}
                    catch(error){if(error?.status!==404 && !String(error.message).includes('room_unavailable'))throw error;}
                }
                if(!room)room=await this.api.duel('resume',null,null,owner);
                if(!this.live || stamp!==this.readId || owner!==this.owner)return;
                if(room && !this.userChoseMode)this.mode='online';
                this.setRoom(room);
            } catch {
                if(this.live && stamp===this.readId && this.mode==='online')this.note('Одоогийн өрөөг шалгаж чадсангүй. Дахин нээх эсвэл кодоор нэгдээрэй.',true);
            } finally {if(stamp===this.readId)this.reading=false;}
        }
        setRoom(room){
            if(room?.code===this.room?.code && JSON.stringify(room)===JSON.stringify(this.room))return;
            const changed=room?.code!==this.room?.code;
            this.room=room||null;
            this.draft('room',room?.code || null);
            if(changed){
                this.ownResult=this.roomTraining=null;this.mapIndex=0;this.stopReplay();
                this.onlineCode=room ? this.draft('code:'+room.code) ?? this.practiceCode : this.practiceCode;
            }
            if(this.mode==='online')this.render();
        }
        poll(){
            if(!this.live || document.hidden || this.mode!=='online' || !this.room || this.room.status==='finished' ||
                this.reading || this.mutating || !this.owner)return;
            const owner=this.owner, stamp=++this.readId, code=this.room.code;
            this.reading=true;
            void this.api.duel('read',code,null,owner).then(room=>{
                if(!this.live || stamp!==this.readId)return;
                if(this.pollError){this.pollError=false;this.note('');}
                this.setRoom(room);
            }).catch(error=>{
                if(!this.live || stamp!==this.readId)return;
                if(error?.status===404 || String(error.message).includes('room_unavailable')){
                    this.stopRun();this.setRoom(null);this.note('Өрөө хаагдсан байна. Дахин өрөө нээх эсвэл өөр код оруулна уу.',true);
                }else { this.pollError=true;this.note('Холболт тасарсан байна. Өрөөг автоматаар дахин шалгана.',true); }
            }).finally(()=>{if(stamp===this.readId)this.reading=false;});
        }
        async change(action, code=null, traces=null){
            if(!this.owner || this.mutating || !this.api)return;
            const question = 'Өрөөг хоёр тоглогчид хаах уу?';
            if(action==='leave' && this.room?.status!=='finished' && !confirm(globalThis.GameLocale?.text(question) ?? question))return;
            const owner=this.owner, stamp=++this.readId;
            this.reading=false;this.mutating=true;this.pollError=false;this.note('Өрөөг шинэчилж байна…');this.render();
            try {
                const room=await this.api.duel(action,code,traces,owner);
                if(!this.live || stamp!==this.readId)return;
                this.note('');this.setRoom(room);
            }catch(error){
                if(!this.live || stamp!==this.readId)return;
                const msg=String(error.message);
                if((error.status===404 || msg.includes('room_unavailable')) && action!=='join')this.setRoom(null);
                this.note(msg.includes('other_room_active') ? 'Та өөр өрөөнд байна. Одоогийн өрөөндөө буцаж ороод хаасны дараа энэ кодоор нэгдээрэй.' :
                    msg.includes('room_full') ? 'Энэ өрөөний хоёр суудал дүүрсэн байна.' :
                    msg.includes('room_unavailable') || error.status===404 ? 'Ийм кодтой нээлттэй өрөө олдсонгүй. Кодоо дахин шалгаарай.' :
                    error.status===401 ? 'Бүртгэлдээ дахин нэвтэрч өрөөг нээнэ үү.' :
                    'Хүсэлт баталгаажаагүй байна. Холболтоо шалгаад дахин оролдоорой.',true);
                if(msg.includes('other_room_active'))queueMicrotask(()=>{if(this.live && this.owner===owner)void this.restore();});
            }finally{
                if(this.live && stamp===this.readId){this.mutating=false;this.render();this.poll();}
            }
        }
        stopRun(){
            ++this.runId;clearTimeout(this.runTimer);this.worker?.terminate();
            this.worker=null;this.running=false;
        }
        run(practice){
            if(this.running || this.mutating || (!practice && (this.room?.status!=='playing'||this.room[this.room.role]?.submitted)))return;
            const inRoom=this.mode==='online';
            const code=inRoom?this.onlineCode:this.practiceCode;
            if(!code.trim()){this.note('Эхлээд decide функцийг бичээрэй.',true);return;}
            this.stopReplay();this.stopRun();
            this.running=true;this.note('Python бэлдэж байна…');
            const run=this.runId, roomCode=this.room?.code;
            const fail=(message)=>{if(run!==this.runId)return;this.stopRun();this.note(message,true);this.render();};
            let w;
            try {w=this.worker=new Worker('worker.js?v=robot1');}
            catch {fail('Python хөдөлгүүрийг эхлүүлж чадсангүй. Хуудсаа шинэчлээд дахин туршаарай.');return;}
            this.runTimer=setTimeout(()=>fail('Python ачаалахад хугацаа хэтэрлээ. Дахин туршаарай.'),90000);
            w.onerror=()=>fail('Python хөдөлгүүр тасарлаа. Дахин туршаарай.');
            w.onmessage=({data})=>{
                if(!this.live || run!==this.runId)return;
                if(data.type==='ready'){
                    clearTimeout(this.runTimer);
                    this.runTimer=setTimeout(()=>fail('Код удаан ажиллалаа. Төгсгөлгүй давталтаа шалгаад дахин туршаарай.'),8000);
                    this.note('Робот дүрмээ ажиллуулж байна…');
                    w.postMessage(this.rules.request(code,practice));return;
                }
                if(data.type==='fatal'){ fail(data.error);return; }
                if(data.type!=='result')return;
                if(!data.ok){fail(data.error || 'Python кодоо шалгаарай.');return;}
                this.stopRun();this.note('');
                if(practice){
                    const result={...data.boards[0],output:data.output};
                    if(inRoom)this.roomTraining=result;
                    else this.trainingResult=result;
                    this.render();
                    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)this.play();return;
                }
                if(roomCode!==this.room?.code)return;
                this.ownResult=data.boards;void this.change('submit',roomCode,data.boards.map(b=>b.actions));
            };
            this.render();
        }
        stopReplay(){clearInterval(this.playTimer);this.playTimer=null;}
        leave(){
            this.live=false;this.cancelNetwork();this.stopRun();this.stopReplay();clearInterval(this.pollTimer);
            window.removeEventListener('pq-account-change',this.onAccount);document.removeEventListener('visibilitychange',this.onVisible);
            this.root.replaceChildren();
        }
        render(){
            this.stopReplay();
            const panel=el('section','rd-shell');
            const headline=el('div','rd-head');
            const intro=el('div');
            intro.append(el('h1','','Роботын халз сорил'),el('p','','Робот урдах хана, хөл доорх эрдэнээ мэдэрнэ. Дараагийн үйлдлийг таны Python код сонгоно.'));
            headline.append(intro);
            const tabs=el('div','rd-tabs');
            for(const [id,title] of [['practice','Бэлтгэл хийх'],['online','Халз тоглох']]){
                const tab=button('rd-tab',title,()=>this.setMode(id));
                tab.setAttribute('aria-pressed',String(id===this.mode));tab.disabled=this.mutating;tabs.append(tab);
            }
            panel.append(headline,tabs);
            this.notice=el('div','rd-notice'+(this.bad?' rd-bad':''),this.message);
            this.notice.setAttribute('role','status');
            panel.append(this.notice);this.root.replaceChildren(panel);
            this.replay=null;
            if(this.mode==='practice'){this.workbench(panel,true);return;}
            if(!this.room){this.lobby(panel);return;}
            this.roomHeader(panel);
            if(this.room.status==='finished'){this.results(panel);return;}
            if(this.room[this.room.role]?.submitted){
                this.waiting(panel);return;
            }
            this.workbench(panel,false);
        }
        lobby(panel){
            const lobby=el('div','rd-lobby');
            const copy=el('div','rd-panel rd-brief');
            copy.append(el('h2','','Хоёр робот, ижил гурван талбай'));
            const list=el('ol');
            for(const text of ['Нэг сурагч өрөө нээж кодоо нөгөөдөө өгнө.',
                'Хоёулаа өөрийн decide функцийг бичээд нэг удаа уралдуулна.',
                'Олон талбай дуусгасан робот ялна. Тэнцвэл түүсэн эрдэнээр, бас тэнцвэл хамтдаа түрүүлнэ.']){
                list.append(el('li','',text));
            }
            copy.append(list);
            const controls=el('section','rd-panel rd-enter');
            if(!this.api || this.phase!=='member' || !this.owner){
                controls.append(el('h2','','Найзтайгаа тоглох'));
                if(this.phase==='loading' || (this.api && this.phase==='member')){
                    controls.append(el('p','','Бүртгэлийг шалгаж байна…'));
                }else if(this.api){
                    controls.append(el('p','','Хоёр компьютер дээр тус бүр өөрийн бүртгэлээр нэвтэрч өрөөнд нэгдээрэй.'),
                        button('rd-primary','Нэвтрэх',()=>this.options.openAccount ? this.options.openAccount() : window.GameAccount?.open()));
                }else{
                    controls.append(el('p','','Компьютерээс онлайн тоглоомыг нээгээд бүртгэлээрээ нэвтэрч өрөө үүсгэнэ. Бэлтгэлийг энд хийж болно.'));
                    const link=el('a','rd-primary','Онлайн тоглоом нээх');link.href='https://kodyn-nuudel.vercel.app/#duel';
                    controls.append(link);
                }
            }else{
                controls.append(el('h2','','Өрөөнд орох'));
                const create=button('rd-primary rd-create','Өрөө нээх',()=>void this.change('create'));
                create.disabled=this.mutating;controls.append(create);
                const form=el('form','rd-join-form');
                const label=el('label','','Найзын өрөөний код');const input=el('input','rd-join-code');
                input.type='text';input.maxLength=8;input.required=true;input.pattern='[0-9a-fA-F]{8}';
                input.placeholder='8 тэмдэгт';input.autocapitalize='characters';input.autocomplete='off';input.spellcheck=false;
                input.value=this.joinCode || '';input.oninput=()=>{this.joinCode=input.value.trim().toUpperCase();};
                label.append(input);const join=el('button','rd-join','Нэгдэх');join.type='submit';join.disabled=this.mutating;
                form.onsubmit=e=>{e.preventDefault();void this.change('join',input.value.toUpperCase().trim());};
                form.append(label,join);controls.append(form);
            }
            lobby.append(controls,copy);panel.append(lobby);
        }
        roomHeader(panel){
            const room=this.room, bar=el('div','rd-room');
            const info=el('div','rd-room-code');info.append(el('span','','Өрөөний код'),el('strong','',room.code));
            const copy=button('rd-copy','Хуулах',async()=>{
                try {await navigator.clipboard.writeText(room.code);this.note('Өрөөний код хуулагдлаа.');}
                catch {this.note('Найздаа өгөх код '+room.code);}
            });
            info.append(copy);bar.append(info);
            const seats=el('div','rd-seats');
            sides.forEach(side=>{
                const seat=el('span','rd-seat rd-'+side);
                const suffix=side===room.role?' · Та':(!room[side]?' · Хүлээж байна':'');
                seat.append(icon(side),el('span','',names[side]+suffix));seats.append(seat);
            });
            bar.append(seats);
            const exit=button('rd-exit',room.status==='finished'?'Өрөөнөөс гарах':'Өрөө хаах',()=>void this.change('leave',room.code));
            exit.disabled=this.mutating || this.running;bar.append(exit);panel.append(bar);
        }
        workbench(panel,practice){
            const wb=el('div','rd-workbench');
            const stage=el('section','rd-panel rd-stage');
            const board=this.rules.training;
            const result=practice?this.trainingResult:this.roomTraining;
            stage.append(el('h2','',practice?board.title:'Бэлтгэлийн талбай'),
                el('p','rd-sub',practice?'Эрдэнийг бүгдийг түүж дуусгаарай.':'Халз сорилд хоёр робот ижил гурван шинэ талбайд тоглоно.'));
            const frames=result?.frames || [this.rules.initialFrame(board)];
            this.replayView(stage,[{board,frames,side:practice?'host':this.room.role}]);
            stage.append(legend());
            if(result)stage.append(el('p','rd-run-summary'+(result.won?' rd-success':''),result.reason || (result.won?'Бүх эрдэнийг түүлээ.':'Бэлтгэл дууслаа.')));
            const editor=el('section','rd-panel rd-editor');
            const head=el('div','rd-editor-head');
            head.append(el('strong','','robot.py'),el('span','','Python 3'));
            editor.append(head);
            const code=el('textarea','rd-code');
            code.rows=11;code.maxLength=16000;code.spellcheck=false;code.autocapitalize='off';code.autocomplete='off';
            code.setAttribute('aria-label',practice?'Бэлтгэлийн Python код':'Халз сорилын Python код');
            code.value=practice?this.practiceCode:this.onlineCode;code.readOnly=this.running || this.mutating;
            const save=()=>{
                if(practice){this.practiceCode=code.value;this.draft('practice',code.value);}
                else {this.onlineCode=code.value;this.draft('code:'+this.room.code,code.value);}
            };
            code.addEventListener('input',save);
            code.onkeydown=e=>{
                if(e.isComposing || code.readOnly)return;
                if(e.key==='Enter' && (e.ctrlKey || e.metaKey)){e.preventDefault();this.run(true);return;}
                const indent=e.key==='Tab' && !e.shiftKey?'    ':null;
                if(indent!==null || (e.key==='Enter' && !e.shiftKey)){
                    e.preventDefault();
                    const line=code.value.slice(0,code.selectionStart).split('\n').pop();
                    const insert=indent ?? '\n'+line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');
                    if(code.value.length-(code.selectionEnd-code.selectionStart)+insert.length<=code.maxLength){
                        code.setRangeText(insert,code.selectionStart,code.selectionEnd,'end');save();
                    }
                }
            };
            editor.append(code);
            const controls=el('div','rd-editor-controls');
            if(this.running){
                controls.append(button('rd-neutral','Зогсоох',()=>{this.stopRun();this.note('Кодыг зогсоолоо.');this.render();}));
            }else{
                const test=button((practice?'rd-primary ':'')+'rd-run',practice?'▶  Туршиж ажиллуулах':'Бэлтгэлд турших',()=>this.run(true));
                test.disabled=this.mutating;controls.append(test);
                if(!practice){
                    const submit=button('rd-primary rd-submit','Кодоо уралдуулах',()=>this.run(false));
                    submit.disabled=this.mutating || this.room.status!=='playing';controls.append(submit);
                }
            }
            if(!practice && this.room.status==='waiting')controls.append(el('span','','Найзыгаа хүлээж байна…'));
            else if(!practice)controls.append(el('span','','Нэг удаа илгээнэ.'));
            editor.append(controls);
            if(result?.output){
                const output=el('details','rd-help');
                output.append(el('summary','','Python гаралт'),el('pre','rd-output',result.output));editor.append(output);
            }
            const reference=el('details','rd-help');
            const summary=el('summary','','Роботын мэдрэгч ба команд');
            reference.append(summary);
            for(const [key,val] of [['on_gem','Зогсож буй нүдэнд эрдэнэ байгаа эсэх.'],['wall_ahead','Урагш алхвал хана эсвэл талбайн зах таарах эсэх.'],['"collect"','Одоогийн нүднээс эрдэнээ түүх.'],['"right"','Байрандаа баруун тийш 90° эргэх.'],['"move"','Харсан зүгтээ нэг нүд урагшлах.']]){
                const row=el('div');row.append(el('code','',key),el('span','',val));reference.append(row);
            }
            editor.append(reference);wb.append(stage,editor);panel.append(wb);
        }
        waiting(panel){
            panel.append(el('h2','rd-section-title','Таны код илгээгдлээ'),el('p','rd-sub','Нөгөө робот кодоо илгээхэд хоёр үр дүн зэрэг нээгдэнэ.'));
            if(this.ownResult){
                const stage=el('section','rd-panel rd-stage');panel.append(stage);
                this.mapTabs(stage,()=>this.render());
                const b=this.ownResult[this.mapIndex];
                this.replayView(stage,[{board:this.rules.boards[this.mapIndex],frames:b.frames,side:this.room.role}]);
            }
        }
        results(panel){
            const room=this.room, a=room.host.result,b=room.guest.result;
            const diff=(a.solved-b.solved) || (a.gems-b.gems);
            const winner=diff>0?'host':diff<0?'guest':null;
            const banner=el('div','rd-finish');
            banner.append(el('h2','',winner?names[winner]+' түрүүллээ!':'Хоёр робот тэнцлээ!'));
            const cards=el('div','rd-scores');
            for(const side of sides){
                const own=room[side].result;
                const line=el('div','rd-score rd-'+side);line.append(icon(side),
                    el('b','',names[side]+(room.role===side?' · Та':'')),
                    el('span','',own.solved+'/3 талбай'),
                    el('span','','◆ '+own.gems+' эрдэнэ'));cards.append(line);
            }
            banner.append(cards);panel.append(banner);
            const stage=el('section','rd-panel rd-stage');
            this.mapTabs(stage,()=>this.render());
            const board=this.rules.boards[this.mapIndex];
            this.replayView(stage,sides.map(side=>({board,side,frames:this.rules.replay(board,room[side].result.traces[this.mapIndex]),
                won:room[side].result.boards[this.mapIndex]})));
            stage.append(legend());panel.append(stage);
        }
        mapTabs(container,change){
            const tabs=el('div','rd-map-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Дахин үзэх талбай');
            this.rules.boards.forEach((b,i)=>{
                const tab=button('rd-map-choice',b.title,()=>{this.mapIndex=i;change();});
                tab.setAttribute('aria-pressed',String(this.mapIndex===i));tabs.append(tab);
            });
            container.append(tabs);
        }
        replayView(container,players){
            const boards=el('div',players.length===2?'rd-fields rd-paired':'rd-fields');
            const panes=players.map(player=>{
                const pane=el('div','rd-court rd-'+player.side);
                if(players.length===2)pane.append(el('p','rd-caption',names[player.side]+' · '+(player.won?'Давсан':'Дуусаагүй')));
                const canvas=el('canvas','rd-board');canvas.setAttribute('role','img');
                const field=el('div','rd-grid');field.append(canvas);pane.append(field);
                const detail=el('p','rd-sensors');pane.append(detail);boards.append(pane);
                return {...player,canvas,detail};
            });
            container.append(boards);
            const max=Math.max(...players.map(p=>p.frames.length))-1;
            this.replay={panes,cursor:0,max};
            if(max>0){
                const track=el('div','rd-replay');
                const prev=button('rd-step','‹',()=>{this.stopReplay();this.showFrame(this.replay.cursor-1);});
                prev.setAttribute('aria-label','Өмнөх алхам');
                const next=button('rd-step','›',()=>{this.stopReplay();this.showFrame(this.replay.cursor+1);});
                next.setAttribute('aria-label','Дараагийн алхам');
                const toggle=button('rd-play','Тоглуулах',()=>this.play());
                const range=el('input','rd-track');range.type='range';range.min=0;range.max=max;range.step=1;
                range.setAttribute('aria-label','Роботын алхам');range.oninput=()=>{this.stopReplay();this.showFrame(Number(range.value));};
                const count=el('span','rd-count');track.append(toggle,prev,range,next,count);
                container.append(track);Object.assign(this.replay,{prev,next,toggle,range,count});
            }
            this.showFrame(0);
        }
        showFrame(index){
            if(!this.replay)return;
            const r=this.replay;
            r.cursor=Math.min(r.max,Math.max(0,index));
            for(const {board,frames,canvas,side,detail} of r.panes){
                const frame=frames[Math.min(frames.length-1,r.cursor)];
                drawBoard(canvas,board,frame,side);
                const state=frame.onGem?'Хөл доор эрдэнэ бий':'Хөл доор эрдэнэ алга';
                detail.textContent=(frame.action?actions[frame.action]+' · ':'')+state+' · '+(frame.wallAhead?'Урд хана байна':'Урд зам чөлөөтэй');
            }
            if(r.range){
                r.range.value=r.cursor;r.count.textContent=r.cursor+' / '+r.max;
                r.prev.disabled=r.cursor===0;r.next.disabled=r.cursor===r.max;
                r.toggle.textContent=this.playTimer?'Түр зогсоох':(r.cursor===r.max?'Дахин үзэх':'Тоглуулах');
            }
        }
        play(){
            const r=this.replay;
            if(!r?.max)return;
            if(this.playTimer){this.stopReplay();this.showFrame(r.cursor);return;}
            if(r.cursor===r.max)this.showFrame(0);
            this.playTimer=setInterval(()=>{
                if(this.replay!==r || !this.live){this.stopReplay();return;}
                if(r.cursor+1>=r.max)this.stopReplay();
                this.showFrame(r.cursor+1);
            },340);
            this.showFrame(r.cursor);
        }
    }
    let current;
    window.RobotDuelUI=Object.freeze({
        mount(root,options){current?.leave();current=new Arena(root,options);},
        leave(){current?.leave();current=null;}
    });
})();
