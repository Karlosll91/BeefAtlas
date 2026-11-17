"""Retail cut models for the display case. Units: metres. X length, Y up, Z depth."""
import numpy as np
from sdf import *

FAR = 0.05
HS = 1.3      # global resolution scale for the retail cuts


def ell2(X, Z, c, r, ang=0.0):
    x = X - c[0]; z = Z - c[1]
    if ang:
        ca, sa = np.cos(ang), np.sin(ang)
        x, z = ca * x + sa * z, -sa * x + ca * z
    k0 = np.sqrt((x / r[0]) ** 2 + (z / r[1]) ** 2)
    k1 = np.sqrt((x / r[0] ** 2) ** 2 + (z / r[1] ** 2) ** 2)
    return np.where(k1 > 1e-9, k0 * (k0 - 1) / np.maximum(k1, 1e-9), -min(r)).astype(F)


def poly2(X, Z, pts, rnd=0.0):
    pts = np.asarray(pts, float)
    d = np.full(X.shape, 1e9)
    sgn = np.ones(X.shape)
    n = len(pts)
    for i in range(n):
        a = pts[i]; b = pts[(i + 1) % n]
        ex, ez = b[0] - a[0], b[1] - a[1]
        wx, wz = X - a[0], Z - a[1]
        t = np.clip((wx * ex + wz * ez) / (ex * ex + ez * ez), 0, 1)
        dx, dz = wx - ex * t, wz - ez * t
        d = np.minimum(d, dx * dx + dz * dz)
        c1 = Z >= a[1]; c2 = Z < b[1]; c3 = ex * wz > ez * wx
        flip = (c1 & c2 & c3) | (~c1 & ~c2 & ~c3)
        sgn = np.where(flip, -sgn, sgn)
    return (sgn * np.sqrt(d) - rnd).astype(F)


def slab(P, o2, ht, r=0.006, yc=0.0):
    dy = np.abs(P[:, 1] - yc) - ht
    a = o2 + r; b = dy + r
    return (np.minimum(np.maximum(a, b), 0) + np.sqrt(np.maximum(a, 0) ** 2 + np.maximum(b, 0) ** 2) - r).astype(F)


def bump(P, f, amp, seed=0):
    return (amp * (fbm(P, f, 2, seed) - 0.5)).astype(F)


def two(a, b):
    """Field whose zero set is the union of the zero sets of a and b (for seam lines)."""
    return (a * b / (np.abs(a) + np.abs(b) + 1e-6)).astype(F)


XZ = lambda P: (P[:, 0], P[:, 2])
C = {}       # name -> dict(fn, fat, bone, seam, bbox, h, mat)


def cut(name, bbox, h, mat, reg=None):
    def deco(builder):
        (C if reg is None else reg)[name] = dict(build=builder, bbox=bbox, h=h, mat=mat)
        return builder
    return deco


# ============================================================ loin & rib steaks
@cut('la', ((-0.13, -0.03, -0.075), (0.13, 0.03, 0.075)), 0.0042,
     dict(meat='#a01d26', meat2='#74111a', marb=0.42, marbScale=70, grain=0.85, grainDir=[0, 1, 0], seamW=0.0022))
def strip(P):
    X, Z = XZ(P)
    o = np.minimum(ell2(X, Z, (-0.005, 0.0), (0.105, 0.043)), ell2(X, Z, (0.045, 0.004), (0.058, 0.039)))
    o = smin(o, ell2(X, Z, (-0.075, -0.004), (0.035, 0.026)), 0.02) + bump(P * [1, 0, 1], 28, 0.006, 2)
    d = slab(P, o, 0.0165, 0.006)
    fat = np.maximum(-(o + 0.0075 + bump(P, 40, 0.006, 4)), -(Z - 0.004))          # fat edge along the back
    seam = Z + 0.012 + 0.012 * np.sin(X * 34) + 0.02 * (X + 0.05)                 # faint line of gristle
    seam = np.where(X > 0.03, FAR, seam)
    return d, fat, None, seam


@cut('ba', ((-0.125, -0.03, -0.10), (0.125, 0.03, 0.10)), 0.0045,
     dict(meat='#a82029', meat2='#7a131c', marb=0.78, marbScale=62, grain=0.85, grainDir=[0, 1, 0], seamW=0.003))
def ribeye(P):
    X, Z = XZ(P)
    eye = ell2(X, Z, (0.0, -0.012), (0.074, 0.052), 0.1)
    cap = ell2(X, Z, (-0.004, 0.036), (0.098, 0.040), -0.05)
    tail = ell2(X, Z, (0.082, -0.01), (0.03, 0.036), 0.3)
    o = smin(smin(eye, cap, 0.012), tail, 0.015) + bump(P * [1, 0, 1], 26, 0.006, 6)
    d = slab(P, o, 0.018, 0.007)
    kern = ell2(X, Z, (0.058, 0.018), (0.018, 0.011), 0.5) + bump(P, 60, 0.004, 3)   # kernel of fat
    rim = np.maximum(-(o + 0.005 + bump(P, 45, 0.005, 8)), (Z - 0.02) * -1 + 0.0) if False else -(o + 0.004 + bump(P, 45, 0.005, 8))
    rim = np.maximum(rim, -(Z - 0.03))                                               # fat only along the cap edge
    fat = np.minimum(kern, rim)
    seam = two(eye + 0.002, ell2(X, Z, (0.085, -0.008), (0.032, 0.04), 0.3))
    return d, fat, None, seam


