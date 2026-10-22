# Prior art: Dynamite

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-21 · Method: reading the public repository and its documentation. No code was copied, and none may be copied (see "License").

Dynamite is a public, open-source multiplayer mod for MGSV:TPP. It is the closest existing work to ours, so its documented findings are the most useful prior art available. This note records what it publicly documents, in our own words, and what we learn from it.

## Summary
| Item | Detail |
|---|---|
| Scope | Two players, regular missions. Free roam excluded. Described as early development |
| Language and build | Go (installer, web UI, local server) plus C++ for the in-game hook; Makefile build |
| Loading | `dinput8.dll` proxy based on an adapted IHHook, plus Lua scripts and patched game files |
| Linux | Supported with `WINEDLLOVERRIDES="dinput8.dll=n,b" %command%` |
| Connection | Through Steam networking; the client enters the host's Steam ID. Optional black and white lists |
| Matchmaking | A built-in local master server (a reimplementation of the game's server) on port 6667, so the game's online calls do not go to Konami |
| Saves | Backed up first; the mod uses separate save files |
| Repository | 458 stars, 177 commits, 55 open issues (at time of reading) |
| License | GPL-3.0 with the Commons Clause (no commercial use) |

## How it works, as documented
- **Session:** the engine supports up to 16 players per session, but single-player missions create only one player. The mod starts missions through the **FOB mission-start path**, which puts the client in a "defender" role. The second player also has to be added to the mission's `.fox2` entity definition to be rendered.
- **Messaging:** custom data first rode inside damage events, which lost precision. It later moved to the game's own in-game network messaging.
- **AI:** enemies are host-controlled. Enemies were hardcoded to target player 0. The fix was a native hook that picks the closest player as the target.
- **Combat:** clients initially took no damage, because enemy weapons are flagged to ignore FOB defenders. Fixing that needed both Lua and executable patches.
- **HUD:** player markers normally time out after 15 seconds. That was patched, and player icons were changed by altering the icon choice logic.

## Documented limitations
- More than two players: attempts **failed to start**.
- Vehicles, buddies, helicopters, supply drops and interrogations are partly or fully local to each player.
- Some world objects are not synchronized, even though the game has functions for it.
- Some entities crash on the client when attacked. Some missions fail to load or loop.
- Fultoning another player fails the mission.

## What we learn
1. **Use the engine's own multiplayer.** The documented path (FOB session start, `.fox2` player entries, in-game messaging) is strong evidence for our "online into single-player" approach. This is the basis of ADR 0002, Strategy A.
2. **The 2-player wall is the main risk.** Phase 1 must find out why sessions beyond two players fail before committing to 16.
3. **Many single-player systems need individual work.** Each one (AI targeting, damage, markers, vehicles, buddies, support) becomes a contract in our state inventory (R4).
4. **Avoid Konami's servers** with direct Steam connections or our own matchmaking, never theirs.
5. **Loader conflicts are real.** Both mods use a `dinput8.dll` proxy, so they cannot be installed together. Our docs must say so, and a plugin model (ADR 0004) reduces conflicts with Infinite Heaven.

## License
GPL-3.0 with the Commons Clause. Its code may not be copied into Joint Operations. This study used public documentation only.

## Sources
- [Dynamite repository](https://github.com/unknown321/dynamite)
- [Making-of document](https://github.com/unknown321/dynamite/blob/master/docs/MAKING_OF.md)
- [User documentation](https://github.com/unknown321/dynamite/blob/master/webui/docs/docs.md)
- [LICENSE](https://github.com/unknown321/dynamite/blob/master/LICENSE)
