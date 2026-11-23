const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const client = path.join(__dirname, 'dist/client');
const context = {window: {}};
for (const file of ['weekly-python.js', 'course-exam.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(client, file), 'utf8'), context);
}
const exam = context.window.CourseExam;
const plain = value => JSON.parse(JSON.stringify(value));
const solutions = {
    kite: [
        'def kite(wind, raining):',
        '    if raining or wind > 8: return "хураа"',
        '    if wind < 3: return "хүлээ"',
        '    return "нисгэ"'
    ].join('\n'),
    stones: [
        'def crossable(depths):',
        '    count = 0',
        '    for depth in depths:',
        '        if depth > 5: break',
        '        count += 1',
        '    return count'
    ].join('\n'),
    post: [
        'def postage(weight): return 4 + 2 * max(0, weight - 3)',
        'def mailbag(weights): return sum(postage(weight) for weight in weights)'
    ].join('\n')
};

test('the three-task exam preserves separate drafts and earned marks across reloads', () => {
    const empty = {selected: 'kite', records: {}};
    assert.deepEqual(plain(exam.readSave(null)), empty);
    assert.deepEqual(plain(exam.readSave({selected: '?', records: {other: {passed: true}}})), empty);
    const stored = {selected: 'stones', records: {
        kite: {code: solutions.kite, passed: true},
        stones: {code: 'x'.repeat(17000), passed: 'yes'},
        post: {code: '', passed: false}
    }};
    const restored = plain(exam.readSave(stored));
    assert.equal(restored.selected, 'stones');
    assert.equal(restored.records.kite.passed, true);
    assert.equal(restored.records.kite.code, solutions.kite);
    assert.equal(restored.records.stones.code.length, 16000);
    assert.equal(restored.records.stones.passed, false);
    assert.equal(restored.records.post.code, '');
});

test('actual CPython checks every exam solution and reports the failing input of plausible almost-solutions', async () => {
    const runtime = path.join(client, 'runtime');
    const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
    const py = await loadPyodide({indexURL: runtime + path.sep});
    const runner = fs.readFileSync(path.join(client, 'academy-runner.py'), 'utf8');
    async function assess(check, code) {
        py.globals.set('__request_json', JSON.stringify(exam.request(check, code)));
        return JSON.parse(await py.runPythonAsync(runner));
    }
    const wrong = {
        kite: solutions.kite.replace('wind > 8', 'wind >= 8'),
        stones: 'def crossable(depths): return sum(depth <= 5 for depth in depths)',
        post: solutions.post.replace('weight - 3', 'weight - 4')
    };
    for (const task of exam.tasks) {
        let mismatch = 0;
        for (const check of task.checks) {
            assert.equal((await assess(check, solutions[task.id])).ok, true, task.id + JSON.stringify(check));
            assert.equal((await assess(check, task.starter)).ok, false);
            const result = await assess(check, wrong[task.id]);
            if (!result.ok) {
                assert.equal(result.kind, 'test');
                assert.match(result.error, /Буцаасан утга/);
                ++mismatch;
            }
        }
        assert.ok(mismatch > 0 && mismatch < task.checks.length, task.id);
    }
    assert.equal((await assess(exam.tasks[2].checks[6], 'def postage(weight): return 4')).ok, false);
    assert.equal((await assess(exam.tasks[0].checks[0], 'def kite(:')).kind, 'code');
});
