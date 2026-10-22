# Steam networking, lobbies and App ID

Author: Claude (technical lead) · Date: 2026-10-21 · Status: desk research

## Facts
| Fact | Detail | Source |
|---|---|---|
| Current APIs | `ISteamNetworkingMessages` (connectionless, by Steam ID, reliable and unreliable, large messages) and `ISteamNetworkingSockets` (connection handles). The old `ISteamNetworking` is deprecated | Steamworks networking docs |
| Relay | Steam Datagram Relay (SDR) routes P2P traffic over Valve's backbone automatically when useful, hides IP addresses and can improve ping | Steamworks networking docs |
| **Open-source GameNetworkingSockets** | BSD-3-Clause. Gives a **subset**: UDP with reliable and unreliable messages, and P2P through WebRTC ICE with **your own** signaling. **SDR, Steam authentication and Steam signaling are only in the Steamworks version** | GNS README |
| Lobby size | `CreateLobby` accepts at most **250** members, so 16 is fine | ISteamMatchmaking docs |
| Spacewar | App ID 480 is Valve's sample app. Useful for development, not for releases | Co-op Anything networking playbook |

## Correction to our architecture
The earlier plan said "GameNetworkingSockets over Steam relay". That combination does not exist in the open-source library. The two paths are separate:
- **Steam path:** call the Steamworks networking interfaces that the game process already has, through the game's own Steam API. This gives relay and NAT traversal through Steam.
- **Direct path:** the open-source GNS (or ENet) over plain UDP for LAN, testing and non-Steam setups.

Both paths sit behind one internal transport interface. See ADR 0003.

## The App ID question, re-examined
- Our code runs **inside the MGSV process**. The game has already initialized Steam with its own App ID (287700), so Steam calls from our code act as the game. Lobbies and networking would then belong to app 287700, not to Spacewar. *(likely; must be confirmed on a rig)*
- That removes the need for our own App ID, but it is **not** a clear permission. Steam's terms for using a third party's app ID this way were not found. Other in-process mods reportedly use their game's Steam features this way, but that was not verified at source level.
- **Status:** still a gate before any public build. Needed: a written position in `docs/legal.md`, and ideally a question to Valve support.

## Technical risk: old Steam API in the game
MGSV was released in 2015 and ships its own `steam_api64.dll`, which may predate the current networking interfaces (the exact version is not yet checked). Interfaces are served by the installed Steam client, so they may still be reachable by their versioned interface names even through an old loader. This is **unverified** and is a Phase 1 test (R13).

## Matchmaking without Konami
The game's own multiplayer normally uses Konami's servers for matchmaking. Our rule is that nothing touches Konami's online services. Options:
1. Connect directly by Steam ID or Steam lobby, bypassing the game's matchmaking. *(preferred)*
2. Run our own small matchmaking server, as at least one existing mod does. *(fallback, adds hosting cost)*

## Sources
- [Steamworks: Steam Networking](https://partner.steamgames.com/doc/features/multiplayer/networking)
- [Steamworks: ISteamMatchmaking](https://partner.steamgames.com/doc/api/ISteamMatchmaking)
- [GameNetworkingSockets repository](https://github.com/ValveSoftware/GameNetworkingSockets)
- [Co-op Anything: networking playbook](https://github.com/cranebeaker/coop-anything/blob/main/playbook/networking.md)
- [Dynamite making-of (game messaging and master server)](https://github.com/unknown321/dynamite/blob/master/docs/MAKING_OF.md)
