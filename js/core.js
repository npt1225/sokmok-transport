const KEY = 'bc-doanhso-v2';

/* ---- Supabase: điền 2 dòng dưới để bật lưu trên máy chủ (để trống = chỉ lưu trong trình duyệt) ---- */
const SB_URL = 'https://splommvvzkurfvsueape.supabase.co';   // ví dụ: 'https://abcdxyz.supabase.co'
const SB_KEY = 'sb_publishable_4o-CM3FtU_IvGn_7xvb__A_H50ls_j4';   // anon / publishable key (Project Settings → API)
const SB_ON = !!(SB_URL && SB_KEY); let OFFLINE = false;
let SB_READY = false, SB_DEAD = false, SB_ERR = '', TOAST_ON = false; const SB_REV = {}, SB_T = {}, SB_Q = {};
const sbH = x => Object.assign({ apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }, x || {});
async function sbPull() {
    let r = await fetch(SB_URL + '/rest/v1/app_state?select=key,value,rev&key=not.like.ph-*', { headers: sbH() });
    if (!r.ok) r = await fetch(SB_URL + '/rest/v1/app_state?select=key,value,rev', { headers: sbH() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const o = {}; for (const x of await r.json()) { if (/^ph-/.test(x.key)) continue; o[x.key] = x.value; SB_REV[x.key] = x.rev } return o
}
/* Popup thông báo: xanh = lưu thành công, đỏ = lỗi (bấm vào để tắt) */
function toast(type, msg) {
    if (!TOAST_ON) return;
    let box = document.getElementById('tstbox');
    if (!box) { box = document.createElement('div'); box.id = 'tstbox'; box.setAttribute('aria-live', 'polite'); box.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;display:grid;gap:8px;width:min(92vw,440px);pointer-events:none'; document.body.appendChild(box) }
    const ok = type === 'ok', t = document.createElement('div');
    t.style.cssText = 'pointer-events:auto;padding:12px 14px;border-radius:12px;color:#fff;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer;background:' + (ok ? '#15803d' : '#c8102e');
    t.textContent = (ok ? '✔ ' : '✖ ') + msg; t.onclick = () => t.remove(); box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => t.remove(), ok ? 2600 : 9000)
}
/* Telegram: chỉ gửi SỰ KIỆN tới Edge Function "tg-bot"; token bot nằm trên máy chủ, không nằm trong trang */
let TG_LAST = 0, TG_FAIL = 0;
function tgNotify(event, data) {
    if (!SB_ON) return;
    try { fetch(SB_URL + '/functions/v1/tg-bot/notify', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ event }, data)) }).catch(() => { }) } catch (e) { }
}
/* So sánh dữ liệu trước/sau mỗi lần lưu để báo Telegram: thêm / sửa / xóa đơn hàng và khoản thu */
let TG_BASE = null;
const tgStrip = (k, v) => (k === 'bill' || k === 'ht2' || k === 'ph' || k === 'id') ? undefined : v;
function tgSnap() { try { const o = {}; for (const [m, d] of Object.entries(S.months || {})) o[m] = { r: (d.rows || []).map(r => JSON.stringify(r, tgStrip)), p: (d.pays || []).map(p => JSON.stringify(p, tgStrip)) }; return o } catch (e) { return null } }
function tgRebase() { TG_BASE = tgSnap() }
function tgDiff(A, B) {
    const out = [], sub = (a, b) => { const c = {}; b.forEach(x => c[x] = (c[x] || 0) + 1); const r = []; a.forEach(x => { if (c[x] > 0) c[x]--; else r.push(x) }); return r };
    for (const m of Object.keys(B)) for (const t of ['r', 'p']) {
        const old = (A[m] || { r: [], p: [] })[t], now = B[m][t], del = sub(old, now), add = sub(now, old), key = t === 'r' ? 'k' : 'w';
        const used = new Set();
        for (const a of add) {
            const na = JSON.parse(a); let k = del.findIndex((x, i) => !used.has(i) && (JSON.parse(x)[key] || '') === (na[key] || ''));
            if (k < 0 && add.length === 1 && del.length === 1) k = 0;
            if (k >= 0) { used.add(k); out.push({ a: 'edit', t, m, n: na, o: JSON.parse(del[k]) }) } else out.push({ a: 'add', t, m, n: na })
        }
        del.forEach((x, i) => { if (!used.has(i)) out.push({ a: 'del', t, m, o: JSON.parse(x) }) })
    }
    for (const m of Object.keys(A)) if (!B[m]) for (const t of ['r', 'p']) A[m][t].forEach(x => out.push({ a: 'del', t, m, o: JSON.parse(x) }));
    return out
}
function tgData() {
    if (!me) return;
    try {
        const cur = tgSnap(), base = TG_BASE; TG_BASE = cur;
        if (!base || !cur) return;
        const L = tgDiff(base, cur); if (!L.length) return;
        tgNotify('change', { user: me.u, month: S.cur, n: L.length, items: L.slice(0, 8) })
    } catch (e) { }
}
/* Gửi ảnh phiếu giao nhận (canvas #bc) lên Telegram */
function tgBill(d, manual) {
    if (!SB_ON) { if (manual) toast('err', 'Chưa kết nối máy chủ.'); return }
    try {
        const c = $('bc'); if (!c || !d) return;
        const img = c.toDataURL('image/jpeg', 0.85).split(',')[1];
        fetch(SB_URL + '/functions/v1/tg-bot/bill', { method: 'POST', keepalive: false, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: me ? me.u : '', no: d.no, dt: d.dt || '', s: d.s && d.s.n || '', r: d.r && d.r.n || '', img }) })
            .then(r => { if (manual) toast(r.ok ? 'ok' : 'err', r.ok ? 'Đã gửi phiếu ' + d.no + ' lên Telegram.' : 'Gửi Telegram không thành công (HTTP ' + r.status + ').') })
            .catch(() => { if (manual) toast('err', 'Gửi Telegram không thành công. Kiểm tra mạng rồi thử lại.') })
    } catch (e) { if (manual) toast('err', 'Không gửi được phiếu lên Telegram.') }
}
const TOK = { report: 'Đã lưu thành công lên máy chủ.', users: 'Đã lưu danh sách tài khoản thành công.', pending: 'Đã gửi yêu cầu lên máy chủ thành công.' };
async function sbPullKeys(keys, setRev) {
    const r = await fetch(SB_URL + '/rest/v1/app_state?select=key,value,rev&key=in.(' + keys.join(',') + ')', { headers: sbH() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const o = {}, rv = {}; for (const x of await r.json()) { o[x.key] = x.value; rv[x.key] = x.rev; if (setRev !== false) SB_REV[x.key] = x.rev } o.__rev = rv; return o
}
/* Chỉ tải dữ liệu từ máy chủ lần đầu trong ngày trên mỗi thiết bị; các lần mở sau trong ngày dùng bản đã lưu trên máy (vẫn lưu lên máy chủ như thường) */
const PULLK = 'bc-pull', dayKey = () => { const t = new Date(); return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() };
const pullGet = () => null; /* luôn tải mới từ máy chủ mỗi lần mở trang (trước đây chỉ tải 1 lần/ngày nên thấy số liệu cũ) */
const pullSet = () => { try { localStorage.setItem(PULLK, JSON.stringify({ d: dayKey(), rev: SB_REV })) } catch (e) { } };
const pullClear = () => { try { localStorage.removeItem(PULLK) } catch (e) { } };
const SB_G = {};
async function sbSend(key, keep) {
    if (SB_DEAD) return;
    try {
        const value = SB_G[key](), rev = SB_REV[key]; let r;
        if (rev == null) r = await fetch(SB_URL + '/rest/v1/app_state', { method: 'POST', keepalive: !!keep, headers: sbH({ Prefer: 'return=representation' }), body: JSON.stringify({ key, value, rev: 1 }) });
        else r = await fetch(SB_URL + '/rest/v1/app_state?key=eq.' + key + '&rev=eq.' + rev, { method: 'PATCH', keepalive: !!keep, headers: sbH({ Prefer: 'return=representation' }), body: JSON.stringify({ value, rev: rev + 1 }) });
        if (r.status === 409) return keep ? 0 : sbConflict();
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const rows = await r.json(); if (!rows.length) return keep ? 0 : sbConflict();
        SB_REV[key] = rows[0].rev; pullSet(); stamp(); try { localStorage.removeItem('bc-dirty-' + key) } catch (e) { } toast('ok', TOK[key] || 'Đã lưu thành công.'); if (key === 'report') tgData(); return true
    } catch (e) { SB_ERR = e.message; toast('err', 'Lưu KHÔNG thành công (' + e.message + '). Số liệu vẫn còn trên máy này, hãy kiểm tra mạng rồi sửa lại một ô để lưu lại.'); stamp(true, 'Chưa lưu được lên máy chủ (' + e.message + '). Số liệu vẫn nằm trong trình duyệt này, hãy kiểm tra mạng rồi sửa lại một ô để lưu lại.'); return false }
}
function sbPush(key, get) {
    if (!SB_READY || SB_DEAD) { toast('err', 'CHƯA lưu được lên máy chủ' + (SB_DEAD ? ' (dữ liệu đã bị người khác thay đổi hoặc lưu lỗi trước đó). Hãy tải lại trang rồi nhập lại.' : ' (chưa kết nối máy chủ). Hãy tải lại trang.')); return }
    SB_G[key] = get; try { localStorage.setItem('bc-dirty-' + key, '1') } catch (e) { } clearTimeout(SB_T[key]); stamp(false, 'Đang lưu lên máy chủ…');
    SB_T[key] = setTimeout(() => { SB_T[key] = 0; SB_Q[key] = (SB_Q[key] || Promise.resolve()).then(() => sbSend(key)) }, 500)
}
/* đóng/tải lại trang khi còn thay đổi chưa gửi: gửi ngay, không chờ */
function sbFlush() { if (!SB_READY || SB_DEAD) return; for (const k in SB_T) if (SB_T[k]) { clearTimeout(SB_T[k]); SB_T[k] = 0; sbSend(k, true) } }
addEventListener('pagehide', sbFlush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sbFlush() });
function sbConflict() {
    SB_DEAD = true; pullClear(); toast('err', 'CHƯA lưu: người khác vừa cập nhật dữ liệu. Hãy tải lại trang rồi nhập lại.'); stamp(true, 'Người khác vừa cập nhật dữ liệu. Thay đổi vừa rồi CHƯA được lưu lên máy chủ, hãy tải lại trang.');
    setTimeout(() => { if (confirm('Người khác vừa cập nhật dữ liệu trên máy chủ.\nTải lại trang để lấy bản mới nhất? (thay đổi vừa rồi của bạn sẽ mất)')) location.reload() }, 50)
}
const seed = () => ({
    rate: 26000, kg: 15000, cur: '2026-10', months: {
        '2026-10': {
            rows: [
                { g: '2026-10-01', k: 'Anh Nghĩa', d: '2026-09-29', q: 53, u: 'thùng', kg: 1187, m3: 0, vnd: 20852000, rate: 26000, usd: 802, by: 'USD', xe: 1, don: 1, note: 'Xe giao 2 đơn, cước tổng 802 USD', paid: 'yes' },
                { g: '2026-10-01', k: 'Anh Nghĩa', d: '2026-09-30', q: 10, u: 'bao', kg: 202, m3: 0, vnd: 0, usd: 0, by: 'USD', xe: 0, don: 1, note: 'Cùng xe 01/10', paid: 'yes' },
                { g: '2026-10-02', k: 'Chả cá', d: '2026-09-30', q: 21, u: 'kiện', kg: 817, m3: 0, vnd: 12255000, usd: 0, by: 'VND', xe: 1, don: 1, note: '' },
                { g: '2026-10-04', k: 'Máy gấp thú', d: '2026-09-29', q: 20, u: 'kiện', kg: 0, m3: 5.54, vnd: 28868000, usd: 0, by: 'VND', xe: 1, don: 1, note: 'Tính theo khối', paid: 'yes' },
                { g: '2026-10-08', k: 'Anh Nghĩa', d: '2026-10-05', q: 111, u: 'kiện', kg: 1245, m3: 0, vnd: 18746000, rate: 26000, usd: 721, by: 'USD', xe: 1, don: 1, note: '' },
                { g: '2026-10-13', k: 'Anh Triết', d: '2026-10-11', q: 1, u: 'kiện', kg: 0, m3: 0, vnd: 2080000, rate: 26000, usd: 80, by: 'USD', xe: 0, don: 1, loai: 'nho', note: 'Kiện váy cưới' },
                { g: '2026-10-13', k: 'Anh Triết', d: '2026-10-12', q: 1, u: 'kiện', kg: 0, m3: 0, vnd: 0, usd: 0, by: 'USD', xe: 0, don: 1, loai: 'le', note: 'Kiện hỏa tốc, không thu tiền', paid: 'free' },
                { g: '', k: 'Máy gấp thú', d: '2026-10-10', q: 15, u: 'kiện', kg: 0, m3: 5.74, vnd: 28453000, usd: 0, by: 'VND', xe: 0, don: 1, note: 'Tính theo khối' },
                { g: '', k: 'Anh Trọng', d: '2026-10-13', q: 110, u: 'kiện', kg: 2930, m3: 0, vnd: 0, usd: 0, by: 'KG', xe: 0, don: 1, note: '' },
                { g: '', k: 'Anh Nghĩa', d: '2026-10-13', q: 29, u: 'kiện', kg: 335, m3: 0, vnd: 0, usd: 0, by: 'KG', xe: 0, don: 1, note: '' },
                { g: '', k: 'Chả cá', d: '2026-10-14', q: 28, u: 'kiện', kg: 1480, m3: 0, vnd: 0, usd: 0, by: 'KG', xe: 0, don: 1, note: '' },
                { g: '', k: 'Anh Nghĩa', d: '2026-10-14', q: 200, u: 'kiện', kg: 1410, m3: 0, vnd: 0, usd: 0, by: 'KG', xe: 0, don: 1, note: '' }],
            pays: [{ d: '2026-10-02', w: 'Anh Sakhen', vnd: 0, usd: 802, note: 'Thu bằng USD' },
            { d: '2026-10-02', w: 'Thịnh', vnd: 28868000, usd: 0, note: 'Thu tiền Việt' },
            { d: '2026-10-12', w: 'Thịnh', vnd: 29205000, usd: 0, note: 'Thu tiền Việt' }]
        }
    }
});
let S; try { S = JSON.parse(localStorage.getItem(KEY)) } catch (e) { }
if (!S || !S.months) S = seed();
// Đơn 1 kiện, không tính xe, không kg/m³: ghi chú có "hỏa tốc" -> Đơn hỏa tốc, còn lại -> Đơn kiện nhỏ (chỉ phân loại 1 lần)
const mig = () => { try { Object.values(S.months).forEach(m => (m.rows || []).forEach(r => { if (!r.ht2 && r.u === 'kiện' && Number(r.q) === 1 && !Number(r.xe) && !Number(r.kg) && !Number(r.m3)) { r.loai = /hỏa tốc/i.test(r.note || '') ? 'le' : 'nho'; r.ht2 = 1 } })) } catch (e) { } };
mig();
const mk = m => 'Tháng ' + Number(m.slice(5)) + '/' + m.slice(0, 4);
function setMonth(m) { S.cur = m; S.months[m] = S.months[m] || { rows: [], pays: [] }; S.rows = S.months[m].rows; S.pays = S.months[m].pays }
setMonth(S.months[S.cur] ? S.cur : Object.keys(S.months).sort().pop());
const save = () => {
    try { window.__rh && window.__rh() } catch (e) { }
    let ok = true; try { localStorage.setItem(KEY, JSON.stringify({ rate: S.rate, kg: S.kg, cur: S.cur, months: S.months, cfg: S.cfg })) } catch (e) { ok = false }
    if (SB_ON) sbPush('report', () => ({ rate: S.rate, kg: S.kg, months: S.months, cfg: S.cfg })); else { stamp(!ok); toast(ok ? 'ok' : 'err', ok ? 'Đã lưu thành công.' : 'Không lưu được: trình duyệt đang chặn bộ nhớ.') }
};
const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify({ rate: S.rate, kg: S.kg, cur: S.cur, months: S.months, cfg: S.cfg })) } catch (e) { } };
function stamp(bad, msg) {
    const e = document.getElementById('sv'); if (!e) return;
    if (bad) { e.textContent = msg || 'Không lưu được: trình duyệt đang chặn bộ nhớ. Hãy bấm "Sao lưu (tải file)" để giữ số liệu.'; e.style.color = 'var(--ng)' }
    else { e.style.color = ''; e.textContent = msg || ('Đã lưu ' + (SB_ON ? 'lên máy chủ' : 'tự động') + ' lúc ' + new Date().toLocaleTimeString('vi-VN')) }
}
const $ = id => document.getElementById(id);
const n = v => Number(v) || 0;
const f = v => Math.round(v).toLocaleString('vi-VN');
const f2 = v => n(v).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rt = r => n(r.rate) || S.rate;
const isU = r => r.by === 'USD' || r.by === 'M3';
const fee = r => isU(r) ? n(r.usd) * rt(r) : r.by === 'KG' ? n(r.kg) * (n(r.pk) || S.kg) : n(r.vnd);
/* kg dùng để cộng tổng: dòng «Theo khối» không cộng kg (chỉ dùng tính phí ông Nghĩa) */
const kgT = r => r.by === 'M3' ? 0 : n(r.kg), kgK = r => r.by === 'M3' ? n(r.kg) : 0;
const cl = k => { k = (k || '').toLowerCase(); return k.includes('nghĩa') ? 1 : k.includes('chả cá') ? 2 : k.includes('trọng') ? 3 : 4 };
const key = k => (k || '').trim() || '(chưa ghi khách)';
const pd = r => r.paid === 'yes' || r.paid === 'free' ? r.paid : 'no';
const PL = { no: 'Chưa thu', yes: 'Đã thu', free: 'Không thu' };

