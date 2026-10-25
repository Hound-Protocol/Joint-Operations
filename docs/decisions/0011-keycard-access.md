# 0011: Keycard access levels
Status: Accepted (design) · Date: 2026-10-22 · Deciders: project lead

## Context
The project lead wants access levels on the website like the keycards in Metal Gear Solid: contributors see contributor tools, administrators get tools to moderate content and people, and the owner has absolute authority. The website is a static site today, so anything it hides or shows in the browser alone can be bypassed. Real access needs a trusted identity and checks done somewhere users cannot change.

## Decision
### Seven keycard levels
| Card | Who | Can do |
|---|---|---|
| **LV0** | Banned | Nothing beyond the public site; refused at sign-in ([ADR 0019](0019-bans-across-accounts.md)) |
| **LV1** | Visitor | Read the public site |
| **LV2** | Member (signed in) | Profile, report content, follow sessions |
| **LV3** | Contractor | Claim contracts, upload mods for review |
| **LV4** | Quality | Review queue, approve or reject mods, triage bugs |
| **LV5** | Development | Edit contract and site data, manage sessions and the registry |
| **LV6** | Administration | Moderate people and content, edit pages, grant cards up to LV5 |
| **LV7** | Owner | Everything. Only LV7 grants LV6 or LV7, publishes releases, and holds the records signing key |

Levels add up: each card includes everything below it. Contractor grades (E to S++) are separate, sit inside LV3 and carry no authority ([ADR 0013](https://github.com/Hound-Protocol/hound-protocol-web/blob/main/docs/decisions/0013-chain-of-command.md)).

### Identity
- Contributors and staff sign in with **GitHub**. Players will sign in with **Steam** (OpenID) once sessions go live.
- The keycard is derived from **GitHub organization teams**: `owners` → LV7, `administration` → LV6, `development` → LV5, `quality` → LV4, `contractors` → LV3. Anyone signed in is at least LV2.

### Enforcement
- **Never in the browser alone.** The site only shows or hides tools. Every action is checked by GitHub (for repository changes, through the user's own GitHub permissions) or by our API server (for sessions, mods and moderation), which reads the user's teams on every request.
- Admin tools that change the repository work through pull requests. Owner-only actions require two-factor authentication.
- Every moderation action is logged: who, what, when, why. The log is visible to LV6 and LV7.

### Discord
Discord roles carry the same levels, so a member's card is visible everywhere:

| Card | Discord role |
|---|---|
| LV7 | `LV7 · Owner` |
| LV6 | `LV6 · Administration`, `LV6 · Moderator` |
| LV5 | `LV5 · Development`, `LV5 · Technical Lead` |
| LV4 | `LV4 · Quality` |
| LV3 | `LV3 · Contractor` |
| LV2 | `LV2 · Member` |

Until a bot keeps GitHub teams and Discord roles in sync, the Administration Department assigns roles by hand ([HP-SOP-007](../guides/HP-SOP-007-onboarding-offboarding.md)).

### When
- **Now:** the levels, Discord roles, GitHub team names and this record.
- **With the session registry (ADR 0008):** the API server, GitHub sign-in on the site, keycard-gated tools (review queue, moderation, mod uploads).
- **Later:** Steam sign-in for players, a Discord bot that syncs roles from GitHub teams.
- **Update 2026-10-23:** GitHub sign-in, keycard profiles and clearance-based documents arrived early, without the API server: restricted documents live in private repositories that GitHub itself protects ([ADR 0017](0017-hound-id-sign-in.md)). Keycard-gated *tools* (review queue, moderation, mod uploads) still wait for the API server.
- **Update 2026-10-23 (v0.0.26):** the Library shows every document's clearance; restricted areas are drawers that open at their level or show *Access denied*. A staff card raises clearance only after its signature verifies in the browser, and clearance files need the owner's review (CODEOWNERS).
- **Update 2026-10-23 (v0.0.27):** organization owners get LV7 straight from GitHub. **Guest passes** add a temporary LV3: the owner grants a link that lasts 24 hours.

## Consequences
- The website has a sign-in button and a keycard badge since v0.0.22 (ADR 0017). Everything public stays public, and nothing pretends to be protected: restricted documents are protected by GitHub, not by the page.
- GitHub organization teams become the source of truth for access. They must be kept tidy ([HP-SOP-007](../guides/HP-SOP-007-onboarding-offboarding.md)).
- The privacy notice covers sign-in data ([privacy](../privacy.md)).

## Alternatives considered
- **Password or code checked in the browser:** rejected, because anyone can read and bypass it.
- **A separate account system:** rejected for now. GitHub and Steam accounts already exist and already have two-factor authentication.
