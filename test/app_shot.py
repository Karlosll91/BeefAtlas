"""Run the built app in headless Chromium and take screenshots after scripted steps."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot import ensure_server, ROOT, PORT
from playwright.sync_api import sync_playwright

LOCALE = 'es-CO'

def run(steps, w=1400, h=820, dark=False, out_prefix='a', mobile=False):
    ensure_server()
    three = open(os.path.join(ROOT, 'test', 'three.min.js')).read()
    logs = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'])
        ctx = b.new_context(viewport={'width': w, 'height': h}, color_scheme='dark' if dark else 'light', device_scale_factor=1, has_touch=mobile, is_mobile=mobile, reduced_motion='reduce', locale=LOCALE)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text) if m.type in ('error',) else None)
        pg.route('**/three.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=three))
        pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        pg.goto('http://127.0.0.1:%d/dist/index.html' % PORT)
        try:
            pg.wait_for_function('!!window.__shop && document.querySelector("#loading").classList.contains("done")', timeout=90000)
        except Exception as e:
            logs.append('TIMEOUT waiting for shop')
        pg.wait_for_timeout(3500)
        i = 0
        for st in steps:
            kind = st[0]
            if kind == 'shot':
                pg.screenshot(path=os.path.join(ROOT, 'out', '%s%d.png' % (out_prefix, i))); i += 1
            elif kind == 'click':
                pg.click(st[1])
            elif kind == 'type':
                pg.fill(st[1], st[2])
            elif kind == 'press':
                pg.press(st[1], st[2])
            elif kind == 'wait':
                pg.wait_for_timeout(st[1])
            elif kind == 'eval':
                r = pg.evaluate(st[1]); logs.append('EVAL ' + json.dumps(r)[:600])
        b.close()
    for l in [x for x in logs if 'GPU stall' not in x][:25]:
        print(l[:500])

if __name__ == '__main__':
    run([('shot',), ('click', '#examples button:nth-child(2)'), ('wait', 3500), ('shot',), ('click', '.ticket'), ('wait', 2500), ('shot',), ('click', '#views button[data-v="case"]'), ('wait', 3000), ('shot',),
         ('eval', 'document.documentElement.scrollWidth + "x" + document.documentElement.scrollHeight')])
