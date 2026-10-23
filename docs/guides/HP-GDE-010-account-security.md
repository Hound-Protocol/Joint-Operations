# Account Security Setup
Code: HP-GDE-010 · Version 1.1 · Effective 2026-10-23 · Owner: Administration · For: department members, contractors and anyone with access

Step by step setup for the rules in the [Security Policy](HP-POL-004-security-policy.md). About 20 minutes.

## 1. GitHub two-factor authentication (everyone)
1. GitHub → **Settings → Password and authentication**.
2. Turn on **two-factor authentication** with an authenticator app (Aegis, 2FAS, Google Authenticator, or your password manager).
3. Save the **recovery codes** in your password manager.
The Hound-Protocol organization requires 2FA. Without it, you are removed automatically.

## 2. Passkeys (LV6 and LV7)
1. Same page → **Passkeys → Add a passkey**.
2. Use a hardware key or your device's passkey storage. Add a second one as a backup.

## 3. Signed commits (LV4 and up)
1. Create an SSH key if you have none: `ssh-keygen -t ed25519 -C "you@example.com"`
2. GitHub → **Settings → SSH and GPG keys → New SSH key**, type **Signing key**, paste the contents of `~/.ssh/id_ed25519.pub`.
3. Tell git to sign:
```
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```
4. Your commits now show **Verified** on GitHub.

## 4. Discord
1. **User Settings → My Account → Enable Authenticator App**.
2. Never paste a bot token or webhook URL in any channel. If one leaks, follow [HP-SOP-006](HP-SOP-006-security-incident.md) at once.

## 5. Password manager
Use one (Bitwarden, KeePassXC, 1Password). Shared team credentials live only there, never in chat or in the repository.

## 6. Your Hound ID
Once you join a department, Administration issues your Hound ID ([HP-GDE-009](HP-GDE-009-grades-records-hound-ids.md)). Anyone can check it on the Verify page, so nobody can pretend to be you. The **signing key** from step 3 is also how you prove the card is yours: Verify → Prove a Hound ID → Prove it's me.

## 7. Signing in to the website
The website's **Sign in** uses your GitHub account and its two-factor login; there is no separate password. To remove the website's access at any time: GitHub → **Settings → Applications → Authorized GitHub Apps → Hound Protocol Sign-in → Revoke** ([Using the Website](HP-GDE-015-using-the-website.md#5-signing-in)).

## If something goes wrong
Lost device, leaked token or a strange login: tell Administration right away and follow [HP-SOP-006](HP-SOP-006-security-incident.md). Reporting fast is never held against you.
