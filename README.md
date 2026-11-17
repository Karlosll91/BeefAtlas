# Korte

A procedurally generated 3D butcher shop for beef and pork (formerly "Atlas de la Res"). Pick your country, find the cut a recipe calls for, and see what it's called everywhere else.

- **Two animals**: a Res / Cerdo switch swaps the animal on the plinth, the display case, the translator, the recipes and every tool. Pork adds a pig that pulls apart, 24 modelled cuts (including the Ibérico secreto, presa and pluma), 284 dishes and a "crackling / deep-fry" method. Its models live in a second pack (`meshes_pork.pack`) fetched the first time pork is opened.
- **3D shop**: a Brahman steer you can orbit and pull apart, a display case with 36 modelled retail cuts, and a close-up cutting block (Three.js r128).
- **Cut-name translator**: 36 cuts × 11 country name sets (Colombia, México, Argentina/Uruguay, Chile, Venezuela, Brasil, España, US, UK, France, Italy), plus Colombian regional names.
- **Don Rafa, the butcher**: search a dish, cut or cooking method and get the best cut, why, and alternatives, highlighted on the cow. Free-form questions use the Claude `sample` capability when hosted as a Claude artifact.
- **1,217 dishes** from 96 cuisines mapped to a best cut, plus 15 cooking methods.
- Spanish / English / Portuguese interface.
- **Installable and offline**: a web app manifest and a service worker let phones add Korte to the home screen. The page, three.js and the 3D models are kept on the device after the first visit, so later visits download nothing and the shop opens without a connection. A data-saver setting holds back the 3D download until asked.
- **"More" tab** with seven tools:
  - **Doneness**: a temperature slider that recolours a sliced steak on the block, the name of each point in the 11 countries, how to order it (with voice), and the usual misunderstandings between countries.
  - **At the counter**: a large card with the local name of the cut and what to say to the butcher in the shop's language (es, pt, en, fr, it).
  - **Portions and times**: how much to buy per person and approximate times by thickness and doneness.
  - **Compare cuts**, **glossary** (35 terms, including "trap words" that change meaning between countries), **quiz**, and **favourites + shopping list** (kept in the browser; the list is shown with the names of the country you shop in).
- On each cut card: recommended doneness, substitutes, the direction of the grain drawn over the cut, and a shareable link (`#c=<cut>&p=<country>&l=<language>`, `#d=<dish>`, `#t=<tool>`).

## Layout

| Path | What |
|---|---|
| `gen/` | Python (numpy, scikit-image) SDF modelling: cow, pig, retail cuts, butcher; writes `out/meshes.bin` and `out/meshes_pork.bin` |
| `src/` | App source: `app.js`, `app_tools.js` (the "More" tab), `scene.js`, `meshlib.js`, data (`data_cuts.js`, `data_extra.js`, `data_pt.js`, `data_pork.js`, `dishes_*.txt`), CSS, HTML template |
| `build.py` | Assembles `dist/`: `index.html`, the compressed model packs (`*.pack`, via `gen/packz.py`), `sw.js`, the manifest and icons |
| `dist/` | Compiled page, ready to host |
| `test/` | Playwright screenshot tours and data validation |

## Build

```bash
pip install numpy scipy scikit-image
python gen/build_meshes.py   # -> out/meshes.bin (a few minutes)
python gen/build_pork.py     # -> out/meshes_pork.bin (seconds)
python build.py              # -> dist/
```

`out/` is not in the repository; to rebuild only the page, restore the packs first with `mkdir -p out && python gen/packz.py unpack dist/meshes.pack out/meshes.bin && python gen/packz.py unpack dist/meshes_pork.pack out/meshes_pork.bin`.

`node test/validate.js` checks the data; `node test/tools_tour.js [mobile]` (add `STEPS=pork_steps.js` for pork) walks the tools in headless Chromium and writes screenshots to `out/`; `node test/offline_test.js` checks model caching, offline start-up and data saver.

### Download size

| | before | now |
|---|---|---|
| Beef models | 3.4 MB (base64 + server gzip) | 1.4 MB |
| Pork models | 2.3 MB | 0.9 MB |

The `.pack` format reorders vertices by first use, stores indices as distances behind the newest vertex, positions as 12-bit deltas and normals/colours as per-channel deltas, then gzips. The browser inflates it with `DecompressionStream`, so the 3D view needs Chrome 80+, Firefox 113+ or Safari 16.4+; on older browsers everything except the 3D view still works.

Serve `dist/` with any static server (`python -m http.server -d dist`). Three.js r128 is served from `dist/` itself. The service worker only registers over http(s), so use a local server rather than opening the file.

## Caveats

Brasil, UK, France and Italy names and many dish→cut mappings come from the author's knowledge, not source-checked. Chile, Venezuela, México, Argentina→España and Colombian regional names were checked against USDA FSIS, USMEF, SIPSA and Nacameh documents.

Doneness names for Colombia, México, Brasil, Italy and Argentina were checked against local press and trade sources; Chile, Venezuela, Spain and France come from the author's knowledge. Temperatures are the usual chef ranges and sources disagree by a few degrees. Portions and cooking times are rules of thumb. The grain overlay follows the direction used to texture each model, so it is approximate. In Portuguese the one-line recipe descriptions are still shown in Spanish. `validate.js` reports 66 dish/method mismatches that predate these features and are handled at run time.

Pork cut names per country and the pork dish→cut mappings come from the author's knowledge and were not source-checked; the Chilean and Venezuelan names and the baby-back-rib names outside the US are the least certain. The pig is modelled about 1.6× life size so it fills the same plinth as the steer.

## Live

https://karlosll91.github.io/BeefAtlas/ (deployed from `dist/` by `.github/workflows/pages.yml`). The "ask Don Rafa" free-form answers and voice need the Claude artifact host; on GitHub Pages the built-in dish/cut search still works.
