# Roadmap

Status: DRAFT

## Phase 0: Foundation (current)
- [ ] Repo created (private until legal gate is cleared)
- [ ] docs: team, legal, architecture written and reviewed
- [ ] Steam App ID and rights question opened as BLOCKING (legal.md)
- [ ] Donation and hosting policy decided (legal.md)
- [ ] Proton test environment defined
- [ ] Discord structure set up (see docs/discord.md)
- [ ] Recruiting post reviewed (see docs/recruiting.md)

## Phase 1: Research (see docs/phase1-research-plan.md)
- [ ] Summarize networking playbook into research/ in our own words
- [ ] Document how MGSV launches and how a second player can be introduced
- [ ] Identify game state that must be synced
- [ ] Decide Steam API: Networking Messages vs Networking Sockets
- [ ] Set up mock Steam DLL and bad-network test profiles (clumsy, tc netem)

## Phase 2: 0.1 (2 players)
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
