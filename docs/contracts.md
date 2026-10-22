# Contract specs

Generated from `site/data/contracts.json` by `tools/contracts_md.py`. Edit the JSON, then run the tool.

Every contract has a goal, a deliverable and acceptance criteria. The Quality Department checks each criterion before merging. Difficulty (Easy, Medium, Hard) tells you how demanding a contract is. It is information only: anyone can take any contract. Core contracts are on the 0.1 critical path and reserved for the Development Department. Each completed contract earns points toward the contractor's grade in its field (E to S++). See [Contributing](../CONTRIBUTING.md) and [departments.md](departments.md).

Version 0.1 is built by the project lead. These contracts open to contractors after 0.1.

| ID | Contract | Module | Difficulty | Depends on | Status |
|---|---|---|---|---|---|
| C01 | Pin game build and set up Windows test rig | testing | 🟢 Easy | — | planned |
| C02 | Proton test rig and setup guide | testing | 🟡 Medium | C01 | planned |
| C03 | Survey public MGSV modding tools and docs | hooks | 🟡 Medium | — | planned |
| C04 | Document mod loading path (Windows) | launcher | 🔴 Hard · Core | C03 | planned |
| C05 | Document mod loading path (Proton) | launcher | 🟡 Medium · Core | C04 | planned |
| C06 | Player and companion representation notes | hooks | 🔴 Hard · Core | C04 | planned |
| C07 | Mother Base roster notes | hooks | 🟡 Medium | C04 | planned |
| C08 | State inventory and sync priorities | session | 🟡 Medium | C06 | planned |
| C09 | Spike: GameNetworkingSockets, Steam Messages vs Sockets | net | 🔴 Hard | — | planned |
| C10 | Simulate 16 clients and measure bandwidth | net | 🟡 Medium | C09 | planned |
| C11 | Mock Steam DLL for one-PC testing | testing | 🔴 Hard | — | planned |
| C12 | Bad-network test profiles (clumsy, tc netem) | testing | 🟢 Easy | — | planned |
| C13 | Summarize networking playbook in our own words | docs | 🟢 Easy | — | done |
| C14 | Draft Steam App ID and rights position | legal | 🟡 Medium | — | planned |
| C15 | Publish Phase 1 contracts as GitHub issues | web | 🟢 Easy | — | planned |
| C16 | Lobby app wireframes | lobby | 🟡 Medium | — | planned |
| C17 | Mod API draft v0 | modapi | 🔴 Hard | C08 | planned |
| C18 | Join and leave feasibility notes | hooks | 🔴 Hard | C06 | planned |
| C19 | Engine session spike: can 3+ players join? | session | 🔴 Hard · Core | C04 | planned |
| C20 | Steam interfaces from inside the game (rig test) | net | 🟡 Medium · Core | C04 | planned |
| C21 | Join links: Steam lobby links and launch arguments | launcher | 🟡 Medium | C20 | planned |
| C22 | Website accessibility pass | web | 🟢 Easy | — | planned |
| C23 | HUD design for the shared alert | lobby | 🟡 Medium | — | planned |
| C24 | Session Browser against a mock registry | web | 🟡 Medium | — | planned |
| C25 | Player FAQ | docs | 🟢 Easy | — | planned |
| C26 | Engine terms glossary | docs | 🟡 Medium | C03 | planned |
| C27 | Steam Deck and Bazzite test checklist | testing | 🟡 Medium | C02 | planned |
| C28 | Alert phases and enemy perception notes | hooks | 🔴 Hard | C03 | planned |
| C29 | Mission flow and checkpoint notes | hooks | 🟡 Medium | C03 | planned |
| C30 | Third-party notices | legal | 🟢 Easy | — | planned |

## C01
**Pin game build and set up Windows test rig**  
Module: testing · Difficulty: 🟢 Easy · Skills: Windows, docs

**Goal.** Have one Windows machine that runs the exact game build we target, set up the same way every time.

**Deliverable.** research/environment.md (Windows section)

**Acceptance criteria**
- Game build 1.0.15.4 confirmed: exe file version and SHA-256 of mgsvtpp.exe recorded
- Steam auto-update risk noted, and how to stay on the pinned build
- Clean setup steps from install to main menu, reproducible by a second person
- No game files or extracted assets in the repository