@cut('tb', ((-0.13, -0.03, -0.11), (0.13, 0.03, 0.10)), 0.0046,
     dict(meat='#a01d26', meat2='#74111a', marb=0.4, marbScale=70, grain=0.85, grainDir=[0, 1, 0], marrow=0.03))
def tbone(P):
    X, Z = XZ(P)
    strip_ = smin(ell2(X, Z, (-0.012, 0.038), (0.096, 0.046), 0.05), ell2(X, Z, (-0.07, 0.03), (0.04, 0.035)), 0.02)
    tend = ell2(X, Z, (0.018, -0.05), (0.052, 0.035), -0.1)
    bar = poly2(X, Z, [(-0.05, -0.016), (0.09, -0.022), (0.09, -0.008), (-0.05, -0.007)], 0.003)
    stem = poly2(X, Z, [(0.074, -0.072), (0.098, -0.068), (0.102, 0.066), (0.08, 0.07)], 0.004)
    bone2 = np.minimum(bar, stem)
    o = smin(smin(strip_, tend, 0.01), bone2, 0.008) + bump(P * [1, 0, 1], 26, 0.004, 5)
    d = slab(P, o, 0.0175, 0.006)
    fat = np.maximum(-(o + 0.007 + bump(P, 40, 0.005, 2)), X - 0.03)
    fat = np.minimum(fat, np.maximum(-(o + 0.005), -(X + 0.02)) + np.where(Z < -0.03, 0, FAR))
    return d, fat, bone2 + 0.001, None


@cut('lf', ((-0.25, -0.06, -0.085), (0.25, 0.06, 0.085)), 0.0058,
     dict(meat='#a3232b', meat2='#7d1820', marb=0.06, marbScale=90, grain=0.8, grainDir=[1, 0, 0], gloss=0.5))
def tenderloin(P):
    Q = P.copy(); Q[:, 1] = Q[:, 1] / 0.78
    d = capsule(Q, (-0.20, 0, 0.0), (-0.05, 0, 0.0), 0.047, 0.04)
    d = smin(d, capsule(Q, (-0.05, 0, 0), (0.13, 0, 0.004), 0.04, 0.03), 0.02)
    d = smin(d, capsule(Q, (0.13, 0, 0.004), (0.225, 0, 0.012), 0.03, 0.015), 0.02)
    d = smin(d, ellipsoid(Q, (-0.15, 0.004, 0.035), (0.075, 0.03, 0.028)), 0.02)       # the "head" lobe
    d = d * 0.78 + bump(P, 30, 0.004, 3)
    fat = (0.026 - P[:, 1]) + 0.03 * (fbm(P, 22, 2, 4) - 0.3) + np.where(P[:, 0] < -0.04, 0, 0.03)   # a little silverskin on the head
    seam = P[:, 2] - 0.012 - 0.02 * (P[:, 0] + 0.2)
    seam = np.where(P[:, 0] > -0.06, FAR, seam)
    return d, fat, None, seam


# ============================================================ sirloin & rump
@cut('pa', ((-0.16, -0.05, -0.11), (0.16, 0.06, 0.11)), 0.0055,
     dict(meat='#9c1b24', meat2='#701019', marb=0.22, marbScale=70, grain=0.6, grainDir=[1, 0, 0.2]))
def picanha(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.135, -0.03), (-0.11, 0.055), (0.02, 0.075), (0.135, 0.01), (0.03, -0.07), (-0.08, -0.075)], 0.02) + bump(P * [1, 0, 1], 18, 0.008, 3)
    ht = 0.028 - 0.012 * sstep(0.02, 0.14, X)
    d = slab(P, o, ht, 0.012, yc=0.0)
    fat = (ht - 0.013 - 0.003 * fbm(P, 30, 2, 5)) - P[:, 1]                           # thick fat cap on top
    fat = np.maximum(fat, (X - 0.085 + 0.02 * np.sin(Z * 40)) )                      # trimmed back at the tip
    return d, fat, None, None


def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


@cut('ca', ((-0.14, -0.035, -0.10), (0.14, 0.035, 0.10)), 0.005,
     dict(meat='#9b1a23', meat2='#6c0f17', marb=0.16, marbScale=75, grain=0.7, grainDir=[0.3, 1, 0], seamW=0.0025))
def sirloin(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.11, -0.045), (-0.10, 0.04), (-0.02, 0.07), (0.10, 0.045), (0.115, -0.03), (0.02, -0.068)], 0.02) + bump(P * [1, 0, 1], 22, 0.008, 9)
    d = slab(P, o, 0.021, 0.008)
    fat = np.maximum(-(o + 0.005 + bump(P, 40, 0.004, 1)), -(Z - 0.03))
    seam = two(Z - 0.012 - 0.018 * np.sin(X * 22 + 1), X - 0.045 + 0.4 * Z * Z * 20)
    return d, fat, None, seam


@cut('co', ((-0.16, -0.045, -0.10), (0.16, 0.045, 0.10)), 0.0055,
     dict(meat='#9d1c25', meat2='#6e1018', marb=0.3, marbScale=65, grain=0.88, grainDir=[1, 0, 0.35]))
