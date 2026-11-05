/* Service Worker — حساباتي ERP
   - index.html: الشبكة أولاً (عشان أي تحديث يظهر فوراً) وبعدين النسخة المحفوظة لو أوفلاين
   - الأيقونات والملفات المحلية: من الكاش أولاً
   - مكتبات CDN (Chart / Excel / Firebase / الخطوط): تتحفظ للعمل بدون نت
   - طلبات Firebase نفسها (البيانات والحسابات) ما بتتعترضش أبداً */
const CACHE = 'hesabati-v4';
const CORE = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const CDN_OK = (u) => u.hostname === 'cdn.jsdelivr.net' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
                      (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
      e.respondWith(
        fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', cp)); return r; })
                  .catch(() => caches.match('index.html'))
      );
      return;
    }
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return r;
    })));
    return;
  }

  if (CDN_OK(url)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r;
    })));
  }
});
