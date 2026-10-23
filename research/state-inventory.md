# State inventory: what a session must keep in sync

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-23 · Status: **draft** from desk research and gameplay knowledge; costs are estimates until R9 measures them, and every row needs a rig to find where the state lives · Game build: 1.0.15.4 · Phase 1: R4 (draft) · Contract: C08

Confidence key: **confirmed** (gameplay or a primary source), **likely**, **unknown** (needs a rig). The list is built from what a player can see and do in the game, not from game files ([HP-POL-003](../docs/guides/HP-POL-003-clean-room-and-ip.md)).

## Question
Which parts of the game must every player see the same way, who owns each part, how is it sent, and in which order do we build it?

## Rules this list follows
- **The host owns the world** ([ADR 0007](../docs/decisions/0007-host-authority.md)). A client owns only its own character's input and movement, which the host checks.
- **State or event.** Things that change all the time (positions) are sent as **unreliable state**, newest wins. Things that happen once (a shot hits, a door opens) are sent as **reliable events** ([networking playbook](networking-playbook-summary.md)).
- **Late join.** Everything marked *snapshot* goes into the full world snapshot a joining player receives, on the bulk lane ([steam-networking-api.md](steam-networking-api.md)).
- **Interest.** At 16 players, far-away state is sent less often. Rates below are for things near the receiving player.

## Priority key
| Priority | Meaning |
|---|---|
| **P0** | Without it there is no co-op: needed for the first two-player prototype |
| **P1** | Needed for a fair mission: needed for 0.1 |
| **P2** | Needed for the full experience; can be simplified at 0.1 |
| **P3** | Polish, or host-only with a simple stand-in on clients |

## The inventory
Rate: how often while it changes. Cost: rough bandwidth or effort (low, medium, high).

### Players (P0)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Position, facing, velocity | Client, checked by host | Unreliable state | 20 to 30 per second | yes | medium | design |
| Stance and movement mode (stand, crouch, prone, sprint, climb, ride) | Client | Unreliable state | with position | yes | low | design |
| Animation state (what the character is doing, not every bone) | Client | Unreliable state | with position | yes | medium | likely: the engine drives animation from state, rig must confirm |
| Aim direction, weapon raised | Client | Unreliable state | with position | no | low | design |
| Equipped weapon, item, suppressor, ammo counts | Client asks, host confirms | Reliable event | on change | yes | low | design |
| Health, stamina, injuries, death and revive | Host | Reliable event | on change | yes | low | design |
| Prosthetic arm and suit (what others see) | Client | Reliable event | on change | yes | low | design |

### Combat (P0 to P1)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Shots fired (muzzle, sound, tracer) | Client | Unreliable event | per shot | no | medium | design |
| Hits and damage (lethal, non-lethal, stun, sleep) | **Host decides** | Reliable event | per hit | no | low | design |
| CQC: grabs, throws, holds, interrogation | Host decides | Reliable event | per action | no | medium: animations on two characters | unknown |
| Throwables and explosions (grenades, C4, decoys) | Host | Reliable event | per use | while active | low | design |

### Enemies and detection (P0 to P1)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Soldier position, facing, animation | Host | Unreliable state | 10 to 20 per second near players, less far away | yes | **high**: the largest stream at 16 players | design |
| Soldier condition (awake, asleep, stunned, dead, tied, extracted) | Host | Reliable event | on change | yes | low | design |
| What each soldier has noticed and of whom | Host | Host only | | no | none on the wire | likely ([ai-system.md](ai-system.md)) |
| **CP phases** (Sneak, Caution, Evasion, Alert) | Host | Reliable event | on change | yes | low | confirmed: one phase per CP ([ai-system.md](ai-system.md)) |
| **Session detection status and membership list** | Host | Reliable event | on change | yes | low | ADR [0012](../docs/decisions/0012-shared-alert.md) |
| Radio calls and reinforcement calls (what players hear) | Host | Reliable event | per call | no | low | design |

