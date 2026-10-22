#!/usr/bin/env python3
"""Build the handbook index (site/data/guides.json) from docs/guides/*.md.

Each handbook document starts with a title line and one metadata line:
  # Title
  Code: HP-POL-001 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · For: everyone

The tool also lists every handbook document in the docs library
(site/data/docs.json, group "Handbook"), so links between documents resolve.

Usage:
  python3 tools/guides_index.py          # write the index
  python3 tools/guides_index.py --check  # fail if the index is out of date
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/guides"
OUT = ROOT / "site/data/guides.json"
DOCS = ROOT / "site/data/docs.json"
TYPES = {"POL": "Policy", "SOP": "Procedure", "GDE": "Guide"}
AUDIENCE = {  # who the website lists each document for
    "HP-GDE-001": "Players", "HP-GDE-002": "Players",
    "HP-GDE-003": "Contributors", "HP-GDE-005": "Contributors", "HP-POL-001": "Contributors", "HP-POL-002": "Contributors",
    "HP-POL-003": "Contributors", "HP-SOP-001": "Contributors", "HP-SOP-002": "Contributors",
    "HP-GDE-004": "Quality", "HP-POL-006": "Quality", "HP-SOP-003": "Quality", "HP-SOP-005": "Quality",
    "HP-GDE-006": "Administration", "HP-POL-004": "Administration", "HP-POL-005": "Administration", "HP-SOP-004": "Administration",
    "HP-SOP-006": "Administration", "HP-SOP-007": "Administration", "HP-SOP-008": "Administration",
}
SUMMARY = {  # one line for the Guides page
    "HP-GDE-001": "What you need, how to install, host and join, and how to stay safe.",
    "HP-GDE-002": "The one launch option Linux needs, Proton versions, Bazzite notes and known issues.",
    "HP-GDE-003": "From zero to your first merged contract: setup, checks, branches and pull requests.",
    "HP-GDE-004": "Test rigs, kinds of tests, bug reports and reviewing contracts.",
    "HP-GDE-005": "How we write: plain English, sources, structure and handbook codes.",
    "HP-GDE-006": "Settings, regular duties, decisions, funding and incidents for Administration.",
    "HP-POL-001": "The rules every contributor accepts: sign-off, ownership, what never to do, leaving.",
    "HP-POL-002": "AI-assisted code and content are welcome, with responsibility, disclosure and clear limits.",
    "HP-POL-003": "No game files, no copied mod code, research in our own words.",
    "HP-POL-004": "Two-factor authentication, secrets, least access and safe releases.",
    "HP-POL-005": "Community standards, the enforcement ladder, logging and appeals.",
    "HP-POL-006": "Definition of done, release gates and bug severity.",
    "HP-SOP-001": "A contract from draft to signed record: publish, claim, deliver, review, record.",
    "HP-SOP-002": "Opening, checking, reviewing and merging pull requests.",
    "HP-SOP-003": "Version numbers, changelog, tags and GitHub releases.",
    "HP-SOP-004": "Signing contributor records and updating rank roles.",
    "HP-SOP-005": "Reproducing, grading and routing bug reports.",
    "HP-SOP-006": "Revoke first: what to do when a secret leaks or something goes wrong.",
    "HP-SOP-007": "Giving and removing access, the same day, every time.",
    "HP-SOP-008": "Running the Discord server from its blueprint, safely.",
}
META = re.compile(r"^Code: (HP-(POL|SOP|GDE)-\d{3}) · Version ([\d.]+) · Effective (\d{4}-\d{2}-\d{2}) · Owner: ([^·]+?) · (?:For|Applies to|Used by): (.+)$")


def build():
    guides, errors = [], []
    for path in sorted(SRC.glob("HP-*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        title = lines[0][2:].strip() if lines and lines[0].startswith("# ") else ""
        m = META.match(lines[1].strip()) if len(lines) > 1 else None
        if not title or not m:
            errors.append(f"{path.name}: needs '# Title' then the metadata line (see HP-GDE-005)")
            continue
        code = m.group(1)
        if not path.name.startswith(code + "-"):
            errors.append(f"{path.name}: file name must start with its code {code}")
        summary = SUMMARY.get(code, "")
        guides.append({"id": code.lower(), "code": code, "title": title, "type": TYPES[m.group(2)],
                       "audience": AUDIENCE.get(code, "Contributors"), "version": m.group(3), "effective": m.group(4),
                       "owner": m.group(5).strip(), "for": m.group(6).strip(), "summary": summary,
                       "path": str(path.relative_to(ROOT))})
    return guides, errors


def docs_with(guides):
    d = json.loads(DOCS.read_text(encoding="utf-8"))
    rest = [x for x in d["docs"] if x.get("group") != "Handbook"]
    hb = [{"id": g["id"], "title": f"{g['code']} {g['title']}", "group": "Handbook", "path": g["path"]} for g in guides]
    d["docs"] = rest + hb
    return json.dumps(d, indent=2, ensure_ascii=False) + "\n"


def main():
    guides, errors = build()
    for e in errors:
        print("ERROR", e)
    if errors:
        sys.exit(1)
    index = json.dumps({"note": "Generated by tools/guides_index.py from docs/guides/. Do not edit by hand.", "guides": guides},
                       indent=2, ensure_ascii=False) + "\n"
    docs = docs_with(guides)
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != index or DOCS.read_text(encoding="utf-8") != docs:
            sys.exit("The handbook index is out of date. Run: python3 tools/guides_index.py")
        print(f"Handbook index up to date ({len(guides)} documents).")
        return
    OUT.write_text(index, encoding="utf-8")
    DOCS.write_text(docs, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} and the docs library ({len(guides)} documents).")


if __name__ == "__main__":
    main()
