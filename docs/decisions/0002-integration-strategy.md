# 0002: Integration strategy
Status: Proposed · Date: 2026-10-21 · Deciders: project lead, technical lead

## Context
The Fox Engine already has a multiplayer session layer used by FOB and Metal Gear Online, documented to support up to 16 players per session. Single-player missions only create one player. Prior art shows a second player can be added through the FOB mission-start path, but sessions beyond two players failed to start. See `research/game-and-engine.md` and `research/prior-art/dynamite.md`.

## Decision (proposed)
- **Strategy A, preferred:** activate the engine's own multiplayer layer inside single-player missions and free roam, then extend single-player systems (AI, missions, markers, vehicles) to be multiplayer-aware. This matches the project's goal directly.
- **Strategy B, fallback:** our own host-authoritative netcode (`docs/architecture.md`), with the game used only for rendering and simulation of remote players as puppets.
- Phase 1 runs a **spike on Strategy A** (R12). If 3 or more players cannot be made to work within the spike's time box, Strategy B is evaluated.

## Consequences
- The research plan gains R12 (engine session spike) and R13 (Steam interfaces from the game process).
- Architecture describes both strategies until the spike decides.

## Alternatives considered
- Strategy B only: more control, but rebuilds what the engine already has and is far more work for 16 players.
