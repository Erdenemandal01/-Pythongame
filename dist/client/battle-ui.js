(function () {
  'use strict';
  let active = null;

  const fighterIcons = {slime:'I', wolf:'II', golem:'III', wraith:'IV', dragon:'V'};
  const actions = {strike:'Довтолгоо',guard:'Хамгаалалт',heal:'Эдгээх'};
  const sleep = ms => new Promise(resolve=>setTimeout(resolve, ms));
  const el = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = String(text);
    return item;
  };
  function button(text, className, onClick) {
    const b = el('button', className, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  function healthPanel(label, name, side) {
    const box = el('div','battle-health battle-health-' + side);
    const heading = el('div','battle-health-label');
    const who = el('span','',label);
    const value = el('strong');
    heading.append(who, value);
    const bar = el('progress');
    bar.setAttribute('aria-label', name + ' · амь');
    box.append(heading,el('b','battle-health-name',name),bar);
    return {box, value, bar};
  }
  function syncHealth(panel, current, max) {
    panel.value.textContent = Math.max(0, current) + ' / ' + max;
    panel.bar.max = max;
    panel.bar.value = Math.max(0,current);
  }
  function leave() {
    if (!active) return;
    active.cancel();
    active = null;
  }
  function mount(root, adapter) {
    leave();
    const session = {cancel:()=>{}};
    active = session;
    const save = adapter.getSave();
    const unlocked = battle => battle.id === 0 || save.won.includes(battle.id - 1);
    const selected = BATTLES.find(b => b.id === save.selected && unlocked(b)) || BATTLES[0];
    let worker = null, loadTimer, runTimer, token = 0;
    let running = false, playing = false, skip = false;
    const m = selected;
    function cancel() {
      token++;
      clearTimeout(loadTimer);
      clearTimeout(runTimer);
      worker?.terminate();
      worker = null;
      running = playing = false;
    }
    session.cancel = cancel;
    function choose(id, focusHeading = false) {
      if (id === m.id || !BATTLES.some(b=>b.id === id && unlocked(b))) return;
      save.selected = id;
      adapter.save();
      mount(root,adapter);
      if (focusHeading) root.querySelector('.bq-title').focus({preventScroll:true});
      root.querySelector('.bq-title').scrollIntoView({block:'start',behavior:'smooth'});
    }

    root.replaceChildren();
    const shell = el('section','bq');
    root.append(shell);
    const header = el('header','bq-heading');
    const labels = el('div');
    const title = el('h1','bq-title','Тулааны талбар');
    title.tabIndex = -1;
    labels.append(title);
    const count = el('span','bq-count',save.won.length+' / '+BATTLES.length+' ялалт');
    header.append(labels, count);
    shell.append(header);
    const route = el('nav','bq-route');
    route.setAttribute('aria-label','Тулаан сонгох');
    for(const b of BATTLES) {
      const done = save.won.includes(b.id), open = unlocked(b);
      const node = button('','bq-node',()=>choose(b.id));
      node.dataset.kind = b.kind;
      node.disabled = !open;
      node.setAttribute('aria-label',b.enemy+(done?' · Ялсан':open?' · Нээлттэй':' · Түгжээтэй'));
      if(b.id===m.id) node.setAttribute('aria-current','step');
      const icon = el('img');
      icon.src = 'art/battles/enemy-'+b.kind+'.png';
      icon.alt='';
      const name=el('span','bq-node-label',b.enemy);
      node.append(icon,name,el('span','bq-node-state',done?'✓':open?'◆':'◇'));
      route.append(node);
    }
    shell.append(route);

    const battlefield = el('section','bq-field');
    battlefield.setAttribute('aria-label',m.title);
    const intro = el('div','bq-encounter');
    const introText = el('div');
    introText.append(el('span','bq-chapter','ТУЛААН '+fighterIcons[m.kind]),el('h2','',m.title));
    intro.append(introText, el('span','bq-reward','✦ '+m.reward+' XP'));
    battlefield.append(intro);
    const stage = el('div','battle-stage');
    stage.dataset.kind = m.kind;
    const hud=el('div','bq-hud');
    const playerPanel = healthPanel('АЯЛАГЧ','Баатар','player');
    const foePanel = healthPanel('ӨРСӨЛДӨГЧ',m.enemy,'enemy');
    hud.append(playerPanel.box,foePanel.box);
    const actors=el('div','battle-actors');
    const hero=el('img','battle-hero'), enemy=el('img','battle-enemy');
    hero.src='art/hero-0.png';hero.alt='Аялагч';
    enemy.src='art/battles/enemy-'+m.kind+'.png';enemy.alt=m.enemy;
    const fx=el('span','battle-effect');
    fx.setAttribute('aria-hidden','true');
    actors.append(hero,enemy,fx);
    const impacts=el('div','bq-impacts');
    impacts.setAttribute('aria-hidden','true');
    stage.append(actors,hud,impacts);
    battlefield.append(stage);
    const status=el('div','bq-status');
    const intentGroup=el('div','bq-intent');
    intentGroup.append(el('span','bq-small','Дайсны дараагийн нүүдэл'));
    const intentText=el('strong');
    intentGroup.append(intentText);
    const counters=el('div','bq-counters');
    const turnText=el('span'),potionsText=el('span');
    counters.append(turnText,potionsText);
    status.append(intentGroup,counters);
    battlefield.append(status);
    const messageWrap=el('div','bq-message-wrap');
    const message=el('p','bq-message');
    message.setAttribute('role','status');
    const skipBtn=button('Үр дүнг шууд үзэх','bq-outline bq-compact',()=>{skip=true;});
    skipBtn.hidden=true;
    const nextBtn = button('Дараагийн тулаан','bq-button bq-compact',()=>choose(m.id+1,true));
    const editBtn = button('Кодоо засах','bq-outline bq-compact',focusEditor);
    nextBtn.hidden=editBtn.hidden=true;
    messageWrap.append(message,skipBtn,nextBtn,editBtn);
    battlefield.append(messageWrap);
    shell.append(battlefield);

    const body=el('div','bq-body');
    const brief=el('section','bq-instructions');
    brief.append(el('h3','','Таны зорилго'),el('p','bq-story',m.story),el('p','bq-lesson',m.lesson));
    function intentLabel(intent) {
      const name=BATTLE_INTENTS[intent] || intent;
      return m.commands.includes('sense') ? name+' · "'+intent+'"' : name;
    }
    const pattern=el('details','bq-pattern');
    pattern.append(el('summary','','Дайсны нүүдлийн дараалал'));
    const order=el('ol');
    m.patterns.forEach(intent=>order.append(el('li','',intentLabel(intent))));
    pattern.append(order,el('p','','Сүүлийн нүүдлийн дараа эхнээсээ давтагдана.'));
    brief.append(pattern);
    const commands=el('details','bq-reference');
    commands.open=m.commands.length<=3 || !window.matchMedia('(max-width: 930px)').matches;
    commands.append(el('summary','','Командын лавлах'));
    const list=el('dl');
    for(const command of m.commands) {
      list.append(el('dt','',command+'()'),el('dd','',BATTLE_COMMANDS[command]));
    }
    commands.append(list);
    const hint=el('details','bq-hint');
    hint.append(el('summary','','Санаа авах'),el('p','',m.hint));
    brief.append(commands,hint);
    const editorPanel=el('section','bq-editor');
    const editHeader=el('div','bq-editor-header');
    editHeader.append(el('span','','battle.py'));
    const restore=button('Эхний код','bq-link',()=>{
      if (running || input.value === m.starter) return;
      if (!confirm('Энэ тулааны кодыг эхний загварт буцаах уу?')) return;
      input.value=m.starter;saveCode();focusEditor();
    });
    editHeader.append(restore);
    const input=el('textarea','bq-code');
    input.value=save.drafts[m.id]??m.starter;
    input.spellcheck=false;
    input.setAttribute('autocapitalize','off');
    input.setAttribute('autocomplete','off');
    input.setAttribute('autocorrect','off');
    input.setAttribute('aria-label','Тулааны Python код');
    function focusEditor() {
      input.focus({preventScroll:true});
      input.scrollIntoView({block:'center',behavior:'smooth'});
    }
    function saveCode() {
      save.drafts[m.id]=input.value;
      adapter.save();
    }
    input.addEventListener('input',saveCode);
    input.addEventListener('keydown',event=>{
      if ((event.ctrlKey||event.metaKey) && event.key==='Enter') {
        event.preventDefault();if(!running) run();return;
      }
      if (running || event.isComposing) return;
      if (event.key==='Tab' && !event.shiftKey) {
        event.preventDefault();
        input.setRangeText('    ',input.selectionStart,input.selectionEnd,'end');saveCode();
      } else if(event.key==='Enter'&&!event.shiftKey) {
        event.preventDefault();
        const line=input.value.slice(0,input.selectionStart).split('\n').pop();
        const indent=line.match(/^\s*/)[0]+(line.trimEnd().endsWith(':')?'    ':'');
        input.setRangeText('\n'+indent,input.selectionStart,input.selectionEnd,'end');saveCode();
      }
    });
    const editActions=el('div','bq-editor-actions');
    const keycap=el('small','bq-shortcut','Ctrl + Enter');
    const runBtn=button('▶ Тулалдах','bq-button',run);
    const stopBtn=button('■ Зогсоох','bq-outline',()=>{
      cancel();setBusy(false);messageWrap.dataset.tone='neutral';
      message.textContent='Тулаан зогслоо. Кодоо засаад дахин тулалдаарай.';
    });
    stopBtn.hidden=true;
    editActions.append(keycap,runBtn,stopBtn);
    const log=el('details','bq-log');
    const logTitle=el('summary','','Тулааны тэмдэглэл');
    const logList=el('ol');
    const terminal=el('pre','bq-output');
    terminal.hidden=true;
    log.append(logTitle,logList,terminal);
    editorPanel.append(editHeader,input,editActions,log);
    body.append(brief,editorPanel);shell.append(body);

    function setBusy(value) {
      running=value;
      runBtn.disabled=restore.disabled=value;
      input.readOnly=value;
      runBtn.hidden=value;
      stopBtn.hidden=!value;
      skipBtn.hidden=!playing||!value;
      route.querySelectorAll('button').forEach((node,i)=>{node.disabled=value||!unlocked(BATTLES[i]);});
    }
    function update(frame,terminalFrame=false) {
      syncHealth(playerPanel,frame.playerHP,m.playerHP);
      syncHealth(foePanel,frame.enemyHP,m.hp);
      const intent=frame.nextIntent ?? m.patterns[0];
      intentText.textContent=terminalFrame?'Тулаан дууссан':intentLabel(intent);
      intentGroup.dataset.intent=intent;
      turnText.textContent='Ээлж '+Math.min((frame.turn||0)+(terminalFrame?0:1),m.maxTurns)+' / '+m.maxTurns;
      potionsText.textContent='Эм '+frame.potions+' / '+m.potions;
      if (frame.action) {
        impacts.replaceChildren();
        function impact(side,tone,text) {
          const tag=el('span','bq-impact bq-impact-'+side+' bq-impact-'+tone,text);
          impacts.append(tag);
        }
        if(frame.damageDealt) impact('enemy','damage','−'+frame.damageDealt);
        if(frame.damageTaken) impact('hero','damage','−'+frame.damageTaken);
        if(frame.healed) impact('hero','healing','+'+frame.healed);
        if(frame.action==='guard' && frame.focus && ['hit','charge'].includes(frame.intent))
          impact('hero','blocked','Хаалт');
        stage.classList.remove('battle-turn');
        stage.dataset.action='';
        enemy.classList.remove('battle-hit');
        void stage.offsetWidth;
        stage.dataset.action=frame.action;
        stage.dataset.counter=String(frame.enemyHP>0 && ['hit','charge','hex'].includes(frame.intent));
        stage.classList.add('battle-turn');
        if(frame.damageDealt>0) enemy.classList.add('battle-hit');
      }
    }
    function initial() {
      stage.classList.remove('battle-won','battle-lost','battle-turn');
      stage.dataset.action='';
      stage.dataset.counter='false';
      impacts.replaceChildren();
      enemy.classList.remove('battle-hit');
      update({playerHP:m.playerHP,enemyHP:m.hp,potions:m.potions,nextIntent:m.patterns[0],turn:0});
    }
    initial();
    message.textContent='Эхний нүүдлийг ажиглаад хийх үйлдлээ Python-оор бичээрэй.';
    function failure(text) {
      cancel();setBusy(false);
      messageWrap.dataset.tone='loss';message.textContent=text;editBtn.hidden=false;
    }
    function logTurn(frame) {
      const li=el('li');li.append(el('strong','',actions[frame.action]||frame.action),document.createTextNode(' · '+intentLabel(frame.intent)+' · '+frame.text));logList.append(li);
    }
    function run() {
      if (running) return;
      if(!input.value.trim()) {message.textContent='Эхлээд тулааны кодоо бичээрэй.';focusEditor();return;}
      cancel();initial();
      const ticket=token;
      const live=()=>active===session && ticket===token;
      const output=[];
      let captured=0;
      playing=skip=false;
      setBusy(true);
      editBtn.hidden=nextBtn.hidden=true;
      logList.replaceChildren();terminal.hidden=true;log.open=false;
      logTitle.textContent='Тулааны тэмдэглэл';
      messageWrap.dataset.tone='neutral';
      message.textContent='Python бэлдэж байна…';
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        battlefield.scrollIntoView({block:'start',behavior:'smooth'});
      try {worker=new Worker('worker.js?v=battle-1');} catch(error) {
        failure('Python эхэлж чадсангүй. '+error.message);return;
      }
      worker.onerror=event=>{if(live()) failure('Тулааны хөдөлгүүр эхэлж чадсангүй. '+(event.message||'Хуудсаа шинэчлээд дахин оролдоорой.'));};
      loadTimer=setTimeout(()=>{if(live()) failure('Python ачаалах хугацаа дууслаа. Дахин оролдоорой.');},90000);
      worker.onmessage=async({data})=>{
        if(!live()) return;
        if(data.type==='ready') {
          clearTimeout(loadTimer);message.textContent='Таны код ажиллаж байна…';
          runTimer=setTimeout(()=>{if(live()) failure('Код зогсохгүй байна. Давталтын нөхцөл болон доторх үйлдлээ шалгаарай.');},5000);
          worker.postMessage({code:input.value,battle:m});
        } else if(data.type==='stdout') {
          if (captured<20000) {const line=String(data.text);output.push(line);captured+=line.length+1;}
        } else if(data.type==='fatal') failure(data.error);
        else if(data.type==='result') {
          clearTimeout(loadTimer);clearTimeout(runTimer);
          worker.terminate();worker=null;
          playing=true;skipBtn.hidden=!(data.trace?.length>1);
          const trace=data.trace||[];
          for(let i=0;i<trace.length;i++) {
            if(!live()) return;
            const frame=trace[i];
            update(frame,i===trace.length-1 && ['victory','loss'].includes(data.kind));
            message.textContent='Ээлж '+frame.turn+' · '+frame.text;
            logTurn(frame);
            if(!skip) await sleep(window.matchMedia('(prefers-reduced-motion: reduce)').matches?80:640);
          }
          if(!live()) return;
          playing=false;setBusy(false);
          logTitle.textContent='Тулааны тэмдэглэл · '+trace.length+' ээлж';
          if(output.length || data.kind==='code') {
            terminal.textContent=[output.join('\n'),data.kind==='code'?data.error:''].filter(Boolean).join('\n');
            terminal.hidden=false;
          }
          if(data.ok) {
            const first=!save.won.includes(m.id);
            if(first) adapter.reward(m.id);
            count.textContent=save.won.length+' / '+BATTLES.length+' ялалт';
            const nodes=route.querySelectorAll('button');
            nodes[m.id].querySelector('.bq-node-state').textContent='✓';
            nodes[m.id].setAttribute('aria-label',m.enemy+' · Ялсан');
            if(nodes[m.id+1]) {
              nodes[m.id+1].disabled=false;
              nodes[m.id+1].querySelector('.bq-node-state').textContent=save.won.includes(m.id+1)?'✓':'◆';
              nodes[m.id+1].setAttribute('aria-label',BATTLES[m.id+1].enemy+' · Нээлттэй');
            }
            stage.classList.add('battle-won');messageWrap.dataset.tone='win';
            message.textContent=(save.won.length===BATTLES.length?'Бүх тулаанд яллаа!':'Ялалт!')+(first?' +'+m.reward+' XP.':' Дахин амжилттай тулалдлаа.');
            nextBtn.hidden=m.id===BATTLES.length-1;
            runBtn.textContent='↻ Дахин тулалдах';
          } else {
            if(data.kind==='loss') stage.classList.add('battle-lost');
            messageWrap.dataset.tone=data.kind==='incomplete'?'incomplete':'loss';
            const label={loss:'Ялагдал. ',incomplete:'Тулаан үргэлжилнэ. ',code:'Кодын алдаа. '};
            message.textContent=(label[data.kind]||'')+(data.error || 'Дарааллаа өөрчлөөд туршаарай.');
            editBtn.hidden=false;runBtn.textContent='▶ Дахин турших';
            if(data.kind==='code') log.open=true;
          }
        }
      };
    }
  }
  window.BattleUI={mount,leave};
})();

