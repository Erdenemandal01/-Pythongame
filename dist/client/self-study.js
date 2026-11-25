(() => {
    'use strict';

    function element(tag, className, label) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (label !== undefined) node.textContent = label;
        return node;
    }

    function picture(filename, className, directory = 'art/') {
        const image = element('img', className);
        image.src = directory + filename;
        image.alt = '';
        image.draggable = false;
        return image;
    }

    function action(key, label, className, callback) {
        const button = element('button', className, label);
        button.type = 'button';
        button.dataset.studyAction = key;
        if (typeof callback === 'function') button.addEventListener('click', callback);
        else button.disabled = true;
        return button;
    }

    function arrow() {
        const mark = element('span', 'ss-arrow', '→');
        mark.setAttribute('aria-hidden', 'true');
        return mark;
    }

    function illustration() {
        const scene = element('div', 'ss-scene');
        scene.append(picture('steppe-camp.webp', 'ss-scenery', 'assets/'), picture('avatars/scout.png', 'ss-traveler'));
        const sample = element('div', 'ss-example');
        const code = element('code');
        const greeting = globalThis.GameLocale?.lang === 'en' ? 'Hello!' : 'Сайн уу!';
        code.append(element('span', 'ss-prompt', '>>> '), element('span', 'ss-fn', 'print'),
            '(', element('span', 'ss-string', '"' + greeting + '"'), ')');
        sample.append(code, element('samp', '', greeting));
        scene.append(sample);
        return scene;
    }

    function progressLine(completed, total) {
        const group = element('div', 'ss-progress');
        const label = element('span', '', 'Дуусгасан хичээл');
        const value = element('strong', '', completed + ' / ' + total);
        const meter = element('progress');
        meter.max = total;
        meter.value = completed;
        meter.setAttribute('aria-label', label.textContent);
        group.append(label, value, meter);
        return group;
    }

    function hero(options) {
        const {name, signedIn, authAvailable, total, completed, hasProgress, resumeLabel} = options;
        const section = element('section', 'ss-hero');
        const copy = element('div', 'ss-copy');
        const facts = element('div', 'ss-facts');
        facts.append(element('span', '', signedIn || hasProgress ? 'Миний Python хөтөлбөр' : 'Анхан шат'));
        if (total) facts.append(element('span', '', total + ' хичээл'));
        const title = element('h1', 'ss-title');
        const intro = element('p', 'ss-intro');
        if (signedIn || hasProgress) {
            if (signedIn && name) {
                const nickname = element('span', '', name);
                nickname.translate = false;
                title.append('Сайн уу, ', nickname, '!');
            } else title.textContent = 'Миний суралцах зам';
            if (hasProgress && resumeLabel) {
                intro.append(element('span', 'ss-resume-caption', 'Үргэлжлүүлэх'), ' ', resumeLabel);
            } else {
                intro.textContent = hasProgress ? 'Хадгалсан хичээлээ нээгээд үргэлжлүүлээрэй.' :
                    'Эхний хичээлээ нээгээд Python-оор анхны бүтээлээ хийгээрэй.';
            }
        } else {
            title.append(element('span', 'ss-python', 'Python'), '-ийг өөрийн хурдаар суръя.');
            intro.textContent = 'Монгол тайлбартай хичээлээр код бичиж, үр дүнг нь шууд хараарай. Пиксел зургаас эхлээд өөрийн тоглоом хүртэл бүтээнэ.';
        }
        copy.append(facts, title, intro);
        if ((signedIn || hasProgress) && total > 0) copy.append(progressLine(completed, total));

        const controls = element('div', 'ss-controls');
        const primary = action(hasProgress ? 'resume' : 'start', options.courseAction, 'ss-primary',
            hasProgress ? options.onResume : options.onStart);
        primary.append(arrow());
        controls.append(primary);
        if (!signedIn && authAvailable) {
            controls.append(action('register', 'Бүртгүүлэх', 'ss-secondary', options.onRegister),
                action('login', 'Нэвтрэх', 'ss-link', options.onLogin));
        }
        copy.append(controls);
        if (!signedIn) {
            copy.append(element('p', 'ss-save-note', hasProgress ? 'Таны ахиц энэ хөтөч дээр хадгалагдсан.' :
                'Зочноор сурахад ахиц энэ хөтөч дээр хадгалагдана.'));
        }
        section.append(copy, illustration());
        return section;
    }

    function unitRow(unit, index, onUnit) {
        const item = element('li');
        const open = typeof onUnit === 'function' ? () => onUnit(unit.id) : null;
        const button = action('unit', undefined, 'ss-unit', open);
        button.dataset.studyUnit = unit.id;
        button.disabled = button.disabled || !!unit.locked;
        const number = element('span', 'ss-unit-number', String(index + 1).padStart(2, '0'));
        const text = element('span', 'ss-row-copy');
        text.append(element('strong', '', unit.title));
        if (unit.meta) text.append(element('small', '', unit.meta));
        const status = element('span', 'ss-unit-state');
        if (unit.locked) status.textContent = 'Түгжээтэй';
        else if (unit.total > 0 && unit.completed >= unit.total) {
            status.classList.add('ss-done');
            status.textContent = 'Дууссан';
        } else if (unit.completed > 0) status.textContent = unit.completed + ' / ' + unit.total;
        button.append(number, text, status);
        if (!button.disabled) button.append(arrow());
        item.append(button);
        return item;
    }

    function learningPath(options) {
        const section = element('section', 'ss-path');
        section.append(element('h2', 'ss-section-title', 'Үндсэн хичээлүүд'));
        const units = Array.isArray(options.units) ? options.units : [];
        if (units.length) {
            const next = units.findIndex(unit => !unit.locked && unit.completed < unit.total);
            const start = Math.max(0, Math.min(next, units.length - 4));
            const list = element('ol', 'ss-units');
            list.start = start + 1;
            units.slice(start, start + 4).forEach((unit, offset) => {
                list.append(unitRow(unit, start + offset, options.onUnit));
            });
            section.append(list);
        }
        const browse = action('browse', 'Бүх хичээлийг үзэх', 'ss-browse', options.onBrowse);
        browse.append(arrow());
        section.append(browse);
        return section;
    }

    function tool(key, label, description, filename, callback) {
        const button = action(key, undefined, 'ss-tool', callback);
        const icon = element('span', 'ss-tool-icon');
        if (filename) icon.append(picture(filename));
        else {
            icon.textContent = '>_';
            icon.setAttribute('aria-hidden', 'true');
        }
        const text = element('span', 'ss-row-copy');
        text.append(element('strong', '', label), element('small', '', description));
        button.append(icon, text, arrow());
        return button;
    }

    function tools(options) {
        const section = element('section', 'ss-tools');
        section.append(element('h2', 'ss-section-title', 'Нэмэлт дасгалууд'));
        if (options.recentPractice) {
            const {title, icon, visit} = options.recentPractice;
            section.append(tool('recent-practice', title, 'Сүүлд нээсэн дасгал', 'avatars/' + icon, visit));
        }
        if (options.recentPractice?.kind !== 'practice') {
            section.append(tool('practice', 'Чөлөөт талбар', 'Python кодоо бичиж ажиллуулах', null, options.onPractice));
        }
        section.append(tool('reference', 'Python лавлах', 'Командын тайлбар, жишээ хайх', 'avatars/journal.png', options.onReference),
            tool('adventure', 'Аяллын зураг', 'Кодоор баатраа удирдах', 'avatars/map.png', options.onAdventure));
        return section;
    }

    function render(root, options) {
        const focused = document.activeElement;
        const restore = root.contains(focused) ? focused.closest('[data-study-action]') : null;
        const previousGuide = root.querySelector('.pace-guide');
        const guide = StudyPace.create({expanded:!!previousGuide?.open});
        const guideFocused = previousGuide?.querySelector('summary') === focused;
        const home = element('div', 'ss-home');
        const sections = element('div', 'ss-sections');
        sections.append(learningPath(options), tools(options));
        home.append(hero(options), sections, guide);
        root.replaceChildren(home);
        if (guideFocused) guide.querySelector('summary').focus({preventScroll:true});
        if (restore) {
            const next = Array.from(home.querySelectorAll('[data-study-action]')).find(button =>
                button.dataset.studyAction === restore.dataset.studyAction &&
                button.dataset.studyUnit === restore.dataset.studyUnit);
            next?.focus({preventScroll: true});
        }
    }

    window.SelfStudy = Object.freeze({render});
})();
