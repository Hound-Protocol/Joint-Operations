# Accountability and Infractions Policy
Code: HP-POL-009 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Applies to: every contributor and every role holder, leads included

## 1. Purpose
Joint Operations is a passion project, not a boot camp. There are **no deadlines and no time limits**: nobody is ever penalized for being slow, taking a break or leaving a contract. What we do ask is **care**: check your work before it reaches others, and do your role properly. This policy is how we hold everyone to that, the same way at every level ([ADR 0016](../decisions/0016-accountability.md)).

## 2. Two tracks
| Track | Who | About |
|---|---|---|
| **Contributor** | Anyone who delivers work: code, docs, research, art | The quality of what you deliver |
| **Duty** | Role holders: technical lead, seat holders, reviewers, Quality, moderators, Administration | How you carry out your role |

A role holder who also contributes has both tracks, counted separately.

## 3. What is an infraction
**Contributor track**
1. Work that breaks `main` or a release because the required checks were **skipped, bypassed or ignored**.
2. Claiming testing that was not done, for example ticking "tested in-game" in the pull request when you did not.
3. Repeating the same careless mistake after a written note about it.
4. Bypassing review or branch protection.
5. Carelessly breaking a hard rule: game files, copied mod code, generative AI art, secrets in the repository. (Deliberate breaches go straight to the [Contributor Policy](HP-POL-001-contributor-policy.md).)

**Duty track**
1. Approving or merging work without the required checks or review.
2. Releasing without Quality's sign-off ([HP-POL-006](HP-POL-006-quality-policy.md)).
3. Using authority you do not hold, or deciding your own case ([HP-POL-007](HP-POL-007-chain-of-command.md)).
4. Not logging moderation or decisions that must be logged.
5. Skipping a step of a procedure in a way that caused harm, or repeating it after a written note.

**Never an infraction:** honest bugs that passed the checks, slow work, unfinished or abandoned contracts, inactivity, asking questions, disagreeing, or making a first small mistake (that gets a friendly **note**, not an infraction).

## 4. The ladder
| Step | What happens |
|---|---|
| **Note** | A friendly written note on the pull request or issue. Not counted. |
| **Infraction 1** | Written record with the reason and evidence. You are told where and why. |
| **Infraction 2** | Same, and your next deliveries (or decisions) get a second reviewer until it clears. |
| **Infraction 3** | **Suspension.** Contributors cannot claim contracts or have work merged. Role holders step down from their role and its keycard returns to their contributor level. You are invited to appeal. |

- **Clearing:** five clean deliveries (contributor track) or five clean duties (duty track) clear your oldest active infraction. No waiting period, ever.
- **Suspension** only ends through an appeal (section 6).

## 5. Who issues them
Infractions follow the chain of command ([HP-POL-007](HP-POL-007-chain-of-command.md)): only someone with authority of that kind, at a higher level, may issue one.
| Infraction for | Issued by |
|---|---|
| Contributors (technical) | Development or Administration |
| Contributors (conduct) | Moderators or Administration, under [HP-POL-005](HP-POL-005-community-moderation.md) |
| Quality, reviewers, moderators, Development, the technical lead | Administration |
| Administration | The owner |
| The owner | Nobody can suspend the owner. Duty concerns about the owner are recorded publicly, and the owner answers them in public. |

Quality reports problems with evidence but does not issue infractions.

## 6. Appeals
- You can appeal **any** infraction or suspension, at any time, with no deadline.
- Open an issue with the **Appeal** template, or message Administration privately.
- The appeal is decided one level above the person who issued it, by someone not involved. The owner is final.
- Outcomes: **overturned** (removed, and any suspension that depended on it is lifted), **reinstated** (suspension lifted with a clean slate), or **upheld** (you can appeal again with new information).
- Appealing is never held against you.

## 7. Transparency
- Every infraction has a written reason, an evidence link and the issuer's name. The record (`data/infractions.json`) is changed only through pull requests, so its history is public.
- It records facts about the work, never personal judgments.
- Overturned infractions are marked as overturned and never count.

## 8. Enforcement
- **Contributor standing** check: pull requests by a suspended contributor fail the check and cannot be merged.
- Claims: a suspended contributor's `/claim` is refused with a link to the appeal process.
- **Broken main** incidents: when the checks fail on `main`, an issue opens automatically. That alone is not an infraction; a person reviews it (HP-SOP-011).
- Keeping the record: `tools/infractions.py`, following [HP-SOP-011](HP-SOP-011-infractions-and-appeals.md).
