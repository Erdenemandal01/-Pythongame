/* Optional Lab and Debug activities use the student's existing editor and Python worker. */
(() => {
    'use strict';
    const t = (mn,en) => globalThis.GameLocale?.lang === 'en' ? en : mn;
    let cleanup;
    const walkthrough = String.raw`
import sys, json, io, contextlib, itertools

def lab_walk(source):
    filename = "<learner-lab>"
    steps, output = [], ""
    clipped = False
    problem = None
    class TraceLimit(BaseException):
        pass
    class Screen(io.TextIOBase):
        def write(self, text):
            nonlocal output
            if len(output) < 601:
                output += text[:601-len(output)]
            return len(text)

    def brief(value, depth=0):
        typ = type(value)
        if typ is str:
            return repr(value[:32]) + ("…" if len(value) > 32 else "")
        if typ in (int, float, bool, type(None)):
            return str(value)[:40] if typ is not int or value.bit_length() < 150 else "…"
        if typ not in (list, tuple, dict, set) or depth >= 2:
            return "<" + typ.__name__ + ">"
        if not value and typ is set:
            return "set()"
        if typ is dict:
            items = [brief(k,depth+1)+": "+brief(v,depth+1) for k,v in itertools.islice(value.items(),3)]
        else:
            items = [brief(v,depth+1) for v in itertools.islice(value,3)]
        if len(value)>3:
            items.append("…")
        ends = {list:"[]",tuple:"()",dict:"{}",set:"{}"}[typ]
        join = ", ".join(items) + ("," if typ is tuple and len(value)==1 else "")
        return (ends[0]+join+ends[1])[:52]

    scope = {"__name__":"__main__", "input":input}
    def snapshot(line, function, variables):
        values = []
        for name in reversed(variables):
            if not name.startswith("__") and not (name=="input" and variables[name] is input):
                values.append([name[:36],brief(variables[name])[:52]])
                if len(values)==5:
                    break
        steps.append([line,function[:40],values[::-1],len(output)])

    def trace(frame,event,arg):
        if frame.f_code.co_filename != filename:
            return None
        if event == "line":
            if len(steps)>=40:
                raise TraceLimit()
            snapshot(frame.f_lineno,frame.f_code.co_name,frame.f_locals)
        return trace

    previous = sys.gettrace()
    try:
        program=compile(source,filename,"exec")
        with contextlib.redirect_stdout(Screen()):
            try:
                sys.settrace(trace)
                exec(program,scope)
            finally:
                sys.settrace(previous)
        snapshot(None,"<module>",scope)
    except TraceLimit:
        clipped=True
    except BaseException as exc:
        line=exc.lineno if isinstance(exc,SyntaxError) else None
        tb=exc.__traceback__
        while tb:
            if tb.tb_frame.f_code.co_filename==filename:
                line=tb.tb_lineno
            tb=tb.tb_next
        problem=[line,(type(exc).__name__+": "+str(exc))[:220]]

    report={"steps":steps,"output":output,"clipped":clipped,"problem":problem}
    packet=json.dumps(report,ensure_ascii=False,separators=(",",":"))
    # Stay below the shared classroom console limit even with escaped control characters.
    while len(packet)>17500 and steps:
        steps.pop()
        report["clipped"]=True
        packet=json.dumps(report,ensure_ascii=False,separators=(",",":"))
    print(packet)
`;
    function element(tag,cls,text) {
        const el=document.createElement(tag);
        if(cls) el.className=cls;
        if(text!==undefined) el.textContent=text;
        return el;
    }
    function button(label,click) {
        const b=element('button','ai-button',label);
        b.type='button';b.addEventListener('click',click);return b;
    }
    function raw(tag,cls,value) {
        const el=element(tag,cls,value);el.translate=false;return el;
    }
    function section(host,title,help) {
        const panel=element('section','ai-section');
        panel.append(element('h4','ai-heading',title),element('p','ai-help',help));
        host.append(panel);
        return panel;
    }
    function leave() { cleanup?.();cleanup=undefined; }

    function lab(host,{editor,execute,stop}) {
        const panel=section(host,t('Код дотор юу болж байна вэ?','What happens inside your code?'),
            t('Алхам бүрийн өмнө хувьсагчид ямар утгатай байгааг ажиглаарай.','Step through the code and inspect the variables before each line runs.'));
        const regular=editor.closest('.ac-editor');
        const normalRun=regular.querySelector('.ac-run');
        const reset=regular.querySelector('.ac-filebar .ac-file-button:last-child');
        const bar=element('div','ai-bar'), viewer=element('div','ai-viewer');
        const note=element('p','ai-status');note.setAttribute('role','status');
        let report, source, cursor=0, running=false, stamp=0, wasResetDisabled=false;
        const observe=button(t('Мөрөөр нь ажиллуулах','Trace my code'),run);
        const halt=button(t('Зогсоох','Stop trace'),cancel);
        halt.hidden=true;
        bar.append(observe,halt);panel.append(bar,note,viewer);

        function lock(value) {
            if(value===running) return;
            if(value) wasResetDisabled=reset?.disabled;
            running=value;observe.hidden=value;halt.hidden=!value;
            editor.readOnly=value;normalRun.disabled=value;
            if(reset) reset.disabled=value||wasResetDisabled;
        }
        function cancel() {
            if(!running) return;
            stamp++;stop();lock(false);
            note.textContent=t('Ажиглалтыг зогсоолоо.','Trace stopped.');
        }
        function clear() {
            report=null;viewer.replaceChildren();note.textContent='';
        }
        function showStep() {
            const [line,fn,values,printed]=report.steps[cursor];
            const previous=button(t('← Өмнөх','← Back'),()=>go(-1));
            const next=button(t('Дараах →','Next →'),()=>go(1));
            const count=element('span','ai-count',(cursor+1)+' / '+report.steps.length);
            previous.disabled=cursor===0;next.disabled=cursor===report.steps.length-1;
            const nav=element('div','ai-nav');nav.append(previous,count,next);
            const place=line===null ? t('Код дуусахад','At the end of the program')
                : t(line+'-р мөрийн өмнө','Before line '+line)+(fn==='<module>'?'':' · '+fn+'()');
            const body=element('div','ai-step');body.append(element('strong','ai-step-heading',place));
            if(line!==null) body.append(raw('pre','ai-line',source[line-1]||''));
            if(values.length) {
                const list=element('dl','ai-values');
                for(const [name,value] of values) list.append(raw('dt','',name),raw('dd','',value));
                body.append(list);
            } else body.append(element('p','ai-muted',t('Энд хараахан хувьсагч алга.','No variables here yet.')));
            const printedText=Array.from(report.output).slice(0,Math.min(printed,600)).join('');
            if(printedText) body.append(element('small','ai-muted',t('Энэ хүртэлх гаралт','Output so far')),
                raw('pre','ai-line',printedText+(printed>600?'…':'')));
            viewer.replaceChildren(nav,body);
            function go(distance) {
                cursor+=distance;showStep();
                const buttons=viewer.querySelectorAll('.ai-nav button');
                const focus=buttons[distance>0?1:0];
                (focus.disabled?buttons[distance>0?0:1]:focus).focus({preventScroll:true});
            }
        }
        function run() {
            if(running) return;
            if(editor.readOnly||normalRun.hidden) {
                note.textContent=t('Одоогийн шалгалт дуусахад ажиглаарай.','Wait for the current check to finish.');return;
            }
            clear();
            if(!editor.value.trim()) {
                note.textContent=t('Ажиглах кодоо редакторт бичээрэй.','Write some code in the editor to trace.');return;
            }
            const id=++stamp;source=editor.value.split('\n');
            const wrapped=walkthrough+'\nlab_walk('+JSON.stringify(editor.value)+')';
            execute(wrapped,{preview:true,replies:{value:''}},{
                lock:busy=>{if(id===stamp)lock(busy);},stdout:()=>{},
                show:result=>{
                    if(id!==stamp) return;
                    if(result.type==='idle') {note.textContent=t('Python ажиллаж байна…','Python is running…');return;}
                    if(result.type!=='pass') {
                        note.textContent=GameLocale.text(result.text)||t('Ажиглалт дууссангүй.','The trace did not finish.');return;
                    }
                    try {report=JSON.parse(result.out);} catch {
                        note.textContent=t('Ажиглалтын үр дүнг уншиж чадсангүй.','The trace could not be read.');return;
                    }
                    if(report.problem) {
                        const [line,error]=report.problem;
                        note.replaceChildren(document.createTextNode(line?t(line+'-р мөр · ','Line '+line+' · '):''),raw('span','',error));
                    } else if(report.clipped) note.textContent=t('Эхний '+report.steps.length+' алхмыг харууллаа.','Showing the first '+report.steps.length+' steps.');
                    else note.textContent='';
                    cursor=0;if(report.steps.length)showStep();
                }
            });
        }
        editor.addEventListener('input',clear);
        return ()=>{cancel();stamp++;editor.removeEventListener('input',clear);};
    }

    function debug(host,{editor,record,save}) {
        const panel=section(host,t('Сэжигтэй мөрөө шалгах','Investigate a line'),
            t('Алдааны шалтгаан аль мөрөнд байж болохыг сонгоод, юу өөрчлөхөө тэмдэглээрэй.','Choose a line you suspect and note what you think should change.'));
        const label=element('label','ai-number-label'), line=element('input','ai-number');
        line.type='number';line.min='1';line.step='1';
        line.value=String(record.debugLine||1);
        label.append(element('span','',t('Мөр','Line')),line);
        const code=raw('pre','ai-line','');
        const currentLine=()=>Math.max(1,Math.min(Number(line.value)||1,editor.value.split('\n').length));
        const jump=button(t('Кодонд очих','Go to line'),()=>{
            const lines=editor.value.split('\n'), n=currentLine();
            const start=lines.slice(0,n-1).reduce((s,part)=>s+part.length+1,0);
            editor.focus();editor.setSelectionRange(start,start+lines[n-1].length);
            const lh=parseFloat(getComputedStyle(editor).lineHeight);
            if(lh) editor.scrollTop=Math.max(0,lh*(n-2));
        });
        const row=element('div','ai-bar');row.append(label,jump);
        const guess=element('textarea','ai-guess');
        guess.maxLength=1000;guess.rows=2;guess.value=record.debugHypothesis||'';
        const note=element('label','ai-guess-label');
        note.append(element('span','',t('Миний таамаг','My hypothesis')),guess);
        const test=button(t('Засвараа шалгах','Test my fix'),()=>{
            if(!editor.readOnly) editor.closest('.ac-editor').querySelector('.ac-run').click();
        });
        const evidence=element('p','ai-status');evidence.setAttribute('role','status');
        function updateLine() {
            const lines=editor.value.split('\n');
            line.max=String(lines.length);
            line.value=String(Math.trunc(currentLine()));
            code.textContent=lines[Number(line.value)-1] || ' ';
        }
        function choose(value) {line.value=String(value);updateLine();record.debugLine=Number(line.value);save();}
        function changed() {updateLine();evidence.replaceChildren();}
        function checked(event) {
            const data=event.detail;
            if(!data || data.code!==editor.value) return;
            if(data.ok) {
                evidence.textContent=t('Энэ код даалгаврын шалгалтыг давлаа. Засварын үр дүн таамагтай чинь таарч байна уу?','This code passed the task checks. Does your fix support your hypothesis?');
            } else if(data.kind==='code') {
                const found=/^(?:(\d+)-р мөр|Line (\d+)) ·/.exec(data.error||'');
                const n=found&&Number(found[1]||found[2]);
                evidence.textContent=t('Python ажиллахдаа алдаа илрүүллээ.','Python reported an error while running this code.');
                if(n>=1 && n<=Number(line.max)) {
                    const b=button(t(n+'-р мөрийг харах','Inspect line '+n),()=>{choose(n);jump.click();});
                    evidence.append(' ',b);
                }
            } else {
                evidence.textContent=t('Код ажилласан ч даалгаврын нэг нөхцөл биелсэнгүй. Терминал дахь шалгалтын тайлбарыг таамагтайгаа тулгаарай.','The code ran, but a task check failed. Compare the terminal message with your hypothesis.');
            }
        }
        line.addEventListener('change',()=>choose(line.value));
        guess.addEventListener('input',()=>{record.debugHypothesis=guess.value;save();});
        editor.addEventListener('input',changed);
        editor.addEventListener('academy-checked',checked);
        updateLine();panel.append(row,code,note,test,evidence);
        return ()=>{editor.removeEventListener('input',changed);editor.removeEventListener('academy-checked',checked);};
    }
    function mount(host,options) {
        leave();host.replaceChildren();
        if(options.phase===1) cleanup=lab(host,options);
        if(options.phase===3) cleanup=debug(host,options);
    }
    globalThis.AcademyInvestigate={mount,leave};
})();
