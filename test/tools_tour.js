// Headless tour of the "More" tab: node test/tools_tour.js [mobile]
// Serves the repo, opens dist/index.html and writes screenshots to out/.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.dirname(__dirname), PORT = 8766, mobile = process.argv.includes('mobile'), dark = process.argv.includes('dark');
const TYPES = { '.html': 'text/html; charset=utf-8', '.txt': 'text/plain', '.js': 'application/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b); } }); });
(async () => {
  await new Promise((ok) => srv.listen(PORT, '127.0.0.1', ok));
  const three = fs.readFileSync(path.join(ROOT, 'test', 'three.min.js'), 'utf8');
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: mobile ? { width: 390, height: 800 } : { width: 1400, height: 820 }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce', locale: 'es-CO', colorScheme: dark ? 'dark' : 'light' });
  const pg = await ctx.newPage(); const logs = []; let n = 0;
  pg.on('pageerror', (e) => logs.push('PAGEERR ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/GPU stall|Failed to load resource/.test(m.text())) logs.push('console: ' + m.text()); });
  await pg.route('**/three.min.js', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: three }));
  await pg.route('**/fonts.googleapis.com/**', (r) => r.abort());
  await pg.goto(`http://127.0.0.1:${PORT}/dist/index.html` + (process.env.HASH || ''));
  await pg.waitForFunction('!!window.__shop && document.querySelector("#loading").classList.contains("done")', null, { timeout: 120000 }).catch(() => logs.push('TIMEOUT waiting for shop'));
  await pg.waitForTimeout(2500);
  const pre = (mobile ? 'm' : 'd') + (dark ? 'k' : '');
  const shot = async (name) => { await pg.waitForTimeout(1800); await pg.screenshot({ path: path.join(ROOT, 'out', `${pre}${String(n++).padStart(2, '0')}_${name}.png`) }); };
  const tool = async (k) => { await pg.click('#tabs button:nth-child(5)'); const back = await pg.$('[data-back]'); if (back) await back.click(); await pg.click(`.tool[data-tool="${k}"]`); };
  const steps = require(path.join(ROOT, 'test', process.env.STEPS || 'tools_steps.js'));
  try { await steps({ pg, shot, tool, logs }); } catch (e) { logs.push('STEP FAIL ' + e.message.split('\n')[0]); await shot('fail'); }
  await b.close(); srv.close();
  console.log(logs.slice(0, 40).join('\n') || 'no errors');
})();
