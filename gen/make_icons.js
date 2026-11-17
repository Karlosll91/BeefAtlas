// Renders src/pwa/icon.svg (and icon-maskable.svg, with the cow inside the maskable safe zone) to the PNG sizes the web app manifest needs: node gen/make_icons.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DIR = path.join(path.dirname(__dirname), 'src', 'pwa');
(async () => {
  const b = await chromium.launch();
  for (const [src, name, size] of [['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512], ['icon.svg', 'apple-touch-icon.png', 180], ['icon-maskable.svg', 'icon-maskable-512.png', 512]]) {
    const svg = fs.readFileSync(path.join(DIR, src), 'utf8');
    const pg = await b.newPage({ viewport: { width: size, height: size } });
    await pg.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
    await pg.screenshot({ path: path.join(DIR, name) }); await pg.close();
  }
  await b.close();
})();