function view() {
    const q = $('q').value.trim().toLowerCase(), c = $('fc').value, s = $('so').value, pf = $('fp').value, dk = $('df').value, d1 = $('d1').value, d2 = $('d2').value, tf = $('ftrip').value, dts = r => dk === 'g' && spl(r).length ? spl(r).map(s => s.g).filter(Boolean) : [r[dk]].filter(Boolean);
    let ix = S.rows.map((r, i) => i).filter(i => {
        const r = S.rows[i];
        return (!c || key(r.k) === c) && (!tf || spTrips(r).includes(tf)) && (!pf || pd(r) === pf) && ((!d1 && !d2) || dts(r).some(x => (!d1 || x >= d1) && (!d2 || x <= d2))) && (!q || (r.k + ' ' + r.note + ' ' + (r.trip || '') + ' ' + (r.id || '') + ' ' + (r.tags || []).join(' ')).toLowerCase().includes(q))
    });
    if (s) ix.sort((a, b) => {
        const A = S.rows[a], B = S.rows[b];
        if (s === 'kg') return n(B.kg) - n(A.kg); if (s === 'rev') return fee(B) - fee(A);
        const x = A[s] || '\uffff', y = B[s] || '\uffff'; return x < y ? -1 : x > y ? 1 : 0
    });
    return ix
}
