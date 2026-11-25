const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const client = path.join(__dirname, '../dist/client');
const files = ['academy-a', 'academy-author', 'academy-b', 'academy-c', 'academy-d', 'academy-e', 'academy', 'academy-english'];
const source = files.map(name => fs.readFileSync(path.join(client, name + '.js'), 'utf8')).join('\n');
function load(language) {
    const context = vm.createContext({window: {}, language});
    return vm.runInContext(source +
        '; window.AcademyEnglish.apply(ACADEMY, ACADEMY_CHAPTERS, language); ({lessons: ACADEMY, chapters: ACADEMY_CHAPTERS})', context);
}
const tasks = lesson => [lesson.lab, ...lesson.projects, lesson.debug];

test('English course content and saved drafts stay usable across both language choices', async () => {
    const english = load('en');
    const mongolian = load('mn');
    assert.equal(english.lessons.length, 66);
    assert.equal(english.chapters.length, 14);
    assert.equal(english.chapters[0].timing[0][0], 'Predict');
    assert.equal(mongolian.chapters[0].timing[0][0], 'Таамаглах');
    const {loadPyodide} = require(path.join(client, 'runtime/pyodide.js'));
    const runtime = await loadPyodide({indexURL:path.join(client, 'runtime') + path.sep});
    const runner = fs.readFileSync(path.join(client, 'academy-runner.py'), 'utf8');
    const run = async (code, task, extras = {}) => {
        const academy = {check:task.check, checkAlternative:task.checkAlternative, checkHint: task.checkHint, ...extras};
        runtime.globals.set('__request_json', JSON.stringify({code, academy}));
        return JSON.parse(await runtime.runPythonAsync(runner));
    };
    for (const [index, lesson] of english.lessons.entries()) {
        const original = mongolian.lessons[index];
        const label = 'lesson ' + (index + 1);
        for (const name of ['title','intro','question','why','stretch','reflect']) {
            assert.ok(lesson[name] && lesson[name] !== original[name], label + ': ' + name);
        }
        assert.equal(lesson.answer, original.answer);
        assert.equal(lesson.options.length, original.options.length);
        const demo = await run(lesson.example, {}, {sandbox:true});
        assert.ok(demo.ok, label + ' example: ' + demo.error);
        for (const [slot, task] of tasks(lesson).entries()) {
            const mn = tasks(original)[slot];
            for (const name of ['title','brief','hint']) assert.notEqual(task[name], mn[name], label + ': ' + name);
            const valid = await run(task.solution, task);
            assert.ok(valid.ok, label + ' ' + task.title + ': ' + valid.error);
            assert.equal((await run('pass', task)).ok, false, label + ' accepted empty code');
            if (task.checkAlternative) {
                assert.equal(task.check, mn.checkAlternative);
                assert.equal(task.checkAlternative, mn.check);
                assert.ok((await run(mn.solution, task)).ok, label + ': old draft in English');
                assert.ok((await run(task.solution, mn)).ok, label + ': English draft in Mongolian');
            }
            if (slot === 3) assert.equal((await run(task.starter, task)).ok, false, label + ': broken starter passed');
        }
        for (const [slot, game] of (lesson.capstone?.games || []).entries()) {
            const project = lesson.projects[slot];
            const withPersonalText = game.withProject('# Миний тайлбар\n' + project.solution);
            assert.ok(withPersonalText.includes('# Миний тайлбар'));
            for (const code of [game.code, withPersonalText]) {
                const result = await run(code, {}, {sandbox:true, stdin:game.stdin});
                assert.ok(result.ok && result.output.includes('You win.'), label + ' playable game: ' + (result.error || result.output));
            }
            const mnGame = original.capstone.games[slot];
            const switched = await run(mnGame.withProject(project.solution), {}, {sandbox:true, stdin:mnGame.stdin});
            assert.ok(switched.ok && switched.output.includes('Та яллаа.'), label + ' English project in Mongolian game');
            const legacy = await run(game.withProject(original.projects[slot].solution), {}, {sandbox:true, stdin:game.stdin});
            assert.ok(legacy.ok && legacy.output.includes('You win.'), label + ' Mongolian project in English game');
        }
    }
    const lanterns = ['Bridge','Mill','Stage'];
    const lampTask = english.lessons[40].lab;
    assert.deepEqual((await run(lampTask.solution, lampTask, {lanterns})).lanterns, [true,true,true]);
});
