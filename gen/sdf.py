"""Small SDF toolkit (numpy) + marching-cubes meshing + binary mesh packing.

All field functions take P: (N,3) float32 array and return (N,) float32 distances
(negative inside). Distances are approximate but close to metric near the surface.
"""
import json
import struct
import numpy as np
from skimage import measure

F = np.float32


# ---------------------------------------------------------------- primitives
def length(v):
    return np.sqrt(np.sum(v * v, axis=-1))


def sphere(P, c, r):
    return length(P - np.asarray(c, F)) - r


def ellipsoid(P, c, r):
    r = np.asarray(r, F)
    q = (P - np.asarray(c, F))
    k0 = length(q / r)
    k1 = length(q / (r * r))
    return np.where(k1 > 1e-9, k0 * (k0 - 1.0) / np.maximum(k1, 1e-9), -np.min(r)).astype(F)


def capsule(P, a, b, r1, r2=None, zs=1.0):
    """Segment a-b with radius lerp r1->r2. zs<1 flattens laterally (z)."""
    if r2 is None:
        r2 = r1
    a = np.asarray(a, F); b = np.asarray(b, F)
    Q = P
    if zs != 1.0:
        Q = P.copy(); Q[:, 2] = (Q[:, 2] - a[2]) / zs + a[2]
        b = b.copy(); b[2] = (b[2] - a[2]) / zs + a[2]
    ab = b - a
    t = np.clip(((Q - a) @ ab) / float(ab @ ab + 1e-12), 0, 1)
    d = length(Q - (a + t[:, None] * ab)) - (r1 + (r2 - r1) * t)
    return (d * min(zs, 1.0)).astype(F) if zs != 1.0 else d.astype(F)


def box(P, c, h, r=0.0):
    q = np.abs(P - np.asarray(c, F)) - (np.asarray(h, F) - r)
    return (length(np.maximum(q, 0)) + np.minimum(np.max(q, axis=1), 0) - r).astype(F)


def cyl_y(P, c, r, hh, rnd=0.0):
    """Cylinder with axis Y, radius r, half-height hh."""
    q = P - np.asarray(c, F)
    dx = np.sqrt(q[:, 0] ** 2 + q[:, 2] ** 2) - (r - rnd)
    dy = np.abs(q[:, 1]) - (hh - rnd)
    return (np.minimum(np.maximum(dx, dy), 0) + np.sqrt(np.maximum(dx, 0) ** 2 + np.maximum(dy, 0) ** 2) - rnd).astype(F)


def torus_y(P, c, R, r):
    q = P - np.asarray(c, F)
    d = np.sqrt(q[:, 0] ** 2 + q[:, 2] ** 2) - R
    return (np.sqrt(d * d + q[:, 1] ** 2) - r).astype(F)


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return (b + (a - b) * h - k * h * (1 - h)).astype(F)


def smax(a, b, k):
    return -smin(-a, -b, k)


def union(*ds, k=0.0):
    out = ds[0]
    for d in ds[1:]:
        out = smin(out, d, k)
    return out


def rot(P, axis, ang, c=(0, 0, 0)):
    """Rotate points about axis ('x','y','z') through c by ang radians (inverse transform for SDFs: pass -ang)."""
    c = np.asarray(c, F)
    Q = P - c
    ca, sa = np.cos(ang), np.sin(ang)
    x, y, z = Q[:, 0], Q[:, 1], Q[:, 2]
    if axis == 'x':
        Q = np.stack([x, ca * y - sa * z, sa * y + ca * z], 1)
    elif axis == 'y':
        Q = np.stack([ca * x + sa * z, y, -sa * x + ca * z], 1)
    else:
        Q = np.stack([ca * x - sa * y, sa * x + ca * y, z], 1)
    return (Q + c).astype(F)


def seg2(X, Y, a, b):
    """2D distance from points (X,Y) to segment a-b."""
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay
    t = np.clip(((X - ax) * dx + (Y - ay) * dy) / (dx * dx + dy * dy + 1e-12), 0, 1)
    return np.sqrt((X - ax - t * dx) ** 2 + (Y - ay - t * dy) ** 2)


