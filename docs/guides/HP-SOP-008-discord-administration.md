# Discord Administration
Code: HP-SOP-008 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Used by: Discord admins

## The server is defined in code
`tools/discord/blueprint.json` defines roles, categories, channels, permissions and starter messages. `tools/discord/setup.py` makes the server match it. Change the blueprint in a pull request, then apply.

## Applying changes
1. In the Developer Portal, give the setup bot a fresh token. Add the bot with Administrator, for setup only.
2. Dry run (shows every change, changes nothing):
   ```
   DISCORD_BOT_TOKEN=<token> python3 tools/discord/setup.py <server id>
   ```
3. Read the list. Then apply:
   ```
   DISCORD_BOT_TOKEN=<token> python3 tools/discord/setup.py <server id> --apply --update-messages
   ```
4. Remove the bot's Administrator role or kick it, then **reset the token** so it is useless.

Never paste the token into chat, an issue or an AI tool ([HP-POL-004](HP-POL-004-security-policy.md)).

## Routine tasks
| Task | How |
|---|---|
| New department member | Department role + unit role ([HP-SOP-007](HP-SOP-007-onboarding-offboarding.md)) |
| Rank promotion | Rank role from the Verify page ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)) |
| Moderation | Enforcement ladder in [HP-POL-005](HP-POL-005-community-moderation.md), log in #mod-log |
| Announcement | #announcements, short, with a link |

## Server settings to keep
Community on, verification level Medium, 2FA required for moderation, explicit media filter on, Onboarding offering Windows Tester and Proton Tester.
