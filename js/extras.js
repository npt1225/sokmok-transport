/* ===== Tự động sao lưu mỗi ngày 1 lần ===== */
const SNP = 'bc-snap-';
const bkData = () => ({ app: 'sokmok-bao-cao', v: 2, t: new Date().toISOString(), rate: S.rate, kg: S.kg, cur: S.cur, months: S.months, cfg: S.cfg });
const snaps = () => { const L = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(SNP)) L.push(k) } } catch (e) { } return L.sort().reverse() };
function dailyBackup() {
    if (!me || !isAd() || !S || !S.months) return;
    const day = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    let last = ''; try { last = localStorage.getItem('bc-lastbk') } catch (e) { }
    if (last === day) return;
    const txt = JSON.stringify(bkData(), null, 1), put = () => localStorage.setItem(SNP + day, txt);
    try { put() } catch (e) { snaps().slice(3).forEach(k => { try { localStorage.removeItem(k) } catch (x) { } }); try { put() } catch (x) { } }
    snaps().slice(14).forEach(k => { try { localStorage.removeItem(k) } catch (e) { } });
    try { localStorage.setItem('bc-lastbk', day) } catch (e) { }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = 'sokmok-sao-luu-' + day + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    $('sv').style.color = ''; $('sv').textContent = 'Đã tự động sao lưu ngày ' + day.split('-').reverse().join('/')
}
setInterval(() => { if (me && !$('app').classList.contains('hid')) dailyBackup() }, 3600000);
$('rsa').onclick = () => {
    const L = snaps();
    md.innerHTML = `<div class="dlg" style="max-width:460px"><h3>Bản sao lưu tự động</h3>${L.length ? '<div style="display:grid;gap:6px;margin:8px 0">' + L.map(k => { const d = k.slice(SNP.length); let kb = 0; try { kb = Math.round((localStorage.getItem(k) || '').length / 1024) } catch (e) { } return `<button type="button" data-sn="${esc(k)}">${esc(d.split('-').reverse().join('/'))} · ${kb} KB</button>` }).join('') + '</div>' : '<p class="hint">Chưa có bản sao lưu tự động nào.</p>'}<p class="hint">Mỗi ngày trang tự lưu 1 bản trong trình duyệt (giữ 14 ngày gần nhất) và tải 1 file về máy. Nên giữ các file này ở nơi an toàn.</p><div class="act"><button type="button" id="mc">Đóng</button></div></div>`;
    md.classList.remove('hid'); const close = () => { md.classList.add('hid'); md.innerHTML = '' };
    $('mc').onclick = close; md.onclick = async e => {
        if (e.target === md) { close(); return }
        const b = e.target.closest('[data-sn]'); if (!b) return;
        let d; try { d = JSON.parse(localStorage.getItem(b.dataset.sn)) } catch (x) { }
        close();
        if (!d || !d.months) { ask('Không đọc được bản sao lưu này.', 'Đóng'); return }
        if (!await ask(`Thay toàn bộ số liệu hiện tại bằng bản sao lưu ngày <b>${esc(b.dataset.sn.slice(SNP.length).split('-').reverse().join('/'))}</b> (${Object.keys(d.months).length} tháng)?`, 'Khôi phục')) return;
        S.rate = n(d.rate) || 26000; S.kg = n(d.kg) || 15000; S.months = d.months; S.cfg = d.cfg || S.cfg; mig(); setMonth(d.months[d.cur] ? d.cur : Object.keys(d.months).sort().pop()); save(); $('rate').value = S.rate; $('kgp').value = S.kg; all()
    }
};
try { navigator.storage && navigator.storage.persist && navigator.storage.persist() } catch (e) { }
/* ===== Mở rộng: tab Lợi nhuận + nhắc công nợ qua Telegram ===== */
const vn = x => Math.round(x).toLocaleString('vi-VN'), vn1 = (x, d) => (+x).toLocaleString('vi-VN', { maximumFractionDigits: d });
const PFF = [{ k: 'chuyen', l: 'Chi phí chuyển hàng (VND)', t: 'number', w: 1 }, { k: 'nhan', l: 'Các khoản nhận vào tài khoản (cách nhau bằng dấu phẩy, ví dụ 15450000, 1820000)', t: 'text', w: 1 }, { k: 'conlai', l: 'Số tiền còn lại trong tài khoản (VND)', t: 'number' }, { k: 'ns', l: 'Ngân sách quảng cáo + vận hành (VND)', t: 'number' }, { k: 'ads', l: 'Đã sử dụng quảng cáo + vận hành (VND)', t: 'number' }];
function lnData() { return lnDataOf(S.months[S.cur]) }
function lnDataOf(M) {
    const p = M.pf || {}, d = mcalc(M), sal = salOf(M).sal, ng = nghOf(M).fee;
    const nhanL = (M.pays || []).map(q => { const w = q.w || '', ot = /sakhen|di[eệ]n/i.test(w), th = /thịnh/i.test(w), amt = th ? n(q.vnd) : ot ? n(q.vnd) + n(q.usd) * S.rate : 0; return { ...q, amt, ot, lbl: [ot ? w.trim() : '', q.note || '', ot && n(q.usd) ? '(' + vn1(n(q.usd), 2) + ' USD × ' + vn(S.rate) + ')' : ''].filter(Boolean).join(' · ') } }).filter(q => q.amt > 0), nhan = nhanL.map(q => q.amt);
    const m3 = M.rows.reduce((a, r) => a + n(r.m3), 0), sc = shipCost(M), chuyen = sc.tot, ads = n(p.ads), ns = p.ns == null || p.ns === '' ? 10000000 : n(p.ns), conlai = n(p.conlai);
    const tru = Array.isArray(p.tr) ? p.tr.map(o => ({ l: String((o && o.l) || ''), v: n(o && o.v) })) : [], nhanT = nhan.reduce((a, v) => a + v, 0), nhanTh = nhanL.filter(q => !q.ot).reduce((a, q) => a + q.amt, 0), truT = tru.reduce((a, o) => a + o.v, 0);
    const napA = 0, thuc = nhanTh, qcThieu = Math.max(0, ads - ns), qcDu = Math.max(0, ns - ads);
    return { d, m3, sal, ng, nhan, nhanL, nhanT, nhanTh, napA, thuc, conNhan: d.tot - nhanT, sc, tru, truT, net: nhanT - truT, chuyen, ads, ns, qcThieu, qcDu, conlai: nhanTh + qcDu - sal - ng - ns - qcThieu, loi: d.tot - chuyen - sal - ng - ads, nap: sal + ng + ns + qcThieu - thuc - qcDu }
}
function lnText() {
    const x = lnData(), t = x.nap > 0 ? `==> Khoản cần nạp thêm: ${vn(x.nap)} VNĐ` : `==> Không cần nạp thêm (dư ${vn(-x.nap)} VNĐ)`;
    return `BÁO CÁO DOANH SỐ – CHI PHÍ – LỢI NHUẬN (${mk(S.cur)})
1. Tổng quan
Tổng doanh số: ${vn(x.d.tot)} VNĐ
Số tấn: ${vn1(x.d.kg / 1000, 3)} tấn
Số khối: ${vn1(x.m3, 2)} m³
Số đơn: ${x.d.n} đơn

2. Các khoản chi phí
Chi phí chuyển hàng: ${vn(x.chuyen)} VNĐ (${vn1(x.sc.kg, 1)} kg × 10.000 + ${vn1(x.sc.m3, 2)} m³ × 90$ + ${vn(x.sc.nho)} kiện nhỏ × 20$; không tính kg của hàng theo khối)
Lương + hoa hồng: ${vn(x.sal)} VNĐ
Phí ông Nghĩa: ${vn(x.ng)} VNĐ
Phí quảng cáo + vận hành: ${vn(x.ns)} VNĐ (Đã sử dụng: ${vn(x.ads)} VNĐ)

3. Các khoản nhận vào tài khoản để thanh toán chuyển hàng
${x.nhanL.map(q => fd(q.d) + (q.lbl ? ' – ' + q.lbl : '') + ': ' + vn(q.amt) + ' VNĐ').join('\n') || '(chưa có)'}
Tổng các khoản nhận: ${vn(x.nhanT)} VNĐ
${x.conNhan > 0 ? '==> Còn thiếu so với doanh số' : '==> Dư so với doanh số'}: ${vn(Math.abs(x.conNhan))} VNĐ
Số tiền còn lại trong tài khoản: ${vn(x.conlai)} VNĐ

4. Tính lợi nhuận
${vn(x.d.tot)} – ${vn(x.chuyen)} – ${vn(x.sal)} – ${vn(x.ng)} – ${vn(x.ads)} = ${vn(x.loi)} VNĐ
- LỢI NHUẬN: ${vn(x.loi)} VNĐ

5. Khoản nạp thêm
${vn(x.thuc)}${x.qcDu > 0 ? ' + ' + vn(x.qcDu) + ' (QC dư)' : ''} – ${vn(x.sal)} – ${vn(x.ng)} – ${vn(x.ns)}${x.qcThieu > 0 ? ' – ' + vn(x.qcThieu) + ' (QC thiếu)' : ''}
QC: nạp ${vn(x.ns)}, đã dùng ${vn(x.ads)} → ${x.qcThieu > 0 ? 'thiếu ' + vn(x.qcThieu) + ' (trừ vào tiền còn lại)' : 'dư ' + vn(x.qcDu) + ' (cộng lại vào tiền còn lại)'}
${t}`
}

