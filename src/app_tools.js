// ---- The "More" tab: doneness, counter card, portions, comparison, glossary, quiz, favourites and shopping list.
// Built by app.js, which passes in its helpers (A). Returns the hooks app.js calls.
function AtlasTools(A) {
  'use strict';
  const { $, esc, norm, st, ls, tx, BY, DISHES, cname, calt, ctry, lower, cuisineName } = A;

  const T = {
    es: { back: 'Volver', menu: 'Herramientas',
      tools: { done: ['Términos de cocción', 'Azul, medio, tres cuartos… y cómo se dice en cada país'], shop: ['Modo carnicería', 'Una tarjeta para mostrar en el mostrador, en el idioma del lugar'], calc: ['Porciones y tiempos', 'Cuánta carne comprar y cuánto cocinarla'], cmp: ['Comparar cortes', 'Dos cortes lado a lado'], gloss: ['Glosario', 'Marmoleo, maduración, contrafibra y palabras trampa'], quiz: ['Quiz', '¿Cuánto sabes de cortes?'], list: ['Mi lista', 'Favoritos y lista de compras'] },
      dnHint: 'Mueve el control: el filete de la tabla cambia de color por dentro.', temp: 'Temperatura interna', dnHow: 'Cómo pedirlo en {c}', waiter: 'Te preguntarán', listen: 'Escuchar', dnEach: 'Este punto en cada país', dnScale: 'La escala completa', dnA: 'Como lo pido en', dnB: 'Cómo se pide en', dnFor: 'Para', dnTraps: 'Malentendidos frecuentes', dnSet: 'Verlo en el filete', core: 'Centro',
      shCut: 'Corte', shIn: 'Compro en', shHome: 'En mi país', shFor: 'Es para', shQty: 'Cantidad (g)', shSay: 'Dilo así', shMeans: 'Qué estás diciendo', shHomeName: 'En {c} lo conoces como', shNo: 'Si no lo tienen, también sirve', shPoint: 'El corte está resaltado en la res: si hay dudas, muéstrale la pantalla al carnicero.', shAny: 'Sin especificar',
      people: 'Personas', appetite: ['Poco', 'Normal', 'Con hambre'], appL: 'Apetito', method: 'Preparación', buy: 'Compra', perPerson: 'por persona', bone: 'Incluye el peso del hueso.', yieldNote: 'Al cocinar pierde cerca de {p} % de su peso.', time: 'Tiempo y temperatura', thick: 'Grosor', doneness: 'Término', perSide: '{a} min por lado a fuego alto', pull: 'Retírala a {t} °C: en el reposo sube a {u} °C.', restMin: 'Reposo: {m} min antes de cortar.', thickTip: 'Con más de 4 cm conviene el sellado inverso: calor suave hasta {t} °C y sellado fuerte al final.', roastT: 'Horno: 15 min a 220 °C y luego unos {m} min a 180 °C.', slowT: 'Aquí no manda el término sino el tiempo:', approx: 'Tiempos aproximados: el termómetro manda.', addList: 'Añadir a la lista', toShop: 'Mostrar al carnicero',
      of: 'de', cmpA: 'Corte A', cmpB: 'Corte B', best: 'Mejor para', price: 'Precio', zone: 'Zona', recipes: 'Recetas', open: 'Ver ficha', cooking: 'Cocción',
      glSearch: 'Buscar término…', glNone: 'No tengo ese término.', seeCut: 'Ver un ejemplo',
      qzIntro: 'Ocho preguntas sobre cortes, nombres y términos.', qzFind: 'Toca en la res: ¿dónde está {x}?', qzName: 'En {c}, ¿cómo se llama {x}?', qzMethod: '¿Cuál de estos cortes es el mejor para {m}?', qzDone: 'En {c} pides la carne «{x}». ¿Cómo llega?', right: '¡Correcto!', wrong: 'No era ese.', itWas: 'Era', next: 'Siguiente', score: 'Puntaje', again: 'Otra ronda', qzEnd: 'Ronda terminada: {a} de {b}.', qzOf: 'Pregunta {a} de {b}', qzTap: 'Gira la res y toca el corte.',
      favs: 'Favoritos', noFav: 'Aún no tienes favoritos. Toca ☆ en un corte o en una receta.', shopList: 'Lista de compras', noList: 'La lista está vacía. Añade cortes desde su ficha o desde la calculadora.', copy: 'Copiar lista', clear: 'Vaciar', copied: 'Lista copiada', listHint: 'Los nombres se muestran como se piden en {c}. Cambia el país y la lista se traduce sola.', added: 'Añadido a la lista', linkCopied: 'Enlace copiado', fav: 'Favorito', share: 'Compartir', addL: 'A la lista', remove: 'Quitar',
      grain: 'Ver la fibra', grainOff: 'Ocultar la fibra', grainH: 'Flechas doradas: hacia dónde corre la fibra. Líneas blancas: por dónde pasa el cuchillo, a contrafibra. Es una guía aproximada.', grainV: 'En este corte la fibra va de arriba abajo: el filete ya viene cortado a contrafibra.',
      subs: 'Si no lo consigues', subWhy: 'También sirve para', cheaper: 'más económico', pricier: 'más caro', doneRec: 'Término recomendado', seeDone: 'Ver los términos', term: 'Término', word: 'Glosario' },
    en: { back: 'Back', menu: 'Tools',
      tools: { done: ['Doneness', 'Rare, medium, well done… and what each country calls them'], shop: ['At the counter', 'A card to show the butcher, in the local language'], calc: ['Portions and times', 'How much to buy and how long to cook it'], cmp: ['Compare cuts', 'Two cuts side by side'], gloss: ['Glossary', 'Marbling, aging, against the grain and trap words'], quiz: ['Quiz', 'How well do you know your cuts?'], list: ['My list', 'Favourites and shopping list'] },
      dnHint: 'Move the slider: the steak on the block changes colour inside.', temp: 'Core temperature', dnHow: 'How to order it in {c}', waiter: 'They will ask', listen: 'Listen', dnEach: 'This point in each country', dnScale: 'The full scale', dnA: 'How I order it in', dnB: 'How to order it in', dnFor: 'For', dnTraps: 'Common misunderstandings', dnSet: 'See it on the steak', core: 'Centre',
      shCut: 'Cut', shIn: 'I am shopping in', shHome: 'Back home', shFor: 'It is for', shQty: 'Amount (g)', shSay: 'Say it like this', shMeans: 'What you are saying', shHomeName: 'In {c} you know it as', shNo: 'If they do not have it, this also works', shPoint: 'The cut is highlighted on the cow: when in doubt, show the butcher your screen.', shAny: 'Not specified',
      people: 'People', appetite: ['Light', 'Normal', 'Hungry'], appL: 'Appetite', method: 'Preparation', buy: 'Buy', perPerson: 'per person', bone: 'Includes the weight of the bone.', yieldNote: 'It loses about {p}% of its weight in cooking.', time: 'Time and temperature', thick: 'Thickness', doneness: 'Doneness', perSide: '{a} min per side over high heat', pull: 'Pull it at {t} °C: it rises to {u} °C as it rests.', restMin: 'Rest: {m} min before slicing.', thickTip: 'Over 4 cm (1½ in), reverse sear: gentle heat to {t} °C, then a hard sear.', roastT: 'Oven: 15 min at 220 °C (425 °F), then about {m} min at 180 °C (350 °F).', slowT: 'Here time rules, not doneness:', approx: 'Times are approximate: the thermometer decides.', addList: 'Add to list', toShop: 'Show the butcher',
      of: 'of', cmpA: 'Cut A', cmpB: 'Cut B', best: 'Best for', price: 'Price', zone: 'Zone', recipes: 'Recipes', open: 'Open card', cooking: 'Cooking',
      glSearch: 'Search a term…', glNone: 'I do not have that term.', seeCut: 'See an example',
      qzIntro: 'Eight questions about cuts, names and doneness.', qzFind: 'Tap the cow: where is the {x}?', qzName: 'In {c}, what is {x} called?', qzMethod: 'Which of these cuts is best to {m}?', qzDone: 'In {c} you order your steak “{x}”. How does it arrive?', right: 'Correct!', wrong: 'Not that one.', itWas: 'It was', next: 'Next', score: 'Score', again: 'Another round', qzEnd: 'Round over: {a} out of {b}.', qzOf: 'Question {a} of {b}', qzTap: 'Turn the cow and tap the cut.',
      favs: 'Favourites', noFav: 'No favourites yet. Tap ☆ on a cut or a recipe.', shopList: 'Shopping list', noList: 'The list is empty. Add cuts from their card or from the calculator.', copy: 'Copy list', clear: 'Clear', copied: 'List copied', listHint: 'Names are shown as you would ask for them in {c}. Change the country and the list translates itself.', added: 'Added to the list', linkCopied: 'Link copied', fav: 'Favourite', share: 'Share', addL: 'Add to list', remove: 'Remove',
      grain: 'Show the grain', grainOff: 'Hide the grain', grainH: 'Gold arrows: the way the fibres run. White lines: where the knife goes, across the grain. It is an approximate guide.', grainV: 'In this cut the fibres run top to bottom: the steak is already cut across the grain.',
      subs: 'If you cannot find it', subWhy: 'It also works for', cheaper: 'cheaper', pricier: 'pricier', doneRec: 'Recommended doneness', seeDone: 'See doneness', term: 'Doneness', word: 'Glossary' },
    pt: { back: 'Voltar', menu: 'Ferramentas',
      tools: { done: ['Ponto da carne', 'Malpassada, ao ponto, bem passada… e como se diz em cada país'], shop: ['Modo açougue', 'Um cartão para mostrar no balcão, no idioma do lugar'], calc: ['Porções e tempos', 'Quanta carne comprar e quanto tempo cozinhar'], cmp: ['Comparar cortes', 'Dois cortes lado a lado'], gloss: ['Glossário', 'Marmoreio, maturação, contra a fibra e palavras-armadilha'], quiz: ['Quiz', 'Quanto você sabe de cortes?'], list: ['Minha lista', 'Favoritos e lista de compras'] },
      dnHint: 'Mova o controle: o bife na tábua muda de cor por dentro.', temp: 'Temperatura interna', dnHow: 'Como pedir em: {c}', waiter: 'Vão perguntar', listen: 'Ouvir', dnEach: 'Este ponto em cada país', dnScale: 'A escala completa', dnA: 'Como eu peço em', dnB: 'Como se pede em', dnFor: 'Para', dnTraps: 'Mal-entendidos frequentes', dnSet: 'Ver no bife', core: 'Centro',
      shCut: 'Corte', shIn: 'Compro em', shHome: 'No meu país', shFor: 'É para', shQty: 'Quantidade (g)', shSay: 'Diga assim', shMeans: 'O que você está dizendo', shHomeName: 'Em {c} você conhece como', shNo: 'Se não tiverem, também serve', shPoint: 'O corte está destacado no boi: na dúvida, mostre a tela ao açougueiro.', shAny: 'Sem especificar',
      people: 'Pessoas', appetite: ['Pouco', 'Normal', 'Com fome'], appL: 'Apetite', method: 'Preparo', buy: 'Compre', perPerson: 'por pessoa', bone: 'Inclui o peso do osso.', yieldNote: 'Ao cozinhar perde cerca de {p} % do peso.', time: 'Tempo e temperatura', thick: 'Espessura', doneness: 'Ponto', perSide: '{a} min de cada lado em fogo alto', pull: 'Tire a {t} °C: no descanso sobe a {u} °C.', restMin: 'Descanso: {m} min antes de cortar.', thickTip: 'Com mais de 4 cm vale a selagem reversa: calor suave até {t} °C e selagem forte no fim.', roastT: 'Forno: 15 min a 220 °C e depois uns {m} min a 180 °C.', slowT: 'Aqui manda o tempo, não o ponto:', approx: 'Tempos aproximados: quem manda é o termômetro.', addList: 'Adicionar à lista', toShop: 'Mostrar ao açougueiro',
      of: 'de', cmpA: 'Corte A', cmpB: 'Corte B', best: 'Melhor para', price: 'Preço', zone: 'Região', recipes: 'Receitas', open: 'Ver ficha', cooking: 'Cozimento',
      glSearch: 'Buscar termo…', glNone: 'Não tenho esse termo.', seeCut: 'Ver um exemplo',
      qzIntro: 'Oito perguntas sobre cortes, nomes e pontos.', qzFind: 'Toque no boi: onde fica {x}?', qzName: 'Em: {c}, como se chama {x}?', qzMethod: 'Qual destes cortes é o melhor para {m}?', qzDone: 'Em: {c}, você pede a carne “{x}”. Como ela chega?', right: 'Correto!', wrong: 'Não era esse.', itWas: 'Era', next: 'Próxima', score: 'Pontos', again: 'Outra rodada', qzEnd: 'Rodada terminada: {a} de {b}.', qzOf: 'Pergunta {a} de {b}', qzTap: 'Gire o boi e toque no corte.',
      favs: 'Favoritos', noFav: 'Você ainda não tem favoritos. Toque em ☆ num corte ou numa receita.', shopList: 'Lista de compras', noList: 'A lista está vazia. Adicione cortes pela ficha ou pela calculadora.', copy: 'Copiar lista', clear: 'Esvaziar', copied: 'Lista copiada', listHint: 'Os nomes aparecem como se pedem em: {c}. Mude o país e a lista se traduz sozinha.', added: 'Adicionado à lista', linkCopied: 'Link copiado', fav: 'Favorito', share: 'Compartilhar', addL: 'Para a lista', remove: 'Tirar',
      grain: 'Ver a fibra', grainOff: 'Ocultar a fibra', grainH: 'Setas douradas: para onde corre a fibra. Linhas brancas: por onde passa a faca, contra a fibra. É um guia aproximado.', grainV: 'Neste corte a fibra vai de cima a baixo: o bife já vem cortado contra a fibra.',
      subs: 'Se você não achar', subWhy: 'Também serve para', cheaper: 'mais barato', pricier: 'mais caro', doneRec: 'Ponto recomendado', seeDone: 'Ver os pontos', term: 'Ponto', word: 'Glossário' }
  };
  const S = () => T[st.lang];
  const ICON = { done: '°C', shop: '☞', calc: '⚖', cmp: '⇄', gloss: 'Aa', quiz: '?', list: '★' };
  const ORDER = ['done', 'shop', 'calc', 'cmp', 'gloss', 'quiz', 'list'];
  const LOC = { es: 'es-CO', en: 'en-US', pt: 'pt-BR' };
  const lp = (c) => ctry(c || st.country).lang.slice(0, 2);
  const cl = (c) => ctry(c || st.country).lang;
  const F = (t) => Math.round(t * 9 / 5 + 32);
  const nf = (x, d) => Number(x).toLocaleString(LOC[st.lang], { maximumFractionDigits: d == null ? 1 : d });
  const wt = (g) => (g >= 1000 ? nf(g / 1000, 2) + ' kg' : nf(g, 0) + ' g') + (st.lang === 'en' ? ` (${nf(g / 453.6, 1)} lb)` : '');
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const on = (t) => st.tab === 4 && st.tool === t;
  const cutOpts = (sel) => A.cuts().map((c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(cname(c))}</option>`).join('');
  const ctryOpts = (sel) => COUNTRIES.map((c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(tx(c))}</option>`).join('');
  const topMethods = (cut) => Object.keys(cut.m).sort((a, b) => cut.m[b] - cut.m[a]);

  // ------------------------------------------------------------ state kept between visits
  Object.assign(st, { tool: null, temp: 57, calc: { n: 4, app: 1, m: null, th: 2.5, lvl: null }, cmp: null, glossQ: '', quiz: null, shopQty: 0, shopM: null, grain: false });
  const load = (k, d) => { try { const v = JSON.parse(ls.get(k)); return v == null ? d : v; } catch (e) { return d; } };
  const fav = { c: new Set(load('favc', []).filter((id) => BY[id])), d: new Set(load('favd', [])) };
  let list = load('list', []).filter((x) => x && BY[x.id]);
  const save = () => { ls.set('favc', JSON.stringify([...fav.c])); ls.set('favd', JSON.stringify([...fav.d])); ls.set('list', JSON.stringify(list)); };
  function addList(id, g, note) {
    const cur = list.find((x) => x.id === id && (x.note || '') === (note || '') && !x.done);
    if (cur) { if (g) cur.g = g; } else list.push({ id, g: g || 0, note: note || '', done: false });
    save(); A.toast(S().added);
  }

  // ------------------------------------------------------------ doneness
  const LV = DONENESS.levels;
  const levelOf = (t) => { for (let i = 0; i < LV.length; i++) if (t <= LV[i].t[1]) return i; return LV.length - 1; };
  const mid = (i) => Math.round((LV[i].t[0] + LV[i].t[1]) / 2);
  const dname = (i, c) => DONENESS.names[c || st.country][i];
  const dfull = (i, c) => { const n = dname(i, c); return n[0] + (n[2] ? ', ' + n[2] : ''); };
  const orderPhrase = (i, c) => DONENESS.order[lp(c)].replace('{x}', dfull(i, c));
  const look = (t) => (typeof Shop !== 'undefined' && Shop.doneLook ? Shop.doneLook(t, st.sp) : { core: [198, 58, 69], band: 0.2, ring: [138, 111, 96], crust: [59, 33, 20], fat: [236, 214, 160] });
  function doneRec(cut) {
    const r = DONE_REC[cut.id] || {};
    const nm = (i) => `<b lang="${cl()}">${esc(lower(dname(i)[0]))}</b>`;
    let range = '';
    if (r.r) {
      const a = r.r[0], b = r.r[1], same = a === b || dname(a)[0] === dname(b)[0];
      range = (same ? esc(tx(DONE_NOTE.r1)).replace('{a}', nm(a)) : esc(tx(DONE_NOTE.r)).replace('{a}', nm(a)).replace('{b}', nm(b))) + ` (${LV[a].t[0]}–${LV[b].t[1]} °C)`;
    }
    if (r.pork) range += '. ' + esc(tx(DONE_NOTE.pork)).replace(/\.$/, '');
    if (r.r && r.slow) return { html: esc(tx(DONE_NOTE.both)).replace('{x}', range.charAt(0).toLowerCase() + range.slice(1)), lvl: r.r[0] };
    if (r.r) return { html: range + '.', lvl: r.r[0] };
    const k = r.slow ? 'slow' : r.safe ? 'safe' : r.crisp ? 'crisp' : r.soft ? 'soft' : null;
    return { html: k ? esc(tx(DONE_NOTE[k])) : '', lvl: null };
  }

  function rDone() {
    const s = S();
    $('#toolbody').innerHTML = `<p class="note">${esc(s.dnHint)}</p>${st.sp === 'pork' ? `<p class="whybox">${esc(tx(DONENESS.porkNote))}</p>` : ''}
      <div class="donebox"><div class="steakx" id="dnSteak" role="img"><i></i></div><div class="dnread" id="dnRead"></div></div>
      <input type="range" class="wide" id="temp" min="${DONENESS.min}" max="${DONENESS.max}" step="1" value="${st.temp}" aria-label="${esc(s.temp)}">
      <div class="chips" id="dnChips"></div>
      <p id="dnDesc"></p>
      <div class="say" id="dnPhrase"></div>
      <div><h4>${esc(s.dnEach)}</h4><div class="names" id="dnEach"></div></div>
      <div><h4>${esc(s.dnScale)}</h4><div class="filters"><label class="field"><span>${esc(s.dnA)}</span><select id="dnA">${ctryOpts(st.trFrom)}</select></label><label class="field"><span>${esc(s.dnB)}</span><select id="dnB">${ctryOpts(st.country)}</select></label></div>
        <div class="tscroll" style="margin-top:8px"><table><thead><tr><th>°C</th><th>${esc(tx(ctry(st.trFrom)))}</th><th>${esc(tx(ctry(st.country)))}</th></tr></thead><tbody id="dnTable"></tbody></table></div></div>
      <div id="dnCut"></div>
      <div><h4>${esc(s.dnTraps)}</h4><div class="acc">${DONENESS.pitfalls.map((p) => `<details><summary>${esc(tx(p.t))}</summary><p>${esc(tx(p.d))}</p></details>`).join('')}</div></div>
      <p class="note">${esc(tx(DONENESS.safety))}</p>`;
    uDone();
  }
  function uDone() {
    if (!$('#dnSteak')) return;
    const s = S(), t = st.temp, i = levelOf(t), L = look(t), me = st.country, rgb = (a) => `rgb(${a.join(',')})`;
    const sk = $('#dnSteak'); sk.style.setProperty('--core', rgb(L.core)); sk.style.setProperty('--ring', rgb(L.ring)); sk.style.setProperty('--crust', rgb(L.crust)); sk.style.setProperty('--band', L.band.toFixed(3));
    sk.setAttribute('aria-label', tx(LV[i].d));
    const n = dname(i);
    $('#dnRead').innerHTML = `<div class="lbl">${esc(tx(ctry(me)))}</div><div class="big" lang="${cl()}">${esc(n[0])}</div>${n[2] || n[1] ? `<div class="also" lang="${cl()}">${esc([n[2], n[1]].filter(Boolean).join(' · '))}</div>` : ''}<div class="tnum">${t} °C · ${F(t)} °F</div>`;
    $('#dnChips').innerHTML = LV.map((l, k) => `<button class="chip" data-lvl="${k}" aria-pressed="${k === i}" lang="${cl()}">${esc(dname(k)[0])}<small>${l.t[0]}°</small></button>`).join('');
    $('#dnDesc').textContent = tx(LV[i].d);
    $('#dnPhrase').innerHTML = `<div class="lbl">${esc(s.dnHow.replace('{c}', tx(ctry(me))))}</div><div class="sayline" lang="${cl()}">«${esc(orderPhrase(i))}»</div>
      <div class="row">${A.canSay() ? `<button class="btn ghost" data-say="dn">▶ ${esc(s.listen)}</button>` : ''}<span class="note">${esc(s.waiter)}: <i lang="${cl()}">${esc(DONENESS.ask[lp()])}</i></span></div>`;
    $('#dnEach').innerHTML = COUNTRIES.map((c) => { const x = dname(i, c.id); return `<div class="r${c.id === me ? ' me' : ''}"><span class="cd">${c.id.toUpperCase()}</span><span class="ct">${esc(tx(c))}</span><span class="nm" lang="${c.lang}"><b>${esc(x[0])}</b>${x[1] || x[2] ? `<span>${esc([x[2], x[1]].filter(Boolean).join(' · '))}</span>` : ''}</span></div>`; }).join('');
    const cell = (k, c) => { const x = dname(k, c); return `<td lang="${cl(c)}"><b>${esc(x[0])}</b>${x[2] ? `<small>${esc(x[2])}</small>` : ''}</td>`; };
    $('#dnTable').innerHTML = LV.map((l, k) => `<tr data-lvl="${k}" class="${k === i ? 'me' : ''}"><td class="num">${l.t[0]}–${l.t[1]}</td>${cell(k, st.trFrom)}${cell(k, me)}</tr>`).join('');
    const cut = BY[st.sel], rec = cut && doneRec(cut);
    $('#dnCut').innerHTML = rec && rec.html ? `<h4>${esc(s.dnFor)} ${esc(lower(cname(cut)))}</h4><p class="whybox">${rec.html}</p>${rec.lvl != null ? `<div class="row" style="margin-top:8px"><button class="btn ghost" data-lvl="${rec.lvl}">${esc(s.dnSet)}</button></div>` : ''}` : '';
    const sh = A.shop(); if (sh && on('done')) { sh.setDoneness(t, st.sp); sh.setChalk(s.tools.done[0], [n[0], `${t} °C · ${F(t)} °F`]); }
  }

  // ------------------------------------------------------------ substitutes
  function subsOf(id) {
    const a = BY[id], co = {};
    DISHES.forEach((d) => { if (d.b === id) d.a.forEach((x) => { co[x] = (co[x] || 0) + 1; }); else if (d.a.includes(id)) co[d.b] = (co[d.b] || 0) + 1; });
    return CUTS.filter((c) => c.id !== id && c.sp === a.sp).map((c) => {
      const shared = topMethods(a).filter((m) => a.m[m] >= 2 && c.m[m] >= 2);
      const sim = 6 - (Math.abs(a.t - c.t) + Math.abs(a.f - c.f) + Math.abs(a.c - c.c));
      return { c, shared, s: Math.min(8, co[c.id] || 0) * 1.2 + sim * 1.3 + shared.length * 1.5 };
    }).filter((x) => x.shared.length).sort((x, y) => y.s - x.s || x.c.n - y.c.n).slice(0, 3);
  }
  function subsHtml(cut) {
    const s = S(), list = subsOf(cut.id); if (!list.length) return '';
    return `<div><h4>${esc(s.subs)}</h4><ul class="alts">${list.map((x, i) => `<li><button data-cut="${x.c.id}"><span class="rk">${i + 1}</span><span class="nm" lang="${cl()}">${esc(cname(x.c))}${x.c.price !== cut.price ? ` <span>· ${esc(x.c.price < cut.price ? s.cheaper : s.pricier)}</span>` : ''}</span><span class="wy">${esc(s.subWhy)} ${esc(x.shared.slice(0, 3).map((m) => lower(tx(METHODS[m].n))).join(', '))}.</span></button></li>`).join('')}</ul></div>`;
  }

  // ------------------------------------------------------------ pieces the cut card and the dish answer borrow
  function cutActions(cut) {
    const s = S(), f = fav.c.has(cut.id);
    return `<div class="row acts"><button class="btn ghost" data-fav="c:${cut.id}" aria-pressed="${f}">${f ? '★' : '☆'} ${esc(s.fav)}</button><button class="btn ghost" data-add="${cut.id}">+ ${esc(s.addL)}</button><button class="btn ghost" data-tool="shop">${esc(s.tools.shop[0])}</button><button class="btn ghost" data-share="c">${esc(s.share)}</button></div>`;
  }
  function cutSections(cut) {
    const s = S(), sh = A.shop(), rec = doneRec(cut), g = sh ? sh.grainOf(cut.id) : null;
    let h = '';
    if (rec.html) h += `<div><h4>${esc(s.doneRec)}</h4><p>${rec.html}</p>${rec.lvl != null ? `<div class="row" style="margin-top:8px"><button class="btn ghost" data-tool="done" data-at="${rec.lvl}">${esc(s.seeDone)}</button></div>` : ''}</div>`;
    if (g) h += `<div><h4>${esc(tx(GLOSSARY.find((x) => x.id === 'against').t))}</h4><div class="row"><button class="btn ghost" data-grain="1" aria-pressed="${st.grain}">${esc(st.grain ? s.grainOff : s.grain)}</button></div>${st.grain ? `<p class="note" style="margin-top:8px">${esc(g === 'v' ? s.grainV : s.grainH)}</p>` : ''}</div>`;
    return h + subsHtml(cut);
  }
  function dishActions(d) {
    const s = S(), f = fav.d.has(d.n);
    return `<button class="btn ghost" data-fav="d:${d.i}" aria-pressed="${f}">${f ? '★' : '☆'} ${esc(s.fav)}</button><button class="btn ghost" data-add="${d.b}" data-note="${esc(d.n)}">+ ${esc(s.addL)}</button><button class="btn ghost" data-tool="calc" data-m="${d.m}">${esc(s.tools.calc[0])}</button><button class="btn ghost" data-share="d:${d.i}">${esc(s.share)}</button>`;
  }

  // ------------------------------------------------------------ at the counter
  function qtyText(g, c) {
    if (c === 'us') { const v = Math.max(0.25, Math.round(g / 453.6 * 4) / 4); return v.toLocaleString('en-US') + ' lb'; }
    return g >= 1000 ? (g / 1000).toLocaleString(cl(c), { maximumFractionDigits: 2 }) + ' kg' : g + ' g';
  }
  function shopLines(cut, c, m, g, k) {
    const name = lower(cname(cut, c));
    let want = (g ? PHRASES.want[k] : PHRASES.want0[k]).replace('{q}', g ? qtyText(g, c) : '').replace('{cut}', name);
    if (k === 'fr') want = want.replace(/ de (?=[aeiouhéèêâîôœ])/i, ' d’');
    const out = [PHRASES.hello[k], want];
    if (m && PHRASES.method[m]) out.push(PHRASES.for[k].replace('{m}', PHRASES.method[m][k]), PHRASES.req[m][k]);
    return out;
  }
  function rShop() {
    const s = S(), cut = BY[st.sel], c = st.country, k = lp(c);
    const ms = topMethods(cut); const m = st.shopM && cut.m[st.shopM] ? st.shopM : (st.cutMethod && cut.m[st.cutMethod] ? st.cutMethod : null);
    const lines = shopLines(cut, c, m, st.shopQty, k), mine = shopLines(cut, c, m, st.shopQty, st.lang);
    const home = st.trFrom !== c && norm(cname(cut, st.trFrom)) !== norm(cname(cut)) ? cname(cut, st.trFrom) : '';
    const sub = subsOf(cut.id).slice(0, 2);
    $('#toolbody').innerHTML = `<div class="filters">
        <label class="field"><span>${esc(s.shCut)}</span><select id="shCut">${cutOpts(cut.id)}</select></label>
        <label class="field"><span>${esc(s.shIn)}</span><select id="shIn">${ctryOpts(c)}</select></label>
        <label class="field"><span>${esc(s.shFor)}</span><select id="shM"><option value="">${esc(s.shAny)}</option>${ms.map((x) => `<option value="${x}"${x === m ? ' selected' : ''}>${esc(tx(METHODS[x].n))}</option>`).join('')}</select></label>
        <label class="field"><span>${esc(s.shQty)}</span><input id="shQty" type="number" inputmode="numeric" min="0" step="50" value="${st.shopQty || ''}" placeholder="—"></label>
        <label class="field" style="grid-column:1 / -1"><span>${esc(s.shHome)}</span><select id="shHome">${ctryOpts(st.trFrom)}</select></label></div>
      <article class="shopcard">
        <div class="lbl">${esc(tx(ctry(c)))} · ${String(cut.n).padStart(2, '0')}</div>
        <div class="huge" lang="${cl(c)}">${esc(cname(cut))}</div>
        ${calt(cut) ? `<div class="also" lang="${cl(c)}">${esc(calt(cut))}</div>` : ''}
        <div class="say"><div class="lbl">${esc(s.shSay)}</div>${lines.map((l) => `<div class="sayline" lang="${cl(c)}">${esc(l)}</div>`).join('')}
          ${A.canSay() ? `<div class="row"><button class="btn ghost" data-say="shop">▶ ${esc(s.listen)}</button></div>` : ''}</div>
        ${k !== st.lang ? `<div><h4>${esc(s.shMeans)}</h4><p class="note">${esc(mine.join(' '))}</p></div>` : ''}
        ${home ? `<p>${esc(s.shHomeName.replace('{c}', tx(ctry(st.trFrom))))} <b lang="${cl(st.trFrom)}">${esc(home)}</b>.</p>` : ''}
        ${sub.length ? `<p>${esc(s.shNo)}: ${sub.map((x) => `<b lang="${cl(c)}">${esc(lower(cname(x.c)))}</b>`).join(', ')}.</p>` : ''}
        <p class="note">${esc(tx(cut.tip))}</p>
      </article>
      <p class="note">${esc(s.shPoint)}</p>`;
  }

  // ------------------------------------------------------------ portions and times
  function portion(cut, m, app) {
    if (PORTION.fixed[cut.id]) return PORTION.fixed[cut.id] * [0.75, 1, 1.3][app];
    return PORTION.appetite[app] / ((PORTION.yield[m] || 0.7) * (1 - (PORTION.bone[cut.id] || 0)));
  }
  function calcNow() {
    const cut = BY[st.sel], k = st.calc, ms = topMethods(cut);
    const m = k.m && cut.m[k.m] ? k.m : (st.cutMethod && cut.m[st.cutMethod] ? st.cutMethod : ms[0]);
    const pp = Math.round(portion(cut, m, k.app) / 10) * 10, total = Math.ceil(pp * k.n / 50) * 50;
    const r = (DONE_REC[cut.id] || {}).r, lvl = k.lvl != null ? k.lvl : r ? r[0] : 2;
    return { cut, m, ms, pp, total, r, lvl };
  }
  function rCalc() {
    const s = S(), k = st.calc, c = calcNow(), cut = c.cut;
    const fast = c.r && (c.m === 'grill' || c.m === 'sear'), roast = c.r && c.m === 'roast';
    const target = mid(c.lvl);
    let time = '';
    if (fast) {
      const side = Math.max(0.5, Math.round(PORTION.side[c.lvl] * Math.pow(k.th / 2.5, 1.3) * 2) / 2);
      time = `<p><b>${esc(s.perSide.replace('{a}', nf(side)))}</b>. ${esc(s.pull.replace('{t}', target - 3).replace('{u}', target))} ${esc(s.restMin.replace('{m}', Math.max(5, Math.round(k.th * 2))))}</p>${k.th >= 4 ? `<p class="note">${esc(s.thickTip.replace('{t}', target - 9))}</p>` : ''}`;
    } else if (roast) {
      time = `<p><b>${esc(s.roastT.replace('{m}', Math.round(PORTION.roast[c.lvl] * c.total / 500 / 5) * 5))}</b> ${esc(s.pull.replace('{t}', target - 5).replace('{u}', target))} ${esc(s.restMin.replace('{m}', 15))}</p>`;
    } else time = `<p>${c.r ? '' : esc(s.slowT) + ' '}${esc(tx(cut.cook))}</p>`;
    const lvSel = `<label class="field"><span>${esc(s.doneness)}</span><select id="cLvl">${LV.map((l, i) => `<option value="${i}"${i === c.lvl ? ' selected' : ''}>${esc(dname(i)[0])} · ${mid(i)} °C</option>`).join('')}</select></label>`;
    $('#toolbody').innerHTML = `<div class="filters">
        <label class="field"><span>${esc(s.shCut)}</span><select id="cCut">${cutOpts(cut.id)}</select></label>
        <label class="field"><span>${esc(s.method)}</span><select id="cM">${c.ms.map((x) => `<option value="${x}"${x === c.m ? ' selected' : ''}>${esc(tx(METHODS[x].n))}</option>`).join('')}</select></label>
        <div class="field"><span>${esc(s.people)}</span><div class="stepper"><button data-step="-1" aria-label="−">−</button><b id="cN">${k.n}</b><button data-step="1" aria-label="+">+</button></div></div>
        <div class="field"><span>${esc(s.appL)}</span><div class="seg">${s.appetite.map((a, i) => `<button data-app="${i}" aria-pressed="${i === k.app}">${esc(a)}</button>`).join('')}</div></div></div>
      <article class="ans"><div class="tagline"><span>${esc(s.buy)}</span></div>
        <h2><em>${esc(wt(c.total))}</em> ${esc(s.of)} ${esc(lower(cname(cut)))}</h2>
        <p>${esc(wt(c.pp))} ${esc(s.perPerson)}. ${PORTION.bone[cut.id] || PORTION.fixed[cut.id] ? esc(s.bone) + ' ' : ''}${PORTION.fixed[cut.id] ? '' : esc(s.yieldNote.replace('{p}', Math.round((1 - (PORTION.yield[c.m] || 0.7)) * 100)))}</p>
        <div class="row"><button class="btn ghost" data-add="${cut.id}" data-g="${c.total}">+ ${esc(s.addList)}</button><button class="btn ghost" data-tool="shop" data-g="${c.total}" data-m="${c.m}">${esc(s.toShop)}</button></div></article>
      <div><h4>${esc(s.time)}</h4>${fast ? `<div class="filters" style="margin-bottom:10px"><label class="field"><span>${esc(s.thick)}</span><select id="cTh">${[1.5, 2, 2.5, 3, 4, 5].map((x) => `<option value="${x}"${x === k.th ? ' selected' : ''}>${nf(x)} cm${st.lang === 'en' ? ` (${nf(x / 2.54, 1)} in)` : ''}</option>`).join('')}</select></label>${lvSel}</div>` : roast ? `<div class="filters" style="margin-bottom:10px">${lvSel}</div>` : ''}
        ${time}<p class="note">${esc(tx(METHODS[c.m].ask))} ${esc(s.approx)}</p></div>`;
  }

  // ------------------------------------------------------------ comparison
  function rCmp() {
    const s = S();
    if (!st.cmp || !BY[st.cmp[0]] || !BY[st.cmp[1]]) { const o = subsOf(st.sel)[0]; st.cmp = [st.sel, o ? o.c.id : A.cuts().find((c) => c.id !== st.sel).id]; }
    const a = BY[st.cmp[0]], b = BY[st.cmp[1]];
    const bar = (v) => `<span class="b" role="img" aria-label="${v} / 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= v ? 'on' : ''}"></i>`).join('')}</span>`;
    const best = (c) => topMethods(c).filter((m) => c.m[m] === 3).slice(0, 4).map((m) => esc(tx(METHODS[m].n))).join(' · ') || '—';
    const rec = (c) => doneRec(c).html || '—';
    const row = (lbl, x, y) => `<div class="cl">${esc(lbl)}</div><div>${x}</div><div>${y}</div>`;
    $('#toolbody').innerHTML = `<div class="filters"><label class="field"><span>${esc(s.cmpA)}</span><select id="cmpA">${cutOpts(a.id)}</select></label><label class="field"><span>${esc(s.cmpB)}</span><select id="cmpB">${cutOpts(b.id)}</select></label></div>
      <div class="cmp">
        ${row('', `<b class="ch" lang="${cl()}"><i>1</i>${esc(cname(a))}</b>`, `<b class="ch" lang="${cl()}"><i>2</i>${esc(cname(b))}</b>`)}
        ${row(s.zone, esc(tx(ZONES[a.zone])), esc(tx(ZONES[b.zone])))}
        ${row(s.price, esc(tx(PRICE[a.price])), esc(tx(PRICE[b.price])))}
        ${['t', 'f', 'c', 'v'].map((p) => row(tx(PROPS[p]), bar(a[p]), bar(b[p]))).join('')}
        ${row(s.best, best(a), best(b))}
        ${row(s.cooking, esc(tx(a.cook)), esc(tx(b.cook)))}
        ${row(s.doneRec, rec(a), rec(b))}
        ${row(s.recipes, String(A.dishesOf(a.id).length), String(A.dishesOf(b.id).length))}
        ${row('', `<button class="btn ghost" data-cut="${a.id}">${esc(s.open)}</button>`, `<button class="btn ghost" data-cut="${b.id}">${esc(s.open)}</button>`)}
      </div>
      <p>${esc(tx(a.d))}</p><p>${esc(tx(b.d))}</p>`;
  }

  // ------------------------------------------------------------ glossary
  const gkey = (g) => norm(g.t.join(' ') + ' ' + g.aka.join(' '));
  function rGloss() {
    $('#toolbody').innerHTML = `<div class="filters"><input id="glq" type="search" placeholder="${esc(S().glSearch)}" value="${esc(st.glossQ)}" autocomplete="off"></div><div id="gllist"></div>`;
    uGloss();
  }
  function uGloss(openId) {
    const s = S(), q = norm(st.glossQ), box = $('#gllist'); if (!box) return;
    const hit = GLOSSARY.filter((g) => !q || gkey(g).includes(q) || norm(tx(g.d)).includes(q));
    box.innerHTML = hit.length ? Object.keys(GLOSS_GROUPS).map((grp) => {
      const items = hit.filter((g) => g.g === grp); if (!items.length) return '';
      return `<h4 style="margin-top:14px">${esc(tx(GLOSS_GROUPS[grp]))}</h4><div class="acc">${items.map((g) => `<details id="gl-${g.id}"${g.id === openId || (q && hit.length <= 3) ? ' open' : ''}><summary>${esc(tx(g.t))}${tx(g.aka) ? `<small>${esc(tx(g.aka))}</small>` : ''}</summary><p>${esc(tx(g.d))}</p>${g.cut ? `<div class="row"><button class="btn ghost" data-cut="${g.cut}">${esc(s.seeCut)}: ${esc(lower(cname(BY[g.cut])))}</button></div>` : ''}</details>`).join('')}</div>`;
    }).join('') : `<p class="note">${esc(s.glNone)}</p>`;
    if (openId) { const el = $('#gl-' + openId); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }
  }

  // ------------------------------------------------------------ quiz
  const ROUND = 8;
  function findable() {
    const sh = A.shop(); if (!sh) return [];
    const primary = {}; CUTS.forEach((c) => c.pieces[0] !== '*' && (sh.pieceOfCut[c.id] || []).forEach((n) => { if (!(n in primary)) primary[n] = c.id; }));
    return A.cuts().filter((c) => { const ps = sh.pieceOfCut[c.id] || []; return ps.length && ps.every((n) => !sh.pieces[n].meta.internal && primary[n] === c.id); });
  }
  function newQ() {
    const CUTS = A.cuts();
    const s = S(), kinds = ['name', 'name', 'method', 'done'], fd = findable(); if (fd.length > 4) kinds.push('find', 'find');
    const kind = pick(kinds);
    if (kind === 'find') { const c = pick(fd); return { kind, id: c.id, text: s.qzFind.replace('{x}', lower(cname(c))) }; }
    if (kind === 'name') {
      for (let n = 0; n < 40; n++) {
        const c = pick(CUTS), x = pick(COUNTRIES.filter((k) => k.id !== st.country));
        if (norm(c.names[x.id][0]) === norm(cname(c))) continue;
        const others = shuffle(CUTS.filter((o) => o.id !== c.id && norm(o.names[x.id][0]) !== norm(c.names[x.id][0]))).slice(0, 3);
        const opts = shuffle([c].concat(others));
        return { kind, id: c.id, x: x.id, text: s.qzName.replace('{c}', tx(x)).replace('{x}', lower(cname(c))), opts: opts.map((o) => ({ t: o.names[x.id][0], lang: x.lang, ok: o.id === c.id })), why: `${cname(c)} = ${c.names[x.id][0]} (${tx(x)})` };
      }
    }
    if (kind === 'method') {
      const ms = Object.keys(METHODS).filter((m) => CUTS.some((c) => c.m[m] === 3) && CUTS.filter((c) => !c.m[m]).length >= 3);
      const m = pick(ms), c = pick(CUTS.filter((x) => x.m[m] === 3)), others = shuffle(CUTS.filter((x) => !x.m[m])).slice(0, 3);
      return { kind, id: c.id, text: s.qzMethod.replace('{m}', tx(METHODS[m].v)), opts: shuffle([c].concat(others)).map((o) => ({ t: cname(o), lang: cl(), ok: o.id === c.id })), why: A.whyOf(c, m) };
    }
    for (let n = 0; n < 40; n++) {
      const x = pick(COUNTRIES), i = rnd(LV.length), nm = DONENESS.names[x.id];
      if (nm.filter((e) => e[0] === nm[i][0]).length > 1) continue;
      const first = (k) => tx(LV[k].d).split('. ')[0].replace(/\.$/, '');
      const idx = shuffle([0, 1, 2, 3, 4, 5].filter((k) => k !== i)).slice(0, 3).concat(i).sort((a, b) => a - b);
      return { kind: 'done', lvl: i, text: s.qzDone.replace('{c}', tx(x)).replace('{x}', nm[i][0]), opts: idx.map((k) => ({ t: first(k), ok: k === i })), why: `${nm[i][0]} (${tx(x)}): ${LV[i].t[0]}–${LV[i].t[1]} °C` };
    }
    return newQ();
  }
  function startQuiz() { st.quiz = { i: 0, score: 0, q: null, ans: null }; nextQ(); }
  function nextQ() {
    const z = st.quiz; z.ans = null; z.i++;
    z.q = z.i > ROUND ? null : newQ();
    if (z.q && z.q.kind === 'find') A.setView('cow');
    rQuiz(); A.sync3D();
  }
  function answer(ok, k) {
    const z = st.quiz; if (!z || !z.q || z.ans) return;
    z.ans = { ok, k }; if (ok) z.score++;
    rQuiz(); A.sync3D();
  }
  function rQuiz() {
    const s = S(), z = st.quiz, box = $('#toolbody'); if (!box || !z) return;
    if (!z.q) { box.innerHTML = `<article class="ans"><h2>${esc(s.qzEnd.replace('{a}', z.score).replace('{b}', ROUND))}</h2><div class="row"><button class="btn" data-qz="again">${esc(s.again)}</button></div></article>`; return; }
    const q = z.q, a = z.ans;
    box.innerHTML = `<div class="tagline note">${esc(s.qzOf.replace('{a}', z.i).replace('{b}', ROUND))} · ${esc(s.score)}: ${z.score}</div>
      <article class="ans"><h2>${esc(q.text)}</h2>
        ${q.kind === 'find' ? (a ? '' : `<p class="note">${esc(s.qzTap)}</p>`) : `<ul class="alts quiz">${q.opts.map((o, k) => `<li><button data-qz="${k}"${a ? ' disabled' : ''} class="${a ? (o.ok ? 'ok' : a.k === k ? 'no' : '') : ''}"><span class="rk">${'ABCD'[k]}</span><span class="nm"${o.lang ? ` lang="${o.lang}"` : ''}>${esc(o.t)}</span></button></li>`).join('')}</ul>`}
        ${a ? `<p class="whybox"><b>${esc(a.ok ? s.right : s.wrong)}</b> ${q.kind === 'find' ? (a.ok ? '' : `${esc(s.itWas)} ${esc(lower(tx(ZONES[BY[q.id].zone])))}: `) + esc(tx(BY[q.id].d)) : esc(q.why)}</p><div class="row"><button class="btn" data-qz="next">${esc(s.next)}</button>${q.id ? `<button class="btn ghost" data-cut="${q.id}">${esc(s.open)}</button>` : ''}</div>` : ''}
      </article>`;
  }

  // ------------------------------------------------------------ favourites and shopping list
  function listText() {
    return list.map((x) => `${x.done ? '✓' : '•'} ${cname(BY[x.id])}${x.g ? ' — ' + wt(x.g) : ''}${x.note ? ' (' + x.note + ')' : ''}`).join('\n');
  }
  function rList() {
    const s = S(), fc = [...fav.c].map((id) => BY[id]), fd = DISHES.filter((d) => fav.d.has(d.n));
    $('#toolbody').innerHTML = `<div><h4>${esc(s.shopList)}</h4>
        ${list.length ? `<ul class="shoplist">${list.map((x, i) => `<li class="${x.done ? 'done' : ''}"><label><input type="checkbox" data-chk="${i}"${x.done ? ' checked' : ''}><span><b lang="${cl()}">${esc(cname(BY[x.id]))}</b>${x.g ? ` · ${esc(wt(x.g))}` : ''}${x.note ? `<small>${esc(x.note)}</small>` : ''}</span></label><button class="mini" data-cut="${x.id}" aria-label="${esc(s.open)}">›</button><button class="mini" data-tool="shop" data-sel="${x.id}" data-g="${x.g || 0}" aria-label="${esc(s.toShop)}">☞</button><button class="mini" data-rm="${i}" aria-label="${esc(s.remove)}">✕</button></li>`).join('')}</ul>
          <div class="row" style="margin-top:10px"><button class="btn ghost" data-act="copy">${esc(s.copy)}</button><button class="btn ghost" data-act="clear">${esc(s.clear)}</button></div><p class="note" style="margin-top:8px">${esc(s.listHint.replace('{c}', tx(ctry(st.country))))}</p>`
        : `<p class="note">${esc(s.noList)}</p>`}</div>
      <div><h4>${esc(s.favs)}</h4>
        ${fc.length || fd.length ? `${fc.length ? `<div class="chips">${fc.map((c) => `<button class="chip" data-cut="${c.id}" lang="${cl()}">★ ${esc(cname(c))}</button>`).join('')}</div>` : ''}${fd.length ? `<ul class="dishlist" style="margin-top:8px">${fd.map(A.dishRow).join('')}</ul>` : ''}` : `<p class="note">${esc(s.noFav)}</p>`}</div>`;
  }

  // ------------------------------------------------------------ the tab itself
  const RENDER = { done: rDone, shop: rShop, calc: rCalc, cmp: rCmp, gloss: rGloss, quiz: rQuiz, list: rList };
  function render() {
    const s = S(), box = $('#moresec'); if (!box) return;
    if (!st.tool || !RENDER[st.tool]) {
      st.tool = null;
      box.innerHTML = `<div class="lbl">${esc(s.menu)}</div><div class="toolgrid">${ORDER.map((k) => `<button class="tool" data-tool="${k}"><span class="ic" aria-hidden="true">${ICON[k]}</span><span class="tt">${esc(s.tools[k][0])}${k === 'list' && list.filter((x) => !x.done).length ? ` <i class="badge">${list.filter((x) => !x.done).length}</i>` : ''}</span><span class="ss">${esc(s.tools[k][1])}</span></button>`).join('')}</div>`;
      return;
    }
    box.innerHTML = `<div class="toolhead"><button class="btn ghost" data-back="1">‹ ${esc(s.back)}</button><h2>${esc(s.tools[st.tool][0])}</h2></div><div id="toolbody" class="toolbody"></div>`;
    if (st.tool === 'quiz' && !st.quiz) startQuiz(); else RENDER[st.tool]();
  }
  function open(tool, d) {
    d = d || {};
    if (d.sel && BY[d.sel]) A.selectCut(d.sel, { tab: false, keepAnswer: true });
    st.tool = tool;
    if (tool === 'done' && d.at != null) st.temp = mid(+d.at);
    if (tool === 'shop') { st.shopQty = d.g != null ? +d.g : st.shopQty; if (d.m) st.shopM = d.m; }
    if (tool === 'calc' && d.m) st.calc.m = d.m;
    if (tool === 'quiz') st.quiz = null;
    A.setTab(4); $('#pbody').scrollTop = 0;
    A.setView(tool === 'done' ? 'block' : tool === 'shop' || tool === 'cmp' || tool === 'quiz' ? 'cow' : st.view);
    A.sync3D();
  }
  function sayNow(what) {
    if (what === 'dn') return A.say(orderPhrase(levelOf(st.temp)), cl());
    if (what === 'shop') { const cut = BY[st.sel], m = st.shopM && cut.m[st.shopM] ? st.shopM : (st.cutMethod && cut.m[st.cutMethod] ? st.cutMethod : null); return A.say(shopLines(cut, st.country, m, st.shopQty, lp()).join(' '), cl()); }
  }
  function click(b, d) {
    if (d.tool) { open(d.tool, d); return true; }
    if (d.back) { st.tool = null; render(); A.sync3D(); $('#pbody').scrollTop = 0; return true; }
    if (d.lvl != null) { st.temp = mid(+d.lvl); const r = $('#temp'); if (r) r.value = st.temp; uDone(); return true; }
    if (d.say) { sayNow(d.say); return true; }
    if (d.fav) { const [k, v] = d.fav.split(':'); const key = k === 'c' ? v : DISHES[+v].n, set = fav[k]; if (set.has(key)) set.delete(key); else set.add(key); save(); A.refresh(); return true; }
    if (d.add) { addList(d.add, +d.g || 0, d.note || ''); if (on('list')) rList(); return true; }
    if (d.share) { A.share(d.share); return true; }
    if (d.grain) { st.grain = !st.grain; if (st.grain) A.setView('block'); A.sync3D(); A.refresh(); return true; }
    if (d.qz != null) { if (d.qz === 'again') startQuiz(); else if (d.qz === 'next') nextQ(); else { const o = st.quiz && st.quiz.q && st.quiz.q.opts && st.quiz.q.opts[+d.qz]; if (o) answer(!!o.ok, +d.qz); } return true; }
    if (d.step) { st.calc.n = Math.min(40, Math.max(1, st.calc.n + (+d.step))); rCalc(); return true; }
    if (d.app != null) { st.calc.app = +d.app; rCalc(); return true; }
    if (d.rm != null) { list.splice(+d.rm, 1); save(); rList(); return true; }
    if (d.act === 'clear') { list = []; save(); rList(); return true; }
    if (d.act === 'copy') { A.copy(listText(), S().copied); return true; }
    return false;
  }
  function input(t) {
    if (t.id === 'temp') { st.temp = +t.value; uDone(); return true; }
    if (t.id === 'glq') { st.glossQ = t.value; uGloss(); return true; }
    return false;
  }
  function change(t) {
    const v = t.value;
    if (t.dataset && t.dataset.chk != null) { const x = list[+t.dataset.chk]; if (x) { x.done = t.checked; save(); rList(); } return true; }
    if (t.id === 'dnA' || t.id === 'shHome') { st.trFrom = v; render(); return true; }
    if (t.id === 'dnB' || t.id === 'shIn') { A.setCountry(v); return true; }
    if (t.id === 'shCut' || t.id === 'cCut') { st.calc.m = null; st.calc.lvl = null; st.shopM = null; A.selectCut(v, { tab: false, keepAnswer: true, view: st.view }); render(); return true; }
    if (t.id === 'shM') { st.shopM = v || null; if (!v) st.cutMethod = null; rShop(); return true; }
    if (t.id === 'shQty') { st.shopQty = Math.max(0, Math.round(+v || 0)); rShop(); return true; }
    if (t.id === 'cM') { st.calc.m = v; rCalc(); return true; }
    if (t.id === 'cTh') { st.calc.th = +v; rCalc(); return true; }
    if (t.id === 'cLvl') { st.calc.lvl = +v; rCalc(); return true; }
    if (t.id === 'cmpA' || t.id === 'cmpB') { st.cmp[t.id === 'cmpA' ? 0 : 1] = v; rCmp(); A.sync3D(); return true; }
    return false;
  }
  // a tap on the cow while a "find it" question is open
  function pickCow(h) {
    const z = st.quiz; if (!on('quiz') || !z || !z.q || z.q.kind !== 'find') return false;
    if (z.ans || !h || h.where !== 'cow') return true;
    const sh = A.shop(); answer((sh.pieceOfCut[z.q.id] || []).includes(h.piece), -1);
    return true;
  }
  // what the 3D scene should show while a tool is open (null: the usual selection)
  function scene() {
    const s = S();
    if (on('done')) return { sel: st.sel, recs: [], tags: false, done: st.temp, chalk: [s.tools.done[0], [dname(levelOf(st.temp))[0], `${st.temp} °C · ${F(st.temp)} °F`]] };
    if (on('cmp') && st.cmp) return { sel: null, recs: st.cmp, tags: true, chalk: [s.tools.cmp[0], st.cmp.map((id) => cname(BY[id]))] };
    if (on('quiz') && st.quiz) { const z = st.quiz, show = z.q && z.ans && z.q.id ? z.q.id : null; return { sel: show, recs: [], tags: !!show, quiet: !show && !!z.q && z.q.kind === 'find', chalk: ['Quiz', [`${z.score} / ${ROUND}`]] }; }
    if (on('shop') || on('calc')) return { sel: st.sel, recs: [], tags: true, chalk: [tx(ZONES[BY[st.sel].zone]), [cname(BY[st.sel])]] };
    return null;
  }
  // entries for the search box
  function index(push) {
    const s = S();
    GLOSSARY.forEach((g) => push({ ty: 'term', id: 'g:' + g.id, t: tx(g.t), s: s.word + ' · ' + tx(GLOSS_GROUPS[g.g]), k: gkey(g), w: 1, lbl: s.word }));
    const seen = {};
    COUNTRIES.forEach((c) => DONENESS.names[c.id].forEach((n, i) => { const key = norm(n[0]) + ':' + i; (seen[key] = seen[key] || { n: n[0], i, cs: [] }).cs.push(c.id); }));
    Object.values(seen).forEach((e) => push({ ty: 'term', id: 'd:' + e.i + ':' + norm(e.n), t: e.n, s: `${tx(LV[e.i].n)} · ${LV[e.i].t[0]}–${LV[e.i].t[1]} °C · ${e.cs.map((x) => x.toUpperCase()).join(' ')}`, k: norm(e.n), w: e.cs.includes(st.country) ? 3 : 1, lbl: s.term }));
  }
  function go(id) {
    const [k, v] = id.split(':');
    if (k === 'd') return open('done', { at: +v });
    st.glossQ = ''; open('gloss'); uGloss(v);
  }
  return { render, open, click, input, change, pickCow, scene, index, go, cutActions, cutSections, dishActions, on, t: (k) => S()[k], label: (k) => S().tools[k][0], more: () => ({ es: 'Más', en: 'More', pt: 'Mais' })[st.lang] };
}
