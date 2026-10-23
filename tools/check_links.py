#!/usr/bin/env python3
"""Check every internal link in the repository's documentation and site data.

What it checks:
  - Markdown links [text](target) in *.md files (root, docs/, research/, .github/): the target file exists, and
    a #anchor matches a heading in that file (GitHub's heading slugs).
  - Website links "#/docs/<id>" and "#/guides/<id>" anywhere in Markdown, site data (JSON) and site scripts:
    the id exists in site/data/docs.json or site/data/guides.json.
  - Paths listed in site/data/docs.json and site/data/guides.json exist.
External links (http, https, mailto) are not fetched.

Usage: python3 tools/check_links.py        exits 1 and lists every broken link
"""
import json, pathlib, re, sys, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
MD_DIRS = [ROOT, ROOT / "docs", ROOT / "research", ROOT / ".github"]
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
SITE = re.compile(r"#/(docs|guides)/([A-Za-z0-9._-]+)")
FENCE = re.compile(r"^(```|~~~)")


def md_files():
    seen = set()
    for d in MD_DIRS:
        it = d.glob("*.md") if d == ROOT else d.rglob("*.md")
        for p in it:
            if "node_modules" in p.parts or p in seen:
                continue
            seen.add(p)
            yield p


def slug(text):
    t = re.sub(r"`|\*|_(?=\w)|(?<=\w)_", "", text.strip().lower())
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"[^\w\- ]", "", t, flags=re.UNICODE)
    return t.replace(" ", "-")


_anchors = {}


def anchors(path):
    if path not in _anchors:
        found, counts, fenced = set(), {}, False
        for line in path.read_text(encoding="utf-8").splitlines():
            if FENCE.match(line.strip()):
                fenced = not fenced
                continue
            m = None if fenced else re.match(r"^#{1,6}\s+(.*?)\s*#*\s*$", line)
            if m:
                s = slug(m.group(1))
                n = counts.get(s, 0)
                counts[s] = n + 1
                found.add(s if n == 0 else f"{s}-{n}")
        _anchors[path] = found
    return _anchors[path]


def strip_code(text):
    out, fenced = [], False
    for line in text.splitlines():
        if FENCE.match(line.strip()):
            fenced = not fenced
            out.append("")
            continue
        out.append("" if fenced else re.sub(r"`[^`]*`", "", line))
    return "\n".join(out)


def main():
    docs = json.loads((ROOT / "site/data/docs.json").read_text())["docs"]
    guides = json.loads((ROOT / "site/data/guides.json").read_text())["guides"]
    ids = {"docs": {d["id"] for d in docs} | {g["id"] for g in guides}, "guides": {g["id"] for g in guides}}
    errors = []

    for entry in docs + guides:
        if not (ROOT / entry["path"]).exists():
            errors.append(f"site/data: {entry['id']} points to missing {entry['path']}")

    for p in md_files():
        rel = p.relative_to(ROOT)
        text = strip_code(p.read_text(encoding="utf-8"))
        for n, line in enumerate(text.splitlines(), 1):
            for m in LINK.finditer(line):
                target = m.group(1)
                if re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I) or target.startswith("#/"):
                    continue
                file_part, _, frag = target.partition("#")
                dest = p if not file_part else (p.parent / urllib.parse.unquote(file_part)).resolve()
                if not dest.exists():
                    errors.append(f"{rel}:{n}: missing file {target}")
                    continue
                if frag and dest.suffix == ".md" and frag.lower() not in anchors(dest):
                    errors.append(f"{rel}:{n}: no heading #{frag} in {dest.relative_to(ROOT)}")
            for m in SITE.finditer(line):
                if m.group(2) not in ids[m.group(1)]:
                    errors.append(f"{rel}:{n}: no {m.group(1)} entry '{m.group(2)}' on the website")

    for p in list((ROOT / "site/data").glob("*.json")) + list((ROOT / "site/src/js").glob("*.js")):
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            for m in SITE.finditer(line):
                if m.group(2) not in ids[m.group(1)]:
                    errors.append(f"{p.relative_to(ROOT)}:{n}: no {m.group(1)} entry '{m.group(2)}' on the website")

    if errors:
        print(f"{len(errors)} broken link(s):")
        for e in errors:
            print("  " + e)
        sys.exit(1)
    print("All internal links resolve.")


if __name__ == "__main__":
    main()