function lnPdfHtml() {
    const x = lnData(), M = S.months[S.cur], cp = x.chuyen + x.sal + x.ng + x.ads, tot = x.d.tot, v = a => vn(a) + ' đ';
    const pc = a => tot ? (a / tot * 100).toFixed(1) + '%' : '–', okc = a => a >= 0 ? '#1e8e4e' : '#c8201c';
    const sl = salOf(M), ngf = nghOf(M);
    const kpi = (l, val, c, sub) => '<div class="kp"><small>' + l + '</small><b style="color:' + (c || '#14337D') + '">' + val + '</b>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>';
    const H = t => '<h3>' + t + '</h3>';
    const tbl = (cols, rows, foot) => '<table class="rt"><thead><tr>' + cols.map(c => '<th' + (c[1] ? ' class="r"' : '') + '>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + r.c.map((t, i) => '<td' + (cols[i][1] ? ' class="r"' : '') + '>' + t + '</td>').join('') + '</tr>').join('') + '</tbody>' + (foot ? '<tfoot><tr>' + foot.map((t, i) => '<td' + (cols[i][1] ? ' class="r"' : '') + '>' + t + '</td>').join('') + '</tr></tfoot>' : '') + '</table>';
    const P = [['Chuyển hàng', x.chuyen, '#1f4e9e'], ['Lương + hoa hồng', x.sal, '#e0a526'], ['Phí ông Nghĩa', x.ng, '#8e5ad7'], ['QC + vận hành', x.ads, '#e07a26'], ['Lợi nhuận', Math.max(0, x.loi), '#2e9e5b']], TT = Math.max(tot, 1, P.reduce((a, q) => a + q[1], 0));
    const bar = '<div class="bar">' + P.map(q => '<i style="width:' + (q[1] / TT * 100) + '%;background:' + q[2] + '"></i>').join('') + '</div><div class="lg">' + P.map(q => '<span><u style="background:' + q[2] + '"></u>' + q[0] + ': <b>' + vn(q[1]) + '</b> (' + pc(q[1]) + ')</span>').join('') + '</div>';
    /* chi tiết đơn */
    const R = M.rows || [], isK = r => r.by === 'M3', rowsO = R.map((r, i) => { const kgc = n(r.kg) ? (isK(r) ? '<span class="mt">' + vn1(n(r.kg), 1) + '*</span>' : vn1(n(r.kg), 1)) : '–'; return { c: [i + 1, fd(r.g) || '–', '<b>' + esc(r.k || '') + '</b>', PL[pd(r)], fd(r.d) || '–', vn1(n(r.q), 2) + ' ' + esc(r.u || ''), kgc, n(r.m3) ? vn1(n(r.m3), 2) : '–', esc(BY[r.by] || r.by || ''), vn(fee(r)), esc(r.trip || r.note || '')], cls: 'p-' + pd(r) } });
    const sumK = R.reduce((a, r) => a + (isK(r) ? 0 : n(r.kg)), 0);
    /* theo khách */
    const G = {}; R.forEach(r => { const k = r.k || '(không tên)', o = G[k] = G[k] || { k, n: 0, kg: 0, m3: 0, t: 0, y: 0, no: 0 }; o.n++; o.kg += kgT(r); o.m3 += n(r.m3); o.t += fee(r); if (pd(r) === 'yes') o.y += fee(r); if (pd(r) === 'no') o.no += fee(r) });
    const GK = Object.values(G).sort((a, b) => b.t - a.t), gs = GK.reduce((a, o) => ({ n: a.n + o.n, kg: a.kg + o.kg, m3: a.m3 + o.m3, t: a.t + o.t, y: a.y + o.y, no: a.no + o.no }), { n: 0, kg: 0, m3: 0, t: 0, y: 0, no: 0 });
    /* theo tháng */
    const ks = Object.keys(S.months).sort(), AT = { d: 0, c: 0, l: 0 };
    const rowsM = ks.map(k => { const y = lnDataOf(S.months[k]), c = y.chuyen + y.sal + y.ng + y.ads; AT.d += y.d.tot; AT.c += c; AT.l += y.loi; return { c: [mk(k), vn(y.d.tot), vn(c), '<b style="color:' + okc(y.loi) + '">' + vn(y.loi) + '</b>', y.d.tot ? (y.loi / y.d.tot * 100).toFixed(1) + '%' : '–'], cls: k === S.cur ? 'cur' : '' } });
    const css = '<style>@page{size:A4;margin:11mm 11mm 13mm}*{box-sizing:border-box}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:12.5px/1.45 "Segoe UI",Roboto,Arial,sans-serif;color:#1c2333}'
        + '.rp .hd{display:flex;justify-content:space-between;align-items:flex-end;background:#14337D;color:#fff;border-radius:10px;padding:14px 18px;border-bottom:5px solid #C8201C}.rp .hd h1{margin:0;font-size:22px;letter-spacing:.5px}.rp .hd div{font-size:12px;opacity:.92}.rp .hd .rt2{text-align:right}.rp .hd .rt2 b{font-size:16px;display:block}'
        + '.rp .kps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.rp .kp{border:1px solid #d5dbe8;border-radius:9px;padding:9px 12px;background:#f7f9fd;break-inside:avoid}.rp .kp small{display:block;color:#5c6780;font-size:11px;text-transform:uppercase;letter-spacing:.3px}.rp .kp b{font-size:18px}.rp .kp em{display:block;font-style:normal;color:#5c6780;font-size:11px;margin-top:1px}'
        + '.rp h3{margin:16px 0 6px;color:#14337D;font-size:14px;border-left:5px solid #C8201C;padding:2px 0 2px 8px;break-after:avoid}.rp h3 small{font-weight:400;color:#5c6780;font-size:11.5px;margin-left:6px}'
        + '.rp .bar{display:flex;height:16px;border-radius:8px;overflow:hidden;background:#e4e8f1;margin:6px 0}.rp .bar i{display:block;height:100%}.rp .lg{display:flex;flex-wrap:wrap;gap:3px 16px;font-size:11.5px;color:#43506b}.rp .lg u{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}'
        + '.rp table.rt{width:100%;border-collapse:collapse;margin:4px 0;font-size:11.5px;border:1px solid #cfd6e6}.rp table.rt th{background:#14337D;color:#fff;font-weight:600;padding:5px 7px;text-align:left;border:1px solid #14337D}.rp table.rt td{padding:4px 7px;border:1px solid #dde2ee;vertical-align:top}.rp table.rt tbody tr:nth-child(even){background:#f5f7fc}.rp table.rt tfoot td{background:#e8edf8;font-weight:700;border-top:2px solid #14337D}.rp .r{text-align:right!important;white-space:nowrap}.rp thead{display:table-header-group}.rp tr{break-inside:avoid}'
        + '.rp tr.cur td{background:#fff3cd!important;font-weight:600}.rp tr.tot td{background:#e8edf8!important;font-weight:700}.rp tr.p-no td:nth-child(4){color:#c8201c;font-weight:600}.rp tr.p-yes td:nth-child(4){color:#1e8e4e;font-weight:600}.rp .mt{color:#8a93a8;font-style:italic}'
        + '.rp .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.rp .box{border:1px solid #d5dbe8;border-radius:9px;padding:8px 11px;break-inside:avoid}.rp .box h4{margin:0 0 4px;font-size:12.5px;color:#14337D}.rp .box p{margin:2px 0}.rp .fm{font-family:Consolas,monospace;font-size:11.5px;background:#f0f3fa;border-radius:6px;padding:3px 6px;margin:3px 0}.rp .nt{font-size:11px;color:#5c6780;margin:4px 0}'
        + '.rp .ft{margin-top:14px;padding-top:6px;border-top:1px solid #cfd6e6;font-size:10.5px;color:#7a849b;display:flex;justify-content:space-between}</style>';
    const dtl = (l, val, b) => '<p style="display:flex;justify-content:space-between;gap:8px' + (b ? ';font-weight:700' : '') + '"><span>' + l + '</span><span>' + val + '</span></p>';
    const nhanRows = x.nhanL.map((q, i) => ({ c: [i + 1, fd(q.d) || '–', esc(q.lbl || ''), vn(q.amt)] }));
    return css + '<div class="rp">'
        + '<div class="hd"><div><h1>SOKMOK TRANSPORT</h1><div>Báo cáo doanh số – chi phí – lợi nhuận</div></div><div class="rt2"><b>' + esc(mk(S.cur)) + '</b><div>Tỷ giá: ' + vn(S.rate) + ' đ/USD · Xuất ngày ' + new Date().toLocaleDateString('vi-VN') + '</div></div></div>'
        + '<div class="kps">' + kpi('Tổng doanh số', v(tot), '#14337D', x.d.n + ' đơn') + kpi('Tổng chi phí', v(cp), '#c8201c', pc(cp) + ' doanh số') + kpi('Lợi nhuận', v(x.loi), okc(x.loi), 'Biên ' + pc(x.loi)) + kpi('Tiền nhận vào TK', v(x.nhanT), '#14337D', x.nhanL.length + ' khoản') + kpi(x.conNhan > 0 ? 'Còn thiếu so với doanh số' : 'Dư so với doanh số', v(Math.abs(x.conNhan)), x.conNhan > 0 ? '#c8201c' : '#1e8e4e') + kpi(x.nap > 0 ? 'Cần nạp thêm' : 'Tiền còn lại trong TK', x.nap > 0 ? v(x.nap) : v(x.conlai), x.nap > 0 ? '#c8201c' : '#1e8e4e', x.nap > 0 ? '' : 'Không cần nạp thêm') + '</div>'
        + H('1. Cơ cấu doanh số') + bar
        + H('2. Khối lượng hàng') + tbl([['Chỉ tiêu'], ['Giá trị', 1]], [{ c: ['Tổng số đơn (dòng)', x.d.n] }, { c: ['Tổng khối lượng hàng tính theo kg (không gồm hàng tính theo khối)', vn1(x.d.kg, 1) + ' kg (' + vn1(x.d.kg / 1000, 3) + ' tấn)'] }, { c: ['Kg của hàng tính theo khối (' + x.sc.nK + ' dòng) – không cộng vào tổng, chỉ dùng tính phí ông Nghĩa', vn1(x.sc.kgK, 1) + ' kg'] }, { c: ['Tổng thể tích', vn1(x.m3, 2) + ' m³'] }, { c: ['Kiện nhỏ', vn(x.sc.nho) + ' kiện'] }])
        + H('3. Các khoản chi phí')
        + tbl([['Khoản chi phí'], ['Cách tính'], ['Số tiền (VND)', 1], ['% doanh số', 1]], [
            { c: ['Chuyển hàng – theo kg', vn1(x.sc.kg, 1) + ' kg × 10.000', vn(x.sc.a), pc(x.sc.a)] },
            { c: ['Chuyển hàng – theo khối', vn1(x.sc.m3, 2) + ' m³ × 90$ × ' + vn(S.rate), vn(x.sc.b), pc(x.sc.b)] },
            { c: ['Chuyển hàng – kiện nhỏ', vn(x.sc.nho) + ' kiện × 20$ × ' + vn(S.rate), vn(x.sc.c), pc(x.sc.c)] },
            { c: ['<b>Cộng chuyển hàng</b>', '', vn(x.chuyen), pc(x.chuyen)], cls: 'tot' },
            { c: ['Lương + hoa hồng', vn(SAL.base) + ' + ' + vn(tot) + ' × ' + (SAL.pct * 100) + '% (' + vn(sl.com) + ')', vn(x.sal), pc(x.sal)] },
            { c: ['Phí ông Nghĩa', vn1(ngf.kg, 1) + ' kg hàng khách Nghĩa × ' + vn(NG.per) + ' × ' + (NG.pct * 100) + '%', vn(x.ng), pc(x.ng)] },
            { c: ['Quảng cáo + vận hành (đã dùng)', 'Ngân sách ' + vn(x.ns) + ' · ' + (x.qcThieu > 0 ? 'thiếu ' + vn(x.qcThieu) : 'dư ' + vn(x.qcDu)), vn(x.ads), pc(x.ads)] }
        ], ['TỔNG CHI PHÍ', '', vn(cp), pc(cp)])
        + '<p class="nt">* Hàng tính theo khối chỉ tính cước theo m³, không cộng kg vào cước chuyển hàng. Số kg đó chỉ dùng để tính phí ông Nghĩa (khách Nghĩa).</p>'
        + H('4. Lợi nhuận')
        + '<div class="two"><div class="box"><h4>Cách tính</h4>' + dtl('Doanh số', vn(tot)) + dtl('− Chuyển hàng', vn(x.chuyen)) + dtl('− Lương + hoa hồng', vn(x.sal)) + dtl('− Phí ông Nghĩa', vn(x.ng)) + dtl('− QC đã dùng', vn(x.ads)) + dtl('= LỢI NHUẬN', '<span style="color:' + okc(x.loi) + '">' + vn(x.loi) + '</span>', 1) + dtl('Biên lợi nhuận', pc(x.loi), 1) + '</div>'
        + '<div class="box"><h4>Tiền trong tài khoản</h4>' + dtl('Tiền Thịnh nhận vào TK', vn(x.nhanTh)) + (x.qcDu > 0 ? dtl('+ QC dư', vn(x.qcDu)) : '') + dtl('− Lương + hoa hồng', vn(x.sal)) + dtl('− Phí ông Nghĩa', vn(x.ng)) + dtl('− Ngân sách QC', vn(x.ns)) + (x.qcThieu > 0 ? dtl('− QC thiếu', vn(x.qcThieu)) : '') + dtl('= Tiền còn lại', '<span style="color:' + okc(x.conlai) + '">' + vn(x.conlai) + '</span>', 1) + dtl(x.nap > 0 ? 'Cần nạp thêm' : 'Không cần nạp thêm', x.nap > 0 ? vn(x.nap) : 'Dư ' + vn(x.conlai), 1) + '</div></div>'
        + H('5. Các khoản nhận vào tài khoản')
        + (nhanRows.length ? tbl([['STT'], ['Ngày'], ['Ghi chú'], ['Số tiền (VND)', 1]], nhanRows, ['', '', 'Tổng các khoản nhận', vn(x.nhanT)]) : '<p class="nt">Chưa có khoản nhận nào.</p>')
        + '<p class="nt">Trong đó Thịnh nhận (dùng tính tiền còn lại trong tài khoản): <b>' + vn(x.nhanTh) + ' đ</b></p><p class="nt">Doanh số ' + vn(tot) + ' − tiền nhận vào ' + vn(x.nhanT) + ' = <b style="color:' + (x.conNhan > 0 ? '#c8201c' : '#1e8e4e') + '">' + (x.conNhan > 0 ? 'còn thiếu ' : 'dư ') + vn(Math.abs(x.conNhan)) + ' đ</b></p>'
        + H('6. Doanh số theo khách hàng')
        + tbl([['Khách hàng'], ['Số đơn', 1], ['Kg', 1], ['m³', 1], ['Doanh số (VND)', 1], ['Đã thu', 1], ['Chưa thu', 1]], GK.map(o => ({ c: ['<b>' + esc(o.k) + '</b>', o.n, vn1(o.kg, 1), o.m3 ? vn1(o.m3, 2) : '–', vn(o.t), o.y ? vn(o.y) : '–', o.no ? '<b style="color:#c8201c">' + vn(o.no) + '</b>' : '–'] })), ['Tổng', gs.n, vn1(gs.kg, 1), vn1(gs.m3, 2), vn(gs.t), vn(gs.y), vn(gs.no)])
        + H('7. Chi tiết đơn hàng <small>(' + R.length + ' dòng)</small>')
        + tbl([['#'], ['Ngày giao'], ['Khách'], ['Thu tiền'], ['Hàng về'], ['Số lượng', 1], ['Kg', 1], ['m³', 1], ['Tính theo'], ['Cước (VND)', 1], ['Chuyến / ghi chú']], rowsO, ['', '', 'Tổng', '', '', R.reduce((a, r) => a + n(r.q), 0) || '', vn1(sumK, 1) + ' (+' + vn1(x.sc.kgK, 1) + '*)', vn1(x.m3, 2), '', vn(tot), ''])
        + '<p class="nt">* kg in nghiêng là hàng tính theo khối: không tính cước theo kg, chỉ dùng cho phí ông Nghĩa.</p>'
        + H('8. Lợi nhuận theo từng tháng')
        + tbl([['Tháng'], ['Doanh số', 1], ['Tổng chi phí', 1], ['Lợi nhuận', 1], ['Biên', 1]], rowsM, ['Tổng', vn(AT.d), vn(AT.c), vn(AT.l), AT.d ? (AT.l / AT.d * 100).toFixed(1) + '%' : '–'])
        + '<div class="ft"><span>Sokmok Transport · Hotline 0865 491 456</span><span>Chi phí = chuyển hàng + lương + hoa hồng + phí ông Nghĩa + QC đã dùng</span></div></div>';
}
function lnPdfAll() {
    const x = lnData(), M = S.months[S.cur], tot = x.d.tot, cp = x.chuyen + x.sal + x.ng + x.ads, v = a => vn(a) + ' đ';
    const pc = a => tot ? (a / tot * 100).toFixed(1) + '%' : '–', R = M.rows || [], sl = salOf(M), ngf = nghOf(M), D = debtData();
    const DT = D.reduce((a, o) => a + o.tot, 0), DN = D.reduce((a, o) => a + o.n, 0), DB = [0, 1, 2, 3].map(i => D.reduce((a, o) => a + o.b[i], 0));
    const RED = '#C8102E', BLK = '#111111';
    const kp = (l, val, sub, c) => '<div class="kp ' + (c || '') + '"><small>' + l + '</small><b>' + val + '</b>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>';
    const H = (no, t, sm) => '<h3><span class="no">' + no + '</span>' + t + (sm ? '<small>' + sm + '</small>' : '') + '</h3>';
    const tbl = (cols, rows, foot) => '<table class="rt"><thead><tr>' + cols.map(c => '<th' + (c[1] ? ' class="r"' : '') + '>' + c[0] + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + r.c.map((t, i) => '<td' + (cols[i][1] ? ' class="r"' : '') + '>' + t + '</td>').join('') + '</tr>').join('') + '</tbody>' + (foot ? '<tfoot><tr>' + foot.map((t, i) => '<td' + (cols[i][1] ? ' class="r"' : '') + '>' + t + '</td>').join('') + '</tr></tfoot>' : '') + '</table>';
    const dtl = (l, val, b) => '<p class="dl' + (b ? ' b' : '') + '"><span>' + l + '</span><span>' + val + '</span></p>';
    const tile = (l, val) => '<div class="tile"><b>' + val + '</b><small>' + l + '</small></div>';
    /* thanh dòng tiền: mỗi khoản là một thanh theo % doanh số */
    const flow = [['Chuyển hàng', x.chuyen, BLK], ['Lương + hoa hồng', x.sal, '#444'], ['Phí ông Nghĩa', x.ng, '#777'], ['QC + vận hành', x.ads, '#aaa'], ['LỢI NHUẬN', x.loi, RED]];
    const fl = flow.map(q => '<div class="fr"><span class="fl">' + q[0] + '</span><div class="fb"><i style="width:' + Math.min(100, Math.max(0, tot ? Math.abs(q[1]) / tot * 100 : 0)) + '%;background:' + q[2] + '"></i></div><span class="fv">' + vn(q[1]) + ' <em>' + pc(q[1]) + '</em></span></div>').join('');
    /* chi tiết đơn */
    const isK = r => r.by === 'M3', kgs = R.reduce((a, r) => a + (isK(r) ? 0 : n(r.kg)), 0);
    const rowsO = R.map((r, i) => ({ c: [i + 1, fd(r.g) || '–', '<b>' + esc(r.k || '') + '</b>', PL[pd(r)], fd(r.d) || '–', vn1(n(r.q), 2) + ' ' + esc(r.u || ''), n(r.kg) ? (isK(r) ? '<span class="mt">' + vn1(n(r.kg), 1) + '*</span>' : vn1(n(r.kg), 1)) : '–', n(r.m3) ? vn1(n(r.m3), 2) : '–', esc(BY[r.by] || r.by || ''), vn(fee(r)), esc(r.trip || r.note || '')], cls: 'p-' + pd(r) }));
    /* theo khách */
    const G = {}; R.forEach(r => { const k = r.k || '(không tên)', o = G[k] = G[k] || { k, n: 0, kg: 0, m3: 0, t: 0, y: 0, no: 0 }; o.n++; o.kg += isK(r) ? 0 : n(r.kg); o.m3 += n(r.m3); o.t += fee(r); if (pd(r) === 'yes') o.y += fee(r); if (pd(r) === 'no') o.no += fee(r) });
    const GK = Object.values(G).sort((a, b) => b.t - a.t), gs = GK.reduce((a, o) => ({ n: a.n + o.n, kg: a.kg + o.kg, m3: a.m3 + o.m3, t: a.t + o.t, y: a.y + o.y, no: a.no + o.no }), { n: 0, kg: 0, m3: 0, t: 0, y: 0, no: 0 });
    /* theo tháng */
    const ks = Object.keys(S.months).sort(), AT = { d: 0, c: 0, l: 0 }, MD = ks.map(k => { const y = lnDataOf(S.months[k]), c = y.chuyen + y.sal + y.ng + y.ads; AT.d += y.d.tot; AT.c += c; AT.l += y.loi; return { k, d: y.d.tot, c, l: y.loi } }), mx = Math.max(1, ...MD.map(m => m.d));
    const mch = MD.map(m => '<div class="mc' + (m.k === S.cur ? ' cur' : '') + '"><span class="ml">' + mk(m.k).replace('Tháng ', 'T') + '</span><div class="mb"><i class="a" style="width:' + (m.d / mx * 100) + '%"></i><i class="b" style="width:' + (Math.abs(m.l) / mx * 100) + '%;background:' + (m.l >= 0 ? RED : '#888') + '"></i></div><span class="mv">' + vn(m.l) + '</span></div>').join('');
    const css = '<style>@page{size:A4;margin:10mm 10mm 14mm;@bottom-center{content:"SOKMOK TRANSPORT  ·  Trang " counter(page) "/" counter(pages);font:9px sans-serif;color:#777}}*{box-sizing:border-box}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:12.5px/1.45 "Segoe UI",Roboto,Arial,sans-serif;color:#111}'
        + '.ra .hd{display:grid;grid-template-columns:1.25fr 1fr;border-radius:12px;overflow:hidden}.ra .hd .l{background:#111;color:#fff;padding:16px 20px}.ra .hd .l h1{margin:0;font-size:27px;letter-spacing:2px;font-weight:800}.ra .hd .l h1 span{color:#E5233F}.ra .hd .l p{margin:3px 0 0;font-size:11.5px;letter-spacing:.4px;opacity:.85;text-transform:uppercase}'
        + '.ra .hd .r{background:#C8102E;color:#fff;padding:16px 20px;text-align:right}.ra .hd .r small{display:block;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:.9}.ra .hd .r b{display:block;font-size:26px;line-height:1.15;font-weight:800}.ra .hd .r span{font-size:11px;opacity:.92}.ra .stripe{height:5px;background:repeating-linear-gradient(90deg,#111 0 24px,#fff 24px 28px,#C8102E 28px 52px,#fff 52px 56px);margin:0 0 12px;border-radius:0 0 4px 4px}'
        + '.ra .kps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 8px}.ra .kp{border:1.5px solid #111;border-top:5px solid #C8102E;border-radius:9px;padding:8px 11px;background:#fff;break-inside:avoid}.ra .kp small{display:block;font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:#555}.ra .kp b{display:block;font-size:17px;margin-top:1px;white-space:nowrap}.ra .kp em{display:block;font-style:normal;font-size:10.5px;color:#666}'
        + '.ra .kp.red{background:#C8102E;border-color:#C8102E;border-top-color:#8E0B20;color:#fff}.ra .kp.red small,.ra .kp.red em{color:#ffd9de}.ra .kp.blk{background:#111;border-color:#111;color:#fff}.ra .kp.blk small,.ra .kp.blk em{color:#bbb}.ra .kp.neg b{color:#C8102E}'
        + '.ra h3{display:flex;align-items:center;gap:9px;margin:16px 0 7px;font-size:14.5px;text-transform:uppercase;letter-spacing:.6px;border-bottom:2px solid #111;padding-bottom:4px;break-after:avoid}.ra h3 .no{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:50%;background:#C8102E;color:#fff;font-size:12px;letter-spacing:0}.ra h3 small{margin-left:auto;font-size:10.5px;font-weight:400;text-transform:none;letter-spacing:0;color:#666}'
        + '.ra .fr{display:grid;grid-template-columns:120px 1fr 190px;align-items:center;gap:8px;margin:4px 0}.ra .fl{font-weight:600}.ra .fb{height:13px;background:#eee;border-radius:7px;overflow:hidden}.ra .fb i{display:block;height:100%;border-radius:7px}.ra .fv{text-align:right;font-weight:700;white-space:nowrap}.ra .fv em{font-style:normal;font-weight:400;color:#666;font-size:11px;margin-left:3px}'
        + '.ra table.rt{width:100%;border-collapse:collapse;margin:4px 0;font-size:11.2px;border:1px solid #bbb}.ra table.rt th{background:#111;color:#fff;font-weight:600;padding:5px 7px;text-align:left;border:1px solid #111;border-bottom:3px solid #C8102E}.ra table.rt td{padding:4px 7px;border:1px solid #ddd;vertical-align:top}.ra table.rt tbody tr:nth-child(even){background:#f4f4f4}.ra table.rt tfoot td{background:#111;color:#fff;font-weight:700;border:1px solid #111}'
        + '.ra .r{text-align:right!important;white-space:nowrap}.ra thead{display:table-header-group}.ra tr{break-inside:avoid}.ra tr.tot td{background:#fde8eb!important;font-weight:700;color:#8E0B20}.ra tr.cur td{background:#ffe3e7!important;font-weight:700}.ra tr.p-no td:nth-child(4){color:#C8102E;font-weight:700}.ra tr.p-yes td:nth-child(4){color:#111;font-weight:700}.ra .mt{color:#888;font-style:italic}'
        + '.ra .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ra .box{border:1.5px solid #111;border-radius:9px;padding:8px 12px;break-inside:avoid}.ra .box h4{margin:-8px -12px 6px;padding:5px 12px;background:#111;color:#fff;font-size:12px;letter-spacing:.5px;text-transform:uppercase;border-radius:7px 7px 0 0;border-bottom:3px solid #C8102E}.ra .dl{display:flex;justify-content:space-between;gap:8px;margin:3px 0;border-bottom:1px dotted #ccc;padding-bottom:2px}.ra .dl.b{font-weight:800;border-bottom:0;color:#C8102E;font-size:13px}'
        + '.ra .tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.ra .tile{border:1.5px solid #111;border-radius:9px;text-align:center;padding:7px 4px;background:#fff}.ra .tile b{display:block;font-size:15px;color:#C8102E}.ra .tile small{font-size:10px;color:#444;text-transform:uppercase;letter-spacing:.3px}'
        + '.ra .mc{display:grid;grid-template-columns:52px 1fr 100px;gap:8px;align-items:center;margin:4px 0;font-size:11.5px}.ra .mc.cur .ml{color:#C8102E;font-weight:800}.ra .mb{display:flex;flex-direction:column;gap:2px}.ra .mb i{display:block;height:7px;border-radius:4px}.ra .mb .a{background:#111}.ra .mv{text-align:right;font-weight:700}.ra .lgd{font-size:10.5px;color:#666;margin:2px 0}.ra .lgd u{display:inline-block;width:9px;height:9px;margin:0 4px 0 8px;border-radius:2px}'
        + '.ra .nt{font-size:10.8px;color:#555;margin:4px 0}.ra .pb{break-before:page}.ra .ft{margin-top:14px;padding-top:6px;border-top:3px solid #C8102E;font-size:10.5px;color:#666;display:flex;justify-content:space-between}</style>';
    const nhanRows = x.nhanL.map((q, i) => ({ c: [i + 1, fd(q.d) || '–', esc(q.lbl || ''), q.ot ? 'Sakhen / Diện' : 'Thịnh', vn(q.amt)] }));
    return css + '<div class="ra">'
        + '<div class="hd"><div class="l"><h1>SOKMOK <span>TRANSPORT</span></h1><p>Báo cáo tổng hợp · doanh số – chi phí – lợi nhuận</p></div><div class="r"><small>Kỳ báo cáo</small><b>' + esc(mk(S.cur)) + '</b><span>Tỷ giá ' + vn(S.rate) + ' đ/USD · Xuất ngày ' + new Date().toLocaleDateString('vi-VN') + '</span></div></div><div class="stripe"></div>'
        + '<div class="kps">' + kp('Tổng doanh số', v(tot), x.d.n + ' đơn') + kp('Tổng chi phí', v(cp), pc(cp) + ' doanh số') + kp('Lợi nhuận', v(x.loi), 'Biên lợi nhuận ' + pc(x.loi), 'red') + kp('Biên lợi nhuận', tot ? (x.loi / tot * 100).toFixed(1) + '%' : '–', 'Lợi nhuận ÷ doanh số', 'blk') + '</div>'
        + '<div class="kps">' + kp('Tiền nhận vào', v(x.nhanT), x.nhanL.length + ' khoản') + kp(x.conNhan > 0 ? 'Còn thiếu so với doanh số' : 'Dư so với doanh số', v(Math.abs(x.conNhan)), '', x.conNhan > 0 ? 'neg' : '') + kp(x.nap > 0 ? 'Cần nạp thêm' : 'Tiền còn lại trong TK', x.nap > 0 ? v(x.nap) : v(x.conlai), x.nap > 0 ? '' : 'Không cần nạp thêm', x.nap > 0 ? 'neg' : '') + kp('Công nợ khách (mọi tháng)', v(DT), DN + ' đơn · ' + D.length + ' khách', 'neg') + '</div>'
        + H(1, 'Dòng tiền: doanh số đi đâu', '% theo doanh số') + fl
        + H(2, 'Khối lượng hàng') + '<div class="tiles">' + tile('Số đơn (dòng)', x.d.n) + tile('Hàng tính theo kg', vn1(x.d.kg, 1) + ' kg') + tile('Tổng thể tích', vn1(x.m3, 2) + ' m³') + tile('Kiện nhỏ', vn(x.sc.nho)) + tile('Kg hàng theo khối*', vn1(x.sc.kgK, 1)) + '</div><p class="nt">* Hàng tính theo khối chỉ tính cước theo m³; kg của hàng này không cộng vào tổng, chỉ dùng tính phí ông Nghĩa.</p>'
        + H(3, 'Các khoản chi phí')
        + tbl([['Khoản chi phí'], ['Cách tính'], ['Số tiền (VND)', 1], ['% doanh số', 1]], [
            { c: ['Chuyển hàng – theo kg', vn1(x.sc.kg, 1) + ' kg × 10.000', vn(x.sc.a), pc(x.sc.a)] },
            { c: ['Chuyển hàng – theo khối', vn1(x.sc.m3, 2) + ' m³ × 90$ × ' + vn(S.rate), vn(x.sc.b), pc(x.sc.b)] },
            { c: ['Chuyển hàng – kiện nhỏ', vn(x.sc.nho) + ' kiện × 20$ × ' + vn(S.rate), vn(x.sc.c), pc(x.sc.c)] },
            { c: ['Cộng chuyển hàng', '', vn(x.chuyen), pc(x.chuyen)], cls: 'tot' },
            { c: ['Lương + hoa hồng', vn(SAL.base) + ' + ' + vn(tot) + ' × ' + (SAL.pct * 100) + '% (' + vn(sl.com) + ')', vn(x.sal), pc(x.sal)] },
            { c: ['Phí ông Nghĩa', vn1(ngf.kg, 1) + ' kg hàng khách Nghĩa × ' + vn(NG.per) + ' × ' + (NG.pct * 100) + '%', vn(x.ng), pc(x.ng)] },
            { c: ['Quảng cáo + vận hành (đã dùng)', 'Ngân sách ' + vn(x.ns) + ' · ' + (x.qcThieu > 0 ? 'thiếu ' + vn(x.qcThieu) : 'dư ' + vn(x.qcDu)), vn(x.ads), pc(x.ads)] }
        ], ['TỔNG CHI PHÍ', '', vn(cp), pc(cp)])
        + H(4, 'Lợi nhuận & tiền trong tài khoản')
        + '<div class="two"><div class="box"><h4>Cách tính lợi nhuận</h4>' + dtl('Doanh số', vn(tot)) + dtl('− Chuyển hàng', vn(x.chuyen)) + dtl('− Lương + hoa hồng', vn(x.sal)) + dtl('− Phí ông Nghĩa', vn(x.ng)) + dtl('− QC đã dùng', vn(x.ads)) + dtl('= LỢI NHUẬN', vn(x.loi), 1) + '</div>'
        + '<div class="box"><h4>Tiền trong tài khoản (Thịnh)</h4>' + dtl('Tiền Thịnh nhận vào TK', vn(x.nhanTh)) + (x.qcDu > 0 ? dtl('+ QC dư', vn(x.qcDu)) : '') + dtl('− Lương + hoa hồng', vn(x.sal)) + dtl('− Phí ông Nghĩa', vn(x.ng)) + dtl('− Ngân sách QC', vn(x.ns)) + (x.qcThieu > 0 ? dtl('− QC thiếu', vn(x.qcThieu)) : '') + dtl(x.conlai >= 0 ? '= Còn dư, không cần nạp' : '= Cần nạp thêm', vn(Math.abs(x.conlai)), 1) + '</div></div>'
        + H(5, 'Các khoản nhận vào', 'so với doanh số')
        + (nhanRows.length ? tbl([['STT'], ['Ngày'], ['Ghi chú'], ['Người thu'], ['Số tiền (VND)', 1]], nhanRows, ['', '', 'Tổng các khoản nhận', '', vn(x.nhanT)]) : '<p class="nt">Chưa có khoản nhận nào.</p>')
        + '<p class="nt">Doanh số ' + vn(tot) + ' − tiền nhận ' + vn(x.nhanT) + ' = <b style="color:' + (x.conNhan > 0 ? RED : BLK) + '">' + (x.conNhan > 0 ? 'còn thiếu ' : 'dư ') + vn(Math.abs(x.conNhan)) + ' đ</b>. Trong đó Thịnh nhận ' + vn(x.nhanTh) + ' đ (dùng tính tiền còn lại).</p>'
        + H(6, 'Doanh số theo khách hàng')
        + tbl([['Khách hàng'], ['Số đơn', 1], ['Kg', 1], ['m³', 1], ['Doanh số (VND)', 1], ['Tỷ trọng', 1], ['Đã thu', 1], ['Chưa thu', 1]], GK.map(o => ({ c: ['<b>' + esc(o.k) + '</b>', o.n, vn1(o.kg, 1), o.m3 ? vn1(o.m3, 2) : '–', vn(o.t), gs.t ? (o.t / gs.t * 100).toFixed(1) + '%' : '–', o.y ? vn(o.y) : '–', o.no ? '<b style="color:' + RED + '">' + vn(o.no) + '</b>' : '–'] })), ['Tổng', gs.n, vn1(gs.kg, 1), vn1(gs.m3, 2), vn(gs.t), '100%', vn(gs.y), vn(gs.no)])
        + H(7, 'Công nợ khách hàng', 'tất cả các tháng · tính đến ' + new Date().toLocaleDateString('vi-VN'))
        + (D.length ? tbl([['Khách'], ['Số đơn', 1], ['< 10 ngày', 1], ['10–30 ngày', 1], ['> 30 ngày', 1], ['Chưa giao', 1], ['Tổng nợ (VND)', 1]], D.map(o => ({ c: ['<b>' + esc(o.k) + '</b>', o.n, o.b[0] ? vn(o.b[0]) : '–', o.b[1] ? vn(o.b[1]) : '–', o.b[2] ? '<b style="color:' + RED + '">' + vn(o.b[2]) + '</b>' : '–', o.b[3] ? vn(o.b[3]) : '–', '<b>' + vn(o.tot) + '</b>'] })), ['Tổng', DN, vn(DB[0]), vn(DB[1]), vn(DB[2]), vn(DB[3]), vn(DT)]) : '<p class="nt">Không có công nợ. Tất cả đơn đã thu.</p>')
        + H(8, 'Lợi nhuận theo từng tháng')
        + '<div class="lgd"><u style="background:#111"></u>Doanh số<u style="background:' + RED + '"></u>Lợi nhuận</div>' + mch
        + tbl([['Tháng'], ['Doanh số', 1], ['Tổng chi phí', 1], ['Lợi nhuận', 1], ['Biên', 1]], MD.map(m => ({ c: [mk(m.k), vn(m.d), vn(m.c), '<b style="color:' + (m.l >= 0 ? '#111' : RED) + '">' + vn(m.l) + '</b>', m.d ? (m.l / m.d * 100).toFixed(1) + '%' : '–'], cls: m.k === S.cur ? 'cur' : '' })), ['Tổng', vn(AT.d), vn(AT.c), vn(AT.l), AT.d ? (AT.l / AT.d * 100).toFixed(1) + '%' : '–'])
        + '<div class="pb"></div>' + H(9, 'Chi tiết đơn hàng ' + esc(mk(S.cur)), R.length + ' dòng')
        + tbl([['#'], ['Ngày giao'], ['Khách'], ['Thu tiền'], ['Hàng về'], ['Số lượng', 1], ['Kg', 1], ['m³', 1], ['Tính theo'], ['Cước (VND)', 1], ['Chuyến / ghi chú']], rowsO, ['', '', 'Tổng', '', '', R.reduce((a, r) => a + n(r.q), 0) || '', vn1(kgs, 1), vn1(x.m3, 2), '', vn(tot), ''])
        + '<p class="nt">* kg in nghiêng là hàng tính theo khối: không cộng vào tổng kg.</p>'
        + '<div class="ft"><span>Sokmok Transport · Hotline 0865 491 456</span><span>Chi phí = chuyển hàng + lương + hoa hồng + phí ông Nghĩa + QC đã dùng</span></div></div>';
}
function renderExtra() {
    const own = !!me && me.r === 'owner'; $('tabln').classList.toggle('hid', !own);
    if (!own) { if (tab === 'ln') showTab('tong') } else lnRender();
    renderStrip(); try { renderDebtTab() } catch (e) { console.error(e) } debtCheck()
}
function lnRender() {
    const x = lnData(), M = S.months[S.cur], inp = (k, v) => `<input data-pf="${k}" inputmode="numeric" value="${v ? vn(v) : ''}" placeholder="0">`, row = (l, v, c) => `<div class="lnr ${c || ''}"><span>${l}</span><span>${v}</span></div>`;
    const cp = x.chuyen + x.sal + x.ng + x.ads, card = (t, v, c) => `<div class="${c || ''}"><small>${t}</small><b>${v}</b></div>`;
    $('lnm').textContent = mk(S.cur).toLowerCase();
    $('lnk').innerHTML = card('Tổng doanh số', vn(x.d.tot) + ' đ') + card('Tổng chi phí', vn(cp) + ' đ') + card('LỢI NHUẬN', vn(x.loi) + ' đ', x.loi >= 0 ? 'g' : 'r') + card('Khoản cần nạp thêm', x.nap > 0 ? vn(x.nap) + ' đ' : 'Không cần nạp', x.nap > 0 ? 'r' : 'g') + card(x.conNhan > 0 ? 'Còn thiếu so với doanh số' : 'Dư so với doanh số', vn(Math.abs(x.conNhan)) + ' đ', x.conNhan > 0 ? 'r' : 'g') + card('Biên lợi nhuận', x.d.tot ? (x.loi / x.d.tot * 100).toFixed(1) + '%' : '–', x.loi >= 0 ? 'g' : 'r');
    const P = [['Chuyển hàng', x.chuyen, '#1f4e9e'], ['Lương + hoa hồng', x.sal, '#e0a526'], ['Phí ông Nghĩa', x.ng, '#8e5ad7'], ['QC + vận hành', x.ads, '#e07a26'], ['Lợi nhuận', Math.max(0, x.loi), '#2e9e5b']], T = Math.max(x.d.tot, 1);
    $('lnb').innerHTML = P.map(([l, v, c]) => `<div title="${l}: ${vn(v)}" style="width:${v / T * 100}%;background:${c}"></div>`).join('');
    $('lnl').innerHTML = P.map(([l, v, c]) => `<span><i style="background:${c}"></i>${l}: <b>${vn(v)}</b> (${(v / T * 100).toFixed(1)}%)</span>`).join('');
    $('lnf').innerHTML = row('Chi phí chuyển hàng (tự tính)', '<b>' + vn(x.chuyen) + '</b>') + `<div class="note" style="margin:0 0 6px">${vn1(x.sc.kg, 1)} kg (hàng tính theo kg) × 10.000 = ${vn(x.sc.a)}<br>${vn1(x.sc.m3, 2)} m³ × 90 USD × ${vn(S.rate)} = ${vn(x.sc.b)}<br>${vn(x.sc.nho)} kiện nhỏ × 20 USD × ${vn(S.rate)} = ${vn(x.sc.c)}` + (x.sc.nK ? `<br><i>Không tính ${vn1(x.sc.kgK, 1)} kg của ${x.sc.nK} dòng «Theo khối» (chỉ dùng tính phí ông Nghĩa)</i>` : '') + `</div>` + row('Ngân sách QC + vận hành', inp('ns', x.ns)) + row('Đã sử dụng QC + vận hành', inp('ads', x.ads)) + row('Tiền còn lại trong tài khoản (tự tính)', '<b style="color:' + (x.conlai >= 0 ? '#1e8e4e' : '#c8201c') + '">' + vn(x.conlai) + '</b>') + '<div class="note" style="margin:0 0 6px">= ' + vn(x.nhanTh) + ' (Thịnh nhận vào)' + (x.qcDu > 0 ? ' + ' + vn(x.qcDu) + ' (QC dư)' : '') + ' − ' + vn(x.sal) + ' − ' + vn(x.ng) + ' − ' + vn(x.ns) + (x.qcThieu > 0 ? ' − ' + vn(x.qcThieu) + ' (QC thiếu)' : '') + '. Số này luôn bằng «còn dư» ở Bước 5.</div>';
    $('lnn').innerHTML = (x.nhanL.map((q, i) => row(`Khoản ${i + 1} · ${fd(q.d) || '–'}${q.lbl ? ' · ' + esc(q.lbl) : ''}`, vn(q.amt))).join('') || '<p class="note" style="margin:4px 0">Chưa có khoản nào.</p>') + row('Tổng các khoản nhận', vn(x.nhanT), 't') + row('Trong đó Thịnh nhận (dùng tính tiền còn lại)', vn(x.nhanTh)) + '<p class="note" style="margin:6px 0 0">Lấy tự động từ tab «Chi phí đã thu» (khoản Thịnh thu tiền Việt, cộng thêm khoản anh Sakhen và anh Diện thu, tiền đô quy đổi theo tỷ giá). Muốn thêm hoặc sửa thì vào tab đó.</p>';
    $('lnnet').innerHTML = `<h3 style="margin:0 0 6px">Thiếu / dư so với doanh số</h3>` + row('Tổng các khoản nhận', vn(x.nhanT)) + row('Doanh số tháng', vn(x.d.tot)) + row(x.conNhan > 0 ? 'Còn thiếu' : 'Dư', `<span style="color:${x.conNhan > 0 ? '#c8201c' : '#1e8e4e'}">${vn(Math.abs(x.conNhan))}</span>`, 't');
    $('lnc').innerHTML = row('Doanh số', vn(x.d.tot)) + row('− Chuyển hàng', vn(x.chuyen)) + row('− Lương + hoa hồng', vn(x.sal)) + row('− Phí ông Nghĩa', vn(x.ng)) + row('− QC đã dùng', vn(x.ads)) + row('= Lợi nhuận', vn(x.loi), 't') + row('Tiền nhận vào TK', vn(x.nhanT)) + row('− Nạp thêm', vn(x.napA)) + row('= Thực nhận', vn(x.thuc)) + row(x.conNhan > 0 ? 'Còn thiếu so với doanh số' : 'Dư so với doanh số', vn(Math.abs(x.conNhan)), 't') + row('Tiền còn lại − lương − phí Nghĩa − ngân sách QC' + (x.qcThieu > 0 ? ' − QC thiếu' : ''), vn(-x.nap)) + row(x.nap > 0 ? 'Cần nạp thêm' : 'Dư, không cần nạp', vn(Math.abs(x.nap)), 't');
    $('lnpre').textContent = lnText(); try { lnExplain(x) } catch (e) { console.error(e) }
    const ks = Object.keys(S.months).sort(); let TT = { d: 0, c: 0, l: 0 };
    $('lnmt').innerHTML = '<thead><tr><th>Tháng</th><th>Doanh số</th><th>Tổng chi phí</th><th>Lợi nhuận</th><th>Biên lợi nhuận</th></tr></thead><tbody>' + ks.map(k => { const y = lnDataOf(S.months[k]), c = y.chuyen + y.sal + y.ng + y.ads; TT.d += y.d.tot; TT.c += c; TT.l += y.loi; return `<tr${k === S.cur ? ' class="c1"' : ''}><td>${mk(k)}</td><td class="num">${vn(y.d.tot)}</td><td class="num">${vn(c)}</td><td class="num"><b style="color:${y.loi >= 0 ? '#1e8e4e' : '#c8201c'}">${vn(y.loi)}</b></td><td class="num">${y.d.tot ? (y.loi / y.d.tot * 100).toFixed(1) + '%' : '–'}</td></tr>` }).join('') + `</tbody><tfoot><tr><td>Tổng</td><td class="num">${vn(TT.d)}</td><td class="num">${vn(TT.c)}</td><td class="num">${vn(TT.l)}</td><td class="num">${TT.d ? (TT.l / TT.d * 100).toFixed(1) + '%' : '–'}</td></tr></tfoot>`
}
const pfOf = () => { const M = S.months[S.cur]; M.pf = M.pf || {}; if (!Array.isArray(M.pf.nh)) M.pf.nh = lnData().nhan; if (!Array.isArray(M.pf.tr)) M.pf.tr = []; return M.pf };
$('tp-ln').addEventListener('change', e => {
    const t = e.target, v = Number(String(t.value).replace(/\D/g, '')) || 0; if (t.dataset.pf === undefined && t.dataset.nh === undefined) return;
    const p = pfOf(); if (t.dataset.pf) p[t.dataset.pf] = v; else p.nh[+t.dataset.nh] = v; save(); all()
});
$('tp-ln').addEventListener('change', e => {
    const t = e.target; if (t.dataset.tl === undefined && t.dataset.tv === undefined) return;
    const p = pfOf(); if (t.dataset.tl !== undefined) p.tr[+t.dataset.tl].l = t.value.trim(); else p.tr[+t.dataset.tv].v = Number(String(t.value).replace(/\D/g, '')) || 0; save(); all()
});
$('tp-ln').addEventListener('click', e => {
    const t = e.target; if (t.id === 'lntadd') { const p = pfOf(); p.tr.push({ l: p.tr.length ? '' : 'Tiền chuyển hàng', v: 0 }); save(); all() } if (t.dataset.tx2 !== undefined) { pfOf().tr.splice(+t.dataset.tx2, 1); save(); all() }
    if (t.id === 'lnadd') { pfOf().nh.push(0); save(); all() } if (t.dataset.nx !== undefined) { pfOf().nh.splice(+t.dataset.nx, 1); save(); all() }
});
/* Thanh «đơn chưa thu» ở tab Đơn hàng + nút gửi nhắc nợ ngay */
function overdue(days) {
    const G = {}, now = new Date(); now.setHours(0, 0, 0, 0);
    Object.values(S.months).forEach(M => (M.rows || []).forEach(r => { if (pd(r) !== 'no' || !fee(r) || !r.g) return; const dd = Math.floor((now - new Date(r.g)) / 864e5); if (dd >= days) (G[r.k] = G[r.k] || []).push({ r, dd }) }));
    return G
}
function renderStrip() {
    const el = $('dstrip'); if (!el) return; let c = 0, t = 0;
    Object.values(S.months).forEach(M => (M.rows || []).forEach(r => { if (pd(r) === 'no' && fee(r)) { c++; t += fee(r) } }));
    const G = overdue(10), ks = Object.keys(G), co = ks.reduce((a, k) => a + G[k].length, 0), to = ks.reduce((a, k) => a + G[k].reduce((b, x) => b + fee(x.r), 0), 0);
    el.innerHTML = `<span class="chip">Chưa thu: <b>${c}</b> đơn · ${vn(t)} đ</span> <span class="chip" style="${co ? 'background:#fde8e7;color:#b3261e' : ''}">Quá 10 ngày từ ngày giao: <b>${co}</b> đơn · ${vn(to)} đ</span> ${me && me.r === 'owner' ? `<span class="chip">Chi phí chuyển hàng tháng này: <b>${vn(shipCost(S.months[S.cur]).tot)} đ</b></span>` : ''} ${co && isAd() ? '<button id="dnow">Gửi nhắc nợ Telegram ngay</button>' : ''}`
}
document.addEventListener('click', e => {
    if (e.target.id !== 'dnow') return; const G = overdue(10);
    ask('Gửi nhắc nợ Telegram cho ' + Object.keys(G).length + ' khách đang quá 10 ngày?', 'Gửi ngay').then(ok => {
        if (!ok) return; Object.entries(G).forEach(([k, a]) => { const tot = a.reduce((b, x) => b + fee(x.r), 0); tgNotify('debt', { user: me.u, k, days: 10, total: tot, text: `⏰ NHẮC CÔNG NỢ – ${k}\n` + a.map(x => `• Giao ${fd(x.r.g)} (${x.dd} ngày): ${vn(fee(x.r))} VNĐ`).join('\n') + `\nTổng: ${vn(tot)} VNĐ` }) }); toast('ok', 'Đã gửi nhắc nợ.')
    })
});
$('lncp').onclick = () => { const t = lnText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('ok', 'Đã sao chép báo cáo.'), () => prompt('Sao chép báo cáo:', t)) };
/* Nhắc công nợ: khách khớp tên + đã giao đủ số ngày mà vẫn «Chưa thu» thì báo Telegram 1 lần.
   Đổi khách / số ngày ở DEBT_RULES. Lưu ý: chỉ chạy khi có tài khoản quản trị đang mở trang. */
