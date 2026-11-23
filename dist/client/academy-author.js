const AcademyAuthor = (() => {
    function py(value) {
        if (value === null) return 'None';
        if (typeof value === 'boolean') return value ? 'True' : 'False';
        if (Array.isArray(value)) return '[' + value.map(py).join(', ') + ']';
        if (typeof value === 'object') {
            return '{' + Object.entries(value).map(([k,v]) => py(k) + ': ' + py(v)).join(', ') + '}';
        }
        return JSON.stringify(value);
    }

    function task(title, signature, brief, body, cases, hint, initial = '    pass') {
        const name = signature.split('(')[0];
        const prefix = 'def ' + signature + ':\n';
        const demo = '\n\nprint(' + name + '(' + cases[0][0].map(py).join(', ') + '))';
        const check = [
            'fn = g.get(' + py(name) + ')',
            'assert callable(fn), ' + py(name + ' нэртэй функцээ тодорхойлоорой.'),
            'for args, wanted in ' + py(cases) + ':',
            '    actual = fn(*args)',
            '    assert actual == wanted, f"{args!r} оролтод {wanted!r} хүлээсэн. Таны функц {actual!r} буцаалаа."'
        ].join('\n');
        return {
            title, brief: brief + ' Эхний жишээний үр дүн: ' + py(cases[0][1]) + '.',
            starter: prefix + initial + demo, hint, solution: prefix + body + demo, check
        };
    }

    function lesson(title, intro, example, question, options, answer, why, lab, projects, debug, stretch, reflect, teacher) {
        return {title,intro,example,question,options,answer,why,lab,projects,debug,stretch,reflect,teacher};
    }

    return {task, lesson};
})();
