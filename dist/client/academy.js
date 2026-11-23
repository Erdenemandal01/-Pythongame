const ACADEMY = [...ACADEMY_A, ...ACADEMY_B, ...ACADEMY_C, ...ACADEMY_D, ...ACADEMY_E];
const ACADEMY_TIMING = [
    ['Таамаглах',5], ['Лаборатори',8], ['Миний төсөл',15],
    ['Алдаа засах',7], ['Туршилт',7], ['Дүгнэлт',3]
];
const JAM_TIMING = [
    ['Таамаглах',5], ['Лаборатори',8], ['Миний төсөл',20],
    ['Алдаа засах',7], ['Тоглуулж турших',15], ['Дүгнэлт',5]
];
const ACADEMY_CHAPTERS = (() => {
    let first=0;
    return [
        ['Анхны бүтээл',5,'skylands.webp'],
        ['Сонголт ба нөхцөл',5,'battles/arena-slime.webp'],
        ['Хээ ба давталт',5,'battles/arena-wolf.webp'],
        ['Текст ба жагсаалт',5,'battles/arena-golem.webp'],
        ['Функц ба сорил',5,'battles/arena-wraith.webp'],
        ['Өгөгдлийн мөрдөгч',5,'battles/arena-slime.webp'],
        ['Тор ба симуляци',5,'skylands.webp'],
        ['Эхний том төсөл',5,'battles/arena-dragon.webp'],
        ['Дэнлүүний баяр',5,'avatars/camp.webp'],
        ['Өгөгдлөөр түүх ярих',5,'skylands.webp'],
        ['Тоглоомын дүрэм',5,'battles/arena-dragon.webp'],
        ['Зам ба стратеги',5,'battles/arena-wolf.webp'],
        ['Туршилтын талбай',4,'battles/arena-golem.webp'],
        ['Тоглоомын наадам',2,'avatars/camp.webp',JAM_TIMING]
    ].map(([title,count,scene,timing=ACADEMY_TIMING])=>{
        const minutes=timing.reduce((sum,phase)=>sum+phase[1],0);
        const chapter={title,first,count,scene,timing,minutes};
        first+=count;
        return chapter;
    });
})();
function academyChapter(id) {
    return ACADEMY_CHAPTERS.find(c=>id>=c.first && id<c.first+c.count);
}
function academyDuration(minutes) {
    const hours=Math.floor(minutes/60), remainder=minutes%60;
    return [hours && hours+' цаг',remainder && remainder+' минут'].filter(Boolean).join(' ');
}
const ACADEMY_TOTAL_MINUTES=ACADEMY_CHAPTERS.reduce((sum,c)=>sum+c.count*c.minutes,0);
const ACADEMY_XP = 150;
const ACADEMY_TASKS = ['lab','p0','p1','debug'];

