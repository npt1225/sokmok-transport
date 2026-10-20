/* ---- Phiếu giao nhận ---- */
const dcfg = () => ({ no: 599, ct: { 'Anh Nghĩa': { n: 'Nghĩa', p: '0919 068 131', a: 'Công ty XNK Thảo Uyên' }, 'Anh Triết': { n: 'Triết', p: '+855 97 948 3388', a: 'Phnom Penh, Campuchia' } }, rv: { 'Anh Nghĩa': 'Anh Triết', 'Anh Trọng': 'Anh Triết' } });
const cfg = () => S.cfg || (S.cfg = dcfg());
/* Hồ sơ cố định: đơn anh Nghĩa / anh Trọng luôn gửi cho anh Triết (Phnom Penh) */
const TRIET = { n: 'Triết', p: '+855 97 948 3388', a: 'Phnom Penh, Campuchia' };
const HEANG = { n: 'Mr Heang', p: '077 743 360', a: 'Russian Federation Blvd 110, Toul Kouk, Phnom Penh, Cambodia, 120404' };
const FIXS = { 'nghĩa': { n: 'Nghĩa', p: '0919 068 131', a: 'Công ty XNK Thảo Uyên' }, 'trọng': { n: 'Trọng', p: '', a: '' }, 'chả cá': { n: 'Mr. Tú', p: '', a: 'CÔNG TY TNHH MỘT THÀNH VIÊN SANNADLE' } };
const FIXR = { 'nghĩa': ['Anh Triết', TRIET], 'trọng': ['Anh Triết', TRIET], 'chả cá': ['Mr Heang', HEANG] };
const fixKey = k => { k = (k || '').toLowerCase(); return k.includes('nghĩa') ? 'nghĩa' : k.includes('trọng') ? 'trọng' : k.includes('chả cá') ? 'chả cá' : '' };
const fixSender = (k, c) => { const m = fixKey(k); if (!m) return c; const F = FIXS[m]; return { g: (c && c.g) || F.g || '', n: F.n, p: F.p, a: F.a || (c && c.a) || '' } };
const isTriet = k => (k || '').toLowerCase().includes('triết');
const fixRecv = k => { k = (k || '').trim().toLowerCase(); return isTriet(k) ? TRIET : k.includes('heang') ? HEANG : null };
const bRows = () => Object.keys(S.months).sort().flatMap(m => S.months[m].rows.map((r, i) => ({ r, m, i })));
const dm = d => d ? d.split('-').reverse().join('-') : '';
const en = v => Math.round(v).toLocaleString('en-US');
const bVnd = r => r.by === 'M3' ? n(r.m3) * n(r.pm3) * (n(r.rate) || S.rate) : r.by !== 'VND' && n(r.kg) ? n(r.kg) * (n(r.pk) || S.kg) : fee(r);
const bUsd = r => S.rate ? bVnd(r) / S.rate : 0;
const r2 = v => String(Math.round(n(v) * 100) / 100);
const today = () => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0') };
const ru = u => { const v = parseFloat(String(u == null ? '' : u).replace(/,/g, '')); return isFinite(v) && Math.round(v) ? en(v) : '' };
const strip = k => k.replace(/^(anh|chị|chú|cô|bác)\s+/i, '');
const snap = r => ({ by: r.by, pm3: r.pm3 || 0, desc: r.desc || '', d: r.d, q: r.q, u: r.u, kg: r.kg, m3: r.m3, f: Math.round(bVnd(r)), usd: bUsd(r) });
const bUnits = rows => { const u = {}; rows.forEach(r => { const k = (r.u || '').trim() || 'kiện'; u[k] = (u[k] || 0) + n(r.q) }); return Object.entries(u).map(([k, v]) => f2(v) + ' ' + k).join(' + ') || '0' };
const bWeight = rows => { const kg = rows.reduce((a, r) => a + n(r.kg), 0), m3 = rows.reduce((a, r) => a + n(r.m3), 0); return kg ? f2(kg) + ' kg' : m3 ? f2(m3) + ' m³' : '–' };
/* tất cả phiếu: phiếu đã lưu + phiếu cũ chỉ còn dấu trên đơn hàng (dựng lại) */
function billAll() {
    const C = cfg(); C.bills = C.bills || [];
    const have = new Set(C.bills.map(b => b.no)), g = {};
    bRows().forEach(x => { const b = (x.r.bill || '').trim(); if (b && !have.has(b)) (g[b] = g[b] || []).push(x.r) });
    const old = Object.entries(g).map(([no, rs]) => {
        const k = (rs[0].k || '').trim(), rk = C.rv[k] || '';
        const s = C.ct[k] || { n: strip(k), p: '', a: '' }, r = C.ct[rk] || { n: strip(rk), p: '', a: '' }, sn = rs.map(snap);
        return { no, dt: '', k, rk, s, r, rows: sn.slice(0, 5), v: en(sn.reduce((a, x) => a + x.f, 0)), u: ru(sn.reduce((a, x) => a + x.usd, 0)), veh: ((rs.find(r => r.trip) || {}).trip || '').trim(), old: 1, t: 0 }
    });
    return [...C.bills, ...old].sort((a, b) => (b.t || 0) - (a.t || 0) || b.no.localeCompare(a.no, 'vi', { numeric: true }))
}
function billBadge() { try { const e = $('bn'); if (!e) return; const k = billAll().length; e.textContent = k; e.hidden = !k } catch (x) { } }
function billList() {
    const ad = isAd(); let L = billAll();
    md.innerHTML = `<div class="dlg" style="max-width:720px"><h3>Phiếu giao nhận đã lập (${L.length})</h3>
        <input type="search" id="bq" placeholder="Tìm theo số phiếu, khách, người nhận…" style="width:100%;margin-bottom:10px;padding:8px 9px">
        <div id="bli"></div><div class="act"><button type="button" id="mc">Đóng</button></div></div>`;
    md.classList.remove('hid'); const close = () => { md.classList.add('hid'); md.innerHTML = '' };
    $('mc').onclick = close; md.onclick = e => { if (e.target === md) close() };
    const draw = () => {
        const q = ($('bq').value || '').trim().toLowerCase();
        const V = L.filter(b => !q || [b.no, b.k, b.rk, b.veh, b.s && b.s.n, b.r && b.r.n].join(' ').toLowerCase().includes(q));
        $('bli').innerHTML = V.map(b => `<div class="bcard"><div><div class="bh"><b>${esc(b.no)}</b><span>${b.dt ? fd(b.dt) : 'chưa rõ ngày'}</span>${vBadge(b, L)}${b.old ? '<span class="bdg" title="Phiếu lập trước khi có chức năng lưu phiếu, nội dung dựng lại từ các đơn hàng đã gắn số phiếu">dựng lại từ đơn hàng</span>' : ''}</div>
            <div class="bm">${esc((b.s && b.s.n) || b.k)} → ${esc((b.r && b.r.n) || '?')}</div>
            <div class="bs">${b.rows.length} dòng · ${esc(bUnits(b.rows))} · ${esc(bWeight(b.rows))}</div>
            <div class="bv">${esc(b.v && b.v !== '0' ? b.v + ' VND' : '')}${ru(b.u) ? ' · ' + esc(ru(b.u)) + ' USD' : ''}</div></div>
            <div class="ba"><button class="p" data-vw="${esc(b.no)}">Xem / In</button>${ad ? `<button data-ed="${esc(b.no)}">Sửa</button>` : ''}${ad ? `<button class="d" data-dl="${esc(b.no)}">Xóa</button>` : ''}</div></div>`).join('') || `<p class="hint">${L.length ? 'Không có phiếu nào khớp.' : 'Chưa có phiếu nào. Bấm «Tạo phiếu giao nhận» để lập phiếu đầu tiên.'}</p>`
    };
    draw(); $('bq').oninput = draw;
    $('bli').onclick = async e => {
        const v = e.target.closest('[data-vw]'), d = e.target.closest('[data-dl]'), ed = e.target.closest('[data-ed]');
        if (v) { const b = L.find(x => x.no === v.dataset.vw); if (b) { close(); showBill(b) } }
        if (ed && ad) { const b = L.find(x => x.no === ed.dataset.ed); if (b) { close(); billForm(b) } }
        if (d) {
            const no = d.dataset.dl, C = cfg();
            if (!await ask(`Xóa phiếu <b>${esc(no)}</b>? Các đơn hàng trong phiếu sẽ được mở lại để lập phiếu khác.`, 'Xóa phiếu')) { billList(); return }
            C.bills = (C.bills || []).filter(x => x.no !== no); bRows().forEach(x => { if (x.r.bill === no) delete x.r.bill });
            save(); all(); billList()
        }
    }
}
function billForm(edit) {
    const C = cfg(), A = bRows(); C.bills = C.bills || [];
    const names = [...new Set([...A.map(x => (x.r.k || '').trim()).filter(Boolean), ...Object.keys(C.ct)])].sort();
    const L = (id, l, v, w, ex) => `<label class="f${w ? ' w' : ''}">${l}<input id="${id}" value="${esc(v)}" ${ex || ''}></label>`;
    const E = edit || null, es = E ? E.s || {} : {}, er = E ? E.r || {} : {};
    md.innerHTML = `<form class="dlg" style="max-width:760px"><h3>${E ? 'Sửa phiếu ' + esc(E.no) : 'Tạo phiếu giao nhận'}</h3>
        <div class="btabs"><button type="button" data-m="0">Từ đơn hàng</button><button type="button" data-m="1">Nhập tay (không theo đơn hàng)</button></div><div class="fg">
        <label class="f w" id="bml">Tháng<select id="bmo"></select></label>
        <div class="w" id="bsl1"><div class="bph"><b>Người gửi (bấm chọn 1 hoặc nhiều người)</b><span class="bpc" id="bsc"></span></div><div id="bss" class="schips"></div><div class="bsel-hint">Hiện đơn hàng của tất cả người đã chọn trong tháng này. Trên phiếu sẽ ghi tên các người gửi cách nhau bằng dấu &amp;.</div></div>
        <label class="f w" id="bsl2">Khách gửi (gõ tên hoặc chọn; nhiều người thì cách nhau dấu phẩy)<input id="bs" list="bkl" autocomplete="off" value="${E && E.mo ? esc((E.ks && E.ks.length ? E.ks : [E.k]).join(', ')) : ''}"></label>
        <div class="w" id="bpk"><div class="bph"><b>Chọn đơn hàng đưa vào phiếu</b><span class="bpc" id="bcn"></span>
            <span class="bpb"><button type="button" id="bua">Chọn đơn chưa lập phiếu</button><button type="button" id="bun">Bỏ chọn hết</button></span></div>
            <div class="bsel-hint" style="margin:-2px 0 6px">Xếp theo thứ tự: đơn chưa thu cũ nhất lên đầu (kể cả đơn đã lập phiếu), đơn đã thu nằm cuối.</div><div id="bl" class="bpl"></div></div>
        <div class="w" id="bmw"><div class="bph"><b>Dòng hàng nhập tay</b><span class="bpc" id="bmc"></span>
            <span class="bpb"><button type="button" id="bma">+ Thêm dòng</button></span></div>
            <div id="bm"></div></div>
        <div class="w"><div class="bps" id="bsm"></div><p class="hint" id="bw"></p></div>
        ${L('bno', 'Số phiếu', E ? E.no : 'TNK-' + (C.no + 1))}${L('bdt', 'Ngày', E && E.dt ? E.dt : today(), 0, 'type="date"')}
        <label class="f">Mr / Ms người gửi<select id="bsg">${['', 'Mr', 'Ms'].map(o => `<option value="${o}"${(es.g || '') === o ? ' selected' : ''}>${o || '— (không ghi)'}</option>`).join('')}</select></label>${L('bsn', 'Người gửi', es.n || '')}${L('bsp', 'SĐT người gửi', es.p || '')}${L('bsa', 'Địa chỉ người gửi', es.a || '', 1)}
        ${L('brk', 'Khách nhận (gõ hoặc chọn)', E ? E.rk || '' : '', 1, 'list="bkl" autocomplete="off"')}<label class="f">Mr / Ms người nhận<select id="brg">${['', 'Mr', 'Ms'].map(o => `<option value="${o}"${(er.g || '') === o ? ' selected' : ''}>${o || '— (không ghi)'}</option>`).join('')}</select></label>${L('brn', 'Người nhận', er.n || '')}${L('brp', 'SĐT người nhận', er.p || '')}${L('bra', 'Địa chỉ người nhận', er.a || '', 1)}
        ${L('bv', 'Tiền VND (tự tính, sửa được)', E ? E.v || '' : '')}${L('bu', 'Tiền USD (tự tính, sửa được)', E ? ru(E.u) : '')}
        ${L('bveh', 'Chuyến xe (nhiều phiếu đi chung 1 xe thì ghi giống nhau)', E ? E.veh || '' : '', 1, 'list="tl" autocomplete="off" placeholder="Vd: 01/10 hoặc biển số xe"')}<div class="w"><p class="hint bvh" id="bvh"></p></div></div>
        <datalist id="bkl">${names.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="tl">${[...new Set([...A.flatMap(x => spTrips(x.r)), ...C.bills.map(b => (b.veh || '').trim())].filter(Boolean))].map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <p class="hint">Mỗi phiếu có tối đa 5 dòng hàng. Nhiều phiếu đi chung 1 xe: ghi cùng một «Chuyến xe», trên phiếu sẽ tự hiện «Chung xe với …». Phiếu có dòng tính theo khối sẽ tự dùng mẫu «Giao hàng tính theo khối». Dòng nhập tay có thể tính theo kg hoặc theo khối (kiện máy 220 USD/khối, kiện thường 150 hoặc 140 USD/khối, hoặc nhập giá khác). Phiếu được lưu lại, xem, sửa và in lại ở nút «Phiếu đã lập». Thông tin người gửi/nhận được nhớ cho lần sau.</p><div class="err" id="fe"></div>
        <div class="act"><button type="button" id="mc">Hủy</button><button class="p">${E ? 'Lưu thay đổi' : 'Tạo phiếu'}</button></div></form>`;
    md.classList.remove('hid'); const close = () => { md.classList.add('hid'); md.innerHTML = '' };
    $('mc').onclick = close; md.onclick = e => { if (e.target === md) close() };
    const sel = $('bss'), box = $('bl'), mb = $('bm'), MAX = 5, SEL = new Set(); let MO = E && (E.mo || ((E.man || []).length && !A.some(x => x.r.bill === E.no))) ? 1 : 0, first = true;
    const keys = () => MO ? [...new Set($('bs').value.split(/[,;&]/).map(x => x.trim()).filter(Boolean))] : [...SEL];
    const key = () => keys()[0] || '';
    /* thứ tự: đơn của phiếu đang sửa → tất cả đơn chưa thu (dù đã lập phiếu hay chưa) → không thu → đã thu; trong mỗi nhóm đơn cũ (hàng về sớm) lên trên */
    const rnk = x => (E && x.r.bill === E.no) ? -1 : pd(x.r) === 'no' ? 0 : pd(x.r) === 'free' ? 2 : 3, dk0 = x => x.r.d || '9999-99-99';
    const ago = d => { const t = Date.parse((d || '') + 'T00:00:00'); if (!isFinite(t)) return ''; const k = Math.floor((Date.now() - t) / 864e5); return k >= 1 ? `<i class="bago${k >= 10 ? ' old' : ''}">nợ ${k} ngày</i>` : '' };
    const rows = () => { const ks = keys(); return MO ? [] : A.map((x, j) => ({ ...x, j })).filter(x => x.m === $('bmo').value && ks.includes((x.r.k || '').trim())).sort((a, b) => rnk(a) - rnk(b) || dk0(a).localeCompare(dk0(b)) || ks.indexOf((a.r.k || '').trim()) - ks.indexOf((b.r.k || '').trim()) || a.j - b.j) };
    const boxes = () => [...box.querySelectorAll('input[type=checkbox]')];
    const picked = () => rows().filter(x => { const i = box.querySelector(`input[value="${x.j}"]`); return i && i.checked });
    const mEls = () => MO ? [...mb.querySelectorAll('.bmr')] : [];
    const manual = () => mEls().map(d => { const m3 = d.querySelector('.mmd').value === 'M3', pv = d.querySelector('.mpr').value, am = n(d.querySelector('.mk').value); return { desc: d.querySelector('.mdsc').value.trim(), d: d.querySelector('.md').value, q: n(d.querySelector('.mq').value), u: d.querySelector('.mu').value.trim() || 'kiện', kg: m3 ? 0 : am, m3: m3 ? am : 0, by: m3 ? 'M3' : 'KG', pm3: m3 ? (pv === 'o' ? n(d.querySelector('.mpo').value) : n(pv)) : 0 } }).filter((m, i) => { const d = mEls()[i]; return m.desc || m.d || m.q || m.kg || m.m3 || d.querySelector('.mq').value || d.querySelector('.mk').value });
    let skip = !!E, vehTouched = !!(E && E.veh);
    const vehHint = () => { const v = ($('bveh').value || '').trim().toLowerCase(), h = $('bvh'); if (!v) { h.textContent = ''; return } const o = billAll().filter(b => !(E && b.no === E.no) && (b.veh || '').trim().toLowerCase() === v).map(b => b.no); h.textContent = o.length ? `Chuyến xe này đã có ${o.length} phiếu khác: ${o.join(', ')}. Phiếu này sẽ ghi «Chung xe với» các phiếu đó.` : 'Chưa có phiếu nào khác đi cùng chuyến xe này.' };
    const tot = () => {
        const bx = boxes(), c = bx.filter(i => i.checked).length, mc = mEls().length, cnt = c + mc;
        bx.forEach(i => { i.disabled = i.dataset.lk === '1' || (!i.checked && cnt >= MAX); const l = i.closest('.bi'); l.classList.toggle('on', i.checked); l.classList.toggle('bx', i.disabled) });
        $('bma').disabled = cnt >= MAX;
        ['bcn', 'bmc'].forEach(id => { const cn = $(id); cn.textContent = cnt + '/' + MAX + ' dòng'; cn.className = 'bpc ' + (cnt >= MAX ? 'mx' : cnt ? 'ok' : '') });
        const P = picked().map(x => x.r).concat(manual()), vn = P.reduce((a, r) => a + bVnd(r), 0), us = S.rate ? vn / S.rate : 0;
        $('bsm').textContent = P.length ? `Tổng ${P.length} dòng: ${bUnits(P)} · ${bWeight(P)} · ${f(vn)} VND` : 'Chưa chọn đơn hàng hoặc nhập dòng hàng nào.';
        if (!vehTouched) $('bveh').value = [...new Set(picked().flatMap(x => spTrips(x.r)))].join(', ');
        vehHint();
        if (skip) { skip = false; return }
        $('bv').value = en(vn); $('bu').value = ru(us)
    };
    const addM = (v = {}) => {
        const d = document.createElement('div'), M3 = v.by === 'M3', am = M3 ? v.m3 : v.kg;
        const pk = M3 ? (['220', '150', '140'].includes(String(v.pm3)) ? String(v.pm3) : 'o') : '220';
        d.className = 'bmr' + (M3 ? '' : ' kgm');
        d.innerHTML = `<input class="mdsc" maxlength="80" placeholder="Nội dung hàng (vd: quần áo, máy gấp thú…)" value="${esc(v.desc || '')}"><input type="date" class="md" title="Ngày hàng về" value="${esc(v.d || '')}"><input type="number" class="mq" min="0" step="any" placeholder="Số lượng" value="${v.q ? esc(String(v.q)) : ''}"><input class="mu" placeholder="Đơn vị" value="${esc(v.u || 'kiện')}"><select class="mmd" title="Cách tính cước"><option value="KG" ${M3 ? '' : 'selected'}>Tính theo kg</option><option value="M3" ${M3 ? 'selected' : ''}>Tính theo khối</option></select><input type="number" class="mk" min="0" step="any" placeholder="${M3 ? 'Số khối (m³)' : 'Kg'}" value="${am ? esc(String(am)) : ''}"><button type="button" class="mx" title="Xóa dòng">×</button><select class="mpr" title="Đơn giá theo khối (USD/m³)"><option value="220">Kiện máy · 220 USD/khối</option><option value="150">Kiện thường · 150 USD/khối</option><option value="140">Kiện thường · 140 USD/khối</option><option value="o">Giá khác…</option></select><input type="number" class="mpo" min="0" step="any" placeholder="USD / khối" value="${pk === 'o' && v.pm3 ? esc(String(v.pm3)) : ''}">`;
        const sync = () => { const m = d.querySelector('.mmd').value === 'M3'; d.classList.toggle('kgm', !m); d.classList.toggle('pko', m && d.querySelector('.mpr').value === 'o'); d.querySelector('.mk').placeholder = m ? 'Số khối (m³)' : 'Kg' };
        d.querySelector('.mpr').value = pk; sync(); mb.appendChild(d);
        d.querySelector('.mmd').onchange = d.querySelector('.mpr').onchange = () => { sync(); tot() };
        d.querySelector('.mx').onclick = () => { d.remove(); tot() }
    };
    mb.oninput = tot; $('bma').onclick = () => { if (mEls().length + boxes().filter(i => i.checked).length < MAX) { addM(); tot() } };
    const fillS = () => { const L = keys().map(k => fixSender(k, C.ct[k] || { n: strip(k), p: '', a: '' })), j = (g, sep) => [...new Set(L.map(g).filter(Boolean))].join(sep); $('bsn').value = j(c => c.n, ' & '); $('bsp').value = j(c => c.p, ' / '); $('bsa').value = j(c => c.a, ' / '); $('bsg').value = (L.find(c => c.g) || {}).g || '' };
    const rkOf = () => { for (const k of keys()) { const m = fixKey(k), v = m ? FIXR[m][0] : (C.rv[k] || ''); if (v) return v } return '' };
    const fillR = () => { const k = $('brk').value.trim(), c = fixRecv(k) || (C.ct[k] || (k ? { n: strip(k), p: '', a: '' } : { n: '', p: '', a: '' })); $('brn').value = c.n; $('brp').value = c.p; $('bra').value = c.a; $('brg').value = c.g || '' };
    const load = keep => {
        let c5 = mEls().length;
        box.innerHTML = rows().map(x => {
            const r = x.r, w = n(r.kg) ? f2(r.kg) + ' kg' : n(r.m3) ? f2(r.m3) + ' m³' : '–', us = bUsd(r), mine = !!E && r.bill === E.no, lk = pd(r) === 'yes' && !mine;
            const on = (first && E ? mine : !r.bill && !lk) && c5 < MAX; if (on) c5++;
            return `<label class="bi"><input type="checkbox" value="${x.j}" ${on ? 'checked' : ''} ${lk ? 'disabled data-lk="1"' : ''}>
                <span class="bd1"><small>Hàng về</small><b>${fd(r.d) || '–'}</b>${pd(r) === 'no' ? ago(r.d) : ''}</span>
                <span class="bd2"><small>Số lượng</small><b>${f2(r.q)} ${esc(r.u)}</b></span>
                <span class="bd3"><small>Khối lượng</small><b>${w}</b></span>
                <span class="bd4"><small>Cước</small><b>${f(bVnd(r))} VND</b>${us ? `<i>≈ ${f2(us)} USD</i>` : ''}</span>
                <span class="bd5">${keys().length > 1 ? `<span class="bwho">${esc(strip((r.k || '').trim()))}</span>` : ''}<span class="pill pill-${pd(r)}">${PL[pd(r)]}</span>${r.bill ? `<span class="bdg">${mine ? 'Trong phiếu này' : 'Đã lập ' + esc(r.bill)}</span>` : ''}${r.trip ? `<span class="bdg tripb">Xe ${esc(r.trip)}</span>` : ''}</span>
                ${r.note ? `<span class="bd6">${esc(r.note)}</span>` : ''}</label>`
        }).join('') || `<p class="hint">${key() ? 'Người gửi đã chọn chưa có đơn hàng trong tháng này, bạn có thể dùng tab «Nhập tay».' : 'Hãy chọn người gửi ở trên.'}</p>`;
        if (!keep && !(first && E)) { fillS(); $('brk').value = rkOf(); fillR() }
        first = false; tot()
    };
    const months = [...new Set([...Object.keys(S.months), S.cur])].sort().reverse();
    const lm = E ? A.find(x => x.r.bill === E.no) : null;
    $('bmo').innerHTML = months.map(m => `<option value="${m}">${esc(mk(m))}</option>`).join(''); $('bmo').value = lm ? lm.m : S.cur;
    const paintChips = () => { sel.querySelectorAll('.schip').forEach(b => b.classList.toggle('on', SEL.has(b.dataset.k))); $('bsc').textContent = SEL.size ? 'Đã chọn ' + SEL.size + ' người' : '' };
    const fillNames = pref => {
        const mo = $('bmo').value, cnt = {};
        A.filter(x => x.m === mo).forEach(x => { const k = (x.r.k || '').trim(); if (k) cnt[k] = (cnt[k] || 0) + 1 });
        const nm = Object.keys(cnt).sort();
        if (!pref.length) [...SEL].forEach(k => { if (!nm.includes(k)) SEL.delete(k) });
        pref.forEach(p => { if (!nm.includes(p)) { nm.push(p); cnt[p] = 0 } });
        sel.innerHTML = nm.map(x => `<button type="button" class="schip" data-k="${esc(x)}">${esc(x)}<small>${cnt[x]} đơn</small></button>`).join('') || '<span class="hint">(tháng này chưa có đơn hàng, hãy dùng tab «Nhập tay»)</span>';
        paintChips()
    };
    sel.onclick = e => { const b = e.target.closest('.schip'); if (!b) return; const k = b.dataset.k; SEL.has(k) ? SEL.delete(k) : SEL.add(k); paintChips(); load(0) };
    if (E && !MO) (E.ks && E.ks.length ? E.ks : [E.k]).forEach(k => k && SEL.add(k));
    fillNames(E && !MO ? [...SEL] : []);
    const mode = () => {
        $('bml').style.display = $('bsl1').style.display = MO ? 'none' : ''; $('bsl2').style.display = MO ? '' : 'none'; $('bpk').style.display = MO ? 'none' : ''; $('bmw').style.display = MO ? '' : 'none'; md.querySelectorAll('.btabs button').forEach(b => b.classList.toggle('on', +b.dataset.m === MO)); if (MO && !mb.children.length) addM()
    };
    md.querySelectorAll('.btabs button').forEach(b => b.onclick = () => { MO = +b.dataset.m; if (MO && !$('bs').value) $('bs').value = [...SEL].join(', '); mode(); load(1) });
    $('bmo').onchange = () => { fillNames([]); load(0) }; $('bs').onchange = () => load(0);
    $('bv').oninput = () => { const v = parseFloat($('bv').value.replace(/,/g, '')); if (isFinite(v)) $('bu').value = ru(S.rate ? v / S.rate : 0) };
    $('brk').onchange = fillR; box.onchange = tot; $('bveh').oninput = () => { vehTouched = !!$('bveh').value.trim(); vehHint() };
    $('bua').onclick = () => { let c = mEls().length; boxes().forEach(i => { const r = A[+i.value].r; i.checked = !r.bill && pd(r) !== 'yes' && c < MAX; if (i.checked) c++ }); tot() };
    $('bun').onclick = () => { boxes().forEach(i => i.checked = false); tot() };
    if (E) if (E && MO) (E.man || []).forEach(m => addM(m));
    mode(); load(0);
    if (E) { const lc = A.filter(x => x.r.bill === E.no).length, mc = (E.man || []).length; if (lc + mc < E.rows.length) $('bw').textContent = `Lưu ý: phiếu này có ${E.rows.length} dòng nhưng chỉ tìm thấy ${lc} đơn hàng liên kết và ${mc} dòng nhập tay. Bấm «Lưu thay đổi» sẽ thay các dòng theo lựa chọn hiện tại.` }
    md.querySelector('form').onsubmit = e => {
        e.preventDefault(); const P = picked(), M = manual();
        const ks = keys(), sk = ks.join(', '); if (!ks.length) { $('fe').textContent = 'Chọn ít nhất 1 người gửi.'; return }
        if (!P.length && !M.length) { $('fe').textContent = MO ? 'Nhập ít nhất 1 dòng hàng (số lượng hoặc kg).' : 'Chọn ít nhất 1 đơn hàng.'; return }
        if (M.some(x => x.by === 'M3' && x.m3 && !x.pm3)) { $('fe').textContent = 'Dòng tính theo khối cần chọn hoặc nhập đơn giá USD/khối.'; return }
        if (P.length + M.length > MAX) { $('fe').textContent = 'Phiếu chỉ có 5 dòng hàng, hãy chọn tối đa 5 dòng (hoặc tạo 2 phiếu).'; return }
        const no = $('bno').value.trim(), s = { g: $('bsg').value, n: $('bsn').value.trim(), p: $('bsp').value.trim(), a: $('bsa').value.trim() }, rc = { g: $('brg').value, n: $('brn').value.trim(), p: $('brp').value.trim(), a: $('bra').value.trim() }, rk = $('brk').value.trim();
        if (!no) { $('fe').textContent = 'Nhập số phiếu.'; return }
        if (billAll().some(b => b.no === no && !(E && b.no === E.no))) { $('fe').textContent = 'Số phiếu ' + no + ' đã có rồi. Hãy đổi sang số khác hoặc xóa phiếu cũ trong «Phiếu đã lập».'; return }
        if (ks.length === 1) C.ct[sk] = fixKey(sk) ? fixSender(sk, s) : s; if (rk) { C.ct[rk] = Object.assign({}, fixRecv(rk) || rc, { g: rc.g }); ks.forEach(k => C.rv[k] = rk) }
        const m = no.match(/(\d+)\s*$/); if (m && +m[1] > C.no) C.no = +m[1];
        const bill = { no, dt: $('bdt').value, k: sk, ks, rk, s, r: rc, rows: [...P.map(x => snap(x.r)), ...M.map(snap)], man: M.map(x => ({ by: x.by, m3: x.m3, pm3: x.pm3, desc: x.desc, d: x.d, q: x.q, u: x.u, kg: x.kg })), veh: $('bveh').value.trim(), mo: MO, v: $('bv').value.trim(), u: ru($('bu').value), t: E ? (E.t || Date.now()) : Date.now() };
        if (E) { A.forEach(x => { if (x.r.bill === E.no) delete x.r.bill }); C.bills = C.bills.filter(b => b.no !== E.no) }
        C.bills.push(bill); P.forEach(x => { x.r.bill = no }); save(); all(); close();
        showBill(bill, 1)
    }
}
const vkey = b => (b.veh || '').trim().toLowerCase();
const vMates = (b, all) => vkey(b) ? all.filter(o => o.no !== b.no && vkey(o) === vkey(b)) : [];
const vBadge = (b, all) => { const v = (b.veh || '').trim(); if (!v) return ''; const m = vMates(b, all).length; return `<span class="bdg tripb" title="Chuyến xe">Xe ${esc(v)}${m ? ' · chung với ' + m + ' phiếu' : ''}</span>` };
