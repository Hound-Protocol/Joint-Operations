# Contributor Quick Start
Code: HP-GDE-003 · Version 1.2 · Effective 2026-10-23 · Owner: Development · For: new contributors and contractors

> **Where the website lives:** the site code, its build tools and tests are in the [joint-operations-web](https://github.com/Hound-Protocol/joint-operations-web) repository. This repository (Joint-Operations) holds the mod, the documents and the project records in `data/`. Website commands below run in joint-operations-web, after `python3 tools/sync_mod.py PATH_TO_JOINT_OPERATIONS`.

## 1. Read first (20 minutes)
- Not sure where you fit? [Can I Contribute?](HP-GDE-017-can-i-contribute.md)
- [Contributor Policy](HP-POL-001-contributor-policy.md) and [AI Use Policy](HP-POL-002-ai-use-policy.md), with the practical side in [Working with AI Assistants](HP-GDE-018-working-with-ai-assistants.md)
- [Clean-Room and IP Policy](HP-POL-003-clean-room-and-ip.md): no game files, no copied mod code
- [Departments and grades](https://github.com/Hound-Protocol/hound-protocol-web/blob/main/docs/departments.md): how the project is organized
- New to GitHub or Discord? [GitHub Basics](HP-GDE-014-github-basics.md) and the [Discord Member Guide](HP-GDE-008-discord-members.md)

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
   python3 tools/guides_index.py --check
   python3 tools/css_compat.py --check
   ```
5. Preview the website: `python3 tools/assemble_site.py _site` then open `_site/index.html` through a local server (`python3 -m http.server -d _site`).

## 3. Take a contract
1. Open the **Contribute** page. Pick a contract whose dependencies are done. The difficulty tells you what to expect. Easy is a good first one.
2. Sign in on the website and press **Claim** on the card, or comment `/claim` on the issue. Your name appears in the card's Contributors list at once. Others may claim it too: say hello and split the work.
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
| `joint-operations-web/site/` | The website: `src/js/` modules, `data/` JSON, `assets/` |
| `tools/` | Build, check, Discord, records and contract tools |
| `.github/` | CI workflows, templates, CODEOWNERS |

## 6. Writing style
Plain English, short sentences, active voice. Facts with sources and confidence. See [HP-GDE-005](HP-GDE-005-documentation-style.md).
