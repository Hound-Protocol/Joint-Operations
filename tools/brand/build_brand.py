#!/usr/bin/env python3
"""Build the Hound Protocol and Joint Operations brand marks as SVG files.

All artwork is original vector geometry drawn in code. Wordmarks use Barlow
Semi Condensed (SIL Open Font License), converted to outlines so the files look
the same everywhere. See docs/brand.md for usage rules.

Usage: python3 tools/brand/build_brand.py   (writes site/assets/brand/*.svg and site/assets/img/favicon.svg)
"""
import math, pathlib, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import emblem as jo_emblem  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "site/assets/brand"
FONTS = ROOT / "site/assets/fonts"
WHITE, AMBER, INK = "#e9edee", "#c9a24a", "#0b0e10"
# Brand colours: Joint Operations is orange and white, Hound Protocol is white, black and red
ORANGE, RED, PAPER = "#f28c28", "#d0303a", "#f3efe6"

# Hound head in profile, facing right, on a 100 x 100 grid: pointed ear, long muzzle, cut neck.
HOUND = "M40 8 L50 29 L61 35 L84 42 L93 47 L90 53 L74 56 L63 60 L55 70 L54 92 L23 95 L28 58 L31 34 L35 24 Z"
HOUND_CUTS = ["M60 42 L67 43 L61 45.5 Z", "M41 15 L46.5 29 L38.5 30 Z", "M73 54.2 L88 51.6 L88.6 52.8 L73.6 55.6 Z"]


def text_path(text, font="barlow-semi-condensed-light.woff", size=40, tracking=0.3, x=0, y=0, anchor="start"):
    """Outline text as one SVG path. tracking is extra space per letter, as a share of the font size."""
    f = TTFont(FONTS / font)
    cmap, gs, upm = f.getBestCmap(), f.getGlyphSet(), f["head"].unitsPerEm
    scale, adv = size / upm, []
    for ch in text:
        g = cmap.get(ord(ch))
        adv.append((g, gs[g].width * scale if g else size * 0.3))
    width = sum(a for _, a in adv) + tracking * size * (len(text) - 1)
    cx = x - (width if anchor == "end" else width / 2 if anchor == "middle" else 0)
    d = []
    for g, a in adv:
        if g:
            pen = SVGPathPen(gs)
            gs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, cx, y)))
            d.append(pen.getCommands())
        cx += a + tracking * size
    return " ".join(d), width


def glyphs(text, size, tracking, font="barlow-semi-condensed-medium.woff"):
    """Measured glyphs for arc text: [(draw(matrix, dx) -> path d, advance)]."""
    f = TTFont(FONTS / font)
    cmap, gs, upm = f.getBestCmap(), f.getGlyphSet(), f["head"].unitsPerEm
    sc, out = size / upm, []
    for ch in text:
        g = cmap.get(ord(ch))
        adv = (gs[g].width * sc if g else size * 0.3) + tracking * size

        def draw(m, dx, g=g, ch=ch):
            if not g or ch == " ":
                return ""
            a, b, c, d, e, f_ = m
            dx += tracking * size / 2
            pen = SVGPathPen(gs)
            gs[g].draw(TransformPen(pen, (a * sc, b * sc, -c * sc, -d * sc, a * dx + e, b * dx + f_)))
            return pen.getCommands()
        out.append((draw, adv))
    return out


def hex_points(cx, cy, r):
    return " ".join(f"{cx + r * math.cos(math.radians(a)):.2f},{cy + r * math.sin(math.radians(a)):.2f}" for a in range(-90, 270, 60))


def hound_mark(mono=False, fg=WHITE, acc=RED, fill=INK):
    """Hound Protocol: a black hexagon insignia, white hound with a red collar and eye, red inner ring."""
    if mono:
        fg = acc = "currentColor"
    # Eye, inner ear and mouth are cut out of the head (even-odd fill), so the mark works in any single colour
    head = HOUND + " " + " ".join(HOUND_CUTS)
    collar = "M24.8 81 L54.5 80 L54.3 87.5 L24 88.5 Z"
    body = ""
    if not mono:
        body += f'<polygon points="{hex_points(100, 100, 92)}" fill="{fill}"/>'
    body += (f'<polygon points="{hex_points(100, 100, 92)}" fill="none" stroke="{fg}" stroke-width="6"/>'
             f'<polygon points="{hex_points(100, 100, 79)}" fill="none" stroke="{acc}" stroke-width="3"/>'
             f'<g transform="translate(46 42) scale(1.1)"><path d="{head}" fill="{fg}" fill-rule="evenodd"/>')
    if mono:
        body += "</g>"  # one colour: no collar, the eye stays cut out
    else:
        body += f'<path d="{HOUND_CUTS[0]}" fill="{acc}"/><path d="{collar}" fill="{acc}"/></g>'
    return body


