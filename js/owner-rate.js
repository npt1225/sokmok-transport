/* ---- tab riêng của chủ: lương và phí anh Nghĩa ---- */
const SAL = { base: 6000000, pct: 0.05 }, NG = { per: 10000, pct: 0.02 };
const isNghia = r => (r.k || '').toLowerCase().includes('nghĩa');
const salOf = M => { const d = mcalc(M), com = d.tot * SAL.pct; return { rev: d.tot, com, sal: SAL.base + com } };
const nghOf = M => { const kg = M.rows.filter(isNghia).reduce((a, r) => a + n(r.kg), 0), g = kg * NG.per; return { kg, g, fee: g * NG.pct } };
const pcard = (t, v, s, c) => `<div class="k ${c || ''}"><small>${t}</small><b>${v}</b>${s ? `<div class="s">${s}</div>` : ''}</div>`;
function renderPriv() {
    const own = !!me && me.r === 'owner';
    $('tabluong').classList.toggle('hid', !own); $('tabnghia').classList.toggle('hid', !own);
    if (!own) { if (tab === 'luong' || tab === 'nghia') showTab('tong'); return }
    const ks = Object.keys(S.months).sort(), cur = S.months[S.cur];
    $('lm').textContent = $('nm2').textContent = mk(S.cur).toLowerCase();
    const a = salOf(cur);
    $('lcards').innerHTML = pcard('Lương tháng này', f(a.sal) + ' đ', `${f(SAL.base)} + ${f(a.com)}`, 'big') +
        pcard('Lương cố định', f(SAL.base) + ' đ') +
        pcard('Tổng doanh số tháng', f(a.rev) + ' đ', 'quy đổi VND') +
        pcard('Hoa hồng 5%', f(a.com) + ' đ', `5% × ${f(a.rev)}`);
    let h = '<thead><tr><th>Tháng</th><th>Tổng doanh số</th><th>Hoa hồng 5%</th><th>Lương cố định</th><th>Lương</th></tr></thead><tbody>', T = { rev: 0, com: 0, sal: 0 };
    ks.forEach(k => { const x = salOf(S.months[k]); T.rev += x.rev; T.com += x.com; T.sal += x.sal; h += `<tr${k === S.cur ? ' class="c1"' : ''}><td>${mk(k)}</td><td class="num">${f(x.rev)}</td><td class="num">${f(x.com)}</td><td class="num">${f(SAL.base)}</td><td class="num"><b>${f(x.sal)}</b></td></tr>` });
    $('lt2').innerHTML = h + `</tbody>`;
    const g = nghOf(cur), cnt = cur.rows.filter(isNghia).length;
    $('ncards').innerHTML = pcard('Phí anh Nghĩa tháng này', f(g.fee) + ' đ', `${f(g.g)} × 2%`, 'big') +
        pcard('Tổng kg hàng anh Nghĩa', f(g.kg) + ' kg', `${cnt} dòng đơn hàng`) +
        pcard('Kg × 10.000', f(g.g) + ' đ', `${f(g.kg)} × ${f(NG.per)}`) +
        pcard('Nhân 2%', f(g.fee) + ' đ', `${f(g.g)} × 2%`);
    h = '<thead><tr><th>Tháng</th><th>Số dòng</th><th>Tổng kg</th><th>Kg × 10.000</th><th>Phí (× 2%)</th></tr></thead><tbody>'; const N = { c: 0, kg: 0, g: 0, fee: 0 };
    ks.forEach(k => { const M = S.months[k], x = nghOf(M), c = M.rows.filter(isNghia).length; N.c += c; N.kg += x.kg; N.g += x.g; N.fee += x.fee; h += `<tr${k === S.cur ? ' class="c1"' : ''}><td>${mk(k)}</td><td class="num">${c}</td><td class="num">${f(x.kg)}</td><td class="num">${f(x.g)}</td><td class="num"><b>${f(x.fee)}</b></td></tr>` });
    $('nt2').innerHTML = h + `</tbody>`
}
function heroInfo() { const e = $('hq'); if (!e) return; e.innerHTML = `<span><small>Tháng</small><b>${mk(S.cur).replace('Tháng ', '')}</b></span><span><small>Tỷ giá</small><b>${f(S.rate)}</b></span><span><small>Cước mỗi kg</small><b>${f(S.kg)}</b></span>` }
if (!(window.CSS && CSS.registerProperty)) document.documentElement.classList.add('nopp');
function all() { try { window.mgx && window.mgx() } catch (e) { } try { renderExtra() } catch (e) { console.error(e) } heroInfo(); $('h1').textContent = 'Báo cáo ' + mk(S.cur).toLowerCase(); renderMo(); stats(); renderTable(); renderPay(); renderMonths(); renderUsers(); renderPriv(); applyRO(); billBadge(); if (!$('sv').textContent) $('sv').textContent = SB_ON ? 'Số liệu tự lưu lên máy chủ sau mỗi lần sửa.' : 'Số liệu tự lưu trên trình duyệt này sau mỗi lần sửa.' }
$('rate').value = S.rate; $('kgp').value = S.kg;
$('rate').onchange = e => { S.rate = n(e.target.value); save(); all() };
$('kgp').onchange = e => { S.kg = n(e.target.value); save(); all() };
/* ---- Tỷ giá USD hiện tại ---- */
async function fetchRate() {
    const srcs = [
        ['open.er-api.com', 'https://open.er-api.com/v6/latest/USD', j => j && j.rates && j.rates.VND],
        ['exchangerate-api.com', 'https://api.exchangerate-api.com/v4/latest/USD', j => j && j.rates && j.rates.VND],
        ['currency-api (jsDelivr)', 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', j => j && j.usd && j.usd.vnd]
    ];
    for (const [nm, url, pick] of srcs) {
        try {
            const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 8000);
            const r = await fetch(url, { cache: 'no-store', signal: ctl.signal }); clearTimeout(tm);
            if (!r.ok) continue;
            const v = Number(pick(await r.json()));
            if (v > 1000) return { rate: Math.round(v), src: nm };
        } catch (e) { }
    }
    throw new Error('rate');
}
// Đơn tính cước USD: lưu tỷ giá lúc nhập và cước VND quy đổi
function fixUsd(o) {
    if (o.by === 'M3') { o.rate = n(o.rate) || S.rate; o.usd = Math.round(n(o.m3) * n(o.pm3) * 100) / 100; o.vnd = Math.round(o.usd * o.rate) }
    else if (o.by === 'USD') { o.rate = n(o.rate) || S.rate; o.vnd = Math.round(n(o.usd) * o.rate) }
    else o.rate = 0
}
// Form đơn hàng: chọn USD thì hiện ô tỷ giá và tự tính cước VND
function usdWire() {
    const by = $('ff_by'), us = $('ff_usd'), kgi = $('ff_kg'), tg = $('ff_rate'), vn = $('ff_vnd'), box = $('fl_rate'), btn = $('ff_getrate'), m3i = $('ff_m3'), pm = $('ff_pm3'), pmBox = pm.closest('label');
    const usM = () => Math.round(n(m3i.value) * n(pm.value) * 100) / 100;
    let keep = vn.value;
    vn.addEventListener('input', () => { if (!vn.readOnly) keep = vn.value });
    const sync = () => {
        const m = by.value === 'M3', u = by.value === 'USD' || m, k = by.value === 'KG';
        box.style.display = u ? '' : 'none'; pmBox.style.display = m ? '' : 'none';
        if (m) us.value = usM();
        us.readOnly = m; vn.readOnly = u || k;
        vn.value = u ? Math.round(n(us.value) * (n(tg.value) || S.rate)) : k ? Math.round(n(kgi.value) * (window.__kgp ? window.__kgp() : S.kg)) : keep
    };
    const pre = document.createElement('div'); pre.className = 'hint'; pre.style.fontWeight = '600'; $('fe').before(pre);
    const preview = () => {
        const m = by.value, r = n(tg.value) || S.rate;
        const v = m === 'M3' ? usM() * r : m === 'USD' ? n(us.value) * r : m === 'KG' ? n(kgi.value) * (window.__kgp ? window.__kgp() : S.kg) : n(vn.value);
        pre.textContent = v && r ? `Quy đổi: ${f(v)} VND ≈ ${f2(v / r)} USD (tỷ giá ${f(r)})` : ''
    };
    [by, us, tg, kgi, vn, m3i, pm].forEach(e => { e.addEventListener('input', preview); e.addEventListener('change', preview) });
    const r2 = v => String(Math.round(v * 100) / 100);
    /* đổi cách tính: giữ nguyên số tiền đang có (kg → VND / USD) để cả VND và USD đều hiện, không bị về 0 */
    by.addEventListener('change', () => {
        const rate = n(tg.value) || S.rate, cur = n(vn.value) || n(kgi.value) * (window.__kgp ? window.__kgp() : S.kg);
        if (by.value === 'USD' && !n(us.value) && cur && rate) us.value = r2(cur / rate);
        if (by.value === 'VND' && cur && !n(keep)) keep = String(Math.round(cur))
    });
    if (by.value === 'USD' && !n(us.value) && n(kgi.value)) { const rate = n(tg.value) || S.rate; if (rate) us.value = r2(n(kgi.value) * (window.__kgp ? window.__kgp() : S.kg) / rate); sync(); preview() }
    by.addEventListener('change', sync); m3i.addEventListener('input', sync); pm.addEventListener('input', sync); us.addEventListener('input', sync); kgi.addEventListener('input', sync); tg.addEventListener('input', sync);
    btn.onclick = async () => {
        btn.disabled = true; const t0 = btn.textContent; btn.textContent = 'Đang lấy...';
        try { const r = await fetchRate(); tg.value = r.rate; $('fe').textContent = ''; sync() }
        catch (e) { $('fe').textContent = 'Không lấy được tỷ giá, hãy nhập tay.' }
        btn.disabled = false; btn.textContent = t0
    };
    sync(); preview()
}
$('getrate').onclick = async () => {
    if (!isAd()) return;
    const b = $('getrate'), t0 = b.textContent; b.disabled = true; b.textContent = 'Đang lấy...';
    let r; try { r = await fetchRate() } catch (e) { }
    b.disabled = false; b.textContent = t0;
    if (!r) { stamp(true, 'Không lấy được tỷ giá USD (kiểm tra mạng). Bạn vẫn có thể nhập tay.'); return }
    const hh = new Date().toLocaleTimeString('vi-VN');
    if (r.rate === S.rate) { stamp(false, `Tỷ giá hiện tại ${f(r.rate)} VND/USD (${r.src}, lúc ${hh}), trùng với tỷ giá đang dùng.`); return }
    const ok = await ask(`Tỷ giá USD hiện tại: <b>${f(r.rate)}</b> VND/USD (nguồn ${esc(r.src)}).<br>Đang dùng: ${f(S.rate)}.<br>Đơn USD đã lưu tỷ giá riêng giữ nguyên. Đơn USD cũ chưa có tỷ giá riêng sẽ tính lại theo tỷ giá mới.`, 'Cập nhật');
    if (!ok) return;
    rateLast = Date.now(); S.rate = r.rate; $('rate').value = S.rate; save(); all();
    stamp(false, `Đã cập nhật tỷ giá ${f(r.rate)} VND/USD (${r.src}, lúc ${hh}).`)
};
// Tự lấy tỷ giá định kỳ (đổi số phút ở RATE_MIN). Chỉ chạy với tài khoản quản trị, tab đang mở, và không ghi đè khi đang chỉnh tay.
const RATE_MIN = 10; let rateLast = 0, rateBusy = false;
async function autoRate() {
    if (rateBusy || document.hidden || !isAd() || !$('rate').readOnly) return;
    if (Date.now() - rateLast < RATE_MIN * 60000) return;
    rateBusy = true;
    try {
        const r = await fetchRate(); rateLast = Date.now();
        if (r.rate !== S.rate && $('rate').readOnly) {
            S.rate = r.rate; $('rate').value = S.rate; save(); all();
            stamp(false, `Tự cập nhật tỷ giá ${f(r.rate)} VND/USD (${r.src}, lúc ${new Date().toLocaleTimeString('vi-VN')}).`)
        }
    } catch (e) { rateLast = Date.now() - (RATE_MIN - 1) * 60000 }
    rateBusy = false
}
setInterval(autoRate, 30000); setTimeout(autoRate, 3000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) autoRate() });
