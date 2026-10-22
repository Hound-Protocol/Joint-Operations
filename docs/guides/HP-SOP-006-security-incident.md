# Security Incident and Leaked Secret Response
Code: HP-SOP-006 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Used by: anyone who finds an incident; Administration leads

## First 15 minutes: contain
1. **Revoke** the secret first: reset the token, rotate the key, remove the access. Do this before anything else.
2. Remove the exposed text (edit or delete the message, close the issue). Deleting does not undo exposure, which is why step 1 comes first.
3. Tell the project lead privately.

## Within a day: clean up
- Check logs for misuse: GitHub audit log, Discord audit log, bot activity.
- If a secret reached git history, treat it as public forever. Rotating it is the fix, not rewriting history.
- Re-sign contributor records if the records key was exposed ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)).

## Within a week: learn
Write a short note in #admin-board: what happened, impact, what was done, what changes. No blame. Update the relevant SOP.

## Vulnerabilities reported by outsiders
Follow [SECURITY.md](../../SECURITY.md): acknowledge within 3 days, fix privately, credit the reporter if they want.

## Common cases
| Case | Action |
|---|---|
| Bot token pasted in chat | Reset it in the Discord Developer Portal, remove the bot if not needed |
| GitHub token committed | Revoke at github.com/settings/tokens, check the audit log |
| Records key leaked | New key ID, re-sign all records, publish the new public key |
| Account takeover | Recover with 2FA codes, remove the account's access until it is safe |
