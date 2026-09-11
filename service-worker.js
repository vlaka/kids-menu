const CACHE_NAME = 'kids-menu-v20';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=18',
  './enhancements.css?v=18',
  './app.js?v=18',
  './enhancements.js?v=18',
  './manifest.webmanifest?v=18',
  './data/menu.json',
  './assets/schnitzel-icon.svg',
  './assets/dishes/banana-20260912-0028.svg',
  './assets/dishes/black-bread-20260912-0028.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
