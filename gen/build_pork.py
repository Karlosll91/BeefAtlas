"""Build the pig and the pork cuts into out/meshes_pork.bin (loaded only when the shop switches to pork)."""
import sys, time
sys.path.insert(0, 'gen')
from sdf import Pack
import cow, pig, cuts, cuts_pork

t = time.time()
pk = Pack()
cow.build_pieces(pk, h=0.0195, log=lambda *a: None, spec=pig)
mats = cuts.build_cuts(pk, log=lambda *a: None, reg=cuts_pork.K)
n = pk.write('out/meshes_pork.bin', dict(mats=mats))
print('meshes', len(pk.entries), 'verts', sum(e['nv'] for e in pk.entries), 'bytes', n, '%.0fs' % (time.time() - t))
