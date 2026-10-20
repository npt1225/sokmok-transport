/* ===== Bổ sung: giải thích cách tính lợi nhuận, tiện ích tab Đơn hàng, tiện ích toàn trang ===== */
(function () {
    const V = x => vn(x || 0), safe = fn => { try { return fn() } catch (e) { console.error(e) } };
    const CSS = `<style>
.ex{font-size:14px;line-height:1.55}.ex .st{border:1px solid var(--bd);border-radius:12px;padding:10px 12px;margin:0 0 10px}
.ex .st h4{margin:0 0 4px;font-size:14px}.ex .fm{font-family:ui-monospace,Consolas,monospace;background:rgba(127,127,127,.12);border-radius:8px;padding:6px 8px;margin:4px 0;word-break:break-word}
.ex .rs{font-weight:700}.ex .ok{color:#1e8e4e}.ex .bad{color:#c8201c}.ex .tip{color:var(--mu);font-size:13px}
.ox{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}.ox .kc{border:1px solid var(--bd);border-radius:12px;padding:8px 12px;min-width:120px}
.ox .kc small{display:block;color:var(--mu);font-size:12px}.ox .kc b{font-size:15px}.ox button.on{background:var(--ac,#1f4e9e);color:#fff}
#fab{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px;z-index:30}
#fab button{width:40px;height:40px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer}
html.dk{filter:invert(1) hue-rotate(180deg)}html.dk img,html.dk video{filter:invert(1) hue-rotate(180deg)}
</style>`;
    document.head.insertAdjacentHTML('beforeend', CSS);
    const stp = (h, body) => `<div class="st"><h4>${h}</h4>${body}</div>`, fm = s => `<div class="fm">${s}</div>`;
    window.lnExplain = function (x) {
        const M = S.months[S.cur], sl = salOf(M), ng = nghOf(M), com = sl.com, C = x.chuyen + x.sal + x.ng + x.ads;
        const loi = x.d.tot - x.chuyen - x.sal - x.ng - x.ads, okL = Math.round(loi) === Math.round(x.loi);
        const needTot = x.sal + x.ng + x.ns + x.qcThieu;
        const warn = []; if (!x.d.tot) warn.push('Tháng này chưa có doanh số.'); if (!x.nhanT) warn.push('Chưa có khoản nhận nào (tab «Chi phí đã thu», người thu = Thịnh, anh Sakhen hoặc anh Diện).');
        if (x.ads > x.ns && x.ns > 0) warn.push('QC đã dùng (' + V(x.ads) + ') lớn hơn ngân sách (' + V(x.ns) + ').'); if (x.conlai < 0) warn.push('Tiền còn lại trong tài khoản đang âm.');
        $('lnc').innerHTML = '<div class="ex">' +
            stp('Bước 1 – Doanh số (tiền khách phải trả)', fm('Cộng cước của ' + x.d.n + ' đơn = <span class="rs">' + V(x.d.tot) + '</span>') + '<div class="tip">Mỗi đơn tính theo VND, USD × tỷ giá ' + V(S.rate) + ', hoặc kg × ' + V(S.kg) + ' tuỳ cột «Tính theo».</div>') +
            stp('Bước 2 – Các khoản chi phí',
                fm('Chuyển hàng = ' + vn1(x.sc.kg, 1) + ' kg (hàng tính theo kg) × 10.000 (' + V(x.sc.a) + ')<br>+ ' + vn1(x.sc.m3, 2) + ' m³ × 90$ × ' + V(S.rate) + ' (' + V(x.sc.b) + ')<br>+ ' + V(x.sc.nho) + ' kiện nhỏ × 20$ × ' + V(S.rate) + ' (' + V(x.sc.c) + ')<br>= <span class="rs">' + V(x.chuyen) + '</span>') + (x.sc.nK ? '<div class="tip">Hàng tính theo khối (' + x.sc.nK + ' dòng, ' + vn1(x.sc.kgK, 1) + ' kg) chỉ tính theo m³, không tính theo kg nữa. Số kg đó chỉ dùng để tính phí ông Nghĩa.</div>' : '') +
                fm('Lương + hoa hồng = ' + V(SAL.base) + ' (lương cứng) + ' + V(x.d.tot) + ' × ' + (SAL.pct * 100) + '% (' + V(com) + ') = <span class="rs">' + V(x.sal) + '</span>') +
                fm('Phí ông Nghĩa = ' + vn1(ng.kg, 1) + ' kg hàng khách Nghĩa × ' + V(NG.per) + ' × ' + (NG.pct * 100) + '% = <span class="rs">' + V(x.ng) + '</span>') +
                fm('QC đã dùng = <span class="rs">' + V(x.ads) + '</span> (nhập ở ô bên trái)') +
                fm('Tổng chi phí = ' + V(x.chuyen) + ' + ' + V(x.sal) + ' + ' + V(x.ng) + ' + ' + V(x.ads) + ' = <span class="rs">' + V(C) + '</span>')) +
            stp('Bước 3 – LỢI NHUẬN', fm(V(x.d.tot) + ' − ' + V(C) + ' = <span class="rs ' + (loi >= 0 ? 'ok' : 'bad') + '">' + V(loi) + '</span> (' + (x.d.tot ? (loi / x.d.tot * 100).toFixed(1) : 0) + '% doanh số)') + '<div class="tip">Kiểm tra lại: ' + (okL ? '<span class="ok">khớp ✔</span>' : '<span class="bad">LỆCH, hãy báo lại để kiểm tra</span>') + '</div>') +
            stp('Bước 4 – Tiền nhận vào tài khoản',
                fm('Tiền nhận vào TK (tab Chi phí đã thu, người thu = Thịnh, anh Sakhen, anh Diện) = <span class="rs">' + V(x.nhanT) + '</span>') +
                fm('Doanh số ' + V(x.d.tot) + ' − tiền nhận vào ' + V(x.nhanT) + ' = <span class="rs ' + (x.conNhan > 0 ? 'bad' : 'ok') + '">' + (x.conNhan > 0 ? 'Còn thiếu ' : 'Dư ') + V(Math.abs(x.conNhan)) + '</span>') + '<div class="tip">Phần «còn thiếu» là tiền khách chưa chuyển vào tài khoản so với doanh số.</div>') +
            stp('Bước 5 – Lấy tiền còn lại trong tài khoản trừ các khoản cần chi',
                fm('Quảng cáo: nạp ' + V(x.ns) + ', đã dùng ' + V(x.ads) + ' → ' + (x.qcThieu > 0 ? '<span class="bad">thiếu ' + V(x.qcThieu) + '</span> (phải nạp thêm, trừ vào tiền còn lại)' : 'dư ' + V(x.qcDu) + ' (phần dư này được cộng lại vào tiền còn lại)')) +
                fm('Tiền Thịnh nhận vào TK: ' + V(x.nhanTh) + (x.qcDu > 0 ? '<br>+ QC dư ' + V(x.qcDu) + ' (= ' + V(x.thuc + x.qcDu) + ')' : '') + '<br>− Lương ' + V(x.sal) + ' − phí Nghĩa ' + V(x.ng) + ' − ngân sách QC ' + V(x.ns) + (x.qcThieu > 0 ? ' − QC thiếu ' + V(x.qcThieu) : '') + ' (= ' + V(needTot) + ')<br>= Tiền còn lại trong tài khoản: <span class="rs ' + (x.conlai >= 0 ? 'ok' : 'bad') + '">' + V(x.conlai) + '</span>') +
                '<div class="' + (x.conlai >= 0 ? 'ok' : 'bad') + ' rs">' + (x.conlai >= 0 ? '➜ Không cần nạp thêm, còn dư ' + V(x.conlai) + ' đ' : '➜ Cần nạp thêm ' + V(-x.conlai) + ' đ') + '</div>') +
            (warn.length ? '<div class="st bad">⚠ Lưu ý: ' + warn.join('<br>⚠ ') + '</div>' : '') + '</div>';
    };
    /* ---- Toàn trang: chế độ tối, lên đầu trang, phím tắt «/» tìm đơn ---- */
    const fab = document.createElement('div'); fab.id = 'fab';
    fab.innerHTML = '<button type="button" id="dkb" title="Chế độ tối / sáng">🌙</button><button type="button" id="topb" title="Lên đầu trang">↑</button>'; document.body.appendChild(fab);
    safe(() => { if (localStorage.getItem('bc-dark') === '1') document.documentElement.classList.add('dk') });
    $('dkb').onclick = () => { const d = document.documentElement.classList.toggle('dk'); try { localStorage.setItem('bc-dark', d ? '1' : '0') } catch (e) { } };
    $('topb').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.addEventListener('keydown', e => {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
        const q = $('q'); if (!q || $('app').classList.contains('hid')) return; e.preventDefault(); safe(() => showTab('don')); q.focus()
    });
})();

