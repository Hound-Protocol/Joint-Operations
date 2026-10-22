#!/usr/bin/env python3
"""Fail if any markdown file links to a relative path that does not exist."""
import glob, os, re, sys

bad = []
for f in glob.glob("**/*.md", recursive=True):
    if f.startswith(("_site", "node_modules")):
        continue
    for m in re.finditer(r"\]\(([^)\s]+)\)", open(f, encoding="utf-8").read()):
        url = m.group(1)
        if re.match(r"^(https?:|mailto:|#)", url):
            continue
        target = os.path.normpath(os.path.join(os.path.dirname(f), url.split("#")[0]))
        if not os.path.exists(target):
            bad.append(f"{f}: {url}")
print("\n".join(bad) if bad else "All relative links resolve.")
sys.exit(1 if bad else 0)
