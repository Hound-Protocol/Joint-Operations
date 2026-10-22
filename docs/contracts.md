# Contract specs

Generated from `site/data/contracts.json` by `tools/contracts_md.py`. Edit the JSON, then run the tool.

Every contract has a goal, a deliverable and acceptance criteria. The Quality Department checks each criterion before merging. Difficulty (Easy, Medium, Hard) tells you how demanding a contract is. It is information only: anyone can take any contract. Core contracts are on the 0.1 critical path and reserved for the Development Department. Each completed contract counts toward the contractor's rank (A to S++). See [Contributing](../CONTRIBUTING.md) and [departments.md](departments.md).

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
