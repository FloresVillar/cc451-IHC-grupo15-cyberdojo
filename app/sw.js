// Service worker (RF21, RNF04): guarda la app y el banco de escenarios para entrenar sin conexión.
// Estrategia: archivos de la app = caché primero y se actualizan en segundo plano; /api nunca se cachea.
const CACHE = 'cyberdojo-v0.3.0';
const ASSETS = ['./', './index.html', './escenarios.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './css/estilos.css', './js/reglas.js', './js/voz.js', './js/emocion.js', './js/api.js', './js/app.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const enCache = await cache.match(e.request, { ignoreSearch: true });
    const deRed = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => enCache);
    return enCache || deRed;
  }));
});
