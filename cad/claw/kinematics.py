"""Linkage check for the claw: spider rises by the coil stroke, links pull the prong levers up, prongs close.
Radial plane (r, z); z = 0 at the prong pivot axis. Prints prong angle and tip radius across the stroke."""
import math

RP = 30.0  # pivot radius
A = 22.0  # lever length, pivot to link pin
ALPHA = 10.0  # lever angle above horizontal, open
TIP = (10.0, -70.0)  # finger tip, local to pivot, open
RS = 12.0  # spider link-pin radius
LINK = 20.0  # link pin-to-pin
STROKE = 8.0


def rot(p, th):  # CW in (r, z) is closing
    x, y = p
    c, s = math.cos(th), math.sin(th)
    return (x * c + y * s, -x * s + y * c)


def lever(th):
    al = math.radians(ALPHA)
    return rot((-A * math.cos(al), A * math.sin(al)), th)


L0 = lever(0)
ZS0 = L0[1] + math.sqrt(LINK**2 - (RS - (RP + L0[0])) ** 2)


def solve(u):
    zs = ZS0 + u
    lo, hi = -0.2, 1.2
    for _ in range(60):
        m = (lo + hi) / 2
        L = lever(m)
        d = math.hypot(RS - (RP + L[0]), zs - L[1])
        if d > LINK:
            lo = m
        else:
            hi = m
    return m


print(f"spider pin z open = {ZS0:.2f}")
for u in [0, 2, 4, 6, 8]:
    th = solve(u)
    t = rot(TIP, th)
    L = lever(th)
    print(
        f"stroke {u:4.1f}  prong {math.degrees(th):5.1f} deg  tip r {RP + t[0]:5.1f} z {t[1]:6.1f}  lever pin r {RP + L[0]:4.1f}"
    )
