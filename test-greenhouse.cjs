const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const client = path.join(__dirname, 'dist/client');
const runtime = path.join(client, 'runtime');
const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
const runner = fs.readFileSync(path.join(client, 'greenhouse-runner.py'), 'utf8');

async function verify() {
    const py = await loadPyodide({indexURL: runtime + path.sep});
    async function run(code, moisture = [18, 30, 65]) {
        py.globals.set('__request_json', JSON.stringify({code, studio: {mode: 'greenhouse', payload: {moisture}}}));
        return JSON.parse(await py.runPythonAsync(runner));
    }
    const simple = await run('water(0)\nwater(1)');
    assert.ok(simple.ok && simple.won);
    assert.deepEqual(simple.frames.map(f => [f.line, f.pot, f.added, f.watered, f.remaining]),
        [[1, 0, [0], [0], 1], [2, 1, [1], [0, 1], 0]]);

    const loop = 'for i in range(len(moisture)):\n    if moisture[i] <= 30:\n        water(i)';
    for (const moisture of [[18, 30, 65], [29, 30, 31], [68, 11, 40, 30, 0], [66, 42, 99], [1, 1, 1]]) {
        const result = await run(loop, moisture);
        const expected = moisture.flatMap((value, i) => value <= 30 ? [i] : []);
        assert.ok(result.ok && result.won, JSON.stringify(result));
        assert.deepEqual(result.watered, expected);
        assert.deepEqual(result.frames.filter(f => f.line === 2).map(f => f.pot), moisture.map((_, i) => i));
        assert.deepEqual(result.frames.filter(f => f.line === 3).map(f => [f.variables.i, ...f.added]),
            expected.map(i => [i, i]));
    }

    const onlyLess = await run(loop.replace('<=', '<'));
    assert.ok(onlyLess.ok && !onlyLess.won);
    assert.deepEqual(onlyLess.watered, [0]);
    assert.equal(onlyLess.remaining, 1);
    assert.match(onlyLess.error, /2-р сав 30%/);
    const wrong = await run('water(2)');
    assert.ok(wrong.ok && !wrong.won);
    assert.match(wrong.error, /3-р сав 65%/);

    const helper = await run('def tend(i):\n    if moisture[i] <= 30:\n        water(i)\nfor i, value in enumerate(moisture):\n    tend(i)\nprint("соёоллоо")');
    assert.ok(helper.won);
    assert.equal(helper.output, 'соёоллоо\n');
    assert.deepEqual(helper.frames.filter(f => f.added.length).map(f => [f.line, f.pot]), [[3, 0], [3, 1]]);
    const byValue = await run('for i, value in enumerate(moisture):\n    if value <= 30:\n        water(i)');
    assert.deepEqual(byValue.frames.filter(f => f.line === 2).map(f => f.pot), [0, 1, 2]);
    assert.ok((await run('for count in range(3):\n    print(count)')).frames.every(f => f.pot === null));
    for (const [code, line] of [['water(True)', 1], ['water(-1)', 1], ['water(3)', 1],
        ['water(0)\nwater(0)', 2], ['water(0)\nwater(1)\nwater(2)', 3], ['if )', 1],
        ['water(0)\nprint(missing)', 2]]) {
        const result = await run(code);
        assert.equal(result.ok, false, code);
        assert.equal(result.won, false, code);
        assert.equal(result.errorLine, line, code);
    }
    const tooMany = await run('for i in range(1000):\n    x = i');
    assert.ok(!tooMany.ok && tooMany.frames.length === 400);
    assert.ok(!(await run('print("x" * 4100)')).ok);
    assert.ok(!(await run('water(0)', [40, true, 88])).ok);

    const modifiedInput = await run('moisture[1] = 88\nwater(0)');
    assert.ok(!modifiedInput.won);
    assert.match(modifiedInput.error, /2-р сав 30%/);
    console.log('Greenhouse passed: real Python, post-line water and variables, imported pots, 30% rule, step limits, invalid actions.');
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
