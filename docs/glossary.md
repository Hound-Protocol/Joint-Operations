# Glossary

| Term | Meaning |
|---|---|
| Acceptance criteria | The checklist a reviewer uses to accept a contract (see contracts.md) |
| ADR | Architecture decision record, kept in `docs/decisions/` |
| Alert status | The one session-wide state, hidden, searched for or detected, that players join (ADR 0012) |
| Client | A player other than the host, playing a Mother Base staff member |
| Contract | A task on the contract board: a GitHub issue labeled `contract` |
| Contractor rank | A, A+, A++, S, S+ or S++, by number of completed contracts |
| Contributor record | A signed statement that a person completed a contract, checked on the Verify page |
| `.dat`, `.fpk` | Game archive and pack formats |
| Deliverable | The file or result a contract must produce, named in its spec |
| Department | One of four parts of Hound Protocol: Administration, Development, Quality, Contractor (see departments.md) |
| `dinput8.dll` proxy | A DLL placed in the game folder that the game loads instead of Windows' DirectInput library, used to run mod code |
| FOB | Forward Operating Base, the game's online base-invasion mode |
| Fox Engine | Konami's game engine used by MGSV |
| `.fox2` | Binary entity definition files used by the Fox Engine |
| GNS | GameNetworkingSockets, Valve's networking library (open-source version without relay) |
| Host | The player who runs the session and holds every command position (helicopter seat, Command Center, briefings, cutscenes); authoritative for game state |
| IH | Infinite Heaven, a large MGSV gameplay mod |
| IHHook | MIT-licensed proxy DLL that extends the game for Infinite Heaven; can load plugins |
| Join ticket | Short-lived token from the session registry that reserves a slot for one player (ADR 0008, proposed) |
| MGO | Metal Gear Online, the game's online multiplayer mode |
| Proton | Valve's compatibility layer for running Windows games on Linux |
| Quality Department | Tests, reviews contracts against acceptance criteria, signs off releases |
| SDR | Steam Datagram Relay, Valve's relay network for game traffic |
| Seat | A role with duties, a term and at least two holders (see governance) |
| Session registry | Proposed public API that lists live Joint Operations sessions for the website (ADR 0008) |
| Sortie Prep | The game's pre-deployment screen: equipment, buddy, time and landing zone |
| Spike | A time-boxed experiment to answer one technical question |
| Strategy A / B | Engine-native multiplayer / our own netcode (ADR 0002) |
