// ---- Interface: language, country, search, the butcher's answers, cut card, recipes, translator.
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9぀-ヿ㐀-鿿가-힯 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const BY = Object.fromEntries(CUTS.map((c) => [c.id, c]));
  // Portuguese rides as a third entry on every [español, English] pair
  (function applyPT() {
    COUNTRIES.forEach((c) => { c.pt = PT.countries[c.id]; });
    for (const m in METHODS) { const o = PT.methods[m]; if (o) ['n', 'v', 'need', 'ask'].forEach((f) => { METHODS[m][f][2] = o[f]; }); }
    for (const k in PROPS) PROPS[k][2] = PT.props[k];
    PRICE.forEach((x, i) => { x[2] = PT.price[i]; });
    for (const z in ZONES) ZONES[z][2] = PT.zones[z];
    CUTS.forEach((c) => { const o = PT.cuts[c.id]; if (!o) return; ['d', 'tip', 'cook'].forEach((f) => { c[f][2] = o[f]; }); for (const m in (o.why || {})) if (c.why && c.why[m]) c.why[m][2] = o.why[m]; });
  })();

  // ------------------------------------------------------------ strings
  const STR = {
    es: { eyebrow: 'Carnicería', butcher: 'Don Rafa', role: 'Carnicero · pregúntale lo que quieras', tabs: ['Carnicero', 'Corte', 'Recetas', 'Traductor', 'Más'],
      views: { shop: 'Tienda', cow: 'La res', case: 'Vitrina', block: 'El corte' }, explode: 'Separar cortes', hint: 'Arrastra para girar · toca un corte',
      askLabel: '¿Qué vas a cocinar?', askPh: 'ropa vieja, brisket, sancocho, picanha…', askBtn: 'Preguntar', orMethod: 'O dime cómo la vas a preparar', examples: 'Prueba con',
      settings: 'Ajustes', language: 'Idioma', where: '¿Dónde compras la carne?', voice: 'Voz del carnicero', on: 'Sí', off: 'No',
      dish: 'Receta', cut: 'Corte', method: 'Método', example: 'Ejemplo', for: 'Para', ask: 'pide', inC: 'en', recipeSays: 'La receta de {c} lo llama', alsoWork: 'También sirven', howAsk: 'Cómo pedirlo', cooking: 'Cocción',
      seeCut: 'Ver ficha del corte', seeCase: 'Verlo de cerca', bestFor: 'Los mejores cortes para', budget: ['Todos', 'Económicos', 'Finos'], why: 'Por qué',
      aka: 'También', props: 'Cómo es', inCountries: 'Cómo se llama en cada país', inRegions: 'En Colombia según la región', regionDefault: 'En casi todo el país se pide como', goodFor: 'Para qué sirve', notFor: 'toca un método para ver por qué',
      tip: 'Al comprar', muscle: 'Músculo', dishesWith: 'Recetas con este corte', more: 'Ver más', allDishes: 'recetas', search: 'Buscar receta…', anyCuisine: 'Todas las cocinas', anyMethod: 'Todos los métodos',
      from: 'La receta viene de', to: 'Yo compro en', trHelp: 'Elige de dónde viene la receta y dónde compras. Toca una fila para ver el corte.', noName: 'sin nombre propio',
      thinking: 'Don Rafa está pensando', claudeNote: 'Respuesta generada por Claude con el catálogo de la tienda.', notFound: 'No tengo esa receta anotada.', notFoundHelp: 'Prueba con el nombre del plato, del corte o del método (asar, guisar, desmechar…).', closest: 'Lo más parecido que tengo',
      askClaude: 'Preguntarle a Don Rafa', claudeFail: 'No pude consultar ahora. Intenta de nuevo en un momento.', claudeOff: 'Para preguntas libres hace falta permitir que la página use Claude.', stop: 'Detener',
      hello: 'Bienvenido. Dime qué vas a cocinar y te digo qué corte pedir, por qué, y cómo se llama aquí.', loading: 'Afilando los cuchillos…', loadFail: 'No se pudo cargar la tienda en 3D. El resto funciona igual.',
      zone: 'Zona', internal: 'Va por dentro: separa los cortes para verlo.', sources: 'Fuentes', approx: 'Las equivalencias son aproximadas: cada país despieza la res de forma distinta y los nombres cambian entre carnicerías. Si dudas, muestra el corte en la res.',
      count: (n) => `${n} recetas`, speak: 'Escuchar', pageOf: 'de' },
    en: { eyebrow: 'Butcher shop', butcher: 'Don Rafa', role: 'Butcher · ask him anything', tabs: ['Butcher', 'Cut', 'Recipes', 'Translator', 'More'],
      views: { shop: 'Shop', cow: 'The cow', case: 'Display case', block: 'The cut' }, explode: 'Separate cuts', hint: 'Drag to turn · tap a cut',
      askLabel: 'What are you cooking?', askPh: 'ropa vieja, brisket, pot roast, picanha…', askBtn: 'Ask', orMethod: 'Or tell me how you will cook it', examples: 'Try',
      settings: 'Settings', language: 'Language', where: 'Where do you buy your beef?', voice: "Butcher's voice", on: 'On', off: 'Off',
      dish: 'Recipe', cut: 'Cut', method: 'Method', example: 'Example', for: 'For', ask: 'ask for', inC: 'in', recipeSays: 'The recipe from {c} calls it', alsoWork: 'These also work', howAsk: 'How to ask for it', cooking: 'Cooking',
      seeCut: 'Open the cut card', seeCase: 'See it up close', bestFor: 'The best cuts to', budget: ['All', 'Budget', 'Premium'], why: 'Why',
      aka: 'Also', props: 'What it is like', inCountries: 'What it is called in each country', inRegions: 'In Colombia, by region', regionDefault: 'Across most of the country it is sold as', goodFor: 'What it is good for', notFor: 'tap a method to see why',
      tip: 'When buying', muscle: 'Muscle', dishesWith: 'Recipes with this cut', more: 'Show more', allDishes: 'recipes', search: 'Search recipes…', anyCuisine: 'All cuisines', anyMethod: 'All methods',
      from: 'The recipe is from', to: 'I shop in', trHelp: 'Pick where the recipe is from and where you shop. Tap a row to see the cut.', noName: 'no local name',
      thinking: 'Don Rafa is thinking', claudeNote: 'Answer written by Claude using the shop catalogue.', notFound: 'I do not have that recipe written down.', notFoundHelp: 'Try the name of the dish, the cut, or the method (grill, stew, shred…).', closest: 'The closest I have',
      askClaude: 'Ask Don Rafa', claudeFail: 'I could not ask right now. Try again in a moment.', claudeOff: 'Free-form questions need permission for this page to use Claude.', stop: 'Stop',
      hello: 'Welcome. Tell me what you are cooking and I will tell you which cut to ask for, why, and what it is called here.', loading: 'Sharpening the knives…', loadFail: 'The 3D shop could not load. Everything else still works.',
      zone: 'Zone', internal: 'It sits inside: separate the cuts to see it.', sources: 'Sources', approx: 'Equivalents are approximate: each country breaks the carcass down differently and names vary between butchers. When in doubt, point at the cut on the cow.',
      count: (n) => `${n} recipes`, speak: 'Listen', pageOf: 'of' },
    pt: { eyebrow: 'Açougue', butcher: 'Don Rafa', role: 'Açougueiro · pergunte o que quiser', tabs: ['Açougueiro', 'Corte', 'Receitas', 'Tradutor', 'Mais'],
      views: { shop: 'Loja', cow: 'O boi', case: 'Vitrine', block: 'O corte' }, explode: 'Separar cortes', hint: 'Arraste para girar · toque num corte',
      askLabel: 'O que você vai cozinhar?', askPh: 'ropa vieja, brisket, rabada, picanha…', askBtn: 'Perguntar', orMethod: 'Ou me diga como vai preparar', examples: 'Experimente',
      settings: 'Ajustes', language: 'Idioma', where: 'Onde você compra a carne?', voice: 'Voz do açougueiro', on: 'Sim', off: 'Não',
      dish: 'Receita', cut: 'Corte', method: 'Método', example: 'Exemplo', for: 'Para', ask: 'peça', inC: 'em', recipeSays: 'A receita ({c}) chama de', alsoWork: 'Também servem', howAsk: 'Como pedir', cooking: 'Cozimento',
      seeCut: 'Ver ficha do corte', seeCase: 'Ver de perto', bestFor: 'Os melhores cortes para', budget: ['Todos', 'Econômicos', 'Nobres'], why: 'Por quê',
      aka: 'Também', props: 'Como é', inCountries: 'Como se chama em cada país', inRegions: 'Na Colômbia, por região', regionDefault: 'Em quase todo o país pede-se como', goodFor: 'Para que serve', notFor: 'toque num método para ver por quê',
      tip: 'Ao comprar', muscle: 'Músculo', dishesWith: 'Receitas com este corte', more: 'Ver mais', allDishes: 'receitas', search: 'Buscar receita…', anyCuisine: 'Todas as cozinhas', anyMethod: 'Todos os métodos',
      from: 'A receita vem de', to: 'Eu compro em', trHelp: 'Escolha de onde vem a receita e onde você compra. Toque numa linha para ver o corte.', noName: 'sem nome próprio',
      thinking: 'Don Rafa está pensando', claudeNote: 'Resposta gerada pelo Claude com o catálogo da loja.', notFound: 'Não tenho essa receita anotada.', notFoundHelp: 'Tente o nome do prato, do corte ou do método (grelhar, ensopar, desfiar…).', closest: 'O mais parecido que tenho',
      askClaude: 'Perguntar ao Don Rafa', claudeFail: 'Não consegui consultar agora. Tente de novo daqui a pouco.', claudeOff: 'Para perguntas livres é preciso permitir que a página use o Claude.', stop: 'Parar',
      hello: 'Bem-vindo. Diga o que vai cozinhar e eu digo que corte pedir, por quê, e como se chama aqui.', loading: 'Afiando as facas…', loadFail: 'Não foi possível carregar a loja em 3D. O resto funciona igual.',
      zone: 'Região', internal: 'Fica por dentro: separe os cortes para ver.', sources: 'Fontes', approx: 'As equivalências são aproximadas: cada país divide o boi de um jeito e os nomes mudam entre açougues. Na dúvida, mostre o corte no boi.',
      count: (n) => `${n} receitas`, speak: 'Ouvir', pageOf: 'de' }
  };
  const LANGS = { es: 'Español', en: 'English', pt: 'Português' };

  const CUISINE = {};
  ('CO:Colombia|Colombia;MX:México|Mexico;AR:Argentina|Argentina;UY:Uruguay|Uruguay;CL:Chile|Chile;VE:Venezuela|Venezuela;PE:Perú|Peru;EC:Ecuador|Ecuador;BO:Bolivia|Bolivia;PY:Paraguay|Paraguay;BR:Brasil|Brazil;' +
    'CU:Cuba|Cuba;PR:Puerto Rico|Puerto Rico;DO:Rep. Dominicana|Dominican Rep.;JM:Jamaica|Jamaica;HT:Haití|Haiti;TT:Trinidad y Tobago|Trinidad & Tobago;PA:Panamá|Panama;CR:Costa Rica|Costa Rica;NI:Nicaragua|Nicaragua;GT:Guatemala|Guatemala;SV:El Salvador|El Salvador;HN:Honduras|Honduras;' +
    'US:Estados Unidos|United States;CA:Canadá|Canada;UK:Reino Unido|United Kingdom;IE:Irlanda|Ireland;FR:Francia|France;BE:Bélgica|Belgium;IT:Italia|Italy;ES:España|Spain;PT:Portugal|Portugal;DE:Alemania|Germany;AT:Austria|Austria;CH:Suiza|Switzerland;NL:Países Bajos|Netherlands;' +
    'HU:Hungría|Hungary;CZ:Chequia|Czechia;PL:Polonia|Poland;UA:Ucrania|Ukraine;RU:Rusia|Russia;AM:Armenia|Armenia;GE:Georgia|Georgia;RS:Serbia|Serbia;BA:Bosnia|Bosnia;BG:Bulgaria|Bulgaria;SE:Suecia|Sweden;DK:Dinamarca|Denmark;FI:Finlandia|Finland;NO:Noruega|Norway;' +
    'GR:Grecia|Greece;TR:Turquía|Türkiye;LB:Líbano|Lebanon;PS:Palestina|Palestine;JO:Jordania|Jordan;IL:Israel|Israel;IR:Irán|Iran;EG:Egipto|Egypt;SA:Arabia Saudita|Saudi Arabia;IQ:Irak|Iraq;MA:Marruecos|Morocco;ET:Etiopía|Ethiopia;NG:Nigeria|Nigeria;KE:Kenia|Kenya;ZA:Sudáfrica|South Africa;BW:Botsuana|Botswana;CV:Cabo Verde|Cape Verde;AO:Angola|Angola;MG:Madagascar|Madagascar;SN:Senegal|Senegal;' +
    'CN:China|China;HK:Hong Kong|Hong Kong;TW:Taiwán|Taiwan;JP:Japón|Japan;KR:Corea|Korea;VN:Vietnam|Vietnam;TH:Tailandia|Thailand;ID:Indonesia|Indonesia;MY:Malasia|Malaysia;PH:Filipinas|Philippines;KH:Camboya|Cambodia;LA:Laos|Laos;MM:Myanmar|Myanmar;' +
    'PK:Pakistán|Pakistan;IN:India|India;BD:Bangladés|Bangladesh;LK:Sri Lanka|Sri Lanka;NP:Nepal|Nepal;KZ:Kazajistán|Kazakhstan;UZ:Uzbekistán|Uzbekistan;MN:Mongolia|Mongolia;AU:Australia|Australia;NZ:Nueva Zelanda|New Zealand;FJ:Fiyi|Fiji;WS:Samoa|Samoa;INT:General|General')
    .split(';').forEach((s) => { const [k, v] = s.split(':'); CUISINE[k] = v.split('|'); });
  for (const k in PT.cuisine) if (CUISINE[k]) CUISINE[k][2] = PT.cuisine[k];
  const NAMESET = { CO: 'co', MX: 'mx', AR: 'ar', UY: 'ar', PY: 'ar', CL: 'cl', VE: 've', BR: 'br', ES: 'es', US: 'us', CA: 'us', UK: 'uk', IE: 'uk', AU: 'uk', NZ: 'uk', ZA: 'uk', FR: 'fr', BE: 'fr', IT: 'it' };

  const DISHES = $('#dishes').textContent.split('\n').map((l) => l.trim()).filter((l) => l && l[0] !== '#').map((l, i) => {
    const f = l.split('|'); return { i, n: f[0], cc: f[1], m: f[2], b: f[3], a: f[4] ? f[4].split(',') : [], g: [f[5], f[6]], k: norm(f[0] + ' ' + f[5] + ' ' + f[6]) };
  });
  // a dish may use a cut in a way its card does not list yet: record it as a workable use
  DISHES.forEach((d) => { if (BY[d.b] && !BY[d.b].m[d.m]) BY[d.b].m[d.m] = 1; });
  const SYN = { grill: 'asar asado parrilla brasa bbq barbecue carbon grill grilled barbacoa churrasco churrasqueira grelha grelhar brasa', sear: 'plancha sarten sellar bistec steak pan seared sear griddle frigideira chapa bife selar', roast: 'horno hornear roast rosbif asado al horno oven forno assar assado rosbife',
    braise: 'guisar guiso estofar estofado sudar sudado braise stew braised cazuela olla presion pressure cooker slow cooker ensopado ensopar cozido panela pressao guisado', shred: 'desmechar mechada deshebrar deshilachar shred shredded pulled ropa vieja desfiar desfiada', soup: 'sopa caldo sancocho cocido puchero soup broth stock consome sopa caldo cozido',
    smoke: 'ahumar ahumado smoke smoked low and slow fuego lento al palo defumar defumado fogo lento', stirfry: 'saltear salteado wok tiras stir fry strips fajitas saltear salteado tiras', fry: 'apanar apanado empanizar milanesa freir frito breaded fried schnitzel cutlet empanar milanesa fritar frito', raw: 'crudo tartar carpaccio raw tataki cru tartar carpaccio',
    grind: 'moler molida picada hamburguesa albondigas ground mince burger meatballs moer moida hamburguer almondegas', skewer: 'pinchos chuzos brochetas anticuchos skewer kebab kabob satay espetinho espeto', cure: 'curar secar seca cecina tasajo jerky cure cured dried salar curar secar carne seca charque', roll: 'rellenar relleno enrollar arrollado stuffed rolled roulade rechear recheado enrolado', slice: 'laminas lonchas finas hot pot shabu sukiyaki thin sliced shaved fatias finas fatiar' };

  // ------------------------------------------------------------ state
  const st = { lang: 'es', country: 'co', tab: 0, view: 'shop', sel: 'sb', explode: 0, budget: 0, answer: null, dishQ: '', dishC: '', dishM: '', trFrom: 'us', voice: false, cutMethod: null, shown: 40 };
  const ls = { get(k) { try { return localStorage.getItem('atlas-' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('atlas-' + k, v); } catch (e) { } } };
  if (STR[ls.get('lang')]) st.lang = ls.get('lang');
  else if (/^pt/i.test(navigator.language || '')) st.lang = 'pt';
  else if (!/^es/i.test(navigator.language || 'es')) st.lang = 'en';
  if (COUNTRIES.some((c) => c.id === ls.get('country'))) st.country = ls.get('country');
  if (st.country === st.trFrom) st.trFrom = 'co';
  const L = () => STR[st.lang];
  const LI = { es: 0, en: 1, pt: 2 };
  const tx = (p) => !p ? '' : Array.isArray(p) ? (p[LI[st.lang]] || p[0] || '') : (p[st.lang] || p.es || '');
  const cname = (cut, c) => cut.names[c || st.country][0];
  const calt = (cut, c) => cut.names[c || st.country][1] || '';
  const ctry = (id) => COUNTRIES.find((c) => c.id === id);
  const cuisineName = (cc) => tx(CUISINE[cc] || [cc, cc]);
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  // ------------------------------------------------------------ search
  let INDEX = [];
  function buildIndex() {
    INDEX = [];
    CUTS.forEach((cut) => {
      const seen = new Set();
      COUNTRIES.forEach((c) => cut.names[c.id].forEach((nm, j) => nm.split(/·|\(|\)/).map((x) => x.trim()).filter((x) => x.length > 2 && !/^(solo|parte|zeb|con hueso|bone-in|avec)/i.test(x)).forEach((x) => {
        const k = norm(x); if (!k || seen.has(k + c.id)) return; seen.add(k + c.id);
        INDEX.push({ ty: 'cut', id: cut.id, t: x, s: tx(c) + (c.id !== st.country ? ' → ' + cname(cut) : ''), k, w: c.id === st.country ? 3 : 1 });
      })));
      cut.reg.forEach((r) => r[1].split(/·|\(|\)/).map((x) => x.trim()).filter((x) => x.length > 2).forEach((x) => INDEX.push({ ty: 'cut', id: cut.id, t: x, s: 'Colombia · ' + r[0] + ' → ' + cname(cut), k: norm(x), w: 1 })));
    });
    Object.keys(METHODS).forEach((m) => INDEX.push({ ty: 'method', id: m, t: tx(METHODS[m].n), s: L().bestFor + ' ' + tx(METHODS[m].v), k: norm(METHODS[m].n.join(' ') + ' ' + METHODS[m].v.join(' ') + ' ' + SYN[m]), w: 2 }));
    tools.index((e) => INDEX.push(e));
    DISHES.forEach((d) => INDEX.push({ ty: 'dish', id: d.i, t: d.n, s: cuisineName(d.cc) + ' · ' + tx(d.g), k: d.k, w: 2 + (d.cc === st.country.toUpperCase() ? 1 : 0) }));
  }
  function search(q, limit) {
    const nq = norm(q); if (!nq) return [];
    const toks = nq.split(' ');
    const out = [];
    for (const e of INDEX) {
      let sc = 0;
      if (e.k === nq) sc = 100; else if (e.k.startsWith(nq)) sc = 60; else if ((' ' + e.k).includes(' ' + nq)) sc = 45; else if (e.k.includes(nq)) sc = 30;
      else if (toks.length > 1 && toks.every((t) => e.k.includes(t))) sc = 22;
      if (!sc) continue;
      if (e.ty === 'method' && sc < 100) sc = Math.min(sc, 40);
      if (e.ty === 'term' && sc < 45) continue;
      out.push({ e, sc: sc + e.w * 2 - Math.min(10, e.k.length / 12) });
    }
    out.sort((a, b) => b.sc - a.sc);
    const seen = new Set(), res = [];
    for (const o of out) { const key = o.e.ty + o.e.id + (o.e.ty === 'cut' ? o.e.k : ''); if (seen.has(key)) continue; seen.add(key); res.push(o.e); if (res.length >= (limit || 8)) break; }
    return res;
  }

  // ------------------------------------------------------------ expert logic
  function generic(cut, m) {
    // fallback reason built from the cut's properties
    const es = [], en = [], pt = [];
    if (m === 'braise' || m === 'soup' || m === 'shred' || m === 'smoke') {
      if (cut.c >= 4) { es.push('tiene mucho colágeno que se vuelve gelatina con la cocción larga'); en.push('it has plenty of collagen that turns to gelatin with long cooking'); pt.push('tem muito colágeno que vira gelatina com o cozimento longo'); }
      else if (cut.c === 3) { es.push('tiene colágeno suficiente para quedar jugoso tras una cocción larga'); en.push('it has enough collagen to stay juicy through long cooking'); pt.push('tem colágeno suficiente para ficar suculento depois de um cozimento longo'); }
      else { es.push('es magro: queda bien si no se cocina de más'); en.push('it is lean: fine as long as it is not overcooked'); pt.push('é magro: fica bom se não cozinhar demais'); }
      if (cut.f >= 4) { es.push('y su grasa lo mantiene húmedo'); en.push('and its fat keeps it moist'); pt.push('e sua gordura o mantém úmido'); }
    } else {
      if (cut.t >= 4) { es.push('es de los cortes más tiernos'); en.push('it is among the most tender cuts'); pt.push('é dos cortes mais macios'); }
      else if (cut.t === 3) { es.push('es medianamente tierno, mejor cortado contra la fibra'); en.push('it is moderately tender, best sliced across the grain'); pt.push('é medianamente macio, melhor cortado contra a fibra'); }
      else { es.push('es firme: necesita corte fino o marinado'); en.push('it is firm: it needs thin slicing or a marinade'); pt.push('é firme: precisa de corte fino ou marinada'); }
      if (cut.f >= 4) { es.push('con buena grasa infiltrada'); en.push('with good marbling'); pt.push('com bom marmoreio'); } else if (cut.f <= 1) { es.push('y muy magro'); en.push('and very lean'); pt.push('e muito magro'); }
    }
    const s = ({ es, en, pt })[st.lang].join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }
  const whyOf = (cut, m) => (cut.why && cut.why[m]) ? tx(cut.why[m]) : generic(cut, m);
  function rankMethod(m, budget) {
    const slow = /braise|shred|soup|smoke/.test(m), fast = /grill|sear|stirfry|raw|skewer|slice|roast/.test(m);
    const fit = (c) => m === 'grind' ? c.f * 0.9 + c.v * 0.5 : slow ? c.c * 1.0 + c.f * 0.45 + c.v * 0.2 : fast ? c.t * 1.0 + c.f * 0.4 + c.v * 0.3 : c.t * 0.6 + (6 - c.f) * 0.7;
    let list = CUTS.filter((c) => c.m[m] >= 2).map((c) => ({ c, s: c.m[m] * 10 + (c.why && c.why[m] ? 3 : 0) + fit(c) + (budget === 1 ? (5 - c.price) * 2.5 : budget === 2 ? c.price * 2.5 : 0) }));
    if (budget === 1) list = list.filter((x) => x.c.price <= 2); if (budget === 2) list = list.filter((x) => x.c.price >= 3);
    return list.sort((a, b) => b.s - a.s || a.c.n - b.c.n).slice(0, 6).map((x) => x.c);
  }
  const dishesOf = (id) => DISHES.filter((d) => d.b === id).concat(DISHES.filter((d) => d.a.includes(id)));

  // ------------------------------------------------------------ 3D bridge
  let shop = null;
  function sync3D() {
    if (!shop) return;
    const a = st.answer, scn = tools.scene();
    const recs = scn ? scn.recs : a && a.cuts ? a.cuts : [];
    shop.setSelection(scn ? scn.sel : st.sel); shop.setRecs(recs); shop.setBlockCut(st.sel);
    shop.setDoneness(scn && scn.done != null ? scn.done : null);
    if (!!st.grain !== !!shop.state.grain) shop.setGrain(st.grain);
    if (scn) shop.setChalk(scn.chalk[0], scn.chalk[1]);
    else if (a && a.cuts && a.cuts.length) shop.setChalk(a.title || L().example, [cname(BY[a.cuts[0]])].concat(a.cuts.slice(1, 3).map((id, i) => (i ? '' : L().alsoWork.toLowerCase() + ': ') + lower(cname(BY[id])))).slice(0, 3));
    else if (st.sel) shop.setChalk(tx(ZONES[BY[st.sel].zone]), [cname(BY[st.sel]), tx(BY[st.sel].cook).split('.')[0]]);
    drawTags();
  }
  function setView(v, keepTab) {
    st.view = v; $('#app').dataset.view = v;
    document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
    $('#cowtools').hidden = v !== 'cow';
    if (shop) { shop.setView(v); if (v === 'case' && st.sel) shop.focusCase(st.sel); }
    drawTags();
  }
  const tagEls = new Map();
  const narrow = () => window.innerWidth < 620;
  function drawTags() {
    if (!shop) return;
    const box = $('#tags'); const want = [];
    const a = st.answer, scn = tools.scene(); const recs = scn ? scn.recs : a && a.cuts ? a.cuts : [];
    const sel = scn ? scn.sel : st.sel;
    if (!scn || scn.tags) {
      recs.forEach((id, i) => want.push({ id, cls: i && !scn ? 'alt' : '', n: i + 1 }));
      if (sel && !recs.includes(sel)) want.push({ id: sel, cls: '', n: BY[sel].n });
    }
    const keep = new Set();
    for (const w of want) {
      if (st.view === 'block' && w.id !== sel) continue;
      if ((st.view === 'shop' || narrow()) && w.cls) continue;
      const p = shop.anchorOf(w.id); if (!p || !p.vis) continue;
      let el = tagEls.get(w.id);
      if (!el) { el = document.createElement('div'); tagEls.set(w.id, el); box.appendChild(el); }
      const html = `<i>${w.n}</i>${esc(cname(BY[w.id]))}`;
      if (el._h !== html) { el.innerHTML = html; el._h = html; }
      el.className = 'tag ' + w.cls; el.lang = ctry(st.country).lang;
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -115%)`;
      keep.add(w.id);
    }
    for (const [id, el] of tagEls) if (!keep.has(id)) { el.remove(); tagEls.delete(id); }
  }

  // ------------------------------------------------------------ actions
  function selectCut(id, opts) {
    opts = opts || {};
    if (!BY[id]) return;
    st.sel = id; st.cutMethod = null;
    if (!opts.keepAnswer && st.answer && st.answer.cuts && !st.answer.cuts.includes(id)) st.answer = Object.assign({}, st.answer, { cuts: [] });
    if (opts.tab !== false) setTab(1);
    if (opts.view) setView(opts.view); else if (st.view === 'shop') setView(BY[id].pieces.length && shop && (shop.pieceOfCut[id] || []).length ? 'cow' : 'block');
    else if (st.view === 'case' && shop) shop.focusCase(id);
    sync3D(); renderCut();
    ls.set('sel', id);
  }
  function showDish(d, opts) {
    const cuts = [d.b].concat(d.a);
    st.answer = { type: 'dish', d, cuts, title: d.n.replace(/\s*\(.*?\)\s*/g, ' ').trim(), example: opts && opts.example };
    st.sel = d.b; st.cutMethod = d.m;
    setTab(0); renderButcher();
    if (!(opts && opts.quiet)) { setView(shop && (shop.pieceOfCut[d.b] || []).length ? 'cow' : 'block'); if (shop) { shop.setPose('talk', 2600); shop.talk(2600); } }
    sync3D(); renderCut();
  }
  function showMethod(m) {
    const cuts = rankMethod(m, st.budget).map((c) => c.id);
    st.answer = { type: 'method', m, cuts, title: tx(METHODS[m].n) };
    if (cuts.length) st.sel = cuts[0];
    st.cutMethod = m;
    setTab(0); renderButcher(); setView('cow'); if (shop) shop.talk(2200);
    sync3D(); renderCut();
  }
  function go(e) {
    if (!e) return;
    $('#q').value = ''; hideSug();
    if (e.ty === 'term') tools.go(e.id);
    else if (e.ty === 'dish') showDish(DISHES[e.id]);
    else if (e.ty === 'method') showMethod(e.id);
    else selectCut(e.id);
  }

  // ---- free-form questions answered by Claude (when the page is allowed to)
  let sample = null, tts = null, ctl = null;
  function catalog() {
    return CUTS.map((c) => `${c.id}: ${cname(c)} (US: ${c.names.us[0]}) | tender ${c.t}/5 fat ${c.f}/5 collagen ${c.c}/5 price ${c.price}/4 | best: ${Object.keys(c.m).filter((m) => c.m[m] === 3).join(', ')}`).join('\n');
  }
  async function askClaude(q) {
    const S = L();
    st.answer = { type: 'ai', q, text: '', cuts: [], title: q.slice(0, 26), busy: true };
    setTab(0); renderButcher();
    if (!sample) { st.answer = { type: 'none', q, near: search(q.split(' ')[0], 5) }; renderButcher(); return; }
    if (ctl) ctl.abort(); ctl = new AbortController();
    const rules = `You are Don Rafa, a master butcher behind the counter of a neighbourhood shop. The customer shops in ${tx(ctry(st.country))}. Answer in ${({ es: 'Spanish', en: 'English', pt: 'Brazilian Portuguese' })[st.lang]}, warmly and concretely, in at most 110 words, plain text, no markdown, no lists.\n` +
      `Recommend only beef cuts from this catalogue, and call them by the name given here (the name used where the customer shops). Explain WHY the cut suits the preparation using its tenderness, fat, collagen and grain, and give one practical tip (thickness, doneness temperature in °C, or how to ask for it).\n` +
      `If the question is not about beef, cooking or buying meat, say briefly that you only know about beef.\n` +
      `Your reply MUST start with one line exactly like "CUTS: id1,id2" listing 1 to 3 catalogue ids, best first (or "CUTS:" alone if none apply). Then a blank line, then the answer.\n\nCATALOGUE (id: name | properties | best methods)\n${catalog()}`;
    try {
      if (shop) shop.talk(6000);
      const apply = (text) => {
        const m = text.match(/^\s*CUTS:\s*([a-z, ]*)\n?/i);
        let body = text, ids = [];
        if (m) { ids = m[1].split(',').map((x) => x.trim()).filter((x) => BY[x]); body = text.slice(m[0].length); }
        else if (/^\s*C(U(T(S)?)?)?:?\s*$/i.test(text) || /^\s*CUTS:[^\n]*$/i.test(text)) body = '';
        st.answer.text = body.trim(); st.answer.cuts = ids.slice(0, 3);
        const out = $('#aitext'); if (out) { out.textContent = st.answer.text; out.classList.toggle('thinking', !st.answer.text); if (!st.answer.text) out.textContent = S.thinking; }
      };
      const res = await sample([{ role: 'user', content: rules }, { role: 'user', content: q }], { modelTier: 'quick', signal: ctl.signal, cache: false, onText: ({ text }) => apply(text) });
      apply(res.text);
      st.answer.busy = false;
      if (st.answer.cuts.length) { st.sel = st.answer.cuts[0]; setView('cow'); }
      renderButcher(); sync3D(); renderCut();
    } catch (err) {
      if (err && err.code === 'cancelled') return;
      const off = err && (err.code === 'not_granted' || err.code === 'sampling_disabled' || err.code === 'not_declared' || err.code === 'capability_disabled');
      if (off) sample = null;
      st.answer = { type: 'none', q, near: search(q.split(' ')[0], 5), msg: off ? S.claudeOff : S.claudeFail };
      renderButcher();
    }
  }
  function submit() {
    const q = $('#q').value.trim(); if (!q) return;
    const r = search(q, 6);
    const nq = norm(q);
    if (active >= 0 && sug[active]) return go(sug[active]);
    if (r.length && (r[0].k === nq || (nq.split(' ').length <= 3 && (r[0].k.startsWith(nq) || (' ' + r[0].k).includes(' ' + nq + ' ') || r[0].k.endsWith(' ' + nq))))) return go(r[0]);
    $('#q').value = ''; hideSug();
    if (sample) return askClaude(q);
    st.answer = { type: 'none', q, near: r.length ? r : search(nq.split(' ').sort((a, b) => b.length - a.length)[0] || q, 5) };
    setTab(0); renderButcher();
  }

  // ------------------------------------------------------------ rendering
  function setTab(i) {
    st.tab = i;
    document.querySelectorAll('#tabs button').forEach((b, k) => b.setAttribute('aria-selected', k === i));
    document.querySelectorAll('#pbody > section').forEach((s, k) => { s.hidden = k !== i; });
    if (i === 2) renderDishes(); if (i === 3) renderTranslator(); if (i === 4) tools.render();
    sync3D();
  }
  function ticket(cut, extra, goLabel) {
    return `<button class="ticket" data-cut="${cut.id}"><span class="n">${String(cut.n).padStart(2, '0')}</span><span class="t" lang="${ctry(st.country).lang}">${esc(cname(cut))}${extra ? `<small>${extra}</small>` : ''}</span><span class="go">${esc(goLabel || L().seeCut)} ›</span></button>`;
  }
  function recipeName(cut, cc) {
    const set = NAMESET[cc]; if (!set || set === st.country) return '';
    const nm = cut.names[set][0]; if (norm(nm) === norm(cname(cut))) return '';
    return `${esc(L().recipeSays.replace('{c}', cuisineName(cc)))} <b lang="${ctry(set).lang}">${esc(nm)}</b>`;
  }
  function altList(ids, m, first) {
    return `<ul class="alts">${ids.map((id, i) => { const c = BY[id]; return `<li><button data-cut="${id}"><span class="rk${first ? ' top' : ''}">${i + (first ? 1 : 2)}</span><span class="nm" lang="${ctry(st.country).lang}">${esc(cname(c))} <span>· ${esc(tx(PRICE[c.price]))}</span></span><span class="wy">${esc(whyOf(c, m))}</span></button></li>`; }).join('')}</ul>`;
  }
  function renderButcher() {
    const S = L(), a = st.answer, box = $('#answer');
    let h = '';
    if (!a) h = `<div class="ans"><p>${esc(S.hello)}</p></div>`;
    else if (a.type === 'dish') {
      const d = a.d, cut = BY[d.b], M = METHODS[d.m];
      h = `<article class="ans">
        <div class="tagline">${a.example ? `<b>${esc(S.example)}</b>` : ''}<span>${esc(cuisineName(d.cc))}</span><span>${esc(tx(M.n))}</span></div>
        <h2>${esc(S.for)} ${esc(a.title)}, ${esc(S.ask)} <em lang="${ctry(st.country).lang}">${esc(lower(cname(cut)))}</em></h2>
        ${tx(d.g) ? `<p class="note">${esc(d.n)}: ${esc(tx(d.g))}.</p>` : ''}
        ${ticket(cut, recipeName(cut, d.cc))}
        <div><h4>${esc(S.why)}</h4><p>${esc(tx(M.need))}</p><p class="whybox" style="margin-top:8px">${esc(whyOf(cut, d.m))}</p></div>
        ${d.a.length ? `<div><h4>${esc(S.alsoWork)}</h4>${altList(d.a, d.m)}</div>` : ''}
        <div><h4>${esc(S.howAsk)}</h4><p>${esc(tx(M.ask))} ${esc(tx(cut.tip))}</p></div>
        <div><h4>${esc(S.cooking)}</h4><p>${esc(tx(cut.cook))}</p></div>
        <div class="row acts">${tools.dishActions(d)}${ttsBtn()}</div>
      </article>`;
    } else if (a.type === 'method') {
      const M = METHODS[a.m];
      h = `<article class="ans">
        <div class="tagline"><span>${esc(S.method)}</span></div>
        <h2>${esc(S.bestFor)} <em>${esc(tx(M.v))}</em></h2>
        <p>${esc(tx(M.need))}</p>
        <div class="seg" role="group">${S.budget.map((b, i) => `<button data-budget="${i}" aria-pressed="${i === st.budget}">${esc(b)}</button>`).join('')}</div>
        ${a.cuts.length ? altList(a.cuts, a.m, true) : `<p class="note">—</p>`}
        <div><h4>${esc(S.howAsk)}</h4><p>${esc(tx(M.ask))}</p></div>
        <div class="row">${ttsBtn()}</div>
      </article>`;
    } else if (a.type === 'ai') {
      h = `<article class="ans">
        <div class="tagline"><span>“${esc(a.q)}”</span></div>
        <p id="aitext" class="${a.text ? '' : 'thinking'}" style="white-space:pre-wrap">${esc(a.text || S.thinking)}</p>
        ${a.cuts.length ? a.cuts.map((id) => ticket(BY[id])).join('') : ''}
        ${a.busy ? `<div class="row"><button class="btn ghost" id="stop">${esc(S.stop)}</button></div>` : `<p class="note">${esc(S.claudeNote)}</p><div class="row">${ttsBtn()}</div>`}
      </article>`;
    } else {
      h = `<article class="ans"><div class="tagline"><span>“${esc(a.q)}”</span></div><h2>${esc(S.notFound)}</h2><p>${esc(a.msg || S.notFoundHelp)}</p>
        ${a.near && a.near.length ? `<div><h4>${esc(S.closest)}</h4><div class="chips">${a.near.map((e, i) => `<button class="chip" data-near="${i}">${esc(e.t)}<small>${esc(tyLabel(e))}</small></button>`).join('')}</div></div>` : ''}</article>`;
    }
    box.innerHTML = h;
    if (!(a && a.type === 'ai' && a.text)) $('#pbody').scrollTop = 0;
  }
  const tyLabel = (e) => e.lbl || (e.ty === 'dish' ? L().dish : e.ty === 'cut' ? L().cut : L().method);
  function ttsBtn() { return tts ? `<button class="btn ghost" id="speak">${esc(L().speak)}</button>` : ''; }
  function answerText() {
    const a = st.answer; if (!a) return '';
    if (a.type === 'ai') return a.text;
    const el = $('#answer .ans'); if (!el) return '';
    return [...el.querySelectorAll('h2, p:not(.note), .alts .nm, .alts .wy')].map((n) => n.textContent.trim()).join('. ').replace(/\.\./g, '.').slice(0, 1900);
  }

  function renderCut() {
    const S = L(), cut = BY[st.sel], box = $('#cutcard'); if (!cut) return;
    const me = ctry(st.country);
    const bars = ['t', 'f', 'c', 'v'].map((k) => `<span>${esc(tx(PROPS[k]))}</span><span class="b" role="img" aria-label="${cut[k]} ${S.pageOf} 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= cut[k] ? 'on' : ''}"></i>`).join('')}</span>`).join('');
    const names = COUNTRIES.map((c) => `<div class="r${c.id === st.country ? ' me' : ''}"><span class="cd">${c.id.toUpperCase()}</span><span class="ct">${esc(tx(c))}</span><span class="nm" lang="${c.lang}"><b>${esc(cut.names[c.id][0])}</b>${cut.names[c.id][1] ? `<span>${esc(cut.names[c.id][1])}</span>` : ''}</span></div>`).join('');
    const ms = Object.keys(cut.m).sort((a, b) => cut.m[b] - cut.m[a]);
    const cm = st.cutMethod && cut.m[st.cutMethod] ? st.cutMethod : ms[0];
    const ds = dishesOf(cut.id), nBest = DISHES.filter((d) => d.b === cut.id).length;
    const internal = shop && (shop.pieceOfCut[cut.id] || []).some((n) => shop.pieces[n].meta.internal);
    box.innerHTML = `<div class="card">
      <div><div class="meta">${String(cut.n).padStart(2, '0')} · ${esc(tx(ZONES[cut.zone]))} · ${esc(tx(PRICE[cut.price]))}</div>
        <h2 lang="${me.lang}">${esc(cname(cut))}</h2>${calt(cut) ? `<div class="also" lang="${me.lang}">${esc(S.aka)}: ${esc(calt(cut))}</div>` : ''}</div>
      <div class="row"><button class="btn ghost" data-view="block">${esc(S.seeCase)}</button><button class="btn ghost" data-view="cow">${esc(S.views.cow)}</button><button class="btn ghost" data-view="case">${esc(S.views.case)}</button></div>
      ${tools.cutActions(cut)}
      <p>${esc(tx(cut.d))}</p>
      ${internal ? `<p class="note">${esc(S.internal)}</p>` : ''}
      <div><h4>${esc(S.props)}</h4><div class="bars">${bars}</div><p class="note" style="margin-top:8px">${esc(S.muscle)}: <i>${esc(cut.muscle)}</i></p></div>
      <div><h4>${esc(S.goodFor)}</h4><div class="chips">${ms.map((m) => `<button class="chip" data-m="${m}" aria-pressed="${m === cm}">${esc(tx(METHODS[m].n))}${cut.m[m] === 3 ? ' ★' : ''}</button>`).join('')}</div>
        <p class="whybox" style="margin-top:10px">${esc(whyOf(cut, cm))}</p></div>
      <div><h4>${esc(S.cooking)}</h4><p>${esc(tx(cut.cook))}</p></div>
      <div><h4>${esc(S.tip)}</h4><p>${esc(tx(cut.tip))}</p></div>
      ${tools.cutSections(cut)}
      <div><h4>${esc(S.inCountries)}</h4><div class="names">${names}</div></div>
      ${st.country === 'co' || cut.reg.length ? `<div><h4>${esc(S.inRegions)}</h4>${cut.reg.length ? `<ul class="regs">${cut.reg.map((r) => `<li><span>${esc(r[0])}</span><b>${esc(r[1])}</b></li>`).join('')}</ul>` : `<p class="note">${esc(S.regionDefault)} <b>${esc(cut.names.co[0])}</b>.</p>`}</div>` : ''}
      ${ds.length ? `<div><h4>${esc(S.dishesWith)} · ${ds.length}</h4><ul class="dishlist">${ds.slice(0, 8).map(dishRow).join('')}</ul>${ds.length > 8 ? `<div class="row" style="margin-top:8px"><button class="btn ghost" id="moreDishes">${esc(S.more)} (${ds.length})</button></div>` : ''}</div>` : ''}
    </div>`;
  }
  const dishRow = (d) => `<li><button data-dish="${d.i}"><span class="dn">${esc(d.n)}</span><span class="dc">${esc(cuisineName(d.cc))}</span><span class="dg">${esc(tx(d.g))} · <span class="dk" lang="${ctry(st.country).lang}">${esc(cname(BY[d.b]))}</span></span></button></li>`;

  function filteredDishes() {
    const q = norm(st.dishQ);
    return DISHES.filter((d) => (!st.dishC || d.cc === st.dishC) && (!st.dishM || d.m === st.dishM) && (!st.dishCut || d.b === st.dishCut || d.a.includes(st.dishCut)) && (!q || d.k.includes(q) || norm(cname(BY[d.b])).includes(q)));
  }
  function renderDishes(keepFocus) {
    const S = L(), box = $('#dishsec');
    const list = filteredDishes();
    const codes = [...new Set(DISHES.map((d) => d.cc))].sort((a, b) => cuisineName(a).localeCompare(cuisineName(b)));
    if (!keepFocus) {
      box.innerHTML = `<div class="filters"><input id="dq" type="search" placeholder="${esc(S.search)}" value="${esc(st.dishQ)}" autocomplete="off">
        <select id="dc" aria-label="${esc(S.anyCuisine)}"><option value="">${esc(S.anyCuisine)}</option>${codes.map((c) => `<option value="${c}"${c === st.dishC ? ' selected' : ''}>${esc(cuisineName(c))}</option>`).join('')}</select>
        <select id="dm" aria-label="${esc(S.anyMethod)}"><option value="">${esc(S.anyMethod)}</option>${Object.keys(METHODS).map((m) => `<option value="${m}"${m === st.dishM ? ' selected' : ''}>${esc(tx(METHODS[m].n))}</option>`).join('')}</select></div>
        <div class="note" id="dcount"></div><ul class="dishlist" id="dlist"></ul><div class="row" id="dmore"></div>`;
    }
    $('#dcount').innerHTML = esc(S.count(list.length)) + (st.dishCut ? ` · <button class="chip" id="clearCut">${esc(cname(BY[st.dishCut]))} ✕</button>` : '');
    $('#dlist').innerHTML = list.slice(0, st.shown).map(dishRow).join('');
    $('#dmore').innerHTML = list.length > st.shown ? `<button class="btn ghost" id="showMore">${esc(S.more)}</button>` : '';
  }
  function renderTranslator() {
    const S = L(), box = $('#trsec');
    const A = st.trFrom, B = st.country;
    const opt = (sel) => COUNTRIES.map((c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(tx(c))}</option>`).join('');
    box.innerHTML = `<p class="note">${esc(S.trHelp)}</p>
      <div class="filters"><label class="field"><span>${esc(S.from)}</span><select id="trA">${opt(A)}</select></label><label class="field"><span>${esc(S.to)}</span><select id="trB">${opt(B)}</select></label></div>
      <div class="tscroll"><table><thead><tr><th>#</th><th>${esc(tx(ctry(A)))}</th><th>${esc(tx(ctry(B)))}</th></tr></thead><tbody>
      ${CUTS.map((c) => `<tr data-cut="${c.id}"><td class="num">${String(c.n).padStart(2, '0')}</td><td lang="${ctry(A).lang}"><b>${esc(c.names[A][0])}</b>${c.names[A][1] ? `<small>${esc(c.names[A][1])}</small>` : ''}</td><td lang="${ctry(B).lang}"><b>${esc(c.names[B][0])}</b>${c.names[B][1] ? `<small>${esc(c.names[B][1])}</small>` : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="foot"><p>${esc(S.approx)}</p><p>${esc(S.sources)}: <a href="https://www.fsis.usda.gov/sites/default/files/media_file/documents/chile-list-of-accepted-cuts.pdf" target="_blank" rel="noopener">USDA FSIS</a>, <a href="https://www.usa-beef.org/wp-content/uploads/2020/07/1063.GU%C3%8DA_beef-cuts_espa%C3%B1ol_09oct13.pdf" target="_blank" rel="noopener">USMEF</a>, <a href="https://www.beefresearch.org/resources/product-quality/fact-sheets/ranking-of-beef-muscles-for-tenderness" target="_blank" rel="noopener">Beef Research</a>, <a href="https://www.contextoganadero.com/blog/como-pides-tu-corte-de-carne-nombres-segun-la-ciudad-y-el-pais" target="_blank" rel="noopener">CONtexto Ganadero</a>, <a href="https://www.sirhuila.gov.co/media/ZbRepository/ZbFiles/2025/8/8cfd49b2019e4778b5cf3a5a81204933.pdf" target="_blank" rel="noopener">SIPSA</a>, <a href="https://cbs.izt.uam.mx/nacameh/volumenes/v8n1/Nacameh_v8n1_001_Montero_etal.pdf" target="_blank" rel="noopener">Nacameh</a>, <a href="https://www.mexconnect.com/?p=1093" target="_blank" rel="noopener">MexConnect</a>, <a href="https://www.directoalpaladar.com/cultura-gastronomica/cortes-carne-argentinos-utilizados-asados-como-se-llaman-espana" target="_blank" rel="noopener">Directo al Paladar</a>.</p></div>`;
  }
  function renderStatic() {
    const S = L(), me = ctry(st.country);
    document.documentElement.lang = st.lang;
    $('#brand .eyebrow').textContent = S.eyebrow;
    $('#phead .nm').textContent = S.butcher; $('#phead .sub').textContent = S.role;
    $('#countryBtn').innerHTML = `<span class="code">${me.id.toUpperCase()}</span>${esc(tx(me).split(' · ')[0])}`;
    $('#langBtn').textContent = st.lang.toUpperCase(); $('#langBtn').setAttribute('aria-label', S.language + ': ' + LANGS[st.lang]);
    document.querySelectorAll('#tabs button').forEach((b, i) => { b.textContent = S.tabs[i]; });
    document.querySelectorAll('#views button').forEach((b) => { b.textContent = S.views[b.dataset.v]; });
    $('#cowtools span').textContent = S.explode; $('#hint').textContent = S.hint;
    $('#askLabel').textContent = S.askLabel; $('#q').placeholder = S.askPh; $('#go').textContent = S.askBtn;
    $('#orMethod').textContent = S.orMethod; $('#exLabel').textContent = S.examples;
    $('#methods').innerHTML = Object.keys(METHODS).map((m) => `<button class="chip" data-method="${m}">${esc(tx(METHODS[m].n))}</button>`).join('');
    const ex = st.country === 'co' ? ['Posta negra cartagenera', 'Texas smoked brisket', 'Bœuf bourguignon', 'Picanha na brasa', 'Bulgogi (불고기)', 'Milanesa'] : ['Ropa vieja', 'Texas smoked brisket', 'Bœuf bourguignon', 'Picanha na brasa', 'Bulgogi (불고기)', 'Sancocho de costilla'];
    $('#examples').innerHTML = ex.map((n) => { const d = DISHES.find((x) => x.n === n); return d ? `<button class="chip" data-dish="${d.i}">${esc(n.replace(/\s*\(.*\)/, ''))}</button>` : ''; }).join('');
    $('#settings h3').textContent = S.settings; $('#setLangL').textContent = S.language; $('#setWhereL').textContent = S.where; $('#setVoiceL').textContent = S.voice;
    $('#setLang').innerHTML = Object.keys(LANGS).map((l) => `<button data-lang="${l}" aria-pressed="${st.lang === l}">${LANGS[l]}</button>`).join('');
    $('#setCountry').innerHTML = COUNTRIES.map((c) => `<option value="${c.id}"${c.id === st.country ? ' selected' : ''}>${esc(tx(c))}</option>`).join('');
    $('#setVoice').innerHTML = `<button data-voice="1" aria-pressed="${st.voice}">${esc(S.on)}</button><button data-voice="0" aria-pressed="${!st.voice}">${esc(S.off)}</button>`;
    $('#voiceField').hidden = !tts;
    $('#loading h2').textContent = 'Atlas de la Res'; $('#loadmsg').textContent = S.loading;
  }
  function renderAll() {
    buildIndex(); renderStatic(); renderButcher(); renderCut();
    if (st.tab === 2) renderDishes(); if (st.tab === 3) renderTranslator(); if (st.tab === 4) tools.render();
    if (shop) { shop.setTags((c) => cname(c)); sync3D(); }
  }
  function setLang(l) { if (!STR[l]) return; st.lang = l; ls.set('lang', l); if (st.answer && st.answer.type === 'method') st.answer.title = tx(METHODS[st.answer.m].n); renderAll(); }
  function setCountry(c) { st.country = c; ls.set('country', c); if (st.trFrom === c) st.trFrom = c === 'us' ? 'co' : 'us'; if (st.answer && st.answer.type === 'method') st.answer.cuts = rankMethod(st.answer.m, st.budget).map((x) => x.id); renderAll(); }

  // ------------------------------------------------------------ suggestions
  let sug = [], active = -1;
  function hideSug() { $('#sug').hidden = true; sug = []; active = -1; }
  function showSug() {
    const S = L(); sug = search($('#q').value, 8); active = -1;
    const box = $('#sug');
    if (!sug.length) { box.hidden = true; return; }
    box.innerHTML = sug.map((e, i) => `<li><button data-s="${i}"><span class="ty">${esc(tyLabel(e))}</span><span class="tt">${esc(e.t)}</span><span class="ss">${esc(e.s)}</span></button></li>`).join('');
    box.hidden = false;
  }

  // ------------------------------------------------------------ events
  function wire() {
    $('#q').addEventListener('input', showSug);
    $('#q').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Escape') hideSug();
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && sug.length) { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + sug.length + (active < 0 && e.key === 'ArrowUp' ? 1 : 0)) % sug.length; document.querySelectorAll('#sug button').forEach((b, i) => b.classList.toggle('on', i === active)); }
    });
    $('#askform').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    document.addEventListener('click', (e) => {
      const t = e.target;
      const b = t.closest('button, tr[data-cut], tr[data-lvl]');
      if (!t.closest('.ask')) hideSug();
      if (!t.closest('#settings') && !t.closest('#countryBtn') && !t.closest('#gear')) $('#settings').hidden = true;
      if (!b) return;
      const d = b.dataset;
      if (tools.click(b, d)) return;
      if (d.s != null) return go(sug[+d.s]);
      if (d.near != null) return go(st.answer.near[+d.near]);
      if (d.dish != null) return showDish(DISHES[+d.dish]);
      if (d.method) return showMethod(d.method);
      if (d.budget != null) { st.budget = +d.budget; return showMethod(st.answer.m); }
      if (d.cut) return selectCut(d.cut, { keepAnswer: true });
      if (d.m) { st.cutMethod = d.m; return renderCut(); }
      if (d.view) { setView(d.view); return; }
      if (d.v) { setView(d.v); return; }
      if (d.lang) return setLang(d.lang);
      if (d.voice != null) { st.voice = d.voice === '1'; renderStatic(); return; }
      if (b.id === 'langBtn') { const ks = Object.keys(LANGS); return setLang(ks[(ks.indexOf(st.lang) + 1) % ks.length]); }
      if (b.id === 'countryBtn' || b.id === 'gear') { $('#settings').hidden = !$('#settings').hidden; return; }
      if (b.id === 'moreDishes') { st.dishCut = st.sel; st.dishQ = ''; st.dishC = ''; st.dishM = ''; st.shown = 40; setTab(2); return; }
      if (b.id === 'clearCut') { st.dishCut = null; renderDishes(); return; }
      if (b.id === 'showMore') { st.shown += 60; renderDishes(true); return; }
      if (b.id === 'stop') { if (ctl) ctl.abort(); st.answer.busy = false; renderButcher(); return; }
      if (b.id === 'speak') return speak();
      if (b.parentElement && b.parentElement.id === 'tabs') return setTab([...b.parentElement.children].indexOf(b));
    });
    $('#pbody').addEventListener('input', (e) => { if (tools.input(e.target)) return; if (e.target.id === 'dq') { st.dishQ = e.target.value; st.shown = 40; renderDishes(true); } });
    $('#pbody').addEventListener('change', (e) => {
      const t = e.target;
      if (tools.change(t)) return;
      if (t.id === 'dc') { st.dishC = t.value; st.shown = 40; renderDishes(true); }
      if (t.id === 'dm') { st.dishM = t.value; st.shown = 40; renderDishes(true); }
      if (t.id === 'trA') { st.trFrom = t.value; renderTranslator(); }
      if (t.id === 'trB') setCountry(t.value);
    });
    $('#setCountry').addEventListener('change', (e) => setCountry(e.target.value));
    $('#explode').addEventListener('input', (e) => { st.explode = e.target.value / 100; if (shop) shop.setExplode(st.explode); });
  }
  async function speak() {
    if (!tts) return;
    try { await tts.speak(answerText(), { language: st.lang, voice: 'rounded' }); } catch (e) { if (e && e.code === 'not_granted') { tts = null; renderStatic(); renderButcher(); } }
  }

  // ------------------------------------------------------------ voice, toast, links
  const synth = window.speechSynthesis || null;
  const canSay = () => !!(synth || tts);
  function say(text, lang) {
    if (synth) {
      try {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text), vs = synth.getVoices();
        u.lang = lang; u.rate = 0.92;
        const v = vs.find((x) => x.lang === lang) || vs.find((x) => x.lang.slice(0, 2) === lang.slice(0, 2)); if (v) u.voice = v;
        synth.speak(u); return;
      } catch (e) { }
    }
    if (tts) tts.speak(text, { language: lang.slice(0, 2), voice: 'rounded' }).catch(() => { });
  }
  let toastT = 0;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200); }
  function copy(text, msg) {
    const old = () => { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(msg), old); else old();
  }
  // links: #c=<cut>&p=<country>&l=<language>, #d=<dish>, #t=<tool>
  const slug = (s) => norm(s).replace(/ /g, '-');
  function share(what) {
    const p = new URLSearchParams(), dish = what[0] === 'd' ? DISHES[+what.slice(2)] : null;
    if (dish) p.set('d', slug(dish.n)); else p.set('c', st.sel);
    p.set('p', st.country); p.set('l', st.lang);
    let base = ''; try { base = location.href.split('#')[0]; } catch (e) { }
    const url = base + '#' + p.toString(), title = 'Atlas de la Res · ' + (dish ? dish.n : cname(BY[st.sel]));
    if (navigator.share) navigator.share({ title, url }).catch(() => { }); else copy(url, tools.t('linkCopied'));
  }
  function applyHash(first) {
    let h = ''; try { h = location.hash.slice(1); } catch (e) { }
    if (!h) return;
    const p = new URLSearchParams(h), l = p.get('l'), c = p.get('p');
    let again = false;
    if (STR[l] && l !== st.lang) { st.lang = l; again = true; }
    if (COUNTRIES.some((x) => x.id === c) && c !== st.country) { st.country = c; if (st.trFrom === c) st.trFrom = c === 'us' ? 'co' : 'us'; again = true; }
    if (again && !first) renderAll();
    return () => {
      const d = p.get('d') && DISHES.find((x) => slug(x.n) === p.get('d'));
      if (d) showDish(d); else if (BY[p.get('c')]) selectCut(p.get('c'), { view: 'cow' });
      else if (p.get('t')) tools.open(p.get('t'));
    };
  }
  function refresh() { const y = $('#pbody').scrollTop; renderButcher(); renderCut(); if (st.tab === 2) renderDishes(true); if (st.tab === 4) tools.render(); $('#pbody').scrollTop = y; }
  const tools = AtlasTools({ $, esc, norm, st, ls, tx, BY, DISHES, cname, calt, ctry, lower, cuisineName, L, whyOf, dishesOf, dishRow, selectCut, setView, setTab, setCountry, sync3D, say, canSay, toast, copy, share, refresh, shop: () => shop });

  // ------------------------------------------------------------ boot
  function start(saved) {
    saved = saved || {};
    if (STR[saved.lang]) st.lang = saved.lang; if (saved.country) st.country = saved.country;
    const linked = applyHash(true);
    wire(); buildIndex(); renderStatic();
    const d0 = DISHES.find((d) => d.n === 'Ropa vieja');
    st.answer = { type: 'dish', d: d0, cuts: [d0.b].concat(d0.a), title: d0.n, example: true }; st.sel = d0.b; st.cutMethod = d0.m;
    setTab(saved.tab || 0); renderButcher(); renderCut();
    if (linked) linked();
    window.addEventListener('hashchange', () => { const f = applyHash(false); if (f) f(); });
    load3D();
    if (window.claude && window.claude.use) {
      window.claude.use('sample').then((s) => { sample = s || null; }).catch(() => { });
      window.claude.use('tts').then((t) => { tts = t || null; renderStatic(); renderButcher(); }).catch(() => { });
    }
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ lang: st.lang, country: st.country, tab: st.tab }));
  }
  // the mesh pack travels as base64 text; decode it straight from the bytes
  function b64(a) {
    const T = new Uint8Array(128); const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < 64; i++) T[A.charCodeAt(i)] = i;
    let n = a.length; while (n && (a[n - 1] === 61 || a[n - 1] === 10 || a[n - 1] === 13)) n--;
    const out = new Uint8Array(Math.floor(n * 3 / 4)); let o = 0;
    for (let i = 0; i + 3 < n; i += 4) { const v = (T[a[i]] << 18) | (T[a[i + 1]] << 12) | (T[a[i + 2]] << 6) | T[a[i + 3]]; out[o++] = v >> 16; out[o++] = (v >> 8) & 255; out[o++] = v & 255; }
    const r = n % 4;
    if (r === 2) { out[o++] = ((T[a[n - 2]] << 2) | (T[a[n - 1]] >> 4)) & 255; }
    else if (r === 3) { const v = (T[a[n - 3]] << 10) | (T[a[n - 2]] << 4) | (T[a[n - 1]] >> 2); out[o++] = (v >> 8) & 255; out[o++] = v & 255; }
    return out.buffer;
  }
  function load3D() {
    const bar = $('#loading .bar b'), fail = () => { $('#loadmsg').textContent = L().loadFail; $('#loading .bar').hidden = true; setTimeout(() => $('#loading').classList.add('done'), 2600); };
    if (!window.THREE) return fail();
    fetch('meshes.txt').then(async (r) => {
      if (!r.ok) throw new Error('http ' + r.status);
      const total = (r.headers.get('content-encoding') ? 0 : +r.headers.get('content-length')) || 6500000;
      if (!r.body || !r.body.getReader) return b64(new Uint8Array(await r.arrayBuffer()));
      const rd = r.body.getReader(); const chunks = []; let n = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; chunks.push(value); n += value.length; bar.style.width = Math.min(96, 4 + 92 * n / total) + '%'; }
      const out = new Uint8Array(n); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
      return b64(out);
    }).then((buf) => {
      const pack = MeshLib.parsePack(buf);
      const wide = () => window.matchMedia('(min-width: 881px)').matches;
      shop = Shop.create($('#gl'), pack, { cuts: CUTS, panelWidth: () => wide() ? $('#panel').offsetWidth + 14 : 0, onFrame: drawTags });
      shop.onPick = (h) => { if (tools.pickCow(h)) return; if (!h || !h.cut) return; if (h.where === 'case') selectCut(h.cut, { view: 'block', keepAnswer: true }); else if (h.where === 'block') setTab(1); else selectCut(h.cut, { keepAnswer: true }); };
      shop.onHover = (h, e) => { const el = $('#hover'), scn = tools.scene(); if (!h || !h.cut || (scn && scn.quiet)) { el.hidden = true; return; } const r = $('#stage').getBoundingClientRect(); el.hidden = false; el.textContent = cname(BY[h.cut]); el.style.left = (e.clientX - r.left) + 'px'; el.style.top = (e.clientY - r.top) + 'px'; };
      shop.setTags((c) => cname(c));
      setView(st.view); sync3D();
      const done = () => { $('#loading').classList.add('done'); shop.setPose('wave', 2200); shop.dirty(); };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { shop.setTags((c) => cname(c)); sync3D(); setTimeout(done, 350); });
      window.__shop = shop;
    }).catch((err) => { console.error(err); fail(); });
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
})();
