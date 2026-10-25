# Pull Request and Review
Code: HP-SOP-002 · Version 1.0 · Effective 2026-10-22 · Owner: Quality · Used by: everyone who opens or reviews a pull request

## Opening a pull request
1. Branch from `main`. Name it `area/short-topic` (for example `joint-operations-web/site/guides`, `net/spike-gns`).
2. Sign off every commit: `git commit -s`.
3. Fill in the template: what changed, contract, tests, AI assistance, checklist.
4. Keep it focused. One contract, one pull request.

## Automatic checks (must be green)
Data files valid · site script built from its modules · script syntax · contract specs generated · links resolve · docs library complete · no game or binary files · contributor records verify · single-file site builds · browser tests on Chromium, Firefox and WebKit · CodeQL.

## Merging
| Change | Merge |
|---|---|
| Changes by the project lead, including work done with an AI agent on the lead's behalf | Auto-merge once checks pass (the lead's standing instruction) |
| Contractor work | After Quality review, then auto-merge |
| Decision records | Status stays **Proposed** until the project lead accepts it |

Squash merge only. The branch is deleted after merge.

## Reviewer checklist
- [ ] Every acceptance criterion met, ticked on the issue
- [ ] Tests exist where needed and were run
- [ ] Windows and Proton tested if the game is involved
- [ ] No game files, secrets or copied code
- [ ] AI disclosure filled in honestly
- [ ] Docs updated
- [ ] Clear and maintainable: would a newcomer understand it?

## Review etiquette
- Be specific: point to the line and say what to change and why.
- Mark nits as "nit". They don't block.
- Approve when it is good enough and safe, not when it matches your taste.
- Answer within 3 days, or say when you will.
