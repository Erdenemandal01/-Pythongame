(() => {
    'use strict';
    const t=(mn,en)=>GameLocale.lang==='en'?en:mn;
    const limit={code:20000,source:1200,stdin:1000,out:2000,error:1000,portfolio:384*1024};
    function cleanRun(raw) {
        if(!raw || !['pass','error'].includes(raw.type))return null;
        const run={type:raw.type};
        for(const field of ['source','stdin','out','error']){
            const value=raw[field];
            if(typeof value!=='string')return null;
            run[field]=value.slice(0,limit[field]);
            if(value.length>limit[field] || raw[field+'Clipped']===true)run[field+'Clipped']=true;
        }
        return run;
    }
    function read(index, raw) {
        if(!Number.isInteger(index)||index<0||!raw||typeof raw!=='object')return null;
        const clean={};
        for(const key of ['p0','p1']){
            const item=raw[key];
            if(!item||typeof item!=='object')continue;
            const slot={};
            if(typeof item.checkpoint==='string' && item.checkpoint.length<=limit.code)slot.checkpoint=item.checkpoint;
            for(const label of ['a','b']){
                const run=cleanRun(item[label]);
                if(run)slot[label]=run;
            }
            if(Object.keys(slot).length)clean[key]=slot;
        }
        return Object.keys(clean).length?clean:null;
    }
    function node(tag,cls,text) {
        const e=document.createElement(tag);
        if(cls)e.className=cls;
        if(text!==undefined)e.textContent=text;
        return e;
    }
    function button(action,label,fn) {
        const b=node('button','ac-pt-button',label);
        b.type='button';b.dataset.pt=action;b.addEventListener('click',fn);
        return b;
    }
    function source(text) {
        const pre=node('pre','ac-pt-pre'),code=node('code');
        code.append(window.PythonSyntax?.highlight(text)??text);pre.append(code);return pre;
    }
    function textBlock(text) {
        const pre=node('pre','ac-pt-pre',text);pre.translate=false;return pre;
    }
    function details(label) {
        const el=node('details','ac-pt-details');el.append(node('summary','',label));return el;
    }
    function difference(a,b) {
        if(a===b)return null;
        const left=a.split('\n'),right=b.split('\n');
        let i=0;
        while(i<Math.min(left.length,right.length) && left[i]===right[i])i++;
        return {line:i+1,a:left[i],b:right[i]};
    }
    const byteSize=value=>value?new Blob([JSON.stringify(value)]).size:0;
    function mount(host,{phase,index,lesson,record,records,editor,inputs,save,goProject}) {
        if(![2,4,5].includes(phase))return null;
        const choice=record.choice===1?1:0,key='p'+choice;
        const project=lesson.projects[choice];
        const slot=()=>record.projectTools?.[key]||{};
        const panel=node('section','ac-project-tools');
        panel.dataset.phase=phase;
        const title=node('h3','ac-pt-heading');
        const description=node('p','ac-pt-intro');
        const content=node('div','ac-pt-content');
        const status=node('p','ac-pt-status');status.setAttribute('role','status');
        panel.append(title,description,content,status);host.append(panel);
        function write(field,value,commit=true) {
            const previous=record.projectTools, updated={...previous};
            const group={...slot()};
            if(value===undefined)delete group[field];else group[field]=value;
            if(Object.keys(group).length)updated[key]=group;else delete updated[key];
            const next=Object.keys(updated).length?updated:null;
            if(byteSize(next)>byteSize(previous)){
                let bytes=byteSize(next);
                for(const item of Object.values(records||{}))if(item!==record)bytes+=byteSize(item?.projectTools);
                if(bytes>limit.portfolio){
                    status.textContent=t('Хувилбарын зай дүүрсэн байна. Хэрэггүй болсон хуулбар эсвэл туршилтын бичлэгээ арилгаад дахин хадгалаарай.',
                        'Your space for checkpoints and comparisons is full. Remove an old checkpoint or run, then save again.');
                    return false;
                }
            }
            if(next)record.projectTools=next;else delete record.projectTools;
            if(commit)save?.();return true;
        }
        if(phase===2){
            title.textContent=t('Кодын хоёр хувилбар','Two versions of your code');
            description.textContent=t('Кодоо хадгалаад нэг мөрийг өөрчил. Хоёр хувилбарын ялгааг энд харж, хүсвэл сольж ажиллуулаарай.',
                'Keep a checkpoint, then change a line. Compare the two versions here or swap them to try the earlier one.');
            const actions=node('div','ac-pt-actions');
            const keep=button('keep',t('Одоогийн кодыг хадгалах','Save a checkpoint'),()=>{
                if(editor.readOnly || slot().checkpoint!==undefined || !write('checkpoint',editor.value))return;
                status.textContent=t('Хувилбарыг хадгаллаа. Одоо кодоо өөрчлөөд үзээрэй.','Checkpoint saved. Try changing a line in your editor.');
                refresh();swap.focus();
            });
            const swap=button('swap',t('Хоёр хувилбарыг солих','Swap the two versions'),()=>{
                const kept=slot().checkpoint;
                if(editor.readOnly||kept===undefined||kept===editor.value)return;
                if(!write('checkpoint',editor.value,false))return;
                editor.value=kept;editor.dispatchEvent(new Event('input',{bubbles:true}));
                // The normal editor input handler commits this draft and the exchanged checkpoint together.
                status.textContent=t('Хувилбаруудаа солилоо. Сая бичсэн код чинь хадгалсан талд байна.',
                    'Versions swapped. The code you were just editing is now the checkpoint.');refresh();
            });
            const clear=button('clear-checkpoint',t('Хуулбарыг арилгах','Remove checkpoint'),()=>{
                if(editor.readOnly || !confirm(t('Хадгалсан хуулбарыг арилгах уу? Засварлагч дахь код хэвээр үлдэнэ.','Remove the checkpoint? The code in the editor stays as it is.')))return;
                write('checkpoint',undefined);status.textContent=t('Хуулбарыг арилгалаа.','Checkpoint removed.');refresh();keep.focus();
            });
            const diff=node('div','ac-pt-difference');
            const preview=details(t('Хадгалсан кодоо харах','View checkpoint code'));
            actions.append(keep,swap,clear);content.append(actions,diff,preview);
            function refresh(){
                const before=slot().checkpoint, has=before!==undefined;
                keep.hidden=has;swap.hidden=clear.hidden=preview.hidden=!has;
                swap.disabled=!has||before===editor.value;
                diff.replaceChildren();
                if(!has)return;
                const summary=preview.firstElementChild;
                if(preview.lastChild===summary || preview.lastChild.textContent!==before)preview.replaceChildren(summary,source(before));
                const change=difference(before,editor.value);
                if(!change){diff.textContent=t('Засварлагч болон хадгалсан код ижил байна.','The editor matches your checkpoint.');return;}
                diff.append(node('p','',t('Эхний ялгаа · '+change.line+'-р мөр','First difference · line '+change.line)));
                const columns=node('div','ac-pt-pair');
                for(const [side,label] of [['a',t('Хадгалсан','Checkpoint')],['b',t('Одоо','Editor')]]){
                    const item=node('div','ac-pt-cell');
                    item.append(node('b','',label),textBlock(change[side]??t('〔Мөр алга〕','[No line]')));columns.append(item);
                }
                diff.append(columns);
            }
            editor.addEventListener('input',refresh);refresh();
            return {};
        }
        if(phase===4){
            title.textContent=t('Хоёр туршилтыг харьцуулах','Compare two runs');
            description.textContent=t('Кодоо ажиллуулаад үр дүнгээ A-д ав. Нэг утга эсвэл нэг мөрийг өөрчлөөд дахин ажиллуулж, B-д аваад харьцуулаарай.',
                'Run your code and keep the result as A. Change one input or one line, run again and keep B to compare.');
            let latest=null;
            const controls={},cards=node('div','ac-pt-pair'),comparison=node('p','ac-pt-comparison');
            for(const label of ['a','b']){
                const letter=label.toUpperCase(), cell=node('div','ac-pt-cell');
                const heading=node('h4','',t('Туршилт ','Run ')+letter);
                const capture=button('capture-'+label,t(letter+'-д авах','Keep as '+letter),()=>{
                    if(!currentRun())return;
                    if(!write(label,latest.run))return;
                    status.textContent=t('Саяын ажиллуулалтыг '+letter+'-д хадгаллаа.','The latest run is saved as '+letter+'.');
                    refreshCards();
                });
                const clear=button('clear-'+label,t('Арилгах','Remove'),()=>{
                    if(!confirm(t(letter+' туршилтын бичлэгийг арилгах уу?','Remove saved run '+letter+'?')))return;
                    write(label,undefined);status.textContent=t('Бичлэгийг арилгалаа.','Saved run removed.');refreshCards();
                    (capture.disabled?editor:capture).focus();
                });
                clear.setAttribute('aria-label',t(letter+' туршилтыг арилгах','Remove run '+letter));
                const body=node('div','ac-pt-run');
                const buttons=node('div','ac-pt-actions');buttons.append(capture,clear);
                cell.append(heading,buttons,body);cards.append(cell);
                controls[label]={capture,clear,body};
            }
            function currentRun(){return latest && !editor.readOnly && latest.code===editor.value && latest.stdin===(inputs?.value||'');}
            function updateButtons(){
                for(const {capture} of Object.values(controls))capture.disabled=!currentRun();
            }
            function refreshCards(){
                for(const [label,{body,clear}] of Object.entries(controls)){
                    const run=slot()[label];
                    clear.hidden=!run;
                    body.replaceChildren();
                    if(!run){body.append(node('p','ac-pt-empty',t('Бичлэг алга.','No run saved.')));continue;}
                    const stamp=node('strong','ac-pt-state',run.type==='error'?t('Алдаа гарсан','Error'):t('Ажилласан','Completed'));
                    stamp.dataset.state=run.type;body.append(stamp);
                    body.append(node('p','ac-pt-label',t('Гаралт','Output')),textBlock(renderField(run,'out')||t('〔Гаралтгүй〕','[No output]')));
                    if(run.type==='error')body.append(textBlock(renderField(run,'error')));
                    const more=details(t('Код ба оролт','Code and input'));
                    more.append(textBlock(renderField(run,'source')),node('b','',t('Оролт','Input')),textBlock(renderField(run,'stdin')||t('〔Оролтгүй〕','[No input]')));
                    body.append(more);
                }
                comparison.textContent=compare(slot().a,slot().b);
                updateButtons();
            }
            content.append(cards,comparison);
            function inputsChanged(){
                updateButtons();
                if(latest)status.textContent=currentRun()?t('Сүүлийн ажиллуулалттай таарч байна.','The editor matches the latest run.'):
                    t('Код эсвэл оролт өөрчлөгдлөө. Шинэ хувилбараа ажиллуулаад хадгалаарай.','Your code or input changed. Run the new version before keeping it.');
            }
            editor.addEventListener('input',inputsChanged);inputs?.addEventListener('input',inputsChanged);refreshCards();
            return {onResult(result){
                if(!panel.isConnected || typeof result?.code!=='string' || !['pass','error'].includes(result.type))return;
                const stdin=typeof result.stdin==='string'?result.stdin:'';
                latest={code:result.code,stdin,run:cleanRun({type:result.type,source:result.code,stdin,out:result.out||'',error:result.type==='error'?result.text||'':''})};
                updateButtons();
                status.textContent=currentRun()?t('Энэ ажиллуулалтыг A эсвэл B-д авч болно.','You can keep this run as A or B.'):'';
            }};
        }
        title.textContent=t('Миний бүтээлийн хуудас','My project card');
        description.textContent=project.title;
        const draft=record.drafts?.[key], code=draft??project.starter;
        const excerpt=details(draft===undefined?t('Эхлэх кодыг харах','View starter code'):t('Миний төслийн код','View my project code'));
        excerpt.append(source(code));
        const actions=node('div','ac-pt-actions');
        actions.append(button('card-export',t('Бүтээлийн хуудас татах (.md)','Download project card (.md)'),()=>{
            const md=['# '+project.title,'',lesson.title,'',project.brief,'',
                '## '+(draft===undefined?t('Эхлэх код','Starter code'):t('Миний код','My code')),'',fence(code,'python')];
            for(const label of ['a','b']){
                const run=slot()[label];
                if(!run)continue;
                md.push('','## '+t('Туршилт ','Run ')+label.toUpperCase(),'',
                    t('Оролт','Input'),'',fence(renderField(run,'stdin')),'',t('Гаралт','Output'),'',fence(renderField(run,'out')));
                if(run.type==='error')md.push('',t('Алдаа','Error'),'',fence(renderField(run,'error')));
            }
            if(record.extension?.trim())md.push('','## '+t('Ажиглалт','Experiment notes'),'',record.extension.trim());
            if(record.reflection?.trim())md.push('','## '+t('Миний дүгнэлт','My reflection'),'',record.reflection.trim());
            const link=node('a');
            const url=URL.createObjectURL(new Blob([md.join('\n')+'\n'],{type:'text/markdown;charset=utf-8'}));
            link.href=url;link.download='lesson-'+String(index+1).padStart(2,'0')+'-project-'+(choice+1)+'.md';
            link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
            status.textContent=t('Бүтээлийн хуудсыг татахаар бэлдлээ.','Your project card is ready to download.');
        }));
        if(goProject)actions.append(button('return',t('Төслийн коддоо буцах','Return to my project'),goProject));
        content.append(excerpt,actions);
        return {};
    }
    function renderField(run,key){
        return run[key]+(run[key+'Clipped']?t('\n〔Үргэлжлэл товчилсон〕','\n[Preview truncated]'):'');
    }
    function compare(a,b){
        if(!a||!b)return '';
        const changed=difference(a.out,b.out);
        let text=changed?t('Гаралтын эхний ялгаа '+changed.line+'-р мөрөнд байна.','Output first differs on line '+changed.line+'.'):
            a.outClipped||b.outClipped?t('Хадгалсан гаралтын эхний хэсгүүд ижил.','The saved output previews match.'):
            t('Хоёр ажиллуулалтын гаралт ижил.','Both runs printed the same output.');
        if(a.type!==b.type)text+=' '+(a.type==='error'?t('A дээр алдаа гарсан, B ажилласан.','A failed and B completed.'):t('A ажилласан, B дээр алдаа гарсан.','A completed and B failed.'));
        else if(a.type==='error' && a.error!==b.error)text+=' '+t('Алдааны тайлбарууд өөр байна.','The error messages differ.');
        return text;
    }
    function fence(text,language=''){
        const longest=Math.max(2,...Array.from(text.matchAll(/`+/g),match=>match[0].length));
        const mark='`'.repeat(longest+1);
        return mark+language+'\n'+text+'\n'+mark;
    }
    window.AcademyProjectTools={mount,read};
})();
