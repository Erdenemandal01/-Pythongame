const PARKED_STUDENTS_KEY = 'pythonQuestStudents_v1';

function readParkedStudents() {
    const records=JSON.parse(localStorage.getItem(PARKED_STUDENTS_KEY)||'{}');
    if (!records || typeof records!=='object' || Array.isArray(records)) {
        throw Error('Сурагчдын хадгаламжийг унших боломжгүй байна.');
    }
    return records;
}

function activateStudent(next,route) {
    if (window.GameAccount?.isCloud()) return false;
    if (busy) {toast('Эхлээд ажиллаж буй кодоо зогсооно уу.');return false;}
    if (!stash()) return false;
    const previousId=state.academy.portfolioId, nextId=next.academy.portfolioId;
    let records;
    try {
        records=readParkedStudents();
        if (previousId!==nextId) {
            // Keep both copies until the incoming active save has been committed.
            records[previousId]=state;
            localStorage.setItem(PARKED_STUDENTS_KEY,JSON.stringify(records));
        }
        writeActiveSave(next);
    } catch (error) {
        toast(saveProblem(error));
        return false;
    }
    if ($('profile').open && nextId!==previousId) $('profile').close();
    state=next;
    if (Object.hasOwn(records,nextId)) {
        delete records[nextId];
        // Under a storage failure the redundant copy is harmless and stays hidden.
        try {localStorage.setItem(PARKED_STUDENTS_KEY,JSON.stringify(records));} catch {}
    }
    current=Math.min(state.done.length,MISSIONS.length-1);
    switchView(route,false);
    return true;
}

function classProfilePicker() {
    const box=document.createElement('details'),summary=document.createElement('summary');
    summary.textContent='Нэг компьютер ээлжилж ашиглах';box.append(summary);
    const active=document.createElement('p'), nickname=document.createElement('span');
    nickname.translate=false;nickname.textContent=state.name;
    active.append('Одоогийн сурагч · ',nickname);box.append(active);
    const name=document.createElement('input');
    name.maxLength=24;name.placeholder='Шинэ сурагчийн хоч';name.setAttribute('aria-label',name.placeholder);
    const select=document.createElement('select');select.setAttribute('aria-label','Хадгалсан сурагч сонгох');
    let saved={};try {saved=readParkedStudents();}catch{}
    Object.entries(saved).forEach(([id,s])=>{
        if(id===state.academy.portfolioId || !s || typeof s.name!=='string')return;
        const option=document.createElement('option');option.translate=false;option.value=id;option.textContent=s.name+' · '+id.slice(0,4);select.append(option);
    });
    function swap(next) {
        if (activateStudent(next,'academy')) toast(state.name+' · '+(globalThis.GameLocale?.text('Урлан нээгдлээ.') ?? 'Урлан нээгдлээ.'));
    }
    const start=document.createElement('button');start.type='button';start.textContent='Шинэ сурагч эхлүүлэх';
    start.onclick=()=>{if(!name.value.trim())return name.focus();const next=fresh();next.name=name.value.trim();swap(next);};
    const form=document.createElement('div');form.className='profile-actions';form.append(name,start);
    if (select.options.length) {
        const resume=document.createElement('button');resume.type='button';resume.textContent='Үргэлжлүүлэх';resume.className='secondary';
        resume.onclick=()=>{try {swap(validState(readParkedStudents()[select.value]));}catch {toast('Хадгаламжийг унших боломжгүй байна.');}};
        form.append(select,resume);
    }
    box.append(form);return box;
}
