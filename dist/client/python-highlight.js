// Keep the native editor in charge of typing, selection, accessibility and Python source.
(() => {
    'use strict';

    const editorSelector = 'textarea:is(#code,.ac-code,.bq-code,.ct-code,.dr-code,.dt-code,.gh-code,.jl-code,.lv-code,.mk-code,.mu-code,.rd-code,.wk-code)';
    const keywords = new Set(('False None True and as assert async await break class continue def del elif else '
        + 'except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield').split(' '));
    const builtins = new Set(('abs aiter all anext any ascii bin bool breakpoint bytearray bytes callable chr classmethod '
        + 'compile complex delattr dict dir divmod enumerate eval exec filter float format frozenset getattr globals '
        + 'hasattr hash help hex id input int isinstance issubclass iter len list locals map max memoryview min next '
        + 'object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str '
        + 'sum super tuple type vars zip __import__').split(' '));
    const tokens = /(?<comment>#[^\n]*)|(?:br|rb|fr|rf|b|r|u|f)?(?<quote>'''|"""|['"])|(?<number>0x(?:_?[\da-f])+|0o(?:_?[0-7])+|0b(?:_?[01])+|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:e[+-]?\d(?:_?\d)*)?j?)|(?<name>[_\p{ID_Start}][_\p{ID_Continue}]*)|(?<operator>[-+*/%@&|^~<>=!]+)/giu;

    function stringEnd(source, cursor, quote) {
        // An unfinished string should already have its color while the student types.
        while (cursor < source.length) {
            if (source.startsWith(quote, cursor)) return cursor + quote.length;
            if (source[cursor] === '\n' && quote.length === 1) return cursor;
            cursor += source[cursor] === '\\' ? 2 : 1;
        }
        return source.length;
    }

    function highlight(source) {
        const content = document.createDocumentFragment();
        let cursor = 0;
        tokens.lastIndex = 0;
        let match;
        while ((match = tokens.exec(source)) !== null) {
            if (cursor < match.index) content.append(source.slice(cursor, match.index));
            const {comment, quote, number, name} = match.groups;
            let kind = 'operator';
            if (comment) kind = 'comment';
            else if (quote) {
                kind = 'string';
                tokens.lastIndex = stringEnd(source, tokens.lastIndex, quote);
            } else if (number) kind = 'number';
            else if (name) {
                if (keywords.has(name)) kind = 'keyword';
                else if (builtins.has(name)) kind = 'builtin';
                else kind = 'name';
            }
            const span = document.createElement('span');
            span.className = 'py-token-' + kind;
            span.textContent = source.slice(match.index, tokens.lastIndex);
            content.append(span);
            cursor = tokens.lastIndex;
        }
        if (cursor < source.length) content.append(source.slice(cursor));
        return content;
    }

    const textStyles = ['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'fontStretch', 'fontVariant',
        'fontKerning', 'fontFeatureSettings', 'fontVariationSettings', 'lineHeight', 'letterSpacing',
        'wordSpacing', 'tabSize', 'textAlign', 'textIndent', 'textTransform', 'textRendering', 'direction',
        'overflowWrap', 'wordBreak', 'whiteSpace', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    const editors = new WeakMap();
    const mounted = new Set();

    function alignScroll(field, mirror) {
        mirror.scrollLeft = field.scrollLeft;
        mirror.scrollTop = field.scrollTop;
    }

    function measure(field) {
        const mirror = editors.get(field).mirror;
        const style = getComputedStyle(field);
        for (const property of textStyles) mirror.style[property] = style[property];
        // The native viewport excludes its border and scrollbars, including after a manual resize.
        mirror.style.left = (field.offsetLeft + field.clientLeft) + 'px';
        mirror.style.top = (field.offsetTop + field.clientTop) + 'px';
        mirror.style.width = field.clientWidth + 'px';
        mirror.style.height = field.clientHeight + 'px';
        alignScroll(field, mirror);
    }

    const sizes = window.ResizeObserver && new ResizeObserver(entries => {
        for (const {target} of entries) measure(target);
    });
    if (!sizes) window.addEventListener('resize', () => mounted.forEach(measure));

    function bind(field) {
        const wrapper = document.createElement('span');
        wrapper.className = 'py-editor-wrap';
        const mirror = document.createElement('span');
        mirror.className = 'py-editor-mirror';
        mirror.setAttribute('aria-hidden', 'true');
        wrapper.append(mirror);
        field.classList.add('py-editor-input');

        let lastValue;
        function paint() {
            const source = field.value;
            if (source === lastValue) return;
            mirror.replaceChildren(highlight(source));
            mirror.toggleAttribute('data-trailing-line', !source || source.endsWith('\n'));
            lastValue = source;
            alignScroll(field, mirror);
        }

        field.addEventListener('input', paint);
        field.addEventListener('scroll', () => alignScroll(field, mirror), {passive:true});
        // Loading a saved draft and inserting indentation do not always fire a native input event.
        // Watch those writes on this editor only and leave the game's own change handlers in control.
        const nativeValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
        Object.defineProperty(field, 'value', {
            ...nativeValue,
            set(value) { nativeValue.set.call(this, value); paint(); }
        });
        const nativeReplace = field.setRangeText;
        Object.defineProperty(field, 'setRangeText', {
            configurable:true, writable:true,
            value(...args) { nativeReplace.apply(this, args); paint(); }
        });
        return {wrapper, mirror, paint};
    }

    function attach(field) {
        if (!field.isConnected) return;
        let editor = editors.get(field);
        if (!editor) {
            editor = bind(field);
            editors.set(field, editor);
        }
        if (field.parentElement !== editor.wrapper) {
            const focused = field === document.activeElement;
            field.before(editor.wrapper);
            editor.wrapper.append(field);
            if (focused) field.focus({preventScroll:true});
        }
        if (mounted.has(field)) return;
        mounted.add(field);
        editor.paint();
        measure(field);
        sizes?.observe(field);
    }

    // Workshops build their own editors when a student changes lessons or switches activities.
    function scan(element) {
        if (element.matches(editorSelector)) attach(element);
        else if (element.childElementCount) element.querySelectorAll(editorSelector).forEach(attach);
    }

    function start() {
        scan(document.body);
        new MutationObserver(records => {
            let removed = false;
            for (const record of records) {
                if (record.target.closest('.py-editor-mirror')) continue;
                for (const added of record.addedNodes) {
                    if (added.nodeType === Node.ELEMENT_NODE) scan(added);
                }
                if (record.removedNodes.length) removed = true;
            }
            if (removed) {
                for (const field of mounted) {
                    if (field.isConnected) continue;
                    sizes?.unobserve(field);
                    mounted.delete(field);
                }
            }
        }).observe(document.body, {childList:true, subtree:true});
    }
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, {once:true});
})();
