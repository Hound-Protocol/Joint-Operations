# Contributing to MGSV: Joint Operations

Status: DRAFT

Hound Protocol works like a contract network. Anyone can pick up a contract, deliver it, and leave. Contractors form the **Contractor Department**, one of four departments alongside Administration, Development and Quality ([departments.md](docs/departments.md)). This file explains how.

> **Before 0.1:** version 0.1 is being built by the project lead. The contract board shows the plan, and contracts open to contractors after 0.1. Testers are welcome now.

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
| `difficulty:basic` … `difficulty:core` | Who can claim it: basic (anyone), standard (rank A+), advanced (rank S), expert (rank S+), core (Development Department) |
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
5. The Quality Department reviews it against the acceptance criteria and merges. The contract closes and counts toward your rank.

## Leaving a contract
Leaving is fine. Before you go, post a short handoff note on the issue: what is done, what is not, and where the work is. A maintainer then unassigns the contract.

## Ranks
Contractors are ranked like Mother Base staff, by the number of completed contracts. Each completed contract also earns a signed [contributor record](docs/contributor-records.md), and ranks are counted from those records.

| Rank | Completed contracts | Unlocks |
|---|---|---|
| — | 0 | Claim Basic contracts |
| A | 1 | Contributor wall, contractor role on Discord |
| A+ | 3 | Claim Standard contracts |
| A++ | 6 | Review Basic contracts with Quality |
| S | 10 | Claim Advanced contracts, review Standard contracts |
| S+ | 20 | Claim Expert contracts, invitation into a department, own a module area |
| S++ | 35 | Vote on priorities, seat candidate |

Each contract has a **difficulty** that sets who can claim it: Basic (anyone), Standard (A+), Advanced (S), Expert (S+) and Core (Development Department only). It also has an **effort** estimate in hours or days. The full structure, with the four departments, is in [departments.md](docs/departments.md).

## Submitting a mod to the repository
Open an issue with the `mod-submission` label. Include the mod name, version, author, link, and what you tested. Reviewed mods are listed as Compatible or Known issues on the website.
