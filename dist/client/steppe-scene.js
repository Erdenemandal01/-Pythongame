window.SteppeScene = (() => {
    function show(container, lesson, stdout, stdin, language) {
        const stop = lesson.id.split('/')[1];
        const english = language === 'en';
        const output = stdout.trim();
        container.replaceChildren();
        const figure = document.createElement('figure');
        figure.className = 'relay-scene relay-' + stop;
        const actor = document.createElement('img');
        actor.src = 'art/hero-0.png';
        actor.alt = '';
        actor.className = 'relay-rider';
        const caption = document.createElement('figcaption');
        switch (stop) {
        case 'greeting':
            if (!lesson.check(output)) return;
            caption.textContent = english ? 'Your letter to Temuulen' : 'Тэмүүлэнд хүргэсэн чиний захиа';
            const letter = document.createElement('q');
            letter.textContent = output;
            caption.append(letter);
            break;
        case 'shagai':
            const values = output.split(/\s+/);
            if (values.length !== 2 || !values.every(v => /^[+-]?\d+$/.test(v)
                && Number.isSafeInteger(Number(v)) && Number(v) >= 0)) return;
            const [bags, loose] = values.map(Number);
            caption.textContent = english
                ? 'In the saddlebag: ' + bags + ' full. In your pocket: ' + loose + ' loose.'
                : 'Богцонд ' + bags + ' дүүрэн уут, халаасанд ' + loose + ' сул шагай.';
            break;
        case 'river':
            if (!/^\+?0*[12]$/.test(output)) return;
            const ford = Number(output) === 1;
            figure.classList.toggle('relay-bridge', !ford);
            const gauge = Number(stdin.trim());
            caption.textContent = english
                ? gauge + ' cm · ' + (ford ? 'Temuulen takes the ford.' : 'Temuulen takes the bridge.')
                : gauge + ' см · Тэмүүлэн ' + (ford ? 'гармаар гарлаа.' : 'гүүрээр гарлаа.');
            break;
        default:
            return;
        }
        figure.append(actor, caption);
        container.replaceChildren(figure);
    }
    return {show};
})();
