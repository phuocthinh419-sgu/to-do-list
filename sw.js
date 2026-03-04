const CACHE_NAME = 'planner-cache-v2';
// Chỉ cache các file nội bộ để đảm bảo cài đặt Service Worker thành công 100%
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
          console.log('Khởi bẩm: Đang lưu trữ chân khí (cache) cục bộ');
          return cache.addAll(urlsToCache);
      })
  );
  // Ép Service Worker kích hoạt ngay lập tức
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  // Dọn dẹp cache cũ nếu có bản cập nhật
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Trả về cache nếu có, không thì tải từ mạng
        return response || fetch(event.request);
      }).catch(() => {
          // Xử lý lỗi khi mất mạng
          return caches.match('./index.html');
      })
  );
});
