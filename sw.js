// Tên kho chứa mới - Mỗi lần bệ hạ đổi code HTML, chỉ cần tăng số v85 lên v86, v87... ở dòng này là app tự cập nhật.
const CACHE_NAME = 'planner-vip-v85'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // Nếu bệ hạ có icon.png thì thêm vào đây: './icon.png'
];

// Sự kiện cài đặt: Nạp đồ vào kho và ÉP kích hoạt ngay
self.addEventListener('install', event => {
  self.skipWaiting(); // Trảm tên lính canh cũ, ép tên mới lên thay ngay lập tức
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Sự kiện kích hoạt: Đốt cháy toàn bộ kho chứa (cache) cũ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Đã dọn dẹp kho chứa cũ:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Chiếm quyền kiểm soát mọi tab ngay lập tức
});

// Chiến lược: Network First (Luôn ưu tiên Internet, mất mạng mới dùng Cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Nếu tải thành công từ mạng, tiện tay cất luôn bản mới nhất vào kho
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Nếu không có Internet, lôi đồ trong kho ra xài tạm
        return caches.match(event.request);
      })
  );
});
