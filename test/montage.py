import sys
sys.path.insert(0, '/home/claude/carniceria/test')
from shot import shots
from PIL import Image
O = '/home/claude/carniceria/out/'
def cuts(out='cm.png', x='0.6'):
    u = 'test/viewer.html?f=../out/cuts_test.bin&x=' + x
    jobs = []
    for r, tz in enumerate((-0.62, -0.28, 0.06, 0.4, 0.74)):
        for c, tx in enumerate((-0.92, 0.0, 0.92)):
            jobs.append((O + 't%d%d.png' % (r, c), u + '&yaw=0.0&pitch=1.0&d=1.25&t=%g,0,%g' % (tx, tz)))
    shots(jobs, 900, 330, wait=300)
    im = Image.new('RGB', (2700, 1650))
    for r in range(5):
        for c in range(3):
            im.paste(Image.open(O + 't%d%d.png' % (r, c)), (c * 900, r * 330))
    im.save(O + out)
if __name__ == '__main__':
    cuts(*sys.argv[1:])
