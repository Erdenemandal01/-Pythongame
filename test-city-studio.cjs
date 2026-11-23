const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dist=path.join(__dirname,'dist/client');
const runtime=path.join(dist,'runtime');
const {loadPyodide}=require(path.join(runtime,'pyodide.js'));

async function test(){
    const environment={window:{}};
    vm.runInNewContext(fs.readFileSync(path.join(dist,'city-studio.js'),'utf8'),environment);
    const studio=environment.window.CityStudio;
    const defaults=studio.normalize(null);
    assert.deepEqual(Object.keys(defaults.drafts),['signal','bus','lamps']);
    assert.equal(studio.review(defaults).length,0);
    const py=await loadPyodide({indexURL:runtime+path.sep});
    const engine=fs.readFileSync(path.join(dist,'city-runner.py'),'utf8');
    const codes={
        signal:'def signal(tick):\n    return ["green","red","red","green"][tick%4]',
        bus:'def bus(signal,crossing,waiting):\n    if crossing and signal=="red":\n        return "wait"\n    if waiting:\n        return "board"\n    return "go"',
        lamps:'def lamps(hour):\n    return hour<7 or hour>=19',
    };
    async function run(code,role,combined={}){
        py.globals.set('__request_json',JSON.stringify({code,studio:{mode:'city',payload:{role,codes:combined}}}));
        return JSON.parse(await py.runPythonAsync(engine));
    }
    for(const role of Object.keys(codes)){
        assert.equal((await run(defaults.drafts[role].code,role)).passed,false);
        const response=await run(codes[role],role);
        assert(response.ok&&response.passed,JSON.stringify(response));
        assert.equal(response.frames.length,24);
    }
    const all=await run('','combined',codes);
    assert(all.ok && all.passed);
    assert.equal(all.checks.length,9);
    assert.equal(all.frames[0].hour,16);
    assert.equal(all.frames.at(-1).hour,15);
    assert(all.frames.some(f=>f.riders>1));
    assert(all.frames.some(f=>f.action==='wait'&&f.signal==='red'&&[3,9].includes(f.pos)));
    assert(all.frames.filter(f=>f.hour>=19||f.hour<7).every(f=>f.lamps));
    assert(all.frames.filter(f=>f.hour>=7&&f.hour<19).every(f=>!f.lamps));
    assert.equal((await run('','combined',{signal:codes.signal})).ok,false);
    assert.equal((await run('def signal(tick):\n    return 7','signal')).ok,false);
    assert.equal((await run('open("x")\ndef signal(tick): return "green"','signal')).ok,false);
    assert.equal((await run('def lamps(hour):\n    return 1/0','lamps')).ok,false);
    const altered={...codes,bus:'def bus(signal,crossing,waiting):\n    return "go"'};
    const blocked=await run('','combined',altered);
    assert(blocked.ok && !blocked.passed && blocked.frames.some(f=>f.action==='blocked'));
    const imported={role:'signal',format:'python-quest-city',version:1,team:'Улаан',code:codes.signal};
    const previous=studio.normalize({imports:{signal:imported,bus:imported},drafts:{bus:{code:'',team:'Б',proof:'old'}}});
    assert.equal(previous.imports.signal.team,'Улаан');
    assert.equal(previous.imports.bus,undefined);
    assert.equal(previous.drafts.bus.code,'');
    assert.equal(previous.drafts.bus.proof,null);
    assert.equal(studio.review(previous).length,2);
    console.log('Passed 3 student roles, 24 shared Python ticks, night lights, bus stops, red light, malformed and failing programs, import state and portfolio.');
}
test().catch(e=>{console.error(e);process.exitCode=1;});
