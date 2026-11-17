// Steps for tools_tour.js (STEPS=pork_steps.js): switch to pork and walk the main screens.
module.exports = async ({ pg, shot, tool, logs }) => {
  await shot('beef_home');
  await pg.click('#species [data-sp="pork"]');
  await pg.waitForFunction('window.__shop.has("pork")', null, { timeout: 60000 }).catch(() => logs.push('pork pack did not load'));
  await shot('pork_home');
  await pg.click('#views [data-v="cow"]'); await shot('pork_pig');
  await pg.click('#views [data-v="case"]'); await shot('pork_case');
  await pg.click('#tabs button:nth-child(2)'); await pg.click('#views [data-v="block"]'); await shot('pork_cut');
  await pg.click('#tabs button:nth-child(4)'); await pg.click('tr[data-cut="pen"]'); await pg.click('#views [data-v="cow"]'); await shot('pork_whole');
  await pg.click('#tabs button:nth-child(4)'); await pg.click('tr[data-cut="pso"]'); await shot('pork_internal');
  await pg.click('#tabs button:nth-child(3)'); await shot('pork_dishes');
  await pg.click('#tabs button:nth-child(4)'); await shot('pork_translator');
  await pg.click('#tabs button:nth-child(1)'); await pg.click('#methods [data-method="crisp"]'); await shot('pork_crisp');
  await tool('done'); await pg.click('#dnChips [data-lvl="3"]'); await shot('pork_done');
  await tool('calc'); await shot('pork_calc');
  await tool('cmp'); await shot('pork_cmp');
  await tool('quiz'); for (let i = 0; i < 9; i++) { const o = await pg.$('.quiz button:not([disabled])'); if (o) await o.click(); else await pg.mouse.click(400, 400); const nx = await pg.$('[data-qz="next"]'); if (!nx) await pg.mouse.click(300, 430); const n2 = await pg.$('[data-qz="next"]'); if (n2) await n2.click(); else break; }
  await shot('pork_quiz_end');
  // search across species, then back to beef
  await pg.click('#tabs button:nth-child(1)'); await pg.fill('#q', 'brisket'); await pg.press('#q', 'Enter'); await shot('back_to_beef');
  logs.push('species now: ' + await pg.evaluate(() => document.querySelector('#species [aria-pressed="true"]').dataset.sp));
  await pg.click('#tabs button:nth-child(1)'); await pg.fill('#q', 'lechona'); await pg.press('#q', 'Enter'); await shot('search_pork');
  logs.push('species now: ' + await pg.evaluate(() => document.querySelector('#species [aria-pressed="true"]').dataset.sp));
};
