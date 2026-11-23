(() => {
    'use strict';
    const dialog=document.getElementById('help'), opener=document.getElementById('helpBtn');
    const feedback=dialog.querySelector('.help-feedback');
    function open() {
        if(dialog.open) return;
        feedback.textContent='';
        dialog.showModal();
        dialog.querySelector('.help-scroll').scrollTop=0;
        dialog.querySelector('.help-close').focus({preventScroll:true});
    }
    opener.onclick=open;
    dialog.querySelector('.help-close').onclick=()=>dialog.close();
    dialog.addEventListener('click',event=>{
        const action=event.target.closest('[data-help-go]')?.dataset.helpGo;
        if(!action) return;
        if(busy) {
            feedback.textContent='Код ажиллаж байна. Дуусмагц дахин дарна уу.';
            return;
        }
        dialog.close();
        if(action==='first') openMission(0);
        else if(action==='academy') switchView('academy');
        else if(action==='greenhouse') switchView('greenhouse');
        const heading=document.querySelector('.view:not([hidden]) h1');
        if(heading) {
            heading.tabIndex=-1;
            heading.focus({preventScroll:true});
            heading.scrollIntoView({block:'start'});
        }
    });
    const url=new URL(location.href);
    if(url.searchParams.get('help')==='1') {
        if(location.protocol!=='file:') {
            url.searchParams.delete('help');
            history.replaceState(null,'',url);
        }
        open();
    }
})();
