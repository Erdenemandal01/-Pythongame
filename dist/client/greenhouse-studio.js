(() => {
    'use strict';
    const workshopText = globalThis.PQEnglishWorkshops?.literal || (text => text);
    const firstSoil = [18, 30, 65];
    const fiveSoil = [29, 68, 30, 53, 12];
    const starters = {
        first: 'for i in range(len(moisture)):\n    if moisture[i] < 30:\n        water(i)',
        five: 'for i in range(3):\n    if moisture[i] <= 30:\n        water(i)',
        custom: workshopText('for i in range(len(moisture)):\n    # Хуурай савыг энд шалгаарай\n    pass')
    };
    const titles = {
        first: workshopText('Гурван сав, хоёр дусал'), five: workshopText('Таван савны цэцэрлэг'),
        custom: workshopText('Миний зохиосон сорил'), friend: workshopText('Найзын хүлэмж')
    };
    const modes = Object.keys(titles);
    const cleanSoil = values => Array.isArray(values) && values.length === 5 &&
        values.every(n => Number.isInteger(n) && n >= 0 && n <= 100);
    const soilOf = (state, mode) => mode === 'first' ? firstSoil :
        mode === 'five' ? fiveSoil : mode === 'custom' ? state.customSoil : state.friendSoil;
    const goal = soil => soil.flatMap((n,i) => n <= 30 ? [i] : []);
    const same = (a,b) => a.length === b.length && a.every((n,i) => b[i] === n);
    const today = () => {
        const date = new Date();
        return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
    };
    function record(raw, mode, length) {
        return {
            code: typeof raw?.code === 'string' ? raw.code.slice(0,16000) : (starters[mode] ?? starters.custom),
            prediction: Array.isArray(raw?.prediction) ? [...new Set(raw.prediction.filter(i =>
                Number.isInteger(i) && i >= 0 && i < length))].sort((a,b) => a-b) : [],
            predicted: raw?.predicted === true,
            verified: raw?.verified === true
        };
    }
    function normalize(raw) {
        const state = {
            mode: modes.includes(raw?.mode) ? raw.mode : 'first',
            customSoil: cleanSoil(raw?.customSoil) ? raw.customSoil.slice() : [42, 30, 11, 72, 29],
            friendSoil: cleanSoil(raw?.friendSoil) ? raw.friendSoil.slice() : null,
            won: ['first','five'].filter(id => Array.isArray(raw?.won) && raw.won.includes(id)),
            planted: /^\d{4}-\d\d-\d\d$/.test(raw?.planted || '') ? raw.planted : '',
            plantedAtLesson: Number.isSafeInteger(raw?.plantedAtLesson) && raw.plantedAtLesson >= 0 ? raw.plantedAtLesson : 0,
            growth: Number.isInteger(raw?.growth) ? Math.max(0,Math.min(3,raw.growth)) : 0,
            records: {}
        };
        for (const id of modes) state.records[id] = record(raw?.records?.[id],id,id==='first'?3:5);
        if (state.mode === 'five' && !state.won.includes('first')) state.mode = 'first';
        return state;
    }
    function el(tag, cls, label) {
        const item = document.createElement(tag);
        if (cls) item.className = cls;
        if (label !== undefined) item.textContent = label;
        return item;
    }
    function button(cls, text, fn) {
        const item = el('button',cls,text);
        item.type = 'button';
        item.addEventListener('click',fn);
        return item;
    }
    // Small raster sprites keep leaves, roots, blooms and water readable at classroom projection sizes.
    function drawPot(canvas, stage, wet, variety) {
        if (canvas._draw === [stage,wet,variety].join()) return;
        canvas._draw = [stage,wet,variety].join();
        const g=canvas.getContext('2d');
        if (!g) return;
        const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
        g.clearRect(0,0,48,46);
        const leaf=(x,y,mirror)=>{
            const rows=['001111','011111','111110','111000'];
            rows.forEach((row,dy)=>[...row].forEach((cell,dx)=>{
                if(cell==='1')rect(x+(mirror?5-dx:dx),y+dy,1,1,dy<2?'#abe779':'#4caa63');
            }));
        };
        const bloom=['#ffcd66','#ff94a2','#bfb0ff','#ffb175','#98dbfb'][variety%5];
        const h=[4,8,13,16][stage];
        rect(23,30-h,2,h,'#407d54');rect(24,30-h,1,h,'#94d16e');
        leaf(18,28-h/2|0,true);leaf(24,28-h,false);
        if(stage>0){leaf(18,23-h/2|0,true);leaf(24,24,false);}
        if(stage>1){
            rect(23,27-h,4,4,'#42925d');rect(22,25-h,5,4,bloom);rect(23,24-h,3,1,bloom);
        }
        if(stage===3){
            rect(21,9,6,4,bloom);rect(18,12,5,5,bloom);rect(26,12,5,5,bloom);
            rect(21,16,6,4,bloom);rect(22,13,5,4,'#ffeea3');rect(24,14,2,2,'#d78637');
        }
        rect(8,42,32,2,'#334742');rect(11,44,26,1,'#334742');
        rect(10,29,28,5,'#6d413f');rect(12,28,24,2,'#714644');rect(12,30,24,3,'#edaa76');
        rect(12,34,24,4,'#834c49');rect(14,38,20,4,'#834c49');rect(16,42,16,1,'#834c49');
        rect(14,34,19,4,'#cf815d');rect(16,38,15,4,'#bf7056');rect(15,34,3,4,'#e39669');
        rect(29,34,4,4,'#b26953');rect(28,38,3,3,'#ad634e');
        for(const x of [16,22,28]){
            rect(x,34,5,1,'#ffe0a4');rect(x,35,1,3,'#ffe0a4');
            rect(x+3,35,2,2,'#ffe0a4');rect(x+2,37,2,1,'#ffe0a4');
        }
        if(wet){rect(12,29,24,2,'#75cfc7');rect(31,30,2,4,'#7be0d9');}
    }
    function drawGlass(canvas) {
        const c=canvas.getContext('2d');
        if(!c)return;
        const w=384,h=72;
        canvas.width=w;canvas.height=h;
        const bar=(x,y,a,b,color)=>{c.fillStyle=color;c.fillRect(x,y,a,b);};
        const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#77bdc5');sky.addColorStop(.6,'#d3e9b6');sky.addColorStop(1,'#f7d99e');
        c.fillStyle=sky;c.fillRect(0,0,w,h);
        bar(309,12,15,17,'#fff1b6');bar(306,16,21,9,'#fff1b6');
        const hills=(base,amp,color,offset)=>{for(let x=0;x<w;x+=3){
            const y=Math.round(base+Math.sin(x*.029+offset)*amp+Math.sin(x*.065+offset)*amp*.38);
            bar(x,y,3,h-y,color);
        }};
        hills(41,6,'#acd0b3',0);hills(49,5,'#80b8a2',3);hills(59,6,'#65998b',2);
        // Overlapping wooden strips at the foot of the glass echo a ger's khana.
        for(let x=-24;x<w;x+=24){
            for(let step=0;step<12;step++){
                bar(x+step*2,49+step*2,3,2,'#897b5b');
                bar(x+22-step*2,49+step*2,3,2,'#a59972');
            }
        }
        for(let n=0;n<9;n++){const x=n*51-10;bar(x,0,2,72,'#648f83');bar(x+2,0,1,72,'#b5d3a8');}
        bar(0,8,w,2,'#739c86');bar(0,10,w,1,'#c4d9ae');bar(0,49,w,2,'#679685');
        for(let x=0;x<w;x+=4){const roof=8+Math.floor(Math.abs(x%102-51)*.33);bar(x,roof,4,1,'#abd1ba');}
        for(let i=0;i<12;i++){const x=(i*79+9)%w,len=4+((i*7)%16);bar(x,0,1,len,'#417d66');
            for(let y=2;y<len;y+=4){bar(x+(y%8===2?-3:1),y,3,2,'#548c69');}}
    }
    class Studio {
        constructor(root,ctx) {
            this.root=root;this.ctx=ctx;this.state=ctx.state;this.generation=0;this.frames=[];this.cursor=-1;
            this.render();
            // Restore finishes setting the cloud save's baseline in the current call stack.
            // Earned growth is a new change and must be applied after that baseline is final.
            queueMicrotask(()=>{
                if(active!==this)return;
                this.grow();
                if(this.soil)this.paint();else this.paintGrowth();
            });
        }
        growthTarget() {
            if(!this.state.planted)return 0;
            const later=this.state.planted<today() || (this.ctx.lessonProgress?.()??0)>this.state.plantedAtLesson;
            return 1 + Number(later) + Number(this.state.won.includes('five'));
        }
        grow(){
            const next=Math.max(this.state.growth,this.growthTarget());
            if(this.state.growth!==next){this.state.growth=next;this.ctx.save();}
        }
        get mode(){return this.state.mode;}
        get rec(){return this.state.records[this.mode];}
        get soil(){return soilOf(this.state,this.mode);}
        cancel(){
            this.generation++;clearTimeout(this.timer);this.timer=0;
            if(this.loading)this.ctx.stop();this.loading=false;
        }
        clearTrace(){
            this.cancel();this.frames=[];this.cursor=-1;this.result=null;this.finished=false;this.earned=0;
        }
        switchTo(mode){
            this.clearTrace();this.state.mode=mode;this.ctx.save();this.render();
        }
        leave(){this.clearTrace();}
        render(){
            this.builderChanged=false;
            const shell=el('section','gh-shell');
            const head=el('header','gh-header');
            head.append(el('h1','',workshopText('Миний хүлэмж')));
            const growth=el('div','gh-growth');
            const progress=el('span','gh-growth-marks');
            progress.setAttribute('aria-hidden','true');
            for(let i=0;i<3;i++){const m=el('i');if(i<this.state.growth)m.className='filled';progress.append(m);}
            growth.append(progress,el('span','', [workshopText('Үр суулгалаа'),workshopText('Үр соёоллоо'),workshopText('Нахиа гарлаа'),workshopText('Цэцэг дэлгэрлээ')][this.state.growth]));
            this.growth=growth;head.append(growth);
            const tabs=el('nav','gh-tabs');tabs.setAttribute('aria-label',workshopText('Хүлэмжийн талбай'));
            const names=[workshopText('Гурван сав'),workshopText('Таван сав'),workshopText('Сорил зохиох'),workshopText('Кодоор нээх')];
            modes.forEach((mode,i)=>{
                const b=button('gh-tab',names[i],()=>this.switchTo(mode));
                b.dataset.mode=mode;b.setAttribute('aria-pressed',String(this.mode===mode));
                b.disabled=mode==='five'&&!this.state.won.includes('first');
                if(b.disabled)b.title=workshopText('Гурван савыг зөв услаад нээнэ.');
                tabs.append(b);
            });
            shell.append(head,tabs);
            if(this.mode==='friend')shell.append(this.friendForm());
            if(this.soil){
                if(this.mode==='custom')shell.append(this.builder());
                const study=el('div','gh-study');
                const heading=el('h2','',titles[this.mode]);
                const brief=el('p','',workshopText('Хөрсний чийг 30% буюу түүнээс бага бол нэг дусал ус өг. Бусад савыг хэвээр үлдээгээрэй.'));
                study.append(heading,brief);shell.append(study,this.bench(),this.editor());
                if(this.mode==='custom'){
                    const box=el('section','gh-sharebox');
                    box.append(el('h3','',workshopText('Найздаа сорил илгээх')));
                    this.shareHint=el('p','',workshopText('Бүх саваа дүрмийн дагуу услаад сорилын кодоо аваарай.'));
                    this.shareButton=button('gh-share',workshopText('Сорилын код авах'),()=>this.showShare());
                    this.shareResult=el('div','gh-share-result');
                    box.append(this.shareHint,this.shareButton,this.shareResult);shell.append(box);
                }
            }
            this.root.replaceChildren(shell);
            if(this.soil)this.paint();
        }
        bench(){
            const section=el('section','gh-bench');const scene=el('div','gh-scene');
            const glass=el('canvas','gh-glass');glass.setAttribute('aria-hidden','true');drawGlass(glass);scene.append(glass);
            const shelf=el('div','gh-shelf');this.pots=[];
            this.soil.forEach((n,i)=>{
                const p=button('gh-pot','',()=>{
                    if(this.rec.predicted)return;
                    const selected=new Set(this.rec.prediction);
                    if(selected.has(i))selected.delete(i);else selected.add(i);
                    this.rec.prediction=[...selected].sort((a,b)=>a-b);
                    this.ctx.save();this.paint();
                });
                const canvas=el('canvas','gh-sprout');canvas.width=48;canvas.height=46;canvas.setAttribute('aria-hidden','true');
                const name=el('span','gh-pot-label',workshopText('Сав ')+(i+1));
                const pct=el('b','gh-soil',n+'%');const indicator=el('span','gh-indicator');
                p.dataset.pot=i;p.append(canvas,name,pct,indicator);shelf.append(p);
                this.pots.push({p,canvas,indicator});
            });
            scene.append(shelf);section.append(scene);
            const panel=el('div','gh-bench-foot');
            this.note=el('p','gh-pred-note');
            this.predict=button('gh-predict',workshopText('Таамгаа хадгалах'),()=>{
                if(this.rec.predicted){
                    this.clearTrace();this.rec.predicted=false;
                }else this.rec.predicted=true;
                this.ctx.save();this.paint();
                if(this.rec.predicted)this.code.focus({preventScroll:true});
            });
            this.drops=el('span','gh-drops');
            panel.append(this.drops,this.note,this.predict);section.append(panel);return section;
        }
        editor(){
            const panel=el('section','gh-work');
            const codeSide=el('section','gh-code-side');
            const top=el('div','gh-file');top.append(el('strong','','greenhouse.py'));
            const tag=el('span','','Python 3');top.append(tag);codeSide.append(top);
            const area=el('div','gh-code-wrap');this.mark=el('div','gh-active-line');
            this.numbers=el('div','gh-numbers');this.numbers.setAttribute('aria-hidden','true');
            this.code=el('textarea','gh-code');this.code.value=this.rec.code;this.code.maxLength=16000;
            this.code.spellcheck=false;this.code.wrap='off';this.code.setAttribute('aria-label',workshopText('Хүлэмжийн Python код'));
            this.code.oninput=()=>{this.clearTrace();this.rec.code=this.code.value;this.rec.verified=false;this.ctx.save();this.paint();};
            this.code.onscroll=()=>this.paintLine();this.code.onkeydown=e=>{
                if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();this.execute(true);}
                if(e.key==='Tab'&&!e.shiftKey&&!this.code.readOnly){e.preventDefault();this.code.setRangeText('    ',this.code.selectionStart,this.code.selectionEnd,'end');this.code.oninput();}
            };
            area.append(this.mark,this.numbers,this.code);codeSide.append(area);
            const operations=el('div','gh-operations');
            this.run=button('gh-run',workshopText('▶ Ажиллуулах'),()=>this.execute(true));
            this.step=button('gh-step',workshopText('Нэг алхам'),()=>this.execute(false));
            this.stop=button('gh-stop',workshopText('Зогсоох'),()=>{
                this.cancel();this.paint();this.report(workshopText('Тоглуулалт зогслоо. «Нэг алхам» дарж мөрөө дагаарай.'));
            });
            operations.append(this.run,this.step,this.stop);codeSide.append(operations);
            const readout=el('section','gh-readout');readout.append(el('h3','',workshopText('Кодын алхам')));
            this.trace=el('div','gh-trace');this.variables=el('div','gh-vars');this.lineSource=el('code','gh-source');
            this.status=el('p','gh-status');this.status.setAttribute('role','status');
            this.output=el('pre','gh-output');
            this.next=button('gh-next',workshopText('Таван савыг нээх →'),()=>this.switchTo('five'));
            readout.append(this.trace,this.lineSource,this.variables,this.status,this.output,this.next);
            const help=el('details','gh-help');
            help.append(el('summary','',workshopText('Кодын тусламж')),el('p','',
                workshopText('moisture нь савнуудын чийгийг зүүнээс баруун тийш жагсаана. Эхний савны дугаар код дотор 0 байдаг. water(i) нь тэр дугаартай саванд нэг дусал ус өгнө.')),
                el('p','',this.mode==='first'?workshopText('30 нь 30-аас бага уу? Тэнцүү тохиолдлыг багтаахдаа <= гэж бичдэг.'):
                    workshopText('range(len(moisture)) нь жагсаалтын бүх савны дугаарыг нэг нэгээр авна.')));
            panel.append(codeSide,readout,help);return panel;
        }
        report(text, bad=false){
            if(!this.status)return;
            this.status.textContent=text;this.status.classList.toggle('gh-bad',bad);
        }
        async execute(play){
            if(!this.rec.predicted || this.loading)return;
            if(this.timer){clearTimeout(this.timer);this.timer=0;}
            if(!this.result){
                const generation=++this.generation;
                this.loading=true;this.paint();this.report(workshopText('Python кодыг ажиллуулж байна…'));
                try{
                    const result=await this.ctx.run(this.rec.code,{moisture:this.soil.slice()});
                    if(generation!==this.generation)return;
                    this.result=result;this.frames=Array.isArray(result.frames)?result.frames:[];
                }catch(error){
                    if(generation!==this.generation)return;
                    this.loading=false;this.paint();this.report(error.message,true);return;
                }
                this.loading=false;
            }
            if(this.finished){this.finished=false;this.cursor=-1;}
            this.advance(play);
        }
        advance(play){
            if(this.cursor+1<this.frames.length)this.cursor++;
            if(this.cursor+1>=this.frames.length){
                this.finished=true;this.timer=0;this.complete();this.paint();return;
            }
            this.timer=play?setTimeout(()=>this.advance(true),430):0;
            this.paint();
        }
        complete(){
            this.earned=0;
            if(!this.result?.won||!this.result.ok)return;
            this.rec.verified=true;
            if(['first','five'].includes(this.mode)&&!this.state.won.includes(this.mode)){
                this.state.won.push(this.mode);
                if(!this.state.planted){
                    this.state.planted=today();
                    this.state.plantedAtLesson=this.ctx.lessonProgress?.()??0;
                }
                this.earned=this.mode==='first'?50:100;
                this.grow();
                this.ctx.onMilestone?.();
            }
            this.ctx.save();
        }
        paintLine(){
            const frame=this.frames[this.cursor];
            const line=this.finished&&this.result?.errorLine?this.result.errorLine:frame?.line;
            const top=12+(line-1)*24-this.code.scrollTop;
            this.mark.hidden=!line||top<=-12||top>=this.code.clientHeight;
            if(!this.mark.hidden)this.mark.style.top=top+'px';
            this.numbers.style.transform='translateY('+(-this.code.scrollTop)+'px)';
        }
        paint(){
            const frame=this.frames[this.cursor];const water=frame?.watered||[];
            const rec=this.rec, expected=goal(this.soil);
            this.pots.forEach(({p,canvas,indicator},i)=>{
                const selected=rec.prediction.includes(i),wet=water.includes(i),current=frame?.pot===i;
                p.setAttribute('aria-pressed',String(selected));
                p.setAttribute('aria-disabled',String(rec.predicted));
                p.setAttribute('aria-label',workshopText('Сав ')+(i+1)+workshopText(', чийг ')+this.soil[i]+'%'+(wet?workshopText(', усалсан'):'')+(selected?workshopText(', таамагт сонгосон'):''));
                p.classList.toggle('gh-current',current);p.classList.toggle('gh-wet',wet);
                indicator.textContent=wet?workshopText('◆ Усалсан'):selected?workshopText('✓ Сонгосон'):'';
                drawPot(canvas,this.state.growth,wet,i);
            });
            this.drops.textContent='◈ '+(frame?.remaining??expected.length)+' / '+expected.length+workshopText(' дусал');
            this.note.textContent=rec.predicted?workshopText('Миний таамаг · ')+(rec.prediction.length?rec.prediction.map(i=>i+1).join(', ')+workshopText('-р сав'):workshopText('услах савгүй')):
                workshopText('Аль саванд ус өгөх вэ? Савнуудаа сонгоод таамгаа хадгалаарай.');
            this.predict.textContent=rec.predicted?workshopText('Таамгаа засах'):workshopText('Таамгаа хадгалах');
            this.code.readOnly=!rec.predicted;
            const numbers=this.code.value.split('\n').map((_,i)=>i+1).join('\n');
            if(this.numbers.textContent!==numbers)this.numbers.textContent=numbers;
            const line=this.finished&&this.result?.errorLine?this.result.errorLine:frame?.line;
            if(line&&this.lastLine!==line){
                const y=(line-1)*24;
                if(y<this.code.scrollTop||y+36>this.code.scrollTop+this.code.clientHeight)this.code.scrollTop=Math.max(0,y-36);
            }
            this.lastLine=line;this.paintLine();
            this.run.disabled=!rec.predicted||this.loading||!!this.timer;
            this.step.disabled=!rec.predicted||this.loading;
            this.stop.disabled=!this.loading&&!this.timer;
            this.trace.textContent=frame?workshopText('Алхам ')+(this.cursor+1)+' / '+this.frames.length+workshopText(' · Мөр ')+(line??frame.line):workshopText('Ажиллуулсан мөрөө энд харна.');
            this.lineSource.hidden=!line;
            this.lineSource.textContent=line?(this.code.value.split('\n')[line-1]??'').trim():'';
            this.variables.replaceChildren();
            if(frame){
                const values=Object.entries(frame.variables||{}).slice(0,4);
                if(frame.pot!=null)values.push([workshopText('Чийг'),this.soil[frame.pot]+'%']);
                for(const [k,v] of values)this.variables.append(el('code','',k+' = '+String(v)));
            }
            const passed=this.finished && this.result?.ok && this.result?.won;
            if(this.finished){
                const predictedRight=same(rec.prediction,expected);
                const text=passed?(workshopText('✓ Бүх савыг зөв усаллаа. ')+(this.earned?'+'+this.earned+' XP. ':'')+(predictedRight?workshopText('Таамаг таарлаа.'):workshopText('Аль сав таны таамгаас өөр байсныг хараарай.'))):
                    (this.result?.error||workshopText('Зарим сав дүрэмтэй таарсангүй. Кодоо засаж дахин туршаарай.'));
                this.report(text,!passed);
            }else if(this.loading)this.report(workshopText('Python кодыг ажиллуулж байна…'));
            else if(frame)this.report(frame.added?.length?workshopText('Нэг дусал ус саванд орлоо.'):'');
            else this.report(rec.predicted?workshopText('Кодоо туршаарай. Мөр бүрийг тусад нь харах бол «Нэг алхам» дар.'):workshopText('Кодоо ажиллуулахаас өмнө услах савнуудаа таагаарай.'));
            this.next.hidden=this.mode!=='first'||!this.state.won.includes('first');
            this.output.textContent=this.finished?(this.result?.output||''):'';this.output.hidden=!this.output.textContent;
            const unlock=this.root.querySelector('[data-mode="five"]');
            if(unlock && this.state.won.includes('first')){unlock.disabled=false;unlock.removeAttribute('title');}
            this.paintGrowth();
            if(this.mode==='custom'){
                this.shareButton.disabled=!rec.verified||this.builderChanged;
                this.shareHint.textContent=this.builderChanged?workshopText('«Чийгийг тохируулах» дарж шинэ утгуудаа туршаарай.'):
                    rec.verified?workshopText('Энэ кодоор найз чинь таны таван савыг өөрийн хүлэмжид нээнэ.'):workshopText('Бүх саваа дүрмийн дагуу услаад сорилын кодоо аваарай.');
                if(this.shareButton.disabled)this.shareResult.replaceChildren();
            }
        }
        paintGrowth(){
            this.growth.lastChild.textContent=[workshopText('Үр суулгалаа'),workshopText('Үр соёоллоо'),workshopText('Нахиа гарлаа'),workshopText('Цэцэг дэлгэрлээ')][this.state.growth];
            this.growth.querySelectorAll('i').forEach((dot,i)=>dot.classList.toggle('filled',i<this.state.growth));
        }
        builder(){
            const box=el('section','gh-builder');box.append(el('h3','',workshopText('Таван савны чийгийг тохируул')));
            const form=el('form','gh-input-row');const fields=[];
            this.state.customSoil.forEach((n,i)=>{
                const label=el('label','', (i+1)+workshopText('-р сав (%)'));
                const input=el('input');input.type='number';input.min=0;input.max=100;input.step=1;input.required=true;input.value=n;
                label.append(input);fields.push(input);form.append(label);
            });
            const apply=el('button','gh-apply',workshopText('Чийгийг тохируулах'));apply.type='submit';form.append(apply);
            form.oninput=()=>{
                this.builderChanged=!same(fields.map(input=>input.valueAsNumber),this.state.customSoil);
                this.paint();
            };
            form.onsubmit=e=>{
                e.preventDefault();const next=fields.map(input=>input.valueAsNumber);
                if(!cleanSoil(next)||same(next,this.state.customSoil))return;
                this.clearTrace();this.state.customSoil=next;
                this.state.records.custom=record({code:this.rec.code},'custom',5);this.ctx.save();this.render();
            };
            box.append(form);return box;
        }
        showShare(){
            if(!this.rec.verified||this.builderChanged)return;
            const value=window.GreenhouseShare.encode(this.state.customSoil);
            const field=el('input','gh-code-value');field.readOnly=true;field.value=value;field.setAttribute('aria-label',workshopText('Найздаа өгөх сорилын код'));
            const copy=button('gh-copy',workshopText('Код хуулах'),async()=>{
                try{await navigator.clipboard.writeText(value);copy.textContent=workshopText('Хууллаа');}
                catch{field.focus();field.select();copy.textContent=workshopText('Ctrl+C дарж хуулна уу');}
            });
            this.shareResult.replaceChildren(field,copy);field.focus();field.select();
        }
        friendForm(){
            const section=el('section','gh-builder');section.append(el('h3','',workshopText('Найзын сорилыг нээх')));
            const form=el('form','gh-input-row'),label=el('label','',workshopText('Сорилын богино код'));
            const field=el('input','gh-friend-code');field.required=true;field.maxLength=32;field.placeholder='G1-XXXX-XXXX';field.autocomplete='off';field.spellcheck=false;
            if(this.state.friendSoil)field.value=window.GreenhouseShare.encode(this.state.friendSoil);
            label.append(field);const open=el('button','gh-open-code',workshopText('Сорил нээх'));open.type='submit';
            form.append(label,open);const status=el('p','gh-friend-status');status.setAttribute('role','status');
            form.onsubmit=e=>{
                e.preventDefault();try{
                    const soil=window.GreenhouseShare.decode(field.value);
                    if(this.state.friendSoil && same(soil,this.state.friendSoil)){status.textContent=workshopText('Энэ сорил нээлттэй байна.');return;}
                    this.clearTrace();this.state.friendSoil=soil;
                    this.state.records.friend=record({code:this.state.records.friend.code},'friend',5);
                    this.ctx.save();this.render();
                }catch(error){status.textContent=error.message;}
            };
            section.append(form,status);return section;
        }
    }
    let active;
    window.GreenhouseStudio = {
        normalize,
        mount(root,ctx){active?.leave();active=new Studio(root,ctx);},
        leave(){active?.leave();active=null;}
    };
})();
