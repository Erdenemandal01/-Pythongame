(() => {
    'use strict';
    const t = (mn, en) => GameLocale.lang === 'en' ? en : mn;
    const puzzles = new Map([
        [0, {
            title:t('Гэрийн үүдэнд', 'At the door of a ger'),
            prompt:t('Зочин эхлээд мэндэлнэ. Гэрийн эзэн «Тавтай морил!» гэхэд зочин талархана. Яриаг энэ дарааллаар хэвлүүлээрэй.',
                'The guest greets the host, the host welcomes them in, and the guest says thanks. Put their lines in that order.'),
            lines:t(['print("Сайн байна уу?")','print("Тавтай морил!")','print("Баярлалаа!")'],
                ['print("Hello!")','print("Welcome in!")','print("Thank you!")']),
            hints:t(['Яриаг зочны мэндчилгээ эхлүүлнэ.','Мэндчилгээний дараа гэрийн эзэн зочноо урина.','Урилга авсан зочин хамгийн сүүлд талархана.'],
                ['The greeting from the guest starts the conversation.','After the greeting, the host welcomes the guest.','The guest thanks the host after the invitation.']),
            output:t('Сайн байна уу?\nТавтай морил!\nБаярлалаа!','Hello!\nWelcome in!\nThank you!')
        }],
        [5, {
            title:t('Жимийг нээх дохио', 'The signal to open the trail'),
            prompt:t('Салхины хүчийг 4 гэж тэмдэглэ. Салхи 5-аас бага үед л «Жим нээлттэй» гэж хэвлэнэ. Төгсгөлд нь ямар ч үед «Шалгаж дууслаа» гэж хэвлэ.',
                'Record a wind strength of 4. Print “Trail open” only if the wind is below 5. Always print “Check complete” at the end.'),
            lines:['wind = 4','if wind < 5:',t('    print("Жим нээлттэй")','    print("Trail open")'),t('print("Шалгаж дууслаа")','print("Check complete")')],
            hints:t(['Харьцуулахаасаа өмнө wind-д утга өгнө.','Одоо wind-ийг 5-тай харьцуулах мөр хэрэгтэй.','Доголтой print() нөхцөл үнэн үед ажиллана.','Доголгүй print() нь нөхцөлийн дараа ажиллана.'],
                ['Give wind a value before comparing it.','Now compare wind with 5.','The indented print() runs when the condition is true.','The unindented print() runs after the conditional.']),
            output:t('Жим нээлттэй\nШалгаж дууслаа','Trail open\nCheck complete')
        }],
        [10, {
            title:t('Гурван туурайн мөр', 'Three hoofprints'),
            prompt:t('Хоосон зам дээр давталт бүрд нэг > мөр нэм. Гурван мөр бүрдсэний дараа замаа нэг удаа хэвлүүлээрэй.',
                'Start with an empty trail. Add one > mark per loop, then print the trail once all three hoofprints are in place.'),
            lines:['trail = ""','for step in range(3):','    trail += ">"','print(trail)'],
            hints:t(['Мөр нэмэхийн өмнө хоосон текст бэлдээрэй.','Гурван удаа давтах хэсэг хаана эхлэх вэ?','Давталтын доторх мөр нэг тэмдгийг залгана.','Бэлэн замыг давталтын дараа хэвлэнэ.'],
                ['Prepare the empty string before adding marks.','Which line starts the three repeats?','The indented line adds one mark inside the loop.','Print the finished trail after the loop.']),
            output:'>>>'
        }],
        [17, {
            title:t('Аянчны хоёр дахь эд зүйл', 'The second item in the pack'),
            prompt:t('Аянчин богцондоо олстой гарчээ. Аягаа нэмж хийгээд хоёр дахь эд зүйлийн нэрийг хэвлүүл.',
                'A traveler packs a rope. Add the cup, then print the name of the second item.'),
            lines:t(['bag = ["олс"]','bag.append("аяга")','print(bag[1])'],
                ['bag = ["rope"]','bag.append("cup")','print(bag[1])']),
            hints:t(['Эхлээд олстой жагсаалтаа үүсгэнэ.','Хоёр дахь зүйлийг уншихын өмнө аягаа нэмнэ.','Эхний индекс 0 тул хоёр дахь эд зүйл 1 гэсэн индекстэй.'],
                ['First create the list that contains the rope.','Add the cup before looking up the second item.','Counting starts at index 0, so the second item has index 1.']),
            output:t('аяга','cup')
        }],
        [20, {
            title:t('Суулгацаа тоолъё', 'Counting seedlings'),
            prompt:t('Нэг эгнээнд дөрвөн суулгац багтана. rows эгнээний суулгацыг бодож буцаадаг функц бүтээ. Гурван эгнээний хариуг хэвлүүл.',
                'Each row holds four seedlings. Use the parameter rows to calculate and return the total, then print the result for three rows.'),
            lines:['def seedlings(rows):','    total = rows * 4','    return total','print(seedlings(3))'],
            hints:t(['Функцийг дуудахаасаа өмнө нэрлэж тодорхойлно.','Буцаах утгаа эхлээд үржүүлж бодно.','Бодсон total-аа функцээс буцаагаарай.','Одоо функцээ 3 гэсэн утгаар дуудна.'],
                ['Define the function before you call it.','Calculate the total before returning it.','Return the total from inside the function.','Now call the function with 3.']),
            output:'12'
        }],
        [47, {
            title:t('Наадмын зочдын тоо', 'Visitors at the Naadam workshop'),
            prompt:t('Тэмдэглэлийн дэвтэрт нэг зочны нэр давтагджээ. Өөр өөр хэдэн зочин ирснийг тоолж хэвлүүлээрэй.',
                'One visitor appears twice in the workshop log. Count and print how many different people came.'),
            lines:t(['visits = ["Од", "Үүл", "Од"]','names = set(visits)','count = len(names)','print(count)'],
                ['visits = ["Od", "Uul", "Od"]','names = set(visits)','count = len(names)','print(count)']),
            hints:t(['Зочдын нэрсийг эхлээд жагсаалт болгоно.','set() нь давхардсан нэрийг нэг удаа үлдээнэ.','Ялгаатай нэрс бүрдсэн тул одоо тоог нь олно.','Хэдэн зочин ирснийг count-д хадгалсан. Тэр тоог хэвлээрэй.'],
                ['Create the list of visits first.','set() keeps each name once.','Now count the names in the set.','The visitor count is in count. Print that value.']),
            output:'2'
        }]
    ]);

    function read(index, raw) {
        const size=puzzles.get(index)?.lines.length, order=raw?.order;
        if(!size || !Array.isArray(order) || order.length!==size || new Set(order).size!==size ||
            !order.every(id=>Number.isInteger(id) && id>=0 && id<size))return null;
        return {order:[...order], solved:raw.solved===true && order.every((id,i)=>id===i)};
    }

    function deal(count, previous = []) {
        const order = Array.from({length:count},(_,i)=>i);
        for(let end=count-1;end>0;end--){
            const pick=Math.floor(Math.random()*(end+1));
            [order[end],order[pick]]=[order[pick],order[end]];
        }
        // Keep the opening playable even when a shuffle lands on the answer.
        while(order.every((id,i)=>id===i) || order.every((id,i)=>id===previous[i])){
            order.push(order.shift());
        }
        return order;
    }

    function element(tag, className, label) {
        const el=document.createElement(tag);
        if(className)el.className=className;
        if(label!==undefined)el.textContent=label;
        return el;
    }
    function button(className, label, action) {
        const el=element('button',className,label);
        el.type='button';el.addEventListener('click',action);
        return el;
    }

    function mount(container, lessonIndex, record, save) {
        const puzzle=puzzles.get(lessonIndex);
        if(!puzzle)return null;
        const restored=read(lessonIndex, record?.predictSequence);
        const session=restored || {order:deal(puzzle.lines.length), solved:false};
        function store() {
            if(!record)return;
            record.predictSequence={order:[...session.order],solved:session.solved};
            save?.();
        }
        if(!restored)store();
        const panel=element('section','ac-sequence');
        panel.setAttribute('aria-label',puzzle.title);
        const title=element('h3','ac-sequence-head',puzzle.title);
        const prompt=element('p','ac-sequence-prompt',puzzle.prompt);
        const list=element('ol','ac-sequence-lines');
        list.setAttribute('aria-label',t('Эрэмбэлэх Python мөрүүд','Python lines to put in order'));
        const actions=element('div','ac-sequence-actions');
        const status=element('p','ac-sequence-status');
        status.setAttribute('role','status');
        const output=element('pre','ac-sequence-output',puzzle.output);
        output.setAttribute('aria-label',t('Програмын гаралт','Program output'));
        function showResult(result, message) {
            status.dataset.result=result;status.textContent=message;
            output.hidden=result!=='pass';
        }
        function move(id, delta) {
            const at=session.order.indexOf(id), next=at+delta;
            if(next<0 || next>=session.order.length)return;
            [session.order[next],session.order[at]]=[id,session.order[next]];
            session.solved=false;
            store();
            renderLines();
            const row=list.children[next], same=row.querySelector(delta<0?'.ac-sequence-up':'.ac-sequence-down');
            (same.disabled?row.querySelector('button:enabled'):same).focus();
            showResult('moved',t('Сонгосон мөр '+(next+1)+'-р байранд шилжлээ.',
                'Moved the selected line to position '+(next+1)+'.'));
        }
        function renderLines() {
            list.replaceChildren();
            session.order.forEach((id,position)=>{
                const row=element('li','ac-sequence-line');
                const code=element('code');
                code.style.whiteSpace='pre-wrap';
                code.append(window.PythonSyntax?.highlight(puzzle.lines[id]) ?? puzzle.lines[id]);
                const controls=element('div','ac-sequence-moves');
                for(const delta of [-1,1]){
                    const up=delta<0;
                    const arrow=button(up?'ac-sequence-up':'ac-sequence-down',up?'↑':'↓',()=>move(id,delta));
                    const positionName = t((position+1)+'-р мөрийг ', 'Move line '+(position+1)+' ');
                    arrow.setAttribute('aria-label',positionName+(up?t('дээш зөөх','up'):t('доош зөөх','down')));
                    arrow.disabled=up?position===0:position===session.order.length-1;
                    controls.append(arrow);
                }
                row.append(code,controls);
                row.addEventListener('keydown',e=>{
                    if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
                    if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();move(id,e.key==='ArrowUp'?-1:1);}
                });
                list.append(row);
            });
        }
        const check=button('ac-sequence-check',t('Дарааллыг шалгах','Check order'),()=>{
            const wrong=session.order.findIndex((id,i)=>id!==i);
            if(session.solved!==(wrong===-1)){
                session.solved=wrong===-1;
                store();
            }
            if(session.solved)showResult('pass',t('Зөв дараалал! Програмын гаралт доор гарлаа.',
                'Correct order! The program output is below.'));
            else showResult('retry',t((wrong+1)+'-р мөрөө шалгаарай. ', 'Look at line '+(wrong+1)+'. ')+puzzle.hints[wrong]);
        });
        const reset=button('ac-sequence-reset',t('Дахин холих','Shuffle again'),()=>{
            session.order=deal(puzzle.lines.length,session.order);
            session.solved=false;
            store();
            renderLines();
            showResult('shuffled',t('Мөрүүдийг дахин хольсон.','The lines have been shuffled.'));
        });
        actions.append(check,reset);panel.append(title,prompt,list,actions,status,output);
        renderLines();
        showResult(session.solved?'pass':'',session.solved?t('Зөв дараалал!','Correct order!'):'');
        container.append(panel);
        return panel;
    }
    window.AcademySequence={has:index=>puzzles.has(index),read,mount};
})();