def tritip(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.135, 0.0), (-0.05, 0.062), (0.06, 0.05), (0.135, -0.035), (0.11, -0.06), (0.0, -0.035), (-0.08, -0.045)], 0.022) + bump(P * [1, 0, 1], 18, 0.007, 4)
    ht = 0.03 - 0.014 * sstep(0.0, 0.14, np.abs(X))
    d = slab(P, o, ht, 0.014)
    fat = np.minimum(P[:, 1] + ht - 0.004, 0.016 + 0.04 * (fbm(P, 12, 2, 7) - 0.3))
    return d, fat, None, None


# ============================================================ thin & fibrous cuts
@cut('sb', ((-0.21, -0.03, -0.115), (0.21, 0.03, 0.115)), 0.006,
     dict(meat='#8f1820', meat2='#5f0d14', marb=0.07, marbScale=80, grain=0.94, grainDir=[1, 0, 0.08], rough=0.5))
def flank(P):
    X, Z = XZ(P)
    o = ell2(X, Z, (0, 0), (0.185, 0.082)) + 0.02 * sstep(-0.05, 0.18, X) * (Z / 0.08) ** 2 + bump(P * [1, 0, 1], 16, 0.01, 5)
    ht = 0.0115 - 0.004 * sstep(0.08, 0.19, np.abs(X)) 
    d = slab(P, o, ht, 0.005)
    fat = 0.012 + 0.03 * (fbm(P, 30, 2, 3) - 0.25) + (0.004 - P[:, 1])
    return d, fat, None, None


@cut('en', ((-0.25, -0.025, -0.065), (0.25, 0.025, 0.065)), 0.0055,
     dict(meat='#871520', meat2='#560b13', marb=0.3, marbScale=95, grain=0.94, grainDir=[0.12, 0, 1], rough=0.5))
def skirt(P):
    X, Z = XZ(P)
    zc = 0.008 * np.sin(X * 14)
    o = np.abs(Z - zc) - (0.038 - 0.012 * sstep(0.1, 0.23, np.abs(X)) + 0.004 * np.sin(X * 60))
    o = np.maximum(o, np.abs(X) - 0.225) + bump(P * [1, 0, 1], 30, 0.004, 5)
    ht = 0.008 + 0.001 * np.sin(X * 330 + 5 * fbm(P, 12, 1, 2))
    d = slab(P, o, ht, 0.004)
    fat = 0.010 + 0.03 * (fbm(P, 40, 2, 8) - 0.27) + (0.003 - P[:, 1])              # membrane patches on top
    return d, fat, None, None


@cut('ha', ((-0.16, -0.035, -0.075), (0.16, 0.035, 0.075)), 0.005,
     dict(meat='#7f131d', meat2='#500a12', marb=0.3, marbScale=90, grain=0.9, grainDir=[0.3, 0, 1], seamW=0.0032))
def hanger(P):
    Q = P.copy(); Q[:, 1] = Q[:, 1] / 0.62
    a = capsule(Q, (-0.13, 0, 0.022), (0.13, 0, 0.03), 0.03, 0.022)
    b = capsule(Q, (-0.13, 0, -0.024), (0.12, 0, -0.03), 0.03, 0.02)
    d = smin(a, b, 0.012) * 0.62 + bump(P, 40, 0.004, 3)
    seam = P[:, 2] - 0.001 - 0.004 * np.sin(P[:, 0] * 40)
    return d, None, None, seam


@cut('va', ((-0.19, -0.04, -0.12), (0.19, 0.04, 0.12)), 0.006,
     dict(meat='#951a23', meat2='#650e16', marb=0.28, marbScale=70, grain=0.9, grainDir=[0.5, 0, 1]))
def flap(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.15, -0.06), (-0.14, 0.05), (-0.02, 0.085), (0.13, 0.06), (0.155, -0.02), (0.06, -0.08)], 0.025) + bump(P * [1, 0, 1], 18, 0.01, 7)
    ht = 0.019 - 0.007 * sstep(0.05, 0.16, np.abs(X)) + 0.0009 * np.sin((Z - 0.5 * X) * 260 + 5 * fbm(P, 10, 1, 4))
    d = slab(P, o, ht, 0.008)
    fat = np.minimum(P[:, 1] + ht - 0.004, 0.014 + 0.04 * (fbm(P, 11, 2, 6) - 0.33) + (ht - P[:, 1]) * 0.5)   # fat below, patches above
    return d, fat, None, None


@cut('ma', ((-0.22, -0.02, -0.16), (0.22, 0.03, 0.16)), 0.0062,
     dict(meat='#b5343a', meat2='#8f2228', marb=0.15, marbScale=60, grain=0.9, grainDir=[1, 0, 0], rough=0.5))
def matambre(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.18, -0.10), (-0.17, 0.11), (0.16, 0.12), (0.19, -0.08), (0.03, -0.125)], 0.03) + bump(P * [1, 0, 1], 14, 0.012, 3)
    yc = 0.006 * np.sin(X * 22) * np.cos(Z * 17)
    d = slab(P, o, 0.0062, 0.004, yc=yc)
    fat = 0.012 + 0.035 * (fbm(P, 12, 2, 9) - 0.36) + (yc - P[:, 1]) * 0.5         # patchy fat on the meat
    return d, fat, None, None


