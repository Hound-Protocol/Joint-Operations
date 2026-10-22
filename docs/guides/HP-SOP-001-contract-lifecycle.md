# Contract Lifecycle
Code: HP-SOP-001 · Version 1.0 · Effective 2026-10-22 · Owner: Development · Used by: Development, Quality, contractors

## Purpose
How a piece of work goes from an idea to a signed contributor record.

## Stages
| # | Stage | Who | Done when |
|---|---|---|---|
| 1 | **Draft** | Development | Entry in `site/data/contracts.json` with goal, deliverable, acceptance criteria, difficulty and effort |
| 2 | **Publish** | Development | Issue created with `tools/publish_contracts.py`, labels `contract`, `module:*`, `difficulty:*` |
| 3 | **Claim** | Contractor | Comment "I'll take this". A maintainer checks the rank against the difficulty and assigns |
| 4 | **Deliver** | Contractor | Pull request with `Closes #<issue>`, template filled in |
| 5 | **Review** | Quality | Every acceptance criterion checked, CI green ([HP-SOP-002](HP-SOP-002-pull-request-review.md)) |
| 6 | **Merge** | Quality | Pull request merged, issue closes |
| 7 | **Record** | Administration | Signed record issued ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)) |

## Writing a good contract
- One clear outcome. If it has two, split it.
- Acceptance criteria a stranger can check without asking you.
- Difficulty by the skill it needs, effort by the time it takes. Core for anything on the 0.1 critical path.
- List dependencies, and background links to research and decisions.

## Claiming
- One open contract per person below rank S. Two from S upward.
- If there is no progress update for 14 days, a maintainer asks. After 7 more days without an answer, the contract is unassigned.

## Handoff when leaving
Post on the issue:
```
Handoff: what is done / what is not / where the work is (branch link) / anything surprising
```
Then a maintainer unassigns the contract. Partial work can still be credited when someone finishes it, by agreement.

## Changing a contract
Changes to acceptance criteria after a claim need the contractor's agreement, recorded on the issue.
