/* ================= XUẤT EXCEL BÁO CÁO THÁNG ================= */
const XL_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
const xlLoad = () => window.ExcelJS ? Promise.resolve() : new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = XL_CDN; s.onload = ok;
    s.onerror = () => no(new Error('Không tải được thư viện tạo Excel. Hãy kiểm tra kết nối mạng rồi thử lại.')); document.head.appendChild(s)
});
const xlDate = d => { if (!d) return null; const [y, m, x] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, x)) };
async function xlExport() {
    const btn = $('xl'), old = btn.innerHTML; btn.disabled = true; btn.textContent = 'Đang tạo file…';
    try { await xlLoad(); await xlBuild() } catch (e) { alert(e.message || e) } finally { btn.disabled = false; btn.innerHTML = old }
}
async function xlBuild() {
    const NAVY = '1F4E78', MON = '#,##0;(#,##0);"-"', USDF = '#,##0.00;(#,##0.00);"-"', INT = '#,##0;;"-"', M3 = '0.00;;"-"';
    const thin = { style: 'thin', color: { argb: 'FFBFBFBF' } }, BD = { top: thin, bottom: thin, left: thin, right: thin };
    const fill = c => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + c } });
    const put = (ws, a, v, o = {}) => {
        const c = ws.getCell(a); c.value = v;
        c.font = { name: 'Arial', size: o.sz || 10, bold: !!o.b, italic: !!o.i, color: { argb: 'FF' + (o.col || '000000') } };
        if (o.bg) c.fill = fill(o.bg); if (o.fmt) c.numFmt = o.fmt; if (o.bd) c.border = BD;
        c.alignment = { vertical: 'middle', horizontal: o.al || 'left', wrapText: !!o.wrap, indent: o.ind || 0 }; return c
    };
    const band = (ws, r, t, last, o) => { ws.mergeCells(`A${r}:${last}${r}`); put(ws, 'A' + r, t, o) };
    const mo = S.cur, yy = mo.slice(0, 4), M = Number(mo.slice(5)), SN = 'Báo cáo tháng ' + M, Q = `'${SN}'!`;
    const R = S.rows.map((r, i) => [r, i]).sort((a, b) => (a[0].g || '9999').localeCompare(b[0].g || '9999') || a[1] - b[1]).map(x => x[0]);
    const N = R.length, d1 = 21, d2 = d1 + Math.max(N, 1) - 1, T = d2 + 1;
    const sum = fn => R.reduce((a, r) => a + fn(r), 0), uo = r => isU(r) ? n(r.usd) : 0, vo = r => isU(r) ? 0 : fee(r);
    const wb = new ExcelJS.Workbook(); wb.creator = 'Sokmok Transport'; wb.created = new Date();
    const ws = wb.addWorksheet(SN, { properties: { tabColor: { argb: 'FF' + NAVY } }, views: [{ showGridLines: false }], pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    [6, 12, 34, 13, 9, 8, 11, 10, 16, 12, 18, 10, 8, 8, 46, 13, 12].forEach((w, i) => ws.getColumn(i + 1).width = w);
    const rg = c => `$${c}$${d1}:$${c}$${d2}`;
    const XEv = effXe(R);

    // ---- tiêu đề
    ws.getRow(1).height = 36; band(ws, 1, `BÁO CÁO THÁNG ${M}/${yy}`, 'Q', { b: 1, sz: 18, col: 'FFFFFF', bg: NAVY, al: 'center' });
    band(ws, 2, `Tổng hợp doanh số cước vận chuyển & chi phí đã thu (VND / USD)  ·  Sokmok Transport  ·  Xuất lúc ${new Date().toLocaleString('vi-VN')}`, 'Q', { i: 1, col: '595959', bg: 'DDEBF7', al: 'center' });
    ws.mergeCells('A4:H4'); put(ws, 'A4', 'Tỷ giá quy đổi (VND/USD)', { b: 1 }); put(ws, 'I4', S.rate, { b: 1, col: '0000FF', bg: 'FFFF00', fmt: '#,##0', bd: 1, al: 'right' });
    ws.mergeCells('A5:H5'); put(ws, 'A5', 'Đơn giá cước theo kg (VND/kg)', { b: 1 }); put(ws, 'I5', S.kg, { b: 1, col: '0000FF', bg: 'FFFF00', fmt: '#,##0', bd: 1, al: 'right' });
    put(ws, 'K4', '← ô nhập (xanh/vàng): đổi là toàn bộ bảng tự tính lại', { i: 1, col: '7F7F7F' }); put(ws, 'K5', '← ô nhập: đơn giá cước/kg', { i: 1, col: '7F7F7F' });

    // ---- I. tổng hợp
    band(ws, 6, 'I. TỔNG HỢP', 'Q', { b: 1, col: NAVY, bg: 'DDEBF7', sz: 11 });
    [['I7', 'VND'], ['J7', 'USD'], ['K7', 'Tổng quy đổi (VND)']].forEach(([a, t]) => put(ws, a, t, { b: 1, col: 'FFFFFF', bg: NAVY, al: 'center', bd: 1 }));
    const pays = S.pays, PT = 0; // placeholder, tính vị trí dòng bên dưới
    const pS = T + 4, pE = pS + Math.max(pays.length, 1) - 1, pT = pE + 1;
    const tv = sum(vo), tu = sum(uo), tk = sum(fee), pv = pays.reduce((a, p) => a + n(p.vnd), 0), pu = pays.reduce((a, p) => a + n(p.usd), 0);
    const nghia = R.filter(r => (r.k || '').toLowerCase().includes('nghĩa')), unpaid = R.filter(r => pd(r) === 'no');
    const rows = [
        ['Tổng doanh số (mỗi dòng chỉ tính 1 loại tiền)', [`I${T}`, tv], [`J${T}`, tu], [`I8+J8*$I$4`, tk], 'm'],
        ['Chi phí đã thu (theo các khoản thu ở mục III)', [`I${pT}`, pv], [`J${pT}`, pu], [`I9+J9*$I$4`, pv + pu * S.rate], 'm'],
        ['Còn phải thu (các đơn có trạng thái “Chưa thu”)', null, null, [`SUMIF(${rg('Q')},"Chưa thu",${rg('K')})`, unpaid.reduce((a, r) => a + fee(r), 0)], 'm'],
        ['Tổng số xe chuyển (đơn chung xe chỉ tính 1)', [`M${T}`, XEv.reduce((a, b) => a + b, 0)]],
        ['Tổng kiện đi giao (đơn nhỏ, không tính hỏa tốc & xe)', [`SUMIF(${rg('P')},"Đơn nhỏ",${rg('E')})`, sum(r => r.loai === 'nho' ? n(r.q) : 0)]],
        ['Tổng kiện hỏa tốc', [`SUMIF(${rg('P')},"Hỏa tốc",${rg('E')})`, sum(r => r.loai === 'le' ? n(r.q) : 0)]],
        ['Tổng số đơn hàng', [`N${T}`, sum(r => n(r.don))]],
        ['Tổng số lượng hàng (thùng/bao/kiện)', [`E${T}`, sum(r => n(r.q))], null, null, 'n'],
        ['Tổng khối lượng (kg)', [`G${T}`, sum(r => n(r.kg))], null, null, 'n'],
        ['Tổng thể tích (m³)', [`H${T}`, sum(r => n(r.m3))], null, null, 'v'],
        ['Tổng kg các đơn của anh Nghĩa', [`SUMIF(${rg('C')},"*nghĩa*",${rg('G')})`, nghia.reduce((a, r) => a + n(r.kg), 0)], null, null, 'n']];
    rows.forEach((x, i) => {
        const r = 8 + i, bg = i % 2 ? 'F7FAFD' : 'FFFFFF'; ws.mergeCells(`A${r}:H${r}`); put(ws, 'A' + r, x[0], { bg, ind: 1, bd: 1 });
        const fmt = x[4] === 'v' ? M3 : x[4] === 'm' ? MON : INT;
        [['I', x[1]], ['J', x[2]], ['K', x[3]]].forEach(([c, v]) => put(ws, c + r, v ? { formula: v[0], result: v[1] } : null, { bg, bd: 1, al: 'right', b: c === 'K' && x[4] === 'm', fmt: c === 'J' ? USDF : fmt }));
    });
    ws.getCell('K9').value = { formula: 'I9+J9*$I$4', result: tv + pu * 0 + (pv + pu * S.rate) - tv }; ws.getCell('K8').value = { formula: 'I8+J8*$I$4', result: tk };
    ws.getCell('K10').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFC00000' } };

    // ---- II. chi tiết
    band(ws, 19, 'II. CHI TIẾT ĐƠN HÀNG (theo từng xe / kiện)', 'Q', { b: 1, col: NAVY, bg: 'DDEBF7', sz: 11 });
    ws.getRow(20).height = 30;
    ['STT', 'Ngày giao', 'Khách / loại hàng', 'Ngày hàng về', 'Số lượng', 'Đơn vị', 'Khối lượng (kg)', 'Thể tích (m³)', 'Cước (VND)', 'Cước (USD)', 'Doanh số tính (VND)', 'Tính theo', 'Số xe', 'Số đơn', 'Ghi chú', 'Phân loại', 'Thu tiền']
        .forEach((t, i) => put(ws, String.fromCharCode(65 + i) + '20', t, { b: 1, col: 'FFFFFF', bg: NAVY, al: 'center', wrap: 1, bd: 1 }));
    const PLC = { no: 'C00000', yes: '2E7D32', free: '7F7F7F' };
    R.forEach((r, i) => {
        const x = d1 + i, bg = ['', 'BDD7EE', 'FCE4D6', 'E2EFDA', 'FFF2CC'][cl(r.k)], o = { bg, bd: 1 }, rr = n(r.rate) && n(r.rate) !== S.rate ? n(r.rate) : '$I$4';
        const note = (r.by === 'KG' ? `Tính theo kg (${f2(r.kg)} kg × đơn giá I5)` + (r.note ? '; ' : '') : isU(r) ? '' : n(r.m3) && !n(r.kg) ? `Tính theo khối (${f2(r.m3)} m³)` + (r.note ? '; ' : '') : '') + (r.note || '') + (r.trip ? (r.note ? '; ' : '') + 'Chuyến xe: ' + r.trip : '') + (spl(r).length ? '; ' + spNote(r) : '');
        put(ws, 'A' + x, i + 1, { ...o, al: 'center' }); put(ws, 'B' + x, xlDate(r.g), { ...o, al: 'center', fmt: 'dd/mm/yyyy' });
        put(ws, 'C' + x, r.k || '(chưa ghi khách)', { ...o, b: 1 }); put(ws, 'D' + x, xlDate(r.d), { ...o, al: 'center', fmt: 'dd/mm/yyyy' });
        put(ws, 'E' + x, n(r.q), { ...o, al: 'right', fmt: INT }); put(ws, 'F' + x, r.u || '', { ...o, al: 'center' });
        put(ws, 'G' + x, n(r.kg) || null, { ...o, al: 'right', fmt: INT }); put(ws, 'H' + x, n(r.m3) || null, { ...o, al: 'right', fmt: M3 });
        put(ws, 'I' + x, r.by === 'KG' ? { formula: `G${x}*$I$5`, result: fee(r) } : isU(r) ? null : n(r.vnd), { ...o, al: 'right', fmt: MON });
        put(ws, 'J' + x, isU(r) ? n(r.usd) : null, { ...o, al: 'right', fmt: USDF });
        put(ws, 'K' + x, { formula: `IF(L${x}="USD",J${x}*${rr},I${x})`, result: fee(r) }, { ...o, al: 'right', fmt: MON, b: 1 });
        put(ws, 'L' + x, isU(r) ? 'USD' : 'VND', { ...o, al: 'center', b: 1, col: isU(r) ? '1F6F43' : NAVY });
        put(ws, 'M' + x, XEv[i] || null, { ...o, al: 'center' }); put(ws, 'N' + x, n(r.don) || null, { ...o, al: 'center' });
        put(ws, 'O' + x, note, { ...o, wrap: 1, sz: 9 });
        put(ws, 'P' + x, r.loai === 'le' ? 'Hỏa tốc' : r.loai === 'nho' ? 'Đơn nhỏ' : 'Xe / lô hàng', { ...o, al: 'center' });
        put(ws, 'Q' + x, PL[pd(r)], { ...o, al: 'center', b: 1, col: PLC[pd(r)] });
    });
    if (!N) { ws.mergeCells(`A${d1}:Q${d1}`); put(ws, 'A' + d1, 'Tháng này chưa có đơn hàng', { i: 1, col: '7F7F7F', al: 'center' }) }
    ws.mergeCells(`A${T}:D${T}`);
    const tot = { b: 1, bg: 'F2F2F2', bd: 1, al: 'right' }, S_ = (c, fmt, v) => put(ws, c + T, { formula: `SUM(${c}${d1}:${c}${d2})`, result: v }, { ...tot, fmt });
    for (let c = 1; c <= 17; c++) put(ws, String.fromCharCode(64 + c) + T, null, tot);
    put(ws, 'A' + T, 'TỔNG CỘNG (mỗi dòng chỉ tính 1 loại tiền)', { ...tot, al: 'left' });
    S_('E', INT, sum(r => n(r.q))); S_('G', INT, sum(r => n(r.kg))); S_('H', M3, sum(r => n(r.m3))); S_('K', MON, tk); S_('M', INT, XEv.reduce((a, b) => a + b, 0)); S_('N', INT, sum(r => n(r.don)));
    put(ws, 'I' + T, { formula: `SUMIF(L${d1}:L${d2},"VND",I${d1}:I${d2})`, result: tv }, { ...tot, fmt: MON });
    put(ws, 'J' + T, { formula: `SUMIF(L${d1}:L${d2},"USD",J${d1}:J${d2})`, result: tu }, { ...tot, fmt: USDF });
    ws.autoFilter = `A20:Q${d2}`;

    // ---- III. chi phí đã thu
    band(ws, T + 2, 'III. CHI PHÍ ĐÃ THU (VND & USD)', 'Q', { b: 1, col: NAVY, bg: 'DDEBF7', sz: 11 });
    const h = T + 3; ws.mergeCells(`C${h}:H${h}`); ws.mergeCells(`M${h}:Q${h}`);
    [['A', 'STT'], ['B', 'Ngày thu'], ['C', 'Người thu'], ['I', 'Tiền Việt (VND)'], ['J', 'Đô (USD)'], ['K', 'Quy đổi (VND)'], ['L', 'Loại tiền'], ['M', 'Ghi chú']].forEach(([c, t]) => put(ws, c + h, t, { b: 1, col: 'FFFFFF', bg: NAVY, al: 'center', bd: 1 }));
    pays.forEach((p, i) => {
        const x = h + 1 + i, bg = i % 2 ? 'F7FAFD' : 'FFFFFF', o = { bg, bd: 1 }; ws.mergeCells(`C${x}:H${x}`); ws.mergeCells(`M${x}:Q${x}`);
        put(ws, 'A' + x, i + 1, { ...o, al: 'center' }); put(ws, 'B' + x, xlDate(p.d), { ...o, al: 'center', fmt: 'dd/mm/yyyy' }); put(ws, 'C' + x, p.w || '', { ...o, b: 1 });
        put(ws, 'I' + x, n(p.vnd) || null, { ...o, fmt: MON, al: 'right' }); put(ws, 'J' + x, n(p.usd) || null, { ...o, fmt: USDF, al: 'right' });
        put(ws, 'K' + x, { formula: `I${x}+J${x}*$I$4`, result: n(p.vnd) + n(p.usd) * S.rate }, { ...o, fmt: MON, al: 'right', b: 1 });
        put(ws, 'L' + x, { formula: `IF(N(J${x})>0,"USD","VND")`, result: n(p.usd) > 0 ? 'USD' : 'VND' }, { ...o, al: 'center' }); put(ws, 'M' + x, p.note || '', { ...o, sz: 9 });
    });
    if (!pays.length) { ws.mergeCells(`A${h + 1}:Q${h + 1}`); put(ws, 'A' + (h + 1), 'Chưa có khoản thu nào trong tháng', { i: 1, col: '7F7F7F', al: 'center' }) }
    ws.mergeCells(`A${pT}:H${pT}`); for (let c = 1; c <= 17; c++) put(ws, String.fromCharCode(64 + c) + pT, null, tot);
    put(ws, 'A' + pT, 'TỔNG ĐÃ THU', { ...tot, al: 'left' });
    put(ws, 'I' + pT, { formula: `SUM(I${pS}:I${pE})`, result: pv }, { ...tot, fmt: MON }); put(ws, 'J' + pT, { formula: `SUM(J${pS}:J${pE})`, result: pu }, { ...tot, fmt: USDF });
    put(ws, 'K' + pT, { formula: `SUM(K${pS}:K${pE})`, result: pv + pu * S.rate }, { ...tot, fmt: MON });

    // ---- ghi chú
    const nr = pT + 2; band(ws, nr, 'Ghi chú / cách dùng', 'Q', { b: 1, col: NAVY, bg: 'DDEBF7' });
    ['- Chữ xanh nền vàng = ô nhập (tỷ giá, đơn giá kg); các cột doanh số, tổng, thu là công thức, đổi ô nhập thì tự tính lại.',
        '- Mỗi dòng chỉ cộng 1 loại tiền theo cột “Tính theo” (VND hoặc USD). Đơn tính theo kg = khối lượng × đơn giá ở ô I5.',
        '- Màu dòng: xanh dương = anh Nghĩa, cam = chả cá, xanh lá = anh Trọng, vàng nhạt = khách khác. Cột “Thu tiền”: đỏ = chưa thu, xanh = đã thu.',
        '- Dùng nút lọc ở hàng tiêu đề mục II để lọc theo khách, loại đơn hoặc trạng thái thu. Sheet “Theo khách” tổng hợp doanh số từng khách.']
        .forEach((t, i) => { ws.mergeCells(`A${nr + 1 + i}:Q${nr + 1 + i}`); put(ws, 'A' + (nr + 1 + i), t, { col: '444444', sz: 9 }) });

    // ---- sheet Theo khách
    const cs = wb.addWorksheet('Theo khách', { properties: { tabColor: { argb: 'FF2E7D32' } }, views: [{ showGridLines: false }], pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    [32, 10, 12, 12, 10, 18, 18, 18, 11].forEach((w, i) => cs.getColumn(i + 1).width = w);
    cs.getRow(1).height = 32; band(cs, 1, `DOANH SỐ THEO KHÁCH – THÁNG ${M}/${yy}`, 'I', { b: 1, sz: 16, col: 'FFFFFF', bg: NAVY, al: 'center' });
    band(cs, 2, 'Số liệu liên kết tự động từ sheet “' + SN + '” (quy đổi VND)', 'I', { i: 1, col: '595959', bg: 'DDEBF7', al: 'center' });
    ['Khách', 'Số dòng', 'Số lượng', 'Khối lượng (kg)', 'Thể tích (m³)', 'Doanh số (VND)', 'Đã thu (VND)', 'Chưa thu (VND)', 'Tỷ trọng'].forEach((t, i) => put(cs, String.fromCharCode(65 + i) + '4', t, { b: 1, col: 'FFFFFF', bg: NAVY, al: 'center', wrap: 1, bd: 1 }));
    const g = {}; R.forEach(r => { const k = key(r.k); (g[k] = g[k] || { k, c: cl(r.k), r: [] }).r.push(r) });
    const L = Object.values(g).sort((a, b) => a.r.reduce((s, r) => s + fee(r), 0) < b.r.reduce((s, r) => s + fee(r), 0) ? 1 : -1), c1 = 5, cT = c1 + L.length, cs_ = (a, k) => a.r.reduce((s, r) => s + n(r[k]), 0);
    const col = c => `${Q}$${c}$${d1}:$${c}$${d2}`;
    L.forEach((o, i) => {
        const x = c1 + i, bg = ['', 'BDD7EE', 'FCE4D6', 'E2EFDA', 'FFF2CC'][o.c], b = { bg, bd: 1, al: 'right' }, rev = o.r.reduce((s, r) => s + fee(r), 0);
        const sf = (c, st) => st ? `SUMIFS(${col('K')},${col('C')},$A${x},${col('Q')},"${st}")` : `SUMIF(${col('C')},$A${x},${col(c)})`;
        put(cs, 'A' + x, o.k, { ...b, al: 'left', b: 1 });
        put(cs, 'B' + x, { formula: `COUNTIF(${col('C')},$A${x})`, result: o.r.length }, { ...b, fmt: INT }); put(cs, 'C' + x, { formula: sf('E'), result: cs_(o, 'q') }, { ...b, fmt: INT });
        put(cs, 'D' + x, { formula: sf('G'), result: cs_(o, 'kg') }, { ...b, fmt: INT }); put(cs, 'E' + x, { formula: sf('H'), result: cs_(o, 'm3') }, { ...b, fmt: M3 });
        put(cs, 'F' + x, { formula: sf('K'), result: rev }, { ...b, fmt: MON, b: 1 });
        put(cs, 'G' + x, { formula: sf('K', 'Đã thu'), result: o.r.filter(r => pd(r) === 'yes').reduce((s, r) => s + fee(r), 0) }, { ...b, fmt: MON });
        put(cs, 'H' + x, { formula: sf('K', 'Chưa thu'), result: o.r.filter(r => pd(r) === 'no').reduce((s, r) => s + fee(r), 0) }, { ...b, fmt: MON, col: 'C00000' });
        put(cs, 'I' + x, { formula: `IF($F$${cT}=0,0,F${x}/$F$${cT})`, result: tk ? rev / tk : 0 }, { ...b, fmt: '0.0%' });
    });
    for (let c = 1; c <= 9; c++) put(cs, String.fromCharCode(64 + c) + cT, null, { ...tot, al: 'right' });
    put(cs, 'A' + cT, 'TỔNG CỘNG', { ...tot, al: 'left' });
    [['B', INT, N], ['C', INT, sum(r => n(r.q))], ['D', INT, sum(r => n(r.kg))], ['E', M3, sum(r => n(r.m3))], ['F', MON, tk], ['G', MON, R.filter(r => pd(r) === 'yes').reduce((s, r) => s + fee(r), 0)], ['H', MON, unpaid.reduce((s, r) => s + fee(r), 0)], ['I', '0.0%', tk ? 1 : 0]]
        .forEach(([c, fm, v]) => put(cs, c + cT, { formula: `SUM(${c}${c1}:${c}${cT - 1})`, result: v }, { ...tot, fmt: fm }));

    const buf = await wb.xlsx.writeBuffer(), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    a.download = `Bao-cao-thang-${M}-${yy}.xlsx`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1500);
}
$('xl').onclick = xlExport;
