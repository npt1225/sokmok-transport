/* ===== Giao nhiều đợt: 1 đơn có thể đi nhiều xe, nhiều ngày. r.sp = [{g, trip, xe, q, kg, m3, note}] ===== */
function spl(r) { return r && Array.isArray(r.sp) ? r.sp.filter(s => s && (s.g || (s.trip || '').trim() || n(s.q) || n(s.kg) || n(s.m3))) : [] }
function spTrips(r) { const S2 = spl(r); if (S2.length) return [...new Set(S2.map(s => (s.trip || '').trim()).filter(Boolean))]; const t = ((r && r.trip) || '').trim(); return t ? [t] : [] }
/* tỷ lệ cước của từng đợt: theo kg, nếu không có thì theo số lượng, rồi m³, cuối cùng chia đều */
function spShare(r, S2) { S2 = S2 || spl(r); for (const k of ['kg', 'q', 'm3']) { const T = S2.reduce((a, s) => a + n(s[k]), 0); if (T > 0) return S2.map(s => n(s[k]) / T) } return S2.map(() => 1 / S2.length) }
function spNote(r) { const S2 = spl(r); if (!S2.length) return ''; return 'Giao ' + S2.length + ' đợt: ' + S2.map((s, k) => 'Đ' + (k + 1) + ' ' + (s.g ? fd(s.g) : 'chưa rõ ngày') + (s.trip ? ' xe ' + s.trip : '') + (n(s.q) ? ' ' + f2(s.q) + ' ' + (r.u || '') : '') + (n(s.kg) ? ' ' + f2(s.kg) + 'kg' : '') + (s.note ? ' (' + s.note + ')' : '')).join('; ') }
function spDetail(r) { const S2 = spl(r); return S2.map((s, k) => 'Đợt ' + (k + 1) + '/' + S2.length + ' · ' + (s.g ? fd(s.g) : 'chưa rõ ngày') + (s.trip ? ' · xe ' + esc(s.trip) : '') + (n(s.xe) > 1 ? ' (' + f2(s.xe) + ' xe)' : '') + (n(s.q) ? ' · ' + f2(s.q) + ' ' + esc(r.u || '') : '') + (n(s.kg) ? ' · ' + f2(s.kg) + ' kg' : '') + (n(s.m3) ? ' · ' + f2(s.m3) + ' m³' : '') + (s.note ? ' · ' + esc(s.note) : '')).join('<br>') }
function dgCell(r) { const S2 = spl(r); if (!S2.length) return fd(r.g) || '–'; return S2.map((s, k) => `<div class="dlr-d" title="Đợt ${k + 1}/${S2.length}${s.trip ? ' · xe ' + esc(s.trip) : ''}${n(s.q) ? ' · ' + f2(s.q) + ' ' + esc(r.u || '') : ''}"><i>Đ${k + 1}</i>${fd(s.g) || '–'}</div>`).join('') }
function xeSplit(r, v, S2) { const ch = spTrips(r).map(t => `<div class="trip" data-trip="${esc(t)}" style="cursor:pointer" title="Bấm để xem tất cả đơn cùng chuyến xe này">${esc(t)}</div>`).join(''); return (v ? `<b>${f2(v)}</b>` : '<span class="trip sh">chung xe</span>') + ch + `<div class="dlr-n">${S2.length} đợt giao</div>` }
/* Form: khối nhập các đợt giao */
function spWire(init) {
    const fg = md.querySelector('.fg'); if (!fg) return;
    const box = document.createElement('div'); box.className = 'dlx';
    box.innerHTML = '<div class="dlx-h"><b>🚚 Giao nhiều đợt</b><small>Một đơn đi nhiều xe hoặc nhiều ngày: bấm «Thêm đợt giao», mỗi đợt có ngày và xe riêng. Cước vẫn tính 1 lần cho cả đơn. Ngày giao của đơn = ngày đợt cuối.</small></div><div id="dlx-l"></div><div class="dlx-f"><button type="button" id="dlx-add">+ Thêm đợt giao</button><span id="dlx-s"></span></div>';
    fg.after(box);
    const L = $('dlx-l'), fG = $('ff_g'), fT = $('ff_trip'), fX = $('ff_xe');
    const num = v => n(v) ? String(n(v)) : '';
    const addRow = s => {
        s = s || {}; const d = document.createElement('div'); d.className = 'dlr';
        d.innerHTML = `<div class="dlr-t"><b>Đợt <span class="dlr-no"></span></b><button type="button" class="dlr-x" title="Xóa đợt này" aria-label="Xóa đợt này">✕</button></div><div class="dlr-g">
<label>Ngày giao<input type="date" data-f="g" value="${esc(s.g || '')}"></label>
<label>Xe (biển số / mã)<input type="text" data-f="trip" list="tl" value="${esc(s.trip || '')}" placeholder="Vd: 51C-123.45"></label>
<label>Số xe<input type="number" data-f="xe" step="any" min="0" value="${s.xe == null ? 1 : esc(s.xe)}"></label>
<label>Số lượng<input type="number" data-f="q" step="any" min="0" value="${num(s.q)}"></label>
<label>Kg<input type="number" data-f="kg" step="any" min="0" value="${num(s.kg)}"></label>
<label>m³<input type="number" data-f="m3" step="any" min="0" value="${num(s.m3)}"></label>
<label class="w">Ghi chú đợt<input type="text" data-f="note" value="${esc(s.note || '')}"></label></div>`;
        L.appendChild(d); renum(); sync(); return d
    };
    const rows = () => [...L.querySelectorAll('.dlr')];
    const renum = () => rows().forEach((d, i) => { d.querySelector('.dlr-no').textContent = (i + 1) + '/' + rows().length });
    const read = () => rows().map(d => { const o = {}; d.querySelectorAll('[data-f]').forEach(i => { const k = i.dataset.f, v = i.value.trim(); if (v !== '') o[k] = (k === 'g' || k === 'trip' || k === 'note') ? v : n(v) }); return o }).filter(o => o.g || o.trip || o.q || o.kg || o.m3);
    const sync = () => {
        const R = read(), has = R.length > 0;
        [fG, fT, fX].forEach(e => { if (e) e.disabled = has });
        if (has) {
            const ds = R.map(o => o.g).filter(Boolean).sort();
            fG.value = ds.length ? ds[ds.length - 1] : ''; fT.value = [...new Set(R.map(o => (o.trip || '').trim()).filter(Boolean))].join(', ');
            fX.value = effXe([{ sp: R, loai: ($('ff_loai') || {}).value }])[0]
        }
        const T = { q: n(($('ff_q') || {}).value), kg: n(($('ff_kg') || {}).value), m3: n(($('ff_m3') || {}).value) }, N = { q: 'SL', kg: 'kg', m3: 'm³' }, p = [];
        if (has) for (const k of ['q', 'kg', 'm3']) { const u = R.reduce((a, o) => a + n(o[k]), 0); if (u > 0 || T[k] > 0) { const left = T[k] - u; p.push(`${N[k]} ${f2(u)}/${f2(T[k])}` + (T[k] > 0 ? (left < -1e-9 ? ` <span class="bad">(vượt ${f2(-left)})</span>` : left > 1e-9 ? ` (còn ${f2(left)})` : ' ✓') : '')) } }
        $('dlx-s').innerHTML = has ? 'Đã chia: ' + p.join(' · ') : ''
    };
    L.addEventListener('input', sync);
    ['ff_q', 'ff_kg', 'ff_m3', 'ff_loai'].forEach(i => { const e = $(i); if (e) e.addEventListener('input', sync) });
    L.addEventListener('click', e => { const b = e.target.closest('.dlr-x'); if (!b) return; b.closest('.dlr').remove(); renum(); sync() });
    $('dlx-add').onclick = () => {
        if (!rows().length) { addRow({ g: fG.value, trip: fT.value, xe: n(fX.value) || 1 }); addRow({}) } else addRow({});
        const last = rows().pop(); const i = last && last.querySelector('input'); if (i) i.focus()
    };
    const old = spl(init); old.forEach(addRow)
}
/* khi bấm Lưu: gom các đợt, tự tính ngày giao / mã xe / số xe của cả đơn */
function spFinish(o) {
    const R = [...md.querySelectorAll('.dlr')].map(d => { const x = {}; d.querySelectorAll('[data-f]').forEach(i => { const k = i.dataset.f, v = i.value.trim(); if (v !== '') x[k] = (k === 'g' || k === 'trip' || k === 'note') ? v : n(v) }); return x }).filter(x => x.g || x.trip || x.q || x.kg || x.m3);
    if (!R.length) { o.sp = undefined; return true }
    o.sp = R;
    const ds = R.map(x => x.g).filter(Boolean).sort(); o.g = ds.length ? ds[ds.length - 1] : '';
    o.trip = [...new Set(R.map(x => (x.trip || '').trim()).filter(Boolean))].join(', ');
    o.xe = effXe([{ sp: R, loai: o.loai }])[0];
    return true
}
/* Chuyến xe chung: các đơn cùng mã chuyến (trip) chỉ tính 1 xe */
const effXe = rows => { const seen = new Set(); return rows.map(r => { if (r.loai === 'le' || r.loai === 'nho') return 0; const S2 = spl(r); if (S2.length) { let t = 0; S2.forEach(s => { const c = (s.trip || '').trim().toLowerCase(); if (!c) { t += Math.max(1, n(s.xe)); return } if (seen.has(c)) return; seen.add(c); t += Math.max(1, n(s.xe)) }); return t } const k = (r.trip || '').trim().toLowerCase(); if (!k) return n(r.xe); if (seen.has(k)) return 0; seen.add(k); return Math.max(1, n(r.xe)) }) };
const xeCell = (r, v) => { const S2 = spl(r); if (S2.length) return xeSplit(r, v, S2); const t = (r.trip || '').trim(); if (!t) return n(v) ? f2(v) : '<span class="zr">–</span>'; return (v ? `<b>${f2(v)}</b>` : '<span class="trip sh">chung xe</span>') + `<div class="trip" data-trip="${esc(t)}" style="cursor:pointer" title="Bấm để xem tất cả đơn cùng chuyến xe này">${esc(t)}</div>` };
const fd = d => d ? d.split('-').reverse().join('/') : '';
const BY = { KG: 'Theo kg', VND: 'VND', USD: 'USD', M3: 'Theo khối' };
const IE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ID = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
/* ===== Phân trang bảng đơn hàng ===== */
const PG = { p: 1, size: 50, sig: '' };
try { const v = localStorage.getItem('bc-pgsize'); if (v !== null && ['25', '50', '100', '200', '0'].includes(v)) PG.size = +v } catch (e) { }
function pagerHtml(tot, pages, off, shown) {
    if (tot <= 25) return '';
    const b = (a, l, dis, t) => `<button type="button" data-pg="${a}" title="${t}" aria-label="${t}"${dis ? ' disabled' : ''}>${l}</button>`;
    return `<span class="pgi">Dòng <b>${tot ? off + 1 : 0}–${off + shown}</b> / ${tot}</span>`
        + `<span class="pgb">${b('first', '«', PG.p <= 1, 'Trang đầu')}${b('prev', '‹', PG.p <= 1, 'Trang trước')}<span class="pgn">Trang <b>${PG.p}</b>/${pages}</span>${b('next', '›', PG.p >= pages, 'Trang sau')}${b('last', '»', PG.p >= pages, 'Trang cuối')}</span>`
        + `<label class="pgs">Hiện <select class="pgsz">${[[25, '25'], [50, '50'], [100, '100'], [200, '200'], [0, 'Tất cả']].map(o => `<option value="${o[0]}"${PG.size === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select> dòng</label>`
}
document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.pgx button[data-pg]'); if (!b || b.disabled) return;
    const a = b.dataset.pg, pages = PG.size ? Math.max(1, Math.ceil(view().length / PG.size)) : 1;
    PG.p = a === 'first' ? 1 : a === 'prev' ? PG.p - 1 : a === 'next' ? PG.p + 1 : pages;
    renderTable(); const w = document.querySelector('#tp-don .wrap'); if (w) w.scrollIntoView({ block: 'start', behavior: 'smooth' })
});
document.addEventListener('change', e => {
    const s = e.target.closest && e.target.closest('.pgx .pgsz'); if (!s) return;
    PG.size = +s.value; PG.p = 1; try { localStorage.setItem('bc-pgsize', String(PG.size)) } catch (e2) { }
    renderTable()
});
function renderTable() {
    const ix = view(), XE = effXe(ix.map(i => S.rows[i]));
    const sig = ['q', 'fc', 'ftrip', 'fp', 'df', 'd1', 'd2', 'so'].map(id => ($(id) || {}).value || '').join('|');
    if (sig !== PG.sig) { PG.sig = sig; PG.p = 1 }
    const PS = PG.size, pages = PS ? Math.max(1, Math.ceil(ix.length / PS)) : 1;
    PG.p = Math.min(Math.max(1, PG.p), pages);
    const off = PS ? (PG.p - 1) * PS : 0, pageIx = PS ? ix.slice(off, off + PS) : ix;
    let h = '<thead><tr>' + ['STT', 'Ngày giao', 'Khách', 'Thu tiền', 'Ngày hàng về', 'SL', 'Đơn vị', 'Kg', 'm³', 'Cước VND', 'Cước USD', 'Tính theo', 'Số xe', 'Số đơn', 'Ghi chú', 'Thao tác'].map(t => `<th>${t}</th>`).join('') + '</tr></thead><tbody>';
    let no = off;
    for (const i of pageIx) {
        const r = S.rows[i]; no++;
        const Z = '<span class="zr">–</span>', zz = v => n(v) ? f2(v) : Z;
        const vn = isU(r) ? (fee(r) ? `<span title="Tỷ giá ${f(rt(r))} VND/USD">${f(fee(r))}</span>` : Z) : r.by === 'KG' ? (fee(r) ? f(fee(r)) : Z) : !n(r.vnd) ? Z : `<span>${f(n(r.vnd))}</span>`;
        const us = isU(r) ? (!n(r.usd) ? Z : `<span>${f2(r.usd)}</span><div style="font-size:11px;opacity:.65" title="Tỷ giá lúc nhập đơn">× ${f(rt(r))}</div>`) : fee(r) && rt(r) ? `<span style="opacity:.7" title="Quy đổi theo tỷ giá ${f(rt(r))}">≈ ${f2(fee(r) / rt(r))}</span>` : !n(r.usd) ? Z : `<span class="mu">${f2(r.usd)}</span>`;
        h += `<tr class="c${cl(r.k)}" data-row="${i}"><td class="stt">${no}</td><td>${dgCell(r)}</td><td><b>${esc(r.k)}</b></td><td><span class="pill pill-${pd(r)}">${PL[pd(r)]}</span></td><td>${fd(r.d) || '–'}</td><td class="num">${f2(r.q)}</td><td>${esc(r.u)}</td><td class="num">${zz(r.kg)}</td><td class="num">${zz(r.m3)}</td><td class="num">${vn}</td><td class="num">${us}</td><td>${BY[r.by] || esc(r.by)}</td><td class="num">${r.loai === 'le' ? '<span class="pill pill-free">Hỏa tốc</span>' : r.loai === 'nho' ? '<span class="pill pill-free">Kiện nhỏ</span>' : xeCell(r, XE[no - 1])}</td><td class="num">${zz(r.don)}</td><td class="nt" title="${esc(r.note)}">${esc(r.note)}</td><td><div class="ed"><button class="ib" data-edit="${i}" title="Sửa" aria-label="Sửa">${IE}</button><button class="ib dl" data-del="${i}" title="Xóa" aria-label="Xóa dòng">${ID}</button></div></td></tr>`
    }
    if (!ix.length) h += '<tr><td colspan="16" style="padding:14px;color:var(--mu)">Không có dòng nào khớp. Đổi bộ lọc hoặc bấm Thêm đơn hàng.</td></tr>';
    let ft = '';
    if (ix.length) {
        const R = ix.map(i => S.rows[i]), sm = k => R.reduce((a, r) => a + n(r[k]), 0), un = {};
        R.forEach(r => { const u = (r.u || '').trim() || 'khác'; un[u] = (un[u] || 0) + n(r.q) });
        const ub = Object.entries(un).map(([u, v]) => f2(v) + ' ' + u).join(', ');
        const uo = r => isU(r) ? n(r.usd) : rt(r) ? fee(r) / rt(r) : 0, PD = R.filter(r => pd(r) === 'yes'), NP = R.filter(r => pd(r) === 'no');
        const tv = R.reduce((a, r) => a + fee(r), 0), tu = R.reduce((a, r) => a + uo(r), 0);
        const pv = PD.reduce((a, r) => a + fee(r), 0), pu = PD.reduce((a, r) => a + uo(r), 0), nv = NP.reduce((a, r) => a + fee(r), 0), nu = NP.reduce((a, r) => a + uo(r), 0);
        const sub = (l, v) => `<div style="font-size:11.5px;font-weight:500;opacity:.85;white-space:nowrap">${l} ${v}</div>`;
        ft = `<tfoot><tr><td colspan="5">Tổng ${R.length} dòng${ix.length < S.rows.length ? ' (đang lọc)' : ''}${Object.keys(un).length > 1 ? `<div style="font-size:12px;font-weight:400;opacity:.8">${esc(ub)}</div>` : ''}</td><td class="num" title="${esc(ub)}">${f2(sm('q'))}</td><td title="${esc(ub)}">${Object.keys(un).length === 1 ? esc(Object.keys(un)[0]) : ''}</td><td class="num">${f(R.reduce((a, r) => a + kgT(r), 0))}${R.some(r => kgK(r)) ? sub('Không gồm', f(R.reduce((a, r) => a + kgK(r), 0)) + ' (khối)') : ''}</td><td class="num">${f2(sm('m3'))}</td><td class="num">${f(tv)}${sub('Đã thu', f(pv))}${sub('Chưa thu', f(nv))}</td><td class="num">${f2(tu)}${sub('Đã thu', f2(pu))}${sub('Chưa thu', f2(nu))}</td><td></td><td class="num">${f(XE.reduce((a, b) => a + b, 0))}</td><td class="num">${f(sm('don'))}</td><td colspan="2"></td></tr></tfoot>`
    }
    $('tb').innerHTML = h + '</tbody>' + ft;
    document.querySelectorAll('.pgx').forEach(el => { el.innerHTML = pagerHtml(ix.length, pages, off, pageIx.length) });
    applyRO()
}

function updateSpans() { S.rows.forEach((r, i) => { const e = $('fv' + i); if (e) e.textContent = f(fee(r)) }) }

function stats() {
    const R = S.rows; let vnd = 0, usd = 0;
    R.forEach(r => { vnd += fee(r) });
    const tot = vnd;
    const yes = R.filter(r => pd(r) === 'yes'), no = R.filter(r => pd(r) === 'no'), le = R.filter(r => r.loai === 'le'), nho = R.filter(r => r.loai === 'nho');
    let pv = 0, pu = 0; yes.forEach(r => { pv += fee(r) });
    const pt = pv;
    const sum = k => R.reduce((a, r) => a + n(r[k]), 0);
    const kgm = R.filter(r => r.by === 'KG').reduce((a, r) => a + n(r.kg), 0);
    const left = no.reduce((a, r) => a + fee(r), 0);
    const curr = A => { const v = A.reduce((a, r) => a + (!isU(r) ? fee(r) : 0), 0), u = A.reduce((a, r) => a + (isU(r) ? n(r.usd) : 0), 0), p = []; if (v) p.push(f(v) + ' VND'); if (u) p.push(f2(u) + ' USD'); return p.length ? p.join(' + ') : '0 VND' };
    const card = (t, v, s, c) => `<div class="k ${c || ''}"><small>${t}</small><b>${v}</b>${s ? `<div class="s">${s}</div>` : ''}</div>`;
    $('cards').innerHTML =
        card('Tổng doanh số (quy đổi VND)', f(tot), momDelta(tot), 'big') +
        card('Đã thu (quy đổi VND)', f(pt), 'Theo cột Thu tiền') +
        card('Còn phải thu', `<span class="${left > 0 ? 'neg' : ''}">${f(left)}</span>`, 'Tổng các đơn chưa thu') +
        card('Đơn đã thu', `<span class="ok">${yes.length} đơn</span>`, `${f(yes.reduce((a, r) => a + fee(r), 0))} VND, theo cột Thu tiền`) +
        card('Đơn chưa thu', `<span class="${no.length ? 'neg' : ''}">${no.length} đơn</span>`, `${f(no.reduce((a, r) => a + fee(r), 0))} VND, theo cột Thu tiền`) +
        card('Số xe / số đơn', `${f(effXe(R).reduce((a, b) => a + b, 0))} / ${f(sum('don'))}`, 'Đơn cùng chuyến xe chung chỉ tính 1 xe. Số đơn gồm cả hỏa tốc và kiện nhỏ') +
        card('Đơn hỏa tốc', `${le.length} đơn`, `${curr(le)}, ${f(le.reduce((a, r) => a + n(r.q), 0))} kiện, không tính vào số xe`) +
        card('Đơn kiện nhỏ', `${nho.length} đơn`, `${curr(nho)}, ${f(nho.reduce((a, r) => a + n(r.q), 0))} kiện, không tính vào số xe`) +
        card('Tổng số lượng', f(sum('q')), 'thùng, bao, kiện') +
        card('Tổng khối lượng', f(R.reduce((a, r) => a + kgT(r), 0)) + ' kg', R.some(r => kgK(r)) ? `Không gồm ${f(R.reduce((a, r) => a + kgK(r), 0))} kg hàng tính theo khối (đã tính theo m³)` : 'Hàng tính theo kg') +
        card('Tổng thể tích', f2(sum('m3')) + ' m³');
    // theo khách
    const g = {}; R.forEach(r => { const k = key(r.k); (g[k] = g[k] || { k, c: cl(r.k), n: 0, q: 0, kg: 0, m3: 0, rev: 0, unp: 0 }); const o = g[k]; o.n++; o.q += n(r.q); o.kg += kgT(r); o.m3 += n(r.m3); o.rev += fee(r); if (pd(r) === 'no') o.unp += fee(r) });
    const L = Object.values(g).sort((a, b) => b.rev - a.rev), mx = Math.max(1, ...L.map(o => o.rev));
    let h = '<thead><tr><th>Khách</th><th>Số dòng</th><th>Số lượng</th><th>Kg</th><th>m³</th><th>Doanh số (VND)</th><th>Chưa thu (VND)</th><th>Tỷ trọng</th><th style="min-width:140px"></th></tr></thead><tbody>';
    for (const o of L) h += `<tr><td><span class="sw b${o.c}"></span><button class="lk" data-cust="${esc(o.k)}" title="Xem đơn hàng của khách này">${esc(o.k)}</button></td><td class="num">${o.n}</td><td class="num">${f(o.q)}</td><td class="num">${f(o.kg)}</td><td class="num">${f2(o.m3)}</td><td class="num">${f(o.rev)}</td><td class="num ${o.unp ? 'neg' : ''}">${f(o.unp)}</td><td class="num">${tot ? (o.rev / tot * 100).toFixed(1) : 0}%</td><td><div class="bar b${o.c}" style="width:${o.rev / mx * 100}%"></div></td></tr>`;
    $('cust').innerHTML = h + `</tbody><tfoot><tr><td>Tổng</td><td class="num">${R.length}</td><td class="num">${f(sum('q'))}</td><td class="num">${f(R.reduce((a, r) => a + kgT(r), 0))}</td><td class="num">${f2(sum('m3'))}</td><td class="num">${f(tot)}</td><td class="num">${f(no.reduce((a, r) => a + fee(r), 0))}</td><td></td><td></td></tr></tfoot>`;
    const sel = $('fc'), cur = sel.value;
    sel.innerHTML = '<option value="">Tất cả khách</option>' + Object.keys(g).sort().map(k => `<option ${k === cur ? 'selected' : ''}>${esc(k)}</option>`).join('');
    const ts = $('ftrip'), tcur = ts.value, tm = {};
    S.rows.forEach(r => { spTrips(r).forEach(t => (tm[t] = tm[t] || new Set()).add(key(r.k))) });
    ts.innerHTML = '<option value="">Tất cả chuyến xe</option>' + Object.keys(tm).sort().map(t => `<option value="${esc(t)}" ${t === tcur ? 'selected' : ''}>Xe ${esc(t)} (${[...tm[t]].map(x => esc(x.replace(/^(anh|chị|chú|cô|bác)\s+/i, ''))).join(' + ')})</option>`).join('');
    updateSpans()
}

function renderPay() {
    let h = '<thead><tr><th>STT</th><th>Ngày thu</th><th>Người thu</th><th>Tiền Việt (VND)</th><th>Đô (USD)</th><th>Quy đổi (VND)</th><th>Ghi chú</th><th>Thao tác</th></tr></thead><tbody>';
    S.pays.forEach((p, i) => {
        h += `<tr data-prow="${i}"><td class="stt">${i + 1}</td><td>${fd(p.d) || '–'}</td><td><b>${esc(p.w)}</b></td><td class="num">${f(n(p.vnd))}</td><td class="num">${f2(p.usd)}</td><td class="num">${f(n(p.vnd) + n(p.usd) * S.rate)}</td><td class="nt" title="${esc(p.note)}">${esc(p.note)}</td><td><div class="ed"><button class="ib" data-editp="${i}" title="Sửa" aria-label="Sửa">${IE}</button><button class="ib dl" data-delp="${i}" title="Xóa" aria-label="Xóa khoản thu">${ID}</button></div></td></tr>`
    });
    if (!S.pays.length) h += '<tr><td colspan="8" style="padding:14px;color:var(--mu)">Chưa có khoản thu nào.</td></tr>';
    const a = S.pays.reduce((s, p) => s + n(p.vnd), 0), b = S.pays.reduce((s, p) => s + n(p.usd), 0);
    $('pay').innerHTML = h + `</tbody><tfoot><tr><td colspan="3">Tổng đã thu</td><td class="num">${f(a)}</td><td class="num">${f2(b)}</td><td class="num">${f(a + b * S.rate)}</td><td colspan="2"></td></tr></tfoot>`; applyRO()
}
