"""Retail pork cuts for the display case. Units: metres. X length, Y up, Z depth."""
import numpy as np
from sdf import *
import cuts as B
import pig
from cuts import ell2, poly2, slab, bump, two, sstep, XZ, FAR

K = {}       # registry: name -> dict(build, bbox, h, mat)
PK = dict(meat='#d98d8e', meat2='#c27377', fat='#f7efe6')        # loin and leg: pale pink
DK = dict(meat='#c4636a', meat2='#a84c55', fat='#f7efe6')        # shoulder, collar, cheek: darker
SKIN = '#f3dccf'   # fat under raw skin reads pinkish, not white
SK = dict(meat='#f0cdbd', meat2='#e4b7a5', fat='#fbf4ea', marb=0.0, grain=0.0, gloss=0.3, rough=0.6)   # skin


def cut(name, bbox, h, mat):
    return B.cut(name, bbox, h, mat, reg=K)


# ============================================================ loin
@cut('plo', ((-0.17, -0.01, -0.08), (0.17, 0.11, 0.08)), 0.0058,
     dict(PK, marb=0.12, marbScale=85, grain=0.85, grainDir=[1, 0, 0]))
def loin(P):
    Q = P.copy(); Q[:, 2] = Q[:, 2] / 1.3
    d = capsule(Q, (-0.12, 0.046, 0), (0.12, 0.046, 0), 0.047, 0.045)
    d = np.maximum(d, np.abs(P[:, 0]) - 0.145)
    d = np.maximum(d, -(P[:, 1] - 0.003)) + bump(P, 18, 0.005, 3)
    fat = (0.079 - P[:, 1]) + 0.016 * (fbm(P, 14, 2, 4) - 0.5) + 0.15 * np.abs(P[:, 2]) ** 1.5
    return d, fat, None, None


@cut('pso', ((-0.17, -0.01, -0.05), (0.15, 0.06, 0.05)), 0.0042,
     dict(PK, meat='#cf7b80', meat2='#b6636a', marb=0.03, marbScale=90, grain=0.8, grainDir=[1, 0, 0], gloss=0.5))
def tenderloin(P):
    Q = P.copy(); Q[:, 1] = Q[:, 1] / 0.8
    d = capsule(Q, (-0.13, 0.026, 0.0), (-0.02, 0.028, 0.0), 0.014, 0.026)
    d = smin(d, capsule(Q, (-0.02, 0.028, 0.0), (0.10, 0.026, 0.004), 0.026, 0.021), 0.012)
    d = np.maximum(d * 0.8, -(P[:, 1] - 0.002)) + bump(P, 30, 0.003, 2)
    return d, None, None, None


@cut('pch', ((-0.12, -0.03, -0.09), (0.12, 0.03, 0.09)), 0.0042,
     dict(PK, marb=0.14, marbScale=80, grain=0.85, grainDir=[0, 1, 0], marrow=0.004, seamW=0.002))
def chop(P):
    X, Z = XZ(P)
    eye = ell2(X, Z, (0.0, 0.004), (0.066, 0.045), 0.08)
    tail = ell2(X, Z, (0.074, -0.022), (0.03, 0.028), 0.4)
    bone2 = poly2(X, Z, [(-0.082, -0.058), (-0.062, -0.06), (-0.052, 0.04), (-0.066, 0.062), (-0.09, 0.05)], 0.004)
    o = smin(smin(eye, tail, 0.014), bone2, 0.008) + bump(P * [1, 0, 1], 26, 0.004, 5)
    d = slab(P, o, 0.013, 0.005)
    fat = np.maximum(-(o + 0.008 + bump(P, 40, 0.005, 2)), -(Z - 0.012))
    fat = np.minimum(fat, np.maximum(-(o + 0.006), -(X - 0.05)))
    seam = np.where(X > 0.035, tail + 0.002, FAR)
    return d, fat, bone2 + 0.001, seam


