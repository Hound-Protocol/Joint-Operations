# How MGSV starts, and where a second player can come in

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-23 · Status: desk research from public sources, not yet tested on a rig · Game build: 1.0.15.4 · Phase 1: R2 and R3 (desk part) · Contracts: C04, C05, C06, C19

Confidence key: **confirmed** (primary source or several sources), **likely** (one credible source or strong inference), **unknown** (needs a rig). Nothing here comes from game files or other mods' code ([HP-POL-003](../docs/guides/HP-POL-003-clean-room-and-ip.md)).

## Question
From pressing Play in Steam to standing in the field: which steps happen, where can Joint Operations' code run, and at which point could a second (and a sixteenth) player enter the world?

## Short answer
Our code can run from the very start of the game process, through the same `dinput8.dll` path the modding scene already uses. A second player has one documented way in: the engine's own multiplayer session, started through the path the game uses for base invasions (FOB), where single-player missions normally create only one player. A third player has never been shown to work. That is the question the engine spike (R12, contract C19) must answer. *Confidence: likely for the loading path and the two-player route; unknown beyond two players.*

## 1. The start chain
| Step | What happens | Confidence | Source |
|---|---|---|---|
| 1 | Steam starts the game's App ID **287700**. Steam first runs Konami's small settings launcher (graphics settings and a Play button), which then starts the game executable `mgsvtpp.exe` | likely | [browser-launch.md](browser-launch.md) |
| 2 | The 64-bit executable loads its libraries. Windows looks for `dinput8.dll` in the game folder before the system folder, so a **proxy DLL** placed there is loaded at process start, before the game's own start-up code | confirmed | [modding-ecosystem.md](modding-ecosystem.md) (IHHook and an existing multiplayer mod both use it) |
| 3 | The game initializes Steam through its own `steam_api64.dll` (from 2015), as App ID 287700. Everything Steam-related our code does later runs as the game | confirmed (App ID), likely (DLL age) | [steam-interfaces.md](steam-interfaces.md), [steam-networking.md](steam-networking.md) |
| 4 | Fox Engine starts and runs the game's Lua, which is **compiled into the executable**: no external Lua modules can be loaded, only native code can extend it | likely | [game-and-engine.md](game-and-engine.md) |
| 5 | Title screen, then the save is loaded and the player reaches the Aerial Command Center (ACC) or a mission | confirmed (gameplay) | gameplay |
| 6 | A deployment goes through **Sortie Prep** (equipment, buddy, time, landing zone), then the helicopter flight and landing | confirmed (gameplay) | gameplay |

**On Linux (Proton)** the same chain runs inside Wine. The proxy only loads if Wine is told to prefer it: the launch option `WINEDLLOVERRIDES="dinput8=n,b" %command%` ([proton.md](proton.md), [HP-GDE-002](../docs/guides/HP-GDE-002-linux-proton.md)). *Confidence: confirmed by two projects' docs.*

**Unknown:** whether the launcher passes Steam launch arguments (for example a join request) on to the game (R14, contract C21).

## 2. Where our code can run
| Point | When | What it can do | Trade-off | Confidence |
|---|---|---|---|---|
| **Own `dinput8.dll` proxy** | At process start | Everything: hooks, our transport, our Steam calls | Only one `dinput8.dll` fits in the folder, so it conflicts with IHHook and other proxy mods | confirmed |
| **IHHook plugin** | When IHHook loads its `plugins` folder | Same native power, alongside Infinite Heaven | Depends on IHHook's plugin interface and update cycle (ADR 0004) | likely (IHHook r25 release notes) |
| **Lua, through the hook** | Once the engine's Lua runs | Mission, player, marker and menu logic in the game's own scripting | Needs the native hook to expose functions, since Lua is compiled in | likely |

This matches ADR 0004 (proposed): ship as an IHHook-compatible plugin, keep our own proxy as a fallback.

## 3. Where a second player can come in
### Route A: the engine's own session (preferred, ADR 0002)
- The engine has a session layer built for online play: base invasions (FOB, two players) and Metal Gear Online (up to 16 players per match). *(confirmed: both modes exist; likely: same engine layer)*
- Single-player missions create **one** player instance. The public write-up of an existing two-player mod reports that starting a mission through the **FOB mission-start path** creates the second player, in a "defender" role, and that the extra player must also be declared in the mission's entity definition (`.fox2`) to appear. *(likely, [prior-art/dynamite.md](prior-art/dynamite.md))*
- The same write-up reports the engine supports **16 players per session**, while its attempts to start a session with **more than two** failed. *(likely; the core unknown of the project)*
- The game has **its own in-game network messages** that can carry custom data between players. *(likely)*

### Route B: our own netcode with stand-ins (fallback, ADR 0002)
- No engine session: each extra player is a stand-in character in the host's world (for example a Mother Base staff member), moved by our own network data. *(design option, untested)*
- Works around any two-player limit, but every system (animation, damage, AI targeting, markers) must be synchronized by us.

### Where in the flow a player joins (both routes)
The least jarring moment is the one the game already has: **Sortie Prep, then a helicopter arrival** at a landing zone. A joining client chooses equipment in Sortie Prep and lands like any deployment; a leaving client is picked up by the helicopter. This is the seamless join we want (ADR 0008, R6). *(design target; whether Sortie Prep can be opened directly is unknown, R14 and C18)*

## 4. What this means for Joint Operations
1. Build the loader first (C04, C05): our plugin or proxy, a version check for 1.0.15.4, and logging, on Windows and Proton.
2. Spike Route A early (C19): start a mission as an engine session, then try a third player. The result decides ADR 0002.
3. Keep Route B on paper until C19 reports: it is the fallback, not the plan.
4. Design joining around Sortie Prep and the helicopter (C18, ADR 0008), whichever route wins.

## 5. Rig tests this note asks for
| Test | Contract | Pass when |
|---|---|---|
| Our proxy and our IHHook plugin both load and log on 1.0.15.4, on Windows and on Proton | C04, C05 | A log line from inside the game, with the build hash |
| Launch arguments reach `mgsvtpp.exe` through the launcher | C21 | Our code reads a test argument |
| A mission starts through the FOB path with two players on two machines | C19 | Both players see each other in the field |
| A third player joins the same session | C19 | Three players in the field, or a written reason why not |
| Sortie Prep can be opened for a joining client | C18 | A client lands at a chosen landing zone |

## Sources
- Our notes: [game-and-engine.md](game-and-engine.md), [modding-ecosystem.md](modding-ecosystem.md), [prior-art/dynamite.md](prior-art/dynamite.md), [steam-interfaces.md](steam-interfaces.md), [browser-launch.md](browser-launch.md), [proton.md](proton.md), each with its own primary sources.
- [Steamworks: Steam networking overview](https://partner.steamgames.com/doc/features/multiplayer/networking)
