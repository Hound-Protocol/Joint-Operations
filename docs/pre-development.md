# Pre-development plan

Status: DRAFT · Date: 2026-10-21 · Owner: technical lead, approved by project lead

This is the master plan for everything that must be in place **before** development of version 0.1 starts. It links to the detailed documents rather than repeating them.

## 1. Where we stand
| Area | State |
|---|---|
| Goal and scope | Set: multiplayer mod bringing online functionality into the single-player world, up to 16 players ([ADR 0001](decisions/0001-multiplayer-scope.md)) |
| Team and name | Hound Protocol, community development team; contract-based contribution ([governance](governance.md)) |
| Repository and website | Built, in review as pull request #1; GitHub Pages ready to enable |
| Research | Desk research done for engine, modding tools, Steam, Proton, law, funding and prior art ([research index](../research/README.md)) |
| Architecture | Drafted, with two candidate strategies ([ADR 0002](decisions/0002-integration-strategy.md)) |
| Legal | License and Steam App ID still open; both are gates |
| Code | None yet, by design |

## 2. Gates before development
Development of 0.1 (Phase 2) starts only when every gate is **closed** or explicitly deferred by the project lead.

### G1 Legal and license
- [ ] Choose the license ([ADR 0005](decisions/0005-license.md)); replace the LICENSE placeholder with the full text
- [ ] Record the Steam App ID position in `legal.md` (using the game's own App ID from inside the process; see `research/steam-networking.md`)
- [ ] Optional but recommended: ask Valve support how in-process mods may use a game's Steam networking
- [ ] Decide funding: recommended **no donations before 0.1**; later through a fiscal host ([funding research](../research/funding-and-distribution.md))
- [ ] Decide whether to get a legal opinion before public releases
- [ ] Confirm the repository stays public (it is public now; docs no longer assume private)

### G2 People and governance
- [ ] At least two holders for each critical seat: GitHub owner, Discord admin, release signer ([governance](governance.md))
- [ ] A **human** technical lead delegate who can approve merges and releases (Claude is a tool and cannot hold accounts or accountability)
- [ ] Minimum crew to start Phase 1: one reverse engineer (C++, x64), one networking developer, one Windows tester, one Linux and Proton tester
- [ ] Code of conduct and security policy adopted (`CODE_OF_CONDUCT.md`, `SECURITY.md`)

### G3 Test environment and toolchain
- [ ] Pin game build **1.0.15.4** (record the executable's SHA-256 in `research/environment.md`)
- [ ] Windows rig and Linux/Proton rig documented and reproducible (R1)
- [ ] Toolchain chosen: C++ with MSVC for the native component (matches IHHook), Lua for game scripts; build in GitHub Actions
- [ ] Two Steam accounts that own MGSV, for real multiplayer tests
- [ ] Separate save handling, so testers never risk their normal saves

### G4 Phase 1 research results
All items in the [Phase 1 research plan](phase1-research-plan.md). The ones that decide the project:
- [ ] **R12** Engine session spike: can 3 or more players join one session? Result decides [ADR 0002](decisions/0002-integration-strategy.md)
- [ ] **R13** Steam interfaces reachable from the game process; decides [ADR 0003](decisions/0003-transport.md)
- [ ] **R2** Loader path, including IHHook plugin loading; decides [ADR 0004](decisions/0004-loader.md)
- [ ] **R4** State inventory: every single-player system ranked by cost to make multiplayer-aware

### G5 Infrastructure
- [ ] Apply the [GitHub setup checklist](github-setup.md): merge pull request #1 (squash), repository details, Pages, security settings, organization two-factor
- [x] Branch protection on `main`: pull requests required, CI must pass (ruleset `main`)
- [x] CI checks for pull requests: data files, site script, doc links, no game files, single-file build (`.github/workflows/checks.yml`)
- [ ] CI later: build and sign binaries
- [x] Discord server built from [the blueprint](discord.md)

## 3. Sequence
Steps in order. Steps on the same line can run in parallel.

1. **Now:** merge the pull request, enable Pages, apply repository settings (G5). Decide license and funding stance (G1).
2. **Recruit:** open Discord, publish the recruiting post, fill the critical seats (G2).
3. **Environment:** pin the build, document both rigs, set up test accounts (G3).
4. **Phase 1 research:** R1, R10, R13 first; then R2, R7, R8, R12 in parallel; then R3, R4, R5, R6, R9.
5. **Decide:** close ADRs 0002 to 0005 based on the results. Update architecture.
6. **Plan 0.1:** break Phase 2 into contracts on the board, with acceptance criteria.
7. **Start development.**

## 4. Decisions needed from the project lead
| Decision | Recommendation | Reference |
|---|---|---|
| License | GPL-3.0 with a linking permission for Steamworks and the game | ADR 0005 |
| Donations before 0.1 | No; set up a fiscal host after 0.1 | funding research |
| Integration strategy | Approve Strategy A spike, with B as fallback | ADR 0002 |
| Loader approach | IHHook plugin first, own proxy as fallback | ADR 0004 |
| Human technical delegate | Appoint one before Phase 1 code | governance |

## 5. Biggest risks
Full list in the [risk register](risk-register.md). The top three:
1. Sessions beyond two players may not be possible with the engine's layer (R12 answers this).
2. Steam App ID use may not be allowed for a public release (G1).
3. Not enough contributors with reverse-engineering skills (G2).

## 6. Definition of "ready to develop"
- All gates closed or deferred in writing.
- ADRs 0002 to 0005 accepted.
- Phase 2 contracts on the board, each with a definition of done.
- Project lead signs off in `ROADMAP.md`.
