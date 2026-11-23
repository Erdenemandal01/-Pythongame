(() => {
    'use strict';
    const studies={
        groove:{
            title:'Бөмбөрийн хээ', goal:'Нам бөмбөр, цан, цохилуур, цан гэсэн дөрвөн авиаг for давталтаар хоёр удаа тоглуулаарай. Авиа бүр нэг цохилт үргэлжилнэ.',
            hint:'range(1) хэдэн удаа давтаж байна вэ? Тоог нь өөрчлөөд үз.',
            a:'for i in range(1):\n    drum("kick")\n    drum("hat")\n    drum("snare")\n    drum("hat")',
            b:'for i in range(1):\n    drum("kick")\n    drum("hat")\n    drum("snare")\n    rest()'
        },
        steps:{
            title:'Нотын шат', goal:'C4, E4, G4, C5 дөрвөн нотыг жагсаалтаас дарааллаар нь тоглуул. Төгсгөлд нэг цохилт амраарай.',
            hint:'Жагсаалт дахь G4-ийн ард "C5" нэмээрэй. for нь жагсаалтын бүх нотоор явна.',
            a:'notes = ["C4", "E4", "G4"]\nfor note in notes:\n    play(note)\nrest()',
            b:'notes = ["G4", "E4", "C4"]\nfor note in notes:\n    play(note)\nrest()'
        },
        echo:{
            title:'Цуурай', goal:'Өөрийн функцээр G4, E4, нэг амралт гэсэн хээг бүтээ. Ижил хээг хоёр удаа дуугаргаарай.',
            hint:'def echo() нь хээг хадгална. Хамгийн сүүлд echo() дуудлагыг дахиад нэг бичээрэй.',
            a:'def echo():\n    play("G4")\n    play("E4")\n    rest()\n\necho()',
            b:'def echo():\n    play("G4", 0.5)\n    play("E4", 0.5)\n    rest()\n\necho()'
        }
    };
    const voices=[
        {id:'kick',name:'Нам бөмбөр',short:'БҮМ',color:'#ff967d'},
        {id:'snare',name:'Цохилуур',short:'ТАК',color:'#e9bb79'},
        {id:'hat',name:'Цан',short:'ЦИК',color:'#8cdece'},
        {id:'note',name:'Нот',short:'ДО',color:'#bcabff'},
        {id:'rest',name:'Амралт',short:'·',color:'#99aac2'}
    ];
    const pitch={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    const labelFor=event=>event.kind==='note'?event.value:voices.find(v=>v.id===(event.value||'rest')).short;
    const trackFor=event=>event.kind==='drum'?event.value:event.kind;
    const cleanCode=(s,fallback)=>typeof s==='string'?s.slice(0,16000):fallback;
    function normalize(raw={}) {
        raw=raw||{};
        const songs={};
        for(const [id,study] of Object.entries(studies)){
            const saved=raw.songs?.[id];
            songs[id]={a:cleanCode(saved?.a,study.a),b:cleanCode(saved?.b,study.b)};
        }
        return {study:Object.hasOwn(studies,raw.study)?raw.study:'groove',slot:raw.slot==='b'?'b':'a',
            bpm:Number.isInteger(raw.bpm)?Math.max(60,Math.min(180,raw.bpm)):110,songs,
            won:Object.keys(studies).filter(id=>Array.isArray(raw.won)&&raw.won.includes(id))};
    }
    const node=(tag,cls,text)=>{
        const e=document.createElement(tag); if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;
    };
    const btn=(label,cls,fn)=>{const e=node('button',cls,label);e.type='button';e.onclick=fn;return e;};
    function option(value,label){const e=node('option','',label);e.value=value;return e;}

    class Synth {
        constructor(){this.sources=new Set();}
        async unlock() {
            if(!this.context) {
                const AC=window.AudioContext||window.webkitAudioContext;
                if(!AC)throw Error('Браузер дуу тоглуулахыг дэмжихгүй байна. Хэмнэлийн хүснэгтээр нотоо шалгаарай.');
                const ctx=this.context=new AC();
                this.master=ctx.createGain();this.master.gain.value=.35;this.master.connect(ctx.destination);
                const noise=this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.35),ctx.sampleRate);
                const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
            }
            if(this.context.state!=='running')await this.context.resume();
            return this.context;
        }
        hit(event,at,beat) {
            if(event.kind==='rest')return;
            const ctx=this.context;
            const env=ctx.createGain();
            const key=event.kind==='note'?'note':event.value;
            const duration=Math.min(beat*event.ticks/4*.92, key==='note'?5:key==='kick'?.23:key==='snare'?.15:.065);
            const gain=key==='note'?.56:key==='hat'?.41:.8;
            env.gain.setValueAtTime(.0001,at);
            env.gain.exponentialRampToValueAtTime(gain,at+.004);
            env.gain.exponentialRampToValueAtTime(.0001,at+duration);
            env.connect(this.master);
            let source,filter;
            if(key==='note'||key==='kick'){
                source=ctx.createOscillator();
                if(key==='kick') {
                    source.type='sine';source.frequency.setValueAtTime(155,at);source.frequency.exponentialRampToValueAtTime(47,at+duration);
                } else {
                    const note=event.value, semitone=12*(Number(note.at(-1))+1)+pitch[note[0]]+(note.includes('#')?1:0);
                    source.type='triangle';source.frequency.setValueAtTime(440*2**((semitone-69)/12),at);
                }
                source.connect(env);
            } else {
                source=ctx.createBufferSource();source.buffer=this.noise;
                filter=ctx.createBiquadFilter();filter.type=key==='hat'?'highpass':'bandpass';
                filter.frequency.value=key==='hat'?6200:1550;filter.Q.value=key==='hat'?.5:.75;
                source.connect(filter);filter.connect(env);
            }
            this.sources.add(source);
            source.onended=()=>{this.sources.delete(source);source.disconnect();filter?.disconnect();env.disconnect();};
            source.start(at);source.stop(at+duration+.01);
        }
        silence(){for(const source of this.sources){try{source.stop();}catch{}}}
        close(){this.silence();if(this.context&&this.context.state!=='closed')this.context.close().catch(()=>{});}
    }

    let active;
    class Studio {
        constructor(root,ctx){
            this.root=root;this.ctx=ctx;this.state=ctx.state;this.synth=new Synth();this.mode='compose';
            this.generation=0;this.scores={};this.page();
        }
        stop(){
            this.generation++;
            if(this.compiling)this.ctx.stop();
            this.compiling=false;cancelAnimationFrame(this.animation);
            clearTimeout(this.finishTimer);this.synth.silence();this.playing=false;
            this.paintTick(-1);
            if(this.stopBtn)this.stopBtn.disabled=true;
        }
        leave(){this.stop();this.synth.close();}
        report(message,bad=false){
            this.info.textContent=message;this.info.classList.toggle('mu-error',bad);
        }
        page(){
            const root=node('section','mu-shell'),head=node('div','mu-head'),copy=node('div');
            copy.append(node('h1','','Хөгжмийн урлан'),node('p','','Кодоор хэмнэл зохио. Нэг авиаг өөрчилж, найзаараа ялгааг сонсгоорой.'));
            const tabs=node('nav','mu-tabs');tabs.setAttribute('aria-label','Хөгжмийн горим');
            for(const [mode,name] of [['compose','Зохиох'],['quiz','Сонсож таах']]){
                const tab=btn(name,'mu-'+mode,()=>{if(this.mode===mode)return;this.stop();this.round=null;this.mode=mode;this.page();});
                tab.setAttribute('aria-pressed',String(this.mode===mode));tabs.append(tab);
            }
            head.append(copy,tabs);root.append(head);
            const bar=node('div','mu-bar'),pick=node('select','mu-study');
            for(const [id,s] of Object.entries(studies))pick.append(option(id,s.title+(this.state.won.includes(id)?' ✓':'')));
            pick.value=this.state.study;
            pick.onchange=()=>{this.stop();this.state.study=pick.value;this.state.slot='a';this.scores={};this.round=null;this.ctx.save();this.page();};
            const studyLabel=node('label','mu-control');studyLabel.append(node('span','','Дасгал'),pick);
            const tempo=node('input','mu-tempo');tempo.type='range';tempo.min=60;tempo.max=180;tempo.value=this.state.bpm;
            const bpm=node('span','mu-bpm',this.state.bpm+' BPM'),tempoLabel=node('label','mu-control mu-tempo-wrap');
            tempoLabel.append(node('span','','Хурд'),tempo,bpm);
            tempo.oninput=()=>{this.stop();this.state.bpm=Number(tempo.value);bpm.textContent=tempo.value+' BPM';this.ctx.save();this.report('Шинэ хурдыг сонсохын тулд дахин тоглуулаарай.');};
            bar.append(studyLabel,tempoLabel);root.append(bar);
            this.info=node('p','mu-status');this.info.setAttribute('role','status');
            this.scoreBox=null;this.stopBtn=null;this.quizAnswers=null;this.grid=null;this.consoleBox=null;
            if(this.mode==='compose')this.compose(root);else this.quiz(root);
            root.append(this.info);
            this.root.replaceChildren(root);
        }
        compose(root){
            const study=studies[this.state.study],desk=node('div','mu-desk'),instrument=node('section','mu-panel mu-instrument');
            const trackhead=node('div','mu-trackhead');
            trackhead.append(node('h2','','Хэмнэлийн самбар'));
            this.counter=node('span','mu-position','0 цохилт');trackhead.append(this.counter);instrument.append(trackhead);
            const pads=node('div','mu-pads');
            for(const v of voices.slice(0,4)){
                const pad=btn('','mu-pad',()=>this.preview(v.id));pad.style.setProperty('--voice',v.color);
                pad.append(node('strong','',v.short),node('small','',v.name));pad.setAttribute('aria-label',v.name+' сонсох');pads.append(pad);
            }
            instrument.append(pads);
            this.scoreBox=node('div','mu-score');instrument.append(this.scoreBox);
            const transport=node('div','mu-transport');
            transport.append(btn('▶ Кодоо тоглуулах','mu-play mu-primary',()=>this.listen(this.state.slot)),btn('Дуугүй шалгах','mu-check',()=>this.check()));
            this.stopBtn=btn('■ Зогсоох','mu-stop',()=>{this.stop();this.report('Тоглуулалтыг зогсоолоо.');});
            this.stopBtn.disabled=true;transport.append(this.stopBtn);instrument.append(transport);
            const codecard=node('section','mu-panel mu-codecard'),file=node('div','mu-file'),slots=node('div','mu-tabs');
            file.append(node('strong','','beat.py'));
            for(const key of ['a','b']){
                const b=btn('Хэмнэл '+key.toUpperCase(),'mu-slot-'+key,()=>{if(this.state.slot===key)return;this.stop();this.state.slot=key;this.ctx.save();this.page();});
                b.setAttribute('aria-pressed',String(this.state.slot===key));slots.append(b);
            }
            file.append(slots);codecard.append(file);
            this.input=node('textarea','mu-code');this.input.spellcheck=false;this.input.wrap='off';
            this.input.setAttribute('aria-label','Хэмнэлийн Python код');this.input.maxLength=16000;
            this.input.value=this.state.songs[this.state.study][this.state.slot];
            this.input.oninput=()=>{
                this.stop();this.state.songs[this.state.study][this.state.slot]=this.input.value;
                delete this.scores[this.state.slot];this.ctx.save();this.renderScore(null);
                this.consoleBox.hidden=true;this.report('Код хадгалагдлаа. Хэмнэлээ тоглуулж сонсоорой.');
            };
            this.input.onkeydown=e=>{
                if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();this.listen(this.state.slot);}
                else if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();this.input.setRangeText('    ',this.input.selectionStart,this.input.selectionEnd,'end');this.input.oninput();}
            };
            codecard.append(this.input);this.consoleBox=node('pre','mu-output');this.consoleBox.hidden=true;codecard.append(this.consoleBox);
            desk.append(instrument,codecard);root.append(desk);
            const assignment=node('section','mu-assignment');assignment.append(node('h2','',study.title),node('p','',study.goal));
            const clue=node('details');clue.append(node('summary','','Санаа авах'),node('p','',study.hint));assignment.append(clue);
            const commands=node('details','mu-guide');commands.append(node('summary','','Хөгжмийн командууд'),
                node('p','','drum("kick"), drum("snare"), drum("hat") — гурван төрлийн бөмбөр.'),
                node('p','','play("C4") — нэг цохилтын нот. A–G үсэг, 3–5 октав, диез (#) ашиглаж болно.'),
                node('p','','rest() — нэг цохилт чимээгүй. play("E4", 0.5), drum("hat", 0.5), rest(2) гэж үргэлжлэх хугацааг өөрчилнө.'));
            assignment.append(commands);root.append(assignment);
            this.renderScore(this.scores[this.state.slot]);this.report(this.state.won.includes(this.state.study)?'✓ Энэ дасгалыг биелүүлсэн. Шинэ хэмнэл туршиж болно.':'Кодоо тоглуулж, цохилт бүрийг самбараас дагаарай.');
        }
        renderScore(score){
            if(!this.scoreBox)return;
            const ticks=score?.ticks||16;
            this.counter.textContent=score?ticks/4+' цохилт':'— цохилт';
            const scroll=node('div','mu-scroll'),grid=node('div','mu-grid');
            grid.style.setProperty('--ticks',ticks);
            const width=Math.max(220,ticks*8);
            grid.style.minWidth=(width+58)+'px';
            const scale=node('div','mu-scale');scale.style.gridTemplateColumns='repeat('+Math.ceil(ticks/4)+',1fr)';
            for(let i=0;i<ticks;i+=4)scale.append(node('span','',String(i/4+1)));
            grid.append(node('span','mu-y-label','Цохилт'),scale);
            for(const voice of voices){
                const track=node('div','mu-lane'),name=node('span','mu-y-label',voice.name);
                track.style.setProperty('--voice',voice.color);track.style.backgroundSize=(400/ticks)+'% 100%';
                for(const e of score?.events||[])if(trackFor(e)===voice.id){
                    const mark=node('span','mu-mark',e.kind==='note'?e.value:e.kind==='rest'?'·':'');
                    mark.style.left=(100*e.start/ticks)+'%';mark.style.width=(100*e.ticks/ticks)+'%';
                    mark.title=voice.name+' · '+(1+e.start/4)+'-р цохилт · '+e.ticks/4;track.append(mark);
                }
                const cursor=node('i','mu-cursor');cursor.hidden=true;track.append(cursor);grid.append(name,track);
            }
            scroll.append(grid);
            scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Хэмнэлийн дараалал');scroll.tabIndex=0;
            const transcript=node('p','mu-transcript',score?score.events.map(e=>labelFor(e)).join(' · '):'Кодоо тоглуулахад хэмнэл энд зурагдана.');
            this.scoreBox.replaceChildren(scroll,transcript);this.grid=grid;this.displayTicks=ticks;
        }
        paintTick(tick){
            if(!this.grid)return;
            for(const cursor of this.grid.querySelectorAll('.mu-cursor')){
                cursor.hidden=tick<0;
                if(tick>=0)cursor.style.left=Math.min(99.5,100*tick/this.displayTicks)+'%';
            }
        }
        async preview(id){
            this.stop();const gen=this.generation;
            try{const ctx=await this.synth.unlock();if(this.generation!==gen)return;
                this.synth.hit({kind:id==='note'?'note':'drum',value:id==='note'?'C4':id,ticks:2},ctx.currentTime+.01,.4);
            }catch(e){if(this.generation===gen)this.report(e.message,true);}
        }
        async compile(slot,gen){
            if(this.scores[slot])return this.scores[slot];
            this.compiling=true;
            try{
                const result=await this.ctx.run(this.state.songs[this.state.study][slot],{exercise:this.state.study});
                if(gen!==this.generation)return null;
                if(!result.ok)throw Error('Хэмнэл '+slot.toUpperCase()+' · '+(result.error||'Кодоо шалгаарай.'));
                this.scores[slot]=result;
                if(result.solved&&!this.state.won.includes(this.state.study)){
                    this.state.won.push(this.state.study);this.ctx.save();
                    const option=this.root.querySelector('.mu-study option:checked');
                    if(option)option.textContent=studies[this.state.study].title+' ✓';
                }
                return result;
            }finally{if(gen===this.generation)this.compiling=false;}
        }
        async check(){
            this.stop();const gen=this.generation;this.stopBtn.disabled=false;this.report('Кодоо шалгаж байна…');
            try{
                const score=await this.compile(this.state.slot,gen);if(!score||gen!==this.generation)return;
                this.renderScore(score);this.consoleBox.textContent=score.output||'';this.consoleBox.hidden=!score.output;
                this.report(score.solved?'✓ Дасгал биеллээ!':'Код ажиллалаа. Самбарын дарааллыг дасгалтай тулгаарай.');
            }catch(e){if(gen===this.generation)this.report(e.message,true);}
            finally{if(gen===this.generation)this.stopBtn.disabled=true;}
        }
        async listen(slot,mystery=false){
            this.stop();const gen=this.generation;
            this.stopBtn.disabled=false;this.report('Хэмнэл бэлдэж байна…');
            try{
                const ctx=await this.synth.unlock();if(gen!==this.generation)return;
                if(mystery){
                    const a=await this.compile('a',gen);if(!a)return;
                    const b=await this.compile('b',gen);if(!b)return;
                    const fingerprint=s=>JSON.stringify(s.events.filter(e=>e.kind!=='rest').map(e=>[e.kind,e.value,e.start,e.kind==='note'?e.ticks:0]));
                    if(fingerprint(a)===fingerprint(b))throw Error('A ба B ижил сонсогдож байна. Зохиох хэсэгт нэг авианы утга эсвэл хэмийг өөрчлөөрэй.');
                    if(!this.round)this.round={slot:Math.random()<.5?'a':'b',heard:false};
                    slot=this.round.slot;
                }
                const score=await this.compile(slot,gen);if(!score||gen!==this.generation)return;
                if(this.mode==='compose'){
                    this.renderScore(score);this.consoleBox.textContent=score.output||'';this.consoleBox.hidden=!score.output;
                }
                this.playing=true;
                const start=ctx.currentTime+.055,beat=60/this.state.bpm;
                for(const e of score.events)this.synth.hit(e,start+e.start*beat/4,beat);
                if(mystery){this.round.heard=true;this.enableGuess(true);}
                const label=mystery?'Нууц хэмнэл':'Хэмнэл '+slot.toUpperCase();
                this.report(label+' тоглож байна.');
                const frame=()=>{
                    if(gen!==this.generation)return;
                    const tick=(ctx.currentTime-start)*4/beat;this.paintTick(Math.max(0,tick));
                    if(tick<score.ticks)this.animation=requestAnimationFrame(frame);
                };
                frame();
                this.finishTimer=setTimeout(()=>{
                    if(gen!==this.generation)return;
                    this.playing=false;this.stopBtn.disabled=true;cancelAnimationFrame(this.animation);this.paintTick(-1);
                    this.report(mystery?'Аль хэмнэл тоглосон бэ?':score.solved?'✓ Дасгал биеллээ! Хэмнэлээ B хувилбарт өөрчилж үзээрэй.':'Тоглож дууслаа. Өөр нэг өөрчлөлт хийж туршаарай.');
                },(score.ticks*beat/4+.10)*1000);
            }catch(e){
                if(gen!==this.generation)return;
                this.stop();this.report(e.message||'Дууг тоглуулж чадсангүй.',true);
            }
        }
        enableGuess(enabled){for(const b of this.quizAnswers?.children||[])b.disabled=!enabled;}
        quiz(root){
            const panel=node('section','mu-panel mu-duel');panel.append(node('h2','','Аль хэмнэл вэ?'),
                node('p','','Хосоороо A, B хоёрыг эхлээд сонс. Дараа нь найз чинь кодыг харалгүй нууц хэмнэлийг таана.'));
            const examples=node('div','mu-listens');
            for(const slot of ['a','b'])examples.append(btn(slot.toUpperCase()+' сонсох','mu-audition-'+slot,()=>this.listen(slot)));
            panel.append(examples);
            const transport=node('div','mu-transport');
            transport.append(btn('Нууц хэмнэл сонсох','mu-primary mu-mystery',()=>this.listen(null,true)));
            this.stopBtn=btn('■ Зогсоох','mu-stop',()=>{this.stop();this.report('Тоглуулалтыг зогсоолоо.');});
            this.stopBtn.disabled=true;transport.append(this.stopBtn);panel.append(transport);
            const answers=this.quizAnswers=node('div','mu-guess');
            for(const key of ['a','b'])answers.append(btn('Хэмнэл '+key.toUpperCase(),'mu-guess-'+key,()=>{
                if(!this.round?.heard)return;
                this.stop();const answer=this.round.slot;this.round=null;this.enableGuess(false);
                this.report((answer===key?'✓ Зөв таалаа! ':'Энэ удаа ')+ 'Хэмнэл '+answer.toUpperCase()+' тоглосон. Нууц хэмнэл дарж дахин тоглоорой.');
            }));
            this.enableGuess(false);panel.append(answers);root.append(panel);
            this.report('Нууц хэмнэл сонссоны дараа хариугаа сонгоорой.');
        }
    }
    function leave(){if(active){active.leave();active=null;}}
    function review(raw){
        const data=normalize(raw),rows=[];
        for(const [id,study] of Object.entries(studies)){
            if(!data.won.includes(id)&&['a','b'].every(k=>data.songs[id][k]===study[k]))continue;
            if(data.won.includes(id))rows.push({title:study.title,text:'Сурагч энэ дасгалын хэмнэлийг кодоор биелүүлсэн.'});
            for(const k of ['a','b'])rows.push({title:study.title+' · Хэмнэл '+k.toUpperCase(),text:data.songs[id][k]});
        }
        return rows;
    }
    window.MusicStudio={normalize,review,mount(root,ctx){leave();active=new Studio(root,ctx);},leave};
})();
