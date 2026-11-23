const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dist=path.join(__dirname,'dist/client');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(dist,'dragon-studio.js'),'utf8'),context);
const studio=context.window.DragonStudio;
const normal=studio.normalize();
const {loadPyodide}=require(path.join(dist,'runtime','pyodide.js'));
const runner=fs.readFileSync(path.join(dist,'dragon-runner.py'),'utf8');
const rows=['..##...D.','..S.E..#.','.#...#...','....E..C.','.D..##...','..#....#.'];
async function verify(){
    const py=await loadPyodide({indexURL:path.join(dist,'runtime')+path.sep});
    async function run(code,options={}) {
        const payload={map:{rows:options.rows||rows},case:{start:'start',energy:6,turns:36,...options.case}};
        py.globals.set('__request_json',JSON.stringify({code,studio:{mode:'dragon',payload}}));
        return JSON.parse(await py.runPythonAsync(runner));
    }
    for(const code of normal.codes)for(const c of [{},{energy:1},{start:'egg'},{energy:1,start:'egg'}]){
        const result=await run(code,{case:c});assert.ok(result.ok && result.won,JSON.stringify(result));
        assert.equal(result.frames.at(-1).delivered,2);
        assert.ok(result.frames.every(f=>f.energy>=0&&f.energy<=6&&!'#D'.includes(rows[f.y][f.x])));
        assert.ok(result.frames.slice(1).every((f,i)=>Math.abs(f.x-result.frames[i].x)+Math.abs(f.y-result.frames[i].y)<=1));
    }
    const conflict={case:{start:'egg',energy:1,turns:2}};
    const first=(await run(normal.codes[0],conflict)).frames;
    const second=(await run(normal.codes[1],conflict)).frames;
    assert.equal(first[1].action,'rest');assert.equal(first[1].energy,4);
    assert.equal(second[1].action,'take');assert.equal(second[1].energy,0);
    assert.equal(second[1].carrying,true);
    const custom=['SE#C.....','.........','...D.....','.........','.........','.........'];
    const detour=await run(normal.codes[0],{rows:custom});
    assert.ok(detour.won);assert.ok(detour.frames.some(p=>p.y===1));
    const blocked=await run(normal.codes[0],{rows:['S#E#C####',...Array(5).fill('#########')]});
    assert.equal(blocked.ok,false);assert.match(blocked.error,/зам алга/);
    for(const bad of ['pass','def decide(a,b,c):\n    return 17','def decide(x):\n    return "search"','def decide(a,b,c):\n    return 1/0','def decide():\n']) {
        const result=await run(bad);assert.equal(result.ok,false);assert.ok(result.error);
    }
    assert.equal((await run('def decide(a,b,c):\n    return "rest"')).won,false);
    assert.equal(studio.normalize({codes:['','x']}).codes[0],'');
    assert.equal(studio.normalize({custom:{energy:100}}).custom.energy,1);
    assert.equal(studio.review(normal).length,3);
    console.log('Dragon Studio: two real Python strategies, all four conditions, custom terrain and detour, turn/energy accounting, learner errors, migration and portfolio passed.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
