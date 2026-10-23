# Chain of Command and Open Communication
Code: HP-POL-007 · Version 1.1 · Effective 2026-10-23 · Owner: Administration · Applies to: everyone in Hound Protocol, on GitHub, Discord and the website

Hound Protocol runs on three principles: **a solid hierarchy**, **open communication** and **transparency**. Everyone knows who decides what, anyone can talk to anyone, and decisions are made where people can see them. The decision is recorded in [ADR 0013](../decisions/0013-chain-of-command.md).

## 1. Three kinds of authority
Authority means the right to make a decision that others must follow. There are three kinds, and each role has only the kinds listed for it.

| Kind | Covers |
|---|---|
| **Social** | Conduct, the Code of Conduct, moderation, community spaces, disputes between people |
| **Technical** | Architecture, code, merges, contract scope and acceptance criteria, tools, releases |
| **Organizational** | Roles, keycards, seats, departments, recruiting, funding, legal stance |

## 2. Who holds which authority
| Role | Keycard | Social | Technical | Organizational |
|---|---|---|---|---|
| **Owner** (project lead) | LV7 | Final say | Final say | Final say |
| **Administration** | LV6 | Yes | Yes | Yes, up to LV5 |
| **Moderator** | LV6 | Yes | No | No |
| **Development** (technical lead, core developers) | LV5 | No | Yes | No |
| **Quality** | LV4 | No | No | No |
| **Contractor** | LV3 | No | No | No |
| **Member** | LV2 | No | No | No |

Rules:
1. **Authority only flows down.** A role can decide over people with a lower keycard, and only in its own kinds of authority. Development cannot moderate; moderators cannot decide on code.
2. **Quality, contractors and members have no authority over anyone.** Quality's job is to check work against its acceptance criteria and to test it. A failed check stops that delivery or release until it is fixed, which is a quality gate, not authority over people. Development decides how to fix it.
3. **AI agents have no authority.** An agent is a tool of the person using it, listed under Contractors, and its work is credited to that person ([ADR 0015](../decisions/0015-ai-agents-and-attribution.md)).
4. **Contractor grades give no authority.** A grade (E to S++) shows experience. Reviews by graded contractors are advice to Quality and Development.
5. **The owner has the final say** in every kind of authority, and is the last step of every appeal.
6. **Nobody decides their own case.** A person with authority hands a dispute they are part of to someone else with the same authority, or one level up.

## 3. Open communication
- **Anyone can talk to anyone**, at any level, about anything. You do not need permission to raise a concern with the owner.
- **Talk in the open by default.** Questions, proposals and disagreements go in public issues, pull requests or public channels, so others can learn and join in.
- **Private when it should be.** Security reports, personal matters, and moderation of a specific person are handled privately ([HP-POL-004](HP-POL-004-security-policy.md), [HP-POL-005](HP-POL-005-community-moderation.md)).
- **Disagree openly, then commit.** Say what you think before a decision. Once it is made, follow it, and raise it again through an appeal if you still think it is wrong.

## 4. Transparency
- **Decisions are written down where people can read them.** Technical and organizational decisions with lasting effect go into an ADR in `docs/decisions/`. Day-to-day decisions are made in issues and pull requests.
- **Every decision says who made it and why.** "Because I said so" is not a reason.
- **Moderation is logged.** Every warning, timeout and ban is logged with who, what and why ([HP-POL-005](HP-POL-005-community-moderation.md)). LV6 and LV7 see the full log; a monthly summary without names is posted publicly.
- **Roles are public.** The Team page shows the hierarchy, who holds which role, which seats are open and which wait for the playable prototype.
- **Money is public** once donations open ([ADR 0010](../decisions/0010-funding.md)).

## 5. Appeals
The same applies to infractions and suspensions under [HP-POL-009](HP-POL-009-accountability.md), which hold role holders and leads to account the same way as contributors.

1. Ask the person who decided to explain the decision, in public where possible.
2. If you still disagree, appeal one level up in the same kind of authority: a moderator's decision goes to Administration, Development's to the technical lead, then to Administration.
3. The owner's decision is final.
Appeals are never held against the person who makes them.

## 6. Where this is enforced
| Place | How |
|---|---|
| GitHub | Branch protection and CODEOWNERS: merges need approval from Development (technical authority). Organization roles are managed by Administration. |
| Discord | Moderation permissions only for LV6 roles. Department channels are managed by their department. Contractor and Quality roles have no moderation or management permissions. |
| Website | The Team page shows this hierarchy from `site/data/team.json` (`hierarchy`). Keycard-gated tools follow [ADR 0011](../decisions/0011-keycard-access.md). |
