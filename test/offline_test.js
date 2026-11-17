// Checks the installable-app plumbing in headless Chromium: node test/offline_test.js
// 1) first visit downloads the pack, 2) second visit reads it from the device, 3) the shop opens with no network,
// 4) with data saver on, nothing downloads until the button is tapped.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(path.dirname(__dirname), 'dist'), PORT = 8768, URL_ = `http://127.0.0.1:${PORT}/`;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
let hits = [];
const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html'; hits.push(u); fs.readFile(path.join(ROOT, u), (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': TYPES[path.extname(u)] || 'application/octet-stream', 'content-length': b.length }); r.end(b); } }); });
const ready = (pg) => pg.waitForFunction('!!window.__shop && document.querySelector("#loading").classList.contains("done")', null, { timeout: 120000 });
const packs = () => hits.filter((h) => h.endsWith('.pack'));
(async () => {
  await new Promise((ok) => srv.listen(PORT, '127.0.0.1', ok));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const out = []; const say = (ok, msg) => out.push((ok ? 'PASS ' : 'FAIL ') + msg);
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', locale: 'es-CO' });
  await ctx.route('**/fonts.googleapis.com/**', (r) => r.abort());
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(URL_); await ready(pg);
  say(packs().length === 1 && packs()[0] === '/meshes.pack', 'first visit downloads only the beef pack: ' + packs().join(','));
  await pg.waitForFunction('navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true)', null, { timeout: 30000 }).catch(() => {});
  await pg.waitForTimeout(1500);
  say(await pg.evaluate(async () => !!(await (await caches.open('korte-packs')).keys()).length), 'pack stored in Cache Storage');
  hits = []; await pg.reload(); await ready(pg);
  say(packs().length === 0, 'second visit: no pack request reaches the network (' + hits.length + ' requests total)');
  await pg.click('#species [data-sp="pork"]'); await pg.waitForFunction('window.__shop.has("pork")', null, { timeout: 60000 });
  say(packs().join() === '/meshes_pork.pack', 'pork pack downloads when pork is opened');
  await pg.waitForTimeout(1000);
  await ctx.setOffline(true); hits = [];
  await pg.reload().catch((e) => errs.push('offline reload: ' + e.message)); await ready(pg).catch(() => errs.push('offline: shop did not load'));
  await pg.waitForFunction('window.__shop && window.__shop.has("pork")', null, { timeout: 30000 }).catch(() => errs.push('offline: pork did not load'));
  say(hits.length === 0 && await pg.evaluate(() => window.__shop.has('pork')), 'offline: page, three.js and both animals load with no network');
  await pg.click('#gear'); await pg.waitForTimeout(600);
  say((await pg.textContent('#setOffline')).split('✓').length === 3, 'settings show both species saved: ' + (await pg.textContent('#setOffline')).replace(/\s+/g, ' '));
  await pg.screenshot({ path: path.join(ROOT, '..', 'out', 'offline_settings.png') });
  await ctx.setOffline(false); await ctx.close();
  // data saver, clean profile
  const c2 = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', locale: 'es-CO' });
  await c2.route('**/fonts.googleapis.com/**', (r) => r.abort());
  await c2.addInitScript(() => { try { localStorage.setItem('atlas-saver', '1'); } catch (e) { } });
  const p2 = await c2.newPage(); p2.on('pageerror', (e) => errs.push(e.message)); hits = [];
  await p2.goto(URL_); await p2.waitForSelector('#loadBtn:not([hidden])', { timeout: 30000 }); await p2.waitForTimeout(1500);
  say(packs().length === 0, 'data saver: no pack downloaded before asking; button says "' + (await p2.textContent('#loadBtn')) + '"');
  await p2.screenshot({ path: path.join(ROOT, '..', 'out', 'saver.png') });
  await p2.click('#loadBtn'); await ready(p2);
  say(packs().length === 1, 'data saver: pack downloads after the tap');
  const man = await p2.evaluate(async () => { const m = await (await fetch(document.querySelector('link[rel=manifest]').href)).json(); return m.name + ' / ' + m.display + ' / ' + m.icons.length + ' icons'; });
  say(/standalone/.test(man), 'manifest: ' + man);
  await b.close(); srv.close();
  console.log(out.join('\n')); console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors');
  process.exit(out.some((l) => l.startsWith('FAIL')) || errs.length ? 1 : 0);
})();
