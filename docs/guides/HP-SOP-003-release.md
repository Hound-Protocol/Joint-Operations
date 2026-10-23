# Release Procedure and Versioning
Code: HP-SOP-003 · Version 1.3 · Effective 2026-10-23 · Owner: Quality · Used by: release signers, technical lead

## Version numbers
| Version | Meaning |
|---|---|
| **0.0.x** | Foundation releases: website, docs, tools and organization. Nothing to install in the game |
| **0.1** | First playable build (2 players) |
| **0.x** | Playable development builds, pre-release |
| **1.0** | First stable release |

The website shows the version in the build bar as `version.build`, where build is the commit count.

## Work goes on the board first
All work goes on the Contribute page's board, whoever does it: contractors, staff, the owner, or anyone working with an AI agent. Every card shows who is working on it, and who completed it with any agent named.
- **Starting something:** `python3 tools/work.py add --title "…" --module web` (new foundation item, ID `F…`), then `python3 tools/work.py start F05 --login <github-name> [--agent Claude]`.
- **Finishing it:** `python3 tools/work.py done F05 --login <github-name> [--agent Claude]`, in the same pull request as the work.
- **Stopping without finishing:** `python3 tools/work.py drop F05 --login <github-name>`.
- After 0.1, contracts are GitHub issues and `/claim` does the same.

## Steps
1. **Prepare.** Update `CHANGELOG.md` with a new section: version, date, highlights, then Added, Changed, Fixed.
2. **Bump and roadmap.** Set `"version"` in `site/data/config.json`, and update `ROADMAP.md`: tick finished items, add new ones. The release check fails if the version changes without a roadmap update. The Roadmap page draws `ROADMAP.md` as a base under construction, so ticking items fills the platforms; when a release adds something new to the project, also give the base a matching detail (for example a new platform feature or more activity), so the picture grows with the project.
2b. **Check off the work.** Mark every finished item done with `tools/work.py`. The release check fails if the version changes and the board does not.
3. **Pull request.** Everything for the release goes in one pull request, titled `Release vX.Y.Z: <name>`.
4. **Quality gate.** All checks green. For game builds: the checklist in [HP-POL-006](HP-POL-006-quality-policy.md) section 3.
5. **Merge.** The site deploys automatically.
6. **Tag and publish (automatic).** The Release workflow sees the new version on `main`, creates tag `vX.Y.Z` on the merge commit, and publishes a GitHub release with the changelog section as notes. Versions below 0.1 are marked **pre-release**. If it fails, run it again from the Actions tab (Release → Run workflow).
7. **Announce.** Short post in #announcements with the release link. When there is news beyond the changelog (a decision, a milestone, a change in how we work), add an entry at the top of the [Dev Log](../devlog.md).

## Game builds (from 0.1)
- Built by CI only, never on a personal machine.
- Attach the files and a `SHA256SUMS` file to the release.
- Two release signers approve: one from Quality, one from Administration.
- The Download page lists only releases from 0.1 onward. Foundation releases are in the [Changelog](../../CHANGELOG.md).

## Fixing a bad release
Never delete a published release. Publish a fixed version (patch number +1), mark the bad one in its notes, and post in #announcements.