def rack(P, n, pitch, hx, hz, th, arch, seed):
    """A rack of ribs: meat sheet arched across its depth with rib bones showing underneath and at the edge."""
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    yc = 0.012 + arch * (1 - (Z / hz) ** 2)
    o = poly2(X, Z, [(-hx, -hz * 0.8), (-hx * 0.96, hz), (hx, hz * 0.9), (hx * 0.94, -hz)], 0.012) + bump(P * [1, 0, 1], 20, 0.005, seed)
    d = slab(P, o, th, 0.004, yc=yc + th)
    bone = None
    for i in range(n):
        cx = (i - (n - 1) / 2) * pitch
        b = box(np.stack([X, Y - yc, Z], 1), (cx, 0.004, 0.0), (pitch * 0.24, 0.005, hz * 1.02), 0.004)
        bone = b if bone is None else np.minimum(bone, b)
    d = smin(d, bone, 0.004)
    fat = (yc + 2 * th - 0.001 - Y) + 0.02 * (fbm(P, 22, 2, seed + 1) - 0.2)
    return d, fat, bone + 0.0004, None


@cut('pbb', ((-0.18, -0.01, -0.07), (0.18, 0.07, 0.07)), 0.0046,
     dict(PK, marb=0.2, marbScale=80, grain=0.8, grainDir=[0, 0, 1], marrow=0.0025))
def babyback(P):
    return rack(P, 11, 0.028, 0.158, 0.05, 0.008, 0.016, 3)


@cut('pco', ((-0.19, -0.01, -0.11), (0.19, 0.06, 0.11)), 0.0052,
     dict(DK, marb=0.3, marbScale=75, grain=0.8, grainDir=[0, 0, 1], marrow=0.003))
def spareribs(P):
    return rack(P, 10, 0.033, 0.168, 0.088, 0.009, 0.006, 8)


# ============================================================ shoulder
@cut('pbo', ((-0.14, -0.01, -0.10), (0.14, 0.11, 0.10)), 0.0056,
     dict(DK, marb=0.75, marbScale=55, grain=0.7, grainDir=[1, 0, 0.2], seamW=0.0035))
def collar(P):
    d = box(P, (0, 0.046, 0), (0.115, 0.046, 0.076), 0.03) + bump(P, 14, 0.008, 5)
    d = np.maximum(d, -(P[:, 1] - 0.003))
    d = np.maximum(d, P[:, 0] - 0.098)                       # sliced face shows the marbling
    seam = two(P[:, 1] - 0.045 - 0.02 * np.sin(P[:, 2] * 40), P[:, 2] - 0.01 - 0.03 * np.sin(P[:, 1] * 50))
    fat = (0.097 - P[:, 1]) + 0.03 * (fbm(P, 12, 2, 2) - 0.34)
    return d, fat, None, seam


@cut('ppa', ((-0.17, -0.01, -0.11), (0.16, 0.14, 0.11)), 0.0062,
     dict(DK, marb=0.3, marbScale=70, grain=0.75, grainDir=[1, 0.2, 0], seamW=0.003, marrow=0.008, fat=SKIN))
def picnic(P):
    e = ellipsoid(P, (0.0, 0.06, 0), (0.125, 0.07, 0.088))
    e = smin(e, capsule(P, (-0.06, 0.05, 0), (-0.135, 0.04, 0), 0.05, 0.036), 0.03)       # toward the hock
    d = np.maximum(e, -(P[:, 1] - 0.003))
    d = np.maximum(d, P[:, 0] - 0.085) + bump(P, 16, 0.005, 4)
    b = capsule(P, (-0.12, 0.05, 0.0), (0.2, 0.062, 0.01), 0.016, 0.02)
    fat = np.where(P[:, 0] > 0.08, -(e + 0.011 + bump(P, 30, 0.006, 7)), -(e + 0.012))    # skin and fat all round
    seam = two(P[:, 1] - 0.06 - 0.03 * np.sin(P[:, 2] * 30), P[:, 2] + 0.03 + 0.4 * (P[:, 1] - 0.06))
    return d, fat, b, seam


# ============================================================ belly
@cut('ppn', ((-0.19, -0.01, -0.11), (0.19, 0.07, 0.11)), 0.0055,
     dict(PK, marb=0.1, marbScale=70, grain=0.9, grainDir=[1, 0, 0.1], fat=SKIN))
