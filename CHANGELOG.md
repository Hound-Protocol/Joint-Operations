# Changelog

All notable changes to MGSV: Joint Operations. Versions follow [HP-SOP-003](docs/guides/HP-SOP-003-release.md): **0.0.x** are foundation releases (organization, docs, website, tools), **0.1** is the first playable build.

## v0.0.3 · Polish · 2026-10-22
A cleaner, clearer website for everyone, not only contributors.

### Added
- **Menu icons** for every section, drawn for this site.
- **Home side panels:** what Joint Operations is on the left, who Hound Protocol is on the right. Shown beside the menu on wide screens, below it on smaller ones.
- Automatic GitHub releases: changing the version on main publishes the release, with notes from this changelog.

### Changed
- New tagline: *Metal Gear Solid V, now with up to 16 players.*
- Menu: **About Joint Operations**, **Session Browser** ("Browse, Create & Join active Joint Operations"), **Contribute** ("Take part in development & Become a Hound Member"), **Mods** ("Upload, Download & Browse Re-Engineered mods curated to function with Joint Operations"), **Docs**.
- Rewritten in plain words: About page, Download (Linux steps now include the launch option), Session Browser, Mods, Contribute, status messages and search previews.
- Session Browser shows a **Host a session** button, active from 0.1.
- **Contract difficulty is now Easy, Medium and Hard**, color-coded green, yellow and red everywhere. Each one explains what makes a contract that hard and who can claim it. **Core** marks 0.1 critical-path work for the Development Department.
- Contribute page: difficulty cards that double as filters, colored contract cards, and color-coded rank rewards.

### Fixed
- Removed unused styles from an older Briefing layout.

## v0.0.2 · Foundation update · 2026-10-22
The foundation is now organized like Mother Base, documented end to end, and ready for contributors.

### Added
- **Departments:** Administration, Development, Quality and Contractor, on the website, in the docs and in the Discord blueprint ([ADR 0009](docs/decisions/0009-departments-and-ranks.md)).
- **Contractor ranks A, A+, A++, S, S+, S++** by completed contracts, shown on the Contribute and Verify pages.
- **Contract difficulty** Basic, Standard, Advanced, Expert and Core, gated by rank, plus an effort estimate per contract.
- **Handbook:** 20 versioned documents on the new **Guides** page, readable as A4 sheets and printable to PDF.
  - Guides: Player, Linux and Proton, Contributor Quick Start, Quality and Testing, Documentation Style, Administration Handbook.
  - Policies: Contributor, AI Use (code and mod content), Clean-Room and IP, Security, Community and Moderation, Quality.
  - Procedures: Contract Lifecycle, Pull Request and Review, Release and Versioning, Records and Ranks, Bug Triage, Security Incident, Onboarding and Offboarding, Discord Administration.
- **Signed contributor records** and the **Verify** page with the contributor wall.
- **Decision records:** 0008 server browser and one-click join (Proposed), 0009 departments and ranks, 0010 donations open at 0.1.
- **Research:** Steam interfaces from inside the game (R13), file formats and tools, Bazzite notes, Battlelog and browser launch (R14).
- **Tools:** handbook index, contract spec generator, contract publisher, records signer. The Discord setup now updates an existing server (renames, moves, permissions, starter messages).
- `CHANGELOG.md`, and GitHub releases for every foundation version.

### Changed
- README rewritten for the GitHub front page.
- Contract specs with goals, deliverables and acceptance criteria for all 21 contracts.
- Pull request template: AI-assistance disclosure and acceptance-criteria check.
- The Download page lists playable releases only (0.1 and later). Foundation releases appear in the Dev Log.
- Recruiting kit: two waves (Quality and Administration now, contractors after 0.1).

## v0.0.1 · Foundation · 2026-10-21
- Repository, website on GitHub Pages, CI on Chromium, Firefox and WebKit, protected main branch.
- Pre-development plan, architecture, governance, risk register, decision records 0001 to 0007.
- Desk research: engine, modding ecosystem, Steam networking, Proton, legal landscape, funding.
- Discord server built from a blueprint.
