# Bug Triage
Code: HP-SOP-005 · Version 1.0 · Effective 2026-10-22 · Owner: Quality · Used by: Quality Department

## Intake
Bugs come from GitHub issues (bug report template) and #bug-reports on Discord. Discord reports are moved to GitHub by Quality within 2 days, with a link back.

## Triage steps
1. **Check it is ours.** Not a game bug, not another mod, not a pirated copy.
2. **Reproduce** on Windows or Proton. Record the game build, mod version, Proton version and other mods installed.
3. **Severity** S1 to S4 ([HP-POL-006](HP-POL-006-quality-policy.md)).
4. **Label:** `bug`, `module:*`, severity, and `needs-info` if the reporter must answer.
5. **Route** to the module owner. S1 goes to the technical lead and project lead at once.

## Response times
| Severity | First response | Target |
|---|---|---|
| S1 | Same day | Fix or pull the release |
| S2 | 2 days | Next release |
| S3 | 7 days | Planned |
| S4 | When possible | Batched |

## Closing
Closed as fixed (with the pull request), duplicate (link), can't reproduce (after 14 days of `needs-info`), or not ours (with a pointer).