Background: [R1](phase1-research-plan.md)

## C02
**Proton test rig and setup guide**  
Module: testing · Difficulty: 🟡 Medium · Skills: Linux, Proton · Depends on: C01

**Goal.** Have a Linux machine with Proton that runs the same build, with a setup guide.

**Deliverable.** research/environment.md (Proton section)

**Acceptance criteria**
- Distro, Steam client build and Proton version recorded
- Rig checklist in research/proton.md completed, results written down
- A dummy dinput8.dll writes a log line under Proton with the documented launch option
- Proton Experimental and latest GE-Proton both tried, differences noted

Background: [R1](phase1-research-plan.md), [r-proton](../research/proton.md)

## C03
**Survey public MGSV modding tools and docs**  
Module: hooks · Difficulty: 🟡 Medium · Skills: Research

**Goal.** Confirm on a rig the tool list from desk research, and find the community docs we can learn from.

**Deliverable.** research/file-formats-and-tools.md (rig-verified)

**Acceptance criteria**
- Each listed tool opened on build 1.0.15.4, with tool version and result
- License of each tool recorded (reuse allowed, use only, or unknown)
- Locations of mission scripts and player-related Lua listed (archive paths only, no content)

Background: [r-formats](../research/file-formats-and-tools.md), [r-modding](../research/modding-ecosystem.md)

## C04
**Document mod loading path (Windows)**  
Module: launcher · Difficulty: 🔴 Hard (Core: Development Department) · Skills: Reverse engineering, C++ · Depends on: C03

**Goal.** Know exactly how our native code gets into the game on Windows, alone and alongside IHHook.

**Deliverable.** `research/loading.md`

**Acceptance criteria**
- A test DLL loads as a dinput8 proxy and logs its start
- A test plugin loads through IHHook's plugins folder (if the interface is suitable), or the reason it is not
- Load order and timing relative to the game's Lua start recorded
- Recommendation for ADR 0004 with evidence

Background: [R2](phase1-research-plan.md), [adr-0004](decisions/0004-loader.md)

## C05
**Document mod loading path (Proton)**  
Module: launcher · Difficulty: 🟡 Medium (Core: Development Department) · Skills: Reverse engineering, Linux · Depends on: C04

**Goal.** The same loading path, confirmed under Proton.

**Deliverable.** research/loading.md (Proton section)

**Acceptance criteria**
- Both load paths from C04 tested under Proton
- Any differences in timing, file paths or logging recorded
- Exact launch options players need, ready to paste

Background: [R2](phase1-research-plan.md), [r-proton](../research/proton.md)

## C06
**Player and companion representation notes**  
Module: hooks · Difficulty: 🔴 Hard (Core: Development Department) · Skills: Reverse engineering · Depends on: C04

**Goal.** Understand how the player character and companions are created and controlled, and whether more controllable characters can exist.

**Deliverable.** `research/players.md`

**Acceptance criteria**
- Lua and native entry points involved in player and buddy spawn listed (names and archive paths, no copied code)
- Whether a second controllable character can exist in free roam: yes, no or unknown, with evidence
- How FOB and MGO create additional players, as far as observable
- Confidence marked for every claim

Background: [R3](phase1-research-plan.md), [adr-0007](decisions/0007-host-authority.md)

## C07
**Mother Base roster notes**  
Module: hooks · Difficulty: 🟡 Medium · Skills: Reverse engineering · Depends on: C04

**Goal.** Understand how Mother Base staff are stored and selected, so clients can join as roster staff.

**Deliverable.** `research/roster.md`

**Acceptance criteria**
- Where roster data lives at runtime and in the save, as far as observable
- How a staff member is chosen for deployment and what defines their look and skills
- Proposal for mapping client slots to roster staff

Background: [R5](phase1-research-plan.md), [adr-0007](decisions/0007-host-authority.md)

## C08
**State inventory and sync priorities**  
Module: session · Difficulty: 🟡 Medium · Skills: Netcode, research · Depends on: C06

**Goal.** List every piece of state that must sync, ranked by cost and value.

**Deliverable.** `research/state-inventory.md`

