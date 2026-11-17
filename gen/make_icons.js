// Renders src/pwa/icon.svg to the PNG sizes the web app manifest needs: node gen/make_icons.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DIR = path.join(path.dirname(__dirname), 'src', 'pwa');
(async () => {
  const svg = fs.readFileSync(path.join(DIR, 'icon.svg'), 'utf8');
  const b = await chromium.launch();
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const pg = await b.newPage({ viewport: { width: size, height: size } });
    await pg.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
    await pg.screenshot({ path: path.join(DIR, name) }); await pg.close();
  }
  await b.close();
})();
