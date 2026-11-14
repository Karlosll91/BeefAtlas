"""Screenshot helper: python3 test/shot.py out.png "viewer.html?e=0.5&yaw=0.6" [w h]"""
import sys, os, subprocess, time, socket
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765


def ensure_server():
    s = socket.socket()
    try:
        s.connect(('127.0.0.1', PORT)); s.close(); return
    except OSError:
        pass
    subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT,
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    time.sleep(0.8)


def shots(jobs, w=1280, h=800, wait=600):
    ensure_server()
    three = open(os.path.join(ROOT, 'test', 'three.min.js')).read()
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': w, 'height': h})
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        pg.route('**/three.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=three))
        for out, url in jobs:
            pg.goto('http://127.0.0.1:%d/%s' % (PORT, url))
            try:
                pg.wait_for_function('document.title === "ready"', timeout=60000)
            except Exception as e:
                errs.append('timeout ' + url)
            pg.wait_for_timeout(wait)
            pg.screenshot(path=out)
        b.close()
    for e in [x for x in errs if 'GPU stall' not in x][:12]:
        print(e[:400])


if __name__ == '__main__':
    a = sys.argv[1:]
    w = int(a[2]) if len(a) > 2 else 1280
    h = int(a[3]) if len(a) > 3 else 800
    shots([(a[0], a[1])], w, h)
