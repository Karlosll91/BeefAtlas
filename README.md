# Beef Atlas · Atlas de la Res

A procedurally generated 3D butcher shop for beef. Pick your country, find the cut a recipe calls for, and see what it's called everywhere else.

- **3D shop**: a Brahman steer you can orbit and pull apart, a display case with 36 modelled retail cuts, and a close-up cutting block (Three.js r128).
- **Cut-name translator**: 36 cuts × 11 country name sets (Colombia, México, Argentina/Uruguay, Chile, Venezuela, Brasil, España, US, UK, France, Italy), plus Colombian regional names.
- **Don Rafa, the butcher**: search a dish, cut or cooking method and get the best cut, why, and alternatives, highlighted on the cow. Free-form questions use the Claude `sample` capability when hosted as a Claude artifact.
- **1,217 dishes** from 96 cuisines mapped to a best cut, plus 15 cooking methods.
- Spanish / English interface.

## Layout

| Path | What |
|---|---|
| `gen/` | Python (numpy, scikit-image) SDF modelling: cow, 36 cuts, butcher; writes `out/meshes.bin` |
| `src/` | App source: `app.js`, `scene.js`, `meshlib.js`, data (`data_cuts.js`, `dishes_*.txt`), CSS, HTML template |
| `build.py` | Assembles `dist/index.html` + `dist/meshes.txt` (base64 meshes) |
| `dist/` | Compiled page, ready to host |
| `test/` | Playwright screenshot tours and data validation |

## Build

```bash
pip install numpy scipy scikit-image
python gen/build_meshes.py   # -> out/meshes.bin (a few minutes)
python build.py              # -> dist/
```

Serve `dist/` with any static server (`python -m http.server -d dist`). Three.js is loaded from cdnjs.

## Caveats

Brasil, UK, France and Italy names and many dish→cut mappings come from the author's knowledge, not source-checked. Chile, Venezuela, México, Argentina→España and Colombian regional names were checked against USDA FSIS, USMEF, SIPSA and Nacameh documents.

## Live

https://karlosll91.github.io/BeefAtlas/ (deployed from `dist/` by `.github/workflows/pages.yml`). The "ask Don Rafa" free-form answers and voice need the Claude artifact host; on GitHub Pages the built-in dish/cut search still works.
