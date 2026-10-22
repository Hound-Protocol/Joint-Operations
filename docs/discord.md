# Discord Blueprint

Status: DRAFT. Server name: MGSV: Joint Operations | Hound Protocol

## Automated setup
The server can be built automatically from `tools/discord/blueprint.json` (roles, categories, channels, permissions and starter messages).

1. Create an empty server. Turn on **Developer Mode** (User Settings → Advanced), right-click the server icon and **Copy Server ID**.
2. In the Discord Developer Portal, create an application, open **Bot**, and **Reset Token**. Keep the token private.
3. **OAuth2 → URL Generator:** scope `bot`, permission **Administrator** (temporary). Open the generated link and add the bot to the server.
4. Run, with Python 3.8 or newer:
   - Windows (PowerShell): `$env:DISCORD_BOT_TOKEN="<token>"; python tools/discord/setup.py <server id>`
   - Linux: `DISCORD_BOT_TOKEN=<token> python3 tools/discord/setup.py <server id>`
   This is a dry run that shows what will change. Add `--apply` to make the changes.
5. Afterwards: kick the bot from the server, and **Reset Token** again in the portal so the old token is useless.
6. In Server Settings, enable **Community**, set **#rules** as the rules channel, and set up **Onboarding** so new members can pick Windows Tester or Proton Tester.

### Updating an existing server
The script also brings an existing server in line with the blueprint. It renames roles and categories (for example **Lead → LV7 · Owner**, **Core Dev → LV5 · Development**, **Tester → Windows Tester**, **TESTING → QUALITY**, **STAFF → ADMINISTRATION**), creates what is missing, moves channels to their category, orders the categories and resets channel permissions to the blueprint. Roles and channels not in the blueprint are listed and left alone.
- Add `--update-messages` to also edit the starter messages the bot posted earlier (for example the welcome text). Only works if it is the same bot application that posted them.
- Always run the dry run first and read the list before adding `--apply`.

## Setup order (manual)
1. Create server from scratch. Name as above. Upload icon only after it is checked for Konami artwork (none allowed).
2. Enable Community features. Verification level: Medium. Explicit media filter on.
3. Require 2FA for moderator actions (Server Settings, Safety).
4. Create roles (below), then categories and channels, then set permissions.
5. Post welcome, rules, roadmap. Pin them.
6. Invite the first contributors, then open public invite.

## Roles (top to bottom)
The server mirrors the project's four departments ([departments.md](departments.md)) and the keycard levels ([ADR 0011](decisions/0011-keycard-access.md)). Every staff role starts with its card level.

| Role | Who | Access |
|---|---|---|
| **LV7 · Owner** | The project lead | Everything (Administrator for setup only) |
| **LV6 · Administration** | Seat holders, admins | ADMINISTRATION and all department channels; manage messages, timeout, kick, ban (social authority) |
| **LV6 · Moderator** | Trusted community members | Manage messages, timeout, kick; ADMINISTRATION (social authority) |
| **LV5 · Development** | Core developers | DEVELOPMENT, QUALITY, CONTRACTORS |
| **LV5 · Technical Lead** | The technical lead (a person; open seat) | All department channels. No moderation: technical authority only |
| **LV4 · Quality** | Testers, reviewers, release QA | QUALITY, CONTRACTORS |
| **LV3 · Contractor** | Anyone who has completed a contract | DEVELOPMENT, QUALITY, CONTRACTORS |
| Rank S++ · S+ · S · A++ · A+ · A · B · C · D · E | Contractor rank: best grade in any field | Cosmetic: shows rank in the member list. No permissions, no authority |
| RE / Hooks · Networking · Web / App · Docs | Development units | DEVELOPMENT |
| Windows Tester · Proton Tester · Reviewer | Quality units | QUALITY |
| **LV2 · Member** | Everyone who joins | COMMUNITY, MODDING, VOICE Lobby |

Only LV6 and LV7 roles can moderate, matching the chain of command ([HP-POL-007](guides/HP-POL-007-chain-of-command.md)). Quality, Contractor and Rank roles have no moderation or management permissions.

Keycard roles are shown separately in the member list, so the server reads like Mother Base. A contractor gets **LV3 · Contractor** plus their **Rank** role. Ranks are updated by hand from the Verify page until a bot does it.

## Categories and channels
**INFO** (read only for Member)
- #welcome, #rules, #announcements, #roadmap, #faq

**COMMUNITY**
- #general, #showcase, #suggestions, #off-topic

**ADMINISTRATION** (LV7, LV6)
- #admin-board, #legal-and-funding, #mod-log

**DEVELOPMENT** (LV5, LV3, development units)
- #dev-log, #architecture, #reverse-engineering, #networking, #hooks, #web-and-app

**QUALITY** (LV5, LV4, LV3, quality units)
- #test-sessions, #windows, #proton-linux, #bug-reports, #review-queue, #release-qa

**CONTRACTORS** (LV5, LV4, LV3)
- #contract-board, #contractor-lounge, #handoffs

**MODDING**
- #mod-api, #mod-showcase

**VOICE**
- Lobby, Dev Standup (Development and contractors), Test Session (Quality, Development and contractors)

## Rules (post in #rules)
1. MGSV: Joint Operations is an unofficial fan project by Hound Protocol. It is not affiliated with or endorsed by Konami.
2. Own your copy of MGSV. No piracy, cracks, or game file sharing.
3. No cheating in other people's multiplayer, and nothing that touches Konami's online services or anti-cheat.
4. Be respectful. No harassment, hate, or spam.
5. Keep discussion in the right channel. Credit your sources.
6. Bug reports use the template in #bug-reports.
7. Moderators and Administration decide on conduct, Development on technical matters. Anyone can talk to anyone and appeal one level up ([HP-POL-007](guides/HP-POL-007-chain-of-command.md)).

## Welcome message (post in #welcome)
Welcome to MGSV: Joint Operations, by Hound Protocol. We are building a multiplayer mod that brings online play for up to 16 players into the single-player world of Metal Gear Solid V on PC, for Windows and Linux via Proton. This is an unofficial fan project. Read #rules, check #roadmap, and pick a role in #welcome.

## Bug report template (pin in #bug-reports)
- Game version / build:
- OS (Windows, or Linux with Proton version):
- Mod version:
- Players in session:
- What happened:
- What you expected:
- Steps to reproduce:
- Logs (no game files):

## Onboarding
- Role picker (Onboarding): Windows Tester, Proton Tester. These give QUALITY access.
- Keycard roles LV4 to LV6 are granted by the owner or Administration. LV3 and Rank roles follow completed contracts.
- New contributors read docs/legal.md before getting DEVELOPMENT access.

## Moderation and safety
- Never ask for or share passwords, tokens, or API keys in any channel.
- Two moderators minimum before opening the public invite.
- Log moderation actions in a private #mod-log channel.

## Open decisions
- Bot for role picker and tickets (optional, later).
- Donation channel: not before 0.1 (ADR 0010).
- A bot that assigns Rank roles from the Verify page (later).
