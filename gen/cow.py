"""Brahman steer as an SDF, split into primal pieces. Head toward -X, Y up, metres."""
import numpy as np
from sdf import *

SIDES = (1.0, -1.0)


def body(P):
    """Whole-animal hide surface."""
    d = ellipsoid(P, (-0.42, 1.03, 0), (0.42, 0.40, 0.30))            # chest
    d = smin(d, ellipsoid(P, (0.08, 1.02, 0), (0.52, 0.385, 0.345)), 0.14)  # barrel
    d = smin(d, ellipsoid(P, (0.62, 1.10, 0), (0.44, 0.335, 0.315)), 0.14)  # loin / rump
    d = smin(d, ellipsoid(P, (0.30, 1.30, 0), (0.62, 0.12, 0.17)), 0.10)   # top line
    d = smin(d, ellipsoid(P, (-0.36, 1.455, 0), (0.20, 0.135, 0.11)), 0.08)  # hump
    d = smin(d, capsule(P, (-0.58, 1.14, 0), (-0.98, 1.30, 0), 0.27, 0.155, zs=0.70), 0.10)  # neck
    d = smin(d, ellipsoid(P, (-0.76, 0.93, 0), (0.30, 0.215, 0.05)), 0.07)  # dewlap
    d = smin(d, ellipsoid(P, (-0.62, 0.78, 0), (0.19, 0.19, 0.16)), 0.09)   # brisket
    d = smin(d, ellipsoid(P, (0.98, 1.20, 0), (0.14, 0.17, 0.20)), 0.10)    # tail head / pins
    for s in SIDES:
        d = smin(d, ellipsoid(P, (-0.52, 1.00, 0.20 * s), (0.215, 0.33, 0.135)), 0.09)   # shoulder
        d = smin(d, ellipsoid(P, (0.80, 0.93, 0.155 * s), (0.275, 0.37, 0.175)), 0.10)  # thigh
        d = smin(d, ellipsoid(P, (0.50, 1.27, 0.255 * s), (0.10, 0.07, 0.06)), 0.09)  # hip hook
        # front leg
        d = smin(d, capsule(P, (-0.50, 0.82, 0.19 * s), (-0.50, 0.47, 0.19 * s), 0.105, 0.062), 0.07)
        d = smin(d, sphere(P, (-0.505, 0.455, 0.19 * s), 0.068), 0.03)
        d = smin(d, capsule(P, (-0.50, 0.45, 0.19 * s), (-0.50, 0.15, 0.19 * s), 0.052, 0.047), 0.02)
        d = smin(d, capsule(P, (-0.50, 0.14, 0.19 * s), (-0.535, 0.045, 0.19 * s), 0.056, 0.072), 0.025)
        # hind leg
        d = smin(d, capsule(P, (0.86, 0.80, 0.17 * s), (0.99, 0.51, 0.17 * s), 0.125, 0.064), 0.08)
        d = smin(d, sphere(P, (1.00, 0.50, 0.17 * s), 0.068), 0.03)
        d = smin(d, capsule(P, (0.99, 0.50, 0.17 * s), (0.94, 0.15, 0.17 * s), 0.052, 0.046), 0.02)
        d = smin(d, capsule(P, (0.94, 0.14, 0.17 * s), (0.905, 0.045, 0.17 * s), 0.056, 0.072), 0.025)
    # head
    h = ellipsoid(P, (-1.10, 1.36, 0), (0.175, 0.155, 0.128))
    h = smin(h, capsule(P, (-1.14, 1.31, 0), (-1.385, 1.135, 0), 0.118, 0.088, zs=0.92), 0.06)
    h = smin(h, ellipsoid(P, (-1.19, 1.205, 0), (0.15, 0.075, 0.085)), 0.05)   # jaw
    for s in SIDES:
        h = smin(h, sphere(P, (-1.165, 1.425, 0.085 * s), 0.05), 0.04)       # brow
        # droopy ear
        base = np.array([-1.03, 1.385, 0.125 * s]); tip = np.array([-0.995, 1.17, 0.235 * s])
        fr = frame(tip - base, (1, 0, 0.35 * s))
        h = smin(h, oellipsoid(P, (base + tip) / 2 + np.array([0, 0, 0.012 * s]), fr, (0.135, 0.066, 0.03)), 0.03)
        # horn
        h = smin(h, capsule(P, (-1.035, 1.47, 0.075 * s), (-0.975, 1.605, 0.135 * s), 0.034, 0.012), 0.02)
        # nostril
        h = smax(h, -sphere(P, (-1.475, 1.13, 0.045 * s), 0.022), 0.012)
    d = smin(d, h, 0.07)
    # tail
    t = capsule(P, (1.10, 1.31, 0), (1.215, 1.05, 0), 0.036, 0.024)
    t = smin(t, capsule(P, (1.215, 1.05, 0), (1.225, 0.64, 0), 0.024, 0.017), 0.03)
    t = smin(t, ellipsoid(P, (1.225, 0.52, 0), (0.042, 0.125, 0.042)), 0.03)
    d = smin(d, t, 0.04)
    # ground plane cut (flat hooves)
    d = np.maximum(d, -(P[:, 1] - 0.0))
    return d.astype(F)


