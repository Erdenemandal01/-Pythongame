const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const client = path.join(__dirname,'dist/client');
const target = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(client,'weekly-python.js'),'utf8'),target);
const weekly = target.window.WeeklyPython;
const clean = value => JSON.parse(JSON.stringify(value));
const epoch = Date.parse('2026-11-22T16:00:00Z');
const week = 7*86400000;
const solutions = {
    bag_count:'return (items + capacity - 1) // capacity',
    beacon:'return "ногоон" if light >= 70 else "шар" if light >= 30 else "улаан"',
    water_needed:'return sum(max(0, 5-v) for v in pots)',
    count_tracks:'return trail.count("*")',
    new_stamps:'return list(dict.fromkeys(stamps))',
    next_stop:'return stops[(index + 1) % len(stops)] if stops else ""',
    bead_total:'return sum(stock.get(key,0) for key in colors)',
    longest_glow:'best = now = 0\n    for light in signals:\n        now = now + 1 if light else 0\n        best = max(now,best)\n    return best'
};

test('Monday in Ulaanbaatar selects the common class task and keeps two independent drafts',()=>{
    assert.equal(weekly.current(new Date(epoch-1)).week,'2026-11-16');
    assert.equal(weekly.current(new Date(epoch)).week,'2026-11-23');
    assert.equal(weekly.current(new Date(epoch+week-1)).fn,'bag_count');
    const data={records:{
        '2026-11-16':{code:'old',completed:true},'2026-11-23':{code:'current',completed:false},
        '2026-11-30':{code:'future',completed:'yes'},'2026-11-09':{code:'expired'}
    }};
    const active=clean(weekly.readSave(data,new Date(epoch)));
    assert.deepEqual(Object.keys(active.records),['2026-11-16','2026-11-23']);
    assert.equal(active.records['2026-11-16'].code,'old');
    assert.equal(active.records['2026-11-23'].completed,false);
    data.records['2026-11-23'].code='x'.repeat(16200);
    const rotated=clean(weekly.readSave(data,new Date(epoch+week)));
    assert.equal(rotated.records['2026-11-23'].code.length,16000);
    assert.equal(rotated.records['2026-11-30'].completed,false);
    assert.deepEqual(clean(weekly.readSave(undefined,new Date(epoch))),{records:{}});
});

test('all eight weekly policies and their next cycle pass varied independent tests in the bundled Python runtime',async()=>{
    const runtime=path.join(client,'runtime');
    const {loadPyodide}=require(path.join(runtime,'pyodide.js'));
    const py=await loadPyodide({indexURL:runtime+path.sep});
    const runner=fs.readFileSync(path.join(client,'academy-runner.py'),'utf8');
    async function assess(req){
        py.globals.set('__request_json',JSON.stringify(req));
        return JSON.parse(await py.runPythonAsync(runner));
    }
    const seen=new Set();
    for(let index=0;index<16;index++){
        const c=weekly.current(new Date(epoch+index*week));seen.add(c.fn);
        const good='seen = []\ndef '+c.fn+'('+c.args+'):\n    assert not seen\n    seen.append(1)\n    '+solutions[c.fn];
        const hardcoded='def '+c.fn+'('+c.args+'):\n    return '+JSON.stringify(c.example[1]);
        let fails=0;
        for(let i=0;i<c.cases.length;i++){
            const result=await assess(weekly.caseRequest(c,good,i));
            assert.ok(result.ok,c.title+': '+JSON.stringify(result));
            if(!(await assess(weekly.caseRequest(c,hardcoded,i))).ok)fails++;
        }
        assert.ok(fails>0,'hardcoded worked example must not solve '+c.title);
    }
    assert.equal(seen.size,8);
    const c=weekly.current(new Date(epoch));
    const wrong=await assess(weekly.caseRequest(c,'def bag_count(items,capacity): return True',2));
    assert.equal(wrong.ok,false);assert.equal(wrong.kind,'test');
    assert.match(wrong.error,/True/);
    assert.equal((await assess(weekly.caseRequest(c,'def x(:',0))).kind,'code');
});
