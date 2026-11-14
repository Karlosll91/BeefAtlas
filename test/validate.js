const fs = require('fs');
const src = fs.readFileSync('src/data_cuts.js', 'utf8');
const ctx = {};
new Function('ctx', src + '\nObject.assign(ctx,{COUNTRIES,METHODS,PROPS,PRICE,ZONES,CUTS});')(ctx);
const { COUNTRIES, METHODS, CUTS, ZONES } = ctx;
const ids = new Set(CUTS.map(c => c.id)); const errs = [];
if (ids.size !== CUTS.length) errs.push('dup cut ids');
for (const c of CUTS) {
  for (const k of COUNTRIES) if (!c.names[k.id] || !c.names[k.id][0]) errs.push('name missing ' + c.id + ' ' + k.id);
  for (const m in c.m) if (!METHODS[m]) errs.push('bad method ' + c.id + ' ' + m);
  for (const m in (c.why || {})) { if (!METHODS[m]) errs.push('bad why ' + c.id + ' ' + m); if (!c.m[m]) errs.push('why without m ' + c.id + ' ' + m); if (c.why[m].length !== 2) errs.push('why pair ' + c.id + m); }
  if (!ZONES[c.zone]) errs.push('zone ' + c.id);
  for (const f of ['d', 'tip', 'cook']) if (!c[f] || c[f].length !== 2 || !c[f][0] || !c[f][1]) errs.push('text ' + c.id + ' ' + f);
  for (const f of ['t', 'f', 'c', 'v', 'price']) if (!(c[f] >= 1 && c[f] <= 5)) errs.push('prop ' + c.id + ' ' + f);
  if (!c.muscle) errs.push('muscle ' + c.id);
  if (!Array.isArray(c.pieces) || !Array.isArray(c.reg)) errs.push('arr ' + c.id);
}
let n = 0; const seen = new Map(); const byCC = {}, byM = {}, byCut = {};
const CC = fs.readFileSync('src/app.js', 'utf8').match(/\('CO:Colombia[\s\S]*?INT:General\|General'\)/)[0];
const ccs = new Set([...CC.matchAll(/([A-Z]{2,3}):/g)].map(m => m[1]));
for (let i = 1; i <= 5; i++) for (const l of fs.readFileSync('src/dishes_' + i + '.txt', 'utf8').split('\n')) {
  if (!l.trim() || l[0] === '#') continue; n++;
  const f = l.split('|');
  if (f.length !== 7) { errs.push('fields(' + f.length + ') ' + l); continue; }
  if (!ccs.has(f[1])) errs.push('cc ' + l);
  if (!METHODS[f[2]]) errs.push('method ' + l);
  if (!ids.has(f[3])) errs.push('best ' + l);
  for (const a of (f[4] ? f[4].split(',') : [])) { if (!ids.has(a)) errs.push('alt ' + l); if (a === f[3]) errs.push('alt=best ' + l); }
  if (!f[5] || !f[6]) errs.push('gloss ' + l);
  const key = f[0].toLowerCase(); if (seen.has(key)) errs.push('dup dish ' + f[0]); seen.set(key, 1);
  byCC[f[1]] = (byCC[f[1]] || 0) + 1; byM[f[2]] = (byM[f[2]] || 0) + 1; byCut[f[3]] = (byCut[f[3]] || 0) + 1;
  const cut = CUTS.find(c => c.id === f[3]); if (!cut.m[f[2]]) errs.push('best cut lacks method: ' + f[0] + ' ' + f[3] + ' ' + f[2]);
}
console.log('dishes', n, 'cuts', CUTS.length, 'errors', errs.length);
console.log(errs.slice(0, 60).join('\n'));
console.log('by method', JSON.stringify(byM)); console.log('by cut', JSON.stringify(byCut));
console.log('cuisines', Object.keys(byCC).length, JSON.stringify(Object.entries(byCC).sort((a, b) => b[1] - a[1]).slice(0, 25)));
