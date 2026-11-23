// Game positions are logical cells. The same coordinates drive the hero,
// pickups and obstacles so their locations agree with the Python runner.
function drawBoard(game, frame) {
    const board = document.getElementById('gameBoard');
    const scene = board.closest('.scene');
    const position = frame?.pos ?? game.start;
    const remaining = frame?.coins ?? game.coins;
    const left = cell => (cell + 0.5) * 100 / game.width;
    const sprite = (kind, cell, label) => {
        const element = document.createElement('span');
        element.className = 'sprite sprite-' + kind;
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', label);
        element.style.left = left(cell) + '%';
        return element;
    };
    let hero = board.querySelector('.sprite-hero');
    if (!hero || !frame) {
        hero = sprite('hero', position, 'Аялагч');
        board.replaceChildren(hero);
    }
    board.querySelectorAll(':scope > :not(.sprite-hero)').forEach(node => node.remove());
    for (const cell of game.holes || []) board.append(sprite('pit', cell, 'Ангал ' + cell));
    board.append(sprite('chest', game.goal, 'Эрдэнэсийн авдар ' + game.goal));
    for (const cell of remaining) board.append(sprite('coin', cell, 'Зоос ' + cell));
    hero.style.left = left(position) + '%';
    hero.setAttribute('aria-label', 'Аялагч ' + position + '-р нүдэнд');
    hero.classList.remove('jumping', 'walking', 'collecting');
    if (frame) {
        void hero.offsetWidth;
        hero.classList.add(({jump:'jumping',move:'walking',collect:'collecting'})[frame.action]);
    }
    const m = MISSIONS[current];
    scene.dataset.world = m.world;
    document.getElementById('sceneLevel').textContent = document.getElementById('level').textContent;
    document.getElementById('sceneXP').textContent = xp() + ' XP';
    document.getElementById('sceneCoins').textContent = m.game
        ? (game.coins.length - remaining.length) + ' / ' + game.coins.length
        : (current % 6 + 1) + ' / 6';
    document.getElementById('sceneCoins').parentElement.title = m.game ? 'Цуглуулсан зоос' : 'Бүлгийн даалгавар';
    document.getElementById('sceneTitle').textContent = WORLDS[m.world].name;
    document.getElementById('sceneBadge').textContent = m.game ? 'ЗООСОО ЦУГЛУУЛ' : 'ДААЛГАВАР ' + (current + 1);
    document.getElementById('sceneCaption').textContent = m.title;
    if (!frame) {
        const text = m.game ? 'Эрдэнэс рүү хүрэх замаа кодоор бич.' : m.info.split('. ')[0] + '.';
        document.getElementById('sceneLine').textContent = text;
    }
}

function celebrateScene(m, output) {
    const scene = document.querySelector('.scene');
    if (!m.game) {
        const game = {width:8, start:m.id % 6, coins:[7], goal:7};
        drawBoard(game, {pos:game.start + 1, coins:game.coins, action:'move'});
    }
    document.getElementById('sceneLine').textContent = output || 'Эрдэнэсээ оллоо!';
    document.getElementById('sceneXP').textContent = xp() + ' XP';
    document.getElementById('sceneLevel').textContent = 'LV. ' + (1 + Math.floor(xp() / 300));
    scene.classList.remove('victory');
    void scene.offsetWidth;
    scene.classList.add('victory');
}
