# Administration Handbook
Code: HP-GDE-006 · Version 1.3 · Effective 2026-10-23 · Owner: Administration · For: Administration Department and seat holders

## What Administration owns
Direction and decisions, seats and access, legal stance and funding, the community and moderation, and recruiting. See [governance.md](https://github.com/Hound-Protocol/hound-protocol-web/blob/main/docs/governance.md) and [departments.md](https://github.com/Hound-Protocol/hound-protocol-web/blob/main/docs/departments.md).

## Accounts and settings
| Where | Must be on |
|---|---|
| GitHub organization | **Require two-factor authentication** for all members; two owners; teams `owners`, `administration`, `development`, `quality`, `contractors` matching the keycards ([ADR 0011](../decisions/0011-keycard-access.md)) |
| Repository | Ruleset on `main` (no deletion, no force push, pull requests, required checks); squash merge; auto-merge; delete branches after merge; secret scanning and push protection; Dependabot alerts and security updates; private vulnerability reporting; CodeQL |
| GitHub Pages | Source: GitHub Actions |
| Discord | See [HP-SOP-008](HP-SOP-008-discord-administration.md); server widget on; release webhook stored as the `DISCORD_RELEASE_WEBHOOK` repository secret |
| Backups | Weekly on the owner's computer plus encrypted Google Drive ([HP-SOP-009](HP-SOP-009-backup-and-restore.md)) |
| Sign-in | GitHub App **Hound ID Sign-in** (Contents: read-only, installed only on `hp-staff`, `hp-leads`, `hp-admin`); relay on Cloudflare Workers with the client secret as an encrypted variable ([signin.md](../signin.md)) |
| Restricted documents | Private repositories `hp-staff` (teams LV3 and up), `hp-leads` (LV5 and up), `hp-admin` (LV6 and up). Team membership is what opens them |

The full checklist is in [github-setup.md](../github-setup.md).

## Regular duties
| When | Task |
|---|---|
| Each merged contract | Issue the signed record and grade role ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)) |
| Each new staff member | Issue their Hound ID and keycard role, and add them to the GitHub team for their level ([HP-SOP-007](HP-SOP-007-onboarding-offboarding.md)) |
| Weekly | Read #admin-board and #mod-log; post a short dev-log update. Seats stay with the project lead until there is a playable prototype |
| Each release | Second signer; announcement ([HP-SOP-003](HP-SOP-003-release.md)) |
| Monthly | Review access: who has what (GitHub teams, the three private repositories, Discord roles), remove what is unused. Check the backup log and Drive copy |
| Every 6 months | Rotate the sign-in app's client secret ([signin.md](../signin.md)) |
| Every phase gate | Review the [risk register](../risk-register.md) and the roadmap |

## Decisions
- Day-to-day: lazy consensus in pull requests (72 hours).
- Lasting decisions: a decision record in `docs/decisions/`, **Proposed** until the project lead accepts it.
- Record accepted decisions in the [Dev Log](../devlog.md).

## Funding (from 0.1)
Donations open at 0.1 through a fiscal host ([ADR 0010](../decisions/0010-funding.md)). Every expense is published. Money never buys influence.

## Incidents
Leaked secret or security problem: [HP-SOP-006](HP-SOP-006-security-incident.md). Community problem: [HP-POL-005](HP-POL-005-community-moderation.md).