# ============================================================ forequarter
@cut('pe', ((-0.25, -0.05, -0.16), (0.25, 0.06, 0.16)), 0.0075,
     dict(meat='#931922', meat2='#640e15', marb=0.3, marbScale=60, grain=0.9, grainDir=[1, 0, 0.25]))
def brisket(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.21, -0.07), (-0.2, 0.08), (0.02, 0.115), (0.2, 0.09), (0.215, -0.06), (0.05, -0.11)], 0.035) + bump(P * [1, 0, 1], 12, 0.012, 2)
    ht = 0.022 + 0.016 * sstep(-0.05, 0.2, X)
    d = slab(P, o, ht, 0.014)
    fat = P[:, 1] + (ht - 0.010 - 0.005 * fbm(P, 20, 2, 5))
    fat = np.minimum(fat, np.maximum(-(o + 0.008 + bump(P, 30, 0.006, 4)), X + 0.02))
    seam = (P[:, 1] + 0.004 - 0.02 * sstep(-0.05, 0.2, X)) + np.where(X < 0.0, FAR, 0)   # fat seam between point and flat
    return d, fat, None, seam


@cut('ag', ((-0.14, -0.045, -0.11), (0.14, 0.045, 0.11)), 0.0052,
     dict(meat='#9e1c25', meat2='#6f1018', marb=0.55, marbScale=62, grain=0.8, grainDir=[0, 1, 0.2], seamW=0.0032))
def chuck(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.11, -0.05), (-0.105, 0.05), (-0.03, 0.08), (0.09, 0.065), (0.115, -0.02), (0.05, -0.075), (-0.05, -0.078)], 0.025) + bump(P * [1, 0, 1], 20, 0.008, 6)
    d = slab(P, o, 0.027, 0.009)
    eye = ell2(X, Z, (-0.03, 0.01), (0.05, 0.042), 0.2)
    s2 = Z + 0.03 - 0.5 * X - 0.012 * np.sin(X * 40)
    seam = two(eye, s2)
    kern = np.minimum(ell2(X, Z, (0.045, 0.03), (0.02, 0.01), 0.8), ell2(X, Z, (0.02, -0.05), (0.022, 0.008), -0.2)) + bump(P, 50, 0.004, 2)
    return d, kern, None, seam


@cut('pl', ((-0.15, -0.065, -0.11), (0.15, 0.065, 0.11)), 0.006,
     dict(meat='#971a23', meat2='#680e16', marb=0.12, marbScale=75, grain=0.85, grainDir=[1, 0.2, 0], seamW=0.003))
def shoulder(P):
    Q = P.copy()
    d = ellipsoid(Q, (0, 0, 0), (0.125, 0.05, 0.082))
    d = smin(d, ellipsoid(Q, (0.06, 0.006, 0.03), (0.07, 0.046, 0.05)), 0.03)
    d = np.maximum(d, -(P[:, 1] + 0.036)) + bump(P, 22, 0.008, 4)
    seam = two(P[:, 2] - 0.02 - 0.3 * P[:, 0] - 0.01 * np.sin(P[:, 0] * 50), P[:, 0] + 0.05 + 0.4 * P[:, 2])
    fat = 0.02 + 0.03 * (fbm(P, 16, 2, 5) - 0.42) + (0.03 - P[:, 1]) * 0.5
    return d, fat, None, seam


@cut('ps', ((-0.12, -0.035, -0.10), (0.12, 0.035, 0.10)), 0.0048,
     dict(meat='#8c1720', meat2='#5c0c14', marb=0.3, marbScale=75, grain=0.6, grainDir=[0, 1, 0], seamW=0.003, marrow=0.011))
def neck(P):
    X, Z = XZ(P)
    o = ell2(X, Z, (0, 0), (0.088, 0.07)) + bump(P * [1, 0, 1], 30, 0.012, 2)
    b = np.minimum(ell2(X, Z, (0, 0.004), (0.022, 0.018)), poly2(X, Z, [(-0.045, 0.012), (0.045, 0.012), (0.012, -0.004), (0.0, -0.04), (-0.012, -0.004)], 0.004))
    d = slab(P, o, 0.02, 0.007)
    ang = np.arctan2(Z, X)
    wob = 1.2 * (fbm(P, 14, 2, 5) - 0.5)
    seam = two(np.sin(ang * 1.5 + 0.6 + wob) * 0.03, np.sqrt(X * X + Z * Z) - 0.052 + 0.012 * np.sin(ang * 3 + wob * 3))
    fat = -(o + 0.004 + bump(P, 40, 0.005, 3))
    return d, fat, b + 0.001, seam


@cut('mo', ((-0.14, -0.02, -0.10), (0.14, 0.13, 0.10)), 0.0058,
     dict(meat='#a3202a', meat2='#77121b', fat='#f6ecd4', marb=1.0, marbScale=48, grain=0.75, grainDir=[1, 0.3, 0]))
def hump(P):
    d = ellipsoid(P, (0, 0.0, 0), (0.118, 0.105, 0.078))
    d = np.maximum(d, -P[:, 1])                    # flat base
    d = np.maximum(d, P[:, 0] - 0.07)              # sliced face showing the marbling
    d = d + bump(P, 20, 0.006, 4)
    fat = (np.abs(ellipsoid(P, (0, 0, 0), (0.118, 0.105, 0.078))) - 0.003) + np.where(P[:, 0] > 0.062, FAR, 0) + 0.03 * (fbm(P, 16, 2, 2) - 0.27)
    return d, fat, None, None


