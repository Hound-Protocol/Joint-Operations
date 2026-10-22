# Departments and contractor grades

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
4. **Quality** checks every delivery against its acceptance criteria and tests it on Windows and Proton. Nothing is released without Quality's sign-off. This is a check on the work, not authority over people.

Department members are standing staff. Contractors come and go. Experienced contractors (grade S+ and up in a field) can be invited into a department.

Who may decide what over whom is set by the chain of command ([HP-POL-007](guides/HP-POL-007-chain-of-command.md)): Administration and moderators decide social matters, Development and Administration decide technical matters, and Quality and contractors have no authority over others.

## Contractor grades
Grades follow Mother Base staff grades, from **E** to **S++** ([ADR 0009](decisions/0009-departments-and-ranks.md)).

Every completed contract (delivered, reviewed by Quality and merged) earns **points in its field**: 🟢 Easy 2, 🟡 Medium 5, 🔴 Hard 10. The fields are the board's columns: Programming, Reverse engineering, Testing, Design and web, Docs and legal.

- Like Mother Base staff, who hold a grade in each unit, you hold a **grade in each field**. Your **rank** is your best grade, and that is the role you get on Discord.
- Each grade needs more points than the last, as in the game, so the S grades take sustained, serious work.
- **Commendations** work like medals: Administration can award one for exceptional work. It adds 5 points to every field and is listed publicly with the reason.
- A contract shared by several people gives full points to each of them. Hand-written and AI-assisted work count the same.
- Grades never go down. Leaving and coming back is normal.
- **Grades give no authority over other people** ([HP-POL-007](guides/HP-POL-007-chain-of-command.md)). Reviews by graded contractors are advice: Quality checks and Development decides.

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

Every completed contract also earns a signed [contributor record](contributor-records.md). Grades are counted from those records, so anyone can check them on the website's Verify page.

## Contract difficulty
Every contract has a difficulty, shown in color everywhere. Difficulty is **information, not a gate**: it tells you what you are about to deal with, and anyone can take any contract.

| Difficulty | What makes it this hard |
|---|---|
| 🟢 **Easy** | Clear steps and a small scope. No game knowledge needed: docs, test runs, small tools. |
| 🟡 **Medium** | Some research or design. Touches a few files or systems, or needs the game and a test rig. |
| 🔴 **Hard** | Unknown ground: reverse engineering, networking, core systems. Needs deep skills and careful testing. |

**Core** marks contracts on the 0.1 critical path, at any difficulty. They stay with the Development Department.

## Where it shows
| Place | What |
|---|---|
| Website, Team page | The departments and their units, with members |
| Website, Team page | The chain of command as a tree |
| Website, Contribute and Verify pages | Contractor grades per field, the contributor wall |
| Discord | Keycard roles LV2 to LV7 per department ([ADR 0011](decisions/0011-keycard-access.md)), a role per grade (E to S++), unit roles, and channels per department |
| GitHub | Department owners in CODEOWNERS as departments fill; contract labels by module |

## Version 0.1
Version 0.1 is built by the project lead with the technical lead ([ADR 0009](decisions/0009-departments-and-ranks.md)). The contract board shows the plan in the meantime, and contracts open to contractors after 0.1.
