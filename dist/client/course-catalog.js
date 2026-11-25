/* Shared by the public course index and the lesson switcher inside the studio. */
window.CourseCatalog = (() => {
    'use strict';
    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function searchable(text) {
        return text.normalize('NFKC').toLocaleLowerCase('mn').trim();
    }
    const lessons = ACADEMY.map((lesson, index) => {
        const chapter = academyChapter(index);
        const words = searchable([lesson.title, lesson.intro, lesson.example, lesson.lab.title, chapter.title].join(' '));
        return {lesson, chapter, index, words};
    });

    function chooseLanguage(trigger) {
        TrailPicker.open({track:'python', lang:GameLocale.lang, trigger, onSelect(track) {
            if (track === 'python' && location.hash === '#courses') {
                if (location.protocol !== 'file:') {
                    const current = new URL(location.href);
                    current.searchParams.set('track', 'python');
                    history.replaceState(history.state, '', current);
                }
                return;
            }
            const url = new URL(track === 'python' ? 'index.html' : 'trail.html', location.href);
            url.searchParams.set('track', track);
            url.searchParams.set('lang', GameLocale.lang);
            if (track === 'python') url.hash = 'courses';
            location.assign(url.href);
        }});
    }

    function mount(root, {won, selected, openLesson, compact = false}) {
        const previous = compact ? null : root.querySelector('.ac-filters');
        const panel = element('section', compact ? 'catalog-switcher' : 'course-library');
        if (!compact) {
            const previousGuide = root.querySelector('.pace-guide');
            const chooser = element('button', 'catalog-change', GameLocale.lang === 'en' ? 'Choose programming language' : 'Сурах хэл сонгох');
            chooser.type = 'button';
            chooser.setAttribute('aria-haspopup', 'dialog');
            chooser.addEventListener('click', () => chooseLanguage(chooser));
            panel.append(chooser, element('h1', '', 'Python хичээлүүд'),
                element('p', 'catalog-intro', ACADEMY_CHAPTERS.length + ' бүлэг · ' + ACADEMY.length + ' хичээл'),
                StudyPace.create({expanded:previousGuide?.open ?? true}));
        }
        const filters = element('div', 'ac-filters');
        const group = element('select', 'ac-select');
        group.add(new Option('Бүх бүлэг', 'all'));
        for (const chapter of ACADEMY_CHAPTERS) group.add(new Option(chapter.title, String(chapter.first)));
        group.value = previous?.querySelector('select')?.value || (compact ? String(academyChapter(selected).first) : 'all');
        const search = element('input', 'ac-search');
        search.type = 'search';
        search.placeholder = 'Жишээ нь: давталт, print, жагсаалт';
        if (!compact) search.id = 'courseSearch';
        search.value = previous?.querySelector('input')?.value || '';
        for (const [caption, control] of [['Бүлэг', group], ['Хичээл хайх', search]]) {
            const label = element('label', 'ac-label');
            label.append(element('span','',caption), control);
            filters.append(label);
        }
        const summary = element('p','catalog-status');
        summary.setAttribute('role','status');
        const list = element('div', compact ? 'ac-lessons' : 'catalog-groups');
        const done = new Set(won);

        function draw() {
            const terms = searchable(search.value).split(/\s+/).filter(Boolean);
            list.replaceChildren();
            let count = 0, currentChapter, entries = list;
            for (const {lesson, chapter, index, words} of lessons) {
                if (group.value !== 'all' && Number(group.value) !== chapter.first) continue;
                if (!terms.every(term => words.includes(term) || String(index + 1) === term)) continue;
                if (!compact && currentChapter !== chapter) {
                    const section = element('section', 'catalog-chapter');
                    section.append(element('h2', '', chapter.title));
                    entries = element('div','catalog-rows');
                    section.append(entries);
                    list.append(section);
                    currentChapter = chapter;
                }
                const link = element('a', 'ac-lesson-item');
                const url = new URL(location.href);
                url.search = '';
                url.searchParams.set('lesson', String(index + 1));
                url.hash = 'academy';
                link.href = url.href;
                link.dataset.courseLesson = String(index);
                link.append(element('small','ac-num',String(index + 1).padStart(2,'0')),
                    element('span','catalog-name', lesson.title));
                if (done.has(index)) {
                    const mark = element('span', 'ac-stamp', '✓');
                    mark.setAttribute('aria-label','Дууссан');
                    link.append(mark);
                }
                if (index === selected) link.setAttribute('aria-current', 'true');
                link.addEventListener('click', event => {
                    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    openLesson(index);
                });
                entries.append(link);
                count++;
            }
            summary.textContent = count ? count + ' хичээл' : 'Хичээл олдсонгүй. Өөр үг эсвэл өөр бүлэг сонгоорой.';
        }
        group.addEventListener('change', draw);
        search.addEventListener('input', () => {
            if (compact && search.value) group.value = 'all';
            draw();
        });
        panel.append(filters, summary, list);
        root.replaceChildren(panel);
        draw();
    }
    return {mount, chooseLanguage};
})();
