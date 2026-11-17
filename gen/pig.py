"""Pig as an SDF, split into primal pieces. Head toward -X, Y up.
Modelled at display size (about 1.6x life) so it fills the same plinth as the steer."""
import numpy as np
from sdf import *
from cow import sstep, mix

SIDES = (1.0, -1.0)
PREFIX = 'pig.'
SIDED = ('p_cdF', 'p_ptF', 'p_cdH', 'p_ptH')


def body(P):
    d = ellipsoid(P, (-0.44, 0.86, 0), (0.44, 0.40, 0.33))                 # chest
    d = smin(d, ellipsoid(P, (0.10, 0.83, 0), (0.56, 0.40, 0.355)), 0.14)  # barrel
    d = smin(d, ellipsoid(P, (0.64, 0.88, 0), (0.43, 0.40, 0.34)), 0.14)   # rump
    d = smin(d, ellipsoid(P, (0.12, 1.14, 0), (0.78, 0.10, 0.20)), 0.10)   # back line
    d = smin(d, ellipsoid(P, (0.02, 0.50, 0), (0.50, 0.10, 0.25)), 0.10)   # belly
    d = smin(d, capsule(P, (-0.66, 0.88, 0), (-0.98, 0.86, 0), 0.34, 0.265, zs=0.86), 0.10)   # neck
    d = smin(d, ellipsoid(P, (-0.90, 0.63, 0), (0.20, 0.15, 0.21)), 0.09)  # jowl
    for s in SIDES:
        d = smin(d, ellipsoid(P, (-0.50, 0.74, 0.20 * s), (0.22, 0.31, 0.145)), 0.09)   # shoulder
        d = smin(d, ellipsoid(P, (0.76, 0.74, 0.175 * s), (0.28, 0.36, 0.185)), 0.10)   # ham
        # front leg
        d = smin(d, capsule(P, (-0.50, 0.58, 0.20 * s), (-0.50, 0.30, 0.20 * s), 0.105, 0.066), 0.07)
        d = smin(d, capsule(P, (-0.50, 0.30, 0.20 * s), (-0.525, 0.10, 0.20 * s), 0.062, 0.056), 0.02)
        d = smin(d, capsule(P, (-0.525, 0.10, 0.20 * s), (-0.56, 0.04, 0.20 * s), 0.058, 0.064), 0.02)
        # hind leg
        d = smin(d, capsule(P, (0.80, 0.58, 0.185 * s), (0.93, 0.33, 0.185 * s), 0.125, 0.066), 0.08)
        d = smin(d, capsule(P, (0.93, 0.33, 0.185 * s), (0.88, 0.10, 0.185 * s), 0.060, 0.055), 0.02)
        d = smin(d, capsule(P, (0.88, 0.10, 0.185 * s), (0.845, 0.04, 0.185 * s), 0.058, 0.064), 0.02)
    # head
    h = ellipsoid(P, (-1.10, 0.88, 0), (0.25, 0.235, 0.215))
    h = smin(h, capsule(P, (-1.22, 0.82, 0), (-1.47, 0.71, 0), 0.135, 0.098), 0.08)     # snout
    h = smin(h, ellipsoid(P, (-1.19, 0.70, 0), (0.17, 0.085, 0.12)), 0.05)              # lower jaw
    disc = np.maximum(sphere(P, (-1.43, 0.71, 0), 0.118), np.abs((P[:, 0] + 1.515) + 0.42 * (P[:, 1] - 0.71)) - 0.022)
    h = smin(h, disc, 0.018)
    for s in SIDES:
        base = np.array([-0.99, 1.05, 0.15 * s]); tip = np.array([-1.20, 1.22, 0.20 * s])   # ear, tipped forward
        fr = frame(tip - base, (0.4, 0.2, 1.0 * s))
        h = smin(h, oellipsoid(P, (base + tip) / 2, fr, (0.17, 0.105, 0.028)), 0.035)
        h = smax(h, -sphere(P, (-1.545, 0.715, 0.04 * s), 0.02), 0.01)                  # nostril
    d = smin(d, h, 0.09)
    # curly tail
    t = capsule(P, (1.04, 1.02, 0), (1.15, 1.08, 0.02), 0.034, 0.024)
    t = smin(t, torus_y(rot(P, 'z', -1.2, (1.17, 1.02, 0.02)), (1.17, 1.02, 0.02), 0.058, 0.018), 0.02)
    d = smin(d, t, 0.03)
    d = np.maximum(d, -(P[:, 1] - 0.0))
    return d.astype(F)


