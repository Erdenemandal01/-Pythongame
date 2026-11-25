const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dist = path.join(__dirname, 'dist/client');
const runtime = path.join(dist, 'runtime');
const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
const battles = vm.runInNewContext(fs.readFileSync(path.join(dist, 'battle-rules.js'), 'utf8') + ';BATTLES');
const runner = fs.readFileSync(path.join(dist, 'battle-runner.py'), 'utf8');

function checkTelegraphs(battle, trace) {
    let phase = 1;
    let step = 0;
    for (const [index, frame] of trace.entries()) {
        const pattern = phase === 1 ? battle.patterns : battle.secondPhase.patterns;
        assert.equal(frame.turn, index + 1);
        assert.equal(frame.phase, phase);
        assert.equal(frame.intent, pattern[step % pattern.length]);
        const finished = frame.enemyHP === 0 || frame.playerHP === 0 || frame.turn === battle.maxTurns;
        if (finished) {
            assert.equal(frame.nextIntent, null);
            assert.equal(frame.nextPhase, null);
            assert.equal(index, trace.length - 1);
            continue;
        }
        if (phase === 1 && battle.secondPhase && frame.enemyHP <= battle.secondPhase.atHP) {
            phase = 2;
            step = 0;
        } else {
            step++;
        }
        const upcomingPattern = phase === 1 ? battle.patterns : battle.secondPhase.patterns;
        assert.equal(frame.nextIntent, upcomingPattern[step % upcomingPattern.length]);
        assert.equal(frame.nextPhase, phase);
    }
}

async function test() {
    const python = await loadPyodide({indexURL: runtime + path.sep});
    async function run(battle, code) {
        python.globals.set('__request_json', JSON.stringify({battle, code}));
        return JSON.parse(await python.runPythonAsync(runner));
    }
    const victories = [];
    const previousHealth = [6, 15, 19, 27, 40];
    for (const battle of battles) {
        assert.ok(battle.hp > previousHealth[battle.id], battle.enemy + ' should have more HP than in the previous campaign');
        const win = await run(battle, battle.solution);
        assert.equal(win.kind, 'victory', battle.title + ': ' + win.error);
        assert.equal(win.enemyHP, 0);
        assert.ok(win.playerHP > 0 && win.turns <= battle.maxTurns);
        checkTelegraphs(battle, win.trace);
        victories.push(win);
        assert.equal((await run(battle, 'print("Ялалт!")')).kind, 'incomplete');
        assert.equal((await run(battle, battle.starter)).ok, false, 'Starter should need edits');
        assert.equal((await run(battle, 'invalid_command()')).kind, 'code');
        if (battle.id > 0) assert.equal((await run(battle, 'for _ in range(40):\n    strike()')).kind, 'loss');
    }
    const [guardian, almas, giant, witch, mangas] = victories;
    const formerOpening = await run(battles[0], 'strike()\nstrike()');
    assert.equal(formerOpening.kind, 'incomplete');
    assert.equal(formerOpening.enemyHP, battles[0].hp - 6);
    assert.equal(guardian.turns, 3);
    assert.deepEqual(guardian.trace.map(frame => frame.action), ['strike', 'strike', 'strike']);
    const loopOpening = await run(battles[0], 'for _ in range(3):\n    strike()');
    assert.equal(loopOpening.kind, 'victory');
    for (let id = 1; id < battles.length; id++) {
        assert.ok(victories[id].turns > victories[id - 1].turns, 'Each new encounter should allow a longer tactical progression');
        const previous = await run(battles[id], battles[id - 1].solution);
        assert.ok(['loss', 'incomplete'].includes(previous.kind), 'The prior tactic should need revision for ' + battles[id].enemy);
    }
    assert.ok(almas.trace.filter(frame => frame.action === 'guard' && frame.focus).length >= 2);
    assert.ok(giant.trace.some(frame => frame.intent === 'shield' && frame.action !== 'strike'));
    assert.ok(witch.trace.some(frame => frame.action === 'guard' && frame.focus));
    assert.ok(witch.trace.some(frame => frame.healed > 0));
    assert.ok(mangas.trace.some(frame => frame.phase === 2));
    assert.deepEqual(await run(battles[4], battles[4].solution), mangas, 'A replay must restart phase one');

    // Cross the threshold exactly on a hit. It still lands, then sense() and the
    // replay must both announce the first charge of the new phase.
    const boundary = {...battles[4], hp:9, playerHP:8, hitDamage:2, maxTurns:5,
        patterns:['hit','hit'], secondPhase:{atHP:6, patterns:['charge','rest']}};
    const boundaryWin = await run(boundary, [
        'assert sense() == "hit"', 'strike()', 'assert health() == 6 and enemy_health() == 6',
        'assert sense() == sense() == "charge"', 'guard()', 'assert sense() == "rest"',
        'strike()', 'assert sense() == "charge"', 'strike()'
    ].join('\n'));
    assert.equal(boundaryWin.kind, 'victory', boundaryWin.error);
    checkTelegraphs(boundary, boundaryWin.trace);
    const terminalCrossing = await run({...boundary, maxTurns:1}, 'strike()');
    assert.equal(terminalCrossing.kind, 'loss');
    checkTelegraphs({...boundary, maxTurns:1}, terminalCrossing.trace);
    const wolf = await run(battles[1], 'guard()\nstrike()');
    assert.equal(wolf.trace[0].damageTaken, 0);
    assert.equal(wolf.trace[1].damageDealt, 5);
    const golem = await run(battles[2], 'strike()');
    assert.equal(golem.trace[0].damageDealt, 0);
    assert.equal(golem.trace[0].damageTaken, 1);
    const noPotion = await run({...battles[3], patterns:['rest']}, 'heal()\n'.repeat(battles[3].potions + 1));
    assert.equal(noPotion.kind, 'code');
    assert.equal(noPotion.potions, 0);
    const timeout = await run(battles[1], 'for _ in range(20):\n    guard()');
    assert.equal(timeout.kind, 'loss');
    assert.equal(timeout.turns, battles[1].maxTurns);
    console.log('5/5 solutions passed in CPython; winning turns ' + victories.map(win => win.turns).join(' / ') +
        '. Escalation, turn previews, phase boundary, healing, replay and turn limits passed.');
}
test().catch(error => { console.error(error); process.exitCode = 1; });
