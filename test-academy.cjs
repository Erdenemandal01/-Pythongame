const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const dist = path.join(__dirname, 'dist/client');
const read = file => fs.readFileSync(path.join(dist,file),'utf8');
const {loadPyodide} = require(path.join(dist,'runtime/pyodide.js'));

async function verify() {
    const files=['academy-a.js','academy-author.js','academy-b.js','academy-c.js','academy-d.js','academy-e.js','academy.js'];
    const {course,chapters}=vm.runInNewContext(files.map(read).join('\n')+'; ({course:ACADEMY,chapters:ACADEMY_CHAPTERS})');
    assert.equal(course.length,66);
    assert.equal(new Set(course.map(l=>l.title)).size,course.length);
    assert.equal(chapters.reduce((sum,c)=>sum+c.count,0),course.length);
    for (const chapter of chapters) {
        assert.equal(chapter.timing.length,6);
        assert.ok(chapter.timing.every(([label,minutes]) => label && Number.isFinite(minutes) && minutes > 0));
        assert.equal(chapter.minutes,chapter.timing.reduce((sum,[,minutes]) => sum + minutes,0));
    }
    assert.equal(chapters.at(-1).first + chapters.at(-1).count,course.length);
    const py = await loadPyodide({indexURL:path.join(dist,'runtime')+path.sep});
    const runner = read('academy-runner.py');
    async function assess(code, check, extras={}) {
        py.globals.set('__request_json', JSON.stringify({code,academy:{check,...extras}}));
        return JSON.parse(await py.runPythonAsync(runner));
    }
    let tested=0;
    for (const lesson of course) {
        assert.equal(lesson.projects.length,2);
        assert.equal(lesson.options.length,3);
        assert.ok(Number.isInteger(lesson.answer)&&lesson.answer>=0&&lesson.answer<3);
        for(const field of ['intro','example','why','teacher','stretch','reflect']) assert.ok(lesson[field]?.trim(),field+' missing: '+lesson.title);
        if(lesson.capstone) {
            for(const [i,game] of lesson.capstone.games.entries()) {
                const code=game.withProject(lesson.projects[i].solution);
                for(const variant of [game.code,code]) {
                    const round=await assess(variant,'',{sandbox:true,stdin:game.stdin});
                    assert.ok(round.ok && round.output.trim(),lesson.title+': '+(round.error||'empty game'));
                }
            }
        }
        for (const task of [lesson.lab,...lesson.projects,lesson.debug]) {
            const label=lesson.title+' – '+task.title;
            const valid=await assess(task.solution, task.check);
            assert.ok(valid.ok,label+': '+valid.error);
            assert.equal((await assess('pass',task.check)).ok,false,label+' accepted empty work');
            if(task===lesson.debug)assert.equal((await assess(task.starter,task.check)).ok,false,label+' debug starter already solves it');
            tested++;
        }
    }
    const lamps=['Гүүр','Зах','Цэцэрлэг','Тайз','Булаг','Асар'];
    const lab=course[40].lab;
    const full=await assess(lab.solution,lab.check,{lanterns:lamps});
    assert.deepEqual(full.lanterns,[true,true,true,true,true,true]);
    const three=await assess('def light_street(names):\n    return [x + " аслаа" for x in names[:3]]',lab.check,{lanterns:lamps});
    assert.equal(three.ok,false);
    assert.deepEqual(three.lanterns,[true,true,true,false,false,false]);
    for(const [maker,code,preview] of [
        ['garden','for x in range(2):\n    tile(x, 2, "dragon")',[{x:0,y:2,kind:'dragon'},{x:1,y:2,kind:'dragon'}]],
        ['pixel','dot(11,7,"#ff8833")',[{x:11,y:7,color:'#ff8833'}]],
        ['bars','bar("Од",42)',[{label:'Од',value:42}]]
    ]) {
        const art=await assess(code,'',{sandbox:true,maker});
        assert.deepEqual(art.preview,preview);
    }
    assert.equal((await assess('dot(-1,3,"red")','',{sandbox:true,maker:'pixel'})).ok,false);
    assert.equal((await assess('bar("A",1000)','',{sandbox:true,maker:'bars'})).ok,false);
    const story=await assess('name=input("Нэр? ")\nn=int(input("Тоо? "))\nprint(name,n+1)','',{sandbox:true,stdin:'Од\n2'});
    assert.ok(story.ok);
    assert.equal(story.output,'Нэр? Од\nТоо? 2\nОд 3\n');
    assert.equal((await assess('input()','',{sandbox:true,stdin:''})).ok,false);
    console.log(tested+' solutions, '+course.length+' broken programs, 2 capstone paths, lanterns and 3 maker modes verified in bundled CPython.');
}
verify().catch(e=>{console.error(e);process.exitCode=1;});
