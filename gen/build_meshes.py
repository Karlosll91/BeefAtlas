"""Build everything into out/meshes.bin"""
import sys, time
sys.path.insert(0, 'gen')
from sdf import Pack
import cow, cuts, butcher

t = time.time()
pk = Pack()
cow.build_pieces(pk, h=0.0195, log=lambda *a: None)
nc = len(pk.entries)
mats = cuts.build_cuts(pk, log=lambda *a: None)
butcher.build_butcher(pk, log=lambda *a: None)
n = pk.write('out/meshes.bin', dict(mats=mats))
v = sum(e['nv'] for e in pk.entries)
print('meshes', len(pk.entries), 'verts', v, 'bytes', n, '%.0fs' % (time.time() - t))
