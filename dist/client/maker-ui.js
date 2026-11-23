(() => {
    'use strict';
    const columns = 12, rows = 8, cell = 20;
    const modes = {
        garden: {
            title:'Лууны цэцэрлэг', icon:'❧',
            guide:'12 × 8 нүдэн дээр мод, цэцэг, нуур байрлуулж лууныхаа гэрийг бариарай.',
            challenge:'Голыг гүүр мэт хоёр нүдээр тасалж, луунаас цэцэг хүртэл хуурай зам гаргаарай.',
            usage:'tile(x, y, kind)', args:'x нь 0–11, y нь 0–7. Зүүн дээд булан (0, 0).',
            values:['grass','water','tree','flower','rock','dragon'],
            example:[
                '# Голыг зүүнээс баруун тийш зур.',
                'for x in range(12):','    tile(x, 4, "water")','',
                '# Ойн зах дагуу мод тарь.','for x in range(0, 12, 2):','    tile(x, 0, "tree")',
                'for x in [1, 3, 5, 7, 9]:','    tile(x, 6, "flower")','',
                'tile(8, 2, "rock")','tile(3, 2, "dragon")'
            ].join('\n')
        },
        pixel: {
            title:'Пиксел зураг', icon:'▦',
            guide:'Нүд бүрийн өнгийг Python-оор сонгож, жижигхэн зураг эсвэл багийн тэмдэг бүтээ.',
            challenge:'Зүрхний хоёр талыг ижил өнгөтэй байлгаж, голд нь өөр өнгийн жижиг дүрс зураарай.',
            usage:'dot(x, y, color)', args:'x нь 0–11, y нь 0–7. Өнгөө #RRGGBB хэлбэрээр бичээрэй.',
            values:['#ff7187','#ffcf71','#93df9e','#69c9f0','#a598f3','#f0e8c8'],
            example:[
                '# Нэг тэмдэг нэг пиксел болно.',
                'heart = [','    "..##..##..",','    ".########.",','    ".########.",',
                '    "..######..",','    "...####...",','    "....##....",',']','',
                'for y, line in enumerate(heart):','    for x, mark in enumerate(line):',
                '        if mark == "#":','            dot(x + 1, y + 1, "#ff7187")'
            ].join('\n')
        },
        bars: {
            title:'Өгөгдлийн график', icon:'▥',
            guide:'Тоон утгаа харьцуулахын тулд нэр, хэмжээг нь өгч баганан график босгоорой.',
            challenge:'Дөрвөн өөр өдөр хэмжсэн нэг үзүүлэлтээ оруулаад хамгийн их утгатай өдрийг кодоор хэвлэ.',
            usage:'bar(label, value)', args:'Нэрийг текстээр, хэмжээг 0–100 хооронд тоогоор бичнэ.',
            values:[],
            example:[
                '# Ангийн долоо хоногийн уншлага (хуудас).',
                'pages = {"Даваа": 24, "Мягмар": 38, "Лхагва": 31, "Пүрэв": 52}',
                'for day, count in pages.items():','    bar(day, count)','',
                'print("Нийт хуудас:", sum(pages.values()))'
            ].join('\n')
        }
    };

    const tileSprites = {
        tree:['.....ll.....','...llllll...','..lgggggll..','.llggggggll.','..gggggggg..','.gggGgggggg.','gggGGGgggGgg','.GGGGGGGGGG.','....tttt....','....tsst....','....tsst....','...tttttt...'],
        flower:['.....yy.....','....yccy....','.....yy.....','.....sg.....','..p..sg..b..','.pmp.gs.bab.','..p..gs..b..','..gs.ggg.gs.','...ggGgggG..','..gGGGGGGgg.'],
        rock:['............','....ssss....','...slwwls...','..slllwwls..','.sllsssslls.','ssssoosssss.','.sooosssos..','..ooooooo...'],
        dragon:['.......yy...','....y.ggyg..','....gglgggg.','..l.gglggklg','.ldlgGGggggg','ldddgGGg....','.ldggGGgg...','..ggGGGgggg.','gggGGggggggg','.GGGGGggg...','..g.g..gg...','..ttt..ttt..']
    };
    const inks = {l:'#9bdb83',g:'#429c68',G:'#26674f',t:'#784b34',s:'#706c74',w:'#c3c1b1',o:'#43485b',
        p:'#e575b3',m:'#ffdc86',b:'#8eb9ff',a:'#d2ebff',y:'#f5ba55',c:'#ec855c',d:'#6a7ab8',k:'#182834'};
    const namedInks = {red:'#ed6375',blue:'#57a5f3',green:'#71bc79',yellow:'#f5ce70',purple:'#aa92eb',pink:'#ea86c4',
        orange:'#ee9c52',black:'#171b29',white:'#f6efe5',brown:'#906644',cyan:'#61d7dc',gray:'#8b93a3',grey:'#8b93a3',
        gold:'#f3c362',teal:'#45bdad',lime:'#a1df69',navy:'#323e74'};
    const chartInks=['#93df9e','#69c9f0','#a598f3','#ffcf71','#ff7187','#77d2c7'];
    let active;
    const make = (tag,className,text) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    };
    function button(text,className,action) {
        const el=make('button',className,text);
        el.type='button';el.addEventListener('click',action);return el;
    }
    function sprite(ctx,kind,x,y) {
        const shape=tileSprites[kind];
        if (!shape) return;
        const sx=x*cell+4, sy=y*cell+(cell-shape.length)/2|0;
        shape.forEach((line,dy)=>Array.from(line).forEach((ch,dx)=>{
            if (!inks[ch]) return;
            ctx.fillStyle=inks[ch];
            ctx.fillRect(sx+dx,sy+dy,1,1);
        }));
    }
    function grass(ctx,x,y) {
        const sx=x*cell,sy=y*cell;
        ctx.fillStyle=(x+y)%2?'#80b965':'#85c16c';ctx.fillRect(sx,sy,cell,cell);
        const dx=(x*19+y*3)%12, dy=(x*7+y*11)%10;
        ctx.fillStyle='#a7d178';ctx.fillRect(sx+dx+2,sy+dy+2,1,2);ctx.fillRect(sx+dx+3,sy+dy+3,1,1);
        ctx.fillStyle='#6da961';ctx.fillRect(sx+14,sy+15,2,1);ctx.fillRect(sx+15,sy+14,1,1);
    }
    function gridArt(canvas,mode,data) {
        canvas.width=columns*cell;canvas.height=rows*cell;
        const ctx=canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled=false;
        const tiles = new Map(data.map(p => [p.y*columns+p.x,p]));
        for(let y=0;y<rows;y++) for(let x=0;x<columns;x++) {
            const item=tiles.get(y*columns+x);
            const sx=x*cell,sy=y*cell;
            if(mode==='pixel') {
                const value=item?.color;
                const light=(x+y)%2 ? '#2d3347':'#282d3f';
                ctx.fillStyle=value && (/^#[0-9a-f]{3,8}$/i.test(value) || CSS.supports('color',value)) ? value : namedInks[value] || light;
                ctx.fillRect(sx,sy,cell,cell);
            } else if(item?.kind==='water') {
                ctx.fillStyle='#418fac';ctx.fillRect(sx,sy,cell,cell);
                ctx.fillStyle='#70c5ce';ctx.fillRect(sx+((x+y)%4)+2,sy+4,7,1);ctx.fillRect(sx+11,sy+12,4,1);
                if(y===0||tiles.get((y-1)*columns+x)?.kind!=='water') {
                    ctx.fillStyle='#c1d681';ctx.fillRect(sx,sy,cell,2);
                    ctx.fillStyle='#78b5ae';ctx.fillRect(sx,sy+2,cell,1);
                }
            } else {grass(ctx,x,y);if(item) sprite(ctx,item.kind,x,y);}
        }
    }
    function bars(canvas,data) {
        const width=720,line=42,left=162,right=74,top=26,height=Math.max(206,top+line*data.length+30);
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle='#171c2c';ctx.fillRect(0,0,width,height);
        ctx.font='16px "Segoe UI", sans-serif';
        const plot=width-left-right;
        for (let i=0;i<=4;i++) {
            const x=left+plot*i/4;
            ctx.fillStyle='#3b4357';ctx.fillRect(x,top,1,height-top-24);
            ctx.fillStyle='#adb5c7';ctx.textAlign='center';ctx.fillText(String(i*25),x,17);
        }
        data.forEach((point,i)=>{
            const y=top+i*line+9, extent=point.value/100*plot;
            ctx.fillStyle=chartInks[i%chartInks.length];ctx.fillRect(left,y,extent,24);
            ctx.fillStyle='#e3e7f0';ctx.textAlign='right';
            let label=String(point.label);
            if(ctx.measureText(label).width>left-14) {
                while(label.length && ctx.measureText(label+'…').width>left-14) label=label.slice(0,-1);
                label+='…';
            }
            ctx.fillText(label,left-9,y+18);
            ctx.textAlign='left';ctx.fillText(String(point.value),left+extent+7,y+18);
        });
    }
    function gardenMap(points) {
        const grid=Array.from({length:6},()=>Array(9).fill('.'));
        const tiles={grass:'.',flower:'E',rock:'#',tree:'#',water:'#',dragon:'D'};
        for(const point of points) {
            const x=Math.round(point.x*8/11),y=Math.round(point.y*5/7);
            grid[y][x]=tiles[point.kind]||'.';
        }
        const cells=grid.flatMap((row,y)=>row.map((value,x)=>({x,y,value})));
        const eggs=cells.filter(p=>p.value==='E').sort((a,b)=>a.x-b.x || a.y-b.y);
        if(!eggs.length) {
            const goal=cells.find(p=>p.x===4 && p.y===3);
            grid[goal.y][goal.x]='E';eggs.push(goal);
        }
        function place(symbol,targetX,targetY) {
            const open=cells.filter(p=>grid[p.y][p.x]==='.');
            const obstacles=cells.filter(p=>['#','D'].includes(grid[p.y][p.x]));
            const options=open.length?open:obstacles.length?obstacles:cells.filter(p=>grid[p.y][p.x]==='E');
            const distance=p=>Math.abs(p.x-targetX)+Math.abs(p.y-targetY);
            options.sort((a,b)=>distance(a)-distance(b));
            const p=options[0];grid[p.y][p.x]=symbol;
        }
        place('S',eggs[0].x-1,eggs[0].y);
        const last=eggs[eggs.length-1];
        place('C',last.x+1,last.y);
        return {title:'Миний лууны цэцэрлэг',rows:grid.map(row=>row.join(''))};
    }
    function stopSession() {
        if (!active) return;
        active.cancel();active=null;
    }
    function mount(root,adapter) {
        stopSession();
        const state=adapter.getSave();
        const cache={};
        let worker=null,ready=false,timer,running=false,generation=0;
        function cancel() {
            generation++;clearTimeout(timer);worker?.terminate();worker=null;ready=false;running=false;
        }
        const session={cancel};
        active=session;
        function open(mode) {
            cancel();
            state.mode=mode;
            adapter.save();
            const item=modes[mode];
            const shell=make('section','mk-studio');
            root.replaceChildren(shell);
            const head=make('div','mk-head');
            head.append(make('h1','','Бүтээлийн тайз'),button('Хичээл рүү буцах','mk-quiet',()=>adapter.openClassroom()));
            shell.append(head);
            const tabs=make('nav','mk-modes');
            tabs.setAttribute('aria-label','Бүтээл сонгох');
            Object.entries(modes).forEach(([id,m])=>{
                const b=button('','mk-mode',()=>{if(mode!==id)open(id)});
                b.append(make('span','mk-icon',m.icon),make('span','',m.title));
                if(id===mode)b.setAttribute('aria-current','page');
                tabs.append(b);
            });
            shell.append(tabs);
            const title=make('h2','mk-subtitle',item.title);
            const guide=make('p','mk-guide',item.guide);
            shell.append(title,guide);
            const layout=make('div','mk-layout');
            const board=make('div','mk-board');
            const picture=make('canvas','mk-canvas');
            picture.classList.toggle('is-chart',mode==='bars');
            picture.setAttribute('role','img');picture.setAttribute('aria-label',item.title);
            const label=make('div','mk-board-head');
            const coord=make('small','mk-coord',mode==='bars'?'0–100':'12 × 8');
            label.append(make('strong','','Миний бүтээл'),coord);
            const artBox=make('div','mk-art-box');
            artBox.append(picture);
            if(mode!=='bars') {
                function coordinates(event) {
                    const rect=picture.getBoundingClientRect();
                    const x=Math.max(0,Math.min(11,Math.floor((event.clientX-rect.left)/rect.width*columns)));
                    const y=Math.max(0,Math.min(7,Math.floor((event.clientY-rect.top)/rect.height*rows)));
                    coord.textContent='('+x+', '+y+')';
                }
                picture.addEventListener('pointermove',coordinates);
                picture.addEventListener('pointerdown',coordinates);
                picture.addEventListener('pointerleave',()=>coord.textContent='12 × 8');
            }
            const note=make('p','mk-status');
            note.setAttribute('role','status');
            const consoleOut=make('pre','mk-output');
            consoleOut.hidden=true;
            const download=button('PNG татах','mk-quiet',()=>{
                picture.toBlob(blob=>{
                    if(!blob)return;
                    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
                    anchor.href=url;anchor.download='python-quest-'+mode+'.png';anchor.click();
                    setTimeout(()=>URL.revokeObjectURL(url),1000);
                },'image/png');
            });
            download.disabled=true;
            const boardFoot=make('div','mk-board-foot');
            boardFoot.append(note,download);
            board.append(label,artBox,boardFoot,consoleOut);
            let exchange;
            if(mode==='garden' && adapter.openGardenLevel){
                exchange=button('Цэцэрлэгээ түвшин болгох','mk-quiet',()=>{
                    const last=cache.garden;
                    if(last?.code===input.value)adapter.openGardenLevel(gardenMap(last.points));
                });
                exchange.disabled=true;
                const conversion=make('div','mk-garden-level');
                conversion.append(exchange,make('small','','9 × 6 газрын зурагт цэцэг өндөг болж, мод, ус, чулуу зам хаана. Зураг дээр эхлэл, агуйгаа зөөж болно.'));
                board.append(conversion);
            }
            const dataTable=make('details','mk-table');
            const values=make('dl');
            dataTable.append(make('summary','','Графикийн утгууд'),values);
            if(mode==='bars')board.append(dataTable);
            const edit=make('div','mk-editor');
            const editHead=make('div','mk-edithead');
            const input=make('textarea','mk-code');
            input.setAttribute('aria-label',item.title+' · Python код');
            input.spellcheck=false;input.setAttribute('autocapitalize','off');input.setAttribute('autocomplete','off');input.setAttribute('autocorrect','off');
            input.maxLength=20000;input.value=state.drafts[mode]??item.example;
            const reset=button('Жишээг сэргээх','mk-text',()=>{
                if(running || input.value===item.example) return;
                if(!confirm('Энэ бүтээлийн кодыг жишээгээр солих уу?'))return;
                input.value=item.example;saveText();run();
            });
            editHead.append(make('span','',mode+'.py'),reset);
            const actions=make('div','mk-actions');
            const play=button('▶ Бүтээх','mk-play',run);
            const stop=button('■ Зогсоох','mk-quiet',()=>{cancel();lock(false);status('Кодыг зогсоолоо.','idle');});
            stop.hidden=true;actions.append(make('small','','Ctrl / ⌘ + Enter'),play,stop);
            edit.append(editHead,input,actions);
            layout.append(board,edit);shell.append(layout);
            const brief=make('div','mk-brief');
            const commands=make('section','mk-reference');
            commands.append(make('h3','','Команд'),make('code','',item.usage),make('p','',item.args));
            if(item.values.length) {
                const keys=make('div','mk-keys');
                for(const value of item.values) {
                    const entry=make('span','',value);
                    if(mode==='pixel')entry.style.setProperty('--swatch',value);
                    keys.append(entry);
                }
                if(mode==='pixel') keys.classList.add('is-palette');
                commands.append(keys);
            }
            const challenge=make('section','mk-challenge');
            challenge.append(make('h3','','Бүтээлээ өөрчилье'),make('p','',item.challenge));
            brief.append(commands,challenge);shell.append(brief);
            function lock(value){running=value;input.readOnly=value;play.hidden=value;stop.hidden=!value;reset.disabled=value;if(exchange && value)exchange.disabled=true;}
            function status(text,tone){note.textContent=text;note.dataset.tone=tone;}
            function display(data) {
                if(mode==='bars') {
                    bars(picture,data);
                    values.replaceChildren();
                    for (const row of data) values.append(make('dt','',row.label),make('dd','',row.value));
                    dataTable.hidden=!data.length;
                }
                else gridArt(picture,mode,data);
                download.disabled=!data.length;
                if(exchange)exchange.disabled=!data.length || cache.garden?.code!==input.value;
                picture.setAttribute('aria-label',mode==='bars'
                    ? 'График. '+data.map(p=>p.label+' '+p.value).join(', ')
                    : item.title+' · '+new Set(data.map(p=>p.x+','+p.y)).size+' тэмдэглэсэн нүд');
            }
            function saveText(){
                state.drafts[mode]=input.value;adapter.save();
                if(exchange)exchange.disabled=true;
                status('Код хадгалагдлаа. Шинэ бүтээлээ харахын тулд «Бүтээх» дар.','idle');
            }
            input.oninput=saveText;
            input.onkeydown=e=>{
                if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run();return;}
                if(running||e.isComposing)return;
                if(e.key==='Tab'&&!e.shiftKey) {
                    e.preventDefault();input.setRangeText('    ',input.selectionStart,input.selectionEnd,'end');saveText();
                } else if(e.key==='Enter'&&!e.shiftKey) {
                    e.preventDefault();
                    const prev=input.value.slice(0,input.selectionStart).split('\n').pop();
                    const spaces=prev.match(/^ */)[0]+(prev.trimEnd().endsWith(':')?'    ':'');
                    input.setRangeText('\n'+spaces,input.selectionStart,input.selectionEnd,'end');saveText();
                }
            };
            function run() {
                if(running)return;
                const code=input.value;
                if(!code.trim()){status('Эхлээд Python код бичээрэй.','error');return;}
                lock(true);
                status(ready?'Код ажиллаж байна…':'Python ачаалж байна…','idle');
                consoleOut.hidden=true;
                const output=[];let size=0;
                const token=generation,live=()=>active===session&&generation===token;
                const fail=text=>{if(!live())return;cancel();lock(false);status(text,'error');};
                const send=()=>{
                    clearTimeout(timer);
                    timer=setTimeout(()=>fail('Код 5 секундээс удаан ажиллалаа. Давталтын нөхцөлөө шалгаарай.'),5000);
                    worker.postMessage({code,academy:{sandbox:true,check:'',maker:mode}});
                };
                try {
                    if(!worker)worker=new Worker('worker.js?v=academy-1');
                    worker.onerror=e=>fail('Python эхэлж чадсангүй. '+(e.message||'Дахин ажиллуулна уу.'));
                    worker.onmessage=({data})=>{
                        if(!live())return;
                        if(data.type==='ready'){ready=true;send();return;}
                        if(data.type==='fatal'){fail(data.error);return;}
                        if(data.type==='stdout'){
                            const line=String(data.text);
                            if(size<20000){output.push(line.slice(0,20000-size));size+=line.length+1;}
                            return;
                        }
                        if(data.type!=='result')return;
                        clearTimeout(timer);lock(false);
                        consoleOut.textContent=output.join('\n');consoleOut.hidden=!consoleOut.textContent;
                        if(!data.ok){status(data.error||'Командаа шалгаад дахин туршаарай.','error');return;}
                        const points=Array.isArray(data.preview)?data.preview:[];
                        cache[mode]={points,code,output:consoleOut.textContent};
                        display(points);
                        status(points.length?'✓ Бүтээл бэлэн.':item.usage+' командыг дуудаж тайзаа дүүргээрэй.',points.length?'pass':'idle');
                    };
                    if(ready)send();
                    else timer=setTimeout(()=>fail('Python ачаалах хугацаа дууслаа. Дахин ажиллуулна уу.'),90000);
                }catch(error){fail('Python эхэлж чадсангүй. '+error.message);}
            }
            const last=cache[mode];
            display(last?.points||[]);
            if(last){
                consoleOut.textContent=last.output;consoleOut.hidden=!last.output;
                status(last.code===input.value?'Өмнөх бүтээл.':'Код өөрчлөгдсөн байна. «Бүтээх» дарж шинэчил.','idle');
            }
            else if(input.value===item.example)run();
            else status('Хадгалсан кодоо ажиллуулж бүтээлээ хараарай.','idle');
        }
        open(Object.hasOwn(modes,state.mode)?state.mode:'garden');
    }
    window.MakerUI={mount,leave:stopSession};
})();