const DEBT_RULES = [{ m: /chả cá/i, days: 10 }];
let DB_T = 0;
function debtCheck() {
    if (!SB_ON || !me || !isAd() || !S.months || Date.now() - DB_T < 6e4) return; DB_T = Date.now();
    S.cfg = S.cfg || {}; const sent = S.cfg.dn = S.cfg.dn || {}, G = {}, now = new Date(); now.setHours(0, 0, 0, 0);
    Object.entries(S.months).forEach(([mo, M]) => (M.rows || []).forEach(r => {
        const rule = DEBT_RULES.find(x => x.m.test(r.k || '')); if (!rule || !r.g || pd(r) !== 'no' || !fee(r)) return;
        const days = Math.floor((now - new Date(r.g)) / 864e5), key = [mo, r.k, r.g, r.d, r.q, r.kg, r.m3].join('|');
        if (days < rule.days || sent[key]) return; (G[r.k] = G[r.k] || { rule, a: [] }).a.push({ key, r, days })
    }));
    const ks = Object.keys(G); if (!ks.length) return;
    ks.forEach(k => {
        const g = G[k], tot = g.a.reduce((a, x) => a + fee(x.r), 0);
        const text = `⏰ NHẮC CÔNG NỢ – ${k}\nĐã quá ${g.rule.days} ngày kể từ khi giao, chưa thu tiền:\n` + g.a.map(x => `• Giao ${fd(x.r.g)} (${x.days} ngày): ${vn(fee(x.r))} VNĐ`).join('\n') + `\nTổng: ${vn(tot)} VNĐ`;
        tgNotify('debt', { user: me.u, k, days: g.rule.days, total: tot, text }); g.a.forEach(x => sent[x.key] = new Date().toISOString().slice(0, 10))
    });
    save()
}

