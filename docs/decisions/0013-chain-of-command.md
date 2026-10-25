# 0013: Chain of command, open communication and transparency
Status: Accepted · Date: 2026-10-22 · Deciders: project lead

## Context
Departments and keycards (ADR 0009, ADR 0011) said who belongs where, but not who may decide what over whom. The project lead wants a solid hierarchy with open communication and transparency, where Quality and contributors have no authority over others, moderators and administrators decide social matters, and Development and Administration decide technical matters for lower levels.

## Decision
1. Authority comes in three kinds: **social**, **technical** and **organizational**.
2. Holders: Owner (LV7) all three, final say. Administration (LV6) all three, organizational up to LV5. Moderators (LV6) social only. Development (LV5) technical only. Quality (LV4), Contractors (LV3) and Members (LV2) none.
3. Authority only flows down the keycard levels, and only within its kind.
4. Quality's checks and release sign-off are quality gates on work, not authority over people.
5. Contractor grades (E to S++, [departments.md](../departments.md)) carry no authority.
6. Open communication: anyone may talk to anyone, in public by default. Transparency: decisions are recorded with who and why, moderation is logged, roles are public.
7. Appeals go one level up within the same kind of authority. The owner is final.

The full rules are in [HP-POL-007](../guides/HP-POL-007-chain-of-command.md).

## Consequences
- The Team page shows the hierarchy as a tree, generated from `joint-operations-web/site/data/team.json` (`hierarchy`).
- Discord moderation permissions stay with LV6 roles only. Department roles manage only their own channels.
- CODEOWNERS and branch protection put merge approval with Development as the department fills. Until then, the owner approves.
- HP-POL-005 (moderation) and HP-SOP-002 (pull request review) follow this policy.

## Alternatives considered
- **Flat structure with lazy consensus for everything:** rejected. It hides who is accountable and stalls when people disagree.
- **Ranks that grant authority:** rejected. Authority would follow output instead of responsibility, and the best contractors would end up moderating instead of building.