BBOX = ((-1.62, -0.02, -0.44), (1.30, 1.36, 0.44))

SEEDS = {
    'p_ca': dict(segs=[((-1.42, 0.72), (-1.10, 0.90))], bias=0.04),
    'p_pp': dict(segs=[((-0.98, 0.60), (-0.86, 0.55))], bias=-0.01),
    'p_bo': dict(segs=[((-0.66, 1.10), (-0.42, 1.10))]),
    'p_pa': dict(segs=[((-0.64, 0.76), (-0.46, 0.68))]),
    'p_cdF': dict(segs=[((-0.50, 0.42), (-0.50, 0.33))], bias=-0.02),
    'p_ptF': dict(segs=[((-0.515, 0.20), (-0.55, 0.03))], bias=-0.03),
    'p_ch': dict(segs=[((-0.20, 1.14), (0.04, 1.14))]),
    'p_lo': dict(segs=[((0.20, 1.14), (0.44, 1.14))]),
    'p_co': dict(segs=[((-0.22, 0.86), (0.06, 0.85))]),
    'p_pn': dict(segs=[((-0.22, 0.57), (0.40, 0.58)), ((0.27, 0.86), (0.40, 0.84))]),
    'p_pi': dict(segs=[((0.72, 1.00), (0.80, 0.72))], bias=0.03),
    'p_cdH': dict(segs=[((0.88, 0.44), (0.92, 0.35))], bias=-0.02),
    'p_ptH': dict(segs=[((0.915, 0.21), (0.86, 0.03))], bias=-0.03),
    'p_ra': dict(segs=[((1.10, 1.02), (1.22, 1.08))], bias=-0.09),
}


def i_so(P, s):   # tenderloin, one per side, under the loin
    d = capsule(P, (0.18, 1.01, 0.065 * s), (0.44, 0.99, 0.075 * s), 0.028, 0.044)
    return smin(d, capsule(P, (0.44, 0.99, 0.075 * s), (0.66, 0.96, 0.085 * s), 0.044, 0.046), 0.02)


def i_vi(P):      # offal, in the abdominal cavity
    return ellipsoid(P, (-0.02, 0.72, 0), (0.30, 0.13, 0.15))


INTERNAL = [('p_so', i_so, True), ('p_vi', i_vi, False)]


def bones(P):
    d = capsule(P, (-1.02, 1.00, 0), (-0.50, 1.08, 0), 0.032, 0.034)                  # neck
    d = np.minimum(d, capsule(P, (-0.50, 1.08, 0), (0.92, 1.10, 0), 0.034, 0.032))     # back
    d = np.minimum(d, capsule(P, (0.92, 1.10, 0), (1.10, 1.04, 0), 0.026, 0.014))
    for s in SIDES:
        d = np.minimum(d, ellipsoid(P, (-0.50, 0.92, 0.215 * s), (0.08, 0.15, 0.016)))               # scapula
        d = np.minimum(d, capsule(P, (-0.57, 0.78, 0.21 * s), (-0.48, 0.60, 0.20 * s), 0.03, 0.028))   # humerus
        d = np.minimum(d, capsule(P, (-0.49, 0.57, 0.20 * s), (-0.50, 0.31, 0.20 * s), 0.027, 0.025))  # radius
        d = np.minimum(d, capsule(P, (-0.50, 0.29, 0.20 * s), (-0.53, 0.08, 0.20 * s), 0.022, 0.02))
        d = np.minimum(d, capsule(P, (0.48, 1.08, 0.17 * s), (0.95, 0.98, 0.12 * s), 0.028, 0.024))    # pelvis
        d = np.minimum(d, capsule(P, (0.70, 0.94, 0.18 * s), (0.78, 0.62, 0.185 * s), 0.032, 0.03))    # femur
        d = np.minimum(d, capsule(P, (0.79, 0.60, 0.185 * s), (0.93, 0.35, 0.185 * s), 0.027, 0.025))  # tibia
        d = np.minimum(d, capsule(P, (0.93, 0.32, 0.185 * s), (0.88, 0.09, 0.185 * s), 0.022, 0.02))
    return d.astype(F)


