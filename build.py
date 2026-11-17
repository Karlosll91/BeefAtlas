import re, os, sys, shutil, hashlib, json
R = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(R, 'gen'))
import packz
rd = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
D = lambda p: os.path.join(R, 'dist', p)
os.makedirs(os.path.join(R, 'dist'), exist_ok=True)

# model packs: compact + gzip, named in the page with a content hash so a cached copy is never stale
packs = {}
for sp, f in (('beef', 'meshes'), ('pork', 'meshes_pork')):
    n = packz.pack(os.path.join(R, 'out/%s.bin' % f), D(f + '.pack'))
    h = hashlib.sha256(open(D(f + '.pack'), 'rb').read()).hexdigest()[:10]
    packs[sp] = dict(url='%s.pack?v=%s' % (f, h), bytes=n)
    for old in (f + '.txt', f + '.bin'):
        if os.path.exists(D(old)): os.remove(D(old))

tpl = rd('src/index.tpl.html')
css = rd('src/style.css')
dishes = ''.join(rd('src/dishes_%d.txt' % i) for i in range(1, 6)) + rd('src/dishes_pork.txt')
dishes = '\n'.join(l for l in dishes.split('\n') if l.strip() and not l.startswith('#'))
assert '</script' not in dishes
js = '\n'.join(rd('src/' + f) for f in ('meshlib.js', 'data_cuts.js', 'data_extra.js', 'data_pt.js', 'data_pork.js', 'scene.js', 'app_tools.js', 'app.js'))
js, k = re.subn(r'/\*PACKS\*/.*?/\*END\*/', lambda m: json.dumps(packs), js, flags=re.S)
assert k == 1 and '</script' not in js
out = tpl.replace('/*CSS*/', css).replace('/*DISHES*/', dishes).replace('/*JS*/', js)
open(D('index.html'), 'w', encoding='utf-8').write(out)

# installable-app files: three.js served from here (works offline), icons, manifest, service worker
shutil.copy(os.path.join(R, 'test/three.min.js'), D('three.min.js'))
for f in ('manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'):
    shutil.copy(os.path.join(R, 'src/pwa', f), D(f))
ver = hashlib.sha256(out.encode() + open(D('three.min.js'), 'rb').read()).hexdigest()[:10]
open(D('sw.js'), 'w', encoding='utf-8').write(rd('src/sw.js').replace('/*VERSION*/', ver))
print('index.html', len(out.encode()), 'bytes; dishes', dishes.count('\n') + 1, '; packs', {k: v['bytes'] for k, v in packs.items()}, '; shell', ver)
