/* ---- đăng nhập ---- */
const UK = 'bc-users';
let U = []; try { U = JSON.parse(localStorage.getItem(UK)) || [] } catch (e) { }
const saveU = () => { try { localStorage.setItem(UK, JSON.stringify(U)) } catch (e) { } if (SB_ON) sbPush('users', () => U) };
const PK = 'bc-pending'; let PEND = []; try { PEND = JSON.parse(localStorage.getItem(PK)) || [] } catch (e) { }
const savePend = () => { try { localStorage.setItem(PK, JSON.stringify(PEND)) } catch (e) { } if (SB_ON) sbPush('pending', () => PEND) };
const OWN = { u: 'admin', s: '40beb7dbb2dc2024', h: '26664ed04730c201b3c45f79fea4342938d897495b8a7f969e47998a7eb09f23', h2: 'x3795280946', r: 'owner' };
{ const i = U.findIndex(a => a.u === 'admin'); if (i < 0) U.unshift(OWN); else U[i].r = 'owner'; saveU() }
const isAd = () => !OFFLINE && !!me && (me.r === 'admin' || me.r === 'owner');
const RL = { owner: 'chủ', admin: 'quản trị', view: 'chỉ xem' };
const canDel = a => !!me && a.r !== 'owner' && a.u !== me.u && (me.r === 'owner' || a.r !== 'admin');
let me = null; try { me = JSON.parse(localStorage.getItem('bc-me')) } catch (e) { }
const salt = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), x => x.toString(16)).join('');
async function hash(p, sl) {
    const b = new TextEncoder().encode(sl + ':' + p);
    if (crypto.subtle) { const d = await crypto.subtle.digest('SHA-256', b); return Array.from(new Uint8Array(d), x => x.toString(16).padStart(2, '0')).join('') }
    let h = 5381; for (const c of b) h = (h * 33 ^ c) >>> 0; return 'x' + h
}
let regMode = false;
function setMode(m) {
    regMode = m === 'reg'; const r = regMode;
    $('lt').textContent = r ? 'Đăng ký tài khoản' : 'Đăng nhập';
    $('ls').textContent = r ? 'Yêu cầu sẽ gửi cho quản trị viên. Chỉ đăng nhập được sau khi được duyệt.' : 'Nhập tài khoản để xem báo cáo doanh số.';
    $('lb').textContent = r ? 'Gửi yêu cầu đăng ký' : 'Đăng nhập'; $('reg').textContent = r ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký';
    $('lnw').classList.toggle('hid', !r); $('lp').autocomplete = r ? 'new-password' : 'current-password';
    $('sp').checked = false; $('lp').type = 'password'; $('le').className = 'err'; $('le').textContent = ''; $('lp').value = ''
}
$('reg').onclick = () => setMode(regMode ? 'login' : 'reg');
function showLogin() { $('app').classList.add('hid'); $('lg').classList.remove('hid'); setMode('login') }
async function register(u, p) {
    const e = $('le');
    if (u.length < 3 || /\s/.test(u)) { e.textContent = 'Tên đăng nhập từ 3 ký tự, không có khoảng trắng.'; return }
    if (p.length < 6) { e.textContent = 'Mật khẩu cần từ 6 ký tự.'; return }
    if (U.some(a => a.u === u) || PEND.some(a => a.u === u)) { e.textContent = 'Tên đăng nhập này đã được dùng hoặc đang chờ duyệt.'; return }
    const sl = salt(), rec = { u, s: sl, h: await hash(p, sl), note: $('ln').value.trim(), t: Date.now() };
    $('lb').disabled = true; e.className = 'err'; e.textContent = 'Đang gửi yêu cầu…';
    try {
        if (SB_ON) {
            const R = await sbPullKeys(['users', 'pending']); if (Array.isArray(R.users)) U = R.users; if (Array.isArray(R.pending)) PEND = R.pending;
            if (U.some(a => a.u === u) || PEND.some(a => a.u === u)) { e.textContent = 'Tên đăng nhập này đã được dùng hoặc đang chờ duyệt.'; return }
        }
        PEND.push(rec); try { localStorage.setItem(PK, JSON.stringify(PEND)) } catch (x) { }
        if (SB_ON) {
            SB_G.pending = () => PEND; SB_ERR = '';
            const ok = await sbSend('pending');
            if (!ok) { PEND.splice(PEND.indexOf(rec), 1); try { localStorage.setItem(PK, JSON.stringify(PEND)) } catch (x) { } e.textContent = 'CHƯA gửi được yêu cầu lên máy chủ' + (SB_ERR ? ' (' + SB_ERR + ')' : '') + '. Hãy tải lại trang rồi đăng ký lại.'; return }
        }
    } catch (x) { e.textContent = 'Không kết nối được máy chủ (' + x.message + '). Hãy kiểm tra mạng rồi thử lại.'; return } finally { $('lb').disabled = false }
    tgNotify('register', { user: u });
    setMode('login'); $('lu').value = u; $('le').className = 'err ok'; $('le').textContent = 'Đã gửi yêu cầu. Chờ quản trị viên duyệt rồi mới đăng nhập được.'
}
function enter(x, fresh) {
    me = { u: x.u, r: x.r }; try { localStorage.setItem('bc-me', JSON.stringify(me)) } catch (e) { } lastAct = Date.now(); try { localStorage.setItem('bc-act', String(lastAct)) } catch (e) { } setTimeout(dailyBackup, 3000);
    $('lg').classList.add('hid'); $('app').classList.remove('hid'); $('lp').value = '';
    $('who').textContent = me.u + ' (' + (RL[me.r] || '') + ')'; all(); if (fresh) { welcome(x); TG_FAIL = 0; tgNotify('login', { user: x.u, role: RL[x.r] || '' }) }
}
/* Thông báo chào mừng sau khi đăng nhập thành công */
function welcome(x) {
    const old = document.getElementById('wlc'); if (old) old.remove();
    const h = new Date().getHours(), g = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const box = document.createElement('div'); box.id = 'wlc'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    const c = document.createElement('div'); c.className = 'wc';
    c.innerHTML = '<span class="we">👋</span><div><b>' + g + ', ' + esc(x.u) + '!</b><small>Đăng nhập thành công · ' + esc(RL[x.r] || '') + '</small></div><i class="wp"></i>';
    const cols = ['#fde047', '#fff', '#60a5fa', '#34d399', '#f472b6'];
    for (let i = 0; i < 18; i++) { const p = document.createElement('i'); p.className = 'cf'; p.style.background = cols[i % 5]; p.style.setProperty('--dx', (Math.random() * 360 - 60) + 'px'); p.style.setProperty('--dy', (Math.random() * 90 - 45) + 'px'); p.style.setProperty('--rt', (Math.random() * 720 - 360) + 'deg'); p.style.animationDelay = (Math.random() * .25) + 's'; c.appendChild(p) }
    box.appendChild(c); document.body.appendChild(box);
    const bye = () => { c.classList.add('bye'); setTimeout(() => box.remove(), 450) };
    c.onclick = bye; setTimeout(bye, 4000)
}
$('lf').onsubmit = async e => {
    e.preventDefault(); const u = $('lu').value.trim().toLowerCase(), p = $('lp').value;
    if (regMode) { await register(u, p); return }
    if (!U.length) {
        if (p.length < 6) { $('le').textContent = 'Mật khẩu cần từ 6 ký tự.'; return }
        const sl = salt(); U.push({ u, s: sl, h: await hash(p, sl), r: 'admin' }); saveU(); enter(U[0], true); return
    }
    if (SB_ON) { try { const R = await sbPullKeys(['users', 'pending']); if (Array.isArray(R.users)) U = R.users; if (Array.isArray(R.pending)) PEND = R.pending } catch (x) { } }
    const x = U.find(a => a.u === u); if (!x && PEND.some(a => a.u === u)) { $('le').textContent = 'Tài khoản này đang chờ quản trị duyệt.'; return }
    const hv = await hash(p, x ? x.s : ''); if (!x || (hv !== x.h && hv !== x.h2)) { $('le').textContent = 'Sai tài khoản hoặc mật khẩu.'; if (++TG_FAIL >= 3) tgNotify('loginfail', { user: u, count: TG_FAIL }); return }
    enter(x, true)
};
$('out').onclick = () => { me = null; try { localStorage.removeItem('bc-me') } catch (e) { } $('lu').value = ''; showLogin() };
/* Tự đăng xuất sau 5 phút không thao tác */
const IDLE = 5 * 60 * 1000, AK = 'bc-act'; let lastAct = Date.now(), lastSaved = 0;
const touch = () => { const t = Date.now(); lastAct = t; if (me && t - lastSaved > 5000) { lastSaved = t; try { localStorage.setItem(AK, String(t)) } catch (e) { } } };
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click', 'input'].forEach(ev => document.addEventListener(ev, touch, { passive: true, capture: true }));
const lastSeen = () => { let t = lastAct; try { t = Math.max(t, +localStorage.getItem(AK) || 0) } catch (e) { } return t };
function idleOut() {
    me = null; try { localStorage.removeItem('bc-me') } catch (e) { }
    const v = $('bvw'); if (v) { v.classList.add('hid'); document.body.classList.remove('pb') }
    md.classList.add('hid'); md.innerHTML = ''; $('lu').value = ''; showLogin();
    $('le').className = 'err warn'; $('le').textContent = 'Phiên làm việc đã hết hạn vì không thao tác trong 5 phút. Vui lòng đăng nhập lại.'
}
const idleChk = () => { if (me && !$('app').classList.contains('hid') && Date.now() - lastSeen() > IDLE) idleOut() };
setInterval(idleChk, 10000); document.addEventListener('visibilitychange', () => { if (!document.hidden) idleChk() });
function renderPend() {
    const c = PEND.length; $('pc').textContent = c ? '(' + c + ')' : ''; $('tabtk').textContent = 'Tài khoản' + (c ? ' (' + c + ')' : '');
    $('pt').innerHTML = c ? '<thead><tr><th>Tên đăng nhập</th><th>Ghi chú</th><th>Gửi lúc</th><th>Quyền cấp</th><th></th></tr></thead><tbody>' + PEND.map((a, i) => `<tr><td>${esc(a.u)}</td><td>${esc(a.note || '')}</td><td>${new Date(a.t).toLocaleString('vi-VN')}</td><td><select data-pr="${i}"><option value="view">Chỉ xem</option>${me.r === 'owner' ? '<option value="admin">Quản trị</option>' : ''}</select></td><td><button class="p" data-ap="${i}">Duyệt</button> <button data-rj="${i}">Từ chối</button></td></tr>`).join('') + '</tbody>' : '<tbody><tr><td style="padding:12px;color:var(--mu)">Không có yêu cầu nào đang chờ.</td></tr></tbody>'
}
const canRole = a => !!me && me.r === 'owner' && a.r !== 'owner' && a.u !== me.u;
document.addEventListener('change', e => {
    const t = e.target; if (t.dataset.ru === undefined) return;
    const a = U[+t.dataset.ru], r = t.value;
    if (!a || !canRole(a) || !['view', 'admin'].includes(r) || a.r === r) { renderUsers(); return }
    ask(`Đổi quyền tài khoản <b>${esc(a.u)}</b> thành <b>${r === 'admin' ? 'Quản trị' : 'Chỉ xem'}</b>? Người này sẽ phải đăng nhập lại.`, 'Đổi quyền').then(ok => { if (ok) { a.r = r; saveU() } renderUsers() })
});
function renderUsers() {
    const ad = isAd(); $('tabtk').classList.toggle('hid', !ad); if (!ad) { if (tab === 'tk') showTab('tong'); return }
    renderPend();
    const lb = { owner: 'Chủ tài khoản (cấp cao nhất)', admin: 'Quản trị', view: 'Chỉ xem' };
    $('ut').innerHTML = '<thead><tr><th>Tài khoản</th><th>Quyền</th><th></th></tr></thead><tbody>' + U.map(a => `<tr><td>${esc(a.u)}${a.u === me.u ? ' (bạn)' : ''}</td><td>${canRole(a) ? `<select data-ru="${U.indexOf(a)}" aria-label="Đổi quyền"><option value="view"${a.r === 'view' ? ' selected' : ''}>Chỉ xem</option><option value="admin"${a.r === 'admin' ? ' selected' : ''}>Quản trị</option></select>` : (lb[a.r] || a.r)}</td><td>${canDel(a) ? `<button class="x" data-delu="${U.indexOf(a)}" aria-label="Xóa tài khoản">✕</button>` : ''}</td></tr>`).join('') + '</tbody>'
}
$('aa').onclick = async () => {
    const u = $('au').value.trim().toLowerCase(), p = $('ap').value, e = $('ae');
    if (!u || p.length < 6) { e.textContent = 'Nhập tên đăng nhập và mật khẩu từ 6 ký tự.'; return }
    if (U.some(a => a.u === u)) { e.textContent = 'Tên đăng nhập này đã có.'; return }
    if ($('ar').value === 'admin' && me.r !== 'owner') { e.textContent = 'Chỉ chủ tài khoản mới tạo được tài khoản quản trị.'; return }
    const sl = salt(); U.push({ u, s: sl, h: await hash(p, sl), r: $('ar').value }); saveU(); e.textContent = ''; $('au').value = $('ap').value = ''; renderUsers()
};
function applyRO() {
    const ro = !isAd();
    document.querySelectorAll('#tb input,#tb select,#pay input,#pay select,#tb .x,#pay .x,#tb .dl,#pay .dl,#tb [data-edit],#bulkpaid,#pay [data-editp],#add,#addp,#reset,#bk,#rs,#rsa,#newm,#nm,#rate,#kgp,#getrate,#bill,#delm').forEach(e => e.disabled = ro)
}
[['rate', 'tỷ giá'], ['kgp', 'đơn giá cước/kg']].forEach(([id, nm]) => {
    const el = $(id); el.readOnly = true; el.title = 'Bấm để chỉnh (có xác nhận)';
    const unlock = () => { if (!el.readOnly || el.disabled) return; ask(`Chỉnh <b>${nm}</b>? Thay đổi sẽ tính lại doanh số của tất cả các tháng.`, 'Đồng ý chỉnh').then(ok => { if (ok) { el.readOnly = false; el.focus(); el.select() } }) };
    el.addEventListener('click', unlock); el.addEventListener('keydown', e => { if (e.key === 'Enter') unlock() });
    el.addEventListener('change', () => { el.readOnly = true; el.blur() }); el.addEventListener('blur', () => { el.readOnly = true })
});
$('bk').onclick = () => {
    const d = { app: 'sokmok-bao-cao', v: 2, t: new Date().toISOString(), rate: S.rate, kg: S.kg, cur: S.cur, months: S.months, cfg: S.cfg };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: 'application/json' }));
    a.download = 'sokmok-sao-luu-' + d.t.slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    $('sv').style.color = ''; $('sv').textContent = 'Đã tải file sao lưu lúc ' + new Date().toLocaleTimeString('vi-VN')
};
$('rs').onclick = () => $('bf').click();
$('bf').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return; let d; try { d = JSON.parse(await f.text()) } catch (x) { }
    if (!d || d.app !== 'sokmok-bao-cao' || !d.months || typeof d.months !== 'object' || !Object.values(d.months).every(m => m && Array.isArray(m.rows) && Array.isArray(m.pays))) { ask('File này không phải file sao lưu hợp lệ của trang báo cáo.', 'Đóng'); return }
    ask(`Thay toàn bộ số liệu hiện tại bằng file sao lưu (${Object.keys(d.months).length} tháng${d.t ? ', lưu lúc ' + esc(new Date(d.t).toLocaleString('vi-VN')) : ''})?`, 'Khôi phục').then(ok => {
        if (!ok) return;
        S.rate = n(d.rate) || 26000; S.kg = n(d.kg) || 15000; S.months = d.months; S.cfg = d.cfg || S.cfg; mig(); setMonth(d.months[d.cur] ? d.cur : Object.keys(d.months).sort().pop()); save(); $('rate').value = S.rate; $('kgp').value = S.kg; all()
    })
};
