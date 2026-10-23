# Development process

Status: Current · Date: 2026-10-21 · Updated: 2026-10-23

How work moves from an idea to a release. Contribution rules for individuals are in [CONTRIBUTING.md](../CONTRIBUTING.md).

## 1. Flow of work
1. **Idea or problem** → GitHub issue.
2. **Triage** by a maintainer: labels, module, size, dependencies. Ready work gets the `contract` label.
3. **Claim** → the contributor is assigned.
4. **Branch** in a fork: `module/short-description`, for example `net/transport-interface`.
5. **Pull request** that closes the issue, with a description of what changed and how it was tested.
6. **Review** by at least one maintainer who did not write the code. Netcode and hook changes need a second reviewer once the team has enough people.
7. **Merge** by squash, so `main` has one commit per change.
8. **Release** when a milestone's contracts are done (see section 4).

## 2. Repository layout (target)
```
docs/            plans, architecture, decisions (docs/decisions/)
research/        findings in our own words, with sources
site/            the website
src/native/      C++ component (hooks, transport, session)
src/lua/         game scripts
tools/           build and helper scripts, test harness
tests/           automated tests that run outside the game
```

## Website development
- The site's script is written as modules in `site/src/js/` and joined into `site/assets/js/app.js` by `python3 tools/build_js.py`. Commit both; CI checks they match.
- `python3 tools/assemble_site.py _site` builds the deployable site (build number, documents, static doc pages). Add `--woff2` to convert fonts.
- `python3 tests/browser_smoke.py _site` tests it in Chromium, Firefox and WebKit at desktop and phone sizes.
- `python3 tools/check_links.py` checks every internal link in the docs and the site data; `python3 tools/css_compat.py` adds style fallbacks for older browsers. CI runs both.
- Full guide for website work: [HP-GDE-012](guides/HP-GDE-012-website-maintainers.md).
- `python3 tools/bundle_site.py` makes the single-file version that opens from disk.

## 3. Quality checks
| Level | What | Where |
|---|---|---|
| Static | JSON validity, generated files up to date, broken internal links, style fallbacks, contributor standing | CI on every pull request |
| Unit | Netcode, serialization, session logic, outside the game | CI on every pull request |
| Harness | Two or more clients on one machine with a mock Steam layer and bad-network profiles | CI where possible, else manual |
| In-game | Written checklist on Windows and on Linux with Proton, on the pinned game build | Manual, before every release |
| Soak | 30 to 60 minutes of play with state-hash comparison between players | Manual, before every release |

Test reports always include: game build, OS, Proton version (if any), number of players, and the mod's version.

## 4. Versions and releases
- Versions follow `0.MINOR.PATCH` until 1.0. Foundation releases are **0.0.x** (website, docs, tools); Phase 2 ends with **0.1**, the first playable build. Details: [HP-SOP-003](guides/HP-SOP-003-release.md).
- Every release has: a changelog entry, a Dev Log entry when there is news ([docs/devlog.md](devlog.md)), SHA-256 checksums, and binaries built by GitHub Actions only.
- Code signing through an open-source signing program (the license is final: [ADR 0005](decisions/0005-license.md)).
- Release checklist: all contract issues for the milestone closed, in-game checklist passed on both platforms, release notes reviewed by the project lead.

## 5. Bugs
- Reports use the bug template (game build, OS, Proton version, players, steps, logs).
- Labels: `bug`, plus the module label, plus severity `sev:crash`, `sev:desync`, `sev:minor`.
- Crashes and save-damaging bugs block a release.

## 6. Decisions and documents
- Any decision that changes architecture, scope, legal stance or process gets a record in `docs/decisions/`.
- A pull request that changes behavior updates the matching document in the same pull request.
- Research findings go in `research/` before they are used in code.

## 7. Security of builds
- Only GitHub Actions produces release binaries.
- Maintainers use two-factor authentication.
- Dependencies are pinned by version; third-party code keeps its license file in `third_party/`.
- Vulnerability reports follow [SECURITY.md](../SECURITY.md).
