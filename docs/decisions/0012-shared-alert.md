# 0012: One shared alert status
Status: Accepted · Date: 2026-10-22 · Deciders: project lead

## Context
In single-player, the game has one alert state for one player. With a host and up to 15 clients, we must decide how detection works: does each player have their own alert, or does the session share one?

## Decision
1. **Enemies target players individually.** Each enemy reacts to the players it can actually perceive, by distance and by detection (sight, noise, evidence). Who gets shot at depends on who is seen and who is close.
2. **The alert status is shared.** The session has **one** status, and players **join** it. Nobody has a private alert of their own.

| Status | Meaning |
|---|---|
| **Hidden** | Not noticed by enemies. |
| **Searched for** | Enemies are suspicious and searching. A player who draws suspicion joins the search. |
| **Detected** | Spotted. The first detected player starts the detection pipeline. Every player spotted after that **joins the same pipeline and status**, not a new one. |

3. Example: if one client is detected, only that client is hunted while the others stay hidden. If a second player is spotted, they join the existing alert. When the alert ends, everyone in it returns together through the game's normal phases.

## Consequences
- The host owns the single alert state machine (see [ADR 0007](0007-host-authority.md)) and a membership list: which players are hidden, searched for or detected.
- Sync needs the alert state and the membership list, plus per-enemy targeting. This goes into the state inventory (R4, contract C08).
- Phase 1 research must find how the game's own alert phases and enemy perception can be driven per player (R3, R4).
- HUD: each player sees the session status and whether they are part of it.

## Alternatives considered
- **One alert for everyone** (anyone detected puts all players on alert): simple, but it punishes stealthy players for others' mistakes.
- **Fully separate alerts per player:** breaks the shared world, because enemies cannot be in two alert states at once.
