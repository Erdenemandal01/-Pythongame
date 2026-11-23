const fs=require('fs'),vm=require('vm'),path=require('node:path');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/client/curriculum.js','utf8')+';this.missions=MISSIONS',context);
const script=fs.readFileSync('dist/client/worker.js','utf8').split('runPythonAsync(`')[1].split('`);postMessage')[0].replace('_run_quest(__request_json)','');
const runner=script+`\nimport sys\nmissions=json.loads(sys.stdin.read())\nfor m in missions:\n    request={'code':m['solution'],'check':m['check'],'game':m.get('game')}\n    with contextlib.redirect_stdout(io.StringIO()) as output:\n        result=json.loads(_run_quest(json.dumps(request)))\n    assert result['ok'], (m['id'],result)\n    assert output.getvalue().strip()==m['expected'].strip(), (m['id'],output.getvalue())\n    request['code']='pass'\n    with contextlib.redirect_stdout(io.StringIO()) as output:\n        bad=json.loads(_run_quest(json.dumps(request)))\n    assert not bad['ok'] or output.getvalue().strip()!=m['expected'].strip(), ('empty accepted',m['id'])\nprint('PASS: all 30 solutions; all 30 empty submissions rejected')\n# A constant answer must not pass a reusable function mission.\nm=missions[25]\nr={'code':'def double(n):\\n    return 14\\nprint(double(7))','check':m['check']}\nwith contextlib.redirect_stdout(io.StringIO()):\n    result=json.loads(_run_quest(json.dumps(r)))\nassert not result['ok']\nprint('PASS: hard-coded function rejected')\n# Collision and missing coins cannot complete game missions.\nfor source in ['move()','jump()']:\n    r={'code':source,'check':'','game':missions[29]['game']}\n    result=json.loads(_run_quest(json.dumps(r)))\n    assert not result['ok']\nprint('PASS: collision and incomplete route rejected')\n`;
async function checkCampaign() {
    const runtime = path.join(__dirname, 'dist/client/runtime');
    const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
    const python = await loadPyodide({indexURL: runtime + path.sep});
    python.globals.set('mission_json', JSON.stringify(context.missions));
    await python.runPythonAsync('import sys, io\nsys.stdin = io.StringIO(mission_json)\n' + runner);
}
checkCampaign().catch(error => { console.error(error); process.exitCode = 1; });
