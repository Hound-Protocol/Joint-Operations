# 0019: Bans across linked accounts (LV0)
Status: Accepted · Date: 2026-10-23 · Deciders: project lead

## Context
Hound Protocol needs a way to keep a person out who must not take part any more, even if they rename accounts, use a VPN or make new accounts. A static website cannot enforce anything by itself, and IP or device bans are both easy to get around and personal data under EU law.

## Decision
1. **GitHub is the root identity.** Everything above LV1 needs a GitHub sign-in. Bans use the GitHub **account number**, which survives renames.
2. **Sessions need Steam** (with the session browser, ADR 0008). The Steam account is linked to the GitHub account. A Steam ban is expensive to dodge: a new account must buy the game again.
3. **One ban covers every linked account:** GitHub, Discord and Steam. The signed roster and the private ban record in `hp-admin` hold the links.
4. **Enforced where it cannot be bypassed:** the sign-in relay refuses banned GitHub accounts before they get a token; GitHub's organization block stops comments, issues and pull requests; Discord bans the linked user; the session registry and hosts refuse banned Steam IDs.
5. **No IP bans and no device fingerprinting.**
6. **New-account gate:** accounts younger than 30 days get nothing above LV2 without a check by Administration.
7. **The ban list is private.** The public roster lists only members in good standing. Administration (LV6) and the owner may ban; appeals stay open through HP-SOP-011.

The procedure is [HP-SOP-012](../guides/HP-SOP-012-bans.md).

## Consequences
- The relay holds the banned GitHub numbers as a secret setting (`BANNED_GITHUB_IDS`).
- Linking Discord and Steam to GitHub becomes part of the Hound ID (signed roster), so a ban reaches all three.
- A determined person can still make a new GitHub account; the 30-day gate, Administration's checks and the Steam purchase make it slow and costly.

## Alternatives considered
- **IP bans:** rejected. Trivial to bypass with a VPN, they hit innocent people on shared networks, and they are personal data.
- **Device fingerprinting:** rejected. Invasive, needs consent, and is bypassed by another browser.
- **A public ban list:** rejected for now. It names people; a private record with appeals is fairer.
