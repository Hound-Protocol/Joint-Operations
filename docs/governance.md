# Governance

Status: DRAFT · Date: 2026-10-21

Hound Protocol works as a contract network: contributors come and go, and the project must not depend on any one person.

## Decision making
- Day-to-day decisions are made in pull requests and issues. If nobody objects within 72 hours, the change can proceed (lazy consensus).
- Disagreements go to the module's owner, then to the project lead, who has the final say.
- Decisions with lasting effect are recorded in `docs/decisions/`.

## Seats
Some duties cannot be fluid. They are held as **seats**: a role with a written checklist, a term, and at least two holders.

| Seat | Duties | Holders needed |
|---|---|---|
| Project lead | Final decisions, legal stance, funding | 1, with a named deputy |
| GitHub organization owner | Account control, repository settings | 2 |
| Discord admin | Server control, moderation escalation | 2 |
| Release signer | Approves and publishes releases | 2 |
| Technical lead delegate | Human approval of architecture and merges | 1 or more |
| Moderator | Community safety | 2 or more |

- Terms run 3 to 6 months, then renew or rotate.
- Handoffs are done the same day: access removed and granted together.
- Shared credentials live in a password manager, never in chat.

## The technical lead role
Claude, an AI assistant, acts as technical lead for architecture, code and documentation. Claude cannot own accounts, sign releases or carry accountability, so a human **technical lead delegate** approves its work, and seat holders control all access.

## Contributors and ranks
Contributors earn ranks through completed contracts, as described in [CONTRIBUTING.md](../CONTRIBUTING.md). Ranks unlock larger contracts and review rights. Seat holders are chosen from experienced contributors.

## Money
No donations before 0.1. After that, funds go through a fiscal host, every expense is published, and money never buys influence over decisions.
