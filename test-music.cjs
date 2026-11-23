const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loadPyodide}=require('./dist/client/runtime/pyodide.js');
const dist=path.join(__dirname,'dist/client');

async function verify(){
    const py=await loadPyodide({indexURL:path.join(dist,'runtime')+path.sep});
    const runner=fs.readFileSync(path.join(dist,'music-runner.py'),'utf8');
    async function play(code,exercise='groove'){
        py.globals.set('__request_json',JSON.stringify({code,studio:{mode:'music',payload:{exercise}}}));
        return JSON.parse(await py.runPythonAsync(runner));
    }
    const beat=await play('for i in range(2):\n    for voice in ["kick","hat","snare","hat"]:\n        drum(voice)');
    assert(beat.ok && beat.solved);
    assert.equal(beat.ticks,32);
    assert.deepEqual(beat.events[2],{kind:'drum',value:'snare',start:8,ticks:4});
    const notes=await play('for n in ["C4","E4","G4","C5"]:\n    play(n)\nrest()','steps');
    assert(notes.ok && notes.solved);
    assert.equal(notes.events.at(-1).kind,'rest');
    const echo=await play('def echo():\n    play("G4")\n    play("E4")\n    rest()\necho()\necho()','echo');
    assert(echo.ok && echo.solved);
    const partial=await play('play("F#4",0.25)\ndrum("hat",0.5)\nrest(2)\nprint("Ая")');
    assert(partial.ok && !partial.solved);
    assert.equal(partial.output,'Ая\n');
    assert.deepEqual(partial.events.map(e=>e.start),[0,1,3]);assert.equal(partial.ticks,11);
    for(const failure of ['rest()','pass','play("J0")','drum("hat",0)','drum("tom")','play("C4", True)','for i in range(129):\n    drum("kick",0.25)','for i in range(33):\n    play("D5")']){
        const out=await play(failure);assert.equal(out.ok,false,failure);assert(out.error);
    }
    assert((await play('play("C4")')).ok);
    console.log('Music studio passed all three classroom scores, timing, notes, rests, invalid commands, score limits and recovery in shipped CPython.');
}
verify().catch(e=>{console.error(e);process.exitCode=1;});
