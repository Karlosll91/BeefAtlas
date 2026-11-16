import re, os, shutil
R = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
tpl = rd('src/index.tpl.html')
css = rd('src/style.css')
dishes = ''.join(rd('src/dishes_%d.txt' % i) for i in range(1, 6)) + rd('src/dishes_pork.txt')
dishes = '\n'.join(l for l in dishes.split('\n') if l.strip() and not l.startswith('#'))
assert '</script' not in dishes
js = '\n'.join(rd('src/' + f) for f in ('meshlib.js', 'data_cuts.js', 'data_extra.js', 'data_pt.js', 'data_pork.js', 'scene.js', 'app_tools.js', 'app.js'))
assert '</script' not in js
out = tpl.replace('/*CSS*/', css).replace('/*DISHES*/', dishes).replace('/*JS*/', js)
os.makedirs(os.path.join(R, 'dist'), exist_ok=True)
open(os.path.join(R, 'dist/index.html'), 'w', encoding='utf-8').write(out)
import base64
for f in ('meshes', 'meshes_pork'):
    open(os.path.join(R, 'dist/%s.txt' % f), 'wb').write(base64.b64encode(open(os.path.join(R, 'out/%s.bin' % f), 'rb').read()))
if os.path.exists(os.path.join(R, 'dist/meshes.bin')): os.remove(os.path.join(R, 'dist/meshes.bin'))
print('index.html', len(out.encode()), 'bytes; dishes', dishes.count('\n') + 1)
