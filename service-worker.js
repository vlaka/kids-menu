const CACHE_NAME = 'kids-menu-v42';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=40',
  './enhancements.css?v=40',
  './app.js?v=40',
  './enhancements.js?v=40',
  './manifest.webmanifest?v=40',
  './assets/icons/app-icon-64.png?v=40',
  './assets/icons/app-icon-192.png?v=40',
  './data/menu.json',
  './assets/schnitzel-icon.svg',
  './assets/dishes/apple-juice-1200-q80.avif',
  './assets/dishes/banana-1200-q80.avif',
  './assets/dishes/black-bread-1200-q80-v2.avif',
  './assets/dishes/lollipop-20260912-0326.avif',
  './assets/dishes/pancakes-20260912-0429.avif',
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
