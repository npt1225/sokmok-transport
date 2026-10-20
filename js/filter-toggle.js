/* thanh lọc đơn hàng: nút «Bộ lọc» + số bộ lọc đang bật */
(function () {
    try {
        var tb = document.querySelector('#tp-don .tb'), tg = document.getElementById('tbtog'), bd = document.getElementById('tbn');
        if (!tb || !tg || !bd) return;
        function cnt() {
            var n = 0; ['fc', 'ftrip', 'fp', 'd1', 'd2', 'so'].forEach(function (id) { var e = document.getElementById(id); if (e && e.value) n++ });
            var df = document.getElementById('df'); if (df && df.value && df.value !== 'g') n++;
            bd.textContent = n || ''; bd.hidden = !n; tg.classList.toggle('act', !!n)
        }
        tg.addEventListener('click', function () { var o = tb.classList.toggle('open'); tg.setAttribute('aria-expanded', o ? 'true' : 'false') });
        ['input', 'change', 'click'].forEach(function (ev) { tb.addEventListener(ev, function () { setTimeout(cnt, 50) }) });
        cnt(); setTimeout(cnt, 1500); setTimeout(cnt, 4000)
    } catch (e) { }
})();
