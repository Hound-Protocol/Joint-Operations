# GitHub setup checklist

Status: Partly done · Updated: 2026-10-23 · For organization owners

These settings cannot be changed from automated sessions, so an owner applies them once. Each takes under a minute.

## 1. Done
- [x] First pull request merged, repository public, GitHub Pages live (deploys on every push to `main`).
- [x] Sign-in app and private document repositories set up ([signin.md](signin.md)).
- [ ] Branch protection (step 4): still to do.

## 2. Repository details
Repository page → gear icon next to **About**:
- **Description:** `MGSV: Joint Operations, an unofficial multiplayer mod bringing online play for up to 16 players into the single-player world of Metal Gear Solid V (PC). By Hound Protocol.`
- **Website:** `https://hound-protocol.github.io/joint-operations-web/`
- **Topics:** `metal-gear-solid-v`, `mgsv`, `mod`, `multiplayer`, `game-modding`, `fox-engine`, `proton`, `steam`
- Untick Releases and Packages until there is something to publish (optional).

## 3. Settings → General
- **Features:** Wikis off (docs live in the repo). Issues on. Discussions off (Discord is the community space). Projects optional.
- **Pull requests:** allow **squash merging only**. Untick merge commits and rebase merging. Default squash message: pull request title and description.
- Tick **Automatically delete head branches**.
- **Social preview:** upload `joint-operations-web/site/assets/img/og.png`.

## 4. Settings → Branches → Add branch ruleset for `main`
- Require a pull request before merging. **Approvals: 0** while the project lead is the only reviewer; raise it to 1 when the seats are filled after the playable prototype.
- Require status checks to pass: **checks**, **Browsers (Chromium, Firefox, WebKit)** and **Contributor standing** (they appear after their first runs).
- Block force pushes and deletions.
- No bypass, admins included: every change goes through the checks.

## 5. Settings → Pages
- **Source:** GitHub Actions (done).

## 6. Settings → Code security
- Turn on **Private vulnerability reporting** (used by `SECURITY.md`).
- Turn on **Dependabot alerts** and **secret scanning**.

## 7. Organization (github.com/Hound-Protocol → Settings)
- **Authentication security:** require two-factor authentication for all members.
- **Member privileges:** base permission **Read**; members cannot create public repositories.
- **Profile:** display name `Hound Protocol`, description `A community-focused organization. We build ambitious projects, one of them being Joint Operations.`, website as above. No Konami artwork.
- Optional: create a repository named `.github` with `profile/README.md` to show an organization page.

## 8. Add people
- Seats are filled once there is a playable prototype ([governance](governance.md)). Then add seat holders as organization owners or maintainers (two per seat) and to the matching teams, which also opens their restricted documents ([signin.md](signin.md)).
- Add them to `.github/CODEOWNERS`.