**Acceptance criteria**
- Table of state items: owner (host or client), update rate, size estimate, priority
- Covers players, enemies, vehicles, world objects, mission flags, time and weather, plus the shared alert status and who has joined it (ADR 0012)
- Bandwidth estimate per player at 16 players
- Reviewed by the networking module owner

Background: [R4](phase1-research-plan.md), [r-netcode](../research/networking-playbook-summary.md)

## C09
**Spike: GameNetworkingSockets, Steam Messages vs Sockets**  
Module: net · Difficulty: 🔴 Hard · Skills: C++, networking

**Goal.** Prove the transport outside the game: open-source GameNetworkingSockets and Steam networking side by side.

**Deliverable.** tools/spikes/net/ and research/networking-spike.md

**Acceptance criteria**
- Builds on Windows and Linux from a clean checkout with written steps
- Reliable and unreliable messages between two machines on both paths
- Messages vs Sockets compared: API fit, NAT behavior, latency
- Recommendation for ADR 0003

Background: [R7](phase1-research-plan.md), [adr-0003](decisions/0003-transport.md), [r-steam](../research/steam-networking.md)

## C10
**Simulate 16 clients and measure bandwidth**  
Module: net · Difficulty: 🟡 Medium · Skills: C++, tooling · Depends on: C09

**Goal.** Measure what 16 clients cost.

**Deliverable.** `research/performance.md`

**Acceptance criteria**
- Simulator runs 1 host and 15 clients on one machine
- Bandwidth and CPU at 2, 4, 8 and 16 players, with the state model from C08
- Results under the bad-network profiles from C12

Background: [R9](phase1-research-plan.md)

## C11
**Mock Steam DLL for one-PC testing**  
Module: testing · Difficulty: 🔴 Hard · Skills: C++

**Goal.** Test multiplayer on one PC without real Steam accounts.

**Deliverable.** tools/mocksteam/ and research/test-harness.md

**Acceptance criteria**
- Mock DLL answers the Steam calls our code uses, written from public docs only
- Two game instances can talk through it on one machine
- Clear warning that it is for development only, never shipped

Background: [R8](phase1-research-plan.md)

## C12
**Bad-network test profiles (clumsy, tc netem)**  
Module: testing · Difficulty: 🟢 Easy · Skills: Tooling

**Goal.** Repeatable bad-network conditions for testing.

**Deliverable.** `tools/netprofiles/`

**Acceptance criteria**
- Profiles for good, average and bad connections (latency, jitter, loss)
- Scripts for clumsy (Windows) and tc netem (Linux)
- One-line usage in research/test-harness.md

Background: [R8](phase1-research-plan.md)

## C13
**Summarize networking playbook in our own words**  
Module: docs · Difficulty: 🟢 Easy · Skills: Writing

**Goal.** Summarize the networking playbook in our own words.

**Deliverable.** `research/networking-playbook-summary.md`

**Acceptance criteria**
- Done. Kept here as an example of a finished small contract

Background: [r-netcode](../research/networking-playbook-summary.md)

## C14
**Draft Steam App ID and rights position**  
Module: legal · Difficulty: 🟡 Medium · Skills: Research

**Goal.** A written position on using MGSV's Steam App ID, our license and donations.

**Deliverable.** docs/legal.md update

**Acceptance criteria**
- Position on App ID 287700 with sources, and the question drafted for Valve support
- License recommendation matched to ADR 0005
- Donation policy matched to the funding stance
- Marked clearly as not legal advice

Background: [R10](phase1-research-plan.md), [adr-0005](decisions/0005-license.md), [r-legal](../research/legal-landscape.md)

## C15
**Publish Phase 1 contracts as GitHub issues**  
Module: web · Difficulty: 🟢 Easy · Skills: GitHub

**Goal.** Move the planned contracts onto GitHub so people can claim them.

**Deliverable.** GitHub issues with labels

**Acceptance criteria**
- One issue per contract with goal, deliverable and acceptance checklist
- Labels contract, module:<name> and size:<S/M/L> set
- Dependencies linked by issue number
- The website board switches to live issues

Background: [contributing](../CONTRIBUTING.md)

## C16
**Lobby app wireframes**  
Module: lobby · Difficulty: 🟡 Medium · Skills: UI design

**Goal.** Wireframes for the lobby and session screens.

**Deliverable.** docs/design/lobby/ (images plus notes)