def belly(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    o = poly2(X, Z, [(-0.16, -0.08), (-0.16, 0.08), (0.16, 0.084), (0.165, -0.076)], 0.012) + bump(P * [1, 0, 1], 16, 0.006, 5)
    d = slab(P, o, 0.022, 0.006, yc=0.022)
    w = lambda a, f, ph: a * np.sin(X * f + ph + Z * 6)
    lay = np.minimum(np.abs(Y - 0.012 - w(0.003, 24, 0)) - 0.0034, np.abs(Y - 0.025 - w(0.003, 17, 1.4)) - 0.0042)
    fat = np.minimum(lay, (0.035 - Y) + 0.004 * np.sin(X * 30))                      # two streaks and the fat under the skin
    return d, fat, None, None


@cut('pse', ((-0.16, -0.01, -0.11), (0.16, 0.04, 0.11)), 0.0046,
     dict(DK, marb=1.0, marbScale=52, grain=0.92, grainDir=[1, 0, 0.5]))
def secreto(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.135, -0.03), (-0.10, 0.07), (0.06, 0.082), (0.14, 0.03), (0.11, -0.07), (-0.04, -0.078)], 0.022) + bump(P * [1, 0, 1], 14, 0.01, 6)
    d = slab(P, o, 0.008, 0.004, yc=0.008 + 0.003 * np.sin(X * 26 + Z * 14))
    fat = 0.006 + 0.03 * (fbm(P * [1, 0.2, 2.2], 26, 2, 3) - 0.47)                  # streaky: fat between the fibres
    return d, fat, None, None


@cut('ppr', ((-0.13, -0.01, -0.09), (0.13, 0.07, 0.09)), 0.0046,
     dict(DK, marb=0.9, marbScale=58, grain=0.8, grainDir=[1, 0, 0.2], seamW=0.002))
def presa(P):
    d = ellipsoid(P, (0, 0.024, 0), (0.105, 0.03, 0.066))
    d = np.maximum(d, -(P[:, 1] - 0.003)) + bump(P, 18, 0.005, 8)
    seam = P[:, 2] - 0.012 - 0.02 * np.sin(P[:, 0] * 26)
    return d, None, None, seam


@cut('ppl', ((-0.13, -0.01, -0.08), (0.13, 0.04, 0.08)), 0.0044,
     dict(DK, marb=0.7, marbScale=60, grain=0.9, grainDir=[1, 0, 0.25]))
def pluma(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.105, -0.012), (-0.06, 0.05), (0.10, 0.02), (0.09, -0.05)], 0.02) + bump(P * [1, 0, 1], 16, 0.007, 9)
    d = slab(P, o, 0.0085, 0.004, yc=0.0085)
    return d, None, None, None


# ============================================================ leg
@cut('ppi', ((-0.21, -0.01, -0.12), (0.17, 0.17, 0.12)), 0.0068,
     dict(PK, marb=0.1, marbScale=80, grain=0.75, grainDir=[1, 0.2, 0], seamW=0.003, marrow=0.009, fat=SKIN))
def ham(P):
    e = ellipsoid(P, (0.02, 0.075, 0), (0.135, 0.085, 0.10))
    e = smin(e, capsule(P, (-0.06, 0.06, 0), (-0.18, 0.045, 0), 0.055, 0.032), 0.04)      # shank end
    d = np.maximum(e, -(P[:, 1] - 0.003))
    d = np.maximum(d, P[:, 0] - 0.105) + bump(P, 14, 0.005, 2)
    b = capsule(P, (-0.17, 0.045, 0.0), (0.2, 0.08, 0.012), 0.014, 0.019)
    fat = np.where(P[:, 0] > 0.10, -(e + 0.012 + bump(P, 28, 0.006, 5)), -(e + 0.013))
    seam = two(P[:, 1] - 0.07 - 0.035 * np.sin(P[:, 2] * 26), P[:, 2] - 0.02 - 0.5 * (P[:, 1] - 0.08))
    return d, fat, b, seam


@cut('pcd', ((-0.12, -0.01, -0.08), (0.12, 0.12, 0.08)), 0.0048,
     dict(DK, marb=0.1, marbScale=80, grain=0.7, grainDir=[1, 0, 0], seamW=0.003, marrow=0.007, fat=SKIN))
