const $=id=>document.getElementById(id),KEY='pythonQuestFullMN_v1';
const fresh=()=>({version:1,name:'Аялагч',done:[],drafts:{},journalDrafts:{},referenceDrafts:{},journalBookmarks:[],weeklyPython:WeeklyPython.readSave(null),courseExam:CourseExam.readSave(null),attempts:{},hints:{},practice:'# Өөрийн санааг энд туршаарай\nprint("Сайн уу, ертөнц!")',days:[],sound:false,battles:readCampaign(null),academy:readAcademy(null)});
function validState(s){if(!s||s.version!==1||!Array.isArray(s.done))throw Error('Тохирох хадгаламж биш байна.');const t=fresh();t.referenceDrafts=ReferenceAccess.readDrafts(s.referenceDrafts);t.weeklyPython=WeeklyPython.readSave(s.weeklyPython);t.courseExam=CourseExam.readSave(s.courseExam);if(Array.isArray(s.journalBookmarks))t.journalBookmarks=MISSIONS.filter(m=>s.journalBookmarks.includes(m.id)).map(m=>m.id);t.name=typeof s.name==='string'?s.name.slice(0,24)||'Аялагч':t.name;const done=new Set(s.done);for(let i=0;i<MISSIONS.length&&done.has(i);i++)t.done.push(i);for(let i=0;i<MISSIONS.length;i++){if(typeof s.journalDrafts?.[i]==='string')t.journalDrafts[i]=s.journalDrafts[i].slice(0,20000);if(typeof s.drafts?.[i]==='string')t.drafts[i]=s.drafts[i].slice(0,20000);for(const k of ['attempts','hints'])if(Number.isInteger(s[k]?.[i])&&s[k][i]>=0)t[k][i]=Math.min(s[k][i],10000)}if(typeof s.practice==='string')t.practice=s.practice.slice(0,20000);t.days=Array.isArray(s.days)?[...new Set(s.days.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(-366):[];t.sound=s.sound===true;t.battles=readCampaign(s.battles);t.academy=readAcademy(s.academy);const bookmark=readBookmark(s.resume,t.done.length);if(bookmark)t.resume=bookmark;return t}
let state=fresh(),lastActiveSave=null;
try{lastActiveSave=localStorage.getItem(KEY);if(lastActiveSave)state=validState(JSON.parse(lastActiveSave))}catch{}
let current=state.resume?.view==='quest'?state.resume.mission:Math.min(state.done.length,29),view='map',worker=null,ready=false,busy=false,timer,animationId=0,stdout=[],hintIndex=0,toastTimer,audio;
const today=()=>new Date().toLocaleDateString('en-CA');
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200)}
const STALE_TAB_NOTICE='Өөр цонхонд ахиц өөрчлөгдсөн байна. Энд бичсэн зүйлээ татаж аваад хуудсаа шинэчилнэ үү.';
function writeActiveSave(next) {
    const stored=localStorage.getItem(KEY);
    if(stored!==lastActiveSave)throw Error(STALE_TAB_NOTICE);
    const serialized=JSON.stringify(next);
    if(stored!==serialized)localStorage.setItem(KEY,serialized);
    lastActiveSave=serialized;
}
function saveProblem(error) {
    return error?.message===STALE_TAB_NOTICE ? STALE_TAB_NOTICE :
        'Ахиц хадгалах боломжгүй байна. Ахиц татах товчоор нөөцлөөрэй.';
}
function readBookmark(raw, unlocked) {
    if (!raw || typeof raw.view!=='string') return null;
    if (raw.view==='quest') {
        const id=raw.mission;
        return Number.isInteger(id) && id>=0 && id<MISSIONS.length && id<=unlocked ? {view:'quest',mission:id} : null;
    }
    if (raw.view==='level') return {view:'level',mode:['edit','pair'].includes(raw.mode)?raw.mode:'play'};
    if (raw.view==='journal') return Number.isInteger(raw.mission) && MISSIONS[raw.mission]
        ? {view:'journal',mission:raw.mission} : {view:'journal'};
    if (['practice','academy','battle','maker','weekly','duel','exam'].includes(raw.view) || Workshops.has(raw.view)) return {view:raw.view};
    return null;
}
let restoringPlayer=false, levelModeInUse='play', journalTopic=null;
function rememberActivity() {
    if (restoringPlayer) return false;
    const next=readBookmark({view,mission:view==='journal'?journalTopic:current,mode:levelModeInUse},state.done.length);
    if (!next || (next.view===state.resume?.view && next.mission===state.resume.mission && next.mode===state.resume.mode)) return false;
    state.resume=next;
    return true;
}
function persist(remember=true){
    if (remember!==false) rememberActivity();
    if (window.GameAccount?.changed()) return true;
    try {writeActiveSave(state);return true;}
    catch(error){toast(saveProblem(error));return false;}
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function xp() {
    const lessons = state.done.reduce((sum, id) => sum + (MISSIONS[id].boss ? 200 : 100), 0);
    const garden = state.academy.workshops.greenhouse?.won || [];
    const gardenXP = (garden.includes('first') ? 50 : 0) + (garden.includes('five') ? 100 : 0);
    return state.battles.won.reduce((sum, id) => sum + BATTLES[id].reward, lessons + state.academy.won.length * ACADEMY_XP + gardenXP);
}
function sound(win){if(!state.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();[440,554,659].slice(0,win?3:1).forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=f;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.05,audio.currentTime+i*.12);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.12+.25);o.start(audio.currentTime+i*.12);o.stop(audio.currentTime+i*.12+.26)})}catch{}}
function updateHeader() {
    $('xp').textContent='✦ '+xp()+' XP';
    $('level').textContent='LV. '+(1+Math.floor(xp()/300));
    const classroom=['home','courses','exam','academy','maker','level','workshops',...Workshops.names].includes(view);
    const completed=classroom ? state.academy.won.length : state.done.length;
    const total=classroom ? ACADEMY.length : MISSIONS.length;
    $('journeyLabel').textContent=classroom?'Хичээлийн ахиц':'Аяллын ахиц';
    $('count').textContent=completed+' / '+total;
    $('progress').max=total;
    $('progress').value=completed;
    updateAccountButton();$('sound').textContent='♫ Дуу: '+(state.sound?'асаалттай':'унтраалттай');document.querySelectorAll('[data-view]').forEach(b=>{
        const selected=b.dataset.view===view || (b.dataset.view==='workshops' && Workshops.has(view));
        b.classList.toggle('selected',selected);
        if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });$('sideWorlds').innerHTML=WORLDS.map((w,i)=>{const n=state.done.filter(id=>MISSIONS[id].world===i).length;return `<button class="side-world" data-world="${i}"><span>${w.icon} ${w.name}</span><small>${n}/6</small></button>`}).join('');document.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{if(busy)return toast('Эхлээд кодоо зогсооно уу.');switchView('map');document.getElementById('world-'+b.dataset.world)?.scrollIntoView({behavior:'smooth',block:'center'})})}