# ---------------------------------------------------------------- noise
def _hash(ix, iy, iz):
    n = (ix * 374761393 + iy * 668265263 + iz * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    n = n ^ (n >> 16)
    return (n & 0xFFFF).astype(F) / 65535.0


def vnoise(P, freq=1.0, seed=0):
    Q = P * freq + seed * 17.13
    I = np.floor(Q).astype(np.int64)
    f = (Q - I).astype(F)
    u = f * f * (3 - 2 * f)
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
                out = out + w * _hash(I[:, 0] + dx, I[:, 1] + dy, I[:, 2] + dz)
    return out.astype(F)


def fbm(P, freq=1.0, oct=3, seed=0):
    a, s, tot = 0.5, 0.0, 0.0
    for i in range(oct):
        s = s + a * vnoise(P, freq * (2 ** i), seed + i * 7)
        tot += a
        a *= 0.5
    return (s / tot).astype(F)


# ---------------------------------------------------------------- meshing
def grid_points(lo, hi, h):
    lo = np.asarray(lo, F); hi = np.asarray(hi, F)
    n = np.maximum(np.ceil((hi - lo) / h).astype(int) + 1, 2)
    xs = lo[0] + np.arange(n[0], dtype=F) * h
    ys = lo[1] + np.arange(n[1], dtype=F) * h
    zs = lo[2] + np.arange(n[2], dtype=F) * h
    return xs, ys, zs


def eval_grid(fn, xs, ys, zs, chunk=400000):
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing='ij')
    P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1).astype(F)
    out = np.empty(len(P), F)
    for i in range(0, len(P), chunk):
        out[i:i + chunk] = fn(P[i:i + chunk])
    return out.reshape(X.shape)


def grad(fn, P, e=0.002):
    g = np.empty_like(P)
    for i in range(3):
        d = np.zeros(3, F); d[i] = e
        g[:, i] = (fn(P + d) - fn(P - d)) / (2 * e)
    return g


def normalize(v):
    n = length(v)[:, None]
    return (v / np.maximum(n, 1e-9)).astype(F)


def march(vol, lo, h):
    """Marching cubes on a volume sampled at lo + ijk*h. Returns verts (N,3), faces (M,3)."""
    if vol.min() >= 0 or vol.max() <= 0:
        return np.zeros((0, 3), F), np.zeros((0, 3), np.int32)
    v, f, _, _ = measure.marching_cubes(vol, level=0.0, spacing=(h, h, h))
    v = (v + np.asarray(lo, F)).astype(F)
    return v, f.astype(np.int32)


def project(fn, V, iters=2, e=0.002):
    """Newton-project vertices onto the zero set of fn."""
    V = V.copy()
    for _ in range(iters):
        d = fn(V)
        g = grad(fn, V, e)
        g2 = np.sum(g * g, 1)
        V -= (d / np.maximum(g2, 1e-6))[:, None] * g
    return V.astype(F)


def orient(V, Fc, fn):
    """Make triangle winding agree with outward gradient of fn."""
    if len(Fc) == 0:
        return Fc
    a, b, c = V[Fc[:, 0]], V[Fc[:, 1]], V[Fc[:, 2]]
    n = np.cross(b - a, c - a)
    cen = (a + b + c) / 3
    idx = np.random.RandomState(0).choice(len(Fc), min(len(Fc), 2000), replace=False)
    g = grad(fn, cen[idx])
    if np.sum(np.sum(n[idx] * g, 1)) < 0:
        Fc = Fc[:, ::-1].copy()
    return Fc


def compact(V, Fc, *attrs):
    """Drop unreferenced vertices."""
    used = np.unique(Fc)
    remap = -np.ones(len(V), np.int64); remap[used] = np.arange(len(used))
    return (V[used], remap[Fc].astype(np.int32)) + tuple(a[used] for a in attrs)


def sdf_ao(fn, V, N, dists=(0.02, 0.05, 0.11), strength=1.0):
    """Cheap ambient occlusion from the field."""
    occ = np.zeros(len(V), F)
    w = 1.0
    for d in dists:
        occ += w * np.clip((d - fn(V + N * d)) / d, 0, 1)
        w *= 0.6
    occ /= sum(0.6 ** i for i in range(len(dists)))
    return np.clip(1.0 - strength * occ, 0, 1).astype(F)


# ---------------------------------------------------------------- packing
class Pack:
    def __init__(self):
        self.entries = []
        self.blobs = []
        self.size = 0

    def _add_blob(self, arr):
        b = arr.tobytes()
        off = self.size
        self.blobs.append(b)
        self.size += len(b)
        pad = (-self.size) % 4
        if pad:
            self.blobs.append(b'\0' * pad); self.size += pad
        return off

    def add(self, name, V, N, Fc, col, meta=None):
        """V (n,3) float, N (n,3) unit normals, Fc (m,3) int, col (n,4) float 0..1."""
        V = np.asarray(V, F); nv = len(V)
        lo = V.min(0); hi = V.max(0)
        ext = np.maximum(hi - lo, 1e-6)
        q = np.round((V - lo) / ext * 65535).astype(np.uint16)
        n8 = np.clip(np.round(np.asarray(N) * 127), -127, 127).astype(np.int8)
        n8 = np.concatenate([n8, np.zeros((nv, 1), np.int8)], 1)
        c8 = np.clip(np.round(np.asarray(col) * 255), 0, 255).astype(np.uint8)
        idx = np.asarray(Fc).ravel()
        i16 = nv <= 65535
        e = dict(name=name, nv=int(nv), ni=int(len(idx)), lo=[float(x) for x in lo], hi=[float(x) for x in hi], i16=bool(i16))
        e['p'] = self._add_blob(q)
        e['n'] = self._add_blob(n8)
        e['c'] = self._add_blob(c8)
        e['i'] = self._add_blob(idx.astype(np.uint16 if i16 else np.uint32))
        if meta:
            e.update(meta)
        self.entries.append(e)
        return e

    def write(self, path, extra=None):
        head = json.dumps(dict(meshes=self.entries, extra=extra or {}), separators=(',', ':')).encode()
        pad = (-(8 + len(head))) % 4
        with open(path, 'wb') as f:
            f.write(b'CARN')
            f.write(struct.pack('<I', len(head) + pad))
            f.write(head + b' ' * pad)
            for b in self.blobs:
                f.write(b)
        return 8 + len(head) + pad + self.size


