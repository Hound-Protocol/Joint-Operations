# Risk register

Status: DRAFT · Date: 2026-10-21 · Review: at every phase gate

Likelihood and impact: High, Medium, Low.

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Engine sessions cannot exceed 2 players | Medium | High | R12 spike early; Strategy B fallback (ADR 0002) | Technical lead |
| 2 | Steam App ID use not acceptable for public release | Medium | High | Written position; ask Valve; direct-IP path keeps working | Project lead |
| 3 | Rights-holder takedown | Low to Medium | High | Mod only, no assets, no Konami services, unofficial wording, no commerce | Project lead |
| 4 | Too few reverse-engineering contributors | High | High | Recruiting, small contracts, good onboarding docs | Project lead |
| 5 | Game update changes addresses | Low | Medium | Pinned build, version check, address tables | RE lead |
| 6 | Conflicts with other mods' `dinput8.dll` | High | Medium | IHHook plugin model; clear docs | Technical lead |
| 7 | License incompatibility with Steamworks | High | Medium | ADR 0005 before any binary | Project lead |
| 8 | Antivirus flags the mod | Medium | Medium | Code signing, CI-only builds, checksums | Release signer |
| 9 | Desync and crashes in single-player systems | High | Medium | State inventory, host authority, soak tests | Networking lead |
| 10 | Save damage for players | Medium | High | Separate saves, backups before install | RE lead |
| 11 | Key person leaves | Medium | Medium | Two holders per seat, documentation, handoff notes | Seat holders |
| 12 | Proton-specific failures | Medium | Low | Linux tester, documented launch options | Proton tester |
| 13 | Konami shuts down online services | Low | Low | We do not depend on them (ADR 0006) | — |
