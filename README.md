# Beef Atlas · Atlas de la Res

A procedurally generated 3D butcher shop for beef. Pick your country, find the cut a recipe calls for, and see what it's called everywhere else.

- **3D shop**: a Brahman steer you can orbit and pull apart, a display case with 36 modelled retail cuts, and a close-up cutting block (Three.js r128).
- **Cut-name translator**: 36 cuts × 11 country name sets (Colombia, México, Argentina/Uruguay, Chile, Venezuela, Brasil, España, US, UK, France, Italy), plus Colombian regional names.
- **Don Rafa, the butcher**: search a dish, cut or cooking method and get the best cut, why, and alternatives, highlighted on the cow. Free-form questions use the Claude `sample` capability when hosted as a Claude artifact.
- **1,217 dishes** from 96 cuisines mapped to a best cut, plus 15 cooking methods.
- Spanish / English / Portuguese interface.
- **"More" tab** with seven tools:
  - **Doneness**: a temperature slider that recolours a sliced steak on the block, the name of each point in the 11 countries, how to order it (with voice), and the usual misunderstandings between countries.
  - **At the counter**: a large card with the local name of the cut and what to say to the butcher in the shop's language (es, pt, en, fr, it).
  - **Portions and times**: how much to buy per person and approximate times by thickness and doneness.
  - **Compare cuts**, **glossary** (35 terms, including "trap words" that change meaning between countries), **quiz**, and **favourites + shopping list** (kept in the browser; the list is shown with the names of the country you shop in).
- On each cut card: recommended doneness, substitutes, the direction of the grain drawn over the cut, and a shareable link (`#c=<cut>&p=<country>&l=<language>`, `#d=<dish>`, `#t=<tool>`).

## Layout

| Path | What |
|---|---|
| `gen/` | Python (numpy, scikit-image) SDF modelling: cow, 36 cuts, butcher; writes `out/meshes.bin` |
| `src/` | App source: `app.js`, `app_tools.js` (the "More" tab), `scene.js`, `meshlib.js`, data (`data_cuts.js`, `data_extra.js`, `data_pt.js`, `dishes_*.txt`), CSS, HTML template |
| `build.py` | Assembles `dist/index.html` + `dist/meshes.txt` (base64 meshes) |
| `dist/` | Compiled page, ready to host |
| `test/` | Playwright screenshot tours and data validation |

## Build

```bash
pip install numpy scipy scikit-image
python gen/build_meshes.py   # -> out/meshes.bin (a few minutes)
python build.py              # -> dist/
```

`out/` is not in the repository; to rebuild only the page, restore the mesh pack first with `mkdir -p out && base64 -d dist/meshes.txt > out/meshes.bin`.

`node test/validate.js` checks the data; `node test/tools_tour.js [mobile]` walks the tools in headless Chromium and writes screenshots to `out/`.

Serve `dist/` with any static server (`python -m http.server -d dist`). Three.js is loaded from cdnjs.

## Caveats

Brasil, UK, France and Italy names and many dish→cut mappings come from the author's knowledge, not source-checked. Chile, Venezuela, México, Argentina→España and Colombian regional names were checked against USDA FSIS, USMEF, SIPSA and Nacameh documents.

Doneness names for Colombia, México, Brasil, Italy and Argentina were checked against local press and trade sources; Chile, Venezuela, Spain and France come from the author's knowledge. Temperatures are the usual chef ranges and sources disagree by a few degrees. Portions and cooking times are rules of thumb. The grain overlay follows the direction used to texture each model, so it is approximate. In Portuguese the one-line recipe descriptions are still shown in Spanish. `validate.js` reports 66 dish/method mismatches that predate these features and are handled at run time.

## Live

https://karlosll91.github.io/BeefAtlas/ (deployed from `dist/` by `.github/workflows/pages.yml`). The "ask Don Rafa" free-form answers and voice need the Claude artifact host; on GitHub Pages the built-in dish/cut search still works.
