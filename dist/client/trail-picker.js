(() => {
    const assets = new URL('art/languages/', document.currentScript?.src || document.baseURI);
    const tracks = [
        {id: 'python', icon: 'python.svg', mn: 'Python-ийн адал явдал', en: 'Python Adventure'},
        {id: 'c', icon: 'c.svg', mn: 'C хэлний адал явдал', en: 'C Adventure'},
        {id: 'cpp', icon: 'cplusplus.svg', mn: 'C++ хэлний адал явдал', en: 'C++ Adventure'}
    ];
    let activeDialog = null;
    let headingId = 0;

    function element(tag, className, text) {
        const el = document.createElement(tag);
        el.className = className;
        if (text) el.textContent = text;
        return el;
    }
    function render(container, {track = 'python', lang = 'mn', onSelect, onClose} = {}) {
        const english = lang === 'en';
        const root = element('section', 'tp-picker');
        root.lang = english ? 'en' : 'mn';
        const header = element('div', 'tp-header');
        const title = element('h2', 'tp-title', english ? 'Choose a language' : 'Суралцах хэлээ сонго');
        title.id = 'tp-heading-' + (++headingId);
        root.setAttribute('aria-labelledby', title.id);
        const close = element('button', 'tp-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', english ? 'Close language selection' : 'Хэл сонгох хэсгийг хаах');
        close.addEventListener('click', onClose);
        header.append(title, close);
        const label = element('h3', 'tp-group', english ? 'All languages' : 'Бүх хэл');
        label.id = title.id + '-languages';
        const cards = element('div', 'tp-cards');
        cards.setAttribute('role', 'group');
        cards.setAttribute('aria-labelledby', label.id);
        for (const option of tracks) {
            const card = element('button', 'tp-card');
            card.type = 'button';
            card.dataset.track = option.id;
            const img = element('img', 'tp-logo');
            img.src = new URL(option.icon, assets).href;
            img.alt = '';
            img.width = 70;
            img.height = 70;
            card.append(img, element('span', 'tp-card-name', english ? option.en : option.mn));
            if (option.id === track) {
                card.setAttribute('aria-current', 'true');
                const mark = element('span', 'tp-selected', '✓');
                mark.setAttribute('aria-hidden', 'true');
                card.append(mark);
            }
            card.addEventListener('click', () => onSelect?.(option.id));
            cards.append(card);
        }
        root.append(header, label, cards);
        container.replaceChildren(root);
        return root;
    }

    function open({track, lang, onSelect, onClose, trigger = document.activeElement} = {}) {
        if (activeDialog?.open) return activeDialog;
        const dialog = element('dialog', 'tp-dialog');
        let finished = false;
        function finish(picked) {
            if (finished) return;
            finished = true;
            if (dialog.open) dialog.close();
            dialog.remove();
            activeDialog = null;
            if (trigger?.isConnected) trigger.focus({preventScroll: true});
            if (picked) onSelect?.(picked);
            else onClose?.();
        }
        const root = render(dialog, {track, lang, onSelect: finish, onClose: () => finish()});
        dialog.setAttribute('aria-labelledby', root.getAttribute('aria-labelledby'));
        dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
        dialog.addEventListener('close', () => finish());
        dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) finish();
        });
        document.body.append(dialog);
        activeDialog = dialog;
        dialog.showModal();
        (dialog.querySelector('.tp-card[aria-current]') || dialog.querySelector('.tp-card')).focus();
        return dialog;
    }
    window.TrailPicker = {open};
})();
