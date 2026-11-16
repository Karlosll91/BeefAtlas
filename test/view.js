// Screenshot a mesh pack in test/viewer.html: node test/view.js out.png "f=../out/pig_test.bin&yaw=0.5" [w h]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.dirname(__dirname), PORT = 8767;
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' }); r.end(b); } }); });
(async () => {
  await new Promise((ok) => srv.listen(PORT, '127.0.0.1', ok));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const jobs = []; for (let i = 2; i + 1 < process.argv.length && !/^\d+$/.test(process.argv[i]); i += 2) jobs.push([process.argv[i], process.argv[i + 1]]);
  const nums = process.argv.filter((a) => /^\d+$/.test(a)).map(Number);
  const pg = await b.newPage({ viewport: { width: nums[0] || 1100, height: nums[1] || 700 } });
  pg.on('pageerror', (e) => console.log('PAGEERR', e.message));
  for (const [out, q] of jobs) { await pg.goto(`http://127.0.0.1:${PORT}/test/viewer.html?${q}`); await pg.waitForFunction('document.title === "ready"', null, { timeout: 90000 }).catch(() => console.log('timeout')); await pg.waitForTimeout(500); await pg.screenshot({ path: out }); }
  await b.close(); srv.close();
})();
