// Service worker mínimo: cachea el shell y el banco de escenarios para jugar sin conexión (RF21).
const CACHE = 'cyberdojo-v0.2';
const ASSETS = ['./', './index.html', './escenarios.js', './manifest.webmanifest', './icons/icon.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