**Acceptance criteria**
- Host flow: create session, invite, start
- Player flow: join, gear selection, deploy
- Fits ADR 0008 stage 1 (invite links)
- Works with keyboard and gamepad

Background: [adr-0008](decisions/0008-browser-launch.md)

## C17
**Mod API draft v0**  
Module: modapi · Difficulty: 🔴 Hard · Skills: API design · Depends on: C08

**Goal.** First draft of the API other mods use to work with Joint Operations.

**Deliverable.** `docs/modapi.md`

**Acceptance criteria**
- Events, sync hooks and versioning rules drafted
- Two example use cases written out
- Compatibility stance on Infinite Heaven

Background: [r-modding](../research/modding-ecosystem.md)

## C18
**Join and leave feasibility notes**  
Module: hooks · Difficulty: 🔴 Hard · Skills: Reverse engineering · Depends on: C06

**Goal.** Can players join and leave mid-session in a way that fits the game world?

**Deliverable.** `research/join-leave.md`

**Acceptance criteria**
- In-game arrival and departure mechanisms listed (helicopter, Fulton, others)
- Feasibility for mid-mission join and leave, with known unknowns
- What happens to a leaving client's staff member

Background: [R6](phase1-research-plan.md)

## C19
**Engine session spike: can 3+ players join?**  
Module: session · Difficulty: 🔴 Hard (Core: Development Department) · Skills: Reverse engineering, networking · Depends on: C04

**Goal.** Find out whether the engine's own multiplayer layer can run a free-roam session with three or more players. This decides ADR 0002.

**Deliverable.** `research/engine-session-spike.md`

**Acceptance criteria**
- Time-boxed to two weeks, with a result either way
- Whether a session with 3+ players starts: yes, no or partly, with logs
- What blocks it, if anything
- No Konami online services contacted at any point

Background: [R12](phase1-research-plan.md), [adr-0002](decisions/0002-integration-strategy.md), [r-engine](../research/game-and-engine.md)

## C20
**Steam interfaces from inside the game (rig test)**  
Module: net · Difficulty: 🟡 Medium (Core: Development Department) · Skills: C++, Steamworks · Depends on: C04

**Goal.** Run the R13 rig test: confirm that current Steam networking interfaces are reachable from inside the game on Windows and Proton.

**Deliverable.** research/steam-interfaces.md (results section)

**Acceptance criteria**
- All six test steps in the note run on Windows and Proton
- Pass or fail recorded per step, with Steam client and Proton versions
- Which callback approach works
- ADR 0003 updated with the result

Background: [R13](phase1-research-plan.md), [r-steam-interfaces](../research/steam-interfaces.md), [adr-0003](decisions/0003-transport.md)

## C21
**Join links: Steam lobby links and launch arguments**  
Module: launcher · Difficulty: 🟡 Medium · Skills: Testing, Linux · Depends on: C20

**Goal.** Run the R14 rig tests for joining from a website.

**Deliverable.** research/browser-launch.md (results section)

**Acceptance criteria**
- Whether launch arguments reach the game through Konami's launcher
- steam:// and a dummy jointops:// link tested from native and Flatpak browsers on Linux
- Results feed ADR 0008

Background: [R14](phase1-research-plan.md), [r-browser-launch](../research/browser-launch.md), [adr-0008](decisions/0008-browser-launch.md)

## C22
**Website accessibility pass**  
Module: web · Difficulty: 🟢 Easy · Skills: HTML, CSS, screen readers

**Goal.** Make every page of the website usable by keyboard and screen reader, with readable contrast.

**Deliverable.** Pull request with fixes, and a short report in research/accessibility.md

**Acceptance criteria**
- Every page and control reachable and usable with the keyboard alone
- Text contrast meets WCAG AA on all pages
- Tested with one screen reader (NVDA, Orca or VoiceOver); findings written down
- No visual regressions in the browser smoke test

Background: [brand](brand.md)

## C23
**HUD design for the shared alert**  
Module: lobby · Difficulty: 🟡 Medium · Skills: UI design, MGSV

**Goal.** Design how each player sees the one shared alert status and whether they are part of it.

**Deliverable.** Mockups (vector or hand-built, no generative AI art) and notes in docs/design/alert-hud.md

