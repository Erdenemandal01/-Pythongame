const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dist = path.join(__dirname, 'dist/client');
const runtime = path.join(dist, 'runtime');
const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
const battles = vm.runInNewContext(fs.readFileSync(path.join(dist, 'battle-rules.js'), 'utf8') + ';BATTLES');
const runner = fs.readFileSync(path.join(dist, 'battle-runner.py'), 'utf8');

async function test() {
    const python = await loadPyodide({indexURL: runtime + path.sep});
    async function run(battle, code) {
        python.globals.set('__request_json', JSON.stringify({battle, code}));
        return JSON.parse(await python.runPythonAsync(runner));
    }
    for (const battle of battles) {
        const win = await run(battle, battle.solution);
        assert.equal(win.kind, 'victory', battle.title + ': ' + win.error);
        assert.equal(win.enemyHP, 0);
        assert.ok(win.playerHP > 0 && win.turns <= battle.maxTurns);
        assert.ok(win.trace.every((frame, i) => frame.turn === i + 1 &&
            frame.intent === battle.patterns[i % battle.patterns.length]));
        assert.equal(win.trace.at(-1).nextIntent, null);
        assert.equal((await run(battle, 'print("Ялалт!")')).kind, 'incomplete');
        assert.equal((await run(battle, battle.starter)).ok, false, 'Starter should need edits');
        assert.equal((await run(battle, 'invalid_command()')).kind, 'code');
        if (battle.id > 0) assert.equal((await run(battle, 'for _ in range(40):\n    strike()')).kind, 'loss');
    }
    const wolf = await run(battles[1], 'guard()\nstrike()');
    assert.equal(wolf.trace[0].damageTaken, 0);
    assert.equal(wolf.trace[1].damageDealt, 5);
    const golem = await run(battles[2], 'strike()');
    assert.equal(golem.trace[0].damageDealt, 0);
    assert.equal(golem.trace[0].damageTaken, 1);
    const wraith = await run(battles[3], battles[3].solution);
    assert.ok(wraith.trace.some(frame => frame.healed > 0));
    const noPotion = await run(battles[3], 'heal()\nheal()\nheal()');
    assert.equal(noPotion.kind, 'code');
    assert.equal(noPotion.potions, 0);
    const timeout = await run(battles[1], 'for _ in range(20):\n    guard()');
    assert.equal(timeout.kind, 'loss');
    assert.equal(timeout.turns, battles[1].maxTurns);
    console.log('5/5 campaign solutions passed in the shipped Python runtime. Starter, loss, spell, shield, healing, error, and turn-limit cases passed.');
}
test().catch(error => { console.error(error); process.exitCode = 1; });
