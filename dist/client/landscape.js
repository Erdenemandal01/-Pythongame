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
    const world = WORLDS[m.world];
    const english = GameLocale.lang === 'en';
    scene.dataset.world = m.world;
    document.getElementById('sceneLevel').textContent = document.getElementById('level').textContent;
    document.getElementById('sceneXP').textContent = xp() + ' XP';
    document.getElementById('sceneCoins').textContent = m.game
        ? (game.coins.length - remaining.length) + ' / ' + game.coins.length
        : (current % 6 + 1) + ' / 6';
    document.getElementById('sceneCoins').parentElement.title = m.game ? 'Цуглуулсан зоос' : 'Бүлгийн даалгавар';
    document.getElementById('sceneTitle').textContent = world.name;
    document.getElementById('sceneBadge').textContent =
        (english ? 'STAGE ' : 'ӨРТӨӨ ') + String(m.world + 1).padStart(2, '0');
    document.getElementById('sceneCaption').textContent = m.title;
    if (!frame) {
        scene.classList.remove('victory');
        const line = document.getElementById('sceneLine');
        line.parentElement.querySelector('b').textContent = english ? 'Temuulen' : 'Тэмүүлэн';
        line.textContent = world.stops[current % 6];
    }
}

function celebrateScene(m, output) {
    const scene = document.querySelector('.scene');
    if (!m.game) {
        const game = {width:8, start:m.id % 6, coins:[7], goal:7};
        drawBoard(game, {pos:game.start + 1, coins:game.coins, action:'move'});
    }
    const line = document.getElementById('sceneLine');
    const english = GameLocale.lang === 'en';
    line.parentElement.querySelector('b').textContent = output ? 'adventure.py' : (english ? 'Temuulen' : 'Тэмүүлэн');
    if (output) {
        line.textContent = output;
    } else {
        const nextWorld = WORLDS[m.world + 1];
        line.textContent = nextWorld
            ? (english ? 'Our next stop is ' + nextWorld.name + '.' : 'Дараагийн өртөө бол ' + nextWorld.name + '.')
            : (english ? 'The last letter has reached Kharakhorum. Well ridden!' : 'Сүүлчийн захиа Хархорумд ирлээ. Сайн явлаа, элч минь!');
    }
    document.getElementById('sceneXP').textContent = xp() + ' XP';
    document.getElementById('sceneLevel').textContent = 'LV. ' + (1 + Math.floor(xp() / 300));
    scene.classList.remove('victory');
    void scene.offsetWidth;
    scene.classList.add('victory');
}
