#!/usr/bin/env python3
"""Assemble the deployable site in one directory.

Steps: build app.js from modules, copy site/, write the build number, copy the
documents the library reads, pre-render static doc pages, and (with --woff2)
convert fonts to WOFF2.
Usage: python3 tools/assemble_site.py OUT_DIR [--woff2] [--url SITE_URL]
"""
import argparse, pathlib, shutil, subprocess, sys

root = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--woff2", action="store_true")
ap.add_argument("--url", default="https://hound-protocol.github.io/Joint-Operations/")
args = ap.parse_args()
out = pathlib.Path(args.out).resolve()
py = sys.executable

def run(*cmd):
    subprocess.run([py, *cmd], cwd=root, check=True)

run("tools/build_js.py")
if out.exists():
    shutil.rmtree(out)
shutil.copytree(root / "site", out, ignore=shutil.ignore_patterns("src", "content"))
run("tools/write_build_info.py", str(out / "data" / "build.json"))
content = out / "content"
content.mkdir()
for name in ["README.md", "ROADMAP.md", "CHANGELOG.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md"]:
    shutil.copy(root / name, content / name)
for folder in ["docs", "research"]:
    shutil.copytree(root / folder, content / folder)
run("tools/prerender_docs.py", str(out), args.url)
if args.woff2:
    run("tools/fonts_woff2.py", str(out))
print(f"Site assembled in {out}")
