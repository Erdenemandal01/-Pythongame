(() => {
    'use strict';
    const WIDTH = 9, HEIGHT = 6, TILE = 40;
    const symbols = {
        '.': 'Зам', '#': 'Хад', 'S': 'Эхлэл', 'E': 'Өндөг', 'C': 'Агуй', 'D': 'Унтаж буй луу'
    };
    const fileFormat = 'python-quest-level';
    const defaultMap = () => ({
        title: 'Лууны өндгийг аврах',
        rows: ['..##...#.', '...D..#..', '.#.....D.', '.SEEEC...', '...#..#..', '.#...D...']
    });
    function error(message) { throw new Error(message); }
    function locations(rows, symbol) {
        const found = [];
        rows.forEach((row, y) => Array.from(row).forEach((mark, x) => {
            if (mark === symbol) found.push([x, y]);
        }));
        return found;
    }
    function validRows(rows) {
        return Array.isArray(rows) && rows.length === HEIGHT &&
            Array.from(rows).every(row => typeof row === 'string' && row.length === WIDTH && /^[.#SECD]+$/.test(row));
    }
    function validate(input) {
        if (!input || typeof input.title !== 'string' || !input.title.trim() ||
            input.title.length > 60 || /[\u0000-\u001f\u007f]/.test(input.title))
            error('Түвшиндээ 1–60 тэмдэгттэй нэр өгөөрэй.');
        if (!validRows(input.rows)) error('Газрын зураг 9 багана, 6 мөртэй байна. Нүдний тэмдэглэгээг шалгаарай.');
        const rows = input.rows.slice(), starts = locations(rows, 'S'), caves = locations(rows, 'C');
        const eggs = locations(rows, 'E');
        if (starts.length !== 1) error('Газрын зураг дээр яг нэг эхлэл байрлуулна.');
        if (caves.length !== 1) error('Газрын зураг дээр яг нэг агуй байрлуулна.');
        if (!eggs.length) error('Аврах өндөгнөөс дор хаяж нэгийг байрлуулаарай.');
        const queue = [starts[0]], seen = new Set([starts[0].join(',')]);
        for (let i = 0; i < queue.length; i++) {
            const [x, y] = queue[i];
            for (const [nx, ny] of [[x-1,y], [x+1,y], [x,y-1], [x,y+1]]) {
                const key = nx + ',' + ny, mark = rows[ny]?.[nx];
                if (!mark || mark === '#' || mark === 'D' || seen.has(key)) continue;
                seen.add(key);
                queue.push([nx, ny]);
            }
        }
        for (const [x, y] of [...eggs, caves[0]]) {
            if (!seen.has(x + ',' + y))
                error('(' + x + ', ' + y + ') нүдний ' + (rows[y][x] === 'C' ? 'агуйд' : 'өндгөнд') +
                    ' хүрэх зам алга. Хад эсвэл лууны байрлалыг өөрчлөөрэй.');
        }
        return {title:input.title.trim(), rows};
    }
    function encode(map) {
        return JSON.stringify({format:fileFormat, version:1, ...validate(map)}, null, 2);
    }
    function decode(text) {
        if (typeof text !== 'string' || text.length > 16000) error('Жижиг хэмжээтэй түвшний JSON файл сонгоорой.');
        let data;
        try { data = JSON.parse(text.trim()); } catch { error('Түвшний файлыг уншиж чадсангүй.'); }
        if (data?.format !== fileFormat || data.version !== 1) error('«Миний түвшин»-ээс татсан түвшний файл сонгоорой.');
        return validate(data);
    }

    const node = (tag, className, text) => {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (text !== undefined) item.textContent = text;
        return item;
    };
    const rect = (ctx, color, x, y, w, h) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    };
    // Fill each scanline on integer pixel boundaries so diagonals keep their stepped edges.
    function shape(ctx, color, points) {
        ctx.fillStyle = color;
        const ys = points.map(p => p[1]);
        for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
            const crossings = [], center = y + .5;
            for (let i = 0; i < points.length; i++) {
                const a = points[i], b = points[(i+1) % points.length];
                if ((a[1] > center) === (b[1] > center)) continue;
                crossings.push(a[0] + (center-a[1]) * (b[0]-a[0]) / (b[1]-a[1]));
            }
            crossings.sort((a,b) => a-b);
            for (let i = 0; i + 1 < crossings.length; i += 2) {
                const left = Math.round(crossings[i]), right = Math.round(crossings[i+1]);
                ctx.fillRect(left, y, right-left, 1);
            }
        }
    }
    const grassColors = ['#91b55f','#98ba65','#96b666','#9cba69'];
    function grass(ctx, x, y) {
        const seed = x*37 + y*59;
        rect(ctx,grassColors[(seed+x*y)%4],0,0,TILE,TILE);
        for (let i=0;i<7;i++) {
            const px=(seed*31+i*17)%36+2, py=(seed*23+i*13)%36+2;
            rect(ctx, i%3 ? '#80a65c' : '#b3c97a',px,py,2,1);
            if(i%3===0) {
                rect(ctx,'#749f58',px+1,py-2,1,2);
                rect(ctx,'#a8c476',px-1,py-1,1,1);
            }
        }
        if ((seed+2)%7===0) {
            const px=4+seed%24,py=6+seed%23;
            rect(ctx,'#658d58',px,py+1,1,3);
            rect(ctx,'#dae4ab',px-1,py,3,1);
            rect(ctx,'#f6cb7c',px,py,1,1);
        }
        if((x+2*y)%7===0) {
            const px=5+seed%19,py=6+seed%8;
            for(const [dx,dy] of [[0,0],[4,2],[7,-1]]) {
                rect(ctx,'#759759',px+dx,py+dy,1,4);
                rect(ctx,'#a0bb63',px+dx-1,py+dy-1,2,3);
                rect(ctx,'#819f5a',px+dx+1,py+dy+1,2,1);
            }
        }
    }
    function path(ctx,x,y,rows) {
        const connected = value => ['S','E','C'].includes(value);
        const dirt = '#cfb47b', light = '#dfc58e';
        const left=connected(rows[y][x-1]), right=connected(rows[y][x+1]);
        const up=connected(rows[y-1]?.[x]), down=connected(rows[y+1]?.[x]);
        shape(ctx,'#9b9b62',[[3,16],[8,12],[11,8],[27,7],[33,12],[37,20],[35,28],[29,32],[12,33],[6,28]]);
        shape(ctx,dirt,[[3,17],[9,13],[12,9],[27,9],[33,14],[36,20],[33,27],[27,30],[13,31],[7,27]]);
        if(left) rect(ctx,dirt,0,13,15,15);
        if(right) rect(ctx,dirt,25,13,15,15);
        if(up) rect(ctx,dirt,13,0,14,19);
        if(down) rect(ctx,dirt,13,23,14,17);
        for(let i=0;i<4;i++) {
            const px=8+(x*17+i*7)%22,py=14+(y*11+i*3)%12;
            rect(ctx,i%2?light:'#b4996c',px,py,2,1);
        }
    }
    function shadow(ctx,x,y,w) {
        rect(ctx,'#658355',x+2,y-1,w-4,3);
        rect(ctx,'#6e8958',x,y,w,1);
    }
    function rock(ctx) {
        shadow(ctx,3,33,33);
        shape(ctx,'#334f4e',[[3,29],[6,18],[11,12],[16,12],[20,6],[27,5],[33,10],[33,17],[37,23],[36,31],[30,34],[10,33]]);
        shape(ctx,'#67817b',[[5,29],[8,18],[13,14],[19,14],[21,8],[27,7],[32,11],[30,18],[35,23],[34,30],[27,32],[12,31]]);
        shape(ctx,'#91a395',[[8,24],[10,17],[15,13],[20,15],[18,21],[14,26]]);
        shape(ctx,'#b6bf9d',[[19,15],[22,8],[27,7],[30,10],[23,12]]);
        shape(ctx,'#56736e',[[21,16],[27,12],[31,12],[29,19],[33,23],[26,29],[18,31],[21,23]]);
        shape(ctx,'#879784',[[23,25],[30,20],[34,24],[31,28],[22,30]]);
        rect(ctx,'#a5bd6d',9,13,6,2);rect(ctx,'#b7ca7c',23,7,5,2);
        rect(ctx,'#688c60',6,28,3,3);rect(ctx,'#98ad6b',7,28,3,1);
    }
    function egg(ctx) {
        shadow(ctx,8,33,24);
        shape(ctx,'#785c49',[[7,30],[9,27],[22,25],[32,28],[33,31],[29,34],[14,35],[8,33]]);
        rect(ctx,'#c19256',10,30,8,2);rect(ctx,'#d5aa64',23,32,6,1);
        shape(ctx,'#4e4c65',[[11,26],[11,20],[14,14],[18,8],[21,7],[24,9],[28,16],[30,22],[29,27],[25,30],[16,31]]);
        shape(ctx,'#c887a8',[[13,25],[13,20],[16,14],[20,9],[22,10],[26,16],[28,22],[27,26],[24,28],[17,29]]);
        shape(ctx,'#f3cc9a',[[13,24],[14,18],[18,12],[20,10],[23,12],[26,19],[24,25],[20,28],[16,27]]);
        rect(ctx,'#fff0b8',17,15,2,3);rect(ctx,'#fff0b8',19,12,2,2);
        rect(ctx,'#ae6b95',21,16,3,2);rect(ctx,'#a67197',16,22,3,3);
        rect(ctx,'#d596a3',23,24,2,2);rect(ctx,'#f7dfa9',14,21,2,2);
        rect(ctx,'#fff1b7',31,7,1,5);rect(ctx,'#fff1b7',29,9,5,1);
    }
    function cave(ctx) {
        shadow(ctx,2,34,36);
        shape(ctx,'#354d4d',[[1,32],[4,23],[5,16],[10,13],[12,7],[18,4],[24,5],[27,8],[32,9],[35,17],[35,24],[39,30],[37,34],[2,35]]);
        shape(ctx,'#648078',[[3,31],[7,22],[7,16],[13,13],[14,8],[20,6],[24,7],[28,11],[32,11],[33,17],[33,25],[37,31],[34,33],[5,33]]);
        shape(ctx,'#96a38c',[[6,24],[9,16],[14,15],[17,11],[22,9],[29,13],[22,15],[17,16],[12,22]]);
        shape(ctx,'#abb478',[[11,11],[14,6],[20,5],[24,6],[29,10],[24,10],[20,9],[16,11]]);
        shape(ctx,'#65775c',[[14,12],[19,9],[25,10],[26,12],[21,12],[18,14]]);
        shape(ctx,'#293c46',[[10,33],[10,26],[13,21],[15,17],[19,15],[23,15],[27,18],[29,22],[31,32]]);
        shape(ctx,'#1d2938',[[14,32],[14,26],[17,20],[21,18],[24,19],[27,24],[28,33]]);
        shape(ctx,'#c29a67',[[12,34],[15,31],[25,30],[31,33],[30,35],[13,35]]);
        rect(ctx,'#e6bc7a',17,32,7,1);
        rect(ctx,'#5f5843',6,24,2,9);rect(ctx,'#5f5843',33,23,2,9);
        for(const [x,y] of [[5,23],[32,22]]) {
            rect(ctx,'#e77e42',x,y-3,4,5);rect(ctx,'#ffdc78',x+1,y-5,2,6);
        }
    }
    function dragon(ctx) {
        shadow(ctx,2,33,35);
        shape(ctx,'#3b4c56',[[1,23],[5,24],[9,27],[7,23],[8,17],[12,13],[14,13],[15,8],[18,12],[22,12],[23,8],[25,13],[28,15],[31,15],[31,12],[34,15],[37,17],[38,22],[35,25],[33,26],[31,31],[24,33],[13,33],[6,31],[2,28]]);
        shape(ctx,'#705a86',[[3,25],[9,29],[11,28],[9,24],[10,18],[14,15],[20,14],[25,16],[30,18],[34,16],[36,19],[36,22],[32,23],[31,27],[27,30],[21,31],[13,31],[7,30],[4,28]]);
        shape(ctx,'#ab86ae',[[10,22],[11,17],[15,14],[21,14],[25,17],[24,22],[19,24],[15,25]]);
        shape(ctx,'#5e526f',[[10,24],[11,17],[17,13],[24,13],[21,18],[24,21],[19,23],[18,25],[13,25]]);
        shape(ctx,'#c78eae',[[11,23],[12,18],[17,15],[23,15],[20,18],[22,21],[18,22],[17,24],[14,24]]);
        shape(ctx,'#edbbbd',[[13,20],[16,16],[20,16],[17,18],[15,21]]);
        shape(ctx,'#a784aa',[[23,18],[29,16],[32,16],[36,19],[35,22],[32,23],[28,22],[24,24],[22,22]]);
        shape(ctx,'#eaca87',[[14,14],[16,9],[18,14]]);shape(ctx,'#f1d394',[[23,15],[25,7],[26,14]]);
        shape(ctx,'#e2bd7e',[[30,15],[32,10],[33,16]]);
        rect(ctx,'#4c435b',27,18,1,1);rect(ctx,'#4c435b',28,19,3,1);rect(ctx,'#493b52',35,20,1,1);
        rect(ctx,'#d4ae99',27,24,4,2);rect(ctx,'#c9a4ad',17,29,7,1);
        rect(ctx,'#eff2b9',29,7,4,1);rect(ctx,'#eff2b9',31,8,1,1);rect(ctx,'#eff2b9',30,9,1,1);rect(ctx,'#eff2b9',29,10,4,1);
        rect(ctx,'#fff4c6',34,2,3,1);rect(ctx,'#fff4c6',35,3,1,1);rect(ctx,'#fff4c6',34,4,3,1);
    }
    function start(ctx) {
        shadow(ctx,7,32,25);
        shape(ctx,'#8d7655',[[6,29],[11,25],[26,24],[33,27],[31,30],[14,33]]);
        shape(ctx,'#d6c88f',[[8,28],[13,26],[26,25],[30,27],[28,29],[15,31]]);
        rect(ctx,'#6c956d',18,24,3,6);rect(ctx,'#6c956d',16,26,7,2);
    }
    const heroAsset = {image:null, loading:false, failed:false, waiting:new Set()};
    function hero(ctx, surface) {
        shadow(ctx,8,35,26);
        if (!heroAsset.loading && typeof Image !== 'undefined') {
            heroAsset.loading = true;
            const img = new Image();
            img.onload = () => {
                heroAsset.image = img;
                const jobs=Array.from(heroAsset.waiting);
                heroAsset.waiting.clear();jobs.forEach(board=>{if(board.canvas.isConnected)board.redraw();});
            };
            img.onerror = () => {heroAsset.failed=true;heroAsset.waiting.clear();};
            img.src = 'art/hero-0.png';
        }
        if (heroAsset.image) { ctx.drawImage(heroAsset.image,4,0,32,36); return; }
        if (!heroAsset.failed) heroAsset.waiting.add(surface);
        // A player stays visible while the existing game sprite is loading.
        rect(ctx,'#423842',12,9,13,10);rect(ctx,'#a86b3d',11,7,14,6);
        rect(ctx,'#ecc499',15,14,12,7);rect(ctx,'#443443',24,15,2,2);
        rect(ctx,'#386c99',13,21,11,10);rect(ctx,'#6bb5cf',14,21,6,5);
        rect(ctx,'#ed9d4d',9,21,5,8);rect(ctx,'#56463a',13,30,4,5);rect(ctx,'#56463a',21,30,4,5);
    }
    const features={'#':rock,C:cave,D:dragon,E:egg,S:start};
    function paintTile(ctx, map, x, y, eggsLeft) {
        const mark=map.rows[y][x];
        grass(ctx,x,y);
        if (['S','C','E'].includes(mark)) path(ctx,x,y,map.rows);
        if (features[mark] && (mark !== 'E' || !eggsLeft || eggsLeft.has(x+','+y))) features[mark](ctx);
        // Light ticks maintain a visible grid without hiding the landscape.
        rect(ctx,'#789859',0,0,3,1);rect(ctx,'#789859',0,0,1,3);
    }
    function axes(className, length) {
        const el=node('div',className);
        el.setAttribute('aria-hidden','true');
        for(let i=0;i<length;i++) el.append(node('span','',String(i)));
        return el;
    }
    const boards = new WeakMap();
    function surface(container, editable) {
        const shell=node('div','lb-shell'), corner=node('span','lb-axis-corner');
        corner.setAttribute('aria-hidden','true');
        const field=node('div','lb-field'), canvas=node('canvas','lb-canvas');
        canvas.width=WIDTH*TILE;canvas.height=HEIGHT*TILE;
        if(editable) canvas.setAttribute('aria-hidden','true');
        else canvas.setAttribute('role','img');
        field.append(canvas);shell.append(corner,axes('lb-axis-x',WIDTH),axes('lb-axis-y',HEIGHT),field);
        container.replaceChildren(shell);
        return {shell,field,canvas};
    }
    function render(surface,map,frame,editing=false) {
        const ctx=surface.canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled=false;
        const remaining=frame?.remaining;
        const eggsLeft=Array.isArray(remaining)?new Set(remaining.map(pos=>pos.join(','))):null;
        const hasPosition=frame && Number.isInteger(frame.x) && Number.isInteger(frame.y);
        const player=hasPosition?[frame.x,frame.y]:locations(map.rows,'S')[0];
        for(let y=0;y<HEIGHT;y++) for(let x=0;x<WIDTH;x++) {
            ctx.save();ctx.translate(x*TILE,y*TILE);
            paintTile(ctx,map,x,y,eggsLeft);
            if(player && player[0]===x && player[1]===y) {
                hero(ctx,surface);
            }
            ctx.restore();
        }
        if(!editing) {
            const eggs=Array.isArray(remaining)?remaining:locations(map.rows,'E');
            const description = map.title + '. Баатар ' + (player?'('+player.join(', ')+') нүдэнд':'эхлэлгүй') +
                '. Үлдсэн өндөг ' + (eggs.map(p=>'('+p.join(', ')+')').join(', ')||'0') +
                '. Агуй '+locations(map.rows,'C').map(p=>'('+p.join(', ')+')').join(', ') +
                '. Хад '+(locations(map.rows,'#').map(p=>'('+p.join(', ')+')').join(', ')||'байхгүй')+
                '. Луу '+(locations(map.rows,'D').map(p=>'('+p.join(', ')+')').join(', ')||'байхгүй')+'.';
            surface.canvas.setAttribute('aria-label',description);
        }
    }
    function draw(container,map,frame=null,options={}) {
        let board=boards.get(container);
        if (!board || !container.contains(board.shell)) {
            board=surface(container,false);
            boards.set(container,board);
        }
        board.redraw=()=>render(board,map,frame);
        board.redraw();
        return board.canvas;
    }
    function icon(mark) {
        const canvas=node('canvas','lb-tool-icon');
        canvas.width=canvas.height=TILE;canvas.setAttribute('aria-hidden','true');
        const ctx=canvas.getContext('2d');
        if(!ctx)return canvas;
        if(mark==='S') {
            rect(ctx,'#655447',12,7,3,27);
            shape(ctx,'#f9d879',[[15,7],[30,7],[25,12],[30,16],[15,16]]);
            rect(ctx,'#a67b49',8,32,12,2);
        } else if(mark==='.') {
            shape(ctx,'#8a945d',[[2,29],[10,21],[17,21],[20,17],[16,14],[21,8],[36,7],[30,11],[27,12],[29,17],[25,22],[16,24],[14,28],[7,32]]);
            shape(ctx,'#dbbe85',[[3,28],[10,21],[18,21],[22,17],[18,13],[22,9],[34,8],[27,11],[25,13],[27,17],[24,20],[15,23],[14,26],[7,30]]);
        } else features[mark](ctx);
        return canvas;
    }
    function createEditor(container,map,onChange) {
        const draft={title:typeof map?.title==='string'?map.title:'',rows:validRows(map?.rows)?map.rows.slice():defaultMap().rows};
        const root=node('section','lb-editor'), name=node('label','lb-name'), input=node('input','lb-name-input');
        input.type='text';input.maxLength=60;input.value=draft.title;
        name.append(node('span','','Түвшний нэр'),input);
        const emit=()=>onChange?.({title:draft.title,rows:draft.rows.slice()});
        input.addEventListener('input',()=>{draft.title=input.value;emit();});
        const toolbar=node('div','lb-tools');toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Газрын зургийн хэрэгсэл');
        let brush='E',focusIndex=0;
        const controls=new Map();
        for(const mark of ['S','E','C','#','D','.']) {
            const button=node('button','lb-tool');
            button.type='button';button.dataset.tile=mark;
            button.setAttribute('aria-pressed',String(mark===brush));
            button.append(icon(mark),node('span','',symbols[mark]));
            button.onclick=()=>{brush=mark;controls.forEach((item,k)=>item.setAttribute('aria-pressed',String(k===mark)));};
            controls.set(mark,button);toolbar.append(button);
        }
        const holder=node('div','lb-holder'), board=surface(holder,true), overlay=node('div','lb-cell-overlay');
        overlay.setAttribute('role','group');overlay.setAttribute('aria-label','Газрын зургийн нүднүүд');
        board.field.append(overlay);
        root.append(name,toolbar,node('p','lb-instruction','Тэмдгээ сонгоод нүдэнд байрлуул. Сумтай товчоор шилжиж, Enter дарж зурна.'),holder);
        container.replaceChildren(root);
        const buttons=[];
        function refresh() {
            board.redraw=()=>render(board,draft,null,true);
            board.redraw();
            buttons.forEach((button,i)=>{
                const x=i%WIDTH,y=Math.floor(i/WIDTH),tile=draft.rows[y][x];
                button.dataset.tile=tile;button.setAttribute('aria-label','('+x+', '+y+') · '+symbols[tile]);
            });
        }
        function paint(x,y) {
            if(draft.rows[y][x]===brush)return;
            if(brush==='S'||brush==='C')draft.rows=draft.rows.map(row=>row.replaceAll(brush,'.'));
            const row=draft.rows[y];draft.rows[y]=row.slice(0,x)+brush+row.slice(x+1);
            refresh();emit();
        }
        function setFocus(index) {
            buttons[focusIndex].tabIndex=-1;focusIndex=index;buttons[index].tabIndex=0;
        }
        for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++) {
            const index=y*WIDTH+x, cell=node('button','lb-cell');cell.type='button';cell.tabIndex=index===0?0:-1;
            cell.dataset.x=x;cell.dataset.y=y;
            cell.onclick=()=>{setFocus(index);paint(x,y);};
            cell.onfocus=()=>setFocus(index);
            cell.onkeydown=e=>{
                const positions={ArrowLeft:Math.max(0,x-1)+y*WIDTH,ArrowRight:Math.min(WIDTH-1,x+1)+y*WIDTH,
                    ArrowUp:x+Math.max(0,y-1)*WIDTH,ArrowDown:x+Math.min(HEIGHT-1,y+1)*WIDTH,
                    Home:y*WIDTH,End:y*WIDTH+WIDTH-1};
                if(!(e.key in positions))return;
                e.preventDefault();buttons[positions[e.key]].focus();
            };
            cell.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button===0)paint(x,y);};
            cell.onpointerenter=e=>{if(e.pointerType==='mouse'&&(e.buttons&1))paint(x,y);};
            buttons.push(cell);overlay.append(cell);
        }
        refresh();
        return {getMap:()=>({title:draft.title,rows:draft.rows.slice()})};
    }
    window.LevelBoard={defaultMap,validate,draw,createEditor,encode,decode};
})();
