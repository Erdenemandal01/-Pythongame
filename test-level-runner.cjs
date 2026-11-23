const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

const dist = path.join(__dirname, 'dist/client');
const runtime = path.join(dist, 'runtime');
const {loadPyodide} = require(path.join(runtime, 'pyodide.js'));
const rows = ['S.E.C....', '...#.....', '....D....', '.........', '.........', '.........'];

async function verify() {
    const engine = fs.readFileSync(path.join(dist, 'level-runner.py'), 'utf8');
    const py = await loadPyodide({indexURL:runtime + path.sep});
    async function run(code, map=rows) {
        py.globals.set('__request_json', JSON.stringify({code,level:{rows:map}}));
        return JSON.parse(await py.runPythonAsync(engine));
    }
    const solution = [
        'count = 0', 'for i in range(4):', '    move("right")',
        '    if i == 1:', '        collect()', '        count = eggs()', 'print(count)',
    ].join('\n');
    const win = await run(solution);
    assert.ok(win.ok && win.won, JSON.stringify(win));
    assert.deepEqual(win.frames.filter(f=>f.line===3).map(f=>f.x), [1,2,3,4]);
    assert.deepEqual(win.frames.filter(f=>f.line===2).map(f=>f.locals.i), ['0','1','2','3','3']);
    assert.deepEqual(win.frames.find(f=>f.line===5).remaining, []);
    assert.equal(win.frames.find(f=>f.line===6).locals.count, '1');
    assert.equal(win.frames.at(-1).output, '1\n');
    assert.equal(win.output, '1\n');
    const condition = await run('before=ahead("right")\nmove("right")\nprint(before,ahead("right"),ahead("up"))');
    assert.equal(condition.output,'path egg edge\n');
    assert.equal(condition.ok,true);
    assert.equal(condition.won,false);
    const branch = await run('def step():\n    move("right")\n    if ahead("right")=="egg":\n        move("right")\n        collect()\nstep()\nprint(eggs())');
    assert.equal(branch.frames.find(f=>f.line===2).x,1);
    assert.equal(branch.frames.find(f=>f.line===6).held,1);
    assert.equal(branch.output,'1\n');
    const directions = await run('for way in ["right","right","right"]:\n    move(way)\nprint(ahead("down"),ahead("right"))\nmove("left")\nmove("down")\nmove("up")\nprint(ahead("up"))');
    assert.equal(directions.output,'rock cave\nedge\n');
    const asleep = ['SDEC.....', ...rows.slice(1)];
    const dragon = await run('move("right")',asleep);
    assert.equal(dragon.ok,false);
    assert.equal(dragon.errorLine,1);
    assert.equal(dragon.frames.at(-1).x,1);
    assert.match(dragon.error,/Луу сэрлээ/);
    for (const code of ['collect()', 'move("sky")', 'move("left")','move("up")', 'x=1/0', 'print(']) {
        const fault = await run(code);
        assert.equal(fault.ok,false,code);
        assert.equal(fault.won,false,code);
        assert.ok(fault.errorLine,code);
        assert.ok(fault.error,code);
    }
    const rock = await run('move("right")\nmove("right")\nmove("right")\nmove("down")');
    assert.deepEqual([rock.frames.at(-1).line,rock.frames.at(-1).x,rock.frames.at(-1).y],[4,3,0]);
    const nested = await run('def bad():\n    countdown = 1\n    a = 1 / 0\nbad()');
    assert.equal(nested.frames.at(-1).line,3);
    assert.equal(nested.frames.at(-1).locals.countdown,'1');
    const bounded = await run('step=0\nwhile True:\n    step+=1');
    assert.equal(bounded.ok,false);
    assert.ok(bounded.frames.length<=600);
    assert.match(bounded.error,/600/);
    assert.equal((await run('print("x"*4500)')).ok,false);
    assert.equal((await run('pass',['SE'])).ok,false);
    assert.equal((await run(solution)).won,true);

    // The page's Stop action terminates its isolated worker even while a C builtin runs.
    const worker = new Worker(`
        const {parentPort,workerData}=require('node:worker_threads');
        const {loadPyodide}=require(workerData.module);
        (async()=>{
            const py=await loadPyodide({indexURL:workerData.dir});
            py.globals.set('__request_json',workerData.request);
            parentPort.postMessage('running');
            await py.runPythonAsync(workerData.engine);
        })().catch(e=>{throw e});
    `,{eval:true,workerData:{module:path.join(runtime,'pyodide.js'),dir:runtime+path.sep,
        request:JSON.stringify({code:'sum(range(1000000000))',level:{rows}}),engine}});
    try {
        const state = await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);});
        assert.equal(state,'running');
    } finally {await worker.terminate();}
    console.log('Egg rescue: real CPython replay, goal, variables, conditions, nested calls, map rules, bounds, stop and subsequent runs passed.');
}

verify().catch(error=>{console.error(error);process.exitCode=1;});
