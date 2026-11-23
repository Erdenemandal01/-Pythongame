const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const client = path.join(__dirname, 'dist/client');
const runtime = path.join(client, 'runtime');
const runner = fs.readFileSync(path.join(client, 'robot-duel-runner.py'), 'utf8');
const env = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(client, 'robot-duel-rules.js'), 'utf8'), env);
const rules = env.window.RobotDuelRules;
const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));

async function testRobot() {
    const py = await loadPyodide({indexURL: runtime + path.sep});
    async function run(code, training = false) {
        const request = rules.request(code, training);
        py.globals.set('__request_json', JSON.stringify(request));
        const result = JSON.parse(await py.runPythonAsync(runner));
        for (const board of result.boards) {
            // The remote player's browser receives actions only. Its reconstructed
            // positions, remaining gems and sensor signals must match the Python run.
            const replay = JSON.parse(JSON.stringify(rules.replay(board, board.actions)));
            assert.deepEqual(replay, board.frames, board.title);
            assert.ok(board.actions.length <= rules.maxTurns);
        }
        return result;
    }

    const policy = [
        'def decide(on_gem, wall_ahead):',
        '    if on_gem:',
        '        return "collect"',
        '    if wall_ahead:',
        '        return "right"',
        '    return "move"'
    ].join('\n');
    const practice = await run(policy, true);
    assert.ok(practice.ok && practice.solved === 1 && practice.gems === 2);
    const match = await run(policy);
    assert.ok(match.ok && match.solved === 3 && match.gems === 9);
    assert.deepEqual(match.boards.map(board => board.totalGems), [2, 3, 4]);
    assert.equal(match.boards[0].frames.at(-2).onGem, true);
    assert.equal(match.boards[0].frames.at(-2).wallAhead, true);

    const stateful = await run('count = 0\n' + policy.replace('    if on_gem:',
        '    global count\n    if count == 0:\n        print("шинэ")\n    count += 1\n    if on_gem:'));
    assert.deepEqual(stateful.boards, match.boards);
    assert.equal(stateful.output, 'шинэ\n'.repeat(3));
    const starter = await run(rules.starter);
    assert.ok(starter.ok && !starter.solved);
    assert.ok(starter.boards.every(board => board.actions.length === 40));
    const partial = await run('def decide(g, w):\n    return "collect" if g else "move"');
    assert.ok(partial.ok && partial.solved === 1 && partial.gems === 4);
    for (const action of ['move','collect','right']) {
        const failed = await run('def decide(g, w): return "' + action + '"');
        assert.ok(failed.ok && failed.solved === 0);
        const first = failed.boards[0];
        assert.equal(first.actions.length, {move:5,collect:1,right:40}[action]);
    }
    for (const [code, line] of [
        ['def x(:',1], ['def decide(g, w):\nreturn "move"',2],
        ['def decide(g, w):\n    return "bad"',2],
        ['def decide(g, w):\n    raise ValueError("алдаа")',2],
        ['def decide(g, w):\n    while True:\n        pass',null],
        ['print("x" * 4200)',1], ['',null]
    ]) {
        const error = await run(code, true);
        assert.equal(error.ok, false);
        assert.ok(error.error);
        if (line !== null) assert.equal(error.errorLine, line, error.error);
    }
    assert.equal((await run(policy, true)).solved, 1);
    console.log('Robot duel passed training and three scored boards, real Python, shared action replays, partial scores, invalid code and bounded execution.');
}

testRobot().catch(error => { console.error(error); process.exitCode = 1; });
