#!/usr/bin/env python3
"""Print what the release workflow needs for the current version.

Reads the version from site/data/config.json and its section from CHANGELOG.md
("## vX.Y.Z · Name · YYYY-MM-DD"). Writes the notes to the given file and
prints three lines: tag, title, and "prerelease" or "stable".
Versions below 0.1 are foundation releases and always pre-releases (HP-SOP-003).

Usage: python3 tools/release_notes.py NOTES_FILE
"""
import json, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
version = json.loads((root / "site/data/config.json").read_text(encoding="utf-8"))["version"]
log = (root / "CHANGELOG.md").read_text(encoding="utf-8")
m = re.search(rf"^## v{re.escape(version)} · (.+?)(?: · \d{{4}}-\d{{2}}-\d{{2}})?$\n(.*?)(?=^## |\Z)", log, re.M | re.S)
if not m:
    sys.exit(f"CHANGELOG.md has no section for v{version}. Add one (see docs/guides/HP-SOP-003-release.md).")
name, notes = m.group(1).strip(), m.group(2).strip()
site = json.loads((root / "site/data/config.json").read_text(encoding="utf-8")).get("siteUrl", "")
notes += f"\n\nWebsite: {site} · Full changelog: CHANGELOG.md"
major, minor = (int(x) for x in version.split(".")[:2])
pathlib.Path(sys.argv[1]).write_text(notes + "\n", encoding="utf-8")
print(f"v{version}")
print(f"v{version} · {name}")
print("stable" if (major > 0 or minor >= 1) else "prerelease")
