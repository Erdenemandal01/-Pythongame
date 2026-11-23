(() => {
    const site = location.protocol === 'file:' || window.PQ_CLASSROOM_KIT
        ? 'https://kodyn-nuudel.vercel.app/' : new URL('/', location.href).href;
    let dialog;
    let opener;

    function build() {
        const panel = document.createElement('dialog');
        panel.className = 'device-link-dialog';
        panel.setAttribute('aria-labelledby', 'device-link-title');
        panel.innerHTML = `
            <form method="dialog" class="device-link-heading">
                <h2 id="device-link-title">Өөр компьютерээр нээх</h2>
                <button class="device-link-close" type="submit" aria-label="Хаах">×</button>
            </form>
            <div class="device-link-body">
                <p>Холбоосыг хуулж, нөгөө компьютерийнхээ хөтөч дээр нээгээрэй.</p>
                <label for="device-link-url">Тоглоомын холбоос</label>
                <div class="device-link-controls">
                    <input id="device-link-url" type="url" readonly dir="ltr" spellcheck="false" />
                    <button class="device-link-copy" type="button">Холбоос хуулах</button>
                </div>
                <p class="device-link-status" role="status"></p>
                <p class="device-link-note"></p>
            </div>`;
        const urlInput = panel.querySelector('input');
        const status = panel.querySelector('.device-link-status');
        urlInput.value = site;
        urlInput.addEventListener('focus', () => urlInput.select());
        panel.querySelector('.device-link-note').textContent = location.protocol === 'file:' || window.PQ_CLASSROOM_KIT
            ? 'Офлайн багцын ахицаа зөөхдөө профайлаасаа JSON файлаа татаж аваад нөгөө компьютер дээрээ оруулаарай.'
            : 'Ахицаа үргэлжлүүлэхдээ хоёр компьютер дээр ижил бүртгэлээр нэвтэрнэ. Зочноор тоглосон ахиц тухайн хөтөч дээр хадгалагдана.';
        panel.querySelector('.device-link-copy').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(site);
                status.textContent = 'Холбоос хуулагдлаа.';
                return;
            } catch {
                urlInput.focus();
                urlInput.select();
                urlInput.setSelectionRange(0, site.length);
            }
            let copied = false;
            try { copied = document.execCommand('copy'); } catch { /* The selected URL remains available. */ }
            status.textContent = copied ? 'Холбоос хуулагдлаа.' : 'Холбоос сонгогдлоо. Төхөөрөмжийнхөө «Хуулах» командыг дараарай.';
        });
        panel.addEventListener('close', () => {
            status.textContent = '';
            if (opener?.isConnected) opener.focus({preventScroll:true});
        });
        document.body.append(panel);
        return panel;
    }
    function open(trigger = document.activeElement) {
        dialog ??= build();
        if (dialog.open) return;
        opener = trigger;
        dialog.showModal();
        dialog.querySelector('.device-link-close').focus({preventScroll:true});
    }
    document.addEventListener('click', event => {
        const trigger = event.target.closest?.('[data-open-device]');
        if (trigger) open(trigger);
    });
    window.DeviceLink = {open};
})();
