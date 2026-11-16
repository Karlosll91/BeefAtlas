// Deep link check for tools_tour.js: HASH='#d=...&p=br&l=pt' STEPS=tools_hash.js node test/tools_tour.js
module.exports = async ({ pg, shot, logs }) => {
  logs.push('lang=' + await pg.evaluate(() => document.documentElement.lang) + ' country=' + await pg.textContent('#countryBtn') + ' h2=' + await pg.textContent('#answer h2'));
  await shot('hash');
};
