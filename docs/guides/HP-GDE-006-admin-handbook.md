# Administration Handbook
Code: HP-GDE-006 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · For: Administration Department and seat holders

## What Administration owns
Direction and decisions, seats and access, legal stance and funding, the community and moderation, and recruiting. See [governance.md](../governance.md) and [departments.md](../departments.md).

## Accounts and settings
| Where | Must be on |
|---|---|
| GitHub organization | 2FA required for members; two owners |
| Repository | Ruleset on `main` (no deletion, no force push, pull requests, required checks); squash merge; auto-merge; delete branches after merge; secret scanning and push protection; Dependabot alerts and security updates; private vulnerability reporting; CodeQL |
| GitHub Pages | Source: GitHub Actions |
| Discord | See [HP-SOP-008](HP-SOP-008-discord-administration.md) |

The full checklist is in [github-setup.md](../github-setup.md).

## Regular duties
| When | Task |
|---|---|
| Each merged contract | Issue the signed record and rank role ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)) |
| Weekly | Read #admin-board and #mod-log; check open seats; post a short dev-log update |
| Each release | Second signer; announcement ([HP-SOP-003](HP-SOP-003-release.md)) |
| Monthly | Review access: who has what, remove what is unused |
| Every phase gate | Review the [risk register](../risk-register.md) and the roadmap |

## Decisions
- Day-to-day: lazy consensus in pull requests (72 hours).
- Lasting decisions: a decision record in `docs/decisions/`, **Proposed** until the project lead accepts it.
- Record accepted decisions on the website's Dev Log.

## Funding (from 0.1)
Donations open at 0.1 through a fiscal host ([ADR 0010](../decisions/0010-funding.md)). Every expense is published. Money never buys influence.

## Incidents
Leaked secret or security problem: [HP-SOP-006](HP-SOP-006-security-incident.md). Community problem: [HP-POL-005](HP-POL-005-community-moderation.md).
