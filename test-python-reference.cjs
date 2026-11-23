const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const client = path.join(__dirname, 'dist/client');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(client, 'python-reference-data.js'), 'utf8'), context);
const {topics, search} = context.window.PythonReferenceData;

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
    for (const topic of topics) {
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
