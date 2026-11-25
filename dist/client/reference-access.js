window.ReferenceAccess = (() => {
    'use strict';
    const tr = (mn, en) => window.GameLocale?.lang === 'en' ? en : mn;
    const sources = 'textarea.py-editor-input:not(.ref-code)';
    const toolbars = '.editor-foot,.ac-runbar,.bq-editor-header,.ct-actions,.dr-runbar,.gh-operations,.jl-actions,.ce-controls,.lv-controls,.mk-edithead,.mu-file,.rd-editor-head,.wk-controls';
    const controls = new WeakMap();
    let adapter, lastField, session;

    function readDrafts(raw) {
        const drafts = {};
        for (const {id} of PythonReferenceData.topics) {
            if (typeof raw?.[id] === 'string') drafts[id] = raw[id].slice(0, 16000);
        }
        return drafts;
    }

    function match(hash) {
        const parts = /^#reference(?:\/([a-z0-9-]+))?$/.exec(hash);
        return parts ? {hash, topicId: parts[1]} : null;
    }

    function visible(node) {
        return node?.isConnected && !node.closest('[hidden]') && node.getClientRects().length > 0;
    }

    function findField(opener) {
        const scope = opener?.closest('dialog') || document;
        if (visible(lastField) && scope.contains(lastField)) return lastField;
        return [...scope.querySelectorAll(sources)].find(visible);
    }

    function open({field, opener, shared} = {}) {
        if (!adapter) return;
        if (session) close(false);
        field = field || findField(opener);
        const selection = field && {
            start: field.selectionStart, end: field.selectionEnd, direction: field.selectionDirection,
            top: field.scrollTop, left: field.scrollLeft
        };
        const owner = adapter.profile();
        const from = {shared, restore: true};
        session = from;
        if (shared) history.replaceState(history.state, '', shared.hash);
        PythonReference.open({
            topicId: shared?.topicId,
            returnLabel: field ? tr('Код руугаа буцах', 'Back to my code') : tr('Тоглоом руу буцах', 'Back to the game'),
            getDraft: id => owner.referenceDrafts[id],
            saveDraft(id, code) {
                if (adapter.profile() !== owner) return;
                owner.referenceDrafts[id] = code.slice(0, 16000);
                adapter.save();
            },
            onClose() {
                session = null;
                if (!from.restore) return;
                if (shared && location.hash === shared.hash) history.replaceState(history.state, '', '#' + adapter.view());
                if (owner !== adapter.profile()) return;
                if (visible(field)) {
                    field.focus({preventScroll:true});
                    field.setSelectionRange(selection.start, selection.end, selection.direction);
                    field.scrollTop = selection.top;
                    field.scrollLeft = selection.left;
                } else if (visible(opener)) opener.focus({preventScroll:true});
                else document.getElementById('openPythonReference')?.focus({preventScroll:true});
            }
        });
    }

    function close(restore = true) {
        if (!session) return;
        session.restore = restore;
        PythonReference.close();
    }

    function attach(field) {
        if (!field.matches(sources) || controls.has(field)) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'reference-trigger';
        button.dataset.openReference = '';
        button.setAttribute('aria-haspopup', 'dialog');
        button.title = tr('Монгол Python лавлах (F1)', 'Python reference (F1)');
        button.textContent = tr('Python лавлах', 'Python reference');
        controls.set(field, button);
        button.addEventListener('click', () => open({field, opener:button}));
        // Find the nearest toolbar belonging to this editor, or place the link above its field.
        const wrapper = field.parentElement;
        for (let parent = wrapper.parentElement; parent && !parent.matches('.view, main, body'); parent = parent.parentElement) {
            if (parent.querySelectorAll('textarea').length > 1) break;
            const bar = parent.querySelector(toolbars);
            if (bar) { bar.append(button); return; }
        }
        const anchor = wrapper.closest('label') || wrapper;
        anchor.before(button);
    }

    function init(options) {
        adapter = options;
        const globalButton = document.getElementById('openPythonReference');
        globalButton.addEventListener('click', () => open({opener:globalButton}));
        document.addEventListener('focusin', event => {
            if (event.target.matches(sources)) lastField = event.target;
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'F1' || !event.target.matches(sources) || session) return;
            event.preventDefault();
            open({field:event.target});
        });
    }

    return {init, attach, open, close, match, readDrafts, isOpen:() => !!session};
})();
