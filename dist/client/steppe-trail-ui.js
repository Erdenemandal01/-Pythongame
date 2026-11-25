(() => {
  'use strict';
  const copy = {
    skip: ['Хичээл рүү очих', 'Skip to the lesson'],
    brand: ['Кодын нүүдэл', 'Code Nomad'],
    catalog: ['Бүх хичээл', 'All lessons'],
    trail: ['Орхоны өртөө', 'The Orkhon relay'],
    intro: ['Тэмүүлэнтэй хамт өртөөнөөс морд. Аян замын гурван шийдвэрийг өөрийн бичсэн кодоор гаргаарай.', 'Set out from the relay with Temuulen. Write the code for three decisions along the trail.'],
    track: ['Сурах хэл', 'Learning track'],
    stops: ['Замын өртөөнүүд', 'Trail stops'],
    saved: ['Хэл бүрийн ноорог, ахиц энэ хөтөч дээр хадгалагдана.', 'Drafts and progress for each track are saved in this browser.'],
    temporary: ['Энэ хөтөч хадгалах боломжгүй байна. Кодоо татаж аваарай.', 'Browser storage is unavailable. Download your source to keep a copy.'],
    completed: ['дууссан', 'completed'],
    predict: ['Эхлээд таамаглая', 'Make a prediction'],
    right: ['Зөв!', 'Correct!'],
    retry: ['Дахиад бодоод сонгоорой.', 'Try another answer.'],
    yourCode: ['Кодоо бичих', 'Write your code'],
    hint: ['Сэжүүр харах', 'Show a hint'],
    download: ['Код татах', 'Download source'],
    stdin: ['Турших оролт', 'Try an input'],
    practice: ['Туршиж ажиллуулах', 'Try a run'],
    run: ['Даалгавраа шалгуулах', 'Check my solution'],
    stop: ['Зогсоох', 'Stop'],
    downloadNote: ['Эхний удаа хөрвүүлэгч татахад интернэт хэрэгтэй. Код энэ хөтөч дотор хөрвүүлэгдэнэ.', 'The first run needs an internet connection to download the compiler. Your code compiles in this browser.'],
    loading: ['Хөрвүүлэгч бэлдэж байна…', 'Preparing the compiler…'],
    compiling: ['Кодыг хөрвүүлж байна…', 'Compiling your code…'],
    running: ['Жишээ оролтуудаар ажиллуулж байна…', 'Running the test inputs…'],
    trying: ['Таны кодыг ажиллуулж байна…', 'Running your program…'],
    tried: ['Туршилт дууслаа.', 'Practice run complete.'],
    submitToFinish: ['Өртөөг дуусгахын тулд «Даалгавраа шалгуулах»-ыг сонгоорой.', 'Choose “Check my solution” to finish this stop.'],
    output: ['Таны кодын гаралт', 'Your program printed'],
    checkedOutput: ['Шалгалтын гаралт', 'Test output'],
    empty: ['(Хоосон гаралт)', '(No output)'],
    compile: ['Хөрвүүлэгч алдаа оллоо. Заасан мөр болон сэжүүрийг хараарай.', 'The compiler found an error. Check the indicated line and the lesson hint.'],
    runtime: ['Програм ажиллахдаа зогслоо.', 'The program stopped while running.'],
    invalidInput: ['0-ээс 999 хүртэл нэг бүхэл тоо оруулаарай.', 'Enter one whole number from 0 to 999.'],
    timeout: ['Хугацаа дууслаа. Давталт, оролт унших хэсгээ шалгаарай.', 'Time limit reached. Check your loops and input reads.'],
    cancelled: ['Ажиллуулахыг зогсоолоо.', 'Run stopped.'],
    unavailable: ['Хөрвүүлэгч ачаалагдсангүй. Холболтоо шалгаад дахин турших эсвэл кодоо татаж компьютер дээрээ ажиллуулаарай.', 'The compiler is unavailable. Check your connection and try again, or download the source and run it on your computer.'],
    diagnostics: ['Хөрвүүлэгчийн мэдэгдэл', 'Compiler message'],
    testFailed: ['Зарим оролтод үр дүн зөрлөө. Кодоо засаад дахин туршаарай.', 'A test gave a different result. Edit your code and try again.'],
    testCase: ['Зөрсөн жишээ', 'Test that differed'],
    given: ['Оролт', 'Input'],
    want: ['Хүлээсэн', 'Expected'],
    got: ['Таны гаралт', 'Your output'],
    none: ['байхгүй', 'none'],
    success: ['Өртөөний даалгаврыг биелүүллээ.', 'This stop is complete.'],
    next: ['Дараагийн өртөө →', 'Next stop →'],
    return: ['Бүх хичээл рүү буцах →', 'Back to all lessons →']
  };

  const $ = id => document.getElementById(id);
  const params = new URL(location.href).searchParams;
  let storageWorks = true;
  function read(key) {
    try { return localStorage.getItem(key); }
    catch { storageWorks = false; return null; }
  }
  function write(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      storageWorks = false;
      $('save-note').textContent = t('temporary');
    }
  }
  let lang = params.get('lang') || read('pq-interface-language');
  if (lang !== 'en') lang = 'mn';
  let track = params.get('track') === 'cpp' ? 'cpp' : 'c';
  const t = key => copy[key][lang === 'en' ? 1 : 0];
  function activePortfolio() {
    try {
      const portfolio = JSON.parse(read('pythonQuestFullMN_v1'))?.academy?.portfolioId;
      if (typeof portfolio === 'string' && /^[0-9a-f-]{24,40}$/i.test(portfolio)) return portfolio;
    } catch {}
    return 'guest';
  }
  const prefix = 'pq-steppe-trail-v1.' + activePortfolio() + '.';
  const draftCache = new Map();
  const completed = new Set();
  let lessons, lesson, generation = 0, busy = false;

  function draftKey() { return prefix + lesson.id + '.code'; }
  function stopKey() { return prefix + track + '.last'; }
  function isDone(id) {
    return completed.has(id) || read(prefix + id + '.done') === '1';
  }
  function syncURL() {
    const url = new URL(location.href);
    url.searchParams.set('track', track);
    url.searchParams.set('lang', lang);
    url.searchParams.set('stop', lesson.id.split('/').pop());
    try { history.replaceState(null, '', url); } catch {}
    $('home').href = './index.html?lang=' + lang + '#home';
    $('catalog').href = './index.html?lang=' + lang + '#courses';
  }
  function updateRoute() {
    const count = lessons.filter(item => isDone(item.id)).length;
    $('count').textContent = count + ' / ' + lessons.length;
    $('count').setAttribute('aria-label', count + ' / ' + lessons.length + ' ' + t('completed'));
    $('stops').setAttribute('aria-label', t('stops'));
    $('stops').replaceChildren();
    lessons.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      if (item.id === lesson.id) button.setAttribute('aria-current', 'step');
      const mark = document.createElement('span');
      const done = isDone(item.id);
      mark.className = done ? 'stop-mark done' : 'stop-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = done ? '✓' : String(index + 1);
      button.append(mark, document.createTextNode(item.title));
      if (done) button.setAttribute('aria-label', item.title + ' · ' + t('completed'));
      button.addEventListener('click', () => selectLesson(item.id, true));
      $('stops').append(button);
    });
    $('save-note').textContent = t(storageWorks ? 'saved' : 'temporary');
  }
  function paintCode() {
    const pre = $('highlight');
    const layer = pre.firstElementChild;
    const code = $('code').value;
    const tokens = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|(^[ \t]*#[^\n]*)|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(\b(?:int|char|return|if|else|using|namespace|const|unsigned|void|long)\b)|(\b\d+\b)|(\b(?:main|printf|scanf|puts|std|cout|cin|endl)\b)/gm;
    const colors = ['comment', 'preamble', 'string', 'key', 'number', 'name'];
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of code.matchAll(tokens)) {
      fragment.append(code.slice(cursor, match.index));
      const span = document.createElement('span');
      span.className = 'tk-' + colors[match.slice(1, 7).findIndex(part => part !== undefined)];
      span.textContent = match[0];
      fragment.append(span);
      cursor = match.index + match[0].length;
    }
    fragment.append(code.slice(cursor) + '\n');
    layer.replaceChildren(fragment);
    pre.scrollTop = $('code').scrollTop;
    pre.scrollLeft = $('code').scrollLeft;
  }
  function renderChoices() {
    const prediction = lesson.prediction;
    $('question').textContent = prediction.question;
    $('choices').replaceChildren();
    $('prediction-feedback').hidden = true;
    for (const [index, option] of prediction.options.entries()) {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'prediction';
      radio.addEventListener('change', () => {
        const right = index === prediction.correct;
        const note = $('prediction-feedback');
        note.textContent = right ? t('right') + ' ' + prediction.explanation : t('retry');
        note.classList.toggle('correct', right);
        note.hidden = false;
      });
      label.append(radio, document.createTextNode(option));
      $('choices').append(label);
    }
  }
  function setBusy(value) {
    busy = value;
    $('code').readOnly = value;
    $('stdin').readOnly = value;
    $('try-code').disabled = value;
    $('run').disabled = value;
    $('stop').hidden = !value;
  }
  function cancel() {
    if (!busy) return;
    generation++;
    window.SteppeCompiler?.cancel();
    setBusy(false);
    showResult('cancelled');
  }
  function hideResult() {
    $('result').hidden = true;
    $('scene').replaceChildren();
  }
  function selectLesson(id, focus = false) {
    cancel();
    lesson = lessons.find(item => item.id === id) || lessons[0];
    write(stopKey(), lesson.id);
    syncURL();
    updateRoute();
    $('concept').textContent = (track === 'cpp' ? 'C++17' : 'C17') + ' · ' + lesson.concept;
    for (const field of ['title','story','task','hint']) $(field).textContent = lesson[field];
    $('hint-wrap').open = false;
    $('filename').textContent = lesson.id.split('/').pop() + (track === 'cpp' ? '.cpp' : '.c');
    const key = draftKey();
    $('code').value = draftCache.get(key) ?? read(key) ?? lesson.starter;
    $('code').scrollTop = $('code').scrollLeft = 0;
    paintCode();
    $('input-wrap').hidden = lesson.sampleInput === '';
    $('stdin').value = lesson.sampleInput.trim();
    hideResult();
    renderChoices();
    if (focus) $('mission').focus();
  }
  function render(id) {
    document.documentElement.lang = lang;
    document.title = t('trail') + ' — ' + t('brand');
    document.querySelectorAll('[data-copy]').forEach(node => { node.textContent = t(node.dataset.copy); });
    $('locale').value = lang;
    $('track-name').textContent = track === 'cpp' ? 'C++17' : 'C17';
    lessons = window.SteppeLessons.get(track,lang);
    selectLesson(id || read(stopKey()));
  }
  function showResult(status) {
    $('scene').replaceChildren();
    $('result').hidden = false;
    $('result').dataset.kind = status;
    $('run-status').textContent = t(status);
    for (const id of ['sample-output', 'diagnostic', 'outcome', 'next']) $(id).hidden = true;
  }
  function details(title, content) {
    $('detail-title').textContent = title;
    $('details').textContent = content;
    $('diagnostic').hidden = false;
  }
  function displayOutput(title, output) {
    $('output-title').textContent = title;
    $('stdout').textContent = output || t('empty');
    $('sample-output').hidden = false;
  }
  async function run(practice) {
    if (busy) return;
    if (practice && !$('input-wrap').hidden && !$('stdin').validity.valid) {
      showResult('invalidInput');
      $('stdin').focus();
      return;
    }
    const active = ++generation;
    const cases = lesson.cases;
    const inputs = practice
      ? [lesson.sampleInput === '' ? '' : $('stdin').value.trim() + '\n']
      : cases.map(item => item.input);
    showResult('loading');
    setBusy(true);
    try {
      if (!window.SteppeCompiler) { showResult('unavailable'); return; }
      const answer = await window.SteppeCompiler.run(track, $('code').value,
        inputs, phase => {
          if (active === generation && ['loading','compiling','running'].includes(phase)) {
            showResult(practice && phase === 'running' ? 'trying' : phase);
          }
        });
      if (active !== generation) return;
      if (answer.status !== 'ok') {
        showResult(['compile','runtime','timeout','cancelled'].includes(answer.status) ? answer.status : 'unavailable');
        if (practice && answer.outputs?.[0]) displayOutput(t('output'), answer.outputs[0]);
        if (answer.diagnostics) details(t('diagnostics'), answer.diagnostics);
        return;
      }
      if (practice) {
        showResult('tried');
        if (!isDone(lesson.id)) $('run-status').textContent += ' ' + t('submitToFinish');
        displayOutput(t('output'), answer.outputs[0]);
        window.SteppeScene?.show($('scene'), lesson, answer.outputs[0], inputs[0], lang);
        return;
      }
      const failed = cases.findIndex((item,i) => !lesson.check(answer.outputs[i], item.input));
      if (failed !== -1) {
        showResult('testFailed');
        const test = cases[failed];
        details(t('testCase'), [
          t('given') + ' → ' + (test.input.trim() || t('none')),
          t('want') + ' → ' + test.expected,
          t('got') + ' → ' + (answer.outputs[failed]?.trim() || t('empty'))
        ].join('\n'));
        return;
      }
      showResult('success');
      const input = inputs[0].trim();
      const heading = input ? t('checkedOutput') + ' (' + t('given') + ' ' + input + ')' : t('checkedOutput');
      displayOutput(heading, answer.outputs[0]);
      completed.add(lesson.id);
      write(prefix + lesson.id + '.done', '1');
      updateRoute();
      $('outcome').textContent = lesson.outcome;
      $('outcome').hidden = false;
      window.SteppeScene?.show($('scene'), lesson, answer.outputs[0], input, lang);
      $('next').textContent = t(lesson === lessons.at(-1) ? 'return' : 'next');
      $('next').hidden = false;
    } catch {
      if (active === generation) showResult('unavailable');
    } finally {
      if (active === generation) setBusy(false);
    }
  }

  $('code').addEventListener('input', () => {
    const key = draftKey();
    const text = $('code').value;
    if (text === lesson.starter) draftCache.delete(key);
    else draftCache.set(key,text);
    write(key,text === lesson.starter ? null : text);
    hideResult();
    paintCode();
  });
  $('code').addEventListener('scroll', () => {
    $('highlight').scrollTop = $('code').scrollTop;
    $('highlight').scrollLeft = $('code').scrollLeft;
  });
  $('stdin').addEventListener('input', hideResult);
  $('locale').addEventListener('change', () => {
    lang = $('locale').value;
    write('pq-interface-language',lang);
    render(lesson.id);
  });
  $('track').addEventListener('click', () => {
    window.TrailPicker.open({track, lang, trigger: $('track'), onSelect(next) {
      if (next === 'python') { location.assign('./index.html?lang=' + lang + '&track=python#courses'); return; }
      if (next !== track && (next === 'c' || next === 'cpp')) {
        track = next;
        render();
      }
    }});
  });
  $('try-code').addEventListener('click', () => run(true));
  $('run').addEventListener('click', () => run(false));
  $('stop').addEventListener('click', cancel);
  $('next').addEventListener('click', () => {
    const next = lessons[lessons.indexOf(lesson) + 1];
    if (next) selectLesson(next.id,true);
    else location.assign($('catalog').href);
  });
  $('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([$('code').value], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = $('filename').textContent;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  render(params.has('stop') ? track + '/' + params.get('stop') : undefined);
})();
