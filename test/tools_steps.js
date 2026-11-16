// Steps for tools_tour.js: every tool once, in Spanish, then a pass in Portuguese and English.
module.exports = async ({ pg, shot, tool, logs }) => {
  await shot('home');
  await pg.click('#tabs button:nth-child(5)'); await shot('menu');
  await tool('done'); await shot('done57');
  await pg.click('#dnChips [data-lvl="5"]'); await shot('done_well');
  await pg.click('#dnChips [data-lvl="1"]'); await shot('done_rare');
  await tool('shop'); await pg.selectOption('#shIn', 'fr'); await pg.selectOption('#shM', { index: 1 }); await pg.fill('#shQty', '800'); await pg.press('#shQty', 'Tab'); await shot('shop_fr');
  await pg.selectOption('#shIn', 'co');
  await tool('calc'); await shot('calc');
  await pg.selectOption('#cCut', 'ba'); await pg.selectOption('#cM', 'grill'); await pg.click('[data-step="1"]'); await pg.click('.toolbody [data-add]'); await shot('calc_grill');
  await tool('cmp'); await shot('cmp');
  await tool('gloss'); await pg.fill('#glq', 'lomo'); await shot('gloss');
  await tool('list'); await shot('list');
  await tool('quiz');
  for (let i = 0; i < 9; i++) {
    const find = await pg.$('.toolbody .note:not(.tagline)');
    const opt = await pg.$('.quiz button:not([disabled])');
    if (opt) await opt.click();
    else if (find) { const id = await pg.evaluate(() => { const s = window.__shop; const q = document.querySelector('.toolbody h2').textContent; return q; }); logs.push('find question: ' + id); await pg.mouse.click(330, 420); if (!(await pg.$('[data-qz="next"]'))) await pg.mouse.click(420, 380); }
    if (i === 0 || i === 3) await shot('quiz' + i);
    const next = await pg.$('[data-qz="next"]'); if (next) await next.click(); else break;
  }
  await shot('quiz_end');
  // cut card extras
  await pg.click('#tabs button:nth-child(2)'); await shot('cutcard');
  await pg.evaluate(() => document.querySelector('[data-grain]') && document.querySelector('[data-grain]').scrollIntoView());
  const g = await pg.$('[data-grain]'); if (g) { await g.click(); await shot('grain'); await pg.click('[data-grain]'); } else logs.push('no grain button');
  await pg.evaluate(() => document.querySelector('#pbody').scrollTop = 0); await pg.click('#tabs button:nth-child(4)'); await pg.click('tr[data-cut="sb"]'); await pg.click('[data-grain]'); await shot('grain_sb'); await pg.click('[data-grain]');
  // languages
  await pg.click('#langBtn'); await pg.click('#langBtn'); await pg.click('#tabs button:nth-child(1)'); await shot('pt_butcher');
  await pg.click('#tabs button:nth-child(2)'); await shot('pt_cut');
  await tool('done'); await shot('pt_done');
  await pg.click('#langBtn'); await pg.click('#langBtn'); await tool('calc'); await shot('en_calc');
  logs.push('scroll ' + await pg.evaluate(() => document.documentElement.scrollWidth + 'x' + document.documentElement.scrollHeight));
};
