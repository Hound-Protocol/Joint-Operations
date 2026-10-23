# Glossary

| Term | Meaning |
|---|---|
| Acceptance criteria | The checklist a reviewer uses to accept a contract (see contracts.md) |
| ADR | Architecture decision record, kept in `docs/decisions/` |
| Detection status | The one session-wide state, Hidden, Searching or Detected, that spotted players join (ADR 0012) |
| Client | A player other than the host, playing a Mother Base staff member |
| Contract | A task on the contract board: a GitHub issue labeled `contract` |
| Contractor grade | E, D, C, B, A, A+, A++, S, S+ or S++ in each field, from contract points, like the game's staff grades per unit. A contractor's overall grade is their best one |
| Chain of command | Who may decide what over whom: social, technical and organizational authority ([HP-POL-007](guides/HP-POL-007-chain-of-command.md)) |
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
| Hound ID | A staff member's permanent ID (HND-0001), on a signed staff card tied to their GitHub account number ([HP-GDE-009](guides/HP-GDE-009-grades-records-hound-ids.md)) |
| Handbook | The guides, policies and procedures (HP-GDE, HP-POL, HP-SOP), printable on A4; one of the two Documentation zones |
| Join ticket | Short-lived token from the session registry that reserves a slot for one player (ADR 0008, proposed) |
| Keycard | A staff or member card with a clearance level, LV1 to LV7 ([ADR 0011](decisions/0011-keycard-access.md)) |
| Library | The plans, decisions, research, technical, community and legal documents; the other Documentation zone |
| MGO | Metal Gear Online, the game's online multiplayer mode |
| Proton | Valve's compatibility layer for running Windows games on Linux |
| Quality Department | Tests, reviews contracts against acceptance criteria, signs off releases |
| SDR | Steam Datagram Relay, Valve's relay network for game traffic |
| Restricted area | A private document repository that opens with a clearance level after signing in (ADR 0017) |
| Seat | A role with duties, a term and at least two holders (see governance); filled once there is a playable prototype |
| Sign-in relay | The small Cloudflare Worker that completes GitHub sign-in for the website ([signin.md](signin.md)) |
| Session registry | Proposed public API that lists live Joint Operations sessions for the website (ADR 0008) |
| Sortie Prep | The game's pre-deployment screen: equipment, buddy, time and landing zone |
| Spike | A time-boxed experiment to answer one technical question |
| Strategy A / B | Engine-native multiplayer / our own netcode (ADR 0002) |