@cut('cs', ((-0.14, -0.01, -0.07), (0.14, 0.10, 0.07)), 0.0052,
     dict(meat='#9a1b24', meat2='#6b0f17', marb=0.6, marbScale=62, grain=0.85, grainDir=[1, 0, 0], marrow=0.0065))
def shortribs(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    d = box(P, (0, 0.042, 0), (0.118, 0.042, 0.05), 0.012) + bump(P, 22, 0.006, 7)
    bone = None
    for cx in (-0.076, 0.0, 0.076):
        b = box(P, (cx, 0.014, 0), (0.026, 0.0085, 0.062), 0.008)
        bone = b if bone is None else np.minimum(bone, b)
    d = smin(d, bone, 0.004)
    lay1 = np.abs(Y - 0.03 - 0.004 * np.sin(X * 30)) - 0.0028           # fat layer over the bones
    lay2 = np.abs(Y - 0.058 - 0.005 * np.sin(X * 22 + 2)) - 0.002
    top = (0.0815 - Y) + 0.03 * (fbm(P, 16, 2, 3) - 0.34)
    fat = np.minimum(np.minimum(lay1, lay2 + np.where(X > 0.02, 0.0, 0.004)), top)
    return d, fat, bone + 0.0005, None


@cut('fa', ((-0.18, -0.035, -0.11), (0.18, 0.04, 0.11)), 0.0058,
     dict(meat='#971a23', meat2='#680e16', marb=0.3, marbScale=65, grain=0.92, grainDir=[1, 0, 0.15]))
def plate(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.15, -0.07), (-0.15, 0.07), (0.15, 0.075), (0.155, -0.065)], 0.02) + bump(P * [1, 0, 1], 16, 0.008, 5)
    d = slab(P, o, 0.021, 0.008)
    Y = P[:, 1]
    lay = np.minimum(np.abs(Y - 0.004 - 0.004 * np.sin(X * 26 + Z * 9)) - 0.0026, np.abs(Y + 0.009 - 0.003 * np.sin(X * 18 + 1)) - 0.0016)
    fat = np.minimum(lay, (0.0195 - Y) + 0.022 * (fbm(P, 14, 2, 6) - 0.42))
    return d, fat, None, None


@cut('mu', ((-0.10, -0.03, -0.10), (0.10, 0.03, 0.10)), 0.0042,
     dict(meat='#8a1620', meat2='#590b13', fat='#efe6d2', marb=0.12, marbScale=90, grain=0.6, grainDir=[0, 1, 0], seamW=0.0028, marrow=0.0085))
def shank(P):
    X, Z = XZ(P)
    r = np.sqrt(X * X + Z * Z); ang = np.arctan2(Z, X)
    o = r - (0.068 + 0.006 * np.sin(ang * 3 + 1) + 0.004 * np.sin(ang * 5))
    d = slab(P, o, 0.019, 0.007)
    b = np.sqrt((X - 0.006) ** 2 + (Z + 0.004) ** 2) - 0.024
    wob = 1.4 * (fbm(P, 16, 2, 3) - 0.5)
    seam = two(np.sin(ang * 2 + 0.4 + wob) * r * 0.6, r - 0.046 + 0.01 * np.sin(ang * 3 + wob * 2))
    fat = -(o + 0.003)
    return d, fat, b, seam


# ============================================================ round
@cut('bp', ((-0.14, -0.01, -0.10), (0.14, 0.15, 0.10)), 0.0062,
     dict(meat='#9d1b24', meat2='#6e1018', marb=0.06, marbScale=85, grain=0.75, grainDir=[1, 0.2, 0], seamW=0.003))
def knuckle(P):
    d = ellipsoid(P, (0, 0.062, 0), (0.115, 0.068, 0.078))
    d = np.maximum(d, -(P[:, 1] - 0.004)) + bump(P, 18, 0.006, 2)
    seam = two(P[:, 2] - 0.01 - 0.02 * np.sin(P[:, 0] * 22), P[:, 2] + 0.045 + 0.2 * P[:, 0])
    fat = 0.012 + 0.03 * (fbm(P, 15, 2, 3) - 0.3) + (0.11 - P[:, 1]) * 0.6
    return d, fat, None, seam


@cut('bo', ((-0.18, -0.01, -0.09), (0.18, 0.11, 0.09)), 0.0065,
     dict(meat='#991a23', meat2='#6a0f17', marb=0.07, marbScale=85, grain=0.9, grainDir=[1, 0, 0]))
def bottomround(P):
    d = box(P, (0, 0.045, 0), (0.15, 0.045, 0.062), 0.028)
    d = d + 0.01 * sstep(0.0, 0.16, P[:, 0]) * (1 + P[:, 2] * 8) + bump(P, 14, 0.008, 5)
    fat = (P[:, 2] + 0.052) + 0.012 * (fbm(P, 14, 2, 8) - 0.5)
    return d, fat, None, None


@cut('mc', ((-0.19, -0.01, -0.07), (0.19, 0.11, 0.07)), 0.0058,
     dict(meat='#a01c25', meat2='#721019', marb=0.03, marbScale=90, grain=0.9, grainDir=[1, 0, 0]))
