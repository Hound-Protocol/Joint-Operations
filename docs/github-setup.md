# GitHub setup checklist

Status: to do by an organization owner · Date: 2026-10-21

These settings cannot be changed from automated sessions, so an owner applies them once. Each takes under a minute.

## 1. Merge pull request #1
- Open pull request #1, choose **Squash and merge**. This keeps `main` free of the earlier drafts.
- If branch protection is already on (step 4) and nobody else can approve, use the admin option to merge.

## 2. Repository details
Repository page → gear icon next to **About**:
- **Description:** `MGSV: Joint Operations, an unofficial multiplayer mod bringing online play for up to 16 players into the single-player world of Metal Gear Solid V (PC). By Hound Protocol.`
- **Website:** `https://hound-protocol.github.io/Joint-Operations/`
- **Topics:** `metal-gear-solid-v`, `mgsv`, `mod`, `multiplayer`, `game-modding`, `fox-engine`, `proton`, `steam`
- Untick Releases and Packages until there is something to publish (optional).

## 3. Settings → General
- **Features:** Wikis off (docs live in the repo). Issues on. Discussions off (Discord is the community space). Projects optional.
- **Pull requests:** allow **squash merging only**. Untick merge commits and rebase merging. Default squash message: pull request title and description.
- Tick **Automatically delete head branches**.
- **Social preview:** upload `site/assets/img/og.png`.

## 4. Settings → Branches → Add branch ruleset for `main`
- Require a pull request before merging, with **1 approval**.
- Dismiss stale approvals when new commits are pushed.
- Require status checks to pass: **checks** (from `.github/workflows/checks.yml`; it appears after its first run).
- Block force pushes and deletions.
- Allow organization admins to bypass, so a one-person team is never locked out.

## 5. Settings → Pages
- **Source:** GitHub Actions. The site deploys after the next push to `main`.

## 6. Settings → Code security
- Turn on **Private vulnerability reporting** (used by `SECURITY.md`).
- Turn on **Dependabot alerts** and **secret scanning**.

## 7. Organization (github.com/Hound-Protocol → Settings)
- **Authentication security:** require two-factor authentication for all members.
- **Member privileges:** base permission **Read**; members cannot create public repositories.
- **Profile:** display name `Hound Protocol`, description `Community development team behind MGSV: Joint Operations, an unofficial multiplayer mod.`, website as above. No Konami artwork.
- Optional: create a repository named `.github` with `profile/README.md` to show an organization page.

## 8. Add people
- Add seat holders as organization owners or maintainers (two per seat, see [governance](governance.md)).
- Add them to `.github/CODEOWNERS`.
