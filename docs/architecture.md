# Architecture

Status: DRAFT · Updated: 2026-10-22 after Phase 1 desk research

## 1. Overview
Joint Operations is a multiplayer mod ([ADR 0001](decisions/0001-multiplayer-scope.md)). It brings the game's online multiplayer functionality into the single-player world for up to 16 players. The host takes Venom Snake's place and is authoritative; other players join as Mother Base soldiers ([ADR 0007](decisions/0007-host-authority.md)).

## 2. Two candidate strategies
Decided by the Phase 1 spike R12 ([ADR 0002](decisions/0002-integration-strategy.md)).

| | Strategy A: engine-native (preferred) | Strategy B: own netcode (fallback) |
|---|---|---|
| Idea | Start single-player missions and free roam as engine multiplayer sessions, as FOB and MGO do | Run our own host-authoritative sync; remote players are puppets driven by our data |
| Engine does | Sessions, player replication, game messaging | Rendering and local simulation only |
| We do | Lift single-player limits (player count, AI targeting, markers, damage rules, missions, vehicles), session join and leave, matchmaking without Konami | All replication, interpolation, AI and mission sync |
| Main risk | Sessions beyond 2 players failed in prior work | Very large amount of sync work for 16 players |

## 3. Components
| # | Component | Language | Notes |
|---|---|---|---|
| 1 | Installer and launcher | to be decided | Places files, backs up saves, checks game build and the Proton launch option. Proposed: handles `jointops://` join links from the website ([ADR 0008](decisions/0008-browser-launch.md)) |
| 2 | Loader | C++ | IHHook plugin first, own `dinput8.dll` proxy fallback ([ADR 0004](decisions/0004-loader.md)); version check against build 1.0.15.4 |
| 3 | Hook layer | C++ | Native hooks for systems Lua cannot reach (for example AI targeting). Address tables per game build. Isolated from networking |
| 4 | Lua layer | Lua | Mission, player, marker and session logic in the game's own scripting |
| 5 | Session layer | C++ / Lua | Player slots 1 to 16, join and leave, host authority, late-join snapshots |
| 6 | Transport | C++ | Steam path through the game's Steam API; direct path through open-source GNS ([ADR 0003](decisions/0003-transport.md)) |
| 7 | Matchmaking | — | Steam lobbies and friend invites. Never Konami's ([ADR 0006](decisions/0006-no-konami-services.md)). Proposed: a small session registry API so the website can list and join servers, with Steam lobby search as fallback ([ADR 0008](decisions/0008-browser-launch.md)) |
| 8 | Config and mod API | Lua / data | Settings now; extension points in Phase 4 |
| 9 | Apps and web | Web | Website now. Proposed: the Servers page becomes a live server browser with one-click join (ADR 0008). Outside the game process |

## 4. Session model
- Slot 1 is the host, who takes Venom Snake's place: helicopter seat, Aerial Command Center, briefings, radio calls, cutscenes and Mother Base command all belong to the host. Slots 2 to 16 are soldiers from the host's Mother Base roster.
- Each player owns their own movement and camera. The host owns AI, mission state, world objects, time and weather.
- Late joiners receive a full snapshot, then updates.
- If the host leaves, the session ends for 0.1. Host migration comes later.
- Joint Operations uses its own save files, separate from the player's normal saves.

## 5. Sync priorities
In order: player avatars; AI ownership and targeting; combat and damage; markers and HUD; world objects; mission and story flags; vehicles and buddies; support functions (helicopter, supply drops); cutscenes. The full list with costs is the R4 state inventory.

Netcode principles are summarized in [the playbook summary](../research/networking-playbook-summary.md): unreliable movement and reliable events, stable IDs, quantization and delta compression, interest management at 16 players, keep-alives.

## 6. Open questions (Phase 1)
1. Can 3 or more players share an engine session? (R12, blocking)
2. Are current Steam networking interfaces reachable through the game's older Steam API? (R13. Desk research says likely; rig test planned, see [steam-interfaces.md](../research/steam-interfaces.md))
3. Does IHHook's plugin interface give us what we need? (R2)
4. Which single-player systems break with extra players, and how costly is each? (R4)
5. Steam App ID position for a public release (R10, blocking for release)
6. Bandwidth and CPU budget at 16 players (R9)
7. Do join requests and launch arguments reach the game through Konami's launcher, and can we open Sortie Prep directly? (R14)

## 7. Testing
See [development process](development-process.md): unit tests outside the game, a multi-client harness with a mock Steam layer and bad-network profiles, written in-game checklists for Windows and Proton, and soak tests with state-hash comparison.

## 8. References
- [Research index](../research/README.md)
- [Decision records](decisions/README.md)
