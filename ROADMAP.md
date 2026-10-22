# Roadmap

Status: DRAFT

## Phase 0: Foundation (current)
Gates and sequence are in docs/pre-development.md.
- [x] Repository created (public) and website built
- [x] Core docs written: team, legal, architecture, governance, process, decisions, research
- [x] CI checks for pull requests
- [x] Website live on GitHub Pages, main branch protected
- [x] Docs reviewed and pull request #1 merged
- [ ] License chosen (ADR 0005)
- [ ] Steam App ID position recorded (legal.md)
- [x] Donation policy decided: donations open at 0.1 (ADR 0010)
- [x] Departments and contractor ranks set up (ADR 0009)
- [ ] Critical seats filled, human technical delegate appointed (governance.md)
- [ ] Proton test environment defined
- [x] Discord structure set up (see docs/discord.md)
- [ ] Recruiting post reviewed (see docs/recruiting.md)

## Phase 1: Research (see docs/phase1-research-plan.md)
- [x] Summarize networking playbook into research/ in our own words
- [x] Desk research: Steam interfaces (R13), file formats and tools, Proton on Bazzite
- [x] Contract specs with acceptance criteria for all Phase 1 work (docs/contracts.md)
- [ ] Engine session spike: 3 or more players in one session (R12)
- [ ] Steam interfaces reachable from the game process (R13)
- [ ] Document how MGSV launches and how a second player can be introduced
- [ ] Identify game state that must be synced
- [ ] Decide Steam API: Networking Messages vs Networking Sockets
- [ ] Set up mock Steam DLL and bad-network test profiles (clumsy, tc netem)

## Phase 2: 0.1 (2 players)
- [ ] Integration strategy decided (ADR 0002)
- [ ] Two-player session on Windows
- [ ] Same session under Proton on Linux
- [ ] Basic host-to-client state sync
- [ ] Direct IP path working
- [ ] GATE: Steam App ID and rights resolved before any player-facing build

## Phase 3: Scale to 16
- [ ] 4, 8, then 16 players with stable sync
- [ ] Priority and interest management
- [ ] Performance measured on modest hardware

## Phase 4: Experience and ecosystem
- [ ] Seamless join and leave with transitions
- [ ] Mod API
- [ ] Lobby and browser app
- [ ] Web application and docs site

## Rule
No phase starts until the previous checklist is complete or explicitly deferred by the project lead.
