/* ===== Animation trang chủ: đếm số, mọc cột, phát lại khi đổi tab ===== */
(function () {
    const RM = matchMedia('(prefers-reduced-motion:reduce)');
    const RE = /\d[\d.]*(?:,\d+)?/g;
    const num = s => parseFloat(s.replace(/\./g, '').replace(',', '.'));
    const dec = s => { const m = s.match(/,(\d+)$/); return m ? m[1].length : 0 };
    const fmt = (v, d) => v.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const ease = t => 1 - Math.pow(1 - t, 3);
    const prev = new Map();
    const hero = document.querySelector('header.hero');
    if (hero && !hero.querySelector('.hsh')) { const i = document.createElement('i'); i.className = 'hsh'; hero.appendChild(i) }

    function textNodes(el) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), a = []; while (w.nextNode()) a.push(w.currentNode); return a }
    function vals(b) { const o = []; textNodes(b).forEach(t => (t.nodeValue.match(RE) || []).forEach(x => o.push(num(x)))); return o }

    function count(b, starts) {
        if (RM.matches) return;
        if (b.dataset.final) b.innerHTML = b.dataset.final; else b.dataset.final = b.innerHTML;
        const items = textNodes(b).map(t => { const v = t.nodeValue; const toks = v.match(RE); return toks ? { t, v, parts: v.split(RE), nums: toks.map(num), d: toks.map(dec) } : null }).filter(Boolean);
        if (!items.length) return;
        const t0 = performance.now(), D = 950;
        const step = now => {
            if (!b.isConnected) return;
            const p = Math.min(1, (now - t0) / D), e = ease(p); let j = 0;
            items.forEach(it => {
                if (p >= 1) { it.t.nodeValue = it.v; j += it.nums.length; return }
                let s = it.parts[0];
                it.nums.forEach((x, k) => { const a = starts ? (starts[j] || 0) : 0; s += fmt(a + (x - a) * e, it.d[k]) + it.parts[k + 1]; j++ });
                it.t.nodeValue = s
            });
            if (p < 1) requestAnimationFrame(step)
        };
        requestAnimationFrame(step)
    }

    function cards(box, replay) {
        const playing = replay || !!box.closest('.tp.play');
        box.querySelectorAll('.k').forEach((k, i) => {
            k.style.setProperty('--i', i);
            const b = k.querySelector('b'); if (!b) return;
            const key = box.id + i + '|' + ((k.querySelector('small') || {}).textContent || '');
            if (b.dataset.final) b.innerHTML = b.dataset.final; else b.dataset.final = b.innerHTML;
            const cur = vals(b), old = prev.get(key);
            prev.set(key, cur);
            if (playing || !old) count(b, null);
            else if (old.join() !== cur.join()) { count(b, old); k.classList.remove('flash'); void k.offsetWidth; k.classList.add('flash'); setTimeout(() => k.classList.remove('flash'), 1000) }
        })
    }

    function charts(box, force) {
        const svg = box.querySelector('svg.ch'); if (!svg) return;
        const rects = svg.querySelectorAll('rect');
        const sig = Array.from(rects).map(r => r.getAttribute('height')).join();
        if (!force && box._sig === sig) return;
        box._sig = sig;
        rects.forEach((r, i) => r.style.setProperty('--i', i));
        svg.classList.remove('pl'); void svg.getBoundingClientRect(); svg.classList.add('pl');
        clearTimeout(box._t); box._t = setTimeout(() => svg.classList.remove('pl'), 2200)
    }

    function play(tp) {
        if (RM.matches) return;
        tp.classList.remove('play'); void tp.offsetWidth; tp.classList.add('play');
        tp.querySelectorAll('.cards').forEach(c => cards(c, true));
        tp.querySelectorAll('[id^=ch]').forEach(c => charts(c, true));
        clearTimeout(tp._t); tp._t = setTimeout(() => tp.classList.remove('play'), 2000)
    }

    ['cards', 'lcards', 'ncards'].forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        new MutationObserver(() => cards(el, false)).observe(el, { childList: true })
    });
    ['ch1', 'ch2'].forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        new MutationObserver(() => charts(el, false)).observe(el, { childList: true })
    });
    const tabObs = new MutationObserver(ms => ms.forEach(m => {
        const e = m.target; if (e.classList.contains('hid') || (m.oldValue || '').indexOf('hid') < 0) return;
        if (e.classList.contains('tp')) play(e)
    }));
    document.querySelectorAll('.tp').forEach(tp => tabObs.observe(tp, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));
    const app = document.getElementById('app');
    if (app) new MutationObserver(ms => ms.forEach(m => {
        if (!app.classList.contains('hid') && (m.oldValue || '').indexOf('hid') >= 0) {
            const tp = document.querySelector('.tp:not(.hid)'); if (tp) setTimeout(() => play(tp), 60)
        }
    })).observe(app, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
})();
/* ===== Hiệu ứng động v2: thanh tiến trình cuộn + gợn sóng khi bấm nút ===== */
(function () {
    try {
        if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
        const bar = document.createElement('div'); bar.id = 'spb'; document.body.appendChild(bar);
        let tk = false;
        const upd = () => { tk = false; const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')' };
        addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd) } }, { passive: true }); upd();
        document.addEventListener('pointerdown', e => {
            const b = e.target.closest && e.target.closest('button'); if (!b || b.disabled) return;
            const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement('span');
            d.className = 'rpl'; d.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
            b.appendChild(d); setTimeout(() => d.remove(), 650)
        }, { passive: true })
    } catch (e) { }
})();
