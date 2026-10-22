# Roadmap

Status: Current · Updated with every release ([HP-SOP-003](docs/guides/HP-SOP-003-release.md), step 2)

## Phase 0: Foundation (current)
Gates and sequence are in docs/pre-development.md.
- [x] Repository created (public) and website built
- [x] Core docs written: team, legal, architecture, governance, process, decisions, research
- [x] CI checks for pull requests, browser tests in Chromium, Firefox and WebKit
- [x] Website live on GitHub Pages, releases published automatically
- [x] License chosen: GPL-3.0 with a Steamworks and MGSV permission, docs CC BY-SA 4.0, brand reserved (ADR 0005)
- [x] Donation policy decided: donations open at 0.1 (ADR 0010)
- [x] Departments, keycards and contractor grades E to S++ set up (ADR 0009, ADR 0011)
- [x] Chain of command, open communication and transparency (ADR 0013, HP-POL-007)
- [x] Accountability: infractions, suspensions and appeals, no time limits (ADR 0016, HP-POL-009)
- [x] AI agents credited as tools, detected automatically (ADR 0015)
- [x] Signed contributor records and Hound IDs
- [x] Handbook: 33 policies, procedures and guides, with PDFs
- [x] Brand: Hound Protocol and Joint Operations logos, Hound Protocol website
- [x] Discord structure set up (see docs/discord.md)
- [x] Quiet until 0.1 decided (ADR 0014)
- [ ] Steam App ID position recorded (legal.md, contract C14)
- [ ] Critical seats filled: technical lead, second GitHub owner, Discord admins, moderators
- [ ] Branch protection requires the Checks and Contributor standing checks
- [ ] Proton test environment defined (contract C02)

## Phase 1: Research (see docs/phase1-research-plan.md)
- [x] Summarize networking playbook into research/ in our own words
- [x] Desk research: Steam interfaces (R13), file formats and tools, Proton on Bazzite
- [x] Desk research: how the enemy AI notices, reports and hunts (research/ai-system.md)
- [x] Contract specs with acceptance criteria for all Phase 1 work (docs/contracts.md)
- [ ] Engine session spike: 3 or more players in one session (R12)
- [ ] Steam interfaces reachable from the game process (R13)
- [ ] Document how MGSV launches and how a second player can be introduced
- [ ] Identify game state that must be synced
- [ ] Enemy AI on a rig: perception of several players, CP phases, search targets (C28)
- [ ] Decide Steam API: Networking Messages vs Networking Sockets
- [ ] Set up mock Steam DLL and bad-network test profiles (clumsy, tc netem)

## Phase 2: 0.1 (2 players)
- [ ] Integration strategy decided (ADR 0002)
- [ ] Two-player session on Windows
- [ ] Same session under Proton on Linux
- [ ] Basic host-to-client state sync
- [ ] Shared detection status working for 2 players (ADR 0012)
- [ ] Direct IP path working
- [ ] GATE: Steam App ID and rights resolved before any player-facing build
- [ ] Public launch: release, announcement, contracts open (ADR 0014)

## Phase 3: Scale to 16
- [ ] 4, 8, then 16 players with stable sync
- [ ] Priority and interest management
- [ ] Performance measured on modest hardware

## Phase 4: Experience and ecosystem
- [ ] Seamless join and leave with transitions
- [ ] Session Browser with one-click join (ADR 0008)
- [ ] Host migration
- [ ] Mod API
- [ ] Dedicated server research (a host without a player)

## Open questions
- A new, less generic name for the project, themed on 16-player MGS V and safe to use. Not urgent.
- Infraction records: public with names, or names private with a public summary.

## Rule
No phase starts until the previous checklist is complete or explicitly deferred by the project lead. This file is updated in every release pull request.
