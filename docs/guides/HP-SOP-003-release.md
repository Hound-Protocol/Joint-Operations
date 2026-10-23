# Release Procedure and Versioning
Code: HP-SOP-003 · Version 1.1 · Effective 2026-10-23 · Owner: Quality · Used by: release signers, technical lead

## Version numbers
| Version | Meaning |
|---|---|
| **0.0.x** | Foundation releases: website, docs, tools and organization. Nothing to install in the game |
| **0.1** | First playable build (2 players) |
| **0.x** | Playable development builds, pre-release |
| **1.0** | First stable release |

The website shows the version in the build bar as `version.build`, where build is the commit count.

## Steps
1. **Prepare.** Update `CHANGELOG.md` with a new section: version, date, highlights, then Added, Changed, Fixed.
2. **Bump and roadmap.** Set `"version"` in `site/data/config.json`, and update `ROADMAP.md`: tick finished items, add new ones. The release check fails if the version changes without a roadmap update. The Roadmap page draws `ROADMAP.md` as a base under construction, so ticking items fills the platforms; when a release adds something new to the project, also give the base a matching detail (for example a new platform feature or more activity), so the picture grows with the project.
3. **Pull request.** Everything for the release goes in one pull request, titled `Release vX.Y.Z: <name>`.
4. **Quality gate.** All checks green. For game builds: the checklist in [HP-POL-006](HP-POL-006-quality-policy.md) section 3.
5. **Merge.** The site deploys automatically.
6. **Tag and publish (automatic).** The Release workflow sees the new version on `main`, creates tag `vX.Y.Z` on the merge commit, and publishes a GitHub release with the changelog section as notes. Versions below 0.1 are marked **pre-release**. If it fails, run it again from the Actions tab (Release → Run workflow).
7. **Announce.** Short post in #announcements with the release link. The site's Dev Log shows the release automatically.

## Game builds (from 0.1)
- Built by CI only, never on a personal machine.
- Attach the files and a `SHA256SUMS` file to the release.
- Two release signers approve: one from Quality, one from Administration.
- The Download page lists only releases from 0.1 onward. Foundation releases appear in the Dev Log.

## Fixing a bad release
Never delete a published release. Publish a fixed version (patch number +1), mark the bad one in its notes, and post in #announcements.