def rim(Vc):
    """Back fat is thick on a pig: up to a few centimetres along the top line, thin on the legs and head."""
    y, x = Vc[:, 1], Vc[:, 0]
    r = 0.016 + 0.014 * fbm(Vc, 6.0, 2, 9) + 0.022 * sstep(0.95, 1.2, y) + 0.012 * sstep(0.62, 0.48, y) * sstep(-0.3, -0.1, x) * sstep(0.6, 0.4, x)
    r = r * sstep(0.22, 0.46, y)
    return np.where(x < -1.0, r * 0.4, r)


def hide_color(P):
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    B = lambda c: np.broadcast_to(np.array(c, F), P.shape)
    n = fbm(P, 3.0, 3, 2)
    n2 = fbm(P, 16.0, 2, 6)
    col = mix(B((0.94, 0.72, 0.68)).copy(), B((0.88, 0.60, 0.57)), np.clip(0.2 + 0.9 * n, 0, 1))
    col = col * (0.95 + 0.10 * n2)[:, None]
    col = mix(col, B((0.97, 0.80, 0.76)), 0.6 * sstep(0.70, 0.46, y) * sstep(-0.5, -0.3, x) * sstep(0.7, 0.4, x))   # paler belly
    col = mix(col, B((0.90, 0.62, 0.58)), 0.5 * sstep(1.05, 1.2, y))                                                # rosier back
    col = mix(col, B((0.86, 0.50, 0.50)), sstep(-1.36, -1.47, x + 0.42 * (y - 0.71)))                                # snout
    col = mix(col, B((0.70, 0.36, 0.38)), sstep(-1.497, -1.512, x + 0.42 * (y - 0.71)))                              # snout disc
    ear = sstep(1.04, 1.10, y) * sstep(-0.95, -1.0, x)
    col = mix(col, B((0.87, 0.54, 0.53)), 0.8 * ear)
    eye = sstep(0.05, 0.022, np.sqrt((x + 1.235) ** 2 + (y - 0.955) ** 2)) * sstep(0.10, 0.14, np.abs(z))
    col = mix(col, B((0.55, 0.33, 0.33)), 0.7 * eye)
    col = mix(col, B((0.84, 0.60, 0.56)), 0.5 * sstep(0.36, 0.16, y))                                                # legs
    col = mix(col, B((0.30, 0.22, 0.18)), sstep(0.085, 0.065, y))                                                    # hooves
    col = mix(col, B((0.86, 0.52, 0.52)), sstep(1.06, 1.12, x) * sstep(0.9, 0.96, y))                                # tail
    return np.clip(col, 0, 1).astype(F)


if __name__ == '__main__':
    import sys, cow
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        cow.preview('out/pig_side.png', spec=sys.modules[__name__])
    else:
        pk = Pack()
        cow.build_pieces(pk, h=float(sys.argv[1]) if len(sys.argv) > 1 else 0.02, spec=sys.modules[__name__])
        print('bytes', pk.write('out/pig_test.bin'))
