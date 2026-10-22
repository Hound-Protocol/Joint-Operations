# Legal and Ethics

Status: DRAFT, pending project lead review. Not legal advice.

## 1. Project license
- Forks are allowed. Attribution is required. Nobody may present this work as their own.
- The draft choice was GPL-3.0. Research found that plain GPL-3.0 likely conflicts with linking the proprietary Steamworks SDK inside the game. Options and the recommendation are in [ADR 0005](decisions/0005-license.md): GPL-3.0 with a linking permission, MPL-2.0, or MIT.
- Until decided: the LICENSE file stays a placeholder and no binaries are published.

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
- Recommended: no donations before 0.1. Afterwards, use a fiscal host such as Open Collective Europe, connected to GitHub Sponsors. See [funding research](../research/funding-and-distribution.md).
- Before accepting donations: confirm the platform's terms, tax obligations, and how funds are reported.
- Publish where money goes, and how much, in docs/funding.md.
- Donations do not change decision-making authority in the project.

## 9. Open items for the project lead
- Choose the license (ADR 0005).
- Approve the Steam App ID position.
- Confirm the donation platform and reporting plan.
- Decide whether to seek a legal opinion before donations or distribution begin.
