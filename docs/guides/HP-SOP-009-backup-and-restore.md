# Backup and Restore
Code: HP-SOP-009 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Used by: the owner (LV7) and Administration

## Why
GitHub can be hacked, an account can be taken over, and a repository can be damaged or deleted. A copy that GitHub cannot reach keeps the project safe. The backup runs every week on the owner's computer and keeps an **encrypted** copy on Google Drive.

## What is saved
| Item | How |
|---|---|
| All code, branches, tags and history | A git mirror plus a dated **bundle** file you can clone from |
| Issues, pull requests, comments, releases, labels, milestones | JSON exports from the GitHub API |
| Last 12 weeks | Older snapshots are deleted automatically |
| Off-site copy | Synced to Google Drive through an rclone **crypt** remote. Google only sees encrypted files |

Not covered by this backup: Discord messages (the server layout lives in `tools/discord/blueprint.json`), the records signing key and 2FA recovery codes (keep those on an encrypted USB stick, see [HP-POL-004](HP-POL-004-security-policy.md)).

## Setup on Bazzite (once, about 15 minutes)
1. **Tools.** Open a terminal:
   ```
   brew install gh rclone jq
   gh auth login
   ```
   Choose GitHub.com, HTTPS, and log in with the browser. The login is stored in your system keyring, not in a file.
2. **Get the scripts.** From a clone of the repository:
   ```
   git clone https://github.com/Hound-Protocol/Joint-Operations.git ~/Joint-Operations
   cd ~/Joint-Operations
   ```
3. **Google Drive, encrypted.** Run `rclone config` and create two remotes:
   - `gdrive`: type **drive**, scope **drive.file**, and sign in with your Google account when the browser opens.
   - `hp-crypt`: type **crypt**, remote `gdrive:HoundProtocol-Backups`, filename encryption **standard**, and let rclone **generate** both passwords. **Save both passwords in your password manager.** Without them the backup cannot be read, by anyone, including you.
4. **Install the weekly timer:**
   ```
   bash tools/backup/install.sh
   ```
   It runs every Sunday at 20:00. If the laptop is off, it runs at the next start.
5. **Run it once now** and read the log:
   ```
   systemctl --user start hp-backup.service
   tail -n 20 ~/HoundBackups/backup.log
   ```

Settings (folder, how many to keep, cloud remote) can be changed in `~/.config/hound-protocol/backup.env`, for example `HP_KEEP=24`.

## Check that it works (monthly, 5 minutes)
1. `systemctl --user list-timers hp-backup.timer` shows the next run.
2. The log ends with `=== done ===` and `cloud copy synced`.
3. `rclone ls hp-crypt:snapshots` lists the snapshots on Drive.
4. Do a test restore (below) into a temporary folder every three months.

## Restore
**Code and history** from the newest snapshot:
```
cd /tmp && tar -xzf ~/HoundBackups/snapshots/<newest>.tar.gz
git clone <snapshot folder>/repository.bundle Joint-Operations-restored
```
From Google Drive instead: `rclone copy hp-crypt:snapshots ~/restore` first.

**Back onto GitHub** (new or emptied repository):
```
cd Joint-Operations-restored
git remote set-url origin https://github.com/Hound-Protocol/Joint-Operations.git
git push --mirror origin
```
**Issues and pull requests:** the JSON files hold every title, body, label and comment. They can be re-created with a script, or kept as an archive. Ask the technical lead for the import script when needed.

## If GitHub is compromised
1. Follow [HP-SOP-006](HP-SOP-006-security-incident.md): secure the accounts first.
2. Do not run the backup until the accounts are safe, or it may copy the damage. Older snapshots stay untouched for 12 weeks.
3. Restore from the last snapshot made before the incident.
