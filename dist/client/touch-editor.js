// Offer line indentation to Python editors on devices with a touch pointer.
(() => {
    'use strict';
    const touch = matchMedia('(any-pointer: coarse)');
    const codeFields = 'textarea:is(#code,.ac-code,.bq-code,.dr-code,.mu-code,.dt-code,.ct-code,.lv-code,.mk-code)';
    let field, controls, increase, decrease, message, watchLock;

    function editIndent(add) {
        if (!field?.isConnected || field.readOnly || field.disabled) return;
        const {value, selectionStart:start, selectionEnd:end, selectionDirection:direction}=field;
        const first=value.slice(0,start).lastIndexOf('\n')+1;
        const lastPosition=end>start && value[end-1]==='\n' ? end-1 : end;
        const newline=value.indexOf('\n',lastPosition);
        const last=newline<0 ? value.length : newline;
        let nextStart=start, nextEnd=end, pos=first;
        const changed=value.slice(first,last).split('\n').map(line=>{
            const prefix=add ? '' : (line.match(/^(?: {1,4}|\t)/)?.[0] || '');
            const indent=add ? '    ' : '';
            // Translate both endpoints through the prefix change on this line.
            if (start>=pos) nextStart+=indent.length-Math.min(prefix.length,start-pos);
            if (end>=pos) nextEnd+=indent.length-Math.min(prefix.length,end-pos);
            pos+=line.length+1;
            return indent+line.slice(prefix.length);
        }).join('\n');
        if (field.maxLength>=0 && value.length+changed.length-(last-first)>field.maxLength) {
            message.textContent='Кодын уртын хязгаарт хүрсэн.'; return;
        }
        if (value.slice(first,last)===changed) return;
        const scrollTop=field.scrollTop, scrollLeft=field.scrollLeft;
        field.focus({preventScroll:true});
        field.setRangeText(changed,first,last,'preserve');
        field.setSelectionRange(nextStart,nextEnd,direction);
        field.scrollTop=scrollTop;
        field.scrollLeft=scrollLeft;
        field.dispatchEvent(new Event('input',{bubbles:true}));
        message.textContent='';
    }

    function button(label, add) {
        const item=document.createElement('button');
        item.type='button';
        item.textContent=label;
        item.addEventListener('pointerdown',event=>event.preventDefault());
        item.addEventListener('click',()=>editIndent(add));
        return item;
    }
    function unlock() {
        const locked=field.readOnly || field.disabled;
        increase.disabled=locked;
        decrease.disabled=locked;
    }
    function prepare(target) {
        target.setAttribute('autocapitalize','off');
        target.setAttribute('autocorrect','off');
        target.setAttribute('autocomplete','off');
        target.spellcheck=false;
    }
    function open(target) {
        prepare(target);
        if (!controls) {
            controls=document.createElement('div');
            controls.className='touch-indent-controls';
            controls.setAttribute('role','group');
            controls.setAttribute('aria-label','Python кодын догол мөр');
            increase=button('Догол нэмэх',true);
            decrease=button('Догол хасах',false);
            message=document.createElement('small');
            message.setAttribute('role','status');
            controls.append(increase,decrease,message);
            watchLock=new MutationObserver(unlock);
        }
        if (target!==field || !controls.isConnected) {
            watchLock.disconnect();
            field=target;
            // Keep buttons out of editor gutters and out of the city's input label.
            const anchor=target.closest('.code-wrap,.lv-code-field,label') || target.closest('.py-editor-wrap') || target;
            anchor.after(controls);
            message.textContent='';
            watchLock.observe(field,{attributes:true,attributeFilter:['readonly','disabled']});
        }
        unlock();
    }
    // Set OS keyboard behavior before the first focus; dynamically created editors are included.
    document.addEventListener('pointerdown',event=>{
        if (touch.matches && event.target.matches(codeFields)) prepare(event.target);
    },true);
    document.addEventListener('focusin',event=>{
        if (touch.matches && event.target.matches(codeFields)) open(event.target);
    });
    touch.addEventListener('change',()=>{
        if (!touch.matches) {
            watchLock?.disconnect(); controls?.remove(); field=null;
        } else if (document.activeElement?.matches(codeFields)) open(document.activeElement);
    });
})();