function momDelta(tot) {
    const ks = Object.keys(S.months).sort(), i = ks.indexOf(S.cur); if (i < 1) return '';
    const pk = ks[i - 1], pv = mcalc(S.months[pk]).tot; if (!pv) return '';
    const d = (tot - pv) / pv * 100;
    return `<span style="color:${d >= 0 ? '#1e8e4e' : '#c8201c'};font-weight:600">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span> so với ${mk(pk).toLowerCase()} (${f(pv)})`
}

/* ---- Tab Công nợ: tổng hợp đơn chưa thu theo khách và theo số ngày ---- */
function debtData() {
    const now = new Date(), G = {}; now.setHours(0, 0, 0, 0);
    Object.keys(S.months).sort().forEach(mo => (S.months[mo].rows || []).forEach(r => {
        if (pd(r) !== 'no' || !fee(r)) return;
        const k = key(r.k), o = G[k] = G[k] || { k, n: 0, tot: 0, b: [0, 0, 0, 0], max: -1, L: [] }, dd = r.g ? Math.floor((now - new Date(r.g)) / 864e5) : null, bi = dd == null ? 3 : dd < 10 ? 0 : dd <= 30 ? 1 : 2;
        o.n++; o.tot += fee(r); o.b[bi] += fee(r); if (dd != null && dd > o.max) o.max = dd; o.L.push({ r, dd })
    }));
    return Object.values(G).sort((a, b) => b.tot - a.tot)
}
function debtText(o) {
    return `⏰ NHẮC CÔNG NỢ – ${o.k}\n` + o.L.map(x => `• ${x.r.g ? 'Giao ' + fd(x.r.g) + ' (' + x.dd + ' ngày)' : 'Hàng về ' + (fd(x.r.d) || '?')}: ${vn(fee(x.r))} VNĐ`).join('\n') + `\nTổng: ${vn(o.tot)} VNĐ\nVui lòng thanh toán giúp Sokmok Transport. Hotline 0865 491 456. Xin cảm ơn!`
}
function renderDebtTab() {
    const el = $('dt'); if (!el) return;
    const D = debtData(), T = D.reduce((a, o) => a + o.tot, 0), N = D.reduce((a, o) => a + o.n, 0), B = [0, 1, 2, 3].map(i => D.reduce((a, o) => a + o.b[i], 0));
    const card = (t, v, s, c) => `<div class="k ${c || ''}"><small>${t}</small><b>${v}</b>${s ? `<div class="s">${s}</div>` : ''}</div>`;
    $('dcards').innerHTML = card('Tổng công nợ', vn(T) + ' đ', N + ' đơn · ' + D.length + ' khách', 'big') + card('Dưới 10 ngày', vn(B[0]) + ' đ') + card('10–30 ngày', `<span class="${B[1] ? 'neg' : ''}">${vn(B[1])} đ</span>`) + card('Trên 30 ngày', `<span class="${B[2] ? 'neg' : ''}">${vn(B[2])} đ</span>`) + card('Chưa có ngày giao', vn(B[3]) + ' đ');
    el.innerHTML = '<thead><tr><th>Khách</th><th>Số đơn</th><th>Dưới 10 ngày</th><th>10–30 ngày</th><th>Trên 30 ngày</th><th>Chưa giao</th><th>Tổng nợ (VND)</th><th>Lâu nhất</th><th></th></tr></thead><tbody>' +
        (D.map(o => `<tr><td><b>${esc(o.k)}</b></td><td class="num">${o.n}</td><td class="num">${o.b[0] ? vn(o.b[0]) : '–'}</td><td class="num">${o.b[1] ? vn(o.b[1]) : '–'}</td><td class="num">${o.b[2] ? `<b class="neg">${vn(o.b[2])}</b>` : '–'}</td><td class="num">${o.b[3] ? vn(o.b[3]) : '–'}</td><td class="num"><b>${vn(o.tot)}</b></td><td class="num">${o.max >= 0 ? o.max + ' ngày' : '–'}</td><td><button data-dcp="${esc(o.k)}">Sao chép nhắc nợ</button></td></tr>`).join('') || '<tr><td colspan="9" style="padding:14px;color:var(--mu)">Không có công nợ. Tất cả đơn đã thu.</td></tr>') +
        (D.length ? `</tbody><tfoot><tr><td>Tổng</td><td class="num">${N}</td><td class="num">${vn(B[0])}</td><td class="num">${vn(B[1])}</td><td class="num">${vn(B[2])}</td><td class="num">${vn(B[3])}</td><td class="num">${vn(T)}</td><td colspan="2"></td></tr></tfoot>` : '</tbody>')
}
$('tp-no').addEventListener('click', e => {
    const b = e.target.closest('[data-dcp]'); if (!b) return;
    const o = debtData().find(x => x.k === b.dataset.dcp); if (!o) return; const t = debtText(o);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('ok', 'Đã sao chép nhắc nợ ' + o.k + '.'), () => prompt('Sao chép tin nhắn:', t))
});


