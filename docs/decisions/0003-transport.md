# 0003: Transport
Status: Proposed · Date: 2026-10-21 · Deciders: technical lead · Supersedes: transport section of architecture draft

## Context
The first draft said "GameNetworkingSockets over Steam relay". The open-source GameNetworkingSockets does not include Steam Datagram Relay; relay is only available through the Steamworks version. See `research/steam-networking.md`.

## Decision (proposed)
- **Steam path:** call Steam's networking interfaces (`ISteamNetworkingMessages` or `ISteamNetworkingSockets`) through the Steam API already loaded in the game process. Gives relay, NAT traversal and identity by Steam ID.
- **Direct path:** open-source GameNetworkingSockets (BSD-3-Clause) over UDP for LAN, testing and non-Steam use.
- Both behind one internal transport interface, so session code does not care which is used.
- If Strategy A (0002) uses the game's own netcode, this transport carries only our additional messages.

## Consequences
- Phase 1 must confirm that current interfaces are reachable through the game's older `steam_api64.dll` (R13).
- The Steam App ID question remains a release gate.

## Update 2026-10-23
The choice between Messages and Sockets is proposed in [ADR 0018](0018-steam-networking-sockets.md): Sockets, with Messages as a fallback ([research](../../research/steam-networking-api.md)).
