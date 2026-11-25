(() => {
    'use strict';

    const art = 'art/avatars/';
    const avatars = new Set(['scout', 'mage', 'ranger', 'mechanic']);

    function element(tag, className, label) {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (label !== undefined) item.textContent = label;
        return item;
    }

    function picture(name, className, directory = art) {
        const img = element('img', className);
        img.alt = '';
        img.src = directory + name;
        img.draggable = false;
        return img;
    }

    function hasLessonWork(lesson) {
        return !!lesson && (lesson.answer >= 0 || lesson.passed?.length > 0 ||
            Object.values(lesson.drafts || {}).some(code => code.trim()) ||
            !!lesson.reflection?.trim() || !!lesson.extension?.trim() || !!lesson.inputData?.trim());
    }

    function coreLesson({state, openClass, openActivity}) {
        const school = state.academy;
        const classDone = new Set(school.won);
        const nextClass = ACADEMY.findIndex((_, id) => !classDone.has(id));
        if (nextClass < 0) return {
            kind:'exam', icon:'journal.png', label:'Үндсэн хичээлүүд', title:'Төгсгөлийн сорил',
            detail:'3 Python бодлого', action:'Төгсгөлийн сорил нээх', started:true,
            visit:() => openActivity('exam')
        };
        const selected = school.selected;
        const selectedActive = ACADEMY[selected] && !classDone.has(selected) && school.lessons[selected];
        const startedClass = selectedActive ? selected : ACADEMY.findIndex((_, id) =>
            !classDone.has(id) && hasLessonWork(school.lessons[id]));
        const classId = startedClass >= 0 ? startedClass : nextClass;
        const started = startedClass >= 0 || classDone.size > 0;
        return {
            kind:'academy', icon:'journal.png', label:'Үндсэн хичээлүүд', title:ACADEMY[classId].title,
            detail:(classId + 1) + '-р хичээл · ойролцоогоор ' + academyChapter(classId).minutes + ' минут',
            action:started ? 'Үндсэн хичээлээ үргэлжлүүлэх' : 'Эхний хичээлээ эхлэх', started,
            visit:() => openClass(classId)
        };
    }

    function adventure({state, openMission}) {
        const questDone = new Set(state.done);
        const nextMission = MISSIONS.findIndex((_, id) => !questDone.has(id));
        const missionId = nextMission < 0 ? 0 : nextMission;
        const mission = MISSIONS[missionId];
        const adventuring = questDone.size > 0 || !!state.attempts?.[missionId] ||
            (state.drafts?.[missionId] && state.drafts[missionId] !== mission.start);
        return {
            kind:'quest', icon: 'map.png', label: 'Нэмэлт дасгалууд',
            title: mission.title,
            detail: WORLDS[mission.world].name + ' · ' + mission.concept,
            action: nextMission < 0 ? 'Дахин аялах' : adventuring ? 'Аяллаа үргэлжлүүлэх' : 'Аяллаа эхлэх',
            visit: () => openMission(missionId)
        };
    }

    function recentWork({state,openMission,openClass,openBattle,openActivity}) {
        const r=state.resume;
        if (!r) return null;
        const card={kind:r.view, icon:'journal.png',label:'Сүүлд нээсэн',action:'Үргэлжлүүлэх'};
        if (r.view==='academy') {
            const id=state.academy.selected;
            if (state.academy.won.includes(id)) return null;
            const phase=state.academy.lessons[id]?.phase;
            const step=academyChapter(id).timing[phase]?.[0];
            return {...card,title:ACADEMY[id].title,detail:(id+1)+'-р хичээл'+(step?' · '+step:''),visit:()=>openClass(id)};
        }
        if (r.view==='quest') {
            if (state.done.includes(r.mission)) return null;
            const m=MISSIONS[r.mission];
            return {...card,icon:'map.png',title:m.title,detail:WORLDS[m.world].name,visit:()=>openMission(r.mission)};
        }
        if (r.view==='battle') {
            const id=state.battles.selected;
            return {...card,icon:'map.png',title:BATTLES[id].title,detail:'Кодоор тулалдах',visit:()=>openBattle(id)};
        }
        if (r.view==='journal' && Number.isInteger(r.mission) && MISSIONS[r.mission]) {
            return {...card,title:MISSIONS[r.mission].title,detail:'Дэвтрийн туршилт',
                visit:()=>openActivity('journal','topic-'+r.mission)};
        }
        const labels={
            practice:['Чөлөөт талбар','Python код'],maker:['Бүтээлийн тайз','Миний бүтээл'],
            journal:['Мэдлэгийн дэвтэр','Жишээг өөрчилж турших'],
            exam:['Төгсгөлийн сорил','Python кодоор бодох гурван бодлого'],
            weekly:['Долоо хоногийн сорил','Энэ долоо хоногийн Python бодлого'],
            duel:['Роботын халз сорил','Роботынхоо дүрмийг кодоор бичих'],
            level:['Миний түвшин',({edit:'Зургаа засах',pair:'Хосын сорил',play:'Түвшнээ тоглох'})[r.mode]]
        };
        const info=labels[r.view] || Workshops.describe(r.view);
        return info && {...card,title:info[0],detail:info[1],visit:()=>openActivity(r.view,r.mode)};
    }

    function routeCard(route, primary) {
        const card = element('button', 'ph-route' + (primary ? ' ph-route-primary' : ''));
        card.type = 'button';
        card.dataset.campControl = primary ? 'primary' : 'secondary';
        const icon = element('span', 'ph-token');
        icon.append(picture(route.icon));
        const content = element('span', 'ph-route-copy');
        content.append(element('span', 'ph-route-label', route.label),
            element('span', 'ph-route-name', route.title),
            element('span', 'ph-route-detail', route.detail));
        const action = element('span', 'ph-route-action', route.action);
        const arrow = element('span', 'ph-arrow', '→');
        arrow.setAttribute('aria-hidden', 'true');
        action.append(arrow);
        content.append(action);
        card.append(icon, content);
        card.addEventListener('click', route.visit);
        return card;
    }

    function counter(label, value, total) {
        const stat = element('span', 'ph-counter');
        const bar = element('progress');
        bar.max = total;
        bar.value = value;
        bar.setAttribute('aria-label', label);
        stat.append(element('span', '', label), element('strong', '', value + '/' + total), bar);
        return stat;
    }

    function studyLinks({state, openActivity}) {
        const nav = element('nav', 'ph-study-links');
        nav.setAttribute('aria-label', 'Сурагчийн холбоосууд');
        const bookmarks = state.journalBookmarks?.length || 0;
        const links = [
            ['journal', 'Мэдлэгийн дэвтэр', () => openActivity('journal')],
            ['saved', 'Хадгалсан жишээ (' + bookmarks + ')', () => openActivity('journal', 'saved')],
            ['duel', 'Роботын халз сорил', () => openActivity('duel')],
            ['weekly', 'Долоо хоногийн сорил', () => openActivity('weekly')]
        ];
        for (const [key, label, open] of links) {
            const button = element('button', '', label);
            button.type = 'button';
            button.dataset.campControl = key;
            const arrow = element('span', 'ph-arrow', '→');
            arrow.setAttribute('aria-hidden', 'true');
            button.append(arrow);
            button.addEventListener('click', open);
            nav.append(button);
        }
        return nav;
    }

    function mount(root, context) {
        if (!root) return;
        const {state, account, openAccount} = context;
        const profile = account?.profile;
        const name = profile?.name || state.name;
        const avatar = avatars.has(profile?.avatar) ? profile.avatar : 'scout';
        const previousFocus = root.contains(document.activeElement) ? document.activeElement.dataset.campControl : null;
        const camp = element('section', 'ph-camp');
        camp.setAttribute('aria-labelledby', 'ph-welcome');
        const hero = element('div', 'ph-hero');
        const scene = element('div', 'ph-illustration');
        scene.setAttribute('aria-hidden', 'true');
        scene.append(picture('steppe-camp.webp', 'ph-landscape', 'assets/'), picture(avatar + '.png', 'ph-traveler'));
        const sparks = element('span', 'ph-sparks');
        scene.append(sparks);
        const intro = element('div', 'ph-intro');
        const location = element('p', 'ph-location');
        const star = element('i', 'ph-star');
        star.setAttribute('aria-hidden', 'true');
        location.append(star, document.createTextNode('Аялагчийн отог'));
        const title = element('h1');
        if (name && (profile || name !== 'Аялагч')) {
            const nickname = element('span', '', name);
            nickname.translate = false;
            title.append('Сайн уу, ', nickname, '!');
        } else title.textContent = 'Тавтай морил!';
        title.id = 'ph-welcome';
        const record = element('div', 'ph-record');
        record.append(counter('Аяллын даалгавар', state.done.length, MISSIONS.length),
            counter('Урлангийн хичээл', state.academy.won.length, ACADEMY.length));
        intro.append(location, title, record);
        if (typeof openAccount === 'function') {
            const member = !!profile && account?.phase === 'member';
            const phase = account?.phase;
            const label = member ? 'Миний дүр' : phase === 'enroll' ? 'Дүрээ үүсгэх' :
                phase === 'offline' ? 'Төхөөрөмжийн профайл' : 'Нэвтрэх / Бүртгүүлэх';
            const profileButton = element('button', 'ph-account');
            profileButton.type = 'button';
            profileButton.dataset.campControl = 'account';
            profileButton.append(picture(avatar + '.png'), element('span', '', label));
            profileButton.addEventListener('click', openAccount);
            const actions=element('div','ph-camp-actions');
            const across=element('button','ph-device-link','Өөр компьютерээр нээх');
            across.type='button';
            across.dataset.openDevice='';
            across.dataset.campControl='device';
            across.setAttribute('aria-haspopup','dialog');
            actions.append(profileButton,across);
            intro.append(actions);
        }
        hero.append(scene, intro);
        const options = element('div', 'ph-routes');
        options.append(routeCard(adventure(context), true), routeCard(coreLesson(context), false));
        const overview = element('div', 'ph-course-overview');
        CourseOverview.mount(overview);
        camp.append(hero, options, overview, studyLinks(context));
        root.replaceChildren(camp);
        if (previousFocus) root.querySelector('[data-camp-control="' + previousFocus + '"]')?.focus({preventScroll: true});
    }

    window.PlayerHome = {mount, recentWork, coreLesson};
})();
