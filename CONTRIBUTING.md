# Contributing to MGSV: Joint Operations

Status: DRAFT

Hound Protocol works like a contract network. There is no fixed team. Anyone can pick up a contract, deliver it, and leave. This file explains how.

## Ground rules
- Fork the repo and open a pull request. Nobody pushes to `main`.
- Sign off every commit (`git commit -s`). Your sign-off certifies that the work is yours and that you license it under the project license.
- Never commit game files, extracted assets, executables, archives, or third-party mod code.
- Research is written in your own words, with sources, in `research/`.
- Nothing may touch Konami's online services, FOB features, or anti-cheat.
- Only builds compiled from reviewed code are tested by the team.

## The contract board
Contracts are GitHub issues with the `contract` label. The website's Contribute page reads them directly.

| Label | Meaning |
|---|---|
| `contract` | The issue is a contract on the board |
| `module:<name>` | Module it belongs to: `launcher`, `hooks`, `session`, `net`, `modapi`, `lobby`, `web`, `docs`, `testing`, `legal` |
| `size:S`, `size:M`, `size:L` | Rough size: hours, days, or a week or more |
| `status:review` | Work is submitted and waiting for review |
| `blocked` | Waiting on another contract |

Dependencies are written in the issue body as `Depends on #12`.

Status on the board:
- **Open:** no assignee.
- **Claimed:** someone is assigned.
- **In review:** has the `status:review` label.
- **Done:** the issue is closed.

## How to take a contract
1. Pick an open contract on the board whose dependencies are done.
2. Comment on the issue to claim it. A maintainer assigns you.
3. Do the work on a branch in your fork.
4. Open a pull request that says `Closes #<issue>`.
5. A reviewer approves and merges. The contract closes and counts toward your rank.

## Leaving a contract
Leaving is fine. Before you go, post a short handoff note on the issue: what is done, what is not, and where the work is. A maintainer then unassigns the contract.

## Ranks
Points per completed contract: S = 1, M = 3, L = 5.

| Rank | Points | Unlocks |
|---|---|---|
| Recruit | 0 | Claim small contracts |
| Operative | 3 | Claim medium contracts, review small ones |
| Specialist | 10 | Claim large contracts, review medium ones, own a module area |
| Squad Lead | 25 | Approve contracts, vote on priorities |
| Commander | 50 | Seat holder candidate, approve releases |

These numbers are a draft and will be applied the same way to everyone.

## Submitting a mod to the repository
Open an issue with the `mod-submission` label. Include the mod name, version, author, link, and what you tested. Reviewed mods are listed as Compatible or Known issues on the website.
