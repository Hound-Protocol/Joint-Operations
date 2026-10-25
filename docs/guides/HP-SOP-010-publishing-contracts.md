# Publishing Contracts as GitHub Issues
Code: HP-SOP-010 · Version 1.0 · Effective 2026-10-22 · Owner: Development · Used by: Development and Administration, from version 0.1

Before 0.1, contracts are a plan on the website's board, read from `data/contracts.json`. When the project opens to contractors ([ADR 0014](../decisions/0014-quiet-until-0-1.md)), they become GitHub issues that people can claim. The board switches to the live issues by itself.

## When
Only on the project lead's go-ahead, normally together with the 0.1 launch.

## Steps
1. Check the planned contracts are current: goals, acceptance criteria, difficulty, and `core` for 0.1 critical-path work ([HP-SOP-001](HP-SOP-001-contract-lifecycle.md)).
2. Preview what will be created. Nothing is posted in this mode:
```
python3 tools/publish_contracts.py
```
3. Publish:
```
python3 tools/publish_contracts.py --apply
```
Each contract becomes an issue labeled `contract`, `module:<name>`, `difficulty:<level>` and, where set, `core`. Contracts that already have an issue are skipped.
4. Open the website's Contribute page. The board now says "Live from GitHub" and refreshes every 2 minutes.
5. Post in **#contract-board** on Discord that contracts are open.

## After publishing
- Contractors claim with `/claim` on an issue and leave with `/unclaim`; the claims workflow assigns them and the board shows their tokens.
- A contract is done when its pull request (with `Closes #N`) is merged. A records signer then issues the record ([HP-SOP-004](HP-SOP-004-records-and-ranks.md)).
- New contracts after 0.1 are written straight as issues with the same labels, using the contract issue template.

## Undo
If something was published by mistake, close the issues with a comment and the label `wontfix`. Do not delete them: the history stays visible ([HP-POL-007](HP-POL-007-chain-of-command.md), transparency).