function renderMap(){renderPlayerCamp();renderCampaignMap();$('continueBtn').textContent=state.done.length===30?'Хичээлээ давтах':state.done.length?'Аяллаа үргэлжлүүлэх':'Аяллаа эхлүүлэх';$('worldCards').innerHTML=WORLDS.map((w,wi)=>{const n=state.done.filter(id=>MISSIONS[id].world===wi).length;return `<section class="world-card" id="world-${wi}" style="--world:${w.color}"><div class="world-card-head"><span class="world-icon">${w.icon}</span><div><span class="eyebrow">ЕРТӨНЦ ${String(wi+1).padStart(2,'0')}</span><h3>${w.name}</h3><p>${w.desc}</p></div><span class="world-score">${n}/6</span></div><div class="mission-path">${MISSIONS.filter(m=>m.world===wi).map(m=>{const done=state.done.includes(m.id),locked=m.id>state.done.length;return `<button class="mission-node ${done?'done':''} ${locked?'locked':''} ${m.id===state.done.length?'available':''}" data-mission="${m.id}" ${locked?'disabled':''} aria-label="${esc(m.title)}${locked?' · Түгжээтэй':''}"><i>${done?'✓':locked?'⌑':m.boss?'⚑':m.id%6+1}</i><span>${m.title}</span><small>${m.boss?'СОРИЛ · 200':'100'} XP</small></button>`}).join('')}</div></section>`}).join('');document.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>openMission(+b.dataset.mission));const daily=Math.floor(Date.now()/86400000)%Math.max(1,state.done.length);$('dailyTitle').textContent=MISSIONS[daily].title;$('dailyBtn').onclick=()=>openMission(daily)}
function stash(remember=true){if(view==='practice')state.practice=$('code').value;else if(view==='quest')state.drafts[current]=$('code').value;return persist(remember)}
function switchView(requestedView,savePrevious=true,levelMode='play') {
    if (busy) return toast('Код ажиллаж байна. Зогсоогоод цэсээ солиорой.');
    if(savePrevious)stash(false);
    if (view === 'battle') BattleUI.leave();
    if (view === 'academy') AcademyUI.leave();
    if (view === 'maker') MakerUI.leave();
    if (view === 'level') LevelUI.leave();
    if (view === 'leaderboard') Leaderboard.leave();
    if (view === 'journal') JournalLab.close();
    if (view === 'duel') RobotDuelUI.leave();
    if (view === 'weekly') WeeklyPython.leave();
    if (view === 'exam') CourseExam.leave();
    if (Workshops.has(view)) Workshops.leave();
    const from = view;
    const pages = ['home','courses','map','quest','battle','duel','weekly','exam','practice','journal','awards','leaderboard','academy','maker','level','workshops',...Workshops.names];
    view = pages.includes(requestedView) ? requestedView : 'home';
    document.body.toggleAttribute('data-study-page', view === 'home' || view === 'courses');
    document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== view + 'View');
    if(view==='workshops'||Workshops.has(view)){
        $('workshopsView').hidden=false;
        Workshops.mount($('workshopsView'),view,state.academy.workshops,levelMode);
        window.scrollTo({top:0,behavior:'instant'});
    }
    if (view === 'home') renderStudyHome();
    if (view === 'courses') CourseCatalog.mount($('coursesView'), {won:state.academy.won, selected:state.resume?.view==='academy' ? state.academy.selected : null, openLesson:enterClass});
    if (view === 'map') renderMap();
    if (view === 'quest') renderMission();
    if (view === 'battle') {
        BattleUI.mount($('battleView'), {getSave: () => state.battles, save: persist, reward: battleReward, notify: toast});
    }
    if (view === 'practice') {
        $('practiceMount').append($('editor'));
        $('code').value = state.practice;
        clearConsole();
        lines();
    }
    if (view === 'academy') {
        AcademyUI.mount($('academyView'), {
            getSave: () => state.academy, save: persist, notify: toast, reward: finishClass,
            openMaker: () => switchView('maker'), exportPortfolio, importPortfolio
        });
    }
    if (view === 'level') levelModeInUse=levelMode;
    if (view === 'level') LevelUI.mount($('levelView'), {
        getSave:()=>state.academy.level, save:persist, notify:toast, startMode:levelMode,
        onMode:mode=>{levelModeInUse=mode;persist();},
        openDragon:()=>{
            try{LevelBoard.validate(state.academy.level.map);}catch(error){toast(error.message);return;}
            const studio=state.academy.workshops.dragon??=DragonStudio.normalize(null);
            studio.world='level';switchView('dragon');
        }
    });
    if (view === 'maker') MakerUI.mount($('makerView'), {
        getSave: () => state.academy.maker, save: persist, openClassroom: () => switchView('academy'),
        openGardenLevel: map => {
            const prior=state.academy.level;
            const own=prior.visiting?prior.other:prior;
            if ((own.map || own.code || own.peerCode || own.pairNotes) &&
                !confirm('Өөрийн зохиосон түвшин, түүний код, хосын тэмдэглэлийг шинэ цэцэрлэгээр солих уу? Хадгалах бол эхлээд урлангаас бүтээлээ татаж аваарай.'))return;
            const other=prior.visiting?readLevelSlot(prior):prior.other;
            state.academy.level=readLevelStudio({map,other});
            switchView('level',true,'edit');
        }
    });
    if (view === 'journal') {
        const target = /^topic-(\d+)$/.exec(levelMode);
        journalTopic = target && MISSIONS[Number(target[1])] ? Number(target[1]) : null;
        $('journalSaved').checked = levelMode === 'saved';
        if (levelMode === 'saved' || target) $('search').value = '';
        renderJournal();
        if (journalTopic !== null) $('journalCards').querySelector('[data-try="'+journalTopic+'"]')?.click();
    }
    if (view === 'exam') {
        CourseExam.mount($('examView'), {getSave: () => state.courseExam, save: persist});
        window.scrollTo({top:0,behavior:'instant'});
    }
    if (view === 'duel') RobotDuelUI.mount($('duelView'), {openAccount: () => GameAccount.open()});
    if (view === 'weekly') WeeklyPython.mount($('weeklyView'), {getSave: () => state.weeklyPython, save: persist});
    if (view === 'awards') renderAwards();
    if (view === 'leaderboard') Leaderboard.mount($('leaderboardView'));
    $('editor').hidden = !['quest','practice'].includes(view);
    updateHeader();
    const url = new URL(location.href);
    if (url.protocol !== 'file:') {
        url.searchParams.delete('train');
        url.searchParams.delete('trainLesson');
    }
    const publicRoute = ['home','courses'].includes(from) || ['home','courses'].includes(view);
    const push = savePrevious && !restoringPlayer && publicRoute && location.hash && location.hash !== '#' + view;
    url.hash = view;
    if (push) history.pushState(null, '', url.href);
    else history.replaceState(null, '', url.href);
    if (publicRoute && from !== view) window.scrollTo({top:0,behavior:'instant'});
    if (savePrevious && rememberActivity()) persist(false);
}
function openMission(i){if(i<0||i>=MISSIONS.length||i>state.done.length||busy)return;stash(false);current=i;switchView('quest',false);persist();window.scrollTo({top:0,behavior:'smooth'})}
function renderMission(){$('ambush').hidden=true;const m=MISSIONS[current],w=WORLDS[m.world];$('editorMount').append($('editor'));$('worldName').textContent=w.icon+' '+w.name;$('questProgress').textContent=(current+1)+' / 30';$('missionNo').textContent=(m.boss?'БҮЛГИЙН СОРИЛ':'ДААЛГАВАР')+' · +'+(m.boss?200:100)+' XP';$('title').textContent=m.title;$('explanation').textContent=m.info;$('task').textContent=m.task;$('expected').textContent=m.game?'Бүх зоосыг аваад тугтай нүдэнд хүрэх':m.expected;$('code').value=state.drafts[current]??m.start;hintIndex=0;$('hint').hidden=true;$('hintBtn').textContent='✧ Санаа авах';$('solutionBtn').hidden=true;$('feedback').textContent='';$('feedback').className='';$('next').hidden=true;$('finishMap').hidden=true;document.querySelector('.commands').hidden=!m.game;$('sceneBadge').textContent=m.game?'КОДООР УДИРДАХ СОРИЛ':'СУРАЛЦАХ БУУДАЛ';$('sceneTitle').textContent=m.game?'Баатраа эрдэнэс рүү хөтөл.':w.name;$('sceneCaption').textContent=m.game?'Кодын команд бүр таны баатрыг хөдөлгөнө.':`${current%6+1} / 6 буудал · ${m.concept}`;drawBoard(m.game||{width:8,start:current%6,coins:[7],goal:7},null);clearConsole();lines()}
async function animate(trace,m){const token=++animationId;for(const f of trace||[]){if(token!==animationId)return;if(m.game)drawBoard(m.game,f);await new Promise(r=>setTimeout(r,330))}}
function lines(){$('lineNumbers').textContent=Array.from({length:$('code').value.split('\n').length},(_,i)=>i+1).join('\n')}
function clearConsole(){stdout=[];$('output').textContent='Таны кодын үр дүн энд гарна.';$('runtime').textContent=ready?'Python бэлэн':'Ажиллуулахад Python ачаална'}
function setBusy(value){busy=value;$('run').disabled=value;$('reset').disabled=value;$('code').readOnly=value;$('stop').hidden=!value;$('hintBtn').disabled=value;$('solutionBtn').disabled=value;document.querySelectorAll('.example').forEach(b=>b.disabled=value)}
function terminate(message){clearTimeout(timer);animationId++;worker?.terminate();worker=null;ready=false;setBusy(false);$('runtime').textContent='Зогссон';$('output').textContent=message}
function errorHelp(message){if(/SyntaxError/.test(message))return 'Бичлэгийн алдаа: хашилт, хаалт, : тэмдгээ шалгаарай.';if(/IndentationError|TabError/.test(message))return 'Догол мөрийн алдаа: блокийн доторх мөр 4 зайтай байна.';if(/NameError/.test(message))return 'Энэ нэрийг Python танихгүй байна. Хувьсагчийн нэр, том жижиг үсгээ шалгаарай.';if(/TypeError/.test(message))return 'Утгын төрлүүд таарахгүй байна. Тоо болон текстийг ялгаарай.';if(/ZeroDivisionError/.test(message))return 'Тэгээр хувааж болохгүй. Хуваагчаа шалгаарай.';return 'Алдааны тайлбарыг уншаад засварлаж дахин оролдоорой.'}
async function result(data,m,mode){clearTimeout(timer);$('runtime').textContent='Дууссан';if(data.trace?.length&&mode==='quest')await animate(data.trace,m);if(!busy)return;setBusy(false);if(!data.ok){$('output').textContent=(stdout.join('\n')+'\n'+data.error).trim();if(mode==='quest'){$('feedback').className='feedback-error';$('feedback').textContent=data.kind==='test'?'Шалгалт: '+data.error:errorHelp(data.error)}return}if(mode==='practice'){$('output').textContent=stdout.join('\n')||'(Код амжилттай ажиллалаа. Хэвлэсэн гаралт алга.)';return}const out=stdout.join('\n').trim();if(out!==m.expected.trim()){$('feedback').className='feedback-error';$('feedback').textContent='Гаралт таарахгүй байна. Үсэг, зай, мөрийн тоогоо хүлээгдэж буй үр дүнтэй харьцуулаарай.';return}const first=!state.done.includes(m.id);if(first)state.done.push(m.id);if(!state.days.includes(today()))state.days.push(today());persist();updateHeader();sound(true);celebrateScene(m,out);showAmbush();$('feedback').className='feedback-success';$('feedback').textContent=state.done.length===30?'🏆 Баяр хүргэе, '+state.name+'! Бүх 5 ертөнцийг тууллаа. Амжилтууд цэснээс аяллын гэрчилгээгээ татаарай.':first?'✦ Даалгавар биеллээ! +'+(m.boss?200:100)+' XP · Дараагийн буудал нээгдлээ.':'✓ Дахин зөв хийлээ! Давтлага чадварыг бататгадаг.';$('next').hidden=m.id===29;$('finishMap').hidden=false;if(!out)$('output').textContent='✓ Тоглоомын командууд амжилттай биеллээ.'}
function execute(){if(busy)return;if(!$('code').value.trim())return toast('Эхлээд Python кодоо бичээрэй.');stash();const mode=view,m=MISSIONS[current],code=$('code').value;$('ambush').hidden=true;if(mode==='quest'){state.attempts[current]=(state.attempts[current]||0)+1;persist()}stdout=[];$('output').textContent=ready?'Код ажиллаж байна…':'Python ачаалж байна… Анхны удаа бага зэрэг хүлээнэ үү.';$('feedback').textContent='';$('next').hidden=true;$('finishMap').hidden=true;setBusy(true);const send=()=>{clearTimeout(timer);$('runtime').textContent='Ажиллаж байна';timer=setTimeout(()=>terminate('Код 5 секундээс удаан ажиллалаа. Давталтын зогсох нөхцөлөө шалгаад дахин оролдоорой.'),5000);worker.postMessage({code,check:mode==='quest'?m.check:'',game:mode==='quest'?m.game:null})};const handler=async({data})=>{if(data.type==='ready'){ready=true;send()}else if(data.type==='fatal'){terminate(data.error)}else if(data.type==='stdout'){stdout.push(data.text);$('output').textContent=stdout.join('\n');$('output').scrollTop=$('output').scrollHeight}else if(data.type==='result'){await result(data,m,mode)}};if(worker&&ready){worker.onmessage=handler;send();return}try{worker=new Worker('worker.js?v=3');worker.onmessage=handler;worker.onerror=e=>terminate('Тоглоомын Python хөдөлгүүр ажиллаж чадсангүй. '+(e.message||'Хуудсаа шинэчлээд кодоо дахин ажиллуулна уу.'));$('runtime').textContent='Python ачаалж байна';timer=setTimeout(()=>terminate('Python-ийг 90 секундэд ачаалж чадсангүй. Дахин ажиллуулж үзнэ үү.'),90000)}catch{terminate('Python ажиллуулах боломжгүй байна. Тоглоомыг веб холбоосоор нээгээрэй.')}}
function renderJournal() {
    const q = $('search').value.trim().toLowerCase();
    const saved = state.journalBookmarks;
    const onlySaved = $('journalSaved').checked;
    $('journalSavedCount').textContent = String(saved.length);
    const matches = MISSIONS.filter(m => (!onlySaved || saved.includes(m.id)) &&
        (m.title+' '+m.concept+' '+m.info).toLowerCase().includes(q));
    const cards = $('journalCards');
    cards.innerHTML = matches.map((m,i) => `<details class="journal-card" ${i===0?'open':''}>
        <summary><span>${WORLDS[m.world].icon} ${esc(m.concept)}</span><small>${esc(m.title)}</small></summary>
        <p>${esc(m.info)}</p><pre>${esc(m.solution)}</pre>
        <div class="jl-links"><button class="jl-try" data-try="${m.id}">▶ Жишээг өөрчлөөд турш</button>
        <button class="secondary jl-pin" data-pin="${m.id}" aria-pressed="${saved.includes(m.id)}">${saved.includes(m.id)?'★ Тэмдэглэсэн':'☆ Тэмдэглэх'}</button>
        ${m.id<=state.done.length?`<button class="secondary" data-review="${m.id}">Дасгалыг нээх</button>`:''}</div></details>`).join('')
        || (onlySaved && !saved.length ? '<p>Тэмдэглэсэн жишээ алга. Шүүлтүүрээ унтраагаад давтах сэдвийнхээ ☆ товчийг дараарай.</p>' : '<p>Тохирох ойлголт олдсонгүй.</p>');
    $('journalSaved').onchange = renderJournal;
    cards.onclick = event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-pin')) {
            const id = Number(button.dataset.pin);
            const bookmarks = state.journalBookmarks;
            const pinned = !bookmarks.includes(id);
            state.journalBookmarks = pinned ? [...bookmarks,id] : bookmarks.filter(value => value !== id);
            persist(false);
            if (onlySaved) { renderJournal(); $('journalSaved').focus(); }
            else {
                button.setAttribute('aria-pressed', String(pinned));
                button.textContent = pinned ? '★ Тэмдэглэсэн' : '☆ Тэмдэглэх';
                $('journalSavedCount').textContent = String(state.journalBookmarks.length);
            }
            return;
        }
        if (button.hasAttribute('data-review')) return openMission(Number(button.dataset.review));
        if (!button.hasAttribute('data-try')) return;
        const mission = MISSIONS[Number(button.dataset.try)];
        journalTopic = mission.id;
        if (rememberActivity()) persist(false);
        const drafts = state.journalDrafts;
        JournalLab.open(mission, drafts[mission.id], value => {
            if (value === mission.solution) delete drafts[mission.id];
            else drafts[mission.id] = value;
            persist(false);
        });
    };
}
function streak(){let n=0,d=new Date();if(!state.days.includes(today()))d.setDate(d.getDate()-1);for(let i=0;i<367;i++){if(!state.days.includes(d.toLocaleDateString('en-CA')))break;n++;d.setDate(d.getDate()-1)}return n}
function awards(){return [{icon:'🌟',title:'Анхны мөр',desc:'Эхний даалгавраа дуусгах',earned:state.done.length>0},...WORLDS.map((w,i)=>({icon:w.icon,title:w.name+' · эзэн',desc:'Бүлгийн 6 даалгаврыг дуусгах',earned:state.done.includes(i*6+5)})),{icon:'🔥',title:'Тууштай аялагч',desc:'3 өөр өдөр суралцах',earned:state.days.length>=3},{icon:'🏆',title:'Python аялагч',desc:'Бүх 30 даалгаврыг дуусгах',earned:state.done.length===30},...relicAwards()]}
function renderAwards(){$('summaryStats').innerHTML=`<div><b>${xp()}</b><span>Нийт XP</span></div><div><b>${state.done.length}/30</b><span>Даалгавар</span></div><div><b>${streak()}</b><span>Дараалсан өдөр</span></div><div><b>${awards().filter(a=>a.earned).length}/${awards().length}</b><span>Тэмдэг</span></div>`;$('awardCards').innerHTML=awards().map(a=>`<article class="award ${a.earned?'earned':''}"><span>${a.icon}</span><h3>${a.title}</h3><p>${a.desc}</p><small>${a.earned?'✓ Авсан':'Түгжээтэй'}</small></article>`).join('');$('certificate').hidden=state.done.length!==30;$('certificate').innerHTML=`<div class="eyebrow">АЯЛЛЫН ГЭРЧИЛГЭЭ</div><h2>${esc(state.name)}</h2><p>«Кодын нүүдэл» тоглоомын анхан шатны 30 даалгаврыг дуусгалаа.</p><small>Тоглоомын амжилтын дурсгал · Албан ёсны мэргэжлийн гэрчилгээ биш</small><br><button id="downloadCertificate">Гэрчилгээ татах</button>`;if($('downloadCertificate'))$('downloadCertificate').onclick=certificate}
function download(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function certificate(){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#151824"/><rect x="32" y="32" width="1136" height="736" rx="20" fill="none" stroke="#b8ef83" stroke-width="3"/><g text-anchor="middle" font-family="Arial, sans-serif"><text x="600" y="170" font-size="30" fill="#b8ef83">КОДЫН НҮҮДЭЛ</text><text x="600" y="270" font-size="50" fill="white">АЯЛЛЫН ГЭРЧИЛГЭЭ</text><text x="600" y="395" font-size="56" fill="#d3baff">${esc(state.name)}</text><text x="600" y="485" font-size="25" fill="white">5 ертөнц · 30 даалгавар · ${xp()} XP</text><text x="600" y="550" font-size="23" fill="#b8ef83">Python-ийн анхан шатны аяллаа дуусгалаа.</text><text x="600" y="670" font-size="17" fill="#a7a9bb">${esc(today())} · Тоглоомын амжилтын дурсгал</text></g></svg>`;download('python-quest-certificate.svg',svg,'image/svg+xml')}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));document.querySelector('.brand').onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();switchView('home')};$('continueBtn').onclick=()=>openMission(Math.min(state.done.length,29));$('backMap').onclick=()=>switchView('map');$('finishMap').onclick=()=>switchView('map');$('next').onclick=()=>openMission(current+1);$('run').onclick=execute;$('stop').onclick=()=>terminate('Кодыг зогсоолоо. Засварлаад дахин ажиллуулж болно.');$('code').oninput=()=>{lines();stash()};$('code').onscroll=()=>{$('lineNumbers').scrollTop=$('code').scrollTop};$('code').onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();if(busy)return;const t=e.target;t.setRangeText('    ',t.selectionStart,t.selectionEnd,'end');t.dispatchEvent(new Event('input'))}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();execute()}else if(e.key==='Enter'&&!busy){e.preventDefault();const t=e.target,before=t.value.slice(0,t.selectionStart),line=before.split('\n').pop(),indent=line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');t.setRangeText('\n'+indent,t.selectionStart,t.selectionEnd,'end');t.dispatchEvent(new Event('input'))}};
$('hintBtn').onclick=()=>{const m=MISSIONS[current];$('hint').hidden=false;$('hint').textContent=m.hints[Math.min(hintIndex,m.hints.length-1)];hintIndex++;state.hints[current]=(state.hints[current]||0)+1;$('hintBtn').textContent=hintIndex<m.hints.length?'✧ Дараагийн санаа':'✧ Санааг давтах';$('solutionBtn').hidden=hintIndex<m.hints.length;persist()};$('solutionBtn').onclick=()=>{$('hint').textContent='Жишээ шийдэл:\n'+MISSIONS[current].solution+'\n\nУчрыг нь ойлгоод өөрөө бичиж туршаарай.'};$('reset').onclick=()=>{if(confirm('Энэ талбарын кодыг эхний загварт буцаах уу?')){$('code').value=view==='practice'?fresh().practice:MISSIONS[current].start;lines();stash();clearConsole()}};$('downloadCode').onclick=()=>download('adventure.py',$('code').value,'text/x-python');$('search').oninput=renderJournal;
const examples={greet:'name = "Ану"\nprint(f"Сайн уу, {name}!")',loop:'for n in range(1, 6):\n    print("★" * n)',function:'def square(n):\n    return n * n\n\nfor n in range(1, 6):\n    print(n, square(n))'};document.querySelectorAll('.example').forEach(b=>b.onclick=()=>{if(busy)return;if(confirm('Чөлөөт талбарын кодыг энэ жишээгээр солих уу?')){$('code').value=examples[b.dataset.example];lines();stash()}});
$('sound').onclick=()=>{state.sound=!state.sound;persist();updateHeader();sound(true)};$('profileBtn').onclick=()=>GameAccount.open();$('saveName').onclick=()=>{state.name=$('playerName').value.trim()||'Аялагч';persist();updateHeader();if(view==='map')renderPlayerCamp();if(view==='awards')renderAwards();$('profileMessage').textContent='Нэр хадгалагдлаа.'};$('exportSave').onclick=()=>{stash();download('python-quest-progress.json',JSON.stringify(state,null,2),'application/json')};$('importSave').onchange=async e=>{
    const field=e.target, message=$('profileMessage');
    try {
        if(busy){message.textContent='Эхлээд ажиллаж буй кодоо зогсооно уу.';return;}
        const file=field.files[0];
        if(!file)return;
        if(file.size>12*1024*1024)throw Error('Файл хэт том байна.');
        const imported=validState(JSON.parse(await file.text()));
        if(!confirm('«'+imported.name+'» сурагчийн ахицыг энэ хадгаламжаас сэргээх үү? Тухайн сурагчийн өмнөх ахиц солигдоно.'))return;
        if(!GameAccount.isCloud() && activateStudent(imported,'map')){
            $('playerName').value=state.name;
            message.textContent='Ахиц сэргээгдлээ.';
        } else {message.textContent=$('toast').textContent;}
    } catch(error){message.textContent=error.message;}
    finally{field.value='';}
};
$('resetAll').onclick=()=>{
    if(busy)return toast('Эхлээд кодоо зогсооно уу.');
    if(!confirm('Энэ сурагчийн бүх ахиц болон бичсэн кодыг устгаж шинээр эхлэх үү? Эхлээд ахицаа татаж нөөцөлж болно.'))return;
    const next=fresh();
    next.academy.portfolioId=state.academy.portfolioId;
    if(activateStudent(next,'map')){
        $('profile').close();
        toast('Шинэ аялал эхэллээ.');
    } else {$('profileMessage').textContent=$('toast').textContent;}
};
function playerNavigation() {
    return {
        state, account: GameAccount.status(), openAccount: () => GameAccount.open(),
        openMission, openClass: enterClass, openBattle: enterBattle, openWorkshops: () => switchView('workshops'),
        openActivity: (route,mode) => switchView(route,true,mode)
    };
}
function renderPlayerCamp() {
    PlayerHome.mount($('playerCamp'), playerNavigation());
}
function renderStudyHome() {
    const navigation = playerNavigation();
    const account = navigation.account;
    const recent = PlayerHome.recentWork(navigation);
    const done = new Set(state.academy.won);
    const next = ACADEMY.findIndex((_, index) => !done.has(index));
    const units = ACADEMY_CHAPTERS.map(chapter => {
        const ids = Array.from({length:chapter.count}, (_, offset) => chapter.first + offset);
        return {id:chapter.first, title:chapter.title, total:chapter.count,
            meta:chapter.count + ' хичээл · ' + academyDuration(chapter.minutes * chapter.count),
            completed:ids.filter(id => done.has(id)).length,
            next:ids.find(id => !done.has(id)) ?? chapter.first};
    });
    SelfStudy.render($('homeView'), {
        name:account.profile?.name, signedIn:account.phase === 'member', authAvailable:account.authAvailable,
        total:ACADEMY.length, completed:done.size, hasProgress:!!state.resume || done.size > 0 || state.done.length > 0,
        resumeLabel:recent?.title || ACADEMY[next]?.title || 'Төгсгөлийн сорил',
        onResume:recent?.visit || (next >= 0 ? () => enterClass(next) : () => switchView('exam')),
        onStart:() => enterClass(0), onBrowse:() => switchView('courses'),
        onRegister:() => GameAccount.open('signup'), onLogin:() => GameAccount.open('signin'),
        onPractice:() => switchView('practice'), onAdventure:() => switchView('map'),
        onReference:event => ReferenceAccess.open({opener:event.currentTarget}),
        units, onUnit:id => enterClass(units.find(unit => unit.id === id).next)
    });
}
function updateAccountButton() {
    const {profile, phase, sync, newer} = GameAccount.status();
    const button = $('profileBtn');
    $('progressStorage').textContent = profile ? 'Ахицын төлөвийг бүртгэлээсээ харна уу.' : 'Зочны ахиц энэ хөтөч дээр хадгалагдана.';
    const title = profile?.name || ({offline:'Миний профайл', enroll:'Бүртгүүлэх', guest:'Нэвтрэх', loading:'Миний бүртгэл', error:'Миний бүртгэл'}[phase] || 'Миний бүртгэл');
    if (button.textContent !== title) button.textContent = title;
    button.classList.toggle('needs-attention', newer || sync === 'conflict' || sync === 'error');
    button.setAttribute('aria-label', profile ? title + ' · Бүртгэлээ нээх' : title);
}
function showDeviceProfile() {
    if (GameAccount.isCloud()) return GameAccount.open();
    $('playerName').value = state.name;
    $('profileMessage').textContent = '';
    $('localProfiles').replaceChildren(classProfilePicker());
    $('profile').showModal();
}
// Clear views holding a previous player's code.
function displayPlayer(next) {
    restoringPlayer=true;
    try { replaceDisplayedPlayer(next); } finally { restoringPlayer=false; }
}
function replaceDisplayedPlayer(next) {
    const sharedReference = ReferenceAccess.isOpen() && ReferenceAccess.match(location.hash);
    ReferenceAccess.close(false);
    if (busy) terminate('Бүртгэл солигдлоо.');
    if ($('profile').open) $('profile').close();
    const route = view;
    switchView('map', false);
    for (const id of ['homeView','coursesView','academyView','makerView','levelView','workshopsView','battleView','duelView','weeklyView','examView','localProfiles']) $(id).replaceChildren();
    $('code').value = '';
    $('output').textContent = '';
    state = next;
    current = next.resume?.view==='quest'?next.resume.mission:Math.min(next.done.length, MISSIONS.length - 1);
    switchView(route, false,route==='level' && next.resume?.view==='level'?next.resume.mode:'play');
    if (sharedReference) ReferenceAccess.open({shared:sharedReference});
}
const assignedUrl = new URL(location.href);
const assignedLesson = assignedUrl.hash === '#academy' ? Number(assignedUrl.searchParams.get('lesson')) : 0;
let assignmentPending = assignedLesson >= 1 && assignedLesson <= ACADEMY.length && Number.isInteger(assignedLesson);
function useCloudSave(save, profile) {
    const next = validState(save);
    next.name = profile.name;
    const applyAssignment=assignmentPending && view==='academy';
    assignmentPending = false;
    displayPlayer(next);
    if (applyAssignment) queueMicrotask(()=>{
        if (state===next && view==='academy') enterClass(assignedLesson-1);
    });
}
function restoreDeviceSave() {
    let saved = fresh();
    try {
        lastActiveSave = localStorage.getItem(KEY);
        if (lastActiveSave) saved = validState(JSON.parse(lastActiveSave));
    } catch {}
    displayPlayer(saved);
}
window.addEventListener('beforeunload',()=>{if(!busy)stash(false)});readAssignedLesson();
ReferenceAccess.init({profile:() => state, save:() => persist(false), view:() => view});
const linkedReference = ReferenceAccess.match(location.hash);
switchView(linkedReference ? 'map' : location.hash.slice(1) || 'home');
if (linkedReference) ReferenceAccess.open({shared:linkedReference});
let campIdentity = '';
GameAccount.init({
    getState: () => state, fresh, replace: useCloudSave, restoreGuest: restoreDeviceSave,
    canRefresh: () => ['map','home'].includes(view) && !busy && !ReferenceAccess.isOpen(),
    showLocalProfile: showDeviceProfile,
    download: save => download('python-quest-progress.json', JSON.stringify(save, null, 2), 'application/json'),
    onStatus: status => {
        updateAccountButton();
        const identity = JSON.stringify([status.phase, status.profile?.name, status.profile?.avatar]);
        if (campIdentity !== identity) {
            if (view === 'map') renderPlayerCamp();
            if (view === 'home') renderStudyHome();
        }
        campIdentity = identity;
    }
});
window.addEventListener('hashchange', () => {
    const shared = ReferenceAccess.match(location.hash);
    if (shared) return ReferenceAccess.open({shared});
    ReferenceAccess.close(false);
    const route = location.hash.slice(1) || 'home';
    if (route !== view) switchView(route);
});
