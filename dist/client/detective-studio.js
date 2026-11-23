(() => {
    'use strict';
    const cases=[
        {id:'door',title:'Талстын хаалга',rule:'Хаалгыг 3 ба түүнээс олон талсттай аялагчид нээнэ.',label:'Талстын тоо · 0–12',initial:'4',hint:'Хоёр талст, яг гурав, дөрвөн талсттай аялагчийг харьцуул.',
            code:'def opens(crystals):\n    return crystals > 3'},
        {id:'beacon',title:'Цамхгийн дохио',rule:'Эхлэх мөчид гэрэл унтарсан байна. Дараа нь 4, 8, 12… дугаар мөч бүрд гэрэл асна.',label:'Мөчийн дугаар · 0–60',initial:'4',hint:'Давталт эхлэхээс өмнөх тэг дэх мөч бас дөрөвт хуваагддаг.',
            code:'def flash(tick):\n    return tick % 4 == 0'},
        {id:'relay',title:'Зүг заагч',rule:'north гэдэг үгийг том, жижиг үсгээр бичиж болно. Эхлэл, төгсгөлийн зайг үл тооцно. Өөр үгийг хүлээж авахгүй.',label:'Дамжуулах үг',initial:'north',hint:'Үгийн өмнө эсвэл хойно зай үлдээгээд туршаарай.',
            code:'def accept(word):\n    return word.lower() == "north"'},
        {id:'battery',title:'Цэнэг тоологч',rule:'Тэгээс их цэнэгтэй бүх зайг тоолно. Хоосон зай таарсан ч дараагийн зайг шалгана.',label:'Зай бүрийн цэнэг · таслалаар салга',initial:'3,2,0',hint:'Хоосон зайны ард цэнэгтэй зай тавихад юу болох вэ?',
            code:'def count_ready(cells):\n    total = 0\n    for cell in cells:\n        if cell == 0:\n            break\n        total += 1\n    return total'},
        {id:'storm',title:'Шуурганы үед',rule:'Шуургатай бол робот shelter буюу хоргодох байр сонгоно. Тогтуун үед эрч хүч 3-аас бага бол charge, бусад үед walk сонгоно.',label:'Эрч хүч · 0–9',initial:'5',hint:'Эрч хүч бага, мөн шуургатай байвал аль шийдвэр түрүүлэх вэ?',
            code:'def choose(energy, storm):\n    if energy < 3:\n        return "charge"\n    if storm:\n        return "shelter"\n    return "walk"'}
    ];
    function normalize(raw){
        const records={};
        for(const c of cases){
            const r=raw?.records?.[c.id];if(!r||typeof r!=='object')continue;
            records[c.id]={input:typeof r.input==='string'?r.input.slice(0,70):c.initial,storm:r.storm===true,
                draft:typeof r.draft==='string'?r.draft.slice(0,16000):c.code,
                evidence:typeof r.evidence?.input==='string'?{input:r.evidence.input.slice(0,70),storm:r.evidence.storm===true}:null,
                clue:typeof r.clue==='string'?r.clue.slice(0,320):'',solved:r.solved===true};
        }
        return {selected:cases.some(c=>c.id===raw?.selected)?raw.selected:'door',records};
    }
    const textValue=x=>x===true?'True':x===false?'False':x===null?'None':JSON.stringify(x);
    const inputValue=args=>args.map(textValue).join(', ');
    function review(state){
        return cases.filter(c=>state.records[c.id]).map(c=>{
            const r=state.records[c.id];
            return {title:c.title+(r.solved?' · Засвар батлагдсан':''),text:(r.clue||'Нотлох оролт тэмдэглээгүй')+'\n\n'+r.draft};
        });
    }
    const el=(tag,cls,v)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(v!==undefined)n.textContent=v;return n;};
    const btn=(title,cls,fn)=>{const b=el('button',cls,title);b.type='button';b.onclick=fn;return b;};
    const labeled=(name,node)=>{const l=el('label','dt-label');l.append(el('span','',name),node);return l;};
    function argsFor(c,r){
        if(c.id==='relay')return [r.input];
        if(c.id==='battery'){
            if(!r.input.trim())return [[]];
            const parts=r.input.split(',').map(s=>s.trim());
            if(parts.length>12||!parts.every(p=>/^\d$/.test(p)))throw Error('0–9 хоорондох цэнэгүүдийг таслалаар салгаарай. Жишээ нь 3,0,2.');
            return [parts.map(Number)];
        }
        const max={door:12,beacon:60,storm:9}[c.id], n=Number(r.input);
        if(!r.input.trim()||!Number.isInteger(n)||n<0||n>max)throw Error('0–'+max+' хоорондох бүхэл тоо бичээрэй.');
        return c.id==='storm'?[n,r.storm]:[n];
    }
    let active=null;
    function leave(){if(active){active.token++;active.ctx.stop();active=null;}}
    function mount(root,ctx){
        leave();
        const session={token:0,ctx};active=session;
        const state=ctx.state;
        function show(){
            const generation=++session.token;ctx.stop();
            const c=cases.find(c=>c.id===state.selected);
            const r=state.records[c.id]??={input:c.initial,storm:false,draft:c.code,clue:'',solved:false};
            const page=el('section','dt-shell'),header=el('header','dt-head');
            header.append(el('h1','','Алдааны мөрдөгч'));
            const select=el('select','dt-select');
            const updateOptions=()=>{
                select.replaceChildren(...cases.map(v=>{
                    const o=el('option','',(state.records[v.id]?.solved?'✓ ':'')+v.title);o.value=v.id;return o;
                }));select.value=c.id;
            };
            updateOptions();select.onchange=()=>{state.selected=select.value;ctx.save();show();};
            header.append(labeled('Хэрэг сонгох',select));page.append(header);
            const stage=el('article','dt-stage'),art=el('canvas','dt-art');
            art.setAttribute('aria-hidden','true');const index=cases.indexOf(c);
            WorkshopArt.paint(art,'detective',false,index);
            const caption=el('div','dt-caption');caption.append(el('h2','',c.title),el('p','',c.rule));stage.append(art,caption);page.append(stage);
            const bench=el('div','dt-bench'),probe=el('section','dt-panel'),fix=el('section','dt-panel');
            probe.append(el('h3','','1. Алдааг гаргаж үз'));
            const original=el('pre','dt-original',c.code);
            probe.append(el('p','','Робот одоо энэ кодоор ажиллаж байна.'),original);
            const field=el('input','dt-input');
            field.type=['relay','battery'].includes(c.id)?'text':'number';field.value=r.input;field.maxLength=70;
            if(field.type==='number'){field.min='0';field.max=String({door:12,beacon:60,storm:9}[c.id]);field.step='1';}
            const saveInput=()=>{r.input=field.value.slice(0,70);ctx.save();};field.oninput=saveInput;
            probe.append(labeled(c.label,field));
            let weather;
            if(c.id==='storm'){
                weather=el('input','dt-weather');weather.type='checkbox';weather.checked=r.storm;
                weather.onchange=()=>{r.storm=weather.checked;ctx.save();};
                const l=el('label','dt-weather-label');l.append(weather,document.createTextNode(' Шуургатай'));probe.append(l);
            }
            const test=btn('Оролтыг турших','dt-probe',()=>execute(false));
            const hint=el('details','dt-hint');hint.append(el('summary','','Сэжүүр'),el('p','',c.hint));probe.append(test,hint);
            const actual=el('div','dt-result'),output=el('strong','dt-actual','—'),expected=el('strong','dt-expected','—');
            for(const [name,value] of [['Дүрмээр гарах',expected],['Роботын гаргасан',output]]){
                const box=el('div','');box.append(el('span','',name),value);actual.append(box);
            }
            probe.append(actual);
            fix.append(el('h3','','2. Кодыг засаад батал'));
            const clue=el('p','dt-clue');
            const draft=el('textarea','dt-code');draft.spellcheck=false;draft.maxLength=16000;draft.setAttribute('aria-label','Роботын засварласан Python код');
            draft.value=r.draft;draft.setAttribute('autocapitalize','off');draft.wrap='off';
            const saveDraft=()=>{r.draft=draft.value;r.solved=false;updateOptions();ctx.save();status.textContent='Код өөрчлөгдлөө. Засвараа шалгаарай.';};
            draft.oninput=saveDraft;
            draft.onkeydown=e=>{
                if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(!verify.disabled)execute(true);}
                if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();draft.setRangeText('    ',draft.selectionStart,draft.selectionEnd,'end');saveDraft();}
            };
            const verify=btn('Засварыг шалгах','dt-verify',()=>execute(true));
            const next=btn('Дараагийн хэрэг','dt-next',()=>{state.selected=cases[(index+1)%cases.length].id;ctx.save();show();});
            const status=el('p','dt-status');status.setAttribute('role','status');
            const updateClue=()=>{clue.textContent=r.clue?'Олсон нотолгоо · '+r.clue:'Зөрүү гаргах оролт олбол засвараа шалгах боломж нээгдэнэ.';verify.disabled=!r.clue;next.hidden=!r.solved;};
            fix.append(clue,draft,verify,next,status);bench.append(probe,fix);page.append(bench);
            status.textContent=r.solved?'✓ Энэ засвар шалгалтуудад тэнцсэн.':'';
            root.replaceChildren(page);updateClue();
            let running=false;
            async function execute(verifyCode){
                if(running)return;
                let args;
                try{args=argsFor(c,r);}catch(e){status.textContent=e.message;return;}
                running=true;field.disabled=true;if(weather)weather.disabled=true;
                test.disabled=true;verify.disabled=true;draft.readOnly=true;
                status.textContent='Python код ажиллаж байна…';
                try{
                    const evidence=verifyCode&&r.evidence?argsFor(c,r.evidence):null;
                    const result=await ctx.run(verifyCode?draft.value:c.code,{case:c.id,args,evidence,verify:verifyCode});
                    if(active!==session||session.token!==generation)return;
                    if(!result.ok)throw Error(result.error||'Кодыг шалгаарай.');
                    const s=result.sample;output.textContent=textValue(s.actual);expected.textContent=textValue(s.expected);
                    actual.dataset.match=String(s.matches);
                    const activated=c.id==='storm'?s.actual==='shelter':c.id==='battery'?Number(s.actual)>0:s.actual===true;
                    WorkshopArt.paint(art,'detective',activated,index);
                    if(verifyCode){
                        r.solved=result.passed===result.count;
                        const f=result.failure;
                        status.textContent=r.solved?'✓ '+result.count+' оролтоор шалгалаа. Хэрэг шийдэгдлээ!':
                            result.passed+' / '+result.count+' тэнцлээ. '+inputValue(f.args)+' дээр '+textValue(f.expected)+' гарах ёстой. Таны код '+textValue(f.actual)+' буцаалаа.';
                    }else if(!s.matches){
                        r.evidence={input:r.input,storm:r.storm};
                        r.clue=inputValue(s.args)+' үед '+textValue(s.expected)+' гарах ёстой ч '+textValue(s.actual)+' гарсан.';
                        status.textContent='Алдаа гаргах оролтыг оллоо! Одоо функцээ засаарай.';
                    }else status.textContent='Энэ оролт дээр робот зөв ажиллалаа. Өөр оролт туршаарай.';
                    updateOptions();ctx.save();
                }catch(e){if(active===session&&session.token===generation)status.textContent=e.message;}
                finally{if(active===session&&session.token===generation){running=false;draft.readOnly=false;field.disabled=false;if(weather)weather.disabled=false;test.disabled=false;updateClue();}}
            }
        }
        show();
    }
    window.DetectiveStudio={normalize,mount,leave,review};
})();