def hock(P):
    e = capsule(P, (-0.075, 0.046, 0), (0.07, 0.056, 0), 0.04, 0.056)
    d = np.maximum(e, np.maximum(P[:, 0] - 0.088, -(P[:, 0] + 0.092)))
    d = np.maximum(d, -(P[:, 1] - 0.003)) + bump(P, 20, 0.004, 3)
    b = capsule(P, (-0.2, 0.046, 0.0), (0.2, 0.056, 0.004), 0.013, 0.017)
    fat = -(e + 0.009 + bump(P, 30, 0.004, 5))
    seam = P[:, 1] - 0.056 - 0.02 * np.sin(P[:, 2] * 40)
    return d, fat, b, np.where(P[:, 0] > 0.08, seam, FAR)


@cut('ppt', ((-0.13, -0.01, -0.06), (0.13, 0.08, 0.06)), 0.0042,
     dict(SK, marrow=0.006, bone=1))
def trotter(P):
    d = capsule(P, (-0.095, 0.032, 0), (0.03, 0.03, 0), 0.031, 0.027)
    for s in (1, -1):
        d = smin(d, capsule(P, (0.03, 0.028, 0.012 * s), (0.092, 0.022, 0.02 * s), 0.02, 0.016), 0.012)   # two toes
        d = smin(d, sphere(P, (0.012, 0.016, 0.03 * s), 0.011), 0.008)                                     # dew claws
    d = np.maximum(d, -(P[:, 0] + 0.105))
    d = np.maximum(d, -(P[:, 1] - 0.002))
    b = capsule(P, (-0.2, 0.032, 0.0), (0.0, 0.03, 0.0), 0.012)
    return d, None, np.where(P[:, 0] < -0.1, b, FAR), None


# ============================================================ head, skin and tail
HS_ = 0.2
def head(P):
    Q = (P / HS_ + np.array([-1.16, 0.50, 0.0], F)).astype(F)
    d = np.maximum(pig.body(Q), Q[:, 0] + 0.80) * HS_
    fat = (-(Q[:, 0] + 0.80) - 0.01) * HS_ + 0.012                      # the neck cut shows fat
    return d.astype(F), fat.astype(F), None, None
cut('pca', ((-0.10, -0.01, -0.07), (0.09, 0.16, 0.07)), 0.0042, dict(SK, gloss=0.35))(head)


