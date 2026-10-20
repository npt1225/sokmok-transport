/* ===== Gom các nút nổi vào menu «Tiện ích» trên thanh công cụ ===== */
(function () {
    try { document.head.insertAdjacentHTML('beforeend', '<style>#fab{display:none!important}</style>') } catch (e) { }
    /* chế độ tối kiểu cũ (nút 🌙) đã bỏ, đã có nút «Sáng/tối» trên thanh công cụ: tắt để khỏi bị kẹt */
    try { localStorage.setItem('bc-dark', '0'); document.documentElement.classList.remove('dk') } catch (e) { }
    const dd = document.getElementById('tiDd'), det = document.getElementById('tien-ich'); if (!dd || !det) return;
    det.addEventListener('toggle', () => { const i = document.getElementById('tiInst'); if (i) i.classList.toggle('hid', !document.getElementById('instb')) });
    dd.addEventListener('click', e => { const b = e.target.closest('button[data-fab]'); if (!b) return; det.open = false; const t = document.getElementById(b.dataset.fab); if (t) t.click() });
    document.addEventListener('click', e => { if (det.open && !det.contains(e.target)) det.open = false });
})();
