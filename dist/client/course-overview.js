(() => {
    'use strict';

    function fact(icon, title, caption, href, download = false) {
        const cell = document.createElement('li');
        cell.className = 'co-fact';
        const body = document.createElement(href ? 'a' : 'div');
        body.className = 'co-fact-body';
        if (href) body.href = href;
        if (download) body.download = '';

        const image = document.createElement('img');
        image.src = 'art/course-overview/' + icon + '.svg?v=2';
        image.alt = '';
        image.width = 32;
        image.height = 32;
        const value = document.createElement('strong');
        value.className = 'co-value';
        value.textContent = title;
        const label = document.createElement('span');
        label.className = 'co-caption';
        label.textContent = caption;
        body.append(image, value, label);
        cell.append(body);
        return cell;
    }

    function mount(root) {
        const list = document.createElement('ul');
        list.className = 'co-facts';
        list.setAttribute('aria-label', 'Python хөтөлбөрийн мэдээлэл');
        const offline = window.PQ_CLASSROOM_KIT === true;
        list.append(
            fact('academic-cap', 'Анхан шат', 'Код бичиж үзээгүй ч болно'),
            fact('clock', 'Өөрийн хурдаар', 'Зорилго, хугацааны баримжаа', '#courses'),
            fact('book-open', ACADEMY.length + ' хичээл', ACADEMY_CHAPTERS.length + ' бүлэг'),
            fact('clipboard-document-check', 'Төгсгөлийн сорил', '3 Python бодлого', '#exam'),
            fact('arrow-down-tray', 'Офлайн багц', offline ? 'Энэ төхөөрөмжид бэлэн' : 'ZIP файл татах',
                offline ? null : 'python-quest-classroom.zip', !offline)
        );
        root.classList.add('co-overview');
        root.replaceChildren(list);
    }

    window.CourseOverview = Object.freeze({mount});
})();
