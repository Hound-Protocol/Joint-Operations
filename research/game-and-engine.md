# MGSV game and engine facts

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-21 · Status: desk research, not yet verified on a test rig

Confidence key: **confirmed** (primary source or multiple sources), **likely** (one credible source), **unknown** (needs testing).

## The game
| Fact | Value | Confidence | Source |
|---|---|---|---|
| Title | Metal Gear Solid V: The Phantom Pain (TPP) | confirmed | Steam store |
| Steam App ID | 287700 | confirmed | Steam community URLs for the game |
| Current PC build | 1.15 on the title screen, 1.0.15.4 in the executable, "day3900" in `version_info.txt` | likely | Infinite Heaven and IHHook mod pages (2026) |
| Engine | Fox Engine (Konami) | confirmed | widely documented |
| Scripting | Lua, compiled statically into the executable. External Lua libraries cannot be loaded dynamically | likely | IHHook mod page |
| Data packaging | `.dat` archives containing `.fpk` packs; entity definitions in binary `.fox2` | likely | SnakeBite README, Dynamite making-of |
| Online modes | Forward Operating Bases (FOB) and Metal Gear Online 3 (MGO3) | confirmed | widely documented |
| Online status | No shutdown announced as of March 2026; FOB and MGO described as still running | likely (third-party) | CyberPost, 2026-03-01 |

## Multiplayer capability already in the engine
These points come from a public write-up of an existing multiplayer mod (see `prior-art/dynamite.md`). They are the most important technical facts for this project and must be confirmed in Phase 1.

- The engine's session layer supports **up to 16 players per session**, the same scale as MGO3 matches. Single-player missions allocate only **one** player instance. *(likely)*
- The FOB "start mission" functions can put a second player into a mission. The extra player must also be declared in the mission's `.fox2` definition to be rendered. *(likely)*
- The game has its own **in-game network messaging** that can carry custom data between players. *(likely)*
- Many single-player systems assume one player: enemy targeting defaults to player 0, markers time out, some entities crash on clients, vehicles and buddies are local. *(likely)*
- Getting **more than two players** to start a session has been attempted and failed in that project. This is the core unknown for Joint Operations. *(likely)*

## What this means for us
1. "Bringing online functionality into the single-player world" is technically grounded: the engine already has a multiplayer session layer used by FOB and MGO.
2. The hard work is making single-player systems (AI targeting, missions, markers, vehicles, buddies, saves) multiplayer-aware, and getting past two players.
3. All online paths must avoid Konami's servers. Matchmaking has to be our own (see `steam-networking.md` and ADR 0006).

## Open questions for Phase 1
- Can a session be started with 3 or more players, and what blocks it? (blocking)
- Which single-player missions and free roam can host extra players?
- How much of the FOB and MGO netcode is reachable from Lua, and how much needs native hooks?
- Does the game's netcode use Steam networking, its own UDP, or both?

## Sources
- [Steam community discussions for app 287700](https://steamcommunity.com/app/287700/discussions/0/1732089092456407184/)
- [Infinite Heaven, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/45)
- [IHHook, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/1226)
- [SnakeBite repository](https://github.com/folly-ah-duh/SnakeBite)
- [Dynamite making-of document](https://github.com/unknown321/dynamite/blob/master/docs/MAKING_OF.md)
- [CyberPost: Is MGSV shutting down? (2026-03-01)](https://cyberpost.co/is-mgsv-shutting-down/)
