# Risk register

Status: Current · Date: 2026-10-21 · Updated: 2026-10-23 · Review: at every phase gate

Likelihood and impact: High, Medium, Low.

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Engine sessions cannot exceed 2 players | Medium | High | R12 spike early; Strategy B fallback (ADR 0002) | Technical lead |
| 2 | Steam App ID use not acceptable for public release | Medium | High | Written position; ask Valve; direct-IP path keeps working | Project lead |
| 3 | Rights-holder takedown | Low to Medium | High | Mod only, no assets, no Konami services, unofficial wording, no commerce | Project lead |
| 4 | Too few reverse-engineering contributors | High | High | Recruiting, small contracts, good onboarding docs | Project lead |
| 5 | Game update changes addresses | Low | Medium | Pinned build, version check, address tables | RE lead |
| 6 | Conflicts with other mods' `dinput8.dll` | High | Medium | IHHook plugin model; clear docs | Technical lead |
| 7 | License incompatibility with Steamworks | Low | Medium | Settled: GPL-3.0 with a Steamworks and MGSV permission (ADR 0005) | Project lead |
| 8 | Antivirus flags the mod | Medium | Medium | Code signing, CI-only builds, checksums | Release signer |
| 9 | Desync and crashes in single-player systems | High | Medium | State inventory, host authority, soak tests | Networking lead |
| 10 | Save damage for players | Medium | High | Separate saves, backups before install | RE lead |
| 11 | Key person leaves | Medium | Medium | Two holders per seat once seats are filled after the playable prototype, documentation, handoff notes | Seat holders |
| 12 | Proton-specific failures | Medium | Low | Linux tester, documented launch options | Proton tester |
| 13 | Konami shuts down online services | Low | Low | We do not depend on them (ADR 0006) | — |
| 14 | Session registry API abused (spam listings, fake servers) | Medium | Medium | Rate limits, heartbeats, report button, moderator removal (ADR 0008, if accepted) | Technical lead |
| 15 | Session registry down or unpaid | Low | Medium | Steam lobby search fallback in launcher and game; project-owned account; free tier (ADR 0008) | Project lead |
| 16 | Launch arguments do not reach the game through Konami's launcher | Medium | Medium | Hand-off file read by our plugin instead of arguments (R14) | Technical lead |
| 17 | One person holds every seat until the playable prototype | High | High | Everything written down, weekly encrypted backups (HP-SOP-009), recovery codes stored safely, seats filled after the prototype | Project lead |
| 18 | Sign-in relay secret leaks or the relay is misused | Low | Medium | Secret only in the relay's encrypted settings; the app can only read three private document repositories; tokens expire within 8 hours; rotate the secret and revoke tokens (HP-SOP-006, ADR 0017) | Project lead |
| 19 | Restricted documents copied to public places | Medium | Low | Nothing secret goes in documents (secrets live in a password manager); access only through GitHub teams; removal on offboarding (HP-SOP-007) | Administration |
