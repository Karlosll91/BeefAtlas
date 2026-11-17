// Service worker: keeps the page, three.js, fonts and the 3D model packs on the device so the shop opens offline.
// build.py stamps VERSION; a new build installs a new shell cache and drops the old one.
const VERSION = '333650a179';
const SHELL = 'korte-shell-' + VERSION, PACKS = 'korte-packs', FONTS = 'korte-fonts';
const ASSETS = ['./', 'three.min.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('korte-shell-') && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const cacheFirst = (name, req, key) => caches.open(name).then((c) => c.match(key || req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(key || req, res.clone()); return res; })));

self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.endsWith('.pack')) return e.respondWith(cacheFirst(PACKS, req));
    const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
    return e.respondWith(cacheFirst(SHELL, req, page ? './' : undefined).catch(() => caches.match('./')));
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') e.respondWith(cacheFirst(FONTS, req));
});
