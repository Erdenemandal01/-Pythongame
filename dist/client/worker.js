const runtimeURL = new URL('./runtime/', self.location.href).href;
let chars = 0;
function output(text) {
    chars += text.length + 1;
    if (chars > 20000) throw Error('Гаралт хэт урт байна.');
    postMessage({type: 'stdout', text});
}
async function boot() {
    importScripts(runtimeURL + 'pyodide.js');
    return loadPyodide({indexURL: runtimeURL, stdout: output, stderr: output});
}
const ready = boot();
ready.then(() => postMessage({type: 'ready'})).catch(error => {
    postMessage({type: 'fatal', error: 'Тоглоомын Python хөдөлгүүрийг эхлүүлэхэд алдаа гарлаа. ' + error.message});
});
let battleRunnerSource;
async function runEncounter(py) {
    if (!battleRunnerSource) {
        const response = await fetch(new URL('./battle-runner.py', self.location.href));
        if (!response.ok) throw Error('Тулааны дүрмийг ачаалж чадсангүй. Дахин ажиллуулна уу.');
        battleRunnerSource = await response.text();
    }
    return py.runPythonAsync(battleRunnerSource);
}
let academySource;
let levelSource;
const studioRunners={dragon:'dragon-runner.py',music:'music-runner.py',detective:'detective-runner.py',city:'city-runner.py',greenhouse:'greenhouse-runner.py'};
async function runStudio(py,mode){
    if(!Object.hasOwn(studioRunners,mode))throw Error('Танигдахгүй урлан байна.');
    const response=await fetch(new URL('./'+studioRunners[mode],self.location.href));
    if(!response.ok)throw Error('Урлангийн Python дүрмийг уншиж чадсангүй.');
    return JSON.parse(await py.runPythonAsync(await response.text()));
}
async function runLevel(py) {
    if (!levelSource) {
        const response = await fetch(new URL('./level-runner.py',self.location.href));
        if (!response.ok) throw Error('Түвшний дүрмийг ачаалж чадсангүй. Дахин оролдоорой.');
        levelSource = await response.text();
    }
    return JSON.parse(await py.runPythonAsync(levelSource));
}
async function runClassroom(py) {
    if (!academySource) {
        const response = await fetch(new URL('./academy-runner.py?v=8', self.location.href));
        if (!response.ok) throw Error('Хичээлийн шалгалтыг ачаалж чадсангүй.');
        academySource = await response.text();
    }
    const result = JSON.parse(await py.runPythonAsync(academySource));
    if (result.output) {
        const lines = result.output.replace(/\n$/, '').split('\n');
        for (const line of lines) postMessage({type:'stdout', text:line});
    }
    delete result.output;
    return result;
}
onmessage=async({data})=>{try{const py=await ready;chars=0;py.globals.set('__request_json',JSON.stringify(data));
if(data.studio){
    postMessage({type:'result',...await runStudio(py,data.studio.mode)});
    return;
}
if (data.level) {
    postMessage({type:'result',...await runLevel(py)});
    return;
}
if (data.academy) {
    postMessage({type:'result', ...await runClassroom(py)});
    return;
}
if (data.battle) {
    const result = await runEncounter(py);
    postMessage({type: 'result', ...JSON.parse(result)});
    return;
}
const result=await py.runPythonAsync(`
import ast, json, io, contextlib, traceback
def _run_quest(raw):
    req = json.loads(raw)
    trace = []
    game = req.get('game') or {'width': 12, 'start': 0, 'coins': [], 'holes': []}
    pos = game.get('start', 0)
    coins = list(game.get('coins', []))
    def act(kind):
        nonlocal pos
        if len(trace) >= 100:
            raise ValueError('100-аас олон тоглоомын команд байна.')
        if kind in ('move', 'jump'):
            dest = pos + (1 if kind == 'move' else 2)
            if dest >= game['width'] or dest in game.get('holes', []):
                raise ValueError('Зам тасарсан байна! Үсрэх эсвэл алхмын тоогоо шалгаарай.')
            pos = dest
        elif kind == 'collect':
            if pos not in coins:
                raise ValueError('Энэ нүдэнд зоос алга. Эхлээд зоосонд хүрээрэй.')
            coins.remove(pos)
        trace.append({'action': kind, 'pos': pos, 'coins': list(coins)})
    def no_input(*args):
        raise ValueError('input() дэмжихгүй. Хувьсагчид утгаа шууд бичээрэй.')
    g = {'__name__': '__main__', 'move': lambda: act('move'), 'jump': lambda: act('jump'), 'collect': lambda: act('collect'), 'can_move': lambda: pos+1 < game['width'] and pos+1 not in game.get('holes', []), 'input': no_input}
    try:
        tree = ast.parse(req['code'])
        exec(compile(tree, 'adventure.py', 'exec'), g)
    except Exception as e:
        return json.dumps({'ok': False, 'error': ''.join(traceback.format_exception_only(type(e), e)), 'trace': trace, 'kind': 'code'})
    def has(name): return any(type(n).__name__ == name for n in ast.walk(tree))
    def count(name): return sum(type(n).__name__ == name for n in ast.walk(tree))
    if req.get('check'):
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                exec(req['check'], {'g': g, 'tree': tree, 'ast': ast, 'has': has, 'count': count, 'contextlib': contextlib, 'io': io})
        except Exception as e:
            return json.dumps({'ok': False, 'error': str(e) or 'Функцийн шалгалт амжилтгүй.', 'trace': trace, 'kind': 'test'})
    if req.get('game') and (coins or pos != game['goal']):
        return json.dumps({'ok': False, 'error': 'Бүх зоосыг цуглуулаад тугтай нүдэнд хүрээрэй.', 'trace': trace, 'kind': 'test'})
    return json.dumps({'ok': True, 'trace': trace})
_run_quest(__request_json)
`);postMessage({type:'result',...JSON.parse(result)})}catch(e){postMessage({type:'result',ok:false,error:e.message,kind:'code',trace:[]})}};