/* ===== Quản lý nhanh: mục tiêu, dự báo, so tháng trước, tuổi nợ, kiểm tra dữ liệu ===== */
(function () {
    const V = x => vn(x || 0), PCT = (a, b) => b ? ((a - b) / b * 100) : null;
    const sg = p => p == null ? '–' : '<span style="color:' + (p >= 0 ? '#1e8e4e' : '#c8201c') + '">' + (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p).toFixed(1) + '%</span>';
    document.head.insertAdjacentHTML('beforeend', '<style>.mg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.mg>div{border:1px solid var(--bd);border-radius:14px;padding:12px 14px;font-size:14px}.mg h3{margin:0 0 8px;font-size:15px}.mg .r{display:flex;justify-content:space-between;gap:8px;padding:3px 0}.mg .bar{height:10px;border-radius:6px;background:rgba(127,127,127,.2);overflow:hidden;margin:6px 0}.mg .bar i{display:block;height:100%;background:#2e9e5b}.mg input{width:150px}.mg .iss button{display:block;width:100%;text-align:left;margin:3px 0}.mg .mu{color:var(--mu);font-size:13px}</style>');
    window.mgx = function () {
        if (!S || !S.months || !S.months[S.cur]) return; const M = S.months[S.cur], d = mcalc(M), own = !!me && me.r === 'owner';
        let host = $('mgx'); if (!host) { const tp = $('tp-tong'); if (!tp) return; host = document.createElement('section'); host.id = 'mgx'; tp.insertBefore(host, tp.firstChild) }
        const ks = Object.keys(S.months).sort(), pk = ks[ks.indexOf(S.cur) - 1], P = pk ? mcalc(S.months[pk]) : null;
        /* mục tiêu + dự báo */
        const goal = n(M.goal), pc = goal ? Math.min(100, d.tot / goal * 100) : 0, now = new Date(), ny = now.getFullYear(), nm = now.getMonth() + 1, [cy, cm] = S.cur.split('-').map(Number);
        const dim = new Date(cy, cm, 0).getDate(), el = (cy === ny && cm === nm) ? now.getDate() : (cy < ny || (cy === ny && cm < nm)) ? dim : 0, fc = el && el < dim ? d.tot / el * dim : null;
        const c1 = `<div><h3>🎯 Mục tiêu &amp; dự báo ${esc(mk(S.cur).toLowerCase())}</h3><div class="r"><span>Mục tiêu doanh số</span><input data-goal inputmode="numeric" placeholder="nhập số tiền" value="${goal ? vn(goal) : ''}"></div><div class="bar"><i style="width:${pc}%"></i></div><div class="r"><span>Đã đạt</span><b>${V(d.tot)} đ${goal ? ' (' + (d.tot / goal * 100).toFixed(0) + '%)' : ''}</b></div>${goal ? `<div class="r"><span>Còn thiếu</span><b>${V(Math.max(0, goal - d.tot))} đ</b></div>` : ''}${fc ? `<div class="r"><span>Dự báo cuối tháng (đà hiện tại)</span><b>${V(fc)} đ</b></div><div class="mu">Tính theo ${el}/${dim} ngày đã qua.${goal && fc < goal ? ' Cần tăng tốc để đạt mục tiêu.' : ''}</div>` : ''}</div>`;
        /* so tháng trước */
        const lc = (a, b, l, f) => `<div class="r"><span>${l}</span><span>${f(a)} ${P ? sg(PCT(a, b)) : ''}</span></div>`;
        let c2 = `<div><h3>📈 So với ${pk ? esc(mk(pk).toLowerCase()) : 'tháng trước'}</h3>`;
        if (!P) c2 += '<div class="mu">Chưa có tháng trước để so sánh.</div>';
        else {
            c2 += lc(d.tot, P.tot, 'Doanh số', x => V(x) + ' đ') + lc(d.n, P.n, 'Số đơn', x => x) + lc(d.kg, P.kg, 'Khối lượng', x => V(x) + ' kg') + lc(d.tot ? d.pt / d.tot * 100 : 0, P.tot ? P.pt / P.tot * 100 : 0, 'Tỉ lệ đã thu', x => x.toFixed(0) + '%');
            if (own) { const L = lnData(), Lp = lnDataOf(S.months[pk]); c2 += lc(L.loi, Lp.loi, 'Lợi nhuận', x => V(x) + ' đ') }
        }
        c2 += '</div>';
        /* top khách */
        const by = {}; M.rows.forEach(r => { const k = r.k || '(không tên)'; by[k] = (by[k] || 0) + fee(r) });
        const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const c3 = `<div><h3>🏆 Top khách tháng này</h3>${top.map(([k, v], i) => `<div class="r"><span>${i + 1}. ${esc(k)}</span><span>${V(v)} đ · ${d.tot ? (v / d.tot * 100).toFixed(0) : 0}%</span></div>`).join('') || '<div class="mu">Chưa có đơn.</div>'}${top[0] && d.tot && top[0][1] / d.tot > 0.5 ? '<div class="mu" style="color:#c8201c">⚠ Phụ thuộc nhiều vào 1 khách (&gt;50% doanh số).</div>' : ''}</div>`;
        /* tuổi nợ (mọi tháng) */
        const B = [['0–10 ngày', 0, 10], ['11–30 ngày', 11, 30], ['31–60 ngày', 31, 60], ['Trên 60 ngày', 61, 1e9]], T = B.map(() => ({ c: 0, v: 0 })); let nod = { c: 0, v: 0 }; const today = new Date(); today.setHours(0, 0, 0, 0);
        Object.values(S.months).forEach(m => (m.rows || []).forEach(r => { if (pd(r) !== 'no' || !fee(r)) return; if (!r.g) { nod.c++; nod.v += fee(r); return } const dd = Math.floor((today - new Date(r.g)) / 864e5); const i = B.findIndex(b => dd >= b[1] && dd <= b[2]); if (i >= 0) { T[i].c++; T[i].v += fee(r) } }));
        const c4 = `<div><h3>⏳ Tuổi nợ (tất cả tháng)</h3>${B.map((b, i) => `<div class="r" ${i >= 2 && T[i].c ? 'style="color:#c8201c"' : ''}><span>${b[0]}</span><span>${T[i].c} đơn · ${V(T[i].v)} đ</span></div>`).join('')}${nod.c ? `<div class="r"><span>Chưa có ngày giao</span><span>${nod.c} đơn · ${V(nod.v)} đ</span></div>` : ''}<div class="mu">Tính từ ngày giao đến hôm nay.</div></div>`;
        /* kiểm tra dữ liệu */
        const iss = [], seen = {}; M.rows.forEach((r, i) => {
            const nm = `#${i + 1} ${r.k || '(không tên)'}`;
            if (!(r.k || '').trim()) iss.push([i, nm, 'thiếu tên khách']); if (!r.g) iss.push([i, nm, 'thiếu ngày giao']);
            if (pd(r) !== 'free' && !fee(r)) iss.push([i, nm, 'cước = 0 mà chưa chọn «Không thu»']); if (r.by === 'KG' && !n(r.kg)) iss.push([i, nm, 'tính theo kg nhưng chưa có kg']);
            if (r.d && r.g && r.d > r.g) iss.push([i, nm, 'ngày hàng về sau ngày giao']);
            const key = [r.k, r.g, Math.round(fee(r)), n(r.kg)].join('|'); if (fee(r) && seen[key] !== undefined) iss.push([i, nm, 'có thể trùng với đơn #' + (seen[key] + 1)]); else seen[key] = i
        });
        const c5 = `<div class="iss"><h3>🔍 Kiểm tra dữ liệu ${iss.length ? '<span style="color:#c8201c">(' + iss.length + ' lưu ý)</span>' : '<span style="color:#1e8e4e">(ổn ✔)</span>'}</h3>${iss.slice(0, 8).map(([i, nm, m]) => `<button type="button" data-ri="${i}">${esc(nm)}: ${m}</button>`).join('') || '<div class="mu">Không thấy đơn thiếu thông tin hay trùng.</div>'}${iss.length > 8 ? `<div class="mu">… và ${iss.length - 8} lưu ý nữa.</div>` : ''}</div>`;
        host.innerHTML = '<h2>Top khách</h2><div class="mg">' + c3 + '</div>';
    };
    document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.goal !== undefined) { S.months[S.cur].goal = Number(String(t.value).replace(/\D/g, '')) || 0; save(); window.mgx() } });
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-ri]'); if (b) { try { showTab('don'); showRow(+b.dataset.ri) } catch (x) { console.error(x) } } });
    setTimeout(() => { try { window.mgx() } catch (e) { console.error(e) } }, 400);
})();

