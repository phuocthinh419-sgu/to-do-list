self.addEventListener('install', (e) => {
    console.log('[The Apex] Đã nạp thành công bộ cài đặt App');
});

self.addEventListener('fetch', (e) => {
    // Bỏ trống để hệ thống luôn ưu tiên kéo dữ liệu thực tế từ LocalStorage và Firebase
});
