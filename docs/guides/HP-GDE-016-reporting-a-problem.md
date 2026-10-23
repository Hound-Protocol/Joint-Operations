# Reporting a Problem
Code: HP-GDE-016 · Version 1.0 · Effective 2026-10-23 · Owner: Quality · For: players and testers

A good report gets a problem fixed fast. This guide shows where to report, what to include and what happens next. Testers who write reports for the Quality Department follow the fuller [Quality Guide](HP-GDE-004-quality-testing.md).

## 1. First, check
- **Is it already known?** Read **Known issues** in the release notes on the website's Download page, and search the [GitHub issues](https://github.com/Hound-Protocol/Joint-Operations/issues).
- **Is it ours?** Try the same thing without Joint Operations. If it also happens in the normal game, it is not something we can fix.
- **Is it a security problem** (a leaked password or key, a way to harm other players)? Do not post it publicly. Use GitHub's private report: **Security → Report a vulnerability** ([SECURITY.md](../../SECURITY.md)).

## 2. Where to report
| You have | Report it |
|---|---|
| A GitHub account | **Issues → New issue → Bug report** on GitHub ([GitHub Basics](HP-GDE-014-github-basics.md)) |
| Only Discord | **#bug-reports**, using the pinned template ([Discord guide](HP-GDE-008-discord-members.md)) |
| A problem with the website | Same as above; say which page, which browser and whether you are on a phone |

## 3. What to include
| Field | Example |
|---|---|
| Game build | 1.0.15.4 (title screen) |
| System | Windows 11, or Bazzite with Proton 9.0-4 |
| Joint Operations version | 0.1.0 (from the release or the in-game menu) |
| Players in the session | 3 (you were a client) |
| What happened | The second client fell through the floor at the landing zone |
| What you expected | To land at the landing zone like the host |
| Steps to reproduce | 1. Host starts free roam in Afghanistan. 2. Two clients join. 3. Both pick the same landing zone |
| How often | Every time / once in five tries / once |
| Logs | The Joint Operations log files the release notes point to |

**Never attach** game files, saves from someone else, or anything with a password, token or key in it. Screenshots and short clips are welcome.

## 4. What happens next
1. The Quality Department tries to reproduce it ([HP-SOP-005](HP-SOP-005-bug-triage.md)).
2. It gets a severity: **crash**, **desync** or **minor**. Crashes and anything that damages saves block the next release ([HP-POL-006](HP-POL-006-quality-policy.md)).
3. If more information is needed, someone asks on the issue or in the thread. Answering helps a lot.
4. The fix is mentioned in the release notes, with credit to whoever reported it.

## 5. Website problems
The website is part of the project too. Useful details: the page (for example `#/docs`), your browser and version, desktop or phone, and a screenshot. Options → **Refresh now** clears the cached GitHub data, which fixes most "the list is out of date" problems.
