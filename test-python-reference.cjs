const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const client = path.join(__dirname, 'dist/client');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(client, 'python-reference-data.js'), 'utf8'), context);
const {topics, search} = context.window.PythonReferenceData;

const englishContext = {window: {GameLocale: {lang: 'en'}}};
for (const name of ['python-reference-en.js','python-reference-data.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(client, name), 'utf8'), englishContext);
}
const english = englishContext.window.PythonReferenceData;

test('English reference uses the same topic IDs and answers questions in English', () => {
    assert.deepEqual(Array.from(english.topics, t => t.id), Array.from(topics, t => t.id));
    for (const topic of english.topics) {
        assert.equal(english.search(topic.question)[0], topic, topic.question);
        for (const field of ['title','question','explanation','tryThis','code','expected']) {
            assert.doesNotMatch(topic[field], /[А-Яа-яӨөҮү]/);
        }
    }
    for (const [query,id] of Object.entries({
        'last number missing':'range', 'add an item to my list':'append',
        'length of my list':'len', 'loop never stops':'while',
        'invalid literal for int':'value', 'list index out of range':'index',
        'is in a list':'contains', 'in':'contains', 'my variable is not defined':'name'
    })) assert.equal(english.search(query)[0]?.id, id, query);
});

test('Mongolian questions, common case endings, keyboard variants and Python errors lead to relevant examples', () => {
    const queries = {
        'Яагаад 5 хэвлэгдэхгүй байна?': 'range',
        'Сүүлийн тоо яагаад гарахгүй байна': 'range',
        'yagaad 5 hevlegdehgui baina': 'range',
        'range-ийн төгсгөл': 'range',
        'Яг 30 дээр нөхцөл яагаад биелэхгүй байна?': 'compare',
        'Жагсаалтын уртыг яаж олох вэ?': 'len',
        'jagsaaltand nemeh': 'append',
        'Давталт ажиллаад дуусахгүй байна': 'while',
        'list index out of range': 'index',
        'NameError: name coins is not defined': 'name',
        'unexpected indent': 'indent',
        'invalid literal for int': 'value',
        'KeyError': 'dictionary',
        '>=': 'compare',
        '==': 'equal',
        '+=': 'variable',
        '//': 'division',
        '%': 'modulo'
    };
    for (const [query, expected] of Object.entries(queries)) {
        assert.equal(search(query)[0]?.id, expected, query);
    }
    assert.equal(search('  ').length, topics.length);
    for (const query of ['😃', 'zxqwerty', 'сансрын нисгэгч']) assert.equal(search(query).length, 0, query);
    assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length);
    for (const topic of topics) assert.equal(search(topic.question)[0], topic, topic.question);
});

test('every editable reference example prints its stated output using the game Python runtime', async () => {
    const runtime = path.join(client, 'runtime');
    const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
    const py = await loadPyodide({indexURL: runtime + path.sep});
    for (const topic of [...topics, ...english.topics]) {
        for (const field of ['question', 'title', 'explanation', 'code', 'tryThis', 'expected']) {
            assert.ok(topic[field]?.trim(), topic.id + ': ' + field);
        }
        py.globals.set('example_source', topic.code);
        const output = await py.runPythonAsync([
            'import contextlib, io',
            'buffer = io.StringIO()',
            'with contextlib.redirect_stdout(buffer):',
            '    exec(example_source, {})',
            'buffer.getvalue()'
        ].join('\n'));
        assert.equal(output, topic.expected + '\n', topic.id);
    }
});
