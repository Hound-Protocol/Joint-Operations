# Release Procedure and Versioning
Code: HP-SOP-003 · Version 1.4 · Effective 2026-10-24 · Owner: Quality · Used by: release signers, technical lead

## Version numbers
The website and the mod have **separate version lines**, so a number always says which one it means.

| Line | Versions | Tags | Meaning |
|---|---|---|---|
| **Website** | **Site 1.0.0**, 1.1.0, … | `site-v1.0.0` | The website, documentation, tools and organization. Never marked *Latest* on GitHub |
| **Mod** | **0.1** | `v0.1.0` | First playable build (2 players) |
| | **0.x** | `v0.x.y` | Playable development builds, pre-release |
| | **1.0** | `v1.0.0` | First stable release |

- Website versions: **major** for a change in how the site works for everyone (a new clearance model), **minor** for new features, **patch** for fixes.
- Before Site 1.0.0, the website used **0.0.1 to 0.0.41** (tags `v0.0.x`); those tags stay as they are.
- The mod's builds get their own changelog when 0.1 arrives.
- The top bar shows `Site X.Y.Z · build N · commit`, where build is the commit count, followed by the mod's stage.

## Work goes on the board first
All work goes on the Contribute page's board, whoever does it: contractors, staff, the owner, or anyone working with an AI agent. Every card shows who is working on it, and who completed it with any agent named.
- **Starting something:** `python3 tools/work.py add --title "…" --module web` (new foundation item, ID `F…`), then `python3 tools/work.py start F05 --login <github-name> [--agent Claude]`.
- **Finishing it:** `python3 tools/work.py done F05 --login <github-name> [--agent Claude]`, in the same pull request as the work.
- **Stopping without finishing:** `python3 tools/work.py drop F05 --login <github-name>`.
- After 0.1, contracts are GitHub issues and `/claim` does the same.

## Steps
1. **Prepare.** Update `CHANGELOG.md` with a new section, `## Site X.Y.Z · Name · YYYY-MM-DD`, then the highlights. The release check fails if the version changes without its section.
2. **Bump and roadmap.** Set `"version"` in `joint-operations-web/site/data/config.json`, and update `ROADMAP.md`: tick finished items, add new ones. The release check fails if the version changes without a roadmap update. The Roadmap page draws `ROADMAP.md` as a base under construction, so ticking items fills the platforms; when a release adds something new to the project, also give the base a matching detail (for example a new platform feature or more activity), so the picture grows with the project.
2b. **Check off the work.** Mark every finished item done with `tools/work.py`. The release check fails if the version changes and the board does not.
3. **Pull request.** Everything for the release goes in one pull request, titled `Site X.Y.Z · <name>`.
4. **Quality gate.** All checks green. For game builds: the checklist in [HP-POL-006](HP-POL-006-quality-policy.md) section 3.
5. **Merge.** The site deploys automatically.
6. **Tag and publish (automatic).** The Release workflow sees the new version on `main`, creates tag `site-vX.Y.Z` on the merge commit, and publishes a GitHub release with the changelog section as notes. Website releases are never marked *Latest*, so GitHub's Latest always points at a mod build. If it fails, run it again from the Actions tab (Release → Run workflow).
7. **Announce.** Short post in #announcements with the release link. When there is news beyond the changelog (a decision, a milestone, a change in how we work), add an entry at the top of the [Dev Log](../devlog.md).

## Game builds (from 0.1)
- Built by CI only, never on a personal machine.
- Attach the files and a `SHA256SUMS` file to the release.
- Two release signers approve: one from Quality, one from Administration.
- The Download page lists only releases from 0.1 onward. Foundation releases are in the [Changelog](../../CHANGELOG.md).

## Fixing a bad release
Never delete a published release. Publish a fixed version (patch number +1), mark the bad one in its notes, and post in #announcements.