def ops_mark(mono=False, bold=False):
    """Joint Operations: sixteen marks (sixteen players) around the host, four routes converging."""
    fg, acc = ("currentColor", "currentColor") if mono else (WHITE, ORANGE)
    w = 9 if bold else 5
    ticks = "".join(
        f'<line x1="{100 + math.cos(a) * 70:.2f}" y1="{100 + math.sin(a) * 70:.2f}" x2="{100 + math.cos(a) * 90:.2f}" y2="{100 + math.sin(a) * 90:.2f}" stroke="{fg}" stroke-width="{w}"/>'
        for a in (i / 16 * 2 * math.pi - math.pi / 2 for i in range(16)))
    chev = "".join(f'<path d="M87 33 L100 46 L113 33" transform="rotate({k * 90} 100 100)" fill="none" stroke="{fg}" stroke-width="{w}"/>' for k in range(4)) if not bold else ""
    return ticks + chev + f'<polygon points="100,72 128,100 100,128 72,100" fill="{acc}"/>'


def svg(w, h, body, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = {
        "hound-protocol-mark.svg": svg(200, 200, hound_mark(), "Hound Protocol"),
        "hound-protocol-mark-mono.svg": svg(200, 200, hound_mark(True), "Hound Protocol"),
        "joint-operations-mark.svg": svg(200, 200, ops_mark(), "Joint Operations"),
        "joint-operations-mark-mono.svg": svg(200, 200, ops_mark(True), "Joint Operations"),
        "hound-protocol-mark-light.svg": svg(200, 200, hound_mark(fg=INK, acc=RED, fill=PAPER), "Hound Protocol"),
        "joint-operations-mark-light.svg": svg(200, 200, ops_mark().replace(WHITE, INK), "Joint Operations"),
    }
    # Official Joint Operations emblem: three operatives, sixteen marks, the host marker
    files["joint-operations-emblem.svg"] = svg(400, 400, jo_emblem.emblem(glyphs), "Joint Operations")
    files["joint-operations-emblem-mono.svg"] = svg(400, 400, jo_emblem.emblem(glyphs, mono=True), "Joint Operations")
    # Light one-colour version for dark pages (the site background); an <img> cannot inherit currentColor
    files["joint-operations-emblem-white.svg"] = files["joint-operations-emblem-mono.svg"].replace("currentColor", WHITE)
    # Lockups: mark plus outlined wordmark
    hp1, w1 = text_path("HOUND", size=64, tracking=0.32, x=236, y=96)
    hp2, w2 = text_path("PROTOCOL", size=64, tracking=0.32, x=236, y=172)
    hp3, _ = text_path("DEVELOPMENT TEAM", font="share-tech-mono-regular.woff", size=18, tracking=0.55, x=240, y=214)
    wl = 236 + max(w1, w2) + 20
    files["hound-protocol-lockup.svg"] = svg(int(wl), 230, f'<g>{hound_mark()}</g><path d="{hp1} {hp2}" fill="{WHITE}"/><path d="{hp3}" fill="{RED}"/>', "Hound Protocol")
    jo1, wj = text_path("JOINT OPERATIONS", size=60, tracking=0.3, x=232, y=120)
    jo2, _ = text_path("MGSV MULTIPLAYER MOD", font="share-tech-mono-regular.woff", size=18, tracking=0.55, x=236, y=162)
    files["joint-operations-lockup.svg"] = svg(int(232 + wj + 20), 200, f'<g transform="scale(.5)">{jo_emblem.emblem(glyphs, mid="jo-ops-l")}</g><path d="{jo1}" fill="{WHITE}"/><path d="{jo2}" fill="{ORANGE}"/>', "Joint Operations")
    for name, body in files.items():
        (OUT / name).write_text(body, encoding="utf-8")
    # Site icons: favicon (bold for small sizes) and the faint background emblem
    # Favicon: the same idea simplified for 16 to 64 px, eight heavy marks and a large host diamond
    fav = "".join(
        f'<line x1="{100 + math.cos(a) * 62:.1f}" y1="{100 + math.sin(a) * 62:.1f}" x2="{100 + math.cos(a) * 88:.1f}" y2="{100 + math.sin(a) * 88:.1f}" stroke="{WHITE}" stroke-width="16"/>'
        for a in (i / 8 * 2 * math.pi - math.pi / 2 for i in range(8)))
    (ROOT / "site/assets/img/favicon.svg").write_text(svg(200, 200, f'<rect width="200" height="200" rx="34" fill="{INK}"/>{fav}<polygon points="100,58 142,100 100,142 58,100" fill="{ORANGE}"/>', "Joint Operations"), encoding="utf-8")
    # Inline marks for the site script (one colour, follows the text colour)
    js = ("  /* Brand marks, generated by tools/brand/build_brand.py. Do not edit by hand. */\n"
          "  var BRAND = {\n"
          f"    hp: '<svg class=\"bm\" viewBox=\"0 0 200 200\" aria-hidden=\"true\">{hound_mark(True)}</svg>',\n"
          f"    jo: '<svg class=\"bm\" viewBox=\"0 0 200 200\" aria-hidden=\"true\">{ops_mark(True)}</svg>',\n"
          f"    hpColor: '<svg class=\"bm\" viewBox=\"0 0 200 200\" aria-hidden=\"true\">{hound_mark()}</svg>',\n"
          f"    joColor: '<svg class=\"bm\" viewBox=\"0 0 200 200\" aria-hidden=\"true\">{ops_mark()}</svg>'\n"
          "  };\n")
    (ROOT / "site/src/js/04b-brand.js").write_text(js, encoding="utf-8")
    print("Wrote", ", ".join(files), "+ favicon.svg, site/src/js/04b-brand.js")


if __name__ == "__main__":
    main()
