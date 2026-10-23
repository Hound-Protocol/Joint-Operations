# Legal and Ethics

Status: Draft, pending project lead review · Updated: 2026-10-23. Not legal advice.

## 1. Project license
- Forks are allowed. Attribution is required. Nobody may present this work as their own.
- **Decided** ([ADR 0005](decisions/0005-license.md)): code is GPL-3.0-only with an additional permission to link with the Steamworks SDK and run inside MGSV; documentation is CC BY-SA 4.0; the brand is reserved. Summary in [LICENSING.md](../LICENSING.md).
- Plain GPL-3.0 would likely conflict with linking the proprietary Steamworks SDK inside the game; the section 7 permission solves that while keeping forks open.

## 2. Independent development
- Joint Operations is an independent project. It does not fork, copy, or vendor code from other mods.
- Public documentation and observed game behavior may be studied. Findings are written in our own words in research/.
- Where public research from others is used, it is credited in the relevant research note.

## 3. Clean-room rules
- Contributors who read any third-party mod's source record findings only, not code.
- Implementation follows docs/architecture.md.
- Record research sources (URL, date, version) in research/.

## 4. Reverse engineering
- Work is done by people who own the game, only to make Joint Operations interoperate with it, and limited to what that needs. This follows the conditions of EU Directive 2009/24/EC, Article 6. See [legal landscape](../research/legal-landscape.md).
- Findings are shared only as far as interoperability needs. The game's code is never copied into the project.

## 5. Game assets and Konami IP
- No MGSV game files, extracted assets, or executables are committed, ever.
- Users must own their own copy of MGSV.
- Metal Gear and related names belong to Konami. This project claims no rights to them.

## 6. Online services
- Joint Operations never uses or interferes with Konami's online services or anti-cheat ([ADR 0006](decisions/0006-no-konami-services.md)).

## 7. Steam App ID (BLOCKING for release)
- Our code runs inside the game, which has already started Steam with its own App ID (287700). Steam lobbies and networking would therefore run as the game. See [Steam research](../research/steam-networking.md).
- Development and testing may use this, or Spacewar (480) for tests outside the game.
- Before a public release: a written position here, and ideally a reply from Valve support.

## 8. Donations and funding
- Donations are intended for website hosting and development.
- Decided: no donations before 0.1 ([ADR 0010](decisions/0010-funding.md)). Afterwards, use a fiscal host such as Open Collective Europe, connected to GitHub Sponsors. See [funding research](../research/funding-and-distribution.md).
- Before accepting donations: confirm the platform's terms, tax obligations, and how funds are reported.
- Publish where money goes, and how much, in docs/funding.md.
- Donations do not change decision-making authority in the project.

## 9. Personal data
- The website collects no personal data. Optional GitHub sign-in keeps the person's token and basic account details in their own browser tab only; nothing is stored on our side ([privacy notice](privacy.md), [ADR 0017](decisions/0017-hound-id-sign-in.md)).
- Signed contributor records and staff cards are public by design and contain only what the person agreed to show (GitHub name, optional display name and Discord ID).

## 10. Open items for the project lead
- ~~Choose the license (ADR 0005).~~ Done: see LICENSING.md.
- Approve the Steam App ID position.
- Confirm the donation platform and reporting plan.
- Decide whether to seek a legal opinion before donations or distribution begin.
