# Quality Guide: Testing and Bug Reports
Code: HP-GDE-004 · Version 1.0 · Effective 2026-10-22 · Owner: Quality · For: Quality Department and testers

## Your job
Make sure what we ship works on real machines. Every test result you write down saves someone hours.

## Test rig
| Item | Record |
|---|---|
| Game | Build 1.0.15.4; SHA-256 of `mgsvtpp.exe` |
| Platform | Windows version, or distro + Steam build + Proton version |
| Hardware | CPU, GPU, driver, RAM |
| Other mods | Names and versions (ideally none for clean tests) |

Keep the rig the same between tests. If something changes, note it.

## Kinds of tests
- **Smoke test:** the game starts, the mod loads, the main menu appears. Every build.
- **Checklist test:** the release checklist, step by step, on Windows and on Proton.
- **Session test:** 2 or more players, joins and leaves, 30 minutes of play, note desyncs.
- **Soak test:** a long session (2+ hours) to find slow leaks and drift.
- **Bad network:** the same with latency and packet loss profiles.

## Writing a bug report
```
Title: <what breaks>, short
Severity: S1–S4 (see HP-POL-006)
Build: mod version / game build / platform / Proton version
Steps:
1.
2.
Expected:
Actual:
Logs: attach the mod log (never game files)
Video or screenshot: if it helps
```
One bug per report. Search first for duplicates.

## Reviewing a contract
Check every acceptance criterion yourself, not from the description. Tick each on the issue. If one fails, comment with what you saw and request changes. See [HP-SOP-002](HP-SOP-002-pull-request-review.md).

## Signing off a release
Follow [HP-SOP-003](HP-SOP-003-release.md) and the gates in [HP-POL-006](HP-POL-006-quality-policy.md). Write the release's quality report: tests run, platforms, open bugs, what was not tested.
