/* ===== Dùng khi mất mạng (chỉ xem bản đã lưu) + cài lên màn hình điện thoại ===== */
(function () {
    const safe = f => { try { return f() } catch (e) { console.error(e) } };
    const U = p => new URL(p, location.href).href, standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    /* manifest tạo lúc chạy để start_url luôn đúng địa chỉ trang đang mở */
    safe(() => {
        const m = { name: 'Sokmok Transport – Báo cáo doanh số', short_name: 'Sokmok', lang: 'vi', start_url: location.pathname + location.search, scope: location.pathname.replace(/[^/]*$/, ''), display: 'standalone', orientation: 'any', background_color: '#ffffff', theme_color: '#1f4e9e', icons: [{ src: U('icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any maskable' }, { src: U('icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] };
        m.start_url = U(location.pathname.split('/').pop() || './'); m.scope = U('./');
        const l = document.createElement('link'); l.rel = 'manifest'; l.href = URL.createObjectURL(new Blob([JSON.stringify(m)], { type: 'application/manifest+json' })); document.head.appendChild(l);
        const a = document.createElement('link'); a.rel = 'apple-touch-icon'; a.href = U('icon-192.png'); document.head.appendChild(a)
    });
    safe(() => {
        if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost'))
            navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(r => { if (r.active) r.active.postMessage({ cache: location.href }) }).catch(e => console.warn('SW', e))
    });
    /* thanh trạng thái mạng */
    document.head.insertAdjacentHTML('beforeend', '<style>#nbar{position:fixed;left:0;right:0;top:0;z-index:99998;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px;text-align:center;font:600 13px/1.4 system-ui,sans-serif;color:#fff;background:#c8201c;display:none}#nbar button{margin-left:8px}</style>');
    const bar = document.createElement('div'); bar.id = 'nbar'; document.body.appendChild(bar);
    function nb() {
        if (OFFLINE) { bar.style.display = 'block'; bar.style.background = '#b26a00'; bar.innerHTML = '📴 Chế độ ngoại tuyến: đang xem bản dữ liệu lưu lần gần nhất, KHÔNG sửa được. <button type="button" onclick="location.reload()">Thử kết nối lại</button>' }
        else if (!navigator.onLine) { bar.style.display = 'block'; bar.style.background = '#c8201c'; bar.innerHTML = '⚠ Đang mất mạng: thay đổi lúc này sẽ KHÔNG được lưu lên máy chủ. Hãy chờ có mạng rồi mới sửa.' }
        else bar.style.display = 'none'
    }
    addEventListener('offline', nb); addEventListener('online', () => { if (OFFLINE) { location.reload(); return } nb() }); setTimeout(nb, 1500);
    /* nút cài đặt */
    let dp = null; const fab = $('fab');
    function addBtn() {
        if (!fab || $('instb') || standalone()) return; fab.insertAdjacentHTML('beforeend', '<button type="button" id="instb" title="Cài lên màn hình điện thoại">📲</button>');
        $('instb').onclick = async () => {
            if (dp) { dp.prompt(); try { await dp.userChoice } catch (e) { } dp = null; $('instb').remove() }
            else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) alert('Cài lên iPhone/iPad:\n1. Mở trang bằng Safari.\n2. Bấm nút Chia sẻ (hình vuông có mũi tên lên).\n3. Chọn «Thêm vào MH chính» rồi bấm Thêm.');
            else alert('Cài ứng dụng:\n• Android (Chrome): menu ⋮ → «Cài đặt ứng dụng» hoặc «Thêm vào màn hình chính».\n• Máy tính (Chrome/Edge): bấm biểu tượng cài đặt ở cuối thanh địa chỉ.\nLưu ý: trang phải mở bằng https://.')
        }
    }
})();
