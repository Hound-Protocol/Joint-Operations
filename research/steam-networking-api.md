# Steam Networking Messages or Sockets, for a host-authoritative session

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-23 · Status: desk research from Valve's public documentation; the spike (R7, contract C09) and the rig test (R13, contract C20) are still open · Phase 1: R7 (desk part) · Proposes: [ADR 0018](../docs/decisions/0018-steam-networking-sockets.md)

Confidence key: **confirmed** (Valve documentation), **likely** (strong inference), **unknown** (needs the spike or a rig).

## Question
ADR 0003 left a choice open: `ISteamNetworkingMessages` or `ISteamNetworkingSockets` for the Steam path. Which one fits a session with one authoritative host and up to 15 clients ([ADR 0007](../docs/decisions/0007-host-authority.md))?

## Short answer
**Sockets.** Messages is a convenience layer built on top of Sockets, meant for porting old peer-to-peer code. A host-authoritative session is a client-server game where the host is the server, and Sockets is made for that: one listen socket on the host, one connection per client, a clear connect and disconnect for each player, lanes to stop large transfers from delaying movement, and live connection quality numbers for the session browser and the HUD. Its API is also the same as the open-source GameNetworkingSockets, so the Steam path and the direct path can share most of our transport code. *Confidence: likely, pending the spike and the rig test.*

## What Valve's documentation says
| Point | `ISteamNetworkingMessages` | `ISteamNetworkingSockets` | Confidence |
|---|---|---|---|
| Model | Connectionless, "like UDP": send to a Steam ID, sessions are made and closed for you | Connection-oriented and message-oriented: listen socket, connect, accept, close | confirmed |
| Relation | **Built on top of** the Sockets code | The base layer | confirmed |
| Valve's advice | Easiest for porting code written for the old `ISteamNetworking` | Use it "if you need more low level information or control, or to be able to better handle failure" | confirmed |
| Reliable delivery | Exactly once and in order, per channel | Exactly once and in order, per connection or per lane | confirmed |
| Unreliable delivery | Yes | Yes, with flags such as no-Nagle and no-delay | confirmed |
| A player leaving | No notification when the other side closes; an idle session times out silently after a few minutes; failures arrive as a separate callback | `SteamNetConnectionStatusChangedCallback_t` for every state change: connecting, connected, closed by peer, problem detected locally | confirmed |
| Accepting a new player | `SteamNetworkingMessagesSessionRequest_t` callback, then accept | Connection status callback, then `AcceptConnection` | confirmed |
| Receiving from many clients | One call per channel | **Poll groups**: one call returns the messages of every client | confirmed |
| Priorities | Channels (separate ordering only) | **Lanes** with priority and weight, ordered within a lane (`ConfigureConnectionLanes`) | confirmed |
| Connection quality | Session state per peer | `GetConnectionRealTimeStatus`: ping, quality, bytes queued, per lane | confirmed |
| Relay (SDR) and NAT traversal | Yes, by Steam ID | Yes: `CreateListenSocketP2P` and `ConnectP2P` by Steam ID | confirmed |
| Plain IP | Not the purpose | `CreateListenSocketIP` and `ConnectByIPAddress` | confirmed |
| Open-source twin | None | GameNetworkingSockets has the same API (without relay and Steam signaling, see [steam-networking.md](steam-networking.md)) | confirmed |

## Why it matters for Joint Operations
| Our need | Why Sockets fits |
|---|---|
| **The host is the server** (ADR 0007) | A listen socket and one connection per client is exactly that shape. With Messages we would rebuild connection state ourselves |
| **Seamless join and leave** (ADR 0008) | A clear connected or closed event per player is what the join and leave flow hangs on: helicopter in, helicopter out, slot freed. Silent time-outs would leave ghosts in the field for minutes |
| **Late join** needs a large world snapshot | Put the snapshot on a low-priority lane so it does not delay movement and combat for the players already in the field |
| **16 players** | One poll group on the host reads all clients in one call |
| **Session browser and HUD** | Real-time ping and quality per client, for the browser list and a connection warning |
| **One transport for Steam and direct IP** (ADR 0003) | Same API on both paths; only the listen and connect calls differ |

## The one risk that could change the answer
Callbacks. The game's 2015 Steam layer runs its own callback dispatch, and our code lives inside the game. Getting Steam's callbacks delivered to us is the main risk found in [steam-interfaces.md](steam-interfaces.md). Sockets lets us pass the connection status callback as a **function pointer in the connection's configuration**, so it does not depend on the game's dispatcher ([steam-interfaces.md](steam-interfaces.md)). Messages needs its session request and session failure callbacks through the normal dispatcher, or polling with an accept-everyone policy, which still cannot tell us when a player has left. *So the callback risk also points to Sockets.* *(likely; test in C20)*

## Proposed layout (for the spike to test)
- **Host:** `CreateListenSocketP2P` (and `CreateListenSocketIP` for direct play); every accepted client goes into one poll group.
- **Client:** `ConnectP2P` to the host's Steam ID, or `ConnectByIPAddress` for direct play.
- **Lanes per connection** (priorities to be tuned by the spike):
  1. Reliable events: damage, deaths, item pick-ups, mission flags, alert changes.
  2. Unreliable state: player and AI snapshots, sent many times a second, newest wins.
  3. Bulk: the late-join snapshot and other large transfers.
- **Messages stays a fallback**, for example if a rig test shows the listen socket cannot be created from inside the game.

## What the spike (C09) must measure
1. Both APIs reachable from a test program, and then from inside the game (with C20).
2. Connection status delivered through the configuration callback, without the game's dispatcher.
3. 1 host and 15 simulated clients over relay and over direct IP: bandwidth, ping, CPU.
4. Lanes: late-join snapshot sent while 15 clients move, with no visible stutter.
5. A client killed without warning is reported as closed within a few seconds.

## Sources
- [Steamworks: Steam networking overview](https://partner.steamgames.com/doc/features/multiplayer/networking)
- [Steamworks: ISteamNetworkingMessages](https://partner.steamgames.com/doc/api/ISteamNetworkingMessages)
- [Steamworks: ISteamNetworkingSockets](https://partner.steamgames.com/doc/api/ISteamNetworkingSockets)
- Our notes: [steam-networking.md](steam-networking.md), [steam-interfaces.md](steam-interfaces.md), [networking-playbook-summary.md](networking-playbook-summary.md)