function readLevelSlot(raw) {
    const source=raw && typeof raw==='object'?raw:{};
    const rows=source.map?.rows;
    // An unfinished map, even one with a blocked cave, belongs to its author.
    const map=Array.isArray(rows) && rows.length===6 && rows.every(row=>typeof row==='string' && /^[.#SECD]{9}$/.test(row))
        ? {title:typeof source.map.title==='string'?source.map.title.slice(0,60):'', rows:[...rows]} : null;
    const draft=value=>typeof value==='string'?value.slice(0,20000):null;
    const stamp=map ? JSON.stringify([map.title,...map.rows]) : '';
    return {map, code:draft(source.code), peerCode:draft(source.peerCode),
        pairNotes:typeof source.pairNotes==='string'?source.pairNotes.slice(0,4000):'',
        pairTask:[0,1,2].includes(source.pairTask)?source.pairTask:0,
        verified:source.verified===stamp?stamp:''};
}

function readLevelStudio(raw) {
    const current=readLevelSlot(raw);
    const alternate=raw?.other && typeof raw.other==='object'?readLevelSlot(raw.other):null;
    const other=alternate?.map ? alternate : null;
    return {...current,other,visiting:!!other && raw.visiting===true};
}

function readAcademy(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const selected = Number.isInteger(source.selected) ? Math.max(0,Math.min(ACADEMY.length-1,source.selected)) : 0;
    const maker = {mode:'garden',drafts:{}};
    if (['garden','pixel','bars'].includes(source.maker?.mode)) maker.mode=source.maker.mode;
    for (const key of ['garden','pixel','bars']) {
        if (typeof source.maker?.drafts?.[key] === 'string') maker.drafts[key]=source.maker.drafts[key].slice(0,20000);
    }
    const portfolioId = typeof source.portfolioId === 'string' && /^[0-9a-f-]{24,40}$/i.test(source.portfolioId)
        ? source.portfolioId
        : Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
    const result = {portfolioId,selected,won:[],lessons:{},maker,level:readLevelStudio(source.level),workshops:Workshops.read(source.workshops)};
    const text = (s,limit) => typeof s === 'string' ? s.slice(0,limit) : '';
    for (let i=0;i<ACADEMY.length;i++) {
        const item = source.lessons?.[i];
        if (!item || typeof item !== 'object') continue;
        const drafts = {};
        const gameKeys=ACADEMY[i].capstone?['experiment0','experiment1']:[];
        for (const key of [...ACADEMY_TASKS,'experiment',...gameKeys]) {
            if (typeof item.drafts?.[key] === 'string') drafts[key] = text(item.drafts[key],20000);
        }
        result.lessons[i] = {
            answer:Number.isInteger(item.answer) && item.answer>=0 && item.answer<3 ? item.answer : -1,
            choice:item.choice===1?1:0,
            passed:[...ACADEMY_TASKS,...gameKeys].filter(k=>Array.isArray(item.passed)&&item.passed.includes(k)),
            drafts, reflection:text(item.reflection,4000),extension:text(item.extension,4000),inputData:text(item.inputData,4000)
        };
        if (Number.isInteger(item.phase) && item.phase >= 0 && item.phase < academyChapter(i).timing.length) {
            result.lessons[i].phase=item.phase;
        }
        if (gameKeys.length && item.gameInputs) {
            const inputs={};
            for (const key of gameKeys) if (typeof item.gameInputs[key]==='string') inputs[key]=text(item.gameInputs[key],4000);
            result.lessons[i].gameInputs=inputs;
        }
        if (Array.isArray(source.won) && source.won.includes(i)) result.won.push(i);
    }
    if (source.importedForRanking) {
        const baseline = source.importedForRanking;
        result.importedForRanking = {
            lessons: result.won.filter(id => Array.isArray(baseline.lessons) && baseline.lessons.includes(id)),
            greenhouse: (result.workshops.greenhouse?.won || []).filter(id =>
                Array.isArray(baseline.greenhouse) && baseline.greenhouse.includes(id))
        };
    }
    return result;
}

function canGraduate(id) {
    const part = state.academy.lessons[id];
    return !!part && part.answer === ACADEMY[id].answer &&
        ['lab','p'+part.choice,'debug'].every(k=>part.passed.includes(k)) &&
        (!ACADEMY[id].capstone || part.passed.includes('experiment'+part.choice)) &&
        !!part.extension?.trim() && !!part.reflection?.trim();
}

function finishClass(id) {
    if (!canGraduate(id) || state.academy.won.includes(id)) return false;
    state.academy.won.push(id);
    if (!state.days.includes(today())) state.days.push(today());
    persist();
    updateHeader();
    sound(true);
    toast('Хичээл дууслаа! +' + ACADEMY_XP + ' XP');
    return true;
}

function exportPortfolio() {
    const record = {format:'python-quest-portfolio',version:1,name:state.name,academy:state.academy};
    const alias = state.name.replace(/[^\p{L}\p{N}-]+/gu,'_').slice(0,24) || 'student';
    download('python-quest-'+alias+'-'+state.academy.portfolioId.slice(0,6)+'-portfolio.json',JSON.stringify(record,null,2),'application/json');
}

function enterClass(id) {
    if (busy) return toast('Эхлээд ажиллаж буй кодоо зогсооно уу.');
    state.academy.selected = id;
    switchView('academy');
    window.scrollTo({top:0,behavior:'instant'});
}

function importPortfolio() {
    const startingSave = state;
    const input=document.createElement('input');
    input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{
        try {
            const file=input.files[0];
            if (!file) return;
            if(file.size>12*1024*1024) throw Error('Бүтээлийн файл хэт том байна.');
            const data=JSON.parse(await file.text());
            if(data.format!=='python-quest-portfolio'||data.version!==1||!data.academy?.lessons||!Array.isArray(data.academy.won))
                throw Error('Python урлангаас татсан бүтээлийн файл сонгоорой.');
            const restored=readAcademy(data.academy);
            const alias=typeof data.name==='string'?data.name.trim().slice(0,24)||'Аялагч':'Аялагч';
            const id=restored.portfolioId;
            if (startingSave !== state) return;
            if (window.GameAccount?.isCloud()) {
                if (!confirm('Энэ бүтээлээр өөрийн бүртгэл дэх урлангийн ажлыг солих уу?')) return;
                // Imported work restores the portfolio. Only newly earned milestones count toward the board.
                const previous = state.academy;
                const previousGarden = previous.workshops.greenhouse?.won || [];
                restored.importedForRanking = {
                    lessons: restored.won.filter(id => !previous.won.includes(id) || previous.importedForRanking?.lessons.includes(id)),
                    greenhouse: (restored.workshops.greenhouse?.won || []).filter(id =>
                        !previousGarden.includes(id) || previous.importedForRanking?.greenhouse.includes(id))
                };
                restored.portfolioId=state.academy.portfolioId;
                state.academy=restored;
                persist();switchView('academy',false);toast('Урлангийн ажлыг сэргээсэн.');
                return;
            }
            const base=id===state.academy.portfolioId?state:readParkedStudents()[id];
            if(!confirm('«'+alias+'» сурагчийн урлангийн ажлыг энэ файлаас сэргээх үү? Тухайн сурагчийн өмнөх урлангийн ажил солигдоно.'))return;
            const next=base?validState(base):fresh();
            next.academy=restored;
            next.name=alias;
            if(activateStudent(next,'academy'))toast('Бүтээлийг сэргээсэн.');
        } catch (error) { toast(error.message); }
    };
    input.click();
}

function readAssignedLesson() {
    const link = new URL(location.href);
    const number = Number(link.searchParams.get('lesson'));
    if (link.hash === '#academy' && Number.isInteger(number) && number >= 1 && number <= ACADEMY.length) {
        state.academy.selected=number-1;
        link.searchParams.delete('lesson');
        try { history.replaceState(null,'',link.href); } catch {}
    }
}
