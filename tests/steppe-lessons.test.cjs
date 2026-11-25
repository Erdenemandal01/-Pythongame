const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/client/steppe-lessons.js'), 'utf8'), context);
for (const track of ['c', 'cpp']) {
    test(track + ' has the same three stops in both interface languages and accepts original greetings', () => {
        const mn = context.window.SteppeLessons.get(track, 'mn');
        const en = context.window.SteppeLessons.get(track, 'en');
        const ids = stops => Array.from(stops, stop => stop.id);
        assert.deepEqual(ids(mn), [track + '/greeting', track + '/shagai', track + '/river']);
        assert.deepEqual(ids(mn), ids(en));
        for (const [letter, bags, river] of [mn, en]) {
            assert(letter.check('Мэнд, Тэмүүлэн!\n'));
            assert(letter.check('Welcome to the camp.\n'));
            assert(!letter.check('...\n'));
            assert(bags.check(' 2\t1\n', '7'));
            assert(!bags.check('1 2', '7'));
            assert(bags.check('0 0', '0'));
            assert(river.check('1\n', '40'));
            assert(river.check('2\n', '41'));
            assert(!river.check('2\n', '40'));
        }
    });
}
