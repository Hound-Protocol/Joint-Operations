# Contributor Records and Grade Updates
Code: HP-SOP-004 · Version 1.2 · Effective 2026-10-23 · Owner: Administration · Used by: the records signer (project lead)

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

## Certificates of service
A certificate is a signed summary of everything a person has done: their records, grades per field, clearance and AI tools credited ([ADR 0020](../decisions/0020-certificates-of-service.md)).
1. Make sure all of the person's completed contracts have signed records.
2. On the owner's computer: `python3 tools/records.py certify --login <github-name> [--name "Display name"] [--statement "One line of thanks or context"]`.
3. Commit `site/data/certificates.json` in a pull request; CI checks the signature.
4. Send the person the link: `#/verify/HPC-NNNN`. They can print it or save it as PDF.
5. Issue a new certificate when their work grows. To withdraw one: `python3 tools/records.py certificate-revoke --id HPC-NNNN --reason "..."`.

