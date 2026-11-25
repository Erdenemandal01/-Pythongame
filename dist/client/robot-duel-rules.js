// The editor, Python runner and both players see the same starting boards.
(() => {
    'use strict';

    const training = {title: 'Дасгалын зам', rows: ['..G', '##G']};
    const boards = [
        {title: 'Талын жим', rows: ['.G..G']},
        {title: 'Говийн тохой', rows: ['...G', '###.', 'G.G.']},
        {title: 'Хавцлын тойруу', rows: ['..G..', '####G', 'G###.', '..G..']}
    ];
    const starter = [
        'def decide(on_gem, wall_ahead):',
        globalThis.GameLocale?.lang === 'en' ? '    # What should the robot do on a gem?' : '    # Эрдэнэс дээр ирвэл яах вэ?',
        '    if wall_ahead:',
        '        return "right"',
        '    return "move"'
    ].join('\n');
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const maxTurns = 40;

    function snapshot(board, x, y, dir, remaining, action) {
        const [dx, dy] = directions[dir];
        const next = board.rows[y + dy]?.[x + dx];
        return {x, y, dir, action, remaining, wallAhead: !next || next === '#',
            onGem: remaining.some(([gx, gy]) => gx === x && gy === y)};
    }

    function initialFrame(board) {
        const gems = [];
        board.rows.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                if (row[x] === 'G') gems.push([x, y]);
            }
        });
        return snapshot(board, 0, 0, 0, gems, null);
    }

    // Reconstruct a classmate's recorded actions without executing their Python.
    function replay(board, actions) {
        const frames = [initialFrame(board)];
        for (const action of actions.slice(0, maxTurns)) {
            let {x, y, dir, remaining, wallAhead, onGem} = frames[frames.length - 1];
            let failed = false;
            if (action === 'move') {
                if (wallAhead) failed = true;
                else {
                    x += directions[dir][0];
                    y += directions[dir][1];
                }
            } else if (action === 'right') {
                dir = (dir + 1) % 4;
            } else if (action === 'collect') {
                if (!onGem) failed = true;
                else remaining = remaining.filter(([gx, gy]) => gx !== x || gy !== y);
            } else break;
            frames.push(snapshot(board, x, y, dir, remaining, action));
            if (failed || !remaining.length) break;
        }
        return frames;
    }

    function request(code, practice) {
        return {code, studio: {mode: 'robot', payload: {boards: practice ? [training] : boards}}};
    }

    window.RobotDuelRules = {training, boards, starter, initialFrame, replay, request, maxTurns};
})();