**Acceptance criteria**
- Shows Hidden, Searched for and Detected, and which players are in the alert
- Fits the game's own HUD style without copying Konami assets
- Readable at 1080p and on Steam Deck
- Reviewed against ADR 0012

Background: [adr-0012](decisions/0012-shared-alert.md)

## C24
**Session Browser against a mock registry**  
Module: web · Difficulty: 🟡 Medium · Skills: JavaScript, JSON

**Goal.** Make the website's Session Browser read sessions from a mock of the planned session registry API.

**Deliverable.** A mock registry JSON and the Session Browser changes, behind the existing data hook

**Acceptance criteria**
- Mock follows the registry sketch in ADR 0008
- Search, region filter, sorting and Hide full work on mock data
- Empty and error states stay calm and clear
- Smoke test passes in all three engines

Background: [adr-0008](decisions/0008-browser-launch.md), [r-browser-launch](../research/browser-launch.md)

## C25
**Player FAQ**  
Module: docs · Difficulty: 🟢 Easy · Skills: Writing

**Goal.** Answer the questions new players will ask, in plain words.

**Deliverable.** docs/faq.md, linked from the Player Guide

**Acceptance criteria**
- At least 15 questions: install, hosting, joining, saves, Linux, safety, Konami servers
- Answers match the Player Guide and the ADRs
- Follows the documentation style guide (HP-GDE-005)

Background: [glossary](glossary.md)

## C26
**Engine terms glossary**  
Module: docs · Difficulty: 🟡 Medium · Skills: Research, writing · Depends on: C03

**Goal.** Explain the Fox Engine and MGSV terms the project uses, in our own words.

**Deliverable.** New section in docs/glossary.md

**Acceptance criteria**
- Covers file formats, mission phases, Mother Base units and the terms used in research notes
- Every entry written in our own words, sources linked
- No copied text from other projects

Background: [r-engine](../research/game-and-engine.md), [r-formats](../research/file-formats-and-tools.md)

## C27
**Steam Deck and Bazzite test checklist**  
Module: testing · Difficulty: 🟡 Medium · Skills: Linux, Steam Deck · Depends on: C02

**Goal.** A repeatable checklist for testing on Steam Deck and Bazzite.

**Deliverable.** Section in docs/guides/HP-GDE-004 (Quality and Testing Guide)

**Acceptance criteria**
- Covers install, launch option, controller, performance overlay and suspend/resume
- Run once on real hardware, results recorded
- Known issues listed with workarounds

Background: [r-proton](../research/proton.md)

## C28
**Alert phases and enemy perception notes**  
Module: hooks · Difficulty: 🔴 Hard · Skills: Reverse engineering, Lua · Depends on: C03

**Goal.** Find how the game's alert phases and enemy perception work, and whether they can be driven per player.

**Deliverable.** `research/alert-system.md`

**Acceptance criteria**
- Describes how alert phases change and what triggers them
- Finds where enemy perception picks its target
- States whether per-player targeting with one shared alert (ADR 0012) looks possible, with evidence
- Clean-room: notes in our own words, no game files

Background: [adr-0012](decisions/0012-shared-alert.md), [R3](phase1-research-plan.md), [R4](phase1-research-plan.md)

## C29
**Mission flow and checkpoint notes**  
Module: hooks · Difficulty: 🟡 Medium · Skills: Reverse engineering, MGSV · Depends on: C03

**Goal.** Map how a mission starts, checkpoints, fails and ends, so the host can drive it for everyone.

**Deliverable.** `research/mission-flow.md`

**Acceptance criteria**
- Covers deploy, checkpoints, mission fail, extraction and results screen
- Notes which steps a client must follow and which only the host runs
- Clean-room: own words, no game files

Background: [adr-0007](decisions/0007-host-authority.md), [r-engine](../research/game-and-engine.md)

## C30
**Third-party notices**  
Module: legal · Difficulty: 🟢 Easy · Skills: Licenses

**Goal.** List every third-party component we ship and its license.

**Deliverable.** THIRD_PARTY_NOTICES.md

**Acceptance criteria**
- Covers fonts, libraries and tools that end up in releases or on the website
- Each entry has name, version, license and link
- Checked against the project license decision (ADR 0005)

Background: [adr-0005](decisions/0005-license.md), [legal](legal.md)