# ---------------------------------------------------------------- clipping
def oellipsoid(P, c, axes, r):
    """Ellipsoid with orthonormal axes (3x3 rows) and radii r."""
    q = (P - np.asarray(c, F)) @ np.asarray(axes, F).T
    return ellipsoid(q, (0, 0, 0), r)


def frame(u, hint=(1, 0, 0)):
    u = np.asarray(u, float); u = u / np.linalg.norm(u)
    w = np.asarray(hint, float); w = w - u * (w @ u); w = w / np.linalg.norm(w)
    n = np.cross(u, w)
    return np.stack([u, w, n]).astype(F)


def clip_mesh(V, Fc, s, refine=None):
    """Keep the part of the mesh where the per-vertex scalar s < 0. New vertices are created on the
    zero crossing of each cut edge; refine(P)->P may polish them."""
    if len(Fc) == 0:
        return V, Fc
    ins = s < 0
    ti = ins[Fc]
    cnt = ti.sum(1)
    full = Fc[cnt == 3]
    new_pts = {}
    edge_a, edge_b = [], []

    def edge_ids(a, b):
        # a inside-or-outside ordering does not matter for the key
        lo_ = np.minimum(a, b).astype(np.int64); hi_ = np.maximum(a, b).astype(np.int64)
        return lo_ * (len(V) + 1) + hi_

    out_tris = [full]
    one = Fc[cnt == 1]; t1 = ti[cnt == 1]
    two = Fc[cnt == 2]; t2 = ti[cnt == 2]
    # rotate so the lone vertex comes first
    if len(one):
        k = np.argmax(t1, 1)
        one = np.stack([one[np.arange(len(one)), k], one[np.arange(len(one)), (k + 1) % 3], one[np.arange(len(one)), (k + 2) % 3]], 1)
    if len(two):
        k = np.argmin(t2, 1)
        two = np.stack([two[np.arange(len(two)), k], two[np.arange(len(two)), (k + 1) % 3], two[np.arange(len(two)), (k + 2) % 3]], 1)
    keys = []
    pairs = []
    if len(one):
        pairs += [(one[:, 0], one[:, 1]), (one[:, 0], one[:, 2])]
    if len(two):
        pairs += [(two[:, 0], two[:, 1]), (two[:, 0], two[:, 2])]
    if not pairs:
        return compact(V, full) if len(full) else (V[:0], full)
    A = np.concatenate([p[0] for p in pairs]); B_ = np.concatenate([p[1] for p in pairs])
    key = edge_ids(A, B_)
    uk, first, inv = np.unique(key, return_index=True, return_inverse=True)
    a = A[first]; b = B_[first]
    t = (s[a] / (s[a] - s[b])).astype(F)
    NP = V[a] + (V[b] - V[a]) * t[:, None]
    if refine is not None:
        NP = refine(NP.astype(F))
    nid = len(V) + inv
    Vn = np.concatenate([V, NP.astype(F)], 0)
    o = 0
    if len(one):
        n1 = len(one)
        ab = nid[o:o + n1]; ac = nid[o + n1:o + 2 * n1]; o += 2 * n1
        out_tris.append(np.stack([one[:, 0], ab, ac], 1))
    if len(two):
        n2 = len(two)
        ab = nid[o:o + n2]; ac = nid[o + n2:o + 2 * n2]
        out_tris.append(np.stack([ab, two[:, 1], two[:, 2]], 1))
        out_tris.append(np.stack([ab, two[:, 2], ac], 1))
    Fn = np.concatenate(out_tris, 0).astype(np.int32)
    # drop degenerate triangles
    a_, b_, c_ = Vn[Fn[:, 0]], Vn[Fn[:, 1]], Vn[Fn[:, 2]]
    ar = length(np.cross(b_ - a_, c_ - a_))
    Fn = Fn[ar > 1e-10]
    return compact(Vn, Fn)


def both_refiner(fa, fb, iters=3):
    def r(P):
        for _ in range(iters):
            P = project(fa, P, 1)
            P = project(fb, P, 1)
        return P
    return r