BBOX = ((-1.56, -0.02, -0.42), (1.32, 1.72, 0.42))

# ---------------------------------------------------------------- partition (side-view seeds, x/y)
# id: list of segments ((x0,y0),(x1,y1)); optional bias (m) grows the region.
SEEDS = {
    'ch': dict(segs=[((-1.32, 1.20), (-1.10, 1.36))], bias=0.06),
    'ps': dict(segs=[((-0.80, 1.24), (-0.70, 1.10)), ((-0.84, 0.95), (-0.78, 0.86))]),
    'mo': dict(segs=[((-0.44, 1.56), (-0.28, 1.56))], bias=-0.035),
    'ag': dict(segs=[((-0.46, 1.27), (-0.30, 1.27))]),
    'pl': dict(segs=[((-0.60, 1.00), (-0.42, 0.93))]),
    'pe': dict(segs=[((-0.70, 0.74), (-0.42, 0.68))]),
    'mf': dict(segs=[((-0.50, 0.60), (-0.50, 0.50))], bias=-0.02),
    'pf': dict(segs=[((-0.50, 0.33), (-0.53, 0.03))], bias=-0.03),
    'ba': dict(segs=[((-0.13, 1.32), (0.07, 1.32))]),
    'cs': dict(segs=[((-0.16, 1.05), (0.10, 1.05))]),
    'fa': dict(segs=[((-0.20, 0.76), (0.12, 0.75))]),
    'la': dict(segs=[((0.27, 1.33), (0.45, 1.33))]),
    'va': dict(segs=[((0.33, 1.07), (0.47, 1.05))]),
    'sb': dict(segs=[((0.36, 0.80), (0.52, 0.84))]),
    'ca': dict(segs=[((0.66, 1.30), (0.80, 1.28))]),
    'pa': dict(segs=[((0.97, 1.30), (1.02, 1.26))]),
    'co': dict(segs=[((0.62, 1.05), (0.70, 1.02))], bias=-0.01),
    'bp': dict(segs=[((0.66, 0.84), (0.72, 0.72))]),
    'cp': dict(segs=[((0.86, 0.96), (0.90, 0.78))]),
    'bo': dict(segs=[((0.98, 1.10), (1.03, 1.00))]),
    'mc': dict(segs=[((1.05, 0.86), (1.05, 0.76))], bias=-0.01),
    'mh': dict(segs=[((0.91, 0.62), (0.97, 0.52))], bias=-0.02),
    'ph': dict(segs=[((0.985, 0.38), (0.92, 0.03))], bias=-0.03),
    'cl': dict(segs=[((1.19, 1.10), (1.225, 0.45))], bias=-0.055),
}
IDS = list(SEEDS)


def seed_dist(X, Y, seeds=None):
    """(n_ids, ...) biased distances to each seed set."""
    seeds = SEEDS if seeds is None else seeds
    out = []
    for k in seeds:
        s = seeds[k]
        d = None
        for a, b in s['segs']:
            dd = seg2(X, Y, a, b)
            d = dd if d is None else np.minimum(d, dd)
        out.append(d - s.get('bias', 0.0))
    return np.stack(out, 0)