/* ---- Chi phí chuyển hàng: 10.000 đ/kg, 90 USD/khối, 20 USD/kiện nhỏ ---- */
function shipCost(M) {
    const C = { kg: 10000, m3: 90, nho: 20 }; let kg = 0, m3 = 0, nho = 0, kgK = 0, nK = 0;
    /* Dòng «Theo khối» chỉ tính theo m³; kg của dòng đó KHÔNG tính vào cước chuyển hàng (chỉ dùng tính phí ông Nghĩa) */
    (M.rows || []).forEach(r => { if (r.by === 'M3') { kgK += n(r.kg); nK++ } else kg += n(r.kg); m3 += n(r.m3); if (r.loai === 'nho') nho += n(r.q) || 1 });
    const a = kg * C.kg, b = m3 * C.m3 * S.rate, c = nho * C.nho * S.rate;
    return { kg, kgK, nK, m3, nho, a, b, c, tot: a + b + c }
}
/* ---- Chức năng đơn hàng: đổi nhanh thu tiền, nhân bản, đã thu hết (đang lọc), xuất CSV ---- */
$('bulkpaid').onclick = async () => {
    if (!isAd()) return; const T = view().map(i => S.rows[i]).filter(r => pd(r) === 'no');
    if (!T.length) { await ask('Không có đơn «Chưa thu» nào trong danh sách đang lọc.', 'Đóng'); return }
    if (!await ask(`Đánh dấu <b>Đã thu</b> cho <b>${T.length}</b> đơn (tổng ${f(T.reduce((a, r) => a + fee(r), 0))} VND) đang hiện trong bảng?`, 'Đã thu hết')) return;
    T.forEach(r => { r.paid = 'yes' }); save(); all()
};
$('csvx').onclick = () => {
    const ix = view(), XE = effXe(ix.map(i => S.rows[i])), q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const H = ['STT', 'Ngày giao', 'Khách', 'Thu tiền', 'Ngày hàng về', 'Số lượng', 'Đơn vị', 'Kg', 'm3', 'Cước VND', 'Cước USD', 'Tính theo', 'Số xe', 'Số đơn', 'Chuyến xe', 'Loại', 'Ghi chú'];
    const rows = ix.map((i, k) => { const r = S.rows[i]; return [k + 1, fd(r.g), r.k, PL[pd(r)], fd(r.d), n(r.q), r.u, n(r.kg), n(r.m3), Math.round(fee(r)), isU(r) ? n(r.usd) : (rt(r) ? Math.round(fee(r) / rt(r) * 100) / 100 : 0), BY[r.by] || r.by, XE[k], n(r.don), (r.trip || '').trim(), r.loai === 'le' ? 'Hỏa tốc' : r.loai === 'nho' ? 'Kiện nhỏ' : 'Theo xe', [r.note || '', spNote(r)].filter(Boolean).join('; ')] });
    const csv = '\ufeff' + [H, ...rows].map(x => x.map(q).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'don-hang-' + S.cur + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000)
};
let tab = 'tong';
function showTab(t) { tab = t; document.querySelectorAll('.tp').forEach(e => e.classList.toggle('hid', e.id !== 'tp-' + t)); document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); try { const tb = $('tabs'), a = tb.querySelector('button.on'); if (a) tb.scrollTo({ left: a.offsetLeft - (tb.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' }) } catch (e) { } }
$('tabs').onclick = e => { const t = e.target.dataset.tab; if (t) showTab(t) };
$('cpw').onclick = () => form('Đổi mật khẩu', [{ k: 'p', l: 'Mật khẩu mới', t: 'password', req: 1, min: 6, w: 1 }], {}, o => { const a = U.find(x => x.u === me.u); if (!a) return; const sl = salt(); hash(o.p, sl).then(h => { a.s = sl; a.h = h; delete a.h2; saveU() }) }, 'Mật khẩu cũ sẽ không dùng được nữa.');
$('sp').onchange = e => { $('lp').type = e.target.checked ? 'text' : 'password' };
function editRow(i) { const r = S.rows[i]; if (!r || !isAd()) return; form('Sửa đơn hàng', RF, { ...r, paid: pd(r), rate: r.rate || S.rate }, o => { fixUsd(o); Object.assign(S.rows[i], o) }, 'Tính theo kg: cước = kg × đơn giá cước. Tính theo khối: nhập m³ và đơn giá USD/m³, cước USD và VND tự tính. Chọn VND thì nhập cước VND. Chọn USD thì nhập cước USD, cước VND tự tính theo tỷ giá lúc nhập.') }
function editPay(i) { const p = S.pays[i]; if (!p || !isAd()) return; form('Sửa khoản thu', PF, { ...p }, o => { Object.assign(S.pays[i], o) }) }
document.addEventListener('click', e => {
    const t = e.target;
    if (t.dataset.edit !== undefined) editRow(+t.dataset.edit);
    if (t.dataset.editp !== undefined) editPay(+t.dataset.editp);
    document.querySelectorAll('details.mn[open]').forEach(d => { if (!d.contains(t) || t.closest('.dd button')) d.open = false })
});
$('tb').addEventListener('click', e => { const tr = e.target.closest('tr[data-row]'); if (tr && !e.target.closest('button')) showRow(+tr.dataset.row) });
$('pay').addEventListener('click', e => { const tr = e.target.closest('tr[data-prow]'); if (tr && !e.target.closest('button')) showPay(+tr.dataset.prow) });
const ldHide = () => { clearInterval(ldTimer); clearInterval(ldPT); $('ldp').textContent = '100%'; if ($('ldb')) $('ldb').style.width = '100%'; const e = $('ld'); if (e.classList.contains('hid')) return; e.classList.add('out'); setTimeout(() => e.classList.add('hid'), 520) };
$('ldr').onclick = () => location.reload();
let ldPv = 0; const ldPT = setInterval(() => { ldPv += (92 - ldPv) * .06; const e = $('ldp'); if (e) e.textContent = Math.round(ldPv) + '%'; const bb = $('ldb'); if (bb) bb.style.width = Math.round(ldPv) + '%' }, 120);
const LDMSG = ['Đang kết nối máy chủ', 'Đang tải đơn hàng', 'Đang chuẩn bị báo cáo']; let ldi = 0;
const ldTimer = setInterval(() => { const e = $('ldt'); if (!e || $('ld').classList.contains('bad') || $('ld').classList.contains('hid')) return; ldi = Math.min(ldi + 1, LDMSG.length - 1); e.textContent = LDMSG[ldi] }, 1600);
async function boot() {
    const PG = SB_ON ? pullGet() : null;
    let cached = false;
    if (PG && S && S.months && U && U.some(a => a.u === 'admin')) { Object.assign(SB_REV, PG.rev); SB_READY = true; cached = true }
    if (SB_ON && !cached) {
        try {
            const R = await sbPull();
            let keepLocal = false; try { keepLocal = localStorage.getItem('bc-dirty-report') === '1' } catch (e) { }
            if (keepLocal && R.report && R.report.months) keepLocal = confirm('Lần trước có thay đổi (ví dụ khoản thu) CHƯA lưu được lên máy chủ.\n\nOK = giữ số liệu trên máy này và lưu lên máy chủ\nHủy = lấy số liệu từ máy chủ (thay đổi chưa lưu sẽ mất)');
            if (R.report && R.report.months && !keepLocal) {
                const cur = S.cur; S.rate = R.report.rate || S.rate; S.kg = R.report.kg || S.kg; S.months = R.report.months; S.cfg = R.report.cfg || S.cfg; mig();
                setMonth(S.months[cur] ? cur : Object.keys(S.months).sort().pop())
            }
            if (Array.isArray(R.users)) U = R.users;
            if (Array.isArray(R.pending)) PEND = R.pending;
            const i = U.findIndex(a => a.u === 'admin'); let fix = false;
            if (i < 0) { U.unshift(OWN); fix = true } else if (U[i].r !== 'owner') { U[i].r = 'owner'; fix = true }
            SB_READY = true;
            if (!R.report || keepLocal) save();           /* lần đầu: đưa dữ liệu hiện có lên máy chủ */
            if (!R.users || fix) saveU();
            if (!R.pending) savePend();
            pullSet(); tgRebase();
            try { localStorage.setItem(KEY, JSON.stringify({ rate: S.rate, kg: S.kg, cur: S.cur, months: S.months, cfg: S.cfg })); localStorage.setItem(UK, JSON.stringify(U)); localStorage.setItem(PK, JSON.stringify(PEND)) } catch (e) { }
        } catch (e) {
            if (S && S.months && U && U.length) { OFFLINE = true; SB_READY = false } else {
                $('ld').classList.add('bad'); $('ldt').textContent = 'Không kết nối được máy chủ dữ liệu (' + e.message + '). Kiểm tra mạng rồi tải lại trang.'; $('ldr').classList.remove('hid'); return
            }
        }
    }



    ldHide(); TOAST_ON = true;
    let stale = false; try { stale = Date.now() - (+localStorage.getItem('bc-act') || 0) > 5 * 60 * 1000 } catch (e) { }
    if (me && stale) { me = null; try { localStorage.removeItem('bc-me') } catch (e) { } }
    if (me && U.some(a => a.u === me.u && a.r === me.r)) enter(me); else showLogin();
}
boot();
async function sbSync() {
    if (!SB_ON || !SB_READY || SB_DEAD || !me || $('app').classList.contains('hid')) return;
    if (Object.values(SB_T).some(Boolean)) return;
    const a = document.activeElement; if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return;
    if (!$('md').classList.contains('hid')) return;
    try {
        const R = await sbPullKeys(['report', 'users', 'pending'], false), rv = R.__rev; let ch = false;
        const newer = k => R[k] !== undefined && rv[k] > (SB_REV[k] || 0) && !SB_T[k];
        if (newer('report') && R.report.months) { const __ns = nSnap(); const cur = S.cur; S.rate = R.report.rate || S.rate; S.kg = R.report.kg || S.kg; S.months = R.report.months; S.cfg = R.report.cfg || S.cfg; mig(); setMonth(S.months[cur] ? cur : Object.keys(S.months).sort().pop()); SB_REV.report = rv.report; saveLocal(); tgRebase(); ch = true; nDiff(__ns) }
        if (newer('users') && Array.isArray(R.users)) { U = R.users; SB_REV.users = rv.users; try { localStorage.setItem(UK, JSON.stringify(U)) } catch (e) { } ch = true }
        if (newer('pending') && Array.isArray(R.pending)) { PEND = R.pending; SB_REV.pending = rv.pending; try { localStorage.setItem(PK, JSON.stringify(PEND)) } catch (e) { } ch = true }
        if (ch) all()
    } catch (e) { }
}
setInterval(sbSync, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) sbSync() });
/* ===== Thông báo trên thiết bị: đơn mới, tiền đã thu, nợ quá hạn ===== */
const NK = 'sm-notify';
function nOn() { try { return localStorage.getItem(NK) === '1' && 'Notification' in window && Notification.permission === 'granted' } catch (e) { return false } }
async function nShow(title, body, tag) {
    if (!nOn()) return; const ic = (document.querySelector('link[rel=icon]') || {}).href, o = { body, tag: tag || 'sm', icon: ic, badge: ic, renotify: true };
    try { const r = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration(); if (r && r.showNotification) { await r.showNotification(title, o); return } } catch (e) { }
    try { new Notification(title, o) } catch (e) { }
}
function nSnap() { const m = new Map(); Object.values(S.months).forEach(M => (M.rows || []).forEach(r => m.set(r.id || [r.k, r.d, r.q, r.u, r.kg, r.m3, r.desc].join('|'), { k: r.k, p: pd(r), v: fee(r) }))); return m }
function nDiff(old) { try { if (!old.size) return; const nw = nSnap(), A = [], P = []; nw.forEach((v, id) => { const o = old.get(id); if (!o) A.push(v); else if (o.p !== 'yes' && v.p === 'yes') P.push(v) }); if (A.length && A.length <= 20) nShow('Có đơn mới', A.length === 1 ? (A[0].k || 'Khách') + ': ' + vn(A[0].v) + ' đ' : A.length + ' đơn mới vừa được thêm', 'sm-new'); if (P.length) nShow('Đã thu tiền', P.length === 1 ? (P[0].k || 'Khách') + ' đã thanh toán ' + vn(P[0].v) + ' đ' : P.length + ' đơn vừa được đánh dấu đã thu', 'sm-paid') } catch (e) { } }
function nDebt() { try { if (!nOn() || !me) return; const day = new Date().toISOString().slice(0, 10); if (localStorage.getItem(NK + '-d') === day) return; const G = overdue(10), ks = Object.keys(G); if (!ks.length) return; const co = ks.reduce((a, k) => a + G[k].length, 0), to = ks.reduce((a, k) => a + G[k].reduce((b, x) => b + fee(x.r), 0), 0); localStorage.setItem(NK + '-d', day); nShow('Công nợ quá 10 ngày', ks.length + ' khách · ' + co + ' đơn · ' + vn(to) + ' đ', 'sm-debt') } catch (e) { } }
setInterval(nDebt, 600000); setTimeout(nDebt, 8000); document.addEventListener('visibilitychange', () => { if (!document.hidden) nDebt() });
(function () {
    const dd = document.getElementById('tiDd'); if (!dd) return; dd.insertAdjacentHTML('beforeend', '<button type="button" id="pushbtn"></button>'); const b = document.getElementById('pushbtn'), up = () => { b.textContent = nOn() ? '🔔 Thông báo: đang bật (bấm để tắt)' : '🔕 Bật thông báo' }; up();
    b.onclick = async () => {
        if (!('Notification' in window)) { toast('err', 'Trình duyệt này chưa hỗ trợ thông báo. Trên iPhone: thêm trang vào Màn hình chính rồi mở từ đó.'); return }
        if (nOn()) { try { localStorage.setItem(NK, '0') } catch (e) { } up(); toast('ok', 'Đã tắt thông báo.'); return }
        const r = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
        if (r !== 'granted') { toast('err', 'Bạn chưa cho phép thông báo. Hãy bật quyền Thông báo cho trang này trong cài đặt trình duyệt.'); return }
        try { localStorage.setItem(NK, '1') } catch (e) { } up(); nShow('Sokmok Transport', 'Đã bật thông báo: đơn mới, tiền đã thu, nợ quá hạn.', 'sm-test')
    }
})();
