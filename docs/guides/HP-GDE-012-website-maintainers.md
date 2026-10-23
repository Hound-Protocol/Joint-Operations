# Website Maintainer Guide
Code: HP-GDE-012 · Version 1.4 · Effective 2026-10-24 · Owner: Development · For: contributors who change the website

How the website is built, where its content lives, and how to change it safely.

## How it works
- The site is static: HTML, CSS and plain JavaScript in `site/`, served by GitHub Pages. No server of ours, no cookies, no trackers ([privacy](../privacy.md)). The one exception is the sign-in relay, a small Cloudflare Worker in `tools/signin-relay/` that only completes GitHub sign-in ([signin.md](../signin.md)).
- Live data (releases, contracts, commits) comes from the public GitHub API in the visitor's browser and is cached for a few minutes. If GitHub cannot be reached, the site shows the bundled data.
- Every push to `main` that touches the site deploys it automatically. Releases are published by the Release workflow when the version in `site/data/config.json` changes ([HP-SOP-003](HP-SOP-003-release.md)).

## Where things are
| What | Where |
|---|---|
| Page shell | `site/index.html` |
| Styles | `site/assets/css/main.css` |
| Scripts (edit these) | `site/src/js/*.js`, one file per section, joined in file-name order |
| Built script (never edit) | `site/assets/js/app.js`, made by `tools/build_js.py` |
| Content data | `site/data/*.json`: config, team, contracts, briefing, mods, servers, docs library, handbook index, records |
| Brand files | `site/assets/brand/`, made by `tools/brand/build_brand.py` |
| Documents | `docs/`, `research/` and the README files; the site reads them as Markdown. The Library is `docs.json`, the Handbook is generated from `docs/guides/` |
| Sign-in | `site/src/js/19e-signin.js` (sign-in, Profile), `config.json` → `signin` (relay address and restricted areas) |

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
node tests/relay_test.mjs          # when you change tools/signin-relay/worker.js
```
4. Open a pull request ([HP-SOP-002](HP-SOP-002-pull-request-review.md)). The browser smoke test runs the site in Chromium, Firefox and WebKit, on desktop and phone sizes, and `tests/screens.py` saves screenshots of key screens: open the run's **screens** artifact to see what changed.

## Common edits
- **Dev log entry:** add it at the top of [`docs/devlog.md`](../devlog.md), under today's date: a `###` title, a tag line in italics, then the text.
- **New handbook document:** add `docs/guides/HP-XXX-NNN-name.md` with the title and metadata lines ([HP-GDE-005](HP-GDE-005-documentation-style.md)), add its audience and one-line summary in `tools/guides_index.py`, then run the index tool.
- **New contract:** add it to `site/data/contracts.json`, then run `python3 tools/contracts_md.py`.
- **Team and chain of command:** `site/data/team.json` (`hierarchy`, `seats`, `departments`).
- **Brand change:** edit `tools/brand/*.py` and run `python3 tools/brand/build_brand.py`. Never edit the generated SVG files by hand.

## Rules for site code
- **Layout stability:** switching sections, zones, tabs or filters must not resize the interface. Every section uses the same frame width (`.view`, 80% of the 16:9 frame); controls keep their size when selected (change colour, not padding or font size); long text keeps its own reading width inside the frame. The smoke test fails if two sections have different widths.
- Plain JavaScript in the existing style (`var`, functions), so older browsers keep working. No build step beyond the tools above, no frameworks.
- Every new layout value that uses `min()`, `max()` or `clamp()` gets a fallback: `tools/css_compat.py` adds it for you.
- Respect **Options**: animations stop when Animations is off (`.no-motion`), and nothing flashes.
- Pages fade in when they are ready (`20b-ready.js`): render a `loading()` placeholder first, then the content; the reveal waits for the placeholder to go, fonts and images. Never show half-built content.
- Check `python3 tools/check_links.py` after moving or renaming any document; links to `#/docs/<id>` and `#/guides/<id>` must exist.
- Escape every piece of data you put into HTML with `esc()`.
- **Content Security Policy** (`index.html`): only the site's own script files run. No inline `<script>`, no `onclick=` or `onerror=` attributes (use listeners; broken pictures use `data-err`, handled in `10c-modal.js`). A new outside address the site calls (an API, the relay's new domain) must be added to `connect-src`, and a new picture host to `img-src`.
- **Relay version:** when you change `worker.js`, raise `RELAY_VERSION` there and `signin.relayVersion` in `config.json` together. LV7 is told when the live relay is behind, and Options shows its state.
- **Accessibility:** one live line (`#srNav`) announces the new section; focus moves to its heading; windows (`hpModal`) keep focus inside and make the page behind inert.
- Keep text short, plain and in our terms: host and clients, never "friends" or character names.