def preview(path='out/cow_side.png', h=0.012, spec=None):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    body, BBOX, SEEDS = (spec.body, spec.BBOX, spec.SEEDS) if spec else (globals()['body'], globals()['BBOX'], globals()['SEEDS'])
    IDS = list(SEEDS)
    seed_dist = lambda X, Y: globals()['seed_dist'](X, Y, SEEDS)
    xs, ys, zs = grid_points(*BBOX, h)
    vol = eval_grid(body, xs, ys, zs)
    side = vol.min(axis=2)       # x,y
    top = vol.min(axis=1)        # x,z
    fig, ax = plt.subplots(2, 1, figsize=(16, 15), gridspec_kw=dict(height_ratios=[1.74, 0.84]))
    X, Y = np.meshgrid(xs, ys, indexing='ij')
    D = seed_dist(X, Y)
    lab = np.argmin(D, 0).astype(float)
    lab[side > 0] = np.nan
    ax[0].pcolormesh(xs, ys, lab.T, cmap='tab20', alpha=0.75, shading='auto')
    ax[0].contour(xs, ys, side.T, levels=[0], colors='k', linewidths=1.5)
    for i, k in enumerate(IDS):
        for a, b in SEEDS[k]['segs']:
            ax[0].plot([a[0], b[0]], [a[1], b[1]], 'k-', lw=2)
        a, b = SEEDS[k]['segs'][0]
        ax[0].text((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02, k, fontsize=13, weight='bold')
    ax[0].set_aspect('equal'); ax[0].grid(True, alpha=0.4)
    ax[0].set_xticks(np.arange(-1.6, 1.4, 0.1)); ax[0].set_yticks(np.arange(0, 1.8, 0.1))
    ax[0].tick_params(labelsize=7)
    ax[1].contourf(xs, zs, top.T, levels=[-10, 0], colors=['#d9d2c5'])
    ax[1].contour(xs, zs, top.T, levels=[0], colors='k', linewidths=1.5)
    ax[1].set_aspect('equal'); ax[1].grid(True, alpha=0.4)
    fig.tight_layout(); fig.savefig(path, dpi=70)



# ---------------------------------------------------------------- internal cuts and bones
def i_lf(P, s):   # tenderloin (psoas), one per side, under the loin
    d = capsule(P, (0.20, 1.215, 0.062 * s), (0.50, 1.20, 0.07 * s), 0.030, 0.046)
    return smin(d, capsule(P, (0.50, 1.20, 0.07 * s), (0.80, 1.165, 0.085 * s), 0.046, 0.050), 0.02)


def i_en(P, s):   # skirt (diaphragm), thin band inside the ribs
    Q = P.copy(); Q[:, 2] = (Q[:, 2] - 0.20 * s) * 2.6 + 0.20 * s
    return capsule(Q, (-0.06, 0.84, 0.20 * s), (0.26, 1.04, 0.20 * s), 0.055, 0.050) / 2.6


def i_ha(P):      # hanger, hangs from the last ribs near the kidneys
    d = capsule(P, (0.16, 1.13, 0.028), (0.25, 0.97, 0.022), 0.034, 0.028)
    return smin(d, capsule(P, (0.16, 1.13, -0.028), (0.25, 0.97, -0.022), 0.034, 0.028), 0.012)


def i_vi(P):      # offal, in the abdominal cavity
    return ellipsoid(P, (-0.02, 0.90, 0), (0.30, 0.13, 0.15))


INTERNAL = [('lf', i_lf, True), ('en', i_en, True), ('ha', i_ha, False), ('vi', i_vi, False)]


def bones(P):
    d = capsule(P, (-1.00, 1.335, 0), (-0.56, 1.27, 0), 0.034, 0.036)        # neck vertebrae
    d = np.minimum(d, capsule(P, (-0.56, 1.27, 0), (-0.25, 1.315, 0), 0.036))
    d = np.minimum(d, capsule(P, (-0.25, 1.315, 0), (0.92, 1.30, 0), 0.036, 0.034))   # back
    d = np.minimum(d, capsule(P, (0.92, 1.30, 0), (1.10, 1.30, 0), 0.03, 0.02))
    d = np.minimum(d, capsule(P, (1.215, 1.05, 0), (1.225, 0.66, 0), 0.013, 0.009))  # tail
    d = np.minimum(d, capsule(P, (1.10, 1.30, 0), (1.215, 1.05, 0), 0.018, 0.013))
    for s in SIDES:
        d = np.minimum(d, ellipsoid(P, (-0.50, 1.13, 0.215 * s), (0.085, 0.17, 0.017)))            # scapula
        d = np.minimum(d, capsule(P, (-0.57, 0.97, 0.21 * s), (-0.47, 0.80, 0.20 * s), 0.033, 0.03))  # humerus
        d = np.minimum(d, capsule(P, (-0.48, 0.77, 0.19 * s), (-0.50, 0.48, 0.19 * s), 0.028, 0.026))  # radius
        d = np.minimum(d, capsule(P, (-0.50, 0.45, 0.19 * s), (-0.50, 0.13, 0.19 * s), 0.024, 0.022))  # cannon
        d = np.minimum(d, capsule(P, (0.50, 1.30, 0.17 * s), (0.99, 1.19, 0.11 * s), 0.03, 0.026))    # pelvis
        d = np.minimum(d, capsule(P, (0.74, 1.13, 0.17 * s), (0.80, 0.81, 0.17 * s), 0.034, 0.032))   # femur
        d = np.minimum(d, capsule(P, (0.81, 0.79, 0.17 * s), (0.985, 0.53, 0.17 * s), 0.028, 0.026))  # tibia
        d = np.minimum(d, capsule(P, (0.99, 0.49, 0.17 * s), (0.94, 0.15, 0.17 * s), 0.024, 0.022))   # hind cannon
    return d.astype(F)


# ---------------------------------------------------------------- hide colour
def mix(a, b, t):
    return a + (b - a) * t[:, None]


def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def hide_color(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    light = np.array([0.86, 0.84, 0.80], F)
    dark = np.array([0.36, 0.345, 0.335], F)
    n = fbm(P, 3.2, 3, 1)
    n2 = fbm(P, 17.0, 2, 5)
    m = sstep(-0.18, -0.62, x + 0.22 * (y - 1.0)) * sstep(0.62, 1.05, y)       # neck / shoulder / hump shading
    m = np.maximum(m, 0.75 * sstep(0.80, 0.60, y) * sstep(0.55, 0.85, x))      # lower thigh
    m = np.maximum(m, 0.55 * sstep(1.28, 1.45, y) * sstep(-0.7, -0.2, x) * sstep(0.1, -0.25, x))  # hump top
    m = np.clip(m * (0.65 + 0.7 * n), 0, 1) * 0.85
    col = mix(np.broadcast_to(light, P.shape).copy(), np.broadcast_to(dark, P.shape), m)
    col *= (0.93 + 0.14 * n2)[:, None]
    # underside slightly warmer and lighter
    col = mix(col, np.broadcast_to(np.array([0.90, 0.87, 0.82], F), P.shape), 0.5 * sstep(0.85, 0.62, y) * sstep(-0.45, -0.2, x) * sstep(0.6, 0.3, x))
    # legs: darker knees down, black hooves
    col = mix(col, np.broadcast_to(np.array([0.50, 0.48, 0.46], F), P.shape), 0.6 * sstep(0.5, 0.28, y))
    col = mix(col, np.broadcast_to(np.array([0.07, 0.06, 0.055], F), P.shape), sstep(0.105, 0.085, y))
    # muzzle, horns, ears, tail tuft
    col = mix(col, np.broadcast_to(np.array([0.13, 0.11, 0.105], F), P.shape), sstep(-1.33, -1.40, x + 0.25 * (y - 1.13)))
    horn = sstep(1.485, 1.52, y) * sstep(-0.9, -0.95, x)
    col = mix(col, np.broadcast_to(np.array([0.80, 0.74, 0.60], F), P.shape), horn)
    col = mix(col, np.broadcast_to(np.array([0.16, 0.14, 0.12], F), P.shape), horn * sstep(1.555, 1.60, y))
    ear = sstep(0.15, 0.19, np.abs(z)) * sstep(-0.93, -0.97, x) * sstep(1.40, 1.36, y) * sstep(-1.12, -1.08, x)
    col = mix(col, np.broadcast_to(np.array([0.42, 0.40, 0.385], F), P.shape), 0.7 * ear)
    eye = sstep(0.05, 0.02, np.sqrt((x + 1.205) ** 2 + (y - 1.372) ** 2)) * sstep(0.07, 0.10, np.abs(z))
    col = mix(col, np.broadcast_to(np.array([0.20, 0.18, 0.17], F), P.shape), 0.6 * eye)
    tuft = sstep(0.72, 0.62, y) * sstep(1.15, 1.18, x)
    col = mix(col, np.broadcast_to(np.array([0.10, 0.09, 0.085], F), P.shape), tuft)
    return np.clip(col, 0, 1).astype(F)


def rim(Vc):
    """Thickness of the fat cover seen on the cut faces."""
    r = 0.007 + 0.013 * fbm(Vc, 6.0, 2, 9) + 0.010 * sstep(1.15, 1.4, Vc[:, 1]) + 0.012 * sstep(0.85, 0.65, Vc[:, 1]) * sstep(-0.75, -0.4, Vc[:, 0]) * sstep(0.7, 0.4, Vc[:, 0])
    r = r * sstep(0.30, 0.55, Vc[:, 1])
    return np.where(Vc[:, 0] < -0.98, r * 0.3, r)


SIDED = ('mf', 'pf', 'mh', 'ph')
PREFIX = 'cow.'


# ---------------------------------------------------------------- piece builder
def build_pieces(pack, h=0.016, gap=0.006, log=print, spec=None):
    """Split an animal into pieces. spec: a module shaped like this one (body, BBOX, SEEDS, INTERNAL, bones, hide_color, rim, SIDED, PREFIX); default is the cow."""
    import time
    t0 = time.time()
    G_ = globals()
    A = lambda k: getattr(spec, k) if spec is not None else G_[k]
    body, BBOX, SEEDS, INTERNAL, bones, hide_color, rim, SIDED, PREFIX = (A(k) for k in ('body', 'BBOX', 'SEEDS', 'INTERNAL', 'bones', 'hide_color', 'rim', 'SIDED', 'PREFIX'))
    IDS = list(SEEDS)
    seed_dist = lambda X, Y: G_['seed_dist'](X, Y, SEEDS)
    xs, ys, zs = grid_points(*BBOX, h)
    lo = np.array([xs[0], ys[0], zs[0]], F)
    B = eval_grid(body, xs, ys, zs)
    X2, Y2 = np.meshgrid(xs, ys, indexing='ij')
    D2 = seed_dist(X2, Y2)                              # (nid, nx, ny)
    srt = np.sort(D2, 0)
    Zg = zs[None, None, :]
    ints = []
    for name, fn, sided in INTERNAL:
        for s in (SIDES if sided else (0,)):
            f = (lambda P, fn=fn, s=s: fn(P, s)) if sided else fn
            ints.append(dict(name=name, side=s, fn=f, vol=eval_grid(f, xs, ys, zs)))
    carve_vol = None
    for it in ints:
        v = gap - it['vol']
        carve_vol = v if carve_vol is None else np.maximum(carve_vol, v)

    def carve(P):
        v = None
        for it in ints:
            c = gap - it['fn'](P)
            v = c if v is None else np.maximum(v, c)
        return v

    # one smooth hide mesh for the whole animal
    HV, HF = march(B, lo, h)
    HF = orient(HV, HF, body)
    HV = project(body, HV, 2)
    HN = normalize(grad(body, HV))
    Hao = sdf_ao(body, HV, HN, strength=0.9)
    Hcol = (hide_color(HV) ** 2.2) * (0.5 + 0.5 * Hao)[:, None]
    HD = seed_dist(HV[:, 0], HV[:, 1])
    Hsrt = np.sort(HD, 0)
    log('grid %s, hide mesh %d verts, %.1fs' % (B.shape, len(HV), time.time() - t0))

    pieces = []
    for i, k in enumerate(IDS):
        di = D2[i]
        other = np.where(srt[0] == di, srt[1], srt[0])
        part2 = ((di - other) / 2 + gap / 2).astype(F)
        hother = np.where(Hsrt[0] == HD[i], Hsrt[1], Hsrt[0])
        hs = ((HD[i] - hother) / 2 + gap / 2).astype(F)
        for s in (SIDES if k in SIDED else (0,)):
            G = np.maximum(part2[:, :, None], carve_vol)
            hsv = hs
            if s:
                G = np.maximum(G, -s * Zg + gap / 2)
                hsv = np.maximum(hs, -s * HV[:, 2] + gap / 2)

            def g(P, i=i, s=s):
                D = seed_dist(P[:, 0], P[:, 1])
                di_ = D[i].copy(); D[i] = 1e9
                v = (di_ - D.min(0)) / 2 + gap / 2
                v = np.maximum(v, carve(P))
                if s:
                    v = np.maximum(v, -s * P[:, 2] + gap / 2)
                return v.astype(F)
            pieces.append(dict(cut=k, side=s, G=G, g=g, hs=hsv, internal=False))
    for it in ints:
        pieces.append(dict(cut=it['name'], side=it['side'], G=it['vol'], g=it['fn'], internal=True))

    tot_v = tot_f = 0
    for pc in pieces:
        g = pc['g']
        name = pc['cut'] + ('' if not pc['side'] else ('L' if pc['side'] > 0 else 'R'))
        if pc['internal']:
            inside = np.argwhere(pc['G'] < 0)
        else:
            inside = np.argwhere(np.maximum(B, pc['G']) < 0)
        if len(inside) == 0:
            log('EMPTY', name); continue
        a = np.maximum(inside.min(0) - 3, 0); b = np.minimum(inside.max(0) + 4, B.shape)
        cen_w = lo + inside.mean(0) * h
        meta = dict(cut=pc['cut'], side=int(pc['side']), cen=[float(x) for x in cen_w], internal=bool(pc['internal']))
        ne = nc = 0
        # ---- hide: the whole-body mesh clipped to this region
        if not pc['internal']:
            ref = both_refiner(body, g, 3)
            Ve, Fe = clip_mesh(HV, HF, pc['hs'], refine=ref)
            if len(Fe):
                Ne = normalize(grad(body, Ve))
                ao = sdf_ao(body, Ve, Ne, strength=0.9)
                col = (hide_color(Ve) ** 2.2) * (0.5 + 0.5 * ao)[:, None]
                pack.add(PREFIX + name + '.hide', Ve, Ne, Fe, np.concatenate([col, ao[:, None]], 1), dict(kind='hide', **meta))
                ne = len(Ve); tot_v += ne; tot_f += len(Fe)
        # ---- cut faces: the partition surface clipped to the inside of the body
        sub = pc['G'][a[0]:b[0], a[1]:b[1], a[2]:b[2]]
        Vc, Fcc = march(sub, lo + a * h, h)
        if len(Fcc):
            Fcc = orient(Vc, Fcc, g)
            V0 = Vc.copy()
            Vp = project(g, Vc, 2)
            ok = (length(Vp - V0) < 0.9 * h)
            Vc = np.where(ok[:, None], Vp, V0).astype(F)
            if not pc['internal']:
                Vc, Fcc = clip_mesh(Vc, Fcc, body(Vc), refine=both_refiner(body, g, 3))
        if len(Fcc):
            Nc = normalize(grad(g, Vc))
            depth = -body(Vc)
            if pc['internal']:
                fatF = np.full(len(Vc), 0.05, F)
                boneF = np.full(len(Vc), 0.05, F)
            else:
                fatF = depth - rim(Vc)
                boneF = bones(Vc)
            aux = np.stack([np.clip(fatF / 0.05, -1, 1) * 0.5 + 0.5, np.clip(boneF / 0.05, -1, 1) * 0.5 + 0.5,
                            np.ones(len(Vc), F), np.ones(len(Vc), F)], 1)
            pack.add(PREFIX + name + '.flesh', Vc, Nc, Fcc, aux, dict(kind='flesh', **meta))
            nc = len(Vc); tot_v += nc; tot_f += len(Fcc)
        log('%-4s hide=%6d  cut=%6d  %.1fs' % (name, ne, nc, time.time() - t0))
    log('%s total verts %d tris %d' % (PREFIX, tot_v, tot_f))


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        preview()
    else:
        pk = Pack()
        build_pieces(pk, h=float(sys.argv[1]) if len(sys.argv) > 1 else 0.02)
        n = pk.write('out/cow_test.bin')
        print('bytes', n)
