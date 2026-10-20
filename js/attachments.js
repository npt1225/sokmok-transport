/* ===== Ảnh đính kèm đơn hàng v2 + tiện ích chuyên nghiệp + ghi tỷ giá mỗi ngày ===== */
(function () {
    const safe = f => { try { return f() } catch (e) { console.error(e) } }, PH = {}, FAIL = {}, MX = 6;
    document.head.insertAdjacentHTML('beforeend', '<style>.phg{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.pht{position:relative;width:72px;height:72px;padding:0;overflow:hidden;border-radius:10px;display:grid;place-items:center;cursor:pointer;transition:transform .15s}.pht:hover{transform:scale(1.05)}.pht img{width:100%;height:100%;object-fit:cover;display:block}.phs{width:18px;height:18px;border:2px solid #8a95a5;border-top-color:transparent;border-radius:50%;display:inline-block;animation:phsp .8s linear infinite}@keyframes phsp{to{transform:rotate(360deg)}}.phb{margin-top:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.phm{font-size:12px;opacity:.7}.dn.drg{outline:2px dashed #1f4e9e;outline-offset:3px}.phc{background:#1f4e9e;color:#fff;border-radius:999px;padding:1px 7px;font-size:11px;margin-left:6px;white-space:nowrap}.pht.gl{width:110px;height:110px}.phw{position:relative}.phx{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:rgba(200,16,46,.92);color:#fff;font:700 12px/20px system-ui;text-align:center;cursor:pointer;z-index:2}.phx:hover{background:#8f0a20}.plb{position:fixed;inset:0;z-index:99990;background:rgba(5,8,14,.95);display:flex;flex-direction:column;color:#fff;font:500 14px system-ui,sans-serif;padding-top:env(safe-area-inset-top)}.plt{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;gap:8px}.plt span{display:flex;gap:8px;align-items:center}.plt a,.plt button{color:#fff;background:rgba(255,255,255,.15);border:0;border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer;text-decoration:none}.plm{flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;min-height:0;padding:0 8px 12px}.plm img{max-width:100%;max-height:100%;object-fit:contain;cursor:zoom-in;border-radius:6px}.plm.zm{align-items:flex-start;justify-content:flex-start}.plm.zm img{max-width:none;max-height:none;width:220%;cursor:zoom-out}.pln{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:64px;font-size:30px;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:12px;cursor:pointer}#plp{left:8px}#pln{right:8px}#offb{position:fixed;left:0;right:0;top:0;z-index:99996;background:#c8102e;color:#fff;font:600 13px system-ui,sans-serif;text-align:center;padding:6px;display:none}</style>');
    window.__rh = function () {
        safe(ensureIds); if (typeof OFFLINE !== 'undefined' && OFFLINE) return false; if (!S || !S.cfg || !(S.rate > 0) || !me) return false; const d = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10), R = S.cfg.rates = S.cfg.rates || {};
        if (R[d] === S.rate) return false; R[d] = S.rate; const ks = Object.keys(R).sort(); while (ks.length > 400) delete R[ks.shift()]; return true
    };
    setTimeout(() => safe(() => { if (me && isAd() && window.__rh()) save() }), 4000); setInterval(() => safe(() => { if (me && isAd() && window.__rh()) save() }), 3600000);

    /* nén ảnh: tối đa 1280px, JPEG 70% */
    const comp = file => new Promise((ok, no) => { const im = new Image(), u = URL.createObjectURL(file); im.onload = () => { const k = Math.min(1, 1280 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', .7)) }; im.onerror = () => { URL.revokeObjectURL(u); no(new Error('Không đọc được ảnh (định dạng không hỗ trợ)')) }; im.src = u });
    /* lưu ảnh lên máy chủ và CHỜ kết quả thật (bản cũ bắn rồi quên nên lỗi vẫn tưởng đã lưu) */
    async function up(id, u) { SB_G[id] = () => u; delete SB_REV[id]; const t0 = TOAST_ON; TOAST_ON = false; let ok; try { ok = await sbSend(id) } finally { TOAST_ON = t0 } delete SB_G[id]; if (ok !== true) safe(() => stamp()); return ok === true }
    async function load(ids) { const miss = ids.filter(i => !PH[i]); if (!miss.length || !SB_ON || OFFLINE) return; try { const o = await sbPullKeys(miss); miss.forEach(i => { if (typeof o[i] === 'string' && o[i]) { PH[i] = o[i]; delete FAIL[i] } else FAIL[i] = 1 }) } catch (e) { console.warn(e); miss.forEach(i => FAIL[i] = 1) } }
    const thumbs = ids => ids.map((id, k) => `<div class="phw"><button type="button" class="pht" data-ph="${id}" aria-label="Xem ảnh ${k + 1}">${PH[id] ? `<img src="${PH[id]}" alt="Ảnh ${k + 1}">` : FAIL[id] ? '<span title="Bấm để tải lại">⟳</span>' : '<i class="phs"></i>'}</button>${isAd() ? `<b class="phx" data-del="${id}" title="Xóa ảnh này" role="button" aria-label="Xóa ảnh ${k + 1}">✕</b>` : ''}</div>`).join('');

    /* trình xem ảnh: chuyển ảnh, vuốt, phím mũi tên, phóng to, tải về, xóa */
    function view(r, k, i) {
        let zm = false; const L = () => r.ph || [], o = document.createElement('div'); o.className = 'plb';
        o.innerHTML = '<div class="plt"><b id="plc"></b><span><a id="pld">⬇ Tải về</a>' + (isAd() ? '<button type="button" id="plx">🗑 Xóa</button>' : '') + '<button type="button" id="plq" aria-label="Đóng">✕</button></span></div><button type="button" id="plp" class="pln" aria-label="Ảnh trước">‹</button><div class="plm" id="plm"><img id="pli" alt="Ảnh đơn"></div><button type="button" id="pln" class="pln" aria-label="Ảnh sau">›</button>';
        document.body.appendChild(o); const $$ = s => o.querySelector(s);
        const show = n2 => { const l = L(); k = (n2 + l.length) % l.length; zm = false; $$('#plm').classList.remove('zm'); const s = PH[l[k]] || ''; $$('#pli').src = s; $$('#plc').textContent = (r.k || 'Đơn hàng') + ' · ' + (k + 1) + '/' + l.length; const a = $$('#pld'); a.href = s; a.download = 'don-' + String(r.k || 'anh').replace(/[^\w]+/g, '-') + '-' + (k + 1) + '.jpg'; $$('#plp').style.display = $$('#pln').style.display = l.length > 1 ? '' : 'none' };
        const close = () => { o.remove(); document.removeEventListener('keydown', key) };
        const key = e => { if (e.key === 'Escape') { e.preventDefault(); close() } else if (e.key === 'ArrowLeft') show(k - 1); else if (e.key === 'ArrowRight') show(k + 1) };
        document.addEventListener('keydown', key);
        $$('#plq').onclick = close; $$('#plp').onclick = e => { e.stopPropagation(); show(k - 1) }; $$('#pln').onclick = e => { e.stopPropagation(); show(k + 1) };
        $$('#plm').onclick = e => { if (e.target.id === 'pli') { zm = !zm; $$('#plm').classList.toggle('zm', zm) } else close() };
        let x0 = null; o.ontouchstart = e => { x0 = zm ? null : e.touches[0].clientX }; o.ontouchend = e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) show(k + (dx < 0 ? 1 : -1)); x0 = null };
        const del = $$('#plx'); if (del) del.onclick = () => { if (!confirm('Xóa ảnh này khỏi đơn?')) return; const id = L()[k]; r.ph = L().filter(x => x !== id); if (SB_REV[id] != null && SB_READY && !SB_DEAD) sbPush(id, () => ''); save(); all(); showRow(i); if (!L().length) close(); else show(Math.min(k, L().length - 1)) };
        show(k)
    }

    function box(i) {
        const r = S.rows[i], act = document.querySelector('#md .dlg .act'); if (!r || !act) return; if (!act.querySelector('#cpf')) {[['cpf', '👤 Hồ sơ', () => profile(key(r.k))], ['cqr', '🔳 QR', () => qrBox(r)], ['cbl', '🧾 Bill', () => payBill([r], key(r.k))]].reverse().forEach(([id, tx, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = tx; b.onclick = fn; act.insertBefore(b, act.firstChild) }) } tagUI(r, i, act); const ids = r.ph || []; if (!ids.length && !isAd()) return;
        const bx = document.createElement('div'); bx.className = 'dn'; bx.innerHTML = '<small>Ảnh đính kèm (' + ids.length + '/' + MX + ')</small><div class="phg">' + thumbs(ids) + '</div>' + (isAd() ? '<div class="phb"><button type="button" id="phadd">📷 Thêm ảnh</button><span class="phm" id="phm">Chọn, kéo thả hoặc dán (Ctrl+V) ảnh</span><input type="file" id="phf" accept="image/*" multiple hidden></div>' : ''); act.parentNode.insertBefore(bx, act);
        const g = bx.querySelector('.phg'), redraw = () => { if (document.body.contains(g)) g.innerHTML = thumbs(r.ph || []) }; load(ids).then(redraw);
        bx.onclick = async e => {
            const dx = e.target.closest('[data-del]');
            if (dx) { if (!confirm('Xóa ảnh này khỏi đơn?')) return; const id = dx.dataset.del; r.ph = (r.ph || []).filter(x => x !== id); delete PH[id]; if (SB_REV[id] != null && SB_READY && !SB_DEAD) sbPush(id, () => ''); save(); all(); showRow(i); return }
            const b = e.target.closest('[data-ph]'); if (!b) return; const id = b.dataset.ph;
            if (!PH[id]) { b.innerHTML = '<i class="phs"></i>'; delete FAIL[id]; await load([id]); redraw() }
            if (PH[id]) view(r, (r.ph || []).indexOf(id), i); else toast('err', 'Không tải được ảnh này từ máy chủ (có thể ảnh chưa được lưu thành công trước đó). Bấm lại để thử lần nữa.')
        };
        const add = bx.querySelector('#phadd'); if (!add) return;
        async function put(F) {
            F = [...F].filter(f => /^image\//.test(f.type)); if (!F.length) return; add.disabled = true; const m = bx.querySelector('#phm'); let n2 = 0;
            try {
                for (const f of F) {
                    if ((r.ph || []).length >= MX) { toast('err', 'Tối đa ' + MX + ' ảnh mỗi đơn.'); break }
                    if (!SB_READY || SB_DEAD) { toast('err', 'Chưa kết nối máy chủ nên không lưu được ảnh. Hãy tải lại trang.'); break }
                    m.textContent = 'Đang nén và tải lên ' + (n2 + 1) + '/' + F.length + '…';
                    const u = await comp(f), id = 'ph-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                    if (!await up(id, u)) { toast('err', 'Không lưu được ảnh (' + (SB_ERR || 'lỗi mạng') + '). Số liệu đơn hàng không bị ảnh hưởng. Lỗi 401/403 = Supabase chưa cho phép thêm dòng ph-... vào bảng app_state.'); break }
                    PH[id] = u; (r.ph = r.ph || []).push(id); n2++
                }
            } catch (x) { toast('err', x.message) }
            if (n2) { save(); toast('ok', 'Đã thêm ' + n2 + ' ảnh.') } all(); showRow(i)
        }
        add.onclick = () => bx.querySelector('#phf').click(); bx.querySelector('#phf').onchange = e => put(e.target.files);
        bx.ondragover = e => { e.preventDefault(); bx.classList.add('drg') }; bx.ondragleave = () => bx.classList.remove('drg'); bx.ondrop = e => { e.preventDefault(); bx.classList.remove('drg'); put(e.dataTransfer.files) };
        const onp = e => { if (!document.body.contains(bx)) { document.removeEventListener('paste', onp); return } if (e.clipboardData && e.clipboardData.files.length) { e.preventDefault(); put(e.clipboardData.files) } }; document.addEventListener('paste', onp)
    }
    const _sr = showRow; showRow = function (i) { _sr(i); safe(() => box(i)) };

    /* ===== Mã đơn tự động · thẻ đơn · hồ sơ khách · bảng giá riêng · báo cáo tháng · QR ===== */
    document.head.insertAdjacentHTML('beforeend', `<style>.pfk{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.pfk>div{border:1px solid var(--bd);border-radius:10px;padding:8px}.pfk small{display:block;opacity:.7;font-size:11px}.pfk b{font-size:15px}.pfr{display:flex;justify-content:space-between;gap:8px;padding:8px 6px;border-bottom:1px solid var(--bd);cursor:pointer;font-size:13px}.pfr:hover{background:rgba(127,127,127,.12)}.pfa{display:inline-block;padding:8px 14px;border:1px solid var(--bd);border-radius:10px;text-decoration:none;color:inherit}.mid{display:inline-block;font:600 10.5px/1.6 ui-monospace,Consolas,monospace;opacity:.7;margin-right:6px}.tgc{display:inline-block;background:#fde8d4;color:#8a3b00;border-radius:999px;padding:0 7px;font-size:11px;margin-right:4px;cursor:pointer;white-space:nowrap}@media print{body.mrpp>*:not(.mro){display:none!important}body.mrpp .mro{position:static!important;background:#fff!important;padding:0!important;display:block!important}body.mrpp .mro>div{box-shadow:none!important;max-height:none!important;width:100%!important;overflow:visible!important;color:#000!important}.noprt{display:none!important}}</style>`);
    const TAGS = ['Hỏa tốc', 'Dễ vỡ', 'Có hóa đơn', 'Hàng lạnh', 'Gấp'];
    const cst = () => { const C = cfg(); return C.cust = C.cust || {} };
    const cust = name => cst()[key(name)] || null;
    const seedC = name => { const o = Object.assign({}, cust(name) || {}), k = key(name), C = cfg(); let s = (C.ct && C.ct[name]) || FIXS[fixKey(name)] || null; if (!s) { try { const b = billAll().filter(x => x.s && (x.s.p || x.s.a || x.s.n) && [x.k, ...(x.ks || [])].some(z => key(z) === k)).sort((a, b) => (b.t || 0) - (a.t || 0))[0]; if (b) s = b.s } catch (e) { } } if (s) { if (!o.ph && s.p) o.ph = s.p; if (!o.ad && s.a) o.ad = s.a; if (!o.sn && s.n) o.sn = s.n } return o };
    const seedAll = () => { const C = cfg(); if (C.seedHs) return; const nm = new Set(); Object.values(S.months).forEach(M => (M.rows || []).forEach(r => { if ((r.k || '').trim()) nm.add(key(r.k)) })); nm.forEach(k => { const a = seedC(k), b = cust(k) || {}; if (a.ph || a.ad || a.sn) cst()[k] = Object.assign({}, b, { ph: a.ph || '', ad: a.ad || '', sn: a.sn || '' }) }); C.seedHs = 1; save() };
    const seedT = setInterval(() => { try { if (cfg().seedHs) { clearInterval(seedT); return } if (me && isAd() && (!SB_ON || SB_READY)) { seedAll(); clearInterval(seedT) } } catch (e) { } }, 6000);
    /* mã đơn SM-YYMM-NNN: tự cấp cho đơn chưa có, đơn nhân bản bị trùng sẽ được cấp mã mới; đơn cũ giữ nguyên giá, chỉ đơn MỚI mới nhận giá riêng của khách */
    function ensureIds() {
        try {
            const C = cfg(), legacy = !C.v2, used = new Set(), mx = {}, ms = Object.keys(S.months).sort();
            ms.forEach(m => (S.months[m].rows || []).forEach(r => { if (!r.id) return; if (used.has(r.id)) { r.id = ''; return } used.add(r.id); const q = /^SM-(\d{4})-(\d+)$/.exec(r.id); if (q) mx[q[1]] = Math.max(mx[q[1]] || 0, +q[2]) }));
            ms.forEach(m => { const p = m.slice(2, 4) + m.slice(5, 7); (S.months[m].rows || []).forEach(r => { if (r.id) return; mx[p] = (mx[p] || 0) + 1; r.id = 'SM-' + p + '-' + String(mx[p]).padStart(3, '0'); if (!legacy && r.by === 'KG' && !n(r.pk)) { const c = cust(r.k); if (c && n(c.kgp) > 0) r.pk = n(c.kgp) } }) });
            if (legacy) C.v2 = 1
        } catch (e) { console.error(e) }
    }
    const _all = all; all = function () { safe(ensureIds); return _all.apply(this, arguments) };
    window.__kgp = () => { const e = document.getElementById('ff_k'), h = document.querySelector('#md .dlg h3'), c = e && cust(e.value); return (c && n(c.kgp) > 0 && h && /^Thêm/.test(h.textContent)) ? n(c.kgp) : S.kg };

    /* mã đơn + thẻ + số ảnh ngay trong bảng đơn */
    try {
        const _rt = renderTable; renderTable = function () {
            const x = _rt.apply(this, arguments); safe(() => document.querySelectorAll('tr[data-row]').forEach(tr => {
                const r = S.rows[+tr.dataset.row]; if (!r || tr.querySelector('.mid')) return; const c = r.ph && r.ph.length, td = [...tr.cells].find(t => t.textContent.trim() === String(r.k || '').trim()) || tr.cells[1] || tr.cells[0]; if (!td) return;
                td.insertAdjacentHTML('beforeend', '<div>' + (r.id ? '<span class="mid">' + esc(r.id) + '</span>' : '') + (r.tags || []).map(t => '<span class="tgc" data-t="' + esc(t) + '" title="Bấm để lọc theo thẻ">' + esc(t) + '</span>').join('') + (c ? '<span class="phc" title="' + c + ' ảnh đính kèm">📷 ' + c + '</span>' : '') + '</div>')
            })); return x
        }
    } catch (e) { console.error(e) }
    document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('tr[data-row] .tgc'); if (!c) return; e.stopPropagation(); const q = document.getElementById('q'); if (q) { q.value = c.dataset.t; q.dispatchEvent(new Event('input', { bubbles: true })); q.dispatchEvent(new Event('change', { bubbles: true })) } }, true);

    /* thẻ đơn trong chi tiết đơn */
    function tagUI(r, i, act) {
        const T = r.tags || [], ad = isAd(); if ((!T.length && !ad) || document.querySelector('#md .tgb')) return;
        const d = document.createElement('div'); d.className = 'dn tgb'; d.innerHTML = '<small>Thẻ đơn</small><div style="margin-top:6px">' + T.map(t => `<span class="tgc" data-t="${esc(t)}">${esc(t)}${ad ? ' ✕' : ''}</span>`).join('') + (ad ? `<select id="tgs" style="margin-left:4px"><option value="">+ Thêm thẻ</option>${TAGS.filter(t => !T.includes(t)).map(t => `<option>${esc(t)}</option>`).join('')}<option value="__n">Thẻ khác…</option></select>` : '') + '</div>'; act.parentNode.insertBefore(d, act);
        const set = a => { r.tags = a; save(); all(); showRow(i) };
        d.onclick = e => { const c = e.target.closest('[data-t]'); if (c && ad) set(T.filter(x => x !== c.dataset.t)) };
        const s = d.querySelector('#tgs'); if (s) s.onchange = () => { let v = s.value; if (v === '__n') v = (prompt('Nhập tên thẻ (ngắn gọn):') || '').trim().slice(0, 20); if (v && !T.includes(v)) set(T.concat(v)); else s.value = '' }
    }

    /* hồ sơ khách + bảng giá riêng */
    function custRows(name) { const o = []; Object.keys(S.months).sort().forEach(m => (S.months[m].rows || []).forEach((r, i) => { if (key(r.k) === name) o.push({ r, m, i }) })); return o }
    function goOrder(m, i) { document.querySelectorAll('.rpo,.plb').forEach(e => e.remove()); setMonth(m); all(); try { showTab('don') } catch (e) { } showRow(i) }
    function listOrders(title, hits) { const o = document.createElement('div'); o.className = 'rpo'; o.style.zIndex = 99980; o.innerHTML = `<div><div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">${esc(title)}</h3><button type="button" id="lox">Đóng</button></div>${hits.map(({ r, m, i }) => `<div class="pfr" data-m="${m}" data-i="${i}"><span><b>${esc(r.id || '')}</b> · ${esc(r.k || '')} · ${fd(r.d)}</span><span>${f(fee(r))} đ</span></div>`).join('')}</div>`; document.body.appendChild(o); o.onclick = e => { if (e.target === o || e.target.id === 'lox') { o.remove(); return } const r = e.target.closest('.pfr'); if (r) goOrder(r.dataset.m, +r.dataset.i) } }
    function profile(name) {
        const R = custRows(name), c = seedC(name), ad = isAd(); let rev = 0, paid = 0, debt = 0, kg = 0, m3 = 0, last = ''; const un = [];
        R.forEach(({ r }) => { const v = fee(r), p = pd(r); rev += v; kg += kgT(r); m3 += n(r.m3); if ((r.d || '') > last) last = r.d; if (p === 'yes') paid += v; else if (p === 'no') { debt += v; un.push({ r, v }) } });
        const I = (id, k, lb, tp) => `<label style="display:block;font-size:12px;margin-top:8px">${lb}<input id="${id}" type="${tp || 'text'}" value="${esc(c[k] || '')}" ${ad ? '' : 'readonly'} style="width:100%;padding:7px 8px;margin-top:3px"></label>`;
        const o = document.createElement('div'); o.className = 'rpo'; o.style.zIndex = 99980;
        o.innerHTML = `<div><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h3 style="margin:0">👤 ${esc(name)}</h3><button type="button" id="pfx">Đóng</button></div>
<div class="pfk"><div><small>Số đơn</small><b>${R.length}</b></div><div><small>Doanh số (VND)</small><b>${f(rev)}</b></div><div><small>Đã thu</small><b>${f(paid)}</b></div><div><small>Còn nợ</small><b style="color:${debt ? '#c8201c' : 'inherit'}">${f(debt)}</b></div><div><small>Kg / m³</small><b>${f2(kg)} / ${f2(m3)}</b></div><div><small>Đơn gần nhất</small><b>${last ? fd(last) : '–'}</b></div></div>
${I('pf_ph', 'ph', 'Số điện thoại', 'tel')}${I('pf_ad', 'ad', 'Địa chỉ')}${I('pf_nt', 'nt', 'Ghi chú về khách')}
${I('pf_sn', 'sn', 'Tên trên phiếu giao nhận')}
<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${ad ? '<button type="button" class="p" id="pfs">💾 Lưu hồ sơ</button>' : ''}${c.ph ? `<a href="tel:${esc(c.ph)}" class="pfa">📞 Gọi</a>` : ''}${un.length ? '<button type="button" id="pfn">📋 Sao chép nhắc nợ</button><button type="button" id="pfb">🧾 Bill công nợ (QR)</button>' : ''}</div>
<h4 style="margin:14px 0 6px">Đơn gần đây</h4>${R.slice(-10).reverse().map(({ r, m, i }) => `<div class="pfr" data-m="${m}" data-i="${i}"><span><b>${esc(r.id || '')}</b> · ${fd(r.d)}</span><span>${f(fee(r))} đ · ${PL[pd(r)]}</span></div>`).join('') || '<small>Chưa có đơn.</small>'}</div>`;
        document.body.appendChild(o);
        o.onclick = e => { if (e.target === o || e.target.id === 'pfx') { o.remove(); return } const r = e.target.closest('.pfr'); if (r) goOrder(r.dataset.m, +r.dataset.i) };
        const sv = o.querySelector('#pfs'); if (sv) sv.onclick = () => { const g = s => o.querySelector(s).value.trim(); cst()[name] = Object.assign({}, cst()[name], { ph: g('#pf_ph'), ad: g('#pf_ad'), nt: g('#pf_nt'), sn: g('#pf_sn') }); save(); toast('ok', 'Đã lưu hồ sơ ' + name + '.'); o.remove(); profile(name) };
        const bb = o.querySelector('#pfb'); if (bb) bb.onclick = () => payBill(un.map(x => x.r), name); const nb = o.querySelector('#pfn'); if (nb) nb.onclick = () => copy('Chào ' + name + ', em gửi các đơn còn chưa thanh toán:\n' + un.map(x => '- ' + (x.r.id || '') + ' (' + fd(x.r.d) + '): ' + f(x.v) + ' VND').join('\n') + '\nTổng: ' + f(debt) + ' VND. Nhờ anh/chị thanh toán giúp em, em cảm ơn!')
    }
    function customers() {
        const M = {}; Object.keys(S.months).forEach(m => (S.months[m].rows || []).forEach(r => { const k = key(r.k), a = M[k] = M[k] || { k, n: 0, rev: 0, debt: 0 }, v = fee(r); a.n++; a.rev += v; if (pd(r) === 'no') a.debt += v })); const L = Object.values(M).sort((a, b) => b.rev - a.rev);
        const o = document.createElement('div'); o.className = 'rpo'; o.style.zIndex = 99980; o.innerHTML = `<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="margin:0">👥 Khách hàng (${L.length})</h3><button type="button" id="cux">Đóng</button></div><input type="search" id="cuq" placeholder="Tìm khách…" style="width:100%;padding:8px;margin-bottom:8px"><table><thead><tr><th>Khách</th><th>Đơn</th><th>Doanh số</th><th>Còn nợ</th></tr></thead><tbody id="cub">${L.map(a => `<tr data-c="${esc(a.k)}" style="cursor:pointer"><td>${esc(a.k)}</td><td>${a.n}</td><td>${f(a.rev)}</td><td style="color:${a.debt ? '#c8201c' : 'inherit'}">${f(a.debt)}</td></tr>`).join('')}</tbody></table></div>`; document.body.appendChild(o);
        o.onclick = e => { if (e.target === o || e.target.id === 'cux') { o.remove(); return } const t = e.target.closest('tr[data-c]'); if (t) { o.remove(); profile(t.dataset.c) } };
        o.querySelector('#cuq').oninput = e => { const q = e.target.value.toLowerCase(); o.querySelectorAll('#cub tr').forEach(tr => tr.style.display = tr.dataset.c.toLowerCase().includes(q) ? '' : 'none') }
    }
    /* gợi ý giá riêng khi thêm đơn */
    document.addEventListener('input', e => {
        const t = e.target; if (!t || t.id !== 'ff_k') return; let o = document.getElementById('cphint'); const c = cust(t.value), h = document.querySelector('#md .dlg h3'); if (!c || !h || !/^Thêm/.test(h.textContent)) { if (o) o.remove(); return }
        if (!o) { o = document.createElement('small'); o.id = 'cphint'; o.style.cssText = 'display:block;color:#1f4e9e;margin-top:3px'; t.parentNode.appendChild(o) } const a = []; if (n(c.kgp)) a.push(f(c.kgp) + ' đ/kg'); if (n(c.pm3)) a.push(f2(c.pm3) + ' USD/m³'); o.textContent = a.length ? 'Giá riêng: ' + a.join(' · ') : '';
        const p = document.getElementById('ff_pm3'); if (p && n(c.pm3) && !n(p.value)) { p.value = c.pm3; p.dispatchEvent(new Event('input', { bubbles: true })) }
    });

    /* báo cáo cuối tháng: xem, in / lưu PDF, sao chép gửi Zalo */
    function mreport(m0) {
        const ms = Object.keys(S.months).sort(); let m = m0 || S.cur;
        const D = mm => { const R = (S.months[mm] || {}).rows || [], P = (S.months[mm] || {}).pays || [], o = { n: R.length, kg: 0, m3: 0, rev: 0, paid: 0, free: 0, debt: 0, got: 0, by: {}, un: [] }; R.forEach(r => { const v = fee(r), p = pd(r), k = key(r.k), b = o.by[k] = o.by[k] || { n: 0, kg: 0, rev: 0, debt: 0 }; o.kg += kgT(r); o.m3 += n(r.m3); o.rev += v; b.n++; b.kg += kgT(r); b.rev += v; if (p === 'yes') o.paid += v; else if (p === 'free') o.free += v; else { o.debt += v; b.debt += v; o.un.push({ r, v }) } }); P.forEach(x => o.got += n(x.vnd) + n(x.usd) * S.rate); return o };
        const pc = (a, b) => b ? ((a >= b ? '▲ +' : '▼ ') + ((a - b) / b * 100).toFixed(1) + '%') : '–';
        const o = document.createElement('div'); o.className = 'rpo mro'; o.style.zIndex = 99980;
        o.innerHTML = '<div><div class="noprt" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><select id="mrm">' + ms.slice().reverse().map(k => `<option value="${k}">${esc(mk(k))}</option>`).join('') + '</select><button type="button" class="p" id="mrp">🖨 In / Lưu PDF</button><button type="button" id="mrc">📋 Sao chép</button><button type="button" id="mrx">Đóng</button></div><div id="mrb"></div></div>'; document.body.appendChild(o);
        let cur = null; const draw = () => {
            const A = cur = D(m), i = ms.indexOf(m) - 1, B = i >= 0 ? D(ms[i]) : null, rows = Object.entries(A.by).sort((a, b) => b[1].rev - a[1].rev), ut = A.un.slice().sort((a, b) => b.v - a.v).slice(0, 15), K = (l, v) => `<div><small>${l}</small><b>${v}</b></div>`;
            o.querySelector('#mrm').value = m; o.querySelector('#mrb').innerHTML = `<h2 style="margin:0">Báo cáo ${esc(mk(m))}</h2><small>Sokmok Transport · lập ngày ${fd(today())}</small>
<div class="pfk">${K('Số đơn', A.n)}${K('Doanh số (VND)', f(A.rev))}${K('Đã thu', f(A.paid))}${K('Chưa thu', f(A.debt))}${K('Kg / m³', f2(A.kg) + ' / ' + f2(A.m3))}${K('Tiền đã nhận trong tháng', f(A.got))}</div>
${B ? `<p style="margin:4px 0 10px">So với ${esc(mk(ms[i]))}: doanh số <b>${pc(A.rev, B.rev)}</b>, số đơn <b>${A.n - B.n >= 0 ? '+' : ''}${A.n - B.n}</b>, khối lượng <b>${pc(A.kg, B.kg)}</b>.</p>` : ''}
<h4 style="margin:10px 0 4px">Theo khách hàng</h4><table><thead><tr><th>Khách</th><th>Đơn</th><th>Kg</th><th>Doanh số</th><th>Chưa thu</th></tr></thead><tbody>${rows.map(([k, b]) => `<tr><td>${esc(k)}</td><td>${b.n}</td><td>${f2(b.kg)}</td><td>${f(b.rev)}</td><td>${f(b.debt)}</td></tr>`).join('')}<tr class="sub"><td>Tổng</td><td>${A.n}</td><td>${f2(A.kg)}</td><td>${f(A.rev)}</td><td>${f(A.debt)}</td></tr></tbody></table>
${ut.length ? `<h4 style="margin:12px 0 4px">Đơn chưa thu lớn nhất</h4><table><thead><tr><th>Mã đơn</th><th>Khách</th><th>Ngày về</th><th>Số tiền</th></tr></thead><tbody>${ut.map(({ r, v }) => `<tr><td>${esc(r.id || '')}</td><td>${esc(r.k || '')}</td><td>${fd(r.d)}</td><td>${f(v)}</td></tr>`).join('')}</tbody></table>` : ''}`
        };
        draw(); o.querySelector('#mrm').onchange = e => { m = e.target.value; draw() };
        o.querySelector('#mrx').onclick = () => o.remove();
        o.querySelector('#mrc').onclick = () => { const A = cur; copy('📊 BÁO CÁO ' + mk(m).toUpperCase() + '\nSố đơn: ' + A.n + '\nDoanh số: ' + f(A.rev) + ' VND\nĐã thu: ' + f(A.paid) + ' VND\nChưa thu: ' + f(A.debt) + ' VND\nKhối lượng: ' + f2(A.kg) + ' kg / ' + f2(A.m3) + ' m³\nTop khách: ' + Object.entries(A.by).sort((a, b) => b[1].rev - a[1].rev).slice(0, 3).map(([k, b]) => k + ' (' + f(b.rev) + ')').join(', ')) };
        o.querySelector('#mrp').onclick = () => { document.body.classList.add('mrpp'); const done = () => { document.body.classList.remove('mrpp'); removeEventListener('afterprint', done) }; addEventListener('afterprint', done); window.print() }
    }

    /* mã QR: trên phiếu giao nhận (quét → mở các đơn của phiếu) và tem QR cho từng đơn */
    const baseUrl = () => location.href.split('#')[0];
    function qrDraw(x, text, px, py, sz, ec) { if (!window.qrcode) return false; const q = qrcode(0, ec || 'M'); q.addData(text); q.make(); const c = q.getModuleCount(), cell = Math.max(2, Math.floor(sz / (c + 2))), tot = cell * (c + 2); x.save(); x.fillStyle = '#fff'; x.fillRect(px, py, tot, tot); x.fillStyle = '#000'; for (let r = 0; r < c; r++)for (let k = 0; k < c; k++)if (q.isDark(r, k)) x.fillRect(px + (k + 1) * cell, py + (r + 1) * cell, cell, cell); x.restore(); return true }
    window.__qrp = (x, no, px, py, sz) => safe(() => qrDraw(x, baseUrl() + '#phieu=' + encodeURIComponent(no), px, py, sz));
    (function () { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.async = true; document.head.appendChild(s) })();
    function qrBox(r) {
        ensureIds(); const o = document.createElement('div'); o.className = 'rpo mro'; o.style.zIndex = 99980; o.innerHTML = `<div style="text-align:center;max-width:340px"><h3 style="margin:0 0 8px">${esc(r.id || '')}</h3><canvas id="qrc" width="300" height="300"></canvas><p style="font-size:13px;margin:8px 0">${esc(r.k || '')} · quét để mở nhanh đơn</p><div class="noprt" style="display:flex;gap:8px;justify-content:center"><button type="button" id="qrp">🖨 In tem</button><button type="button" id="qrx">Đóng</button></div></div>`; document.body.appendChild(o);
        const cv = o.querySelector('#qrc'); if (!qrDraw(cv.getContext('2d'), baseUrl() + '#don=' + encodeURIComponent(r.id), 0, 0, 300)) cv.outerHTML = '<p>Chưa tải được thư viện QR (cần có mạng). Thử lại sau vài giây.</p>';
        o.onclick = e => { if (e.target === o || e.target.id === 'qrx') o.remove() }; o.querySelector('#qrp').onclick = () => { document.body.classList.add('mrpp'); const done = () => { document.body.classList.remove('mrpp'); removeEventListener('afterprint', done) }; addEventListener('afterprint', done); window.print() }
    }
    /* quét QR → mở trang → đăng nhập → tự mở đơn / các đơn của phiếu */
    function openHash() {
        const q = /^(don|phieu)=(.+)$/.exec(decodeURIComponent(location.hash.slice(1))); if (!q) return; ensureIds(); const hits = []; Object.keys(S.months).sort().forEach(m => (S.months[m].rows || []).forEach((r, i) => { if (q[1] === 'don' ? r.id === q[2] : String(r.bill || '').trim() === q[2]) hits.push({ r, m, i }) })); history.replaceState(null, '', baseUrl());
        if (!hits.length) toast('err', 'Không tìm thấy ' + (q[1] === 'don' ? 'đơn ' : 'đơn của phiếu ') + q[2] + '.'); else if (hits.length === 1) goOrder(hits[0].m, hits[0].i); else listOrders('Phiếu ' + q[2] + ' (' + hits.length + ' đơn)', hits)
    }
    setInterval(() => safe(() => { if (!/^#(don|phieu)=/.test(location.hash)) return; const a = document.getElementById('app'); if (me && a && !a.classList.contains('hid') && S && S.months) openHash() }), 700);

    /* sao chép tóm tắt đơn để gửi Zalo/khách */
    const sum = r => ['📦 ĐƠN HÀNG – ' + (r.k || '(chưa ghi khách)'), 'Ngày hàng về: ' + fd(r.d), 'Ngày giao: ' + (r.g ? fd(r.g) : 'chưa giao'), 'Số lượng: ' + f2(r.q) + ' ' + (r.u || ''), n(r.kg) ? 'Khối lượng: ' + f2(r.kg) + ' kg' : '', n(r.m3) ? 'Thể tích: ' + f2(r.m3) + ' m³' : '', 'Cước: ' + f(fee(r)) + ' VND' + (isU(r) ? ' (' + f2(r.usd) + ' USD × ' + f(rt(r)) + ')' : ''), 'Thu tiền: ' + PL[pd(r)], r.trip ? 'Chuyến xe: ' + r.trip : '', spl(r).length ? spNote(r) : '', r.note ? 'Ghi chú: ' + r.note : ''].filter(Boolean).join('\n');
    function copy(s) {
        const ok = () => toast('ok', 'Đã sao chép, dán vào Zalo là gửi được.'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, () => old(s)); else old(s);
        function old(s) { const a = document.createElement('textarea'); a.value = s; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok() } catch (e) { toast('err', 'Trình duyệt không cho sao chép.') } a.remove() }
    }
    /* thư viện ảnh của tháng đang xem */
    async function gallery() {
        const items = []; S.rows.forEach((r, i) => (r.ph || []).forEach(id => items.push({ r, i, id }))); if (!items.length) { toast('err', 'Tháng này chưa có đơn nào có ảnh.'); return }
        const o = document.createElement('div'); o.className = 'rpo'; o.innerHTML = '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b>🖼 Thư viện ảnh ' + esc(mk(S.cur)) + ' (' + items.length + ')</b><button type="button" id="glx">Đóng</button></div><div class="phg" id="glg"></div></div>'; document.body.appendChild(o);
        const draw = () => { const g = o.querySelector('#glg'); if (g) g.innerHTML = items.map((x, k) => `<div class="phw"><button type="button" class="pht gl" data-k="${k}" title="${esc(x.r.k)}">${PH[x.id] ? `<img src="${PH[x.id]}" alt="">` : FAIL[x.id] ? '⟳' : '<i class="phs"></i>'}</button></div>`).join('') };
        o.onclick = e => { if (e.target === o || e.target.id === 'glx') { o.remove(); return } const b = e.target.closest('[data-k]'); if (!b) return; const x = items[+b.dataset.k]; if (PH[x.id]) view(x.r, (x.r.ph || []).indexOf(x.id), x.i) };
        draw(); const all2 = items.map(x => x.id); for (let k = 0; k < all2.length; k += 30) { await load(all2.slice(k, k + 30)); if (!document.body.contains(o)) return; draw() }
    }
    const fab = document.getElementById('fab'); if (fab) { fab.insertAdjacentHTML('beforeend', '<button type="button" id="glbtn" title="Thư viện ảnh của tháng đang xem">🖼</button>'); document.getElementById('glbtn').onclick = () => safe(gallery); fab.insertAdjacentHTML('beforeend', '<button type="button" id="cubtn" title="Hồ sơ khách hàng">👥</button><button type="button" id="mrbtn" title="Báo cáo cuối tháng">📑</button>'); document.getElementById('cubtn').onclick = () => safe(customers); document.getElementById('mrbtn').onclick = () => safe(() => mreport()) }
    /* phím tắt: "/" tìm kiếm nhanh, "N" thêm đơn mới */
    document.addEventListener('keydown', e => {
        const t = e.target; if (e.ctrlKey || e.metaKey || e.altKey || (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable))) return; const m = document.getElementById('md'); if ((m && !m.classList.contains('hid')) || document.querySelector('.plb,.rpo')) return;
        if (e.key === '/') { const q = document.getElementById('q'); if (q && q.offsetParent) { e.preventDefault(); q.focus() } } else if (e.key === 'n' || e.key === 'N') { const b = document.getElementById('add'); if (b && b.offsetParent) { e.preventDefault(); b.click() } }
    });

    /* ===== Bill thanh toán có QR: khách quét xem bill trên điện thoại, không cần đăng nhập ===== */
    const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
    const prt = () => { document.body.classList.add('mrpp'); const done = () => { document.body.classList.remove('mrpp'); removeEventListener('afterprint', done) }; addEventListener('afterprint', done); window.print() };
    function billHtml(B, qr) {
        const I = B.i.map(x => ({ id: String(x[0] || ''), d: String(x[1] || ''), q: String(x[2] || ''), v: n(x[3]), s: x[4] })), T = I.reduce((a, x) => a + x.v, 0), P = I.filter(x => x.s === 'yes').reduce((a, x) => a + x.v, 0), U = I.filter(x => x.s === 'no').reduce((a, x) => a + x.v, 0), SL = { yes: 'Đã thu', no: 'Chưa thu', free: 'Không thu' };
        const PB = { yes: 'background:#e6f6ec;color:#15803d', no: 'background:#fdeceb;color:#c8201c', free: 'background:#eef0f4;color:#667085' }, FN = "font-family:'Be Vietnam Pro',system-ui,Arial,sans-serif", fl = 'display:flex;justify-content:space-between;align-items:center;gap:12px';
        const list = I.map((x, k) => `<div style="${fl};padding:12px 0;${k ? 'border-top:1px solid #eceff4' : ''}"><div style="min-width:0"><div style="font-weight:700;font-size:14px">${esc(x.id)}</div><div style="font-size:12px;color:#667085;margin-top:2px">${esc([x.d ? 'Về ' + fd(x.d) : '', x.q].filter(Boolean).join(' · '))}</div></div><div style="text-align:right;flex:none"><div style="font-weight:700;font-size:14px;font-variant-numeric:tabular-nums">${f(x.v)}</div><span style="display:inline-block;margin-top:3px;padding:1px 9px;border-radius:99px;font-size:11px;font-weight:600;${PB[x.s] || PB.no}">${SL[x.s] || SL.no}</span></div></div>`).join('');
        const qrH = qr ? `<div style="margin:18px -22px 0;border-top:2px dashed #d5dae3;padding:16px 22px 2px;display:flex;gap:14px;align-items:center"><canvas id="ttq" width="480" height="480" style="width:116px;height:116px;flex:none;border-radius:8px"></canvas><div style="font-size:13px;line-height:1.5;color:#475467"><b style="color:#1c1f24;display:block;font-size:14px">Xem bill trên điện thoại</b>Quét mã QR để mở bill này, không cần đăng nhập.</div></div>` : '';
        return `<div style="max-width:560px;margin:0 auto;background:#fff;color:#1c1f24;border-radius:18px;overflow:hidden;${FN};font-size:14px;line-height:1.5;box-shadow:0 12px 36px rgba(0,0,0,.2)">
<div style="background:linear-gradient(135deg,#C8201C,#8f1411);color:#fff;padding:20px 60px 18px 22px"><div style="font-size:20px;font-weight:800;letter-spacing:.04em">SOKMOK TRANSPORT</div><div style="font-size:12.5px;opacity:.9;margin-top:3px">Bill thanh toán · ${esc(String(B.n || ''))} · ${esc(String(B.t || ''))}</div></div>
<div style="padding:16px 22px 20px"><div style="font-size:12px;color:#667085">Khách hàng</div><div style="font-size:20px;font-weight:800;margin-bottom:6px">${esc(String(B.k || ''))}</div>
<div style="border-top:2px solid #1c1f24">${list}</div>
${n(B.x) ? `<p style="font-size:12px;color:#667085;margin:6px 0 0">… và ${n(B.x)} đơn khác (không liệt kê hết).</p>` : ''}
<div style="margin-top:10px;border-radius:14px;padding:14px 16px;background:${U ? '#fff3f2' : '#ecf8f1'}"><div style="${fl};font-size:13px;color:#475467"><span>Tổng cước</span><b style="color:#1c1f24">${f(T)}</b></div><div style="${fl};font-size:13px;color:#475467;margin-top:4px"><span>Đã thu</span><b style="color:#15803d">${f(P)}</b></div><div style="border-top:1px dashed ${U ? '#f0b8b5' : '#a9d9bd'};margin:10px 0 8px"></div><div style="${fl}"><span style="font-weight:600">${U ? 'Còn phải thanh toán' : 'Đã thanh toán đủ'}</span><span style="font-weight:800;font-size:${U ? 24 : 20}px;color:${U ? '#c8201c' : '#15803d'};font-variant-numeric:tabular-nums">${U ? f(U) + ' VND' : '✓'}</span></div></div>
${qrH}<p style="text-align:center;font-size:12px;color:#98a2b3;margin:14px 0 0">Cảm ơn quý khách đã sử dụng dịch vụ SOKMOK Transport</p></div></div>` }
    function payBill(rows, name) {
        ensureIds(); if (!rows.length) { toast('err', 'Không có đơn nào để lập bill.'); return }
        const B = { n: 'TT' + Date.now().toString(36).slice(-5).toUpperCase(), k: name, t: fd(today()), i: rows.slice(0, 12).map(r => [r.id || '', r.d || '', f2(r.q) + ' ' + (r.u || ''), Math.round(fee(r)), pd(r)]), x: Math.max(0, rows.length - 12) || undefined }, url = baseUrl() + '#tt=' + b64e(JSON.stringify(B));
        const o = document.createElement('div'); o.className = 'rpo mro'; o.style.zIndex = 99980;
        o.innerHTML = '<div class="bwrap"><button type="button" class="xc xw noprt" aria-label="Đóng" title="Đóng">×</button>' + billHtml(B, true) + '<div class="noprt bact"><button type="button" class="p" id="ttp">🖨 In / Lưu PDF</button><button type="button" id="ttc">🔗 Sao chép link bill</button></div></div>'; document.body.appendChild(o);
        const cv = o.querySelector('#ttq'); try { if (!qrDraw(cv.getContext('2d'), url, 0, 0, 480, 'L')) cv.outerHTML = '<p>Chưa tải được thư viện QR (cần có mạng). Thử lại sau vài giây.</p>' } catch (e) { cv.outerHTML = '<p style="color:#c8201c">Bill quá dài để tạo QR, hãy chọn ít đơn hơn.</p>' }
        o.onclick = e => { if (e.target === o) o.remove() }; o.querySelector('.xw').onclick = () => o.remove(); o.querySelector('#ttp').onclick = prt; o.querySelector('#ttc').onclick = () => copy(url)
    }
    /* trang xem bill công khai (khách quét QR): hiện ngay, không cần đăng nhập, chỉ chứa dữ liệu nằm trong chính link */
    function showPub() {
        const old = document.getElementById('pubbill'); if (old) old.remove(); const m = /^#tt=(.+)$/.exec(location.hash); if (!m) return; let B = null; try { B = JSON.parse(b64d(m[1])) } catch (e) { }
        const o = document.createElement('div'); o.id = 'pubbill'; o.style.cssText = 'position:fixed;inset:0;z-index:100001;background:#eef1f6;overflow:auto;padding:16px;padding-top:max(16px,env(safe-area-inset-top))';
        o.innerHTML = (B && Array.isArray(B.i) ? billHtml(B, false) : '<p style="text-align:center;font:600 16px system-ui">Bill không hợp lệ hoặc link bị cắt bớt.</p>') + '<p style="text-align:center;font:12px system-ui,sans-serif;color:#667085;margin-top:12px">Sokmok Transport · <a href="' + esc(baseUrl()) + '" style="color:#1f4e9e">Mở hệ thống quản trị</a></p>'; document.body.appendChild(o)
    }
    safe(showPub); addEventListener('hashchange', () => safe(showPub));

    /* banner mất mạng + phím Esc đóng hộp thoại */
    const bn = document.createElement('div'); bn.id = 'offb'; bn.setAttribute('role', 'alert'); bn.textContent = '⚠ Mất kết nối mạng: thay đổi có thể chưa được lưu lên máy chủ'; document.body.appendChild(bn);
    const net = () => { bn.style.display = navigator.onLine ? 'none' : 'block' }; addEventListener('offline', net); addEventListener('online', () => { net(); safe(() => toast('ok', 'Đã có mạng trở lại.')) }); net();
    document.addEventListener('keydown', e => { if (e.key !== 'Escape' || document.querySelector('.plb')) return; const m = document.getElementById('md'); if (m && !m.classList.contains('hid')) { const c = document.getElementById('mc'); if (c) c.click() } });
})();
