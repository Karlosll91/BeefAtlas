import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot import ensure_server, ROOT, PORT
from playwright.sync_api import sync_playwright
ensure_server()
three = open(os.path.join(ROOT, 'test', 'three.min.js')).read()
logs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1400, 'height': 820})
    pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e) + ' ' + str(getattr(e, 'stack', ''))[:600]))
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text) if 'GPU stall' not in m.text else None)
    pg.on('requestfailed', lambda r: logs.append('REQFAIL ' + r.url))
    pg.route('**/three.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=three))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    pg.goto('http://127.0.0.1:%d/dist/index.html' % PORT)
    pg.wait_for_timeout(int(sys.argv[1]) if len(sys.argv) > 1 else 12000)
    print(pg.evaluate('({shop: !!window.__shop, done: document.querySelector("#loading").className, panel: document.querySelector("#panel").getBoundingClientRect().width, ans: document.querySelector("#answer").innerHTML.length})'))
    pg.screenshot(path=os.path.join(ROOT, 'out', 'dbg.png'))
    b.close()
for l in logs[:30]: print(l[:700])
