# Security Policy for Team Members
Code: HP-POL-004 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Applies to: department members, seat holders and anyone with access

For reporting a vulnerability as an outsider, see [SECURITY.md](../../SECURITY.md).

## 1. Accounts
- **Two-factor authentication** on GitHub and Discord is required for every department member and seat holder.
- Use a password manager. Never reuse the project's passwords elsewhere.
- Shared credentials live only in the project's password manager, never in chat, issues or documents.

## 2. Secrets
- **Never** paste a token, key or password into chat, an issue, a pull request, a commit or an AI tool. This includes "temporary" ones.
- Bot tokens are created for one job, used from an environment variable, and reset right after.
- The contributor-records signing key stays on the signer's own machine ([contributor-records.md](../contributor-records.md)).
- GitHub secret scanning and push protection stay on.

## 3. Access
- Least access: people get the rights their department needs, nothing more.
- Access is granted and removed the same day ([HP-SOP-007](HP-SOP-007-onboarding-offboarding.md)).
- Administrator rights on Discord are used for setup only, then removed.

## 4. Code and releases
- All changes go through pull requests on a protected main branch, with required checks.
- Releases are built by CI only, never on a personal machine, and published with checksums.
- Dependencies are kept up to date by Dependabot. Security updates are merged first.

## 5. If something leaks
Follow [HP-SOP-006](HP-SOP-006-security-incident.md) at once: revoke first, then clean up, then report.