### Markers and the iDroid (P1)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Marked enemies and objects | Shared: each player marks, the session sees all marks | Reliable event | on change | yes | low | design: shared marks are a choice, see Open questions |
| Map pins and the landing zone choice | Shared | Reliable event | on change | yes | low | design |
| Teammates on the map and HUD | Derived from player positions | none extra | | | none | design |

### World objects (P1)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Doors, gates, containers | Host | Reliable event | on change | yes | low | design |
| Destroyed things: comms, anti-air radar, generators, mortars, gun emplacements | Host | Reliable event | on change | yes | low | confirmed: these change the mission (gameplay) |
| Power and lights at an outpost | Host | Reliable event | on change | yes | low | confirmed (gameplay) |
| Items on the ground, crates, plants, diamonds | Host | Reliable event | on pick-up | yes | medium: many objects | design |

### Vehicles and buddies (P2)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Vehicle position, speed, damage, who sits where | The driver's machine, checked by host | Unreliable state plus events | 20 per second | yes | medium | design |
| Buddy (D-Horse, D-Dog, Quiet, D-Walker): one per player or one per session | Host | Unreliable state | 10 to 20 per second | yes | medium | open question |

### Support and extraction (P1 to P2)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Fulton extractions (soldiers, prisoners, animals, containers, vehicles) | Host | Reliable event | per use | no | low | design |
| Helicopter: arrivals, departures, fire support | Host | Reliable event plus state while flying | 10 per second | yes | medium | design: also carries join and leave (ADR [0008](../docs/decisions/0008-browser-launch.md)) |
| Supply drops, support fire, weather and time changes requested by a player | Host | Reliable event | per use | no | low | design |

### Mission and world (P1)
| State | Owner | Kind | Rate | Snapshot | Cost | Confidence |
|---|---|---|---|---|---|---|
| Mission, objectives, tasks and flags | Host | Reliable event | on change | yes | low | design |
| Time of day and weather | Host | Reliable state | every few seconds | yes | low | design |
| Cutscenes and radio briefings | Host | Reliable event | per trigger | no | high: open how clients see them | open question |
| Prisoners and animals (alive, carried, extracted) | Host | Reliable event | on change | yes | low | design |

### The host's campaign (P3)
| State | Owner | Kind | Note |
|---|---|---|---|
| Mother Base: resources, staff, research, GMP | Host only | Host only | Clients play in the host's world; rewards for clients are an open question |
| Revenge System (how enemies adapt) | Host only | Host only | Open question in [ai-system.md](ai-system.md): do clients' actions count? |
| Clients' own saves | Never touched | | A client's single-player save must not change by playing in someone else's session |

## Build order (draft)
1. **P0 for the two-player prototype:** players, hits and damage, soldier position and condition, CP phase. That is enough to sneak, shoot and be seen together.
2. **P1 for 0.1:** detection status and membership, markers, world objects, Fulton, mission flags, time and weather, the late-join snapshot.
3. **P2 after 0.1:** vehicles, buddies, CQC between players and enemies in full, cutscenes.
4. **P3:** campaign rewards for clients.

## Open questions
1. Shared marks: does one player's mark show for everyone (easier co-op), or only their own (closer to the original)? A design call for the project lead.
2. Buddies: one per player at 16 players is a lot of AI; one per session, or none, may be needed.
3. Cutscenes: skip for clients, show to all, or pause the session?
4. Where each row lives in the engine, and whether the engine already sends any of it in its own session (R3, R12, contract C19). If Route A works, much of the players section may come for free ([launch-and-second-player.md](launch-and-second-player.md)).
5. Real bandwidth: soldier state is the biggest unknown and decides interest management (R9).

## Sources
- Gameplay of MGSV 1.0.15.4 (observed behaviour only).
- Our notes: [ai-system.md](ai-system.md), [networking-playbook-summary.md](networking-playbook-summary.md), [steam-networking-api.md](steam-networking-api.md), [launch-and-second-player.md](launch-and-second-player.md).
- Decisions: [ADR 0007](../docs/decisions/0007-host-authority.md), [ADR 0008](../docs/decisions/0008-browser-launch.md), [ADR 0012](../docs/decisions/0012-shared-alert.md).
