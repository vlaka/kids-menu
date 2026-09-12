const CACHE_NAME = 'kids-menu-v49';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=42',
  './enhancements.css?v=42',
  './app.js?v=42',
  './enhancements.js?v=42',
  './manifest.webmanifest?v=42',
  './assets/icons/app-icon-64.png?v=42',
  './assets/icons/app-icon-192.png?v=42',
  './data/menu.json',
  './assets/schnitzel-icon.svg',
  './assets/dishes/apple-juice-1200-q80.avif',
  './assets/dishes/banana-clean.avif',
  './assets/dishes/black-bread-clean.avif',
  './assets/dishes/bun-clean.avif',
  './assets/dishes/chocolate-yogurt-clean.avif',
  './assets/dishes/cookie-clean.avif',
  './assets/dishes/grape-juice-1200-q80.avif',
  './assets/dishes/hot-dog-clean.avif',
  './assets/dishes/lollipop-clean.avif',
  './assets/dishes/marshmallow-clean.avif',
  './assets/dishes/pancakes-clean.avif',
  './assets/dishes/plain-sausage-clean.avif',
  './assets/dishes/sausage-clean.avif',
  './assets/dishes/water-1200-q80.avif'
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

  const requestUrl = new URL(event.request.url);
  const isMenuData = requestUrl.pathname.endsWith('/data/menu.json');

  if (isMenuData) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./data/menu.json', copy));
          return response;
        })
        .catch(() => caches.match('./data/menu.json'))
    );
    return;
  }

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
