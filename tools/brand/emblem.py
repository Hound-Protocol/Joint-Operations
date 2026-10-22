"""Joint Operations emblem: three operatives inside a ring with sixteen marks.

Original vector artwork drawn in code. Each figure is a list of primitives
(filled paths and thick round-capped strokes). Details such as vest pouches,
straps and helmet seams are cut out with a mask, so the emblem also works in a
single colour. The centre operative gets a dark halo so it reads in front of
the two flanking operatives.
"""
import math

# Primitive kinds: ("p", d) filled path, ("s", points, width) stroke, ("c", cx, cy, r) circle,
# ("x", points, width) detail cut (drawn in the mask's black).

FRONT = [  # Facing the viewer, rifle held across the chest. Head top at y=0, feet at y=166.
    ("p", "M-11 16 C-12 4 -6 -1 0 -1 C6 -1 12 4 11 16 L8 17 L8 12 H-8 L-8 17 Z"),   # helmet
    ("p", "M-4 -3 H4 V3 H-4 Z"),                                                   # optics mount
    ("c", 0, 18, 8),                                                               # head
    ("p", "M-4 24 H4 V31 H-4 Z"),                                                  # neck
    ("p", "M-24 34 Q-22 28 -14 28 H14 Q22 28 24 34 L20 54 L15 72 H-15 L-20 54 Z"), # torso and plate carrier
    ("p", "M-16 70 H16 V77 H-16 Z"),                                               # belt
    ("p", "M15 72 L24 72 L24 86 L16 86 Z"),                                        # holster
    ("s", [(-20, 34), (-27, 53)], 9.5),                                            # left upper arm
    ("s", [(20, 34), (26, 55)], 9.5),                                              # right upper arm
    ("p", "M4 63 L10 57 L18 66 L12 72 Z"),                                         # magazine
    ("p", "M-30 21 L-24 15 L-21 18 L-27 24 Z"),                                    # muzzle device
    ("s", [(-8, 77), (-14, 117), (-19, 156)], 13),                                 # left leg
    ("s", [(8, 77), (14, 117), (19, 156)], 13),                                    # right leg
    ("p", "M-27 153 H-12 Q-10 163 -12 166 H-29 Q-31 158 -27 153 Z"),               # boots
    ("p", "M27 153 H12 Q10 163 12 166 H29 Q31 158 27 153 Z"),
    ("x", [(-5, 29), (0, 36), (5, 29)], 1.6),                                      # collar
    ("x", [(-16, 52), (16, 52)], 1.6),                                             # pouch row
    ("x", [(-6, 52), (-6, 66)], 1.6), ("x", [(6, 52), (6, 66)], 1.6),
    ("x", [(-14, 34), (-14, 46)], 1.4), ("x", [(14, 34), (14, 40)], 1.4),          # straps
    ("x", [(-14, 73.5), (14, 73.5)], 1.2),                                         # belt line
    ("x", [(-17, 118), (-12, 118)], 3), ("x", [(12, 118), (17, 118)], 3),          # knee pads
    ("o", [(23, 79), (-27, 22)], 6),                                               # rifle across the chest
    ("o", [(-27, 53), (-10, 47)], 9.5),                                            # forearms over the rifle
    ("o", [(26, 55), (12, 68)], 9.5),
]

PROFILE = [  # Facing right, rifle shouldered and aimed. Head top at y=0, feet at y=166.
    ("p", "M-10 16 C-11 4 -5 -1 2 -1 C9 -1 13 4 13 13 L10 15 L-10 17 Z"),          # helmet
    ("p", "M11 4 L17 3 L18 9 L12 10 Z"),                                           # optics mount
    ("c", 4, 18, 8),                                                               # head
    ("p", "M-2 24 H6 V31 H-2 Z"),                                                  # neck
    ("p", "M-25 32 Q-26 29 -21 29 H-10 V66 H-22 Q-25 66 -25 62 Z"),                # pack
    ("p", "M-11 30 L8 28 Q16 30 15 40 L12 74 H-13 L-14 50 Z"),                     # torso
    ("p", "M-13 72 H12 V78 H-13 Z"),                                               # belt
    ("s", [(4, 35), (1, 51), (20, 42)], 9),                                        # rear arm to grip
    ("s", [(9, 34), (28, 47), (44, 37)], 9),                                       # front arm to handguard
    ("s", [(-1, 39), (70, 31)], 6),                                                # rifle
    ("p", "M25 37 L32 36 L35 50 L28 51 Z"),                                        # magazine
    ("p", "M16 30 L31 28 L31 33 L16 35 Z"),                                        # optic
    ("p", "M68 28 L76 27 L76 34 L68 35 Z"),                                        # muzzle device
    ("s", [(3, 78), (20, 115), (18, 157)], 13),                                    # front leg
    ("s", [(-6, 78), (-13, 116), (-26, 154)], 13),                                 # rear leg
    ("p", "M10 153 H29 Q33 159 30 166 H10 Z"),                                     # boots
    ("p", "M-37 151 L-21 149 Q-17 157 -20 163 L-37 165 Z"),
    ("x", [(-10, 9), (12, 8)], 1.4),                                               # helmet rail
    ("x", [(-10, 38), (-24, 38)], 1.4), ("x", [(-10, 52), (-24, 52)], 1.4),        # pack straps
    ("x", [(-9, 52), (13, 50)], 1.6),                                              # pouch row
    ("x", [(2, 51), (1, 66)], 1.6),
    ("x", [(-12, 75), (12, 75)], 1.2),                                             # belt line
    ("x", [(19, 116), (23, 118)], 3),                                              # knee pad
]


