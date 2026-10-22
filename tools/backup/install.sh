#!/usr/bin/env bash
# Install the weekly Hound Protocol backup for the current user (systemd user timer).
# Run from the repository root: bash tools/backup/install.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin" "$HOME/.config/systemd/user"
install -m 755 "$here/hp-backup.sh" "$HOME/.local/bin/hp-backup.sh"
install -m 644 "$here/hp-backup.service" "$here/hp-backup.timer" "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now hp-backup.timer
loginctl enable-linger "$USER" 2>/dev/null || true
echo "Installed. Next run:"
systemctl --user list-timers hp-backup.timer --no-pager
echo "Run one now with: systemctl --user start hp-backup.service   (log: ~/HoundBackups/backup.log)"
