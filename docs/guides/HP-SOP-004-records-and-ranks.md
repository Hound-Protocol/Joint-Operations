# Contributor Records and Grade Updates
Code: HP-SOP-004 · Version 1.1 · Effective 2026-10-23 · Owner: Administration · Used by: the records signer (project lead)

## One-time setup
```
pip install --user cryptography
python3 tools/records.py keygen --key-id hp-2026
```
Commit `site/data/records-key.json` in a pull request. Back up the private key (`~/.config/hound-protocol/`) offline, for example on an encrypted USB drive. Never upload it anywhere.

## After each merged contract
1. Find the merged pull request number and its merge commit.
2. Run:
   ```
   python3 tools/records.py add --login <github-user> --contract <Cxx> --pr <number> --commit <sha>
   ```
3. Open a pull request with the updated `site/data/records.json`. CI verifies the signature.
4. When it merges, the contributor appears on the Verify page with their grades.

## Grade roles on Discord
1. Check the contractor's overall grade (their best grade in any field) on the Verify page.
2. Give them **LV3 · Contractor** and the grade role for it (the Discord roles are named **Rank E** to **Rank S++**). Remove the old grade role.
3. Post a short note in #contract-board for promotions to S and above.

## Mistakes
Records are never deleted. Issue a correct record and explain in the pull request. If the key is lost or leaked, follow [HP-SOP-006](HP-SOP-006-security-incident.md), create a new key with a new ID and re-sign.
