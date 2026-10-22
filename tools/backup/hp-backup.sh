#!/usr/bin/env bash
# Hound Protocol backup: a full copy of the GitHub project, kept on this machine
# and synced (encrypted) to Google Drive. See docs/guides/HP-SOP-009-backup-and-restore.md.
#
# What it saves, every run:
#   - mirror/            a full git mirror (all branches, tags and history), updated in place
#   - snapshots/DATE/    a git bundle (one file with the whole history) plus JSON exports of
#                        issues, pull requests, comments, releases, labels and milestones
# It keeps the last $KEEP snapshots, then syncs the folder to the rclone remote $REMOTE.
#
# Needs: git, gh (logged in with `gh auth login`), jq, and optionally rclone.
# Settings (environment or ~/.config/hound-protocol/backup.env):
#   HP_REPO    owner/repo            default Hound-Protocol/Joint-Operations
#   HP_DIR     backup folder         default ~/HoundBackups
#   HP_KEEP    snapshots to keep     default 12
#   HP_REMOTE  rclone remote path    default hp-crypt:   (leave empty to skip the cloud copy)
set -euo pipefail

CONF="${XDG_CONFIG_HOME:-$HOME/.config}/hound-protocol/backup.env"
[ -f "$CONF" ] && . "$CONF"
REPO="${HP_REPO:-Hound-Protocol/Joint-Operations}"
DIR="${HP_DIR:-$HOME/HoundBackups}"
KEEP="${HP_KEEP:-12}"
REMOTE="${HP_REMOTE-hp-crypt:}"
STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
SNAP="$DIR/snapshots/$STAMP"
LOG="$DIR/backup.log"

mkdir -p "$DIR/snapshots"
exec > >(tee -a "$LOG") 2>&1
echo "=== $(date -u +%FT%TZ) backup of $REPO ==="

for tool in git gh jq; do
  command -v "$tool" >/dev/null || { echo "Missing $tool. See HP-SOP-009, setup step 1."; exit 1; }
done
gh api rate_limit >/dev/null 2>&1 || { echo "gh is not logged in. Run: gh auth login"; exit 1; }

# 1. Git mirror: every branch, tag and commit
if [ -d "$DIR/mirror" ]; then
  git -C "$DIR/mirror" remote update --prune
else
  git clone --mirror "https://github.com/$REPO.git" "$DIR/mirror"
fi

# 2. Snapshot: one-file bundle that can be cloned from, plus a check that it is valid
mkdir -p "$SNAP"
git -C "$DIR/mirror" bundle create "$SNAP/repository.bundle" --all
git -C "$DIR/mirror" bundle verify "$SNAP/repository.bundle" >/dev/null
echo "bundle ok: $(du -h "$SNAP/repository.bundle" | cut -f1)"

# 3. What git does not hold: issues, pull requests, comments, releases, labels, milestones
api() { gh api --paginate "repos/$REPO/$1" | jq -s 'add // []' > "$SNAP/$2.json"; echo "exported $2: $(jq length "$SNAP/$2.json")"; }
api "issues?state=all&per_page=100" issues
api "pulls?state=all&per_page=100" pulls
api "issues/comments?per_page=100" issue-comments
api "pulls/comments?per_page=100" review-comments
api "releases?per_page=100" releases
api "labels?per_page=100" labels
api "milestones?state=all&per_page=100" milestones
gh api "repos/$REPO" > "$SNAP/repository.json"

# 4. Pack the snapshot and keep the newest $KEEP
tar -C "$DIR/snapshots" -czf "$DIR/snapshots/$STAMP.tar.gz" "$STAMP" && rm -rf "$SNAP"
ls -1t "$DIR"/snapshots/*.tar.gz | tail -n +"$((KEEP + 1))" | xargs -r rm -f
echo "snapshots kept: $(ls -1 "$DIR"/snapshots/*.tar.gz | wc -l)"

# 5. Encrypted copy in the cloud (rclone crypt remote, see HP-SOP-009 step 3)
if [ -n "$REMOTE" ] && command -v rclone >/dev/null; then
  rclone sync "$DIR/snapshots" "${REMOTE}snapshots" --fast-list
  echo "cloud copy synced to $REMOTE"
else
  echo "cloud copy skipped (HP_REMOTE empty or rclone missing)"
fi
echo "=== done ==="
