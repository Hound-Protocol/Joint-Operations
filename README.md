# MGSV: Joint Operations

Status: Phase 0, foundation. Not playable yet.

MGSV: Joint Operations is a multiplayer mod for Metal Gear Solid V: The Phantom Pain (PC). It brings the game's online
functionality into the single-player world, so up to 16 players share the open world and its missions.
Venom Snake hosts; the other players join as soldiers from the Mother Base roster.

It is a multiplayer mod, not a co-op add-on: the goal is a full multiplayer layer for the single-player game.

- Platforms: Windows, Linux via Proton
- Transport: GameNetworkingSockets, Steam relay primary, direct IP fallback
- Requirement: your own legal copy of MGSV. This project does not distribute the game.

## Team
Developed by Hound Protocol, a community development team.

## Independent project
Joint Operations is built independently and does not copy code from other mods. See docs/legal.md.

## Website
The project site lives in `site/` and is deployed to GitHub Pages by `.github/workflows/pages.yml`.
It reads releases and contract issues live from this repository, and mods, sessions and the docs library from `site/data/`.

## Docs
Start with **docs/pre-development.md**: the plan, the gates before development, and the decisions still open.

- docs/decisions/: decision records (scope, strategy, transport, loader, license, online services, host authority)
- research/: desk research with sources (engine, modding tools, Steam, Proton, law, funding, prior art)
- docs/development-process.md: how work flows from issue to release
- docs/governance.md: seats, terms and decision making
- docs/risk-register.md: known risks and mitigations
- docs/glossary.md: terms used in the project
- docs/github-setup.md: one-time repository and organization settings
- CODE_OF_CONDUCT.md, SECURITY.md
- CONTRIBUTING.md: how to take a contract and submit work
- docs/team.md: roles
- docs/legal.md: license, clean-room rules, Steam App ID gate
- docs/architecture.md: components and decisions
- docs/discord.md: Discord blueprint
- docs/recruiting.md: recruiting posts
- docs/phase1-research-plan.md: Phase 1 research plan
- docs/privacy.md: what the website stores and which services it contacts
- ROADMAP.md: phases and status

## License
See LICENSE. Forks are welcome. Attribution is required, and no one may present this work as their own.

## Disclaimer
MGSV: Joint Operations is an unofficial, fan-made community project. It is not affiliated with,
endorsed by, or sponsored by Konami. Metal Gear Solid and related names are trademarks of their owners.
