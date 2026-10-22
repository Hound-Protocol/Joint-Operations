# Contributor Quick Start
Code: HP-GDE-003 · Version 1.0 · Effective 2026-10-22 · Owner: Development · For: new contributors and contractors

## 1. Read first (20 minutes)
- [Contributor Policy](HP-POL-001-contributor-policy.md) and [AI Use Policy](HP-POL-002-ai-use-policy.md)
- [Clean-Room and IP Policy](HP-POL-003-clean-room-and-ip.md): no game files, no copied mod code
- [Departments and ranks](../departments.md): how the project is organized

## 2. Set up (30 minutes)
1. GitHub account with **two-factor authentication**.
2. Install git, Python 3.10+, and an editor. Code work later needs Visual Studio 2022 or a MinGW/LLVM toolchain.
3. Fork `Hound-Protocol/Joint-Operations` and clone your fork.
4. Run the checks locally:
   ```
   python3 tools/build_js.py --check
   python3 tools/check_links.py
   python3 tools/contracts_md.py --check
   python3 tools/records.py verify
   ```
5. Preview the website: `python3 tools/assemble_site.py _site` then open `_site/index.html` through a local server (`python3 -m http.server -d _site`).

## 3. Take a contract
1. Open the **Contribute** page. Pick a contract whose dependencies are done. The difficulty tells you what to expect. Easy is a good first one.
2. Comment `/claim` on the issue. You are assigned at once, and your name appears on the board. Others may claim it too: say hello and split the work.
3. Read its goal, deliverable and acceptance criteria. Ask questions on the issue, not in private.

## 4. Deliver
1. Branch: `git switch -c area/short-topic`.
2. Commit with sign-off: `git commit -s -m "Short, clear message"`.
3. Push and open a pull request. Fill in the template, including AI assistance.
4. Fix what review asks for. When Quality approves, it merges and your record is issued.

## 5. Where things live
| Folder | Contents |
|---|---|
| `docs/` | Plans, decisions (`docs/decisions/`), this handbook (`docs/guides/`) |
| `research/` | Sourced research notes |
| `site/` | The website: `src/js/` modules, `data/` JSON, `assets/` |
| `tools/` | Build, check, Discord, records and contract tools |
| `.github/` | CI workflows, templates, CODEOWNERS |

## 6. Writing style
Plain English, short sentences, active voice. Facts with sources and confidence. See [HP-GDE-005](HP-GDE-005-documentation-style.md).
