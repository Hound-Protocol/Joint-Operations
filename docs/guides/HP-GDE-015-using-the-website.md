# Using the Website and Documentation
Code: HP-GDE-015 · Version 1.1 · Effective 2026-10-23 · Owner: Administration · For: everyone

The website at **hound-protocol.github.io/Joint-Operations** is the project's front door. It reads most of its content live from the repository, so what you see is current. This guide explains each section, how to find anything in the documentation, and how signing in works.

## 1. Getting around
- **Main menu:** the first screen. Arrow keys and Enter work, as in a game menu. The panels beside it describe the project and the team.
- **Section bar:** the row of tabs at the top of every page. The line under it describes the tab you point at.
- **Keyboard:** ← and → switch sections, Esc returns to the menu.
- **Top bar:** the build number, and **Sign in** (or your keycard level and name once you are signed in).
- **Options:** effects, motion, sound, text size and contrast. Choose **Performance** on older computers, or **Calm** if motion bothers you. Settings stay in your browser.

## 2. The sections
| Section | What you find there |
|---|---|
| **About** | What Joint Operations is, how a session works, and the FAQ |
| **Roadmap** | Joint Operations Motherbase: one platform per phase, filled as tasks are done. Click a platform to see its tasks |
| **Download** | The game release when there is one, install steps for Windows and Linux, and requirements |
| **Sessions** | The Session Browser, live once 0.1 is out: find a session, see players and ping, and join |
| **Contribute** | The contract board, difficulty, and contractor grades |
| **Team** | Hound Protocol, the chain of command, departments and open positions |
| **Mods** | Mods tested to work with Joint Operations, and how to submit one |
| **Dev Log** | Releases, notes and changes, newest first, with search |
| **Docs** | All documentation, in two zones (below) |
| **Verify** | Signed contributor records, staff keycards, and proving a Hound ID |
| **Profile** | Your keycard and your restricted documents, after signing in |

## 3. Documentation: two zones
**Library:** plans, decision records, research, technical, community, project and legal documents, kept in drawers like a filing cabinet.
- Open a drawer to see its folders; each folder shows a file number such as ADR-0012 or RES-03. One drawer is open at a time: opening another closes the rest.
- The open document lies on the right. Its paper shows its class: ruled paper for decisions, triangle grid for research, millimetre paper for technical, green bars for community, pinstripes for project, a yellow pad for legal.
- **GitHub** opens the source file; **Suggest an edit** lets you propose a change ([GitHub Basics](HP-GDE-014-github-basics.md)); **Copy link** copies a direct link to that document.

**Handbook:** the guides, policies and procedures, as A4 sheets you can print or download as PDF.
- **Filter:** type a word, part of one, or a topic in the box (Ctrl+K or / jumps there). The sheets narrow as you type; the text of every document counts too, and everyday words find their handbook terms (`ban` finds suspensions, `linux` finds Proton, `login` finds sign-in). Enter opens the first sheet, Esc clears.
- Filter by audience: Players, Contributors, Quality, Administration. Both filters work together.
- The coloured stripe on the right edge names the type: Guide (ochre), Policy (red), Procedure (blue).
- **Print** prints the sheet on A4; **Download PDF** saves it.

## 4. Searching
The search box in the Library searches **the Library only**, and shows its results **as the folders themselves**: drawers without a match disappear, and the matching folders stay in their drawers, best match first. Press **Ctrl+K** or **/** anywhere on the page to jump to it.
- Every word you type must appear, in the file number, the title or the text. Add words to narrow the results: `steam sockets`.
- **File numbers** work, even shortened: `adr 12` finds ADR-0012, `res 3` finds RES-03.
- Word endings are forgiven: `appeals` also finds `appeal`.
- A folder marked **In text** matches inside the document, not in its title.
- **↑ ↓** move between the matching folders, **Enter** opens the selected one, **Esc** clears the search. You stay in the Library.
- The opened document highlights your words and scrolls to the first one.
- Guides, policies and procedures live in the **Handbook**, which has its own filter (section 3).

## 5. Signing in
Signing in is optional. It uses your GitHub account ([ADR 0017](../decisions/0017-hound-id-sign-in.md)).
1. Click **Sign in** in the top bar, then **Sign in with GitHub**. A small GitHub window opens.
2. The first time, GitHub asks you to authorize **Hound Protocol Sign-in**. It can only read our restricted document repositories that your GitHub teams already allow; it cannot change anything.
3. The window closes and your **Profile** shows your keycard: your signed staff card if you are staff, otherwise a member card (LV2).
4. **Your documents:** each restricted area opens at its clearance (Staff LV3, Leads LV5, Administration LV6). Areas above your level stay locked. If an area says GitHub has not given you access yet, ask Administration to add you to the right team.
5. **Sign out** on the Profile page, or close the tab. Your sign-in lasts at most eight hours and lives only in that tab ([privacy](../privacy.md)).

Allow pop-ups for the site if nothing happens when you click **Sign in with GitHub**.

## 6. Checking people and records
- **Verify → Hound staff:** look up a Hound ID, GitHub name or Discord ID to see whether someone is real staff.
- **Prove a Hound ID:** a card can be copied, so ask the person to sign a one-time challenge with their SSH key ([HP-GDE-009](HP-GDE-009-grades-records-hound-ids.md)).
- **Records:** every completed contract earns a signed record; the page checks each signature in your browser.

## 7. If something looks wrong
- Hard-refresh the page (Ctrl+Shift+R) after a release; your browser may be showing a cached copy.
- **Options → Refresh now** reloads the data read from GitHub.
- "GitHub unreachable · showing bundled data" means GitHub's API did not answer (often a rate limit). The page still works with the copy built into the site.
- Still wrong? [Report it](HP-GDE-016-reporting-a-problem.md).
