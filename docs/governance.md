# Governance

Status: Accepted · Date: 2026-10-22 · Updated: 2026-10-23 (seats after the playable prototype)

Hound Protocol works as a contract network: contributors come and go, and the project must not depend on any one person. It runs on **a solid hierarchy, open communication and transparency**.

## Chain of command
Authority comes in three kinds and only flows down the keycard levels, within its kind ([HP-POL-007](guides/HP-POL-007-chain-of-command.md), [ADR 0013](decisions/0013-chain-of-command.md)).

| Role | Social | Technical | Organizational |
|---|---|---|---|
| Owner (LV7) | Final say | Final say | Final say |
| Administration (LV6) | Yes | Yes | Yes, up to LV5 |
| Moderator (LV6) | Yes | No | No |
| Development (LV5) | No | Yes | No |
| Quality (LV4), Contractor (LV3), Member (LV2) | No | No | No |

Anyone can talk to anyone, in public by default. Decisions are written down with who made them and why.

## Decision making
- Day-to-day decisions are made in pull requests and issues, by whoever holds that kind of authority.
- Disagreements and appeals go one level up within the same kind of authority. The project lead has the final say.
- Decisions with lasting effect are recorded in `docs/decisions/`.

## Seats
Some duties cannot be fluid. They are held as **seats**: a role with a written checklist, a term, and at least two holders.

| Seat | Duties | Holders needed |
|---|---|---|
| Project lead | Final decisions, legal stance, funding | 1, with a named deputy |
| GitHub organization owner | Account control, repository settings | 2 |
| Discord admin | Server control, moderation escalation | 2 |
| Release signer | Approves and publishes releases | 2 |
| Technical lead | Technical direction, architecture and merge approval (Development) | 1 or more |
| Moderator | Community safety | 2 or more |

- **When:** seats other than the project lead are filled once there is a playable prototype (project lead, 2026-10-23). Until then the project lead holds them, and the Team page shows them as "After prototype".
- Terms run 3 to 6 months, then renew or rotate.
- Handoffs are done the same day: access removed and granted together.
- Shared credentials live in a password manager, never in chat.

## AI agents
AI agents such as Claude work as **contractors' tools**: work is credited to the person who did it, with the agent named ("TrueMan, with Claude"), and detected automatically from commit trailers ([ADR 0015](decisions/0015-ai-agents-and-attribution.md)). Agents hold no seats, accounts or authority. The **technical lead** is a person; the seat opens with the playable prototype.

## Departments
The project has four departments: Administration, Development, Quality and Contractor ([departments.md](departments.md), [ADR 0009](decisions/0009-departments-and-ranks.md)). Seats belong to Administration, except the technical lead (Development) and release signers (Quality).

## Contractor grades
Contractors are graded E to S++ in each field, like Mother Base staff in each unit ([departments.md](departments.md)). Grades unlock review rights and department invitations, never authority over people. Seat holders and department members are chosen from experienced contractors (S+ and up) or appointed by the project lead.

## Money
No donations before 0.1 ([ADR 0010](decisions/0010-funding.md)). After that, funds go through a fiscal host, every expense is published, and money never buys influence over decisions.
