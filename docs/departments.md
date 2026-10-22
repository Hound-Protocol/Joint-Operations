# Departments and contractor ranks

Status: Accepted ([ADR 0009](decisions/0009-departments-and-ranks.md)) · Date: 2026-10-22

Hound Protocol is organized like Mother Base: four departments, each with a clear job. The same structure is used on GitHub, on Discord and on the website.

## The four departments
| Department | Job | Units | Who |
|---|---|---|---|
| **Administration** | Direction, decisions, legal stance, funding, accounts, community and moderation, recruiting | Command · Community · Legal and Funding | Project lead, seat holders, moderators |
| **Development** | Building Joint Operations: architecture, game hooks, networking, session, launcher, tools, website | Hooks and RE · Networking · Session · Tools and Launcher · Web | Technical lead, technical lead delegate, core developers |
| **Quality** | Making sure what ships works: testing on Windows and Proton, reviews against acceptance criteria, bug triage, release sign-off | Windows Testing · Proton Testing · Review · Release QA | Testers, reviewers |
| **Contractor** | Outside contributors who take contracts, deliver and leave whenever they like | Open to any skill | Anyone who has completed a contract |

### How they work together
1. **Administration** decides what gets built and in what order, and keeps the project running.
2. **Development** turns that into work: builds the core, and writes contracts with acceptance criteria for the rest.
3. **Contractors** take contracts from the board and deliver them as pull requests.
4. **Quality** checks every delivery against its acceptance criteria and tests it on Windows and Proton. Nothing is released without Quality's sign-off.

Department members are standing staff. Contractors come and go. Experienced contractors (rank S+ and up) can be invited into a department.

## Contractor ranks
Ranks follow Mother Base staff grades. They depend on the number of **completed contracts**: delivered, reviewed by Quality and merged. Hand-written and AI-assisted work count the same.

| Rank | Completed contracts | Unlocks |
|---|---|---|
| — | 0 | Take any contract |
| **A** | 1 | Listed on the contributor wall, contractor role on Discord |
| **A+** | 3 | Hold two contracts at once |
| **A++** | 6 | Review Easy contracts with Quality |
| **S** | 10 | Review Medium contracts with Quality |
| **S+** | 20 | Review Hard contracts, can be invited into a department, own a module area |
| **S++** | 35 | Vote on priorities, seat candidate |

- Every completed contract also earns a signed [contributor record](contributor-records.md). Ranks are counted from those records, so anyone can check them on the website's Verify page.
- A contract shared by several people counts once for each of them.
- Ranks are never taken away for inactivity. Leaving and coming back is normal.

## Contract difficulty
Every contract has a difficulty, shown in color everywhere, plus an effort estimate. Difficulty is **information, not a gate**: it tells you what you are about to deal with, and anyone can take any contract.

| Difficulty | What makes it this hard |
|---|---|
| 🟢 **Easy** | Clear steps and a small scope. No game knowledge needed: docs, test runs, small tools. Usually a day or two |
| 🟡 **Medium** | Some research or design. Touches a few files or systems, or needs the game and a test rig. Usually a few days |
| 🔴 **Hard** | Unknown ground: reverse engineering, networking, core systems. Needs deep skills and careful testing. A week or more |

**Core** marks contracts on the 0.1 critical path, at any difficulty. They stay with the Development Department.

**Effort** is a separate time estimate ("up to 1 day", "2–3 days", "1–2 weeks"). It helps people plan and does not affect rank.

## Where it shows
| Place | What |
|---|---|
| Website, Team page | The departments and their units, with members |
| Website, Contribute and Verify pages | Contractor ranks, the contributor wall |
| Discord | Keycard roles LV2 to LV7 per department ([ADR 0011](decisions/0011-keycard-access.md)), a role per rank, unit roles, and channels per department |
| GitHub | Department owners in CODEOWNERS as departments fill; contract labels by module |

## Version 0.1
Version 0.1 is built by the project lead with the technical lead ([ADR 0009](decisions/0009-departments-and-ranks.md)). The contract board shows the plan in the meantime, and contracts open to contractors after 0.1.