def eyeround(P):
    d = capsule(P, (-0.13, 0.048, 0), (0.13, 0.046, 0), 0.05, 0.044)
    d = np.maximum(d, np.abs(P[:, 0]) - 0.155) + bump(P, 16, 0.004, 3)
    fat = (P[:, 2] + 0.036) + 0.012 * (fbm(P, 16, 2, 2) - 0.45) + np.where(np.abs(P[:, 0]) > 0.15, FAR, 0)
    return d, fat, None, None


@cut('cp', ((-0.17, -0.01, -0.13), (0.17, 0.09, 0.13)), 0.0065,
     dict(meat='#9c1b24', meat2='#6d1018', marb=0.08, marbScale=85, grain=0.8, grainDir=[0.9, 0, 0.4], seamW=0.003))
def topround(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.13, -0.07), (-0.125, 0.07), (-0.01, 0.10), (0.125, 0.075), (0.14, -0.05), (0.02, -0.095)], 0.03) + bump(P * [1, 0, 1], 14, 0.008, 9)
    ht = 0.034 - 0.01 * sstep(0.04, 0.15, np.abs(X))
    d = slab(P, o, ht, 0.016, yc=0.036)
    seam = Z - 0.04 - 0.02 * np.sin(X * 20) + np.where(P[:, 1] < 0.02, FAR, 0)
    return d, None, None, seam


# ============================================================ tail, head
@cut('cl', ((-0.16, -0.01, -0.07), (0.16, 0.07, 0.07)), 0.0045,
     dict(meat='#8d1721', meat2='#5c0c14', fat='#f1e6cc', marb=0.25, marbScale=80, grain=0.5, grainDir=[0, 1, 0], seamW=0.003, marrow=0.007))
