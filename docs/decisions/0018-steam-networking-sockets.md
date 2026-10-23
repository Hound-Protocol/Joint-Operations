# 0018: Steam Networking Sockets for the Steam path
Status: Proposed · Date: 2026-10-23 · Deciders: technical lead (seat opens with the playable prototype; the project lead decides until then) · Refines: [ADR 0003](0003-transport.md)

## Context
ADR 0003 chose Steam's networking for the Steam path, but left open whether to use `ISteamNetworkingMessages` or `ISteamNetworkingSockets`. Joint Operations has one authoritative host and up to 15 clients ([ADR 0007](0007-host-authority.md)), joins and leaves mid-mission ([ADR 0008](0008-browser-launch.md)), and runs inside the game's process, whose 2015 Steam layer makes callbacks the main risk ([steam-interfaces.md](../../research/steam-interfaces.md)). The comparison is in [steam-networking-api.md](../../research/steam-networking-api.md).

## Decision (proposed)
- Use **`ISteamNetworkingSockets`** for the Steam path: the host opens a P2P listen socket, clients connect to the host's Steam ID, the host reads all clients through one poll group.
- Receive connection status through the **callback function pointer in the connection configuration**, not through the game's callback dispatcher.
- Use **lanes** for reliable events, unreliable state, and bulk transfers such as the late-join snapshot.
- Use the same API shape for the direct path through open-source GameNetworkingSockets, behind the one transport interface of ADR 0003.
- Keep **`ISteamNetworkingMessages`** as a fallback only.

## Consequences
- Each player has a clear connected and closed state, which the join and leave flow and the session browser use directly.
- More code than Messages for connection handling, but code we need anyway for host authority.
- Becomes Accepted only after the spike (C09) and the in-game rig test (C20) pass the checks listed in the research note. If either fails, revisit this record.
