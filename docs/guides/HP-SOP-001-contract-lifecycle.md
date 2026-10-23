# Contract Lifecycle
Code: HP-SOP-001 · Version 1.1 · Effective 2026-10-23 · Owner: Development · Used by: Development, Quality, contractors

## Purpose
How a piece of work goes from an idea to a signed contributor record.

## Stages
| # | Stage | Who | Done when |
|---|---|---|---|
| 1 | **Draft** | Development | Entry in `site/data/contracts.json` with goal, deliverable, acceptance criteria, and difficulty |
| 2 | **Publish** | Development | Issue created with `tools/publish_contracts.py`, labels `contract`, `module:*`, `difficulty:easy|medium|hard`, and `core` where it applies |
| 3 | **Claim** | Contractor | Comment `/claim`. The Contract claims workflow assigns them at once, and the website shows their token on the card. Several people can claim one contract (up to 10) |
| 4 | **Deliver** | Contractor | Pull request with `Closes #<issue>`, template filled in |
| 5 | **Review** | Quality | Every acceptance criterion checked, CI green ([HP-SOP-002](HP-SOP-002-pull-request-review.md)) |
| 6 | **Merge** | Quality | Pull request merged, issue closes |
| 7 | **Record** | Administration | Signed record issued ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)) |

## Writing a good contract
- One clear outcome. If it has two, split it.
- Acceptance criteria a stranger can check without asking you.
- Difficulty by the skill it needs: Easy (clear steps, small scope), Medium (some research or a test rig), Hard (unknown ground, deep skills). Mark **Core** for anything on the 0.1 critical path.
- List dependencies, and background links to research and decisions.

## Claiming
- `/claim` to join a contract, `/unclaim` to leave it. Several people can work on one contract together. Agree who does what on the issue.
- One open contract per person, two from grade B upward ([departments.md](../departments.md)). Difficulty never limits who can take a contract.
- If there is no progress update for 14 days, a maintainer asks. After 7 more days without an answer, the contract is unassigned.

## Handoff when leaving
Post on the issue:
```
Handoff: what is done / what is not / where the work is (branch link) / anything surprising
```
Then a maintainer unassigns the contract. Partial work can still be credited when someone finishes it, by agreement.

## Changing a contract
Changes to acceptance criteria after a claim need the contractor's agreement, recorded on the issue.
