# Security Policy for Team Members
Code: HP-POL-004 · Version 1.2 · Effective 2026-10-23 · Owner: Administration · Applies to: department members, seat holders and anyone with access

For reporting a vulnerability as an outsider, see [SECURITY.md](../../SECURITY.md).

## 1. Accounts and identity
- **Two-factor authentication** on GitHub and Discord is required for every department member and seat holder. The GitHub organization enforces it: members without 2FA are removed automatically.
- **Passkeys or a hardware security key** are required for keycard LV6 and LV7, and strongly recommended for LV4 and LV5 ([ADR 0011](../decisions/0011-keycard-access.md)). An authenticator app is the minimum. Text-message codes are not allowed.
- **Hound ID:** every staff member gets a signed staff card with a permanent ID (`HND-NNNN`), tied to their numeric GitHub account ID, which never changes. Anyone can check it on the website's Verify page. Staff never need to prove who they are by sharing passwords or codes, and nobody from Hound Protocol will ever ask for them. To prove a Hound ID, the holder signs a one-time challenge with their SSH signing key on the Verify page ([ADR 0017](../decisions/0017-hound-id-sign-in.md)).
- **Signed commits** for LV4 and up: sign commits with an SSH or GPG key so GitHub marks them as Verified. Set up once: `git config --global gpg.format ssh`, `git config --global user.signingkey ~/.ssh/id_ed25519.pub`, `git config --global commit.gpgsign true`, then add the key on GitHub as a **Signing key**.
- Use a password manager. Never reuse the project's passwords elsewhere.
- Shared credentials live only in the project's password manager, never in chat, issues or documents.

## 2. Secrets
- **Never** paste a token, key or password into chat, an issue, a pull request, a commit or an AI tool. This includes "temporary" ones.
- Bot tokens are created for one job, used from an environment variable, and reset right after.
- The contributor-records signing key stays on the signer's own machine ([contributor-records.md](../contributor-records.md)).
- GitHub secret scanning and push protection stay on.
- The sign-in app's client secret lives only in the relay's encrypted settings on Cloudflare, never in the repository, chat or a file. Rotate it every six months and at once if it may have leaked ([signin.md](../signin.md)).
- Website sign-in tokens stay in the visitor's own browser tab; nobody on the team ever needs to see one.

## 3. Access
- Least access: people get the rights their department needs, nothing more. GitHub team membership also decides which restricted document repositories a person can read; nothing secret is ever kept in documents.
- Access is granted and removed the same day ([HP-SOP-007](HP-SOP-007-onboarding-offboarding.md)).
- Administrator rights on Discord are used for setup only, then removed.

## 4. Code and releases
- All changes go through pull requests on a protected main branch, with required checks.
- Releases are built by CI only, never on a personal machine, and published with checksums.
- Dependencies are kept up to date by Dependabot. Security updates are merged first.

## 5. Backups
The project is backed up every week to the owner's computer and an encrypted Google Drive folder ([HP-SOP-009](HP-SOP-009-backup-and-restore.md)). 2FA recovery codes and the records signing key are kept offline on an encrypted USB stick.

## 6. If something leaks
Follow [HP-SOP-006](HP-SOP-006-security-incident.md) at once: revoke first, then clean up, then report.
