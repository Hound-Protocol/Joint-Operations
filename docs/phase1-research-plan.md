# Phase 1 Research Plan

Status: DRAFT. Phase 1 starts when Phase 0 is complete or deferred by the project lead.

## Purpose
Learn what is needed to run a 16-player session in MGSV, and prove the networking approach, before any player-facing build.

## Ground rules
- Open research. Findings go in research/ in our own words, one file per topic.
- Each note records: author, date, game build (hash), source, finding, confidence (confirmed / likely / unknown).
- Use your own legal copy of MGSV. No game files or extracted assets in the repo.
- No work on Konami's online services, FOBs, or anti-cheat. Research is for offline play and our own sessions.
- No copied third-party mod code. Public documentation and observed behavior only.
- Pin the game build before reusing any offset or hook knowledge.

## Work items
| ID | Topic | Question | Owner role | Deliverable |
|---|---|---|---|---|
| R1 | Test environment | Windows rig and Proton rig, pinned game build, repeatable setup | Proton Tester | research/environment.md |
| R2 | Mod loading path | How does a mod get loaded into the game on Windows and under Proton? What public modding tools and docs exist? | RE / Hooks | research/loading.md |
| R3 | Player representation | How are the player character and companions created and controlled? Can additional controllable characters exist in a session? | RE / Hooks | research/players.md |
| R4 | State inventory | What state must sync: transforms, animation, weapons, health, enemies, world objects, mission flags, time, weather? Rank by cost and value. | RE / Hooks, Networking | research/state-inventory.md |
| R5 | Mother Base roster | How are soldiers stored and selected? How do they map to player slots? | RE / Hooks | research/roster.md |
| R6 | Join and leave | What in-game mechanisms (arrivals, departures, animations) can make joins and leaves seamless? | RE / Hooks | research/join-leave.md |
| R7 | Networking spike | Prototype outside the game: GameNetworkingSockets, Steam Networking Messages vs Sockets, direct IP. Simulate 16 clients. | Networking | research/networking-spike.md |
| R8 | Test harness | Mock Steam DLL, clumsy and tc netem profiles, state hash logging | Networking, Proton Tester | tools/ scripts and research/test-harness.md |
| R9 | Performance budget | CPU, memory, bandwidth targets on a modest PC at 2, 4, 8, 16 players | Networking | research/performance.md |
| R10 | Legal gate | Steam App ID and rights position, license text, donation policy | Lead | docs/legal.md updated |
| R11 | Networking reference summary | Summarize the Co-op Anything networking playbook in our own words | Docs | research/networking-playbook-summary.md (**done**) |
| R12 | Engine session spike | Start a mission or free roam as an engine multiplayer session. Can 3 or more players join? What blocks it? Time-boxed | RE / Hooks, Networking | research/engine-session-spike.md, decides ADR 0002 |
| R13 | Steam interfaces | From inside the game process, can we reach current Steam networking and matchmaking interfaces through the game's older Steam API? | Networking | research/steam-interfaces.md, decides ADR 0003 |

## Background reading
Start with the desk research in research/: game-and-engine.md, modding-ecosystem.md, steam-networking.md, proton.md and prior-art/dynamite.md.

## Suggested order
1. R1, R10, R13 (can start immediately).
2. R2, R7, R8, R12 (independent of each other).
3. R3, R5 (after R2).
4. R4, R6, R9 (after R3 and R7 produce data).

## Exit criteria for Phase 1
- Integration strategy decided from R12 (ADR 0002).
- A written architecture update with the Steam API choice and transport decision (from R7 and R13).
- A state inventory and sync priority list (R4).
- A confirmed way to load our code under Windows and Proton (R2, R1).
- A feasibility statement for seamless join and leave, with known unknowns listed (R6).
- A measured bandwidth and CPU estimate for 16 players (R9).
- Steam App ID and rights position recorded (R10).
- The project lead signs off in ROADMAP.md.

## Reporting
- Weekly short post in #dev-log: done, blocked, next.
- Open questions go in the architecture doc, section 6.