/* ===== Chuyên nghiệp: Hoàn tác / Làm lại, sao kê công nợ khách, in báo cáo lợi nhuận ===== */
(function () {
    const V = x => vn(x || 0); let hist = [], idx = -1, applying = false;
    const cap = () => JSON.stringify({ m: S.months, r: S.rate, k: S.kg, c: S.cfg, cur: S.cur });
    const upd = () => { const u = $('undob'), r = $('redob'); if (u) u.disabled = idx <= 0; if (r) r.disabled = idx >= hist.length - 1 };
    window.__snap = function () { if (applying || !S || !S.months) return; const s = cap(); if (hist[idx] === s) return; hist = hist.slice(0, idx + 1); hist.push(s); if (hist.length > 30) hist.shift(); idx = hist.length - 1; upd() };
    function go(d) {
        if (!isAd()) { toast('err', 'Chỉ quản trị mới được hoàn tác.'); return } const j = idx + d; if (j < 0 || j >= hist.length) return;
        try { const o = JSON.parse(hist[j]); applying = true; idx = j; S.rate = o.r; S.kg = o.k; S.months = o.m; S.cfg = o.c || S.cfg; mig(); setMonth(o.m[o.cur] ? o.cur : Object.keys(o.m).sort().pop()); save(); $('rate').value = S.rate; $('kgp').value = S.kg; all(); toast('ok', d < 0 ? 'Đã hoàn tác.' : 'Đã làm lại.') } catch (e) { console.error(e); toast('err', 'Không hoàn tác được.') } applying = false; upd()
    }
    /* sao kê công nợ khách + nút in báo cáo lợi nhuận (dựng lại mỗi lần all() chạy) */
    const win = (title, body) => { const w = window.open('', '_blank'); if (!w) { toast('err', 'Trình duyệt đang chặn cửa sổ in.'); return } w.document.write('<meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font:14px/1.5 sans-serif;margin:24px}table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border:1px solid #888;padding:5px 8px}td.n{text-align:right}pre{white-space:pre-wrap;font:inherit}</style>' + body); w.document.close(); w.focus(); setTimeout(() => w.print(), 300) };
    function stmt(k, onlyNo) {
        const R = []; Object.keys(S.months).sort().forEach(m => (S.months[m].rows || []).forEach(r => { if ((r.k || '(không tên)') !== k || !fee(r)) return; if (onlyNo && pd(r) !== 'no') return; R.push(r) }));
        if (!R.length) { toast('err', 'Khách này không có đơn phù hợp.'); return }
        R.sort((a, b) => String(a.g || '').localeCompare(String(b.g || '')));
        const tot = R.reduce((a, r) => a + fee(r), 0), paid = R.reduce((a, r) => a + (pd(r) === 'yes' ? fee(r) : 0), 0), no = R.reduce((a, r) => a + (pd(r) === 'no' ? fee(r) : 0), 0), L = { no: 'Chưa thu', yes: 'Đã thu', free: 'Không thu' };
        win('Bảng kê ' + k, `<h2>BẢNG KÊ ĐỐI CHIẾU CÔNG NỢ</h2><div>Khách hàng: <b>${esc(k)}</b> · Ngày lập: ${fd(new Date().toISOString().slice(0, 10))}${onlyNo ? ' · Chỉ các đơn chưa thu' : ''}</div><table><tr><th>STT</th><th>Ngày giao</th><th>Số kg</th><th>Cước (VND)</th><th>Tình trạng</th></tr>${R.map((r, i) => `<tr><td>${i + 1}</td><td>${fd(r.g)}</td><td class="n">${V(n(r.kg))}</td><td class="n">${V(fee(r))}</td><td>${L[pd(r)]}</td></tr>`).join('')}</table><div>Tổng cước: <b>${V(tot)} đ</b> · Đã thu: <b>${V(paid)} đ</b> · <b>Còn nợ: ${V(no)} đ</b></div>`)
    }
    window.mgx = function () {
        const old = $('mgx'); if (old) old.remove();
        const tk = $('tp-khach'); if (tk && S && S.months) {
            const ks = [...new Set(Object.values(S.months).flatMap(m => (m.rows || []).map(r => r.k || '(không tên)')))].sort((a, b) => a.localeCompare(b, 'vi'));
            let bx = $('skbox'); if (!bx) { bx = document.createElement('div'); bx.id = 'skbox'; bx.className = 'tb'; bx.style.margin = '0 0 10px'; const sec = tk.querySelector('section'); sec.insertBefore(bx, sec.querySelector('.wrap')) }
            const cur = $('skk') ? $('skk').value : ''; bx.innerHTML = '<b>Bảng kê công nợ:</b> <select id="skk">' + ks.map(k => `<option ${k === cur ? 'selected' : ''}>${esc(k)}</option>`).join('') + '</select><label><input type="checkbox" id="skn" checked> chỉ đơn chưa thu</label><button type="button" class="p" id="skp">In / lưu PDF bảng kê</button>'
        }
        const lc = $('lncp'); if (lc && !$('lnpr')) { lc.insertAdjacentHTML('afterend', ' <button type="button" id="lnpr">Xuất PDF báo cáo đầy đủ</button>') } if ($('lnpr') && !$('lnpr2')) { $('lnpr').insertAdjacentHTML('afterend', ' <button type="button" id="lnpr2" style="background:#C8102E;border-color:#C8102E;color:#fff;font-weight:700">Xuất PDF tổng thông tin</button>') }
    };
    document.addEventListener('click', e => { const t = e.target; if (t.id === 'skp') { try { stmt($('skk').value, $('skn').checked) } catch (x) { console.error(x) } } if (t.id === 'lnpr') { try { win('Báo cáo lợi nhuận ' + mk(S.cur), lnPdfHtml()) } catch (x) { console.error(x) } } if (t.id === 'lnpr2') { try { win('Tổng thông tin ' + mk(S.cur), lnPdfAll()) } catch (x) { console.error(x) } } });
    try { window.mgx() } catch (e) { console.error(e) }
})();
