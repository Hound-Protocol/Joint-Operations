# Networking playbook summary (R11)

Author: Claude (technical lead) · Date: 2026-10-21 · Source: Co-op Anything networking playbook (MIT), summarized in our own words.

## Sync models
- **Deterministic lockstep** sends only inputs, but needs bit-exact simulation on every machine. A mod cannot guarantee that, so it is not realistic for MGSV.
- **Host-authoritative state sync** is the default for modded single-player games: the host's game is the truth, and clients receive corrections. Expect approximation and correction "pops".
- **Snapshot interpolation** suits remote player avatars, at the cost of some delay (roughly 85 to 350 ms depending on snapshot rate).
- **Client-owned avatar with host arbitration** is the simplest for friendly play: each player simulates their own character, and the host decides shared things like doors and mission flags.

## Techniques worth adopting
- Quantize data (fewer bits for positions and rotations) and use delta compression against acknowledged state.
- A priority accumulator to fit the most important objects into each packet.
- Interest management (only send nearby objects). Usually unnecessary at 2 to 4 players, but likely needed at 16.
- Movement unreliable, events reliable. Never reliable-ordered for movement.
- Stable IDs in the protocol, never memory addresses.
- Keep-alives, because some relay APIs do not report a peer leaving.

## What to sync, in order of cost
1. Player avatars.
2. NPC ownership, with a single owner per NPC.
3. Combat hits, each with an ID so they are not applied twice.
4. World objects, decided by the host.
5. Mission and story flags, owned by the host. This is the most valuable hook and where many mods fail.
6. Cutscenes and dialogue, the hardest area.

## Late join, level changes, saves
- Late joiners get a full snapshot, then deltas.
- Level changes must not tear down other players' state.
- The host's save is the source of truth.

## Testing
- Mock Steam DLL to run two clients on one PC.
- clumsy (Windows) and tc netem (Linux) for bad-network profiles.
- State-hash logging on each machine as a cheap desync detector.
- Soak tests of 30 to 60 minutes.

## How it applies to Joint Operations
If Strategy A (engine-native multiplayer, ADR 0002) works, the engine handles part of the sync and we fill the gaps with the techniques above. If it does not, Strategy B builds our own host-authoritative sync on these principles.

## Source
- [Co-op Anything: networking playbook](https://github.com/cranebeaker/coop-anything/blob/main/playbook/networking.md)
