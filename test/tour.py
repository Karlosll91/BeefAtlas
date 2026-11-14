import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app_shot import run
which = sys.argv[1] if len(sys.argv) > 1 else 'desk'
if which == 'desk':
    run([('click', '#views button[data-v="cow"]'), ('wait', 3500), ('shot',),
         ('eval', 'document.querySelector("#explode").value=70, document.querySelector("#explode").dispatchEvent(new Event("input",{bubbles:true})), 1'), ('wait', 4000), ('shot',),
         ('click', '#views button[data-v="case"]'), ('wait', 3500), ('shot',),
         ('click', '#views button[data-v="block"]'), ('wait', 3500), ('shot',),
         ('click', '#tabs button:nth-child(2)'), ('wait', 600), ('shot',),
         ('eval', 'document.documentElement.scrollWidth + "x" + document.documentElement.scrollHeight')], out_prefix='t')
elif which == 'tabs':
    run([('click', '#tabs button:nth-child(3)'), ('wait', 600), ('shot',),
         ('click', '#tabs button:nth-child(4)'), ('wait', 600), ('shot',),
         ('click', '#tabs button:nth-child(1)'), ('type', '#q', 'bris'), ('wait', 500), ('shot',),
         ('press', '#q', 'Enter'), ('wait', 2500), ('shot',),
         ('click', '#tabs button:nth-child(1)'), ('click', '#methods button[data-method="smoke"]'), ('wait', 2500), ('shot',),
         ('type', '#q', 'lomo saltado'), ('press', '#q', 'Enter'), ('wait', 2500), ('shot',), ('click', '#langBtn'), ('wait', 1500), ('shot',), ('type', '#q', 'something for a birthday bbq for ten'), ('press', '#q', 'Enter'), ('wait', 1200), ('shot',),
         ('click', '#gear'), ('wait', 400), ('shot',)], out_prefix='u', dark=True)
elif which == 'mob':
    run([('shot',), ('click', '#views button[data-v="cow"]'), ('wait', 3500), ('shot',),
         ('click', '#tabs button:nth-child(2)'), ('wait', 800), ('shot',),
         ('click', '#views button[data-v="block"]'), ('wait', 3500), ('shot',),
         ('eval', 'document.documentElement.scrollWidth + "x" + document.documentElement.scrollHeight + " " + innerWidth + "x" + innerHeight')], w=390, h=800, out_prefix='m', mobile=True)
if which == 'cuts':
    steps = [('click', '#views button[data-v="block"]'), ('wait', 1500)]
    for c in sys.argv[2].split(','):
        steps += [('click', '#tabs button:nth-child(4)'), ('wait', 200), ('click', 'tr[data-cut="%s"]' % c), ('wait', 1800), ('shot',)]
    run(steps, w=1100, h=700, out_prefix='k')
if which == 'views':
    run([('shot',), ('click', '#views button[data-v="case"]'), ('wait', 2500), ('shot',)], out_prefix='v')
    run([('shot',), ('click', '#views button[data-v="case"]'), ('wait', 2500), ('shot',)], w=1900, h=900, out_prefix='w')
