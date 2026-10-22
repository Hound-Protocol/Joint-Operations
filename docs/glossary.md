# Glossary

| Term | Meaning |
|---|---|
| `.dat`, `.fpk` | Game archive and pack formats |
| `.fox2` | Binary entity definition files used by the Fox Engine |
| `dinput8.dll` proxy | A DLL placed in the game folder that the game loads instead of Windows' DirectInput library, used to run mod code |
| Acceptance criteria | The checklist a reviewer uses to accept a contract (see contracts.md) |
| ADR | Architecture decision record, kept in `docs/decisions/` |
| Contract | A task on the contract board: a GitHub issue labeled `contract` |
| Contributor record | A signed statement that a person completed a contract, checked on the Verify page |
| Deliverable | The file or result a contract must produce, named in its spec |
| FOB | Forward Operating Base, the game's online base-invasion mode |
| Fox Engine | Konami's game engine used by MGSV |
| GNS | GameNetworkingSockets, Valve's networking library (open-source version without relay) |
| Host | The player who runs the session in Venom Snake's place (helicopter seat, Command Center, briefings, cutscenes); authoritative for game state |
| IH | Infinite Heaven, a large MGSV gameplay mod |
| IHHook | MIT-licensed proxy DLL that extends the game for Infinite Heaven; can load plugins |
| MGO | Metal Gear Online, the game's online multiplayer mode |
| Proton | Valve's compatibility layer for running Windows games on Linux |
| SDR | Steam Datagram Relay, Valve's relay network for game traffic |
| Seat | A role with duties, a term and at least two holders (see governance) |
| Soldier | A player other than the host, playing a Mother Base staff member |
| Sortie Prep | The game's pre-deployment screen: equipment, buddy, time and landing zone |
| Spike | A time-boxed experiment to answer one technical question |
| Strategy A / B | Engine-native multiplayer / our own netcode (ADR 0002) |
| Join ticket | Short-lived token from the session registry that reserves a slot for one player (ADR 0008, proposed) |
| Session registry | Proposed public API that lists live Joint Operations sessions for the website (ADR 0008) |
