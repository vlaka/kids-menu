const CACHE_NAME = 'kids-menu-v28';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=28',
  './enhancements.css?v=28',
  './app.js?v=28',
  './enhancements.js?v=28',
  './manifest.webmanifest?v=28',
  './assets/icons/app-icon-64.png?v=28',
  './assets/icons/app-icon-192.png?v=28',
  './data/menu.json',
  './assets/schnitzel-icon.svg',
  './assets/dishes/banana-20260912-0115.avif',
  './assets/dishes/black-bread-20260912-0115.avif'
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
