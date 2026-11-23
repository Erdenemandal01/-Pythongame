(() => {
    'use strict';
    const game = document.getElementById('pq-game-content');
    const assets = document.getElementById('pq-game-scripts');
    const gate = document.getElementById('pq-handheld');

    function transferLink() {
        const current = new URL(location.href);
        const file = current.protocol === 'file:';
        const link = new URL(file ? 'https://python-quest-mn-1120.sleek-lake-4148.chatgpt.site/' : current.origin + current.pathname);
        const lesson = Number(current.searchParams.get('lesson'));
        if (current.hash === '#academy' && Number.isInteger(lesson) && lesson >= 1 && lesson <= 66) {
            link.searchParams.set('lesson', String(lesson));
        }
        const views = ['map','quest','battle','practice','journal','awards','leaderboard','academy','maker','level','workshops','greenhouse','dragon','music','detective','city'];
        if (current.hash) link.hash = views.includes(current.hash.slice(1)) ? current.hash : 'map';
        return link.href;
    }

    function forComputer() {
        game.remove();
        assets.remove();
        document.body.classList.add('pq-handheld');
        gate.hidden = false;
        const field = gate.querySelector('input');
        const status = gate.querySelector('[role="status"]');
        field.value = transferLink();
        field.addEventListener('focus', () => field.select());
        gate.querySelector('button').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(field.value);
                status.textContent = 'Холбоос хуулагдлаа.';
                return;
            } catch {
                field.focus();
                field.select();
                field.setSelectionRange(0, field.value.length);
            }
            let copied = false;
            try { copied = document.execCommand('copy'); } catch {}
            status.textContent = copied ? 'Холбоос хуулагдлаа.' : 'Холбоосыг сонголоо. «Хуулах» командыг дараарай.';
        });
    }

    function startGame() {
        gate.remove();
        game.replaceWith(game.content);
        // Classic scripts keep their declared dependency order, including the
        // offline worker shim. Templates keep them inert on phones and tablets.
        for (const entry of assets.content.querySelectorAll('script[src]')) {
            const script = document.createElement('script');
            script.async = false;
            script.src = entry.getAttribute('src');
            document.body.append(script);
        }
        assets.remove();
    }

    async function start() {
        const client = navigator.userAgentData;
        const signal = {
            userAgent: navigator.userAgent, platform: client?.platform || navigator.platform,
            mobile: client?.mobile, touchPoints: navigator.maxTouchPoints
        };
        if (isClassroomHandheld(signal)) return forComputer();
        if (client?.getHighEntropyValues) {
            try {
                const extra = await client.getHighEntropyValues(['formFactors']);
                if (isClassroomHandheld({...signal, formFactors: extra.formFactors})) return forComputer();
            } catch {}
        }
        startGame();
    }
    start();
})();
