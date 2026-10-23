# Banning an Account (LV0)
Code: HP-SOP-012 · Version 1.0 · Effective 2026-10-23 · Owner: Administration · Used by: Administration (LV6) and the owner

A ban (**LV0**) removes a person from Hound Protocol: no sign-in, no contracts, no Discord, and no sessions. It is the last step after the [Accountability Policy](HP-POL-009-accountability.md) and [Community Moderation](HP-POL-005-community-moderation.md), or the first step for serious harm (harassment, threats, piracy, cheating in other people's games, attacks on the project). The decision is recorded in [ADR 0019](../decisions/0019-bans-across-accounts.md).

## The rules
- **GitHub is the root identity.** Anything above LV1 (reading the public site) needs a GitHub sign-in. The GitHub **account number** is what we ban: it survives renames.
- **Sessions need Steam.** Once sessions are live, joining one needs a Steam sign-in, linked to the person's GitHub account. A new Steam account means buying MGSV again.
- **One ban covers every linked account.** Banning a GitHub account bans the Discord and Steam accounts linked to it, and the other way round.
- **We do not ban IP addresses or fingerprint devices.** A VPN gets around them in seconds, and they are personal data we do not keep ([privacy](../privacy.md)).
- **Who bans:** Administration (LV6) and the owner. The owner cannot be banned.
- **Appeals are always open,** through [HP-SOP-011](HP-SOP-011-infractions-and-appeals.md). A lifted ban is removed everywhere in the same order.

## Before you ban
1. Write down what happened, with links, in the private `hp-admin` repository (`bans/` folder): date, who decided, reason, and every linked account (GitHub number, Discord user ID, Steam ID when there is one).
2. Find the GitHub account number: `https://api.github.com/users/<name>` → `id`.
3. If the account is younger than 30 days and tied to an earlier ban, note the link: it is the same person.

## Ban, in this order
1. **Sign-in relay:** Cloudflare → hp-signin → Settings → Variables and Secrets → `BANNED_GITHUB_IDS` (Secret). Add the number, separated by commas. Deploy. From now on that account is refused at sign-in and sees *Access revoked · LV0*.
2. **GitHub:** Hound-Protocol → Settings → **Moderation → Blocked users** → block the account. It can no longer comment, open issues or pull requests anywhere in the organization. Remove it from every team.
3. **Discord:** ban the linked Discord user ID (Server Settings → Bans, or right-click → Ban), with the reason.
4. **Staff card:** if the person holds a Hound ID, revoke it: `python3 tools/records.py staff-revoke --id HND-NNNN --reason "Banned (HP-SOP-012)"`.
5. **Guest passes:** if the person holds one, revoke it on your Profile (owner only).
6. **Steam (once sessions are live):** add the linked Steam ID to the session registry's ban list; hosts refuse it.

## New accounts
- GitHub and Discord accounts younger than **30 days** get no role above LV2 without a check by Administration. Most "just make a new account" attempts end here.
- If a new account is clearly the banned person, ban it the same way and link it in the record.

## Lifting a ban
Reverse the steps above in the same order, record the decision and the reason in `hp-admin`, and tell the person.