def _pts(pts):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def figure(prims, colour, halo=0):
    """SVG for one figure. colour fills shapes; halo > 0 draws an outline of that width in colour instead."""
    out = []
    for p in prims:
        k = p[0]
        if k in ("x", "o"):
            continue
        if k == "p":
            out.append(f'<path d="{p[1]}" fill="{colour}"' + (f' stroke="{colour}" stroke-width="{halo}" stroke-linejoin="round"' if halo else "") + "/>")
        elif k == "c":
            out.append(f'<circle cx="{p[1]}" cy="{p[2]}" r="{p[3] + halo / 2}" fill="{colour}"/>')
        elif k == "s":
            out.append(f'<polyline points="{_pts(p[1])}" fill="none" stroke="{colour}" stroke-width="{p[2] + halo}" stroke-linecap="round" stroke-linejoin="round"/>')
    return "".join(out)


def _line(pts, colour, w):
    return f'<polyline points="{_pts(pts)}" fill="none" stroke="{colour}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def details(prims, colour, base="#fff"):
    """Cut details, and overlays: parts drawn on top of the body with a thin outline (a rifle across the chest)."""
    out = []
    for p in prims:
        if p[0] == "x":
            out.append(_line(p[1], colour, p[2]))
        elif p[0] == "o":
            out.append(_line(p[1], colour, p[2] + 3.2) + _line(p[1], base, p[2]))
    return "".join(out)


def operatives_mask(mid):
    """Mask content: white figures, black details and halo. Centre figure in front."""
    flank = 0.86
    left = f'<g transform="translate(122 152) scale({-flank} {flank})">'
    right = f'<g transform="translate(278 152) scale({flank} {flank})">'
    centre = '<g transform="translate(200 133)">'
    return (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">'
            f'<rect width="400" height="400" fill="#000"/>'
            f"{left}{figure(PROFILE, '#fff')}{details(PROFILE, '#000')}</g>"
            f"{right}{figure(PROFILE, '#fff')}{details(PROFILE, '#000')}</g>"
            f"{centre}{figure(FRONT, '#000', halo=8)}{figure(FRONT, '#fff')}{details(FRONT, '#000')}</g>"
            "</mask>")


def arc_text(text_glyphs, r, centre_deg, top=True, cx=200, cy=200):
    """Place pre-measured glyphs [(path_fn, advance)] along a circle. top=True reads clockwise over the top."""
    total = sum(a for _, a in text_glyphs)
    s, out = 0.0, []
    for draw, a in text_glyphs:
        mid = s + a / 2 - total / 2
        th = math.radians(centre_deg) + (mid / r if top else -mid / r)
        phi = th + (math.pi / 2 if top else -math.pi / 2)
        px, py = cx + r * math.cos(th), cy + r * math.sin(th)
        c, sn = math.cos(phi), math.sin(phi)
        # local glyph coords (u, v): u along the tangent, v downwards
        out.append(draw((c, sn, -sn, c, px, py), -a / 2))
        s += a
    return "".join(out)


def emblem(glyphs, mono=False, mid="jo-ops"):
    """glyphs(text, size, tracking) -> list of (draw(matrix, dx) -> path d, advance)."""
    WHITE, AMBER, INK = "#e9edee", "#f28c28", "#0b0e10"  # Joint Operations: orange and white
    fg, acc = ("currentColor", "currentColor") if mono else (WHITE, AMBER)
    parts = []
    if not mono:
        parts.append(f'<circle cx="200" cy="200" r="197" fill="{INK}"/>')
    parts.append(f'<circle cx="200" cy="200" r="194" fill="none" stroke="{fg}" stroke-width="4"/>')
    parts.append(f'<circle cx="200" cy="200" r="160" fill="none" stroke="{acc}" stroke-width="3"/>')
    parts.append(f'<circle cx="200" cy="200" r="154" fill="none" stroke="{fg}" stroke-width="1" stroke-opacity=".5"/>')
    # Sixteen marks: sixteen players. The top one is the host, drawn as a diamond.
    for i in range(16):
        a = i / 16 * 2 * math.pi - math.pi / 2
        x1, y1 = 200 + math.cos(a) * 138, 200 + math.sin(a) * 138
        x2, y2 = 200 + math.cos(a) * 150, 200 + math.sin(a) * 150
        parts.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{fg}" stroke-width="3"/>')
    # Text band
    top = arc_text(glyphs("JOINT OPERATIONS", 23, 0.34), 169, -90, top=True)
    bot = arc_text(glyphs("HOUND PROTOCOL", 15, 0.5), 184, 90, top=False)
    parts.append(f'<path d="{top}" fill="{fg}"/><path d="{bot}" fill="{acc}"/>')
    for deg in (180, 0):
        x = 200 + 177 * math.cos(math.radians(deg))
        parts.append(f'<polygon points="{x - 5:.1f},200 {x:.1f},195 {x + 5:.1f},200 {x:.1f},205" fill="{acc}"/>')
    # Operatives
    parts.append(operatives_mask(mid))
    parts.append(f'<rect width="400" height="400" fill="{fg}" mask="url(#{mid})"/>')
    # Ground line and the host marker over the centre operative
    parts.append(f'<path d="M108 301 H292" stroke="{fg}" stroke-width="1.5" stroke-opacity=".6"/>')
    parts.append(f'<path d="M150 307 H250" stroke="{acc}" stroke-width="1.5"/>')
    parts.append(f'<polygon points="200,108 208,118 200,128 192,118" fill="{acc}"/>')
    return "".join(parts)
