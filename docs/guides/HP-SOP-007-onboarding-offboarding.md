# Onboarding and Offboarding
Code: HP-SOP-007 · Version 1.1 · Effective 2026-10-23 · Owner: Administration · Used by: Administration

## Onboarding a department member
1. Confirm they have read [HP-POL-001](HP-POL-001-contributor-policy.md), [HP-POL-002](HP-POL-002-ai-use-policy.md) and [HP-POL-004](HP-POL-004-security-policy.md).
2. Confirm 2FA on GitHub and Discord.
3. Discord: give the keycard role for their department (LV4 to LV6) and their unit role ([discord.md](../discord.md)). GitHub: add them to the matching team ([ADR 0011](../decisions/0011-keycard-access.md)).
4. GitHub: add to the organization team for their department, with the lowest access that works. The team decides which restricted document repositories they can read after signing in (`hp-staff` LV3 and up, `hp-leads` LV5 and up, `hp-admin` LV6 and up; [signin.md](../signin.md)).
5. Issue their **Hound ID**: `python3 tools/records.py staff-add --login <github-user> --card LV4 --department Quality` (with `--discord-id` if they share it, and `--ssh-key SHA256:…` to pin their signing key), and open a pull request. Their card then shows on the Verify page and on their Profile when they sign in ([contributor-records.md](../contributor-records.md)).
6. Add them to `site/data/team.json` and [team.md](../team.md) if they agree to be listed.
7. Point them to the guide for their department: [HP-GDE-003](HP-GDE-003-contributor-quick-start.md) (Development, contractors), [HP-GDE-004](HP-GDE-004-quality-testing.md) (Quality), [HP-GDE-006](HP-GDE-006-admin-handbook.md) (Administration).

## Onboarding a contractor
No access is needed to start. After their first completed contract: **LV3 · Contractor** and the grade role for their overall grade (usually **Rank E**) ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)).

## Offboarding (same day)
- [ ] Revoke their Hound ID: `python3 tools/records.py staff-revoke --id HND-NNNN --reason "..."`
- [ ] Remove Discord keycard roles (keep LV2 · Member and their grade role)
- [ ] Remove from GitHub teams and seats (this also closes the restricted document areas); transfer anything they owned
- [ ] Rotate any shared secret they could see
- [ ] Unassign open contracts after a handoff note
- [ ] Update `team.json`, [team.md](../team.md) and the seat list
- [ ] Thank them. People come back.

## Seats
Seats are filled once there is a playable prototype ([governance.md](../governance.md)). Until then the project lead holds them.

### Seat handoff
Old and new holder are both present. Access is granted to the new holder and removed from the old one in the same session ([governance.md](../governance.md)).
