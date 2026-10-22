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
| `difficulty:easy`, `difficulty:medium`, `difficulty:hard` | How demanding the work is. Information only: anyone can take any difficulty |
| `core` | On the 0.1 critical path. Development Department only |
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
2. Comment `/claim` on the issue. You are assigned automatically, and your name shows on the website's board. Several people can claim the same contract. `/unclaim` leaves it.
3. Do the work on a branch in your fork.
4. Open a pull request that says `Closes #<issue>`.
5. The Quality Department reviews it against the acceptance criteria and merges. The contract closes and counts toward your rank.

## Leaving a contract
Leaving is fine. Before you go, post a short handoff note on the issue: what is done, what is not, and where the work is. A maintainer then unassigns the contract.

## Grades
Contractors are graded like Mother Base staff, from E to S++, in each field. Each completed contract also earns a signed [contributor record](docs/contributor-records.md), and grades are counted from those records.

Every completed contract (delivered, reviewed by Quality and merged) earns **points in its field**: 🟢 Easy 2, 🟡 Medium 5, 🔴 Hard 10. The fields are the board's columns: Programming, Reverse engineering, Testing, Design and web, Docs and legal.

- Like Mother Base staff, who hold a grade in each unit, you hold a **grade in each field**. Your **rank** is your best grade, and that is the role you get on Discord.
- Each grade needs more points than the last, as in the game, so the S grades take sustained, serious work.
- **Commendations** work like medals: Administration can award one for exceptional work. It adds 5 points to every field and is listed publicly with the reason.
- A contract shared by several people gives full points to each of them. Hand-written and AI-assisted work count the same.
- Grades never go down. Leaving and coming back is normal.
- **Grades give no authority over other people** ([HP-POL-007](docs/guides/HP-POL-007-chain-of-command.md)). Reviews by graded contractors are advice: Quality checks and Development decides.

| Grade | Points in the field | Unlocks |
|---|---|---|
| **E** | 1 | Contractor role on Discord, listed on the contributor wall |
| **D** | 4 | Experience in the field |
| **C** | 8 | Experience in the field |
| **B** | 14 | Hold two contracts at once |
| **A** | 22 | Review Easy contracts in this field, as advice to Quality |
| **A+** | 32 | Review Medium contracts in this field |
| **A++** | 50 | Mentor new contractors in this field |
| **S** | 80 | Review Hard contracts in this field |
| **S+** | 125 | Can be invited into a department |
| **S++** | 200 | Candidate for a lead position |

Each contract has a **difficulty**, 🟢 **Easy**, 🟡 **Medium** or 🔴 **Hard**, so you know what you are about to take on. It is information, not a gate: anyone can take any contract. Contracts marked **Core** are on the 0.1 critical path and stay with the Development Department. The full structure, with the four departments, is in [departments.md](docs/departments.md).

## Submitting a mod to the repository
Open an issue with the `mod-submission` label. Include the mod name, version, author, link, and what you tested. Reviewed mods are listed as Compatible or Known issues on the website.
