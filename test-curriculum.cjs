const fs=require('fs'),vm=require('vm'),path=require('node:path');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/client/curriculum.js','utf8')+';this.missions=MISSIONS',context);
const template=fs.readFileSync('dist/client/worker.js','utf8').split('runPythonAsync(`')[1].split('`);postMessage')[0].replace('_run_quest(__request_json)','');
const script=vm.runInNewContext('`'+template+'`');
const runner=script+`\nimport sys\nmissions=json.loads(sys.stdin.read())\nfor m in missions:\n    request={'code':m['solution'],'check':m['check'],'game':m.get('game'),'variants':m.get('variants'),'outputMode':m.get('outputMode')}\n    with contextlib.redirect_stdout(io.StringIO()) as output:\n        result=json.loads(_run_quest(json.dumps(request)))\n    assert result['ok'], (m['id'],result)\n    assert output.getvalue().strip()==m['expected'].strip(), (m['id'],output.getvalue())\n    request['code']='pass'\n    with contextlib.redirect_stdout(io.StringIO()) as output:\n        bad=json.loads(_run_quest(json.dumps(request)))\n    assert not bad['ok'] or output.getvalue().strip()!=m['expected'].strip(), ('empty accepted',m['id'])\nprint('PASS: all 30 solutions; all 30 empty submissions rejected')\n# A constant answer must not pass a reusable function mission.\nm=missions[25]\nr={'code':'def double(n):\\n    return 14\\nprint(double(7))','check':m['check']}\nwith contextlib.redirect_stdout(io.StringIO()):\n    result=json.loads(_run_quest(json.dumps(r)))\nassert not result['ok']\nprint('PASS: hard-coded function rejected')\n# Collision and missing coins cannot complete game missions.\nfor source in ['move()','jump()']:\n    r={'code':source,'check':'','game':missions[29]['game']}\n    result=json.loads(_run_quest(json.dumps(r)))\n    assert not result['ok']\nprint('PASS: collision and incomplete route rejected')\n`;
async function checkCampaign() {
    const runtime = path.join(__dirname, 'dist/client/runtime');
    const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
    const python = await loadPyodide({indexURL: runtime + path.sep});
    python.globals.set('mission_json', JSON.stringify(context.missions));
    await python.runPythonAsync('import sys, io\nsys.stdin = io.StringIO(mission_json)\n' + runner);
    const localized = vm.createContext({});
    const fromClient = file => fs.readFileSync(path.join(__dirname, 'dist/client', file), 'utf8');
    vm.runInContext(fromClient('curriculum.js'), localized);
    vm.runInContext(fromClient('adventure-english.js'), localized);
    const english = vm.runInContext('AdventureEnglish.localize(MISSIONS, WORLDS, true); MISSIONS', localized);
    python.globals.set('mission_json', JSON.stringify(english));
    await python.runPythonAsync('sys.stdin = io.StringIO(mission_json)\n' + runner);
    const assert = require('node:assert/strict');
    const englishMatches = vm.runInContext('missionOutputMatches',localized);
    english.forEach((mission,id) => {
        assert.ok(englishMatches(mission,context.missions[id].expected) || mission.game);
        assert.ok(!/[А-Яа-яӨөҮү]/u.test(mission.title + mission.task));
    });
    const matches = vm.runInContext('missionOutputMatches', context);
    async function grade(id, code, alternateExpected) {
        const mission = {...context.missions[id], alternateExpected};
        python.globals.set('request_json', JSON.stringify({code, check:mission.check, variants:mission.variants, outputMode:mission.outputMode}));
        const [ok, printed] = JSON.parse(await python.runPythonAsync(
            'with contextlib.redirect_stdout(io.StringIO()) as captured:\n' +
            '    passed = json.loads(_run_quest(request_json))["ok"]\n' +
            'json.dumps([passed, captured.getvalue()])'
        ));
        return ok && matches(mission, printed);
    }
    assert.ok(await grade(0, 'print("Сайн уу,Python!")'));
    assert.ok(await grade(0, 'message="Hola, mundo!"\nprint(message)'));
    assert.equal(await grade(0, 'print(" ")'), false);
    assert.equal(await grade(0, 'print(42)'), false);
    assert.equal(await grade(0, 'print(True)'), false);
    assert.equal(await grade(0, 'print("Hello")\nprint("world")'), false);
    assert.ok(await grade(1, 'print("Би   суралцаж байна.")\nprint("Би чадна")'));
    assert.equal(await grade(1, 'print("Би чадна!")\nprint("Би суралцаж байна")'), false);
    assert.ok(await grade(2, 'name = "Bold"\nprint(name)', 'Bold'));
    assert.ok(await grade(20, 'bag = ["Map", "Key"]\nbag.append("Apple")\nprint(len(bag))'));
    assert.ok(await grade(24, 'def greet():\n    print("Hello,traveler")\ngreet()', 'Hello, traveler!'));
    assert.equal(await grade(24, 'def greet():\n    print("Hello, thief!")\ngreet()', 'Hello, traveler!'), false);
    assert.equal(await grade(21, 'message="python quest"\nmessage.upper()\nprint("python quest")'), false);
    console.log('PASS: multilingual greetings, ordered phrases, cross-language drafts and exact tasks');

}
checkCampaign().catch(error => { console.error(error); process.exitCode = 1; });
