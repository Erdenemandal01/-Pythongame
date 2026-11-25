/* Language is a device preference. Progress and drafts keep their existing keys. */
(() => {
    'use strict';
    const key = 'pq-interface-language';
    const languages = ['mn', 'en'];
    const query = new URL(location.href).searchParams.get('lang');
    let stored;
    try { stored = localStorage.getItem(key); } catch {}
    const lang = [query, stored].find(value => languages.includes(value)) || 'mn';
    if (languages.includes(query)) {
        try { localStorage.setItem(key, lang); } catch {}
    }
    document.documentElement.lang = lang;

    const handheld = {exact:{
        'Компьютер дээр тоглоорой':'Play on a computer','Кодын нүүдэл':'Code Nomad',
        'Python код бичих аяллаа зөөврийн эсвэл суурин компьютер дээр эхлүүлээрэй. Энэ холбоосыг компьютер руугаа илгээж болно.':'Learn Python on a laptop or desktop. Send this link to your computer to play.',
        'Тоглоомын холбоос':'Game link','Холбоос хуулах':'Copy link','Холбоос хуулагдлаа.':'Link copied.',
        'Холбоосыг сонголоо. «Хуулах» командыг дараарай.':'Link selected. Use Copy to copy it.'
    }};
    function text(source) {
        if (lang !== 'en' || typeof source !== 'string' || !/[А-Яа-яЁёӨөҮү]/u.test(source)) return source;
        const label = source.trim();
        for (const pack of [globalThis.PQEnglishInterface, globalThis.PQEnglishHome, globalThis.PQEnglishActivities, globalThis.PQEnglishWorkshops, handheld]) {
            if (!pack) continue;
            let result = Object.hasOwn(pack.exact, label) ? pack.exact[label] : undefined;
            if (result === undefined) {
                for (const [pattern, replacement] of pack.patterns || []) {
                    if (pattern.test(label)) { result = label.replace(pattern,replacement); break; }
                }
            }
            if (result !== undefined) return source.replace(label, () => result);
        }
        return source;
    }

    // Only authored interface text is translated. Never touch live editor layers,
    // student output, personal names, project titles or saved player content.
    const excluded = [
        'script','style','template','code','samp','pre','textarea','input','[contenteditable]',
        '[translate=no]','.quest-wordmark [lang]','.account-identity strong','.account-badge strong',
        '.lv-map-title','.dr-map-title','.dt-actual','.dt-expected','.account-identity h3','#certificate h2','#sceneLine','#profileBtn[data-personal-name]','.py-highlight',
        '#localProfiles option','.lb-name','.leaderboard-name','.ac-filename'
    ].join(',');
    const attributes = ['aria-label','placeholder','title','alt'];
    function localize(root) {
        if (lang !== 'en') return;
        if (root.nodeType === Node.TEXT_NODE) {
            if (root.parentElement?.closest(excluded)) return;
            const next = text(root.data);
            if (next !== root.data) root.data = next;
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
        if (root.nodeType === Node.ELEMENT_NODE) {
            if (root.closest('[translate=no]')) return;
            for (const attr of attributes) {
                if (!root.hasAttribute(attr)) continue;
                const value = root.getAttribute(attr), next = text(value);
                if (next !== value) root.setAttribute(attr,next);
            }
            if (root.matches(excluded)) return;
        }
        for (const child of root.childNodes) localize(child);
    }

    function localizeHelp() {
        const body = document.querySelector('#help .help-scroll');
        if (!body) return;
        body.innerHTML = `
            <p id="pq-help-intro" class="help-intro">Start with the first core lesson or pick a chapter in All lessons. Open the Python reference with F1 while writing code.</p>
            <div class="help-paths" role="group" aria-label="Choose where to start">
                <button type="button" data-help-go="academy"><strong>Open the lesson studio</strong><small>Choose a core lesson by number or topic</small></button>
                <button type="button" data-help-go="first"><strong>Try the first adventure mission</strong><small>Print a greeting of your own</small></button>
            </div>
            <section class="help-first"><h3>Write your first greeting</h3><ol>
                <li>Open the first adventure mission and find the <code>adventure.py</code> editor.</li>
                <li>Write a line like <code>print("Hi, Python!")</code>. The text inside the quotes is yours to choose.</li>
                <li>Select <strong>Run code</strong> and read your message in the terminal. Finishing a new mission earns XP.</li>
            </ol></section>
            <div class="help-more"><details><summary>What if my code gets stuck?</summary><p>Read the error and check your quotes and indentation. For a calculation, check the numbers and the order of the output. Select Get a hint to see one clue at a time. Stop ends a running program.</p></details>
            <details><summary>Where can I practice?</summary><p>Open Optional practice in the side menu for adventures, battles and workshops. In the playground you can run your own Python ideas.</p><button type="button" data-help-go="greenhouse">Try my greenhouse</button></details>
            <details><summary>Can I play offline?</summary><p>${globalThis.PQ_CLASSROOM_KIT ? 'This edition includes the Python runtime and works offline.' : 'Download the <a href="python-quest-classroom.zip" download>offline game</a>, extract the folder and open <code>index.html</code> on your computer.'}</p></details>
            <details><summary>How do I keep my work?</summary><p>Guest progress stays in this browser. Sign in to continue on another computer or export your progress from your profile.</p></details></div>`;
    }

    function start() {
        if (lang === 'en') {
            document.title = 'Code Nomad — Learn Python';
            const description = document.querySelector('meta[name=description]');
            if (description) description.content = 'Learn Python at your own pace with hands-on lessons, games and projects.';
            const content = document.getElementById('pq-game-content')?.content;
            if (content) localize(content);
            localizeHelp();
            localize(document.body);
            // The legacy game builds its screens on demand. Translate new interface
            // nodes when they are mounted, without replacing controls or event handlers.
            const observer = new MutationObserver(changes => {
                for (const change of changes) {
                    if (change.type === 'childList') {
                        if (change.target.nodeType === 1 && change.target.closest(excluded)) continue;
                        for (const child of change.addedNodes) localize(child);
                    } else if (change.type === 'attributes') {
                        const node = change.target;
                        if (node.closest('[translate=no]')) continue;
                        const attr = change.attributeName, value = node.getAttribute(attr);
                        const next = text(value);
                        if (value !== null && next !== value) node.setAttribute(attr,next);
                    } else localize(change.target);
                }
            });
            observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
        }
        for (const root of [document, document.getElementById('pq-game-content')?.content]) {
            for (const select of root?.querySelectorAll('[data-game-language]') || []) select.value = lang;
        }
        document.addEventListener('change', async event => {
            const select = event.target;
            if (!select.matches('[data-game-language]') || !languages.includes(select.value)) return;
            const next = select.value;
            if (next === lang) return;
            select.disabled = true;
            try {
                if (globalThis.prepareGameLanguageChange && !(await globalThis.prepareGameLanguageChange())) return;
                const url = new URL(location.href);
                url.searchParams.set('lang',next);
                location.replace(url.href);
            } finally {
                select.value = lang;
                select.disabled = false;
            }
        });
    }
    globalThis.GameLocale = {lang, text, start};
})();
