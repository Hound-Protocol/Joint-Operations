# 0012: One shared detection status
Status: Accepted (revised 2026-10-23; the two additions in Decision 4 and 5 are proposed, awaiting the project lead's confirmation) · Date: 2026-10-22 · Deciders: project lead

## Context
In single player the game has one player to notice, report and hunt. With a host and up to 15 clients we must decide how detection works. How the game's AI does it today is in [research/ai-system.md](../../research/ai-system.md): soldiers notice by sight and sound, report by radio to their command post (CP), and **each CP keeps its own alert phase** (Sneak, Caution, Evasion, Alert).

## Decision
1. **The session has one detection status:** Hidden, Searching or Detected.
2. **A player who is spotted joins the status.** Enemies hunt the players who are part of it.
3. **Everyone else stays Hidden** unless they are spotted too. Then they join the same status, not a new one. When it winds down, everyone in it returns to Hidden together.
4. *Proposed:* **Suspicion without a culprit.** When guards find a body or hear a noise without seeing anyone, the status goes to Searching but **nobody joins** until a player is actually seen.
5. *Proposed:* **Per-outpost underneath.** Internally each CP keeps its own phase, as the game does; the session shows the highest one. So a fight at one outpost does not wake an outpost on the other side of the map, while players still see one status.

| Status | Game phase |
|---|---|
| Hidden | Sneak |
| Searching | Caution or Evasion |
| Detected | Alert (combat) |

## Consequences
- The host owns every CP's phase and a **membership list**: which players each CP knows about ([ADR 0007](0007-host-authority.md)).
- Perception must see the clients' characters, and search and combat must target members only. These are the main research questions (C28, C06, C19).
- Sync carries the session status, the membership list and the CP phases (contract C08).
- HUD: each player sees the session status and whether they are part of it (contract C23).

## Alternatives considered
- **One alert for everyone** (anyone spotted puts all players on alert): simple, but punishes stealthy players for others' mistakes.
- **A separate alert per player:** breaks the shared world; a guard cannot be calm and in combat at the same time.
