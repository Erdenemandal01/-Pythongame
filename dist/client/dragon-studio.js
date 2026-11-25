(() => {
    'use strict';
    const workshopText = globalThis.PQEnglishWorkshops?.literal || (text => text);
    const defaults=[
        workshopText('# Амрах нөхцөлийг хамгийн түрүүнд шалгана.\ndef decide(energy, on_egg, carrying):\n    if energy <= 1:\n        return "rest"\n    if carrying:\n        return "home"\n    if on_egg:\n        return "take"\n    return "search"'),
        workshopText('# Өндөг дээр байвал эхлээд авч үзье.\ndef decide(energy, on_egg, carrying):\n    if energy == 0:\n        return "rest"\n    if on_egg and not carrying:\n        return "take"\n    if carrying:\n        return "home"\n    return "search"')
    ];
    const cases=[
        {title:workshopText('Үүрнээс гарах'),energy:6,start:'start',turns:36},
        {title:workshopText('Ядарсан луу'),energy:1,start:'start',turns:36},
        {title:workshopText('Өндөг дээр буух'),energy:6,start:'egg',turns:36},
        {title:workshopText('Найзын нөхцөл'),energy:1,start:'egg',turns:36}
    ];
    const meadow={
        title:workshopText('Үүрийн хөндий'),
        rows:['..##...D.','..S.E..#.','.#...#...','....E..C.','.D..##...','..#....#.']
    };
    const actions={rest:workshopText('Амрах'),search:workshopText('Хайх'),take:workshopText('Өндөг авах'),home:workshopText('Агуй руу')};
    const asInt=(value,min,max,def)=>Number.isInteger(value)&&value>=min&&value<=max?value:def;
    function copyWorld(world){
        if(!(typeof world?.title==='string' && world.title.trim() && world.title.length<=60 &&
            Array.isArray(world.rows) && world.rows.length===6 && world.rows.every(row=>typeof row==='string' && /^[.#SECD]{9}$/.test(row))))return null;
        return {title:world.title,rows:world.rows.slice()};
    }
    function normalize(raw) {
        const source=raw && typeof raw==='object'?raw:{}, custom=source.custom||{},sharedMap=copyWorld(source.sharedMap);
        return {
            codes:defaults.map((code,i)=>typeof source.codes?.[i]==='string'?source.codes[i].slice(0,16000):code),
            slot:asInt(source.slot,0,1,0),scenario:asInt(source.scenario,0,3,0),
            custom:{energy:asInt(custom.energy,0,6,1),turns:asInt(custom.turns,1,80,36),
                start:['start','egg','cave'].includes(custom.start)?custom.start:'egg'},
            world:source.world==='level'?'level':source.world==='shared'&&sharedMap?'shared':'meadow',sharedMap,
            predictions:cases.map((_,i)=>Object.hasOwn(actions,source.predictions?.[i])?source.predictions[i]:'')
        };
    }
    function n(tag,cls,text) {
        const el=document.createElement(tag);
        if(cls)el.className=cls;
        if(text!==undefined)el.textContent=text;
        return el;
    }
    function button(label,cls,fn) {
        const el=n('button',cls,label);el.type='button';el.onclick=fn;return el;
    }
    function select(cls,label,values,current,onChange) {
        const el=n('select',cls);el.setAttribute('aria-label',label);
        for(const [value,text] of values){const option=n('option','',text);option.value=value;el.append(option);}
        el.value=String(current);el.onchange=()=>onChange(el.value);return el;
    }
    function labelled(text,control){
        const label=n('label','dr-label');label.append(n('span','',text),control);return label;
    }
    function locate(map,c){
        const found=[];map.rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>{if(ch===c)found.push([x,y]);}));return found;
    }
    let active=null;
    function leave(){if(active){active.close();active=null;}}
    function mount(root,ctx) {
        leave();
        const s=ctx.state;
        const results=[null,null];
        let cursor=0,timer=null,token=0,running=false,feedback='',map=meadow,ref={};
        function currentCase(){return s.scenario===3?{...cases[3],...s.custom}:cases[s.scenario];}
        function stopPlayback(){clearInterval(timer);timer=null;}
        function abort(){token++;stopPlayback();if(running)ctx.stop();running=false;}
        function clearAll(){abort();results.fill(null);cursor=0;feedback='';}
        function refreshWorld(){
            map=meadow;
            if(s.world==='level'){
                try{map=LevelBoard.validate(ctx.getLevel());}
                catch{feedback=workshopText('«Миний түвшин»-д өндөг, агуйд хүрэх зам гаргаад дахин сонгоорой.');s.world='meadow';ctx.save();}
            } else if(s.world==='shared') {
                try{map=LevelBoard.validate(s.sharedMap);}
                catch{s.world='meadow';s.sharedMap=null;feedback=workshopText('Найзын газрын зургийг унших боломжгүй байна.');ctx.save();}
            }
        }
        function caseChanged(update){
            clearAll();update();ctx.save();render();
        }
        function firstFrame(){
            const c=currentCase(),eggs=locate(map,'E');
            const [x,y]=c.start==='egg'?eggs[0]:locate(map,c.start==='cave'?'C':'S')[0];
            return {turn:0,x,y,energy:c.energy,carrying:false,delivered:0,onEgg:c.start==='egg',
                remaining:eggs,action:'',detail:workshopText('Эхлэх байрлал')};
        }
        function setup(){
            const strip=n('div','dr-setup');
            const worlds=[['meadow',workshopText('Үүрийн хөндий')],['level',workshopText('Миний түвшний зураг')]];
            if(s.sharedMap)worlds.push(['shared',workshopText('Найзын зураг · ')+s.sharedMap.title]);
            const world=select('dr-map-source',workshopText('Газрын зураг'),worlds,s.world,v=>caseChanged(()=>{s.world=v;}));
            const scenario=select('dr-scenario',workshopText('Нөхцөл'),cases.map((c,i)=>[i,(i+1)+'. '+c.title]),s.scenario,v=>caseChanged(()=>{s.scenario=Number(v);}));
            const prediction=select('dr-predict',workshopText('Эхний үйлдлийн таамаг'),[['',workshopText('Таамгаа сонго')],...Object.entries(actions)],s.predictions[s.scenario],v=>{
                s.predictions[s.scenario]=v;ctx.save();update();
            });
            strip.append(labelled(workshopText('Газрын зураг'),world),labelled(workshopText('Нөхцөл'),scenario),labelled(workshopText('Эхний үйлдлийг таамагла'),prediction));
            return strip;
        }
        function friendControls(){
            const form=n('fieldset','dr-friend');form.append(n('legend','',workshopText('Найзынхаа луунд нөхцөл өг')));
            const energy=select('dr-energy-input',workshopText('Эхлэх энерги'),Array.from({length:7},(_,i)=>[i,i+' / 6']),s.custom.energy,v=>caseChanged(()=>{s.custom.energy=Number(v);}));
            const pos=select('dr-start-input',workshopText('Эхлэх байрлал'),[['start',workshopText('Эхлэл')],['egg',workshopText('Эхний өндөг дээр')],['cave',workshopText('Агуй дээр')]],s.custom.start,v=>caseChanged(()=>{s.custom.start=v;}));
            const turns=n('input','dr-turn-input');turns.type='number';turns.min='1';turns.max='80';turns.value=s.custom.turns;
            turns.onchange=()=>caseChanged(()=>{s.custom.turns=asInt(Number(turns.value),1,80,36);});
            form.append(labelled(workshopText('Энерги'),energy),labelled(workshopText('Байрлал'),pos),labelled(workshopText('Хэдэн ээлж ажиглах вэ?'),turns));
            const exchange=n('div','dr-case-exchange');
            const give=button(workshopText('Нөхцөлөө файлд татах'),'dr-download-case',()=>{
                const data={format:'python-quest-dragon-case',version:1,map:LevelBoard.validate(map),scenario:{...s.custom}};
                const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
                const link=n('a');link.href=url;link.download='dragon-challenge.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
            });
            const file=n('input','dr-case-file');file.type='file';file.accept='.json,application/json';file.hidden=true;
            file.onchange=async()=>{
                const choice=file.files[0];file.value='';if(!choice)return;
                try{
                    if(choice.size>16000)throw Error(workshopText('16 КБ хүртэлх лууны сорил сонгоорой.'));
                    const data=JSON.parse(await choice.text());
                    if(data?.format!=='python-quest-dragon-case' || data?.version!==1)throw Error(workshopText('«Нөхцөлөө файлд татах»-аар хадгалсан лууны сорил сонгоорой.'));
                    const world=LevelBoard.validate(data.map),c=data.scenario;
                    if(!c||asInt(c.energy,0,6,-1)<0||asInt(c.turns,1,80,0)===0||!['start','egg','cave'].includes(c.start))throw Error(workshopText('Сорилын энерги, байрлал, ээлжийн тоог шалгаарай.'));
                    if(!root.contains(file))return;
                    if((s.sharedMap||s.custom.energy!==1||s.custom.start!=='egg'||s.custom.turns!==36) &&
                        !confirm(workshopText('Найзын дөрөв дэх нөхцөлийг «')+world.title+workshopText('» зургаар шинэчлэх үү? Хоёр дүрмийн код хадгалагдана.')))return;
                    caseChanged(()=>{s.scenario=3;s.sharedMap=world;s.world='shared';s.custom={energy:c.energy,start:c.start,turns:c.turns};s.predictions[3]='';});
                }catch(e){if(root.contains(file)){feedback=e instanceof SyntaxError?workshopText('Сорилын JSON файлыг уншиж чадсангүй.'):e.message;update();}}
            };
            exchange.append(give,button(workshopText('Найзын нөхцөл нээх'),'dr-upload-case',()=>file.click()),file);
            form.append(exchange);
            return form;
        }
        function render(){
            refreshWorld();ref={};
            const shell=n('section','dr-shell'),head=n('header','dr-head'),headCopy=n('div');
            headCopy.append(n('h1','',workshopText('Луугаа сурга')),n('p','',workshopText('Лууны оронд шийдвэр гаргах Python дүрэм бич. Ижил талбайд найзынхаа дүрэмтэй туршаарай.')));
            head.append(headCopy);shell.append(head,setup());
            if(s.scenario===3)shell.append(friendControls());
            const grid=n('div','dr-workbench'),stage=n('section','dr-stage'),bar=n('div','dr-board-head'),title=n('div');
            title.append(n('small','',workshopText('ЛУУНЫ ТАЛБАЙ')),n('h2','dr-map-title',map.title));
            ref.tick=n('span','dr-tick');bar.append(title,ref.tick);
            ref.board=n('div','dr-map');
            ref.stats=n('div','dr-stats');ref.detail=n('p','dr-detail');ref.detail.setAttribute('aria-live','polite');
            const controls=n('div','dr-playback');
            ref.back=button(workshopText('Өмнөх'),'dr-back',()=>{stopPlayback();cursor=Math.max(0,cursor-1);update();});
            ref.play=button(workshopText('Тоглуулах'),'dr-play',()=>{
                if(timer){stopPlayback();update();return;}
                const max=results[s.slot]?.frames?.length-1;
                if(!max)return;
                if(cursor>=max)cursor=0;
                timer=setInterval(()=>{cursor++;if(cursor>=max)stopPlayback();update();},420);update();
            });
            ref.next=button(workshopText('Нэг ээлж'),'dr-next',()=>{stopPlayback();cursor=Math.min(cursor+1,results[s.slot].frames.length-1);update();});
            ref.end=button(workshopText('Эцсийг харах'),'dr-end',()=>{stopPlayback();cursor=results[s.slot].frames.length-1;update();});
            controls.append(ref.back,ref.play,ref.next,ref.end);stage.append(bar,ref.board,ref.stats,ref.detail,controls);
            const editor=n('section','dr-editor'),edhead=n('div','dr-file'),tabs=n('div','dr-tabs');
            for(let i=0;i<2;i++){
                const b=button(i===0?workshopText('Миний дүрэм'):workshopText('Найзын дүрэм'),'dr-slot dr-slot-'+i,()=>{
                    if(s.slot===i)return;abort();s.slot=i;cursor=0;feedback='';ctx.save();render();
                });b.setAttribute('aria-pressed',String(i===s.slot));tabs.append(b);
            }
            edhead.append(n('code','','dragon.py'),tabs);
            const code=n('textarea','dr-code');code.spellcheck=false;code.wrap='off';code.maxLength=16000;
            code.setAttribute('aria-label',workshopText('Лууны Python дүрэм'));code.value=s.codes[s.slot];
            function saveCode(){abort();results[s.slot]=null;cursor=0;feedback='';s.codes[s.slot]=code.value;ctx.save();update();}
            code.oninput=saveCode;
            code.onkeydown=e=>{
                if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();code.setRangeText('    ',code.selectionStart,code.selectionEnd,'end');saveCode();}
                if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run(false);}
                else if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){
                    const line=code.value.slice(0,code.selectionStart).split('\n').pop();
                    const indent=line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');
                    e.preventDefault();code.setRangeText('\n'+indent,code.selectionStart,code.selectionEnd,'end');saveCode();
                }
            };
            ref.code=code;
            const runbar=n('div','dr-runbar');
            ref.run=button(workshopText('Дүрмээ турших'),'dr-run',()=>run(false));
            ref.compare=button(workshopText('Хоёр дүрмийг харьцуулах'),'dr-compare',()=>run(true));
            ref.stop=button(workshopText('Зогсоох'),'dr-stop',()=>{abort();feedback=workshopText('Ажиллагааг зогсоолоо.');update();});
            runbar.append(ref.run,ref.compare,ref.stop);editor.append(edhead,code,runbar);
            grid.append(stage,editor);shell.append(grid);
            ref.status=n('p','dr-status');ref.status.setAttribute('role','status');
            ref.comparison=n('section','dr-comparison');
            const help=n('details','dr-help');help.append(n('summary','',workshopText('Дүрэм, командууд')));
            const notes=n('div','dr-instructions');
            notes.append(n('p','',workshopText('decide(energy, on_egg, carrying) функц ээлж бүрт дуудагдана. energy нь 0–6, on_egg нь хөл доор өндөг байгаа эсэх, carrying нь өндөг тээж байгаа эсэхийг заана.')),
                n('p','',workshopText('rest энерги 3-аар сэргээнэ. search хамгийн ойрын өндөг рүү нэг нүд явна. take тухайн нүднээс нэг өндөг авна. home агуй руу нэг нүд явна. Алхах, өндөг авахад 1 энерги зарцуулна. Агуйд хүрэхэд тээсэн өндгөө буулгана.')),
                n('p','',workshopText('Санаа: Энерги 1, хөл дор өндөг байхад аль if эхэлж биелэх вэ? Нөхцөлүүдийн дарааллыг солиод ижил талбай дээр дахин ажиллуул.')));help.append(notes);
            ref.output=n('pre','dr-output');
            shell.append(ref.status,ref.comparison,help,ref.output);root.replaceChildren(shell);update();
        }
        function draw(frame){
            const canvas=LevelBoard.draw(ref.board,map,{x:-1,y:-1,remaining:frame.remaining});
            canvas.setAttribute('aria-label',map.title+workshopText('. Луу (')+frame.x+', '+frame.y+workshopText('). Үлдсэн өндөг ')+frame.remaining.length+'.');
            const field=canvas.parentElement;
            let token=field.querySelector('.dr-sprite');
            if(!token){token=n('span','dr-sprite');token.setAttribute('aria-hidden','true');const sprite=n('img');sprite.src='art/battles/workshop-dragon.png';sprite.alt='';token.append(sprite,n('i'));field.append(token);}
            token.style.left=(frame.x*100/9)+'%';token.style.top=(frame.y*100/6)+'%';
            token.dataset.action=frame.action;token.classList.toggle('has-egg',frame.carrying);
        }
        function summary(){
            ref.comparison.replaceChildren();
            if(!results[0]?.ok || !results[1]?.ok)return;
            ref.comparison.append(n('h3','',workshopText('Ижил нөхцөл дэх хоёр дүрэм')));
            const table=n('div','dr-compare-list');
            for(const [i,row] of results.entries()){
                const end=row.frames.at(-1);
                table.append(n('p','', (i===0?workshopText('Миний дүрэм'):workshopText('Найзын дүрэм'))+' · '+end.delivered+'/'+row.total+workshopText(' өндөг хүргэв · ')+end.turn+workshopText(' ээлж · ')+row.moves+workshopText(' алхам')));
            }
            let difference=0;
            for(let k=1;k<Math.min(...results.map(r=>r.frames.length));k++){
                if(results[0].frames[k].action!==results[1].frames[k].action){difference=k;break;}
            }
            const text=difference ? difference+workshopText('-р ээлжид сонголт зөрөв. Миний луу «')+actions[results[0].frames[difference].action]+workshopText('», найзын луу «')+actions[results[1].frames[difference].action]+workshopText('» гэв.') : workshopText('Энэ туршилтад хоёр луу ижил үйлдлүүд сонголоо.');
            table.append(n('p','dr-difference',text));ref.comparison.append(table);
        }
        function update(){
            if(!ref.board)return;
            const row=results[s.slot],frames=row?.frames||[],frame=frames[Math.min(cursor,frames.length-1)]||firstFrame();
            draw(frame);
            ref.tick.textContent=workshopText('Ээлж ')+frame.turn+' / '+(frames.length?frames.length-1:currentCase().turns);
            ref.stats.replaceChildren();
            for(const [label,num] of [[workshopText('Энерги'),frame.energy+' / 6'],[workshopText('Ачаа'),frame.carrying?workshopText('1 өндөг'):workshopText('Хоосон')],[workshopText('Хүргэсэн'),frame.delivered+' / '+locate(map,'E').length]]){
                const item=n('div');item.append(n('small','',label),n('strong','',num));ref.stats.append(item);
            }
            ref.detail.textContent=frame.action ? actions[frame.action]+' · '+frame.detail : workshopText('Эхлэх энерги ')+frame.energy+'. '+(frame.onEgg?workshopText('Луу өндөг дээр байна.'):workshopText('Луу (')+frame.x+', '+frame.y+workshopText(') нүдэнд байна.'));
            ref.play.textContent=timer?workshopText('Түр зогсоох'):workshopText('Тоглуулах');ref.back.disabled=cursor===0||running;
            ref.next.disabled=ref.end.disabled=cursor>=frames.length-1||running;ref.play.disabled=frames.length<2||running;
            ref.run.disabled=ref.compare.disabled=running;ref.stop.hidden=!running;
            const prediction=s.predictions[s.scenario],actual=frames[1]?.action;
            const answer=prediction&&actual?(prediction===actual?workshopText('Таамаг таарлаа. '):workshopText('Эхний үйлдэл «')+actions[actual]+workshopText('» байв. ')):'';
            const outcome=row?.ok?(row.won?workshopText('Бүх өндгийг хүргэлээ.'):workshopText('Ээлж дууслаа. ')+row.frames.at(-1).delivered+'/'+row.total+workshopText(' өндөг хүргэв.')):'';
            ref.status.textContent=running?workshopText('Python дүрмийг туршиж байна…'):feedback||row?.error||(answer+outcome);
            ref.status.hidden=!ref.status.textContent;ref.status.dataset.error=String(!!row?.error);
            ref.output.hidden=!row?.output;ref.output.textContent=row?.output||'';summary();
        }
        async function run(both){
            abort();const id=token;running=true;feedback='';cursor=0;update();
            try{
                for(const slot of (both?[0,1]:[s.slot])){
                    const outcome=await ctx.run(s.codes[slot],{map,case:currentCase()});
                    if(id!==token)return;
                    results[slot]=outcome;
                    if(!outcome.ok && both){s.slot=slot;ctx.save();feedback=outcome.error;break;}
                }
                if(id===token)cursor=results[s.slot]?.frames?.length>1?1:0;
            }catch(error){if(id===token)feedback=error.message||String(error);}
            finally{if(id===token){running=false;if(ref.code.value!==s.codes[s.slot])render();else update();}}
        }
        active={close:()=>{abort();}};render();
    }
    function review(state) {
        const s=normalize(state),where={start:workshopText('Эхлэл'),egg:workshopText('Өндөг дээр'),cave:workshopText('Агуй дээр')};
        return [
            {title:workshopText('Миний лууны дүрэм'),text:s.codes[0]},
            {title:workshopText('Найзын лууны дүрэм'),text:s.codes[1]},
            {title:workshopText('Найзын зохиосон дөрөв дэх нөхцөл'),
                text:workshopText('Энерги ')+s.custom.energy+' / 6 · '+where[s.custom.start]+' · '+s.custom.turns+workshopText(' ээлж. ')+
                  (s.world==='shared'?workshopText('Найзын зураг: ')+s.sharedMap.title+'. ':'')+
                  (s.predictions[3]?workshopText('Эхний таамаг: ')+actions[s.predictions[3]]+'.':'')}
        ];
    }
    window.DragonStudio={normalize,mount,leave,review};
})();
