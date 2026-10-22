# Contributor records

Status: DRAFT, waiting for the project lead's approval and signing key.

Every completed contract earns a **contributor record**: a small signed statement that a person delivered a contract, with the date, difficulty and a link to the merged pull request. Contractor ranks (A to S++, see [departments.md](departments.md)) are counted from these records. Records are public on the website's [Verify page](https://hound-protocol.github.io/Joint-Operations/#/verify), and anyone can check them.

Hand-written and AI-assisted work earn the same record. What counts is that the contract's acceptance criteria are met and the work passed review.

## What a record looks like
```json
{
  "id": "HP-0001",
  "kind": "contract",
  "login": "github-user",
  "name": "Display name (optional)",
  "contract": "C13",
  "title": "Summarize networking playbook in our own words",
  "difficulty": "basic",
  "pr": 12,
  "commit": "full 40-character SHA (optional)",
  "date": "2026-10-22",
  "key": "hp-2026",
  "sig": "base64 Ed25519 signature"
}
```

## How signing works
- The project has an **Ed25519 signing key**. Its public half is published in `site/data/records-key.json` and shown on the Verify page with its fingerprint.
- The signature covers every field except `sig`, written as compact JSON with sorted keys in UTF-8. Changing any field, even one character, breaks the signature.
- The **private key stays on the signer's own machine**: never committed, never pasted into chat, never stored as a GitHub secret. A leaked key is replaced with a new key ID, and records are re-signed.
- Records live in the repository (`site/data/records.json`), so their history is public in git as well.

## Checking a record
- **On the website:** the Verify page checks every record in your browser. You can also paste a record someone shared with you.
- **On the command line:** `python3 tools/records.py verify` checks all records. CI runs it on every pull request, so a bad record can't be merged.
- Older browsers without Ed25519 support in Web Crypto show "Can't check in this browser". The records are still checked in CI.

## Issuing a record (project lead or signer)
One-time setup on the signer's machine:
```
pip install --user cryptography
python3 tools/records.py keygen --key-id hp-2026
```
This writes the private key to `~/.config/hound-protocol/records-hp-2026.key` (readable only by you) and adds the public key to `site/data/records-key.json`. Back up the private key offline. Commit the public key file through a pull request.

For each completed contract, after its pull request is merged:
```
python3 tools/records.py add --login <github-user> --contract C07 --pr <number> --commit <merge sha>
```
Title and difficulty come from the contract specs. Then open a pull request with the updated `site/data/records.json`.

## Rules
- One record per person per contract. Shared contracts get one record for each contributor.
- Records are never deleted. A record issued by mistake is replaced by a new record and noted in the pull request.
- Records carry no money value. If donations open later, any payout rules will be published separately, and records are how contributions will be counted.
