/* ===== Báo cáo: lịch giao hàng, lợi nhuận theo năm/quý, theo chuyến xe ===== */
(function () {
    const V = x => vn(x || 0), safe = f => { try { return f() } catch (e) { console.error(e) } }, own = () => !!me && me.r === 'owner';
    const PLn = { no: 'Chưa thu', yes: 'Đã thu', free: 'Không thu' }, tr = v => v ? (v / 1e6).toFixed(1).replace('.', ',') + 'tr' : '';
    document.head.insertAdjacentHTML('beforeend', '<style>.rpo{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9990;display:flex;align-items:flex-start;justify-content:center;padding:4vh 10px}.rpo>div{background:var(--bg,#fff);color:inherit;border-radius:14px;width:min(860px,100%);max-height:90vh;overflow:auto;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.35)}.rpt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.rpt button.on{background:#1f4e9e;color:#fff}.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.cal>div{border:1px solid var(--bd);border-radius:8px;min-height:58px;padding:3px 5px;font-size:12px}.cal>.h{min-height:0;border:0;text-align:center;font-weight:600}.cal>.d{cursor:pointer}.cal>.d.on{outline:2px solid #1f4e9e}.cal small{display:block;color:var(--mu)}.cal .nn{color:#c8201c}.rpo table{border-collapse:collapse;width:100%;font-size:13px}.rpo td,.rpo th{border-bottom:1px solid var(--bd);padding:5px 6px;text-align:right}.rpo td:first-child,.rpo th:first-child{text-align:left}.rpo tr.sub td{font-weight:700;background:rgba(127,127,127,.1)}</style>');
    const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    const allRows = () => Object.entries(S.months).flatMap(([m, M]) => (M.rows || []).map(r => ({ m, r })));
    function open() {
        let tab = 'cal', cy = S.cur, sel = '';
        const o = document.createElement('div'); o.className = 'rpo'; document.body.appendChild(o); o.onclick = e => { if (e.target === o) o.remove() };
        const draw = () => { o.innerHTML = '<div><div style="display:flex;justify-content:space-between;gap:8px"><div class="rpt">' + [['cal', '📅 Lịch giao hàng'], ['yr', '📊 Lợi nhuận năm / quý'], ['trip', '🚚 Theo chuyến xe'], ['fx', '💱 Tỷ giá']].map(([k, l]) => `<button type="button" data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('') + '</div><button type="button" data-t="x">Đóng</button></div><div id="rpb"></div></div>'; const b = o.querySelector('#rpb'); safe(() => ({ cal, yr, trip, fx })[tab](b)) };
        o.addEventListener('click', e => {
            const t = e.target.closest('[data-t]'); if (t) { if (t.dataset.t === 'x') o.remove(); else { tab = t.dataset.t; draw() } return }
            const c = e.target.closest('[data-cm]'); if (c) { const [y, m] = cy.split('-').map(Number), d = new Date(y, m - 1 + Number(c.dataset.cm), 1); cy = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); sel = ''; draw(); return }
            const dd = e.target.closest('[data-day]'); if (dd) { sel = dd.dataset.day; draw(); return }
            const y = e.target.closest('[data-y]'); if (y) { cy = y.dataset.y + '-01'; draw() }
        });
        o.addEventListener('change', e => { if (e.target.id === 'tsel') { sel = e.target.value; draw() } });
        /* lịch giao hàng */
        function cal(b) {
            const [y, m] = cy.split('-').map(Number), n0 = new Date(y, m, 0).getDate(), off = (new Date(y, m - 1, 1).getDay() + 6) % 7, D = {};
            allRows().forEach(({ r }) => { if (r.g && r.g.slice(0, 7) === cy) { const k = +r.g.slice(8, 10), x = D[k] = D[k] || { c: 0, v: 0, no: 0 }; x.c++; x.v += fee(r); if (pd(r) === 'no' && fee(r)) x.no += fee(r) } });
            allRows().forEach(({ r }) => { spl(r).forEach(s => { if (s.g && s.g !== r.g && s.g.slice(0, 7) === cy) { const k = +s.g.slice(8, 10), x = D[k] = D[k] || { c: 0, v: 0, no: 0 }; x.s = (x.s || 0) + 1 } }) });
            let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><button type="button" data-cm="-1">‹</button><b>Tháng ${m}/${y}</b><button type="button" data-cm="1">›</button></div><div class="cal">` + ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(x => `<div class="h">${x}</div>`).join('') + '<div style="border:0;min-height:0"></div>'.repeat(off);
            for (let d = 1; d <= n0; d++) { const x = D[d], key = cy + '-' + String(d).padStart(2, '0'); h += `<div class="${x ? 'd' : ''} ${sel === key ? 'on' : ''}" ${x ? `data-day="${key}"` : ''}><b>${d}</b>${x ? `${x.c ? `<small>${x.c} đơn</small><small>${tr(x.v)}</small>` : ''}${x.s ? `<small>+${x.s} đợt giao</small>` : ''}${x.no ? `<small class="nn">nợ ${tr(x.no)}</small>` : ''}` : ''}</div>` }
            h += '</div>'; const tot = Object.values(D).reduce((a, x) => ({ c: a.c + x.c, v: a.v + x.v }), { c: 0, v: 0 }); h += `<p class="mu" style="color:var(--mu)">Cả tháng: ${tot.c} đơn · ${V(tot.v)} đ (tính theo ngày giao; đơn giao nhiều đợt tính ở ngày đợt cuối, các đợt trước hiện «+n đợt giao»). Bấm vào ngày để xem đơn.</p>`;
            if (sel) { const L = allRows().flatMap(({ r }) => { const S2 = spl(r); if (!S2.length) return r.g === sel ? [{ r }] : []; const o = []; S2.forEach((s, k) => { if (s.g === sel) o.push({ r, s, k, t: S2.length, last: r.g === sel && !o.some(z => z.last) }) }); return o }); h += `<h4 style="margin:8px 0 4px">Ngày ${fd(sel)}</h4><table><tr><th>Khách</th><th>Kg</th><th>Cước</th><th>Tình trạng</th></tr>${L.map(({ r, s, k, t, last }) => `<tr><td>${esc(r.k || '')}${s ? `<br><small>đợt ${k + 1}/${t}${s.trip ? ' · xe ' + esc(s.trip) : ''}</small>` : ''}</td><td>${V(s ? n(s.kg) : n(r.kg))}</td><td>${!s || last ? V(fee(r)) : '–'}</td><td>${PLn[pd(r)]}</td></tr>`).join('')}</table>` }
            b.innerHTML = h
        }
        /* lợi nhuận năm / quý */
        function yr(b) {
            if (!own()) { b.innerHTML = '<p>Chỉ chủ xem được báo cáo lợi nhuận.</p>'; return }
            const ys = [...new Set(Object.keys(S.months).map(k => k.slice(0, 4)))].sort(), Y = ys.includes(cy.slice(0, 4)) ? cy.slice(0, 4) : ys[ys.length - 1]; if (!Y) { b.innerHTML = '<p>Chưa có dữ liệu.</p>'; return }
            const rows = []; for (let m = 1; m <= 12; m++) { const k = Y + '-' + String(m).padStart(2, '0'); if (S.months[k]) { const y = lnDataOf(S.months[k]); rows.push({ m, d: y.d.tot, c: y.chuyen + y.sal + y.ng + y.ads, l: y.loi }) } }
            const sum = a => a.reduce((s, x) => ({ d: s.d + x.d, c: s.c + x.c, l: s.l + x.l }), { d: 0, c: 0, l: 0 }), pc = x => x.d ? (x.l / x.d * 100).toFixed(1) + '%' : '–', col = v => `<span style="color:${v >= 0 ? '#1e8e4e' : '#c8201c'}">${V(v)}</span>`;
            let h = `<div class="rpt">${ys.map(y => `<button type="button" data-y="${y}" class="${y === Y ? 'on' : ''}">${y}</button>`).join('')}</div>`;
            const mx = Math.max(1, ...rows.map(x => Math.abs(x.l))), W = rows.length * 54 + 10; h += `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} 150" width="${W}" height="150" role="img" aria-label="Lợi nhuận theo tháng"><line x1="0" y1="75" x2="${W}" y2="75" stroke="#999" stroke-width="1"/>${rows.map((x, i) => { const hh = Math.abs(x.l) / mx * 60; return `<rect x="${i * 54 + 12}" y="${x.l >= 0 ? 75 - hh : 75}" width="34" height="${Math.max(1, hh)}" fill="${x.l >= 0 ? '#2e9e5b' : '#c8201c'}" rx="3"/><text x="${i * 54 + 29}" y="145" font-size="11" text-anchor="middle" fill="#888">T${x.m}</text><text x="${i * 54 + 29}" y="${x.l >= 0 ? 70 - hh : 90 + hh}" font-size="10" text-anchor="middle" fill="#888">${tr(x.l)}</text>` }).join('')}</svg></div>`;
            h += '<table><tr><th>Kỳ</th><th>Doanh số</th><th>Chi phí</th><th>Lợi nhuận</th><th>Biên</th></tr>';
            for (let q = 0; q < 4; q++) { const R = rows.filter(x => x.m > q * 3 && x.m <= q * 3 + 3); R.forEach(x => h += `<tr><td>Tháng ${x.m}</td><td>${V(x.d)}</td><td>${V(x.c)}</td><td>${col(x.l)}</td><td>${pc(x)}</td></tr>`); if (R.length) { const s = sum(R); h += `<tr class="sub"><td>Quý ${q + 1}</td><td>${V(s.d)}</td><td>${V(s.c)}</td><td>${col(s.l)}</td><td>${pc(s)}</td></tr>` } }
            const s = sum(rows); h += `<tr class="sub"><td>Cả năm ${Y}</td><td>${V(s.d)}</td><td>${V(s.c)}</td><td>${col(s.l)}</td><td>${pc(s)}</td></tr></table><p class="mu" style="color:var(--mu)">Chi phí = chuyển hàng + lương + hoa hồng + phí ông Nghĩa + QC đã dùng, giống tab Lợi nhuận.</p>`; b.innerHTML = h
        }
        /* theo chuyến xe */
        function trip(b) {
            const ms = Object.keys(S.months).sort().reverse(); if (!sel || (sel !== '*' && !S.months[sel])) sel = S.cur; const G = {};
            allRows().filter(x => sel === '*' || x.m === sel).forEach(({ r }) => { const S2 = spl(r), W = S2.length ? spShare(r, S2) : [1], P = S2.length ? S2 : [{ trip: r.trip }], seenT = new Set(); P.forEach((s, j) => { const w = W[j], k = (s.trip || '').trim() || '(không ghi chuyến)', g = G[k] = G[k] || { c: 0, kg: 0, m3: 0, v: 0, pt: 0, no: 0, K: new Set() }; if (!seenT.has(k)) { seenT.add(k); g.c++ } g.kg += S2.length ? (n(s.kg) || n(r.kg) * w) : n(r.kg); g.m3 += S2.length ? (n(s.m3) || n(r.m3) * w) : n(r.m3); g.v += fee(r) * w; if (pd(r) === 'yes') g.pt += fee(r) * w; if (pd(r) === 'no') g.no += fee(r) * w; g.K.add(r.k || '') }) });
            const E = Object.entries(G).sort((a, c) => c[1].v - a[1].v);
            b.innerHTML = `<div style="margin-bottom:8px">Xem: <select id="tsel"><option value="*" ${sel === '*' ? 'selected' : ''}>Tất cả tháng</option>${ms.map(m => `<option value="${m}" ${sel === m ? 'selected' : ''}>${esc(mk(m))}</option>`).join('')}</select></div>` + (E.length ? `<table><tr><th>Chuyến</th><th>Đơn</th><th>Khách</th><th>Kg</th><th>m³</th><th>Cước</th><th>Đã thu</th><th>Chưa thu</th></tr>${E.map(([k, g]) => `<tr><td>${esc(k)}</td><td>${g.c}</td><td>${g.K.size}</td><td>${V(g.kg)}</td><td>${vn1(g.m3, 2)}</td><td>${V(g.v)}</td><td>${V(g.pt)}</td><td style="color:${g.no ? '#c8201c' : 'inherit'}">${V(g.no)}</td></tr>`).join('')}</table><p class="mu" style="color:var(--mu);text-decoration:none">Đơn giao nhiều đợt: cước được chia cho từng xe theo kg (không có thì theo số lượng, rồi m³, cuối cùng chia đều).</p>` : '<p>Chưa có đơn.</p>')
        }

        /* tỷ giá theo ngày */
        function fx(b) {
            const R = (S.cfg && S.cfg.rates) || {}, ks = Object.keys(R).sort(), ed = isAd(), td = today();
            const cand = allRows().filter(({ r }) => isU(r) && !n(r.rate) && (r.g || r.d));
            b.innerHTML = `<p>Tỷ giá hiện tại: <b>${V(S.rate)}</b> VND/USD. Trang tự lưu tỷ giá của mỗi ngày bạn mở. Đơn USD đã có tỷ giá riêng (lúc nhập) luôn giữ nguyên.</p>` +
                (ed ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><input type="date" id="fxd" value="${td}"><input id="fxr" inputmode="numeric" placeholder="Tỷ giá VND/USD"><button type="button" class="p" id="fxa">Lưu tỷ giá ngày này</button></div>` : '') +
                `<table><tr><th>Ngày</th><th>Tỷ giá</th><th></th></tr>${ks.slice().reverse().slice(0, 60).map(k => `<tr><td>${fd(k)}</td><td>${V(R[k])}</td><td>${ed ? `<button type="button" data-fxd="${k}">✕</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="3">Chưa có lịch sử.</td></tr>'}</table>` +
                `<h4 style="margin:14px 0 4px">Cố định tỷ giá cho đơn cũ</h4><p class="mu" style="color:var(--mu)">${cand.length} đơn USD chưa có tỷ giá riêng đang tính theo tỷ giá hiện tại, nên số tiền sẽ đổi mỗi khi tỷ giá đổi. Bấm nút dưới để gắn cho mỗi đơn tỷ giá của ngày giao (lấy ngày gần nhất trở về trước trong lịch sử).</p>${ed ? '<button type="button" id="fxap">Áp tỷ giá theo ngày giao</button>' : ''}`
        }
        function rateOn(d) { const R = (S.cfg && S.cfg.rates) || {}; let v = null; Object.keys(R).sort().forEach(k => { if (k <= d) v = R[k] }); return v }
        o.addEventListener('click', e => {
            const t = e.target;
            if (t.id === 'fxa') { const d = $('fxd').value, v = Number(String($('fxr').value).replace(/\D/g, '')) || 0; if (!d || v < 1000) return toast('err', 'Nhập ngày và tỷ giá hợp lệ.'); S.cfg = S.cfg || {}; (S.cfg.rates = S.cfg.rates || {})[d] = v; save(); draw() }
            if (t.dataset && t.dataset.fxd) { delete S.cfg.rates[t.dataset.fxd]; save(); draw() }
            if (t.id === 'fxap') {
                const L = allRows().filter(({ r }) => isU(r) && !n(r.rate) && (r.g || r.d)).map(({ r }) => ({ r, v: rateOn(r.g || r.d) })).filter(x => x.v); if (!L.length) return alert('Chưa có tỷ giá lịch sử phù hợp với các đơn này. Hãy thêm tỷ giá theo ngày trước.');
                const df = L.reduce((a, x) => a + n(x.r.usd) * (x.v - S.rate), 0); if (!confirm(`Gắn tỷ giá theo ngày giao cho ${L.length} đơn USD?\nTổng doanh số các đơn này sẽ thay đổi ${df >= 0 ? '+' : '−'}${V(Math.abs(df))} VND.`)) return; L.forEach(x => { x.r.rate = x.v }); save(); all(); draw()
            }
        });
        draw()
    }
    const fab = $('fab'); if (fab) { fab.insertAdjacentHTML('beforeend', '<button type="button" id="rpbtn" title="Báo cáo: lịch giao hàng, lợi nhuận năm, chuyến xe">📋</button>'); $('rpbtn').onclick = () => safe(open) }
})();
