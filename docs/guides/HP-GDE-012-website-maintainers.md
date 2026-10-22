# Website Maintainer Guide
Code: HP-GDE-012 · Version 1.0 · Effective 2026-10-22 · Owner: Development · For: contributors who change the website

How the website is built, where its content lives, and how to change it safely.

## How it works
- The site is static: HTML, CSS and plain JavaScript in `site/`, served by GitHub Pages. No server, no cookies, no trackers ([privacy](../privacy.md)).
- Live data (releases, contracts, commits) comes from the public GitHub API in the visitor's browser and is cached for a few minutes. If GitHub cannot be reached, the site shows the bundled data.
- Every push to `main` that touches the site deploys it automatically. Releases are published by the Release workflow when the version in `site/data/config.json` changes ([HP-SOP-003](HP-SOP-003-release.md)).

## Where things are
| What | Where |
|---|---|
| Page shell | `site/index.html` |
| Styles | `site/assets/css/main.css` |
| Scripts (edit these) | `site/src/js/*.js`, one file per section, joined in file-name order |
| Built script (never edit) | `site/assets/js/app.js`, made by `tools/build_js.py` |
| Content data | `site/data/*.json`: config, team, contracts, devlog, briefing, mods, servers, docs library, handbook index, records |
| Brand files | `site/assets/brand/`, made by `tools/brand/build_brand.py` |
| Documents | `docs/`, `research/` and the README files; the site reads them as Markdown |

## Making a change
1. Edit the source files, then rebuild:
```
python3 tools/build_js.py
python3 tools/css_compat.py
python3 tools/guides_index.py
```
2. Preview locally:
```
python3 -m http.server 8000 -d site
```
Then open http://localhost:8000.
3. Run the checks that CI runs:
```
python3 tools/build_js.py --check
python3 tools/css_compat.py --check
python3 tools/guides_index.py --check
python3 tools/contracts_md.py --check
python3 tools/check_links.py
```
4. Open a pull request ([HP-SOP-002](HP-SOP-002-pull-request-review.md)). The browser smoke test runs the site in Chromium, Firefox and WebKit, on desktop and phone sizes.

## Common edits
- **Dev log entry:** add it at the top of `site/data/devlog.json`.
- **New handbook document:** add `docs/guides/HP-XXX-NNN-name.md` with the title and metadata lines ([HP-GDE-005](HP-GDE-005-documentation-style.md)), add its audience and one-line summary in `tools/guides_index.py`, then run the index tool.
- **New contract:** add it to `site/data/contracts.json`, then run `python3 tools/contracts_md.py`.
- **Team and chain of command:** `site/data/team.json` (`hierarchy`, `seats`, `departments`).
- **Brand change:** edit `tools/brand/*.py` and run `python3 tools/brand/build_brand.py`. Never edit the generated SVG files by hand.

## Rules for site code
- Plain JavaScript in the existing style (`var`, functions), so older browsers keep working. No build step beyond the tools above, no frameworks.
- Every new layout value that uses `min()`, `max()` or `clamp()` gets a fallback: `tools/css_compat.py` adds it for you.
- Respect **Options**: animations stop when Animations is off (`.no-motion`), and nothing flashes.
- Escape every piece of data you put into HTML with `esc()`.
- Keep text short, plain and in our terms: host and clients, never "friends" or character names.
