const CACHE_NAME = 'kids-menu-v61';
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
  './assets/dishes/apple-juice-1200-q80-1.avif',
  './assets/dishes/banana-v2.avif',
  './assets/dishes/black-bread-v3.avif',
  './assets/dishes/boiled-egg-v2.avif',
  './assets/dishes/bun-v3.avif',
  './assets/dishes/chocolate-yogurt-v3.avif',
  './assets/dishes/cookie-v3.avif',
  './assets/dishes/grape-juice-v3.avif',
  './assets/dishes/hot-dog-v3.avif',
  './assets/dishes/ketchup-mayo-v5.avif',
  './assets/dishes/lollipop-v2.avif',
  './assets/dishes/marshmallow-v3.avif',
  './assets/dishes/nutella-bread-v3.avif',
  './assets/dishes/pancakes-v3.avif',
  './assets/dishes/plain-sausage-v3.avif',
  './assets/dishes/sausage-v3.avif',
  './assets/dishes/schnitzel-sticks-v3.avif',
  './assets/dishes/water-v3.avif'
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