def oxtail(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    d = None; b = None; fat = None; seam = None
    for cx, cz, R, hh in ((-0.095, 0.0, 0.05, 0.026), (0.012, 0.01, 0.042, 0.024), (0.105, -0.004, 0.033, 0.022)):
        r = np.sqrt((X - cx) ** 2 + (Z - cz) ** 2); ang = np.arctan2(Z - cz, X - cx)
        o = r - (R + 0.004 * np.sin(ang * 4 + cx * 30))
        di = slab(P, o, hh, 0.007, yc=hh)
        bi = r - (R * 0.36 + 0.005 * np.cos(ang * 4))
        fi = -(o + 0.005)
        si = np.sin(ang * 1.5 + cx * 20 + 1.5 * (fbm(P, 20, 2, 4) - 0.5)) * r * 0.7
        d = di if d is None else np.minimum(d, di)
        b = bi if b is None else np.minimum(b, bi)
        fat = fi if fat is None else np.where(di < d + 1e-6, fi, fat)
        seam = si if seam is None else np.where(di < d + 1e-6, si, seam)
    return d, fat, b, seam


@cut('ch', ((-0.10, -0.01, -0.08), (0.10, 0.07, 0.08)), 0.0045,
     dict(meat='#851520', meat2='#560b13', fat='#e9e2d6', marb=0.35, marbScale=85, grain=0.7, grainDir=[1, 0, 0.4], seamW=0.003))
def cheek(P):
    d = ellipsoid(P, (0, 0.022, 0), (0.078, 0.027, 0.058))
    d = np.maximum(d, -(P[:, 1] - 0.003)) + bump(P, 30, 0.005, 6)
    fat = (0.045 - P[:, 1]) + 0.026 * (fbm(P, 20, 2, 5) - 0.42)                      # silverskin on top
    seam = two(P[:, 2] - 0.3 * P[:, 0] - 0.008 * np.sin(P[:, 0] * 60), P[:, 2] + 0.03 + 0.5 * P[:, 0])
    return d, fat, None, seam


@cut('le', ((-0.17, -0.01, -0.07), (0.17, 0.08, 0.07)), 0.0052,
     dict(meat='#b98f8c', meat2='#9b6e6e', fat='#d9c6bd', marb=0.0, grain=0.0, gloss=0.25, rough=0.62, bone=0))
def tongue(P):
    Q = P.copy(); Q[:, 1] = (Q[:, 1] - 0.028) / 0.7
    d = capsule(Q, (-0.12, 0, 0), (0.02, 0, 0), 0.046, 0.04)
    d = smin(d, capsule(Q, (0.02, 0, 0), (0.135, -0.006, 0), 0.04, 0.02), 0.03)
    d = smin(d, ellipsoid(Q, (-0.12, -0.012, 0), (0.05, 0.03, 0.05)), 0.02)
    d = d * 0.7 + 0.0035 * (vnoise(P, 260, 1) - 0.5) + bump(P, 30, 0.003, 2)
    fat = (P[:, 1] - 0.012) + 0.01 * (fbm(P, 20, 2, 4) - 0.5) + np.where(P[:, 0] > -0.06, FAR, 0)  # paler underside at the root
    return d, fat, None, None


# ============================================================ ground beef
@cut('mol', ((-0.12, -0.01, -0.09), (0.12, 0.08, 0.09)), 0.0045,
     dict(meat='#b02630', meat2='#8c1a23', fat='#f2ddd0', marb=1.0, marbScale=230, grain=0.0, gloss=0.35, rough=0.55))
def ground(P):
    d = ellipsoid(P, (0, 0.012, 0), (0.098, 0.048, 0.068))
    d = np.maximum(d, -(P[:, 1] - 0.003))
    # extruded strands: ridges that wander over the mound
    w = P[:, 2] * 380 + 9 * fbm(P, 22, 2, 3) + P[:, 0] * 60
    d = d - 0.0032 * np.abs(np.sin(w)) - 0.003 * (fbm(P, 60, 2, 8) - 0.5)
    return d, None, None, None


# ============================================================ offal
@cut('hi', ((-0.15, -0.01, -0.10), (0.15, 0.06, 0.10)), 0.0058,
     dict(meat='#5e1a1d', meat2='#471114', marb=0.0, grain=0.0, gloss=1.0, rough=0.22, bone=0))
def liver(P):
    d = ellipsoid(P, (-0.02, 0.012, 0), (0.118, 0.03, 0.078))
    d = smin(d, ellipsoid(P, (0.075, 0.01, 0.02), (0.058, 0.024, 0.05)), 0.03)
    d = np.maximum(d, -(P[:, 1] - 0.002)) + bump(P, 12, 0.005, 3)
    return d, None, None, None


@cut('cz', ((-0.10, -0.01, -0.09), (0.10, 0.12, 0.09)), 0.005,
     dict(meat='#70191e', meat2='#4f0f13', fat='#f0dfb4', marb=0.0, grain=0.5, grainDir=[1, 0.3, 0], gloss=0.7, rough=0.3, bone=0))
def heart(P):
    d = capsule(P, (-0.035, 0.046, 0), (0.052, 0.03, 0), 0.05, 0.02)
    d = smin(d, capsule(P, (-0.058, 0.062, 0.014), (-0.09, 0.078, 0.022), 0.019, 0.015), 0.012)
    d = smin(d, capsule(P, (-0.058, 0.05, -0.016), (-0.09, 0.056, -0.03), 0.017, 0.013), 0.012)
    d = np.maximum(d, -(P[:, 1] - 0.002)) + bump(P, 24, 0.004, 5)
    fat = (P[:, 0] + 0.042) + 0.035 * (fbm(P, 22, 2, 6) - 0.42)                      # fat around the base
    return d, fat, None, None


@cut('ri', ((-0.10, -0.01, -0.07), (0.10, 0.06, 0.07)), 0.0042,
     dict(meat='#6f2a22', meat2='#541c17', fat='#eadcc0', marb=0.0, grain=0.0, gloss=0.85, rough=0.28, bone=0))
def kidney(P):
    d = None
    rs = np.random.RandomState(4)
    for i in range(16):
        a = i / 16 * np.pi * 2
        c = (0.055 * np.cos(a) * (1 + 0.15 * rs.rand()), 0.02 + 0.006 * rs.rand(), 0.03 * np.sin(a) * (1 + 0.2 * rs.rand()))
        s = sphere(P, c, 0.019 + 0.004 * rs.rand())
        d = s if d is None else smin(d, s, 0.006)
    for c in ((-0.02, 0.026, 0.0), (0.02, 0.027, 0.002), (0.0, 0.028, -0.004)):
        d = smin(d, sphere(P, c, 0.02), 0.006)
    d = np.maximum(d, -(P[:, 1] - 0.002))
    fat = np.sqrt(P[:, 0] ** 2 + (P[:, 2] - 0.012) ** 2) - 0.012 + (0.03 - P[:, 1])
    return d, fat, None, None


@cut('mon', ((-0.16, -0.01, -0.11), (0.16, 0.06, 0.11)), 0.0058,
     dict(meat='#e7d9b8', meat2='#d6c59f', fat='#f3ead2', marb=0.0, grain=0.0, gloss=0.2, rough=0.7, bone=0, seams=1.0, seamScale=95, seamCol='#b9a57c'))
def tripe(P):
    X, Z = XZ(P)
    o = poly2(X, Z, [(-0.13, -0.07), (-0.12, 0.075), (0.11, 0.08), (0.135, -0.05), (0.02, -0.085)], 0.03) + bump(P * [1, 0, 1], 12, 0.01, 4)
    yc = 0.02 + 0.012 * np.sin(X * 24 + 1.5 * np.sin(Z * 20)) + 0.006 * np.sin(Z * 31)
    d = slab(P, o, 0.008, 0.005, yc=yc)
    return d, None, None, None


@cut('chu', ((-0.11, -0.01, -0.11), (0.11, 0.04, 0.11)), 0.0042,
     dict(meat='#e3b9a4', meat2='#cf9d88', fat='#f1dfcf', marb=0.0, grain=0.0, gloss=0.5, rough=0.45, bone=0))
def intestine(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    r = np.sqrt(X * X + Z * Z); th = np.arctan2(Z, X)
    pitch = 0.027
    k = np.round((r - 0.012 - pitch * th / (2 * np.pi)) / pitch)
    k = np.clip(k, 0, 2)
    rs = 0.012 + pitch * (th / (2 * np.pi) + k)
    d = np.sqrt((r - rs) ** 2 + (Y - 0.0125) ** 2) - (0.0115 + 0.0012 * np.sin(th * 14 + k))
    d = np.maximum(d, r - 0.1)
    return d.astype(F), None, None, None


@cut('mj', ((-0.10, -0.01, -0.08), (0.10, 0.06, 0.08)), 0.0045,
     dict(meat='#e6c1b0', meat2='#d4a493', fat='#f5e9d6', marb=0.0, grain=0.0, gloss=0.55, rough=0.4, bone=0))
def sweetbread(P):
    d = None
    rs = np.random.RandomState(7)
    for i in range(11):
        c = ((rs.rand() - 0.5) * 0.12, 0.014 + rs.rand() * 0.012, (rs.rand() - 0.5) * 0.08)
        s = ellipsoid(P, c, (0.022 + 0.014 * rs.rand(), 0.016 + 0.006 * rs.rand(), 0.02 + 0.01 * rs.rand()))
        d = s if d is None else smin(d, s, 0.008)
    d = np.maximum(d, -(P[:, 1] - 0.002))
    fat = 0.01 + 0.03 * (fbm(P, 30, 2, 2) - 0.35)
    return d, fat, None, None


@cut('tu', ((-0.14, -0.01, -0.08), (0.14, 0.05, 0.08)), 0.0045,
     dict(meat='#e8dfc8', meat2='#d9cdb0', marb=0.0, grain=0.0, gloss=0.3, rough=0.55, marrow=0.0105, bone=1))
def marrow(P):
    d = None; b = None
    for cz, x0, x1 in ((-0.038, -0.11, 0.10), (0.038, -0.10, 0.115)):
        c = capsule(P, (x0, 0.0, cz), (x1, 0.0, cz), 0.03, 0.026)
        c = np.maximum(c, np.maximum(P[:, 0] - x1, x0 - P[:, 0]))
        d = c if d is None else np.minimum(d, c)
    b = d.copy()
    d = np.maximum(d, P[:, 1] - 0.012)        # split lengthwise: the marrow channel faces up
    d = np.maximum(d, -(P[:, 1] + 0.024))
    return d, None, b, None


@cut('pt', ((-0.13, -0.01, -0.08), (0.13, 0.08, 0.08)), 0.0048,
     dict(meat='#ead9b2', meat2='#d8c294', fat='#f4ead0', marb=0.0, grain=0.0, gloss=0.35, rough=0.5, marrow=0.008, seamW=0.003))
def foot(P):
    X, Y, Z = P[:, 0], P[:, 1], P[:, 2]
    d = None; b = None; seam = None
    for cx, cz, R, hh in ((-0.062, 0.0, 0.043, 0.03), (0.062, 0.004, 0.04, 0.027)):
        r = np.sqrt((X - cx) ** 2 + (Z - cz) ** 2); ang = np.arctan2(Z - cz, X - cx)
        o = r - (R + 0.003 * np.sin(ang * 2 + 1))
        di = slab(P, o, hh, 0.008, yc=hh)
        bi = np.minimum(np.sqrt((X - cx - 0.009) ** 2 + (Z - cz) ** 2), np.sqrt((X - cx + 0.009) ** 2 + (Z - cz) ** 2)) - 0.0135
        si = r - R * 0.72
        d = di if d is None else np.minimum(d, di)
        b = bi if b is None else np.minimum(b, bi)
        seam = si if seam is None else np.where(di < d + 1e-6, si, seam)
    return d, None, b, seam


# ============================================================ build
def build_cuts(pack, only=None, log=print, reg=None):
    mats = {}
    tot = 0
    for name, c in (C if reg is None else reg).items():
        if only and name not in only:
            continue
        build = c['build']
        fn = lambda P: build(P)[0]
        h = c['h'] * HS
        xs, ys, zs = grid_points(c['bbox'][0], c['bbox'][1], h)
        vol = eval_grid(fn, xs, ys, zs)
        V, Fc = march(vol, (xs[0], ys[0], zs[0]), h)
        Fc = orient(V, Fc, fn)
        V0 = V.copy()
        Vp = project(fn, V, 2, e=0.0008)
        V = np.where((length(Vp - V0) < 0.8 * h)[:, None], Vp, V0).astype(F)
        N = normalize(grad(fn, V, 0.0012))
        d, fat, bone, seam = build(V)
        z = np.full(len(V), FAR, F)
        fat = z if fat is None else fat
        bone = z if bone is None else bone
        seam = z if seam is None else seam
        ao = sdf_ao(fn, V, N, dists=(0.004, 0.010, 0.022), strength=0.75)
        ao = np.clip(ao * (0.72 + 0.28 * sstep(0.0, 0.02, V[:, 1] - V[:, 1].min())), 0, 1)
        enc = lambda f: np.clip(f / 0.05, -1, 1) * 0.5 + 0.5
        aux = np.stack([enc(fat), enc(bone), ao, enc(seam)], 1)
        V = V - np.array([0, V[:, 1].min(), 0], F)       # rest on the tray
        pack.add('cut.' + name, V, N, Fc, aux, dict(kind='flesh', mat=name))
        mats[name] = c['mat']
        tot += len(V)
        log('%-4s v=%5d f=%5d  size %s' % (name, len(V), len(Fc), np.round(V.max(0) - V.min(0), 3)))
    log('cuts total verts', tot)
    return mats


if __name__ == '__main__':
    import sys
    pk = Pack()
    only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
    mats = build_cuts(pk, only)
    # lay them out on a grid for the test viewer
    cols = 7
    for i, e in enumerate(pk.entries):
        e['at'] = [(i % cols - (cols - 1) / 2) * 0.46, 0.0, (i // cols - 2) * 0.34]
    n = pk.write('out/cuts_test.bin', dict(mats=mats))
    print('bytes', n)
