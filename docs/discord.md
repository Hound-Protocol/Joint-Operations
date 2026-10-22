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
6. In Server Settings, enable **Community**, set **#rules** as the rules channel, and set up **Onboarding** so new members can pick Tester, Proton Tester or Developer roles.

## Setup order (manual)
1. Create server from scratch. Name as above. Upload icon only after it is checked for Konami artwork (none allowed).
2. Enable Community features. Verification level: Medium. Explicit media filter on.
3. Require 2FA for moderator actions (Server Settings, Safety).
4. Create roles (below), then categories and channels, then set permissions.
5. Post welcome, rules, roadmap. Pin them.
6. Invite the first contributors, then open public invite.

## Roles (top to bottom)
| Role | Who | Permissions |
|---|---|---|
| Lead | Project lead | Administrator |
| Technical Lead | Claude-led technical direction, human delegate | Manage channels, manage messages |
| Moderator | Trusted community members | Manage messages, timeout, kick |
| Core Dev | Committed contributors | Access to all DEVELOPMENT channels |
| RE / Hooks | Reverse engineering and hooks | DEVELOPMENT access, pinned in #reverse-engineering |
| Networking | Session and transport | DEVELOPMENT access |
| Web / App | Lobby, browser, web app | DEVELOPMENT access |
| Docs | Wiki, guides, onboarding | DEVELOPMENT access |
| Proton Tester | Linux and Proton testers | TESTING access, #proton-linux |
| Tester | Windows testers | TESTING access |
| Member | Everyone else | COMMUNITY, MODDING read and post |

## Categories and channels
**INFO** (read only for Member)
- #welcome, #rules, #announcements, #roadmap, #faq

**COMMUNITY**
- #general, #showcase, #suggestions, #off-topic

**DEVELOPMENT** (contributors only)
- #dev-log, #architecture, #reverse-engineering, #networking, #hooks, #web-and-app, #legal-and-funding

**TESTING** (Testers and above)
- #test-sessions, #windows, #proton-linux, #bug-reports

**MODDING**
- #mod-api, #mod-showcase

**VOICE**
- Lobby, Dev Standup (contributors), Test Session

## Rules (post in #rules)
1. MGSV: Joint Operations is an unofficial fan project by Hound Protocol. It is not affiliated with or endorsed by Konami.
2. Own your copy of MGSV. No piracy, cracks, or game file sharing.
3. No cheating in other people's multiplayer, and nothing that touches Konami's online services or anti-cheat.
4. Be respectful. No harassment, hate, or spam.
5. Keep discussion in the right channel. Credit your sources.
6. Bug reports use the template in #bug-reports.
7. Moderators have the final say.

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
- Role picker in #welcome: Tester, Proton Tester, Developer, Docs, Web / App.
- Contributor roles (Core Dev and specialist roles) are granted by the Lead.
- New contributors read docs/legal.md before getting DEVELOPMENT access.

## Moderation and safety
- Never ask for or share passwords, tokens, or API keys in any channel.
- Two moderators minimum before opening the public invite.
- Log moderation actions in a private #mod-log channel.

## Open decisions
- Bot for role picker and tickets (optional, later).
- Whether to open a donation channel (see docs/legal.md section 6).
