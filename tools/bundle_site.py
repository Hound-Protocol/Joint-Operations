#!/usr/bin/env python3
"""Build a single self-contained HTML file of the site (works opened from disk).

Usage: python3 tools/bundle_site.py [output.html]
"""
import base64, json, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
site = root / "site"
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / "hound-protocol.html")

def safe(text):
    return text.replace("</", "<\\/")

data = {n: json.loads((site / "data" / f"{n}.json").read_text()) for n in ["config", "servers", "mods", "docs", "contracts", "briefing", "devlog"]}
data["content"] = {}
for d in data["docs"]["docs"] + [{"path": "ROADMAP.md"}]:
    f = root / d["path"]
    if f.exists():
        data["content"][d["path"]] = f.read_text()

def data_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()

html = (site / "index.html").read_text()
html = re.sub(r'<link rel="preload"[^>]*>\n', "", html)  # fonts are inlined below
for name in ["emblem.svg", "favicon.svg"]:
    html = html.replace(f"assets/img/{name}", data_uri(site / "assets/img" / name, "image/svg+xml"))
css = (site / "assets/css/main.css").read_text()
js = (site / "assets/js/app.js").read_text()
css = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: 'url("' + data_uri(site / "assets/fonts" / m.group(1), "font/woff") + '")', css)
html = html.replace('<link rel="stylesheet" href="assets/css/main.css">', "<style>\n" + css + "\n</style>")
html = html.replace('<script src="assets/js/app.js"></script>',
                    "<script>window.JO_EMBED = " + safe(json.dumps(data)) + ";</script>\n<script>\n" + safe(js) + "\n</script>")
out.write_text(html)
print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