@cut('por', ((-0.13, -0.01, -0.08), (0.13, 0.04, 0.08)), 0.004, dict(SK, meat='#ecc0b0', meat2='#dca896'))
def ears(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    d = None
    for cx, cz, ang in ((-0.055, 0.004, 0.25), (0.058, -0.006, -0.3)):
        x = X - cx; z = Z - cz
        ca, sa = np.cos(ang), np.sin(ang)
        x, z = ca * x + sa * z, -sa * x + ca * z
        o = poly2(x, z, [(-0.03, -0.05), (0.03, -0.05), (0.045, 0.0), (0.0, 0.06), (-0.045, 0.0)], 0.012)
        yc = 0.006 + 0.9 * x * x + 0.004 * np.sin(z * 40)             # cupped
        s = slab(P, o, 0.0028, 0.002, yc=yc)
        d = s if d is None else np.minimum(d, s)
    return d.astype(F), None, None, None


@cut('pcr', ((-0.12, -0.01, -0.08), (0.12, 0.05, 0.08)), 0.0042,
     dict(DK, meat='#b9535c', meat2='#9a3f49', marb=0.3, marbScale=85, grain=0.7, grainDir=[1, 0, 0.3], seamW=0.003))
def cheeks(P):
    d = None
    for c, r in (((-0.055, 0.016, 0.01), (0.045, 0.018, 0.036)), ((0.052, 0.015, -0.012), (0.042, 0.017, 0.034)), ((0.0, 0.016, 0.045), (0.036, 0.016, 0.028))):
        e = ellipsoid(P, c, r)
        d = e if d is None else np.minimum(d, e)
    d = np.maximum(d, -(P[:, 1] - 0.002)) + bump(P, 30, 0.004, 4)
    seam = P[:, 2] - 0.005 - 0.02 * np.sin(P[:, 0] * 50)
    return d, None, None, seam


@cut('ppp', ((-0.14, -0.01, -0.09), (0.14, 0.07, 0.09)), 0.005,
     dict(PK, marb=0.2, marbScale=60, grain=0.6, grainDir=[1, 0, 0], fat=SKIN))
def jowl(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    o = poly2(X, Z, [(-0.11, -0.05), (-0.09, 0.055), (0.10, 0.06), (0.115, -0.04), (0.0, -0.065)], 0.02) + bump(P * [1, 0, 1], 14, 0.008, 3)
    d = slab(P, o, 0.02, 0.008, yc=0.02)
    lean = np.minimum(np.abs(Y - 0.014 - 0.004 * np.sin(X * 22)) - 0.004, np.abs(Y - 0.028 - 0.003 * np.sin(X * 30 + 1)) - 0.0025)
    return d, -lean - 0.0005, None, None                                 # mostly fat, with two streaks of lean


@cut('pcu', ((-0.17, -0.01, -0.11), (0.17, 0.05, 0.11)), 0.0046, dict(SK))
def skin(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    o = poly2(X, Z, [(-0.14, -0.075), (-0.145, 0.07), (0.14, 0.078), (0.15, -0.07)], 0.012) + bump(P * [1, 0, 1], 12, 0.008, 4)
    yc = 0.008 + 0.006 * np.sin(X * 20 + 1.2 * np.sin(Z * 16)) + 0.03 * sstep(0.09, 0.15, X)      # one end curls up
    d = slab(P, o, 0.0042, 0.003, yc=yc)
    return d, (Y - yc) + 0.0008, None, None                              # white fat underneath, skin on top


@cut('pra', ((-0.14, -0.01, -0.07), (0.14, 0.05, 0.07)), 0.004, dict(SK, marrow=0.004, bone=1))
def tail(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    zc = 0.03 * np.sin(X * 14)
    t = np.clip((X + 0.11) / 0.22, 0, 1)
    r = 0.021 - 0.013 * t + 0.0015 * np.sin(X * 150)
    d = np.sqrt((Z - zc) ** 2 + (Y - 0.02) ** 2) - r
    d = np.maximum(d, np.maximum(-(X + 0.11), X - 0.115))
    d = np.maximum(d * 0.8, -(Y - 0.002))
    b = np.sqrt((Z - zc) ** 2 + (Y - 0.02) ** 2) - 0.007
    return d.astype(F), None, np.where(X < -0.1, b, FAR).astype(F), None


# ============================================================ ground, offal, whole
cut('pmo', ((-0.12, -0.01, -0.09), (0.12, 0.08, 0.09)), 0.0048,
    dict(meat='#dc8f90', meat2='#c97b7e', fat='#f8ece4', marb=1.0, marbScale=230, grain=0.0, gloss=0.35, rough=0.55))(B.ground)
cut('phi', ((-0.16, -0.01, -0.10), (0.16, 0.06, 0.10)), 0.0052,
    dict(meat='#6a2423', meat2='#531819', marb=0.0, grain=0.0, gloss=1.0, rough=0.22, bone=0))(B.liver)
cut('ptr', ((-0.11, -0.01, -0.11), (0.11, 0.04, 0.11)), 0.0042,
    dict(meat='#ecc9b8', meat2='#dcb09c', fat='#f4e4d6', marb=0.0, grain=0.0, gloss=0.5, rough=0.45, bone=0))(B.intestine)

WS = 0.105
def whole(P):
    Q = (P / WS + np.array([-0.1, 0.0, 0.0], F)).astype(F)
    return (pig.body(Q) * WS).astype(F), None, None, None
cut('pen', ((-0.17, -0.005, -0.05), (0.16, 0.145, 0.05)), 0.0032, dict(SK, gloss=0.4))(whole)


if __name__ == '__main__':
    import sys
    pk = Pack()
    only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
    mats = B.build_cuts(pk, only, reg=K)
    cols = 6
    for i, e in enumerate(pk.entries):
        e['at'] = [(i % cols - (cols - 1) / 2) * 0.42, 0.0, (i // cols - 1.5) * 0.30]
    print('bytes', pk.write('out/pork_cuts_test.bin', dict(mats=mats)))
