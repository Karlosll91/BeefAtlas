"""The butcher: a stocky clay figure in rigid parts (torso, head, arms). Faces +Z, metres."""
import numpy as np
from sdf import *

SKIN = (0.80, 0.56, 0.44)
SKIN_D = (0.70, 0.45, 0.35)
SHIRT = (0.93, 0.92, 0.89)
APRON = (0.12, 0.20, 0.17)
STRAP = (0.82, 0.78, 0.68)
HAIR = (0.30, 0.27, 0.25)
STACHE = (0.22, 0.17, 0.14)
HAT = (0.95, 0.95, 0.93)
TROUS = (0.13, 0.14, 0.16)
DARK = (0.05, 0.045, 0.04)


def colored(parts, P):
    """parts: list of (field, colour). Returns union distance and colour of the nearest part."""
    ds = np.stack([p[0] for p in parts], 0)
    k = np.argmin(ds, 0)
    cols = np.array([p[1] for p in parts], F)
    return ds.min(0), cols[k]


def torso(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    body = ellipsoid(P, (0, 1.24, 0), (0.25, 0.27, 0.175))
    body = smin(body, ellipsoid(P, (0, 1.05, 0.035), (0.265, 0.21, 0.215)), 0.08)
    body = smin(body, capsule(P, (-0.20, 1.415, 0), (0.20, 1.415, 0), 0.10), 0.07)
    legs = box(P, (0, 0.47, 0), (0.215, 0.47, 0.15), 0.07)
    neck = capsule(P, (0, 1.46, 0.005), (0, 1.56, 0.012), 0.062)
    base = smin(body, legs, 0.06)
    # apron: an offset shell over the front
    ap = np.maximum(base - 0.012, -(z - 0.045))
    ap = np.maximum(ap, y - 1.36 + 0.9 * np.maximum(np.abs(x) - 0.12, 0))       # bib narrows to the chest
    ap = np.maximum(ap, 0.42 - y)
    strap = np.maximum(base - 0.016, np.abs(y - 0.985) - 0.022)                 # waist tie
    for s in (1, -1):
        st = capsule(P, (0.11 * s, 1.35, 0.15), (0.075 * s, 1.50, -0.02), 0.014)
        strap = np.minimum(strap, st)
    return [(base, SHIRT), (neck, SKIN), (ap, APRON), (strap, STRAP)]


def torso_color(P, d, col):
    y = P[:, 1]
    # trousers below the shirt line
    low = (y < 0.90) & (np.abs(col - np.array(SHIRT, F)).sum(1) < 0.01)
    col = np.where(low[:, None], np.array(TROUS, F), col)
    return col


def head(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    sk = ellipsoid(P, (0, 0.13, 0.0), (0.108, 0.128, 0.118))
    sk = smin(sk, ellipsoid(P, (0, 0.06, 0.02), (0.098, 0.085, 0.10)), 0.05)     # jaw / cheeks
    sk = smin(sk, ellipsoid(P, (0, 0.105, 0.118), (0.026, 0.03, 0.032)), 0.02)   # nose
    for s in (1, -1):
        sk = smin(sk, ellipsoid(P, (0.108 * s, 0.115, -0.005), (0.016, 0.034, 0.024)), 0.012)   # ears
        sk = smin(sk, sphere(P, (0.058 * s, 0.07, 0.085), 0.034), 0.03)                          # cheeks
    eyes = np.minimum(sphere(P, (0.043, 0.137, 0.1), 0.0165), sphere(P, (-0.043, 0.137, 0.1), 0.0165))
    brows = None
    for s in (1, -1):
        b = capsule(P, (0.02 * s, 0.163, 0.108), (0.068 * s, 0.168, 0.094), 0.0095, 0.007)
        brows = b if brows is None else np.minimum(brows, b)
    st = None
    for s in (1, -1):
        m = capsule(P, (0.006 * s, 0.07, 0.122), (0.058 * s, 0.05, 0.10), 0.019, 0.011)
        st = m if st is None else smin(st, m, 0.01)
    hair = np.maximum(ellipsoid(P, (0, 0.135, -0.012), (0.113, 0.125, 0.118)), np.maximum(z - 0.035 + 0.5 * (y - 0.19), 0.07 - y + 0.4 * z))
    hat = cyl_y(P, (0, 0.262, -0.005), 0.112, 0.048, 0.016)
    hat = np.maximum(hat, -(cyl_y(P, (0, 0.33, -0.005), 0.098, 0.03, 0.01)))     # paper cap with a recessed top
    band = cyl_y(P, (0, 0.222, -0.005), 0.115, 0.012, 0.004)
    return [(sk, SKIN), (eyes, DARK), (brows, STACHE), (st, STACHE), (hair, HAIR), (hat, HAT), (band, APRON)]


def head_color(P, d, col):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    skin = np.abs(col - np.array(SKIN, F)).sum(1) < 0.01
    blush = np.exp(-(((np.abs(x) - 0.06) / 0.03) ** 2 + ((y - 0.075) / 0.028) ** 2)) * (z > 0.05)
    nose = np.exp(-((x / 0.03) ** 2 + ((y - 0.105) / 0.03) ** 2)) * (z > 0.1)
    c2 = col * (1 - 0.0) + 0
    red = np.array([0.80, 0.36, 0.32], F)
    t = np.clip(0.5 * blush + 0.35 * nose, 0, 1)[:, None] * skin[:, None]
    return col * (1 - t) + red * t


def upper_arm(P, s):
    d = capsule(P, (0, 0, 0), (0, -0.29, 0), 0.078, 0.062)
    cuff = torus_y(P, (0, -0.25, 0), 0.062, 0.016)
    return [(d, SHIRT), (cuff, SHIRT)]


def forearm(P, s):
    d = capsule(P, (0, 0.03, 0), (0, -0.25, 0), 0.058, 0.043)
    return [(d, SKIN)]


def hand(P, s):
    d = ellipsoid(P, (0, -0.045, 0), (0.042, 0.058, 0.026))
    d = smin(d, capsule(P, (0.03 * s * -1, -0.02, 0.012), (0.058 * s * -1, -0.062, 0.03), 0.017, 0.013), 0.012)   # thumb
    for i, dx in enumerate((-0.027, -0.009, 0.009, 0.027)):
        d = smin(d, capsule(P, (dx, -0.08, 0), (dx * 1.1, -0.118 - (0.008 if i in (1, 2) else 0), 0.004), 0.0125, 0.0105), 0.008)
    return [(d, SKIN)]


def mesh_part(pack, name, parts_fn, bbox, h, pivot=(0, 0, 0), post=None, meta=None):
    fn = lambda P: colored(parts_fn(P), P)[0]
    xs, ys, zs = grid_points(bbox[0], bbox[1], h)
    vol = eval_grid(fn, xs, ys, zs)
    V, Fc = march(vol, (xs[0], ys[0], zs[0]), h)
    Fc = orient(V, Fc, fn)
    V0 = V.copy(); Vp = project(fn, V, 2, e=0.0015)
    V = np.where((length(Vp - V0) < 0.8 * h)[:, None], Vp, V0).astype(F)
    # split along colour boundaries so every part gets a crisp edge
    parts = parts_fn(V)
    ds = np.stack([p[0] for p in parts], 0)
    Vs, Fs, Cs = [], [], []
    off = 0
    for k in range(len(parts)):
        others = np.delete(ds, k, 0).min(0) if len(parts) > 1 else np.full(len(V), 1.0, F)
        Vk, Fk = clip_mesh(V, Fc, (ds[k] - others).astype(F)) if len(parts) > 1 else (V, Fc)
        if len(Fk) == 0:
            continue
        Vs.append(Vk); Fs.append(Fk + off); off += len(Vk)
        Cs.append(np.broadcast_to(np.array(parts[k][1], F), Vk.shape).copy())
    V = np.concatenate(Vs, 0); Fc = np.concatenate(Fs, 0); col = np.concatenate(Cs, 0)
    N = normalize(grad(fn, V, 0.002))
    if post:
        col = post(V, None, col)
    ao = sdf_ao(fn, V, N, dists=(0.012, 0.03, 0.07), strength=0.8)
    col = (np.clip(col, 0, 1) ** 2.2) * (0.5 + 0.5 * ao)[:, None]
    V = V - np.asarray(pivot, F)
    m = dict(kind='clay', pivot=[float(v) for v in pivot])
    if meta:
        m.update(meta)
    pack.add(name, V, N, Fc, np.concatenate([col, ao[:, None]], 1), m)
    return len(V)


def build_butcher(pack, log=print):
    n = 0
    n += mesh_part(pack, 'man.torso', torso, ((-0.36, -0.01, -0.26), (0.36, 1.60, 0.30)), 0.017, post=torso_color)
    n += mesh_part(pack, 'man.head', head, ((-0.15, -0.05, -0.15), (0.15, 0.33, 0.17)), 0.0068, post=head_color, meta=dict(at=[0, 1.555, 0.012]))
    for s, tag in ((1, 'L'), (-1, 'R')):
        n += mesh_part(pack, 'man.upper' + tag, lambda P, s=s: upper_arm(P, s), ((-0.1, -0.33, -0.1), (0.1, 0.1, 0.1)), 0.012, meta=dict(at=[0.285 * s, 1.405, 0.0]))
        n += mesh_part(pack, 'man.fore' + tag, lambda P, s=s: forearm(P, s), ((-0.08, -0.31, -0.08), (0.08, 0.1, 0.08)), 0.011, meta=dict(at=[0, -0.29, 0]))
        n += mesh_part(pack, 'man.hand' + tag, lambda P, s=s: hand(P, s), ((-0.08, -0.15, -0.05), (0.08, 0.03, 0.06)), 0.0058, meta=dict(at=[0, -0.25, 0]))
    log('butcher verts', n)


if __name__ == '__main__':
    pk = Pack()
    build_butcher(pk)
    # test layout: assemble in rest pose
    at = {}
    for e in pk.entries:
        nm = e['name']
        if nm == 'man.torso':
            e['at'] = [0, 0, 0]
        elif nm == 'man.head':
            pass
        elif 'upper' in nm:
            at[nm[-1]] = e['at']
        elif 'fore' in nm:
            a = at[nm[-1]]; e['at'] = [a[0], a[1] - 0.29, a[2]]
        elif 'hand' in nm:
            a = at[nm[-1]]; e['at'] = [a[0], a[1] - 0.54, a[2]]
    print('bytes', pk.write('out/man_test.bin'))
