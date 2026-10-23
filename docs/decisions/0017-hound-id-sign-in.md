# 0017: Hound ID proof and sign-in
Status: Accepted, live since v0.0.22 · Date: 2026-10-23 · Deciders: project lead

## Context
Staff cards ([ADR 0011](0011-keycard-access.md), [contributor records](../contributor-records.md)) are public and signed. Anyone can check that a card is real, but anyone can also copy one, so a card alone does not show **who is holding it**. The project lead wants:
1. a unique key that only the card holder owns and can use to show others they are who they claim to be;
2. sign-in tied to the Hound ID, so people see the documents their clearance allows.

The website is static (GitHub Pages). Everything in the public repository can be read by anyone, so hiding documents in the browser protects nothing.

## Decision
### 1. Owner key: the holder's SSH signing key
- A Hound ID is proven by signing a fresh challenge with an **SSH signing key** on the GitHub account the card is tied to (by account number, which never changes).
- The checker gets a one-time challenge on the Verify page and sends it to the person. The person signs it on their own computer (`ssh-keygen -Y sign -n hound-id`) and sends back the signature. The page checks it in the browser against the account's signing keys published by GitHub. The private key never leaves the holder's computer, and nobody sends a password or token.
- A card can **pin** one key by its fingerprint (`records.py staff-pin`). Then only that key passes, even if someone adds another key to the GitHub account.
- Supported: ed25519, RSA (rsa-sha2-256/512) and ECDSA P-256/P-384 keys.

### 2. Sign-in: GitHub, with restricted documents in a private repository
- People sign in with **GitHub**. Their keycard comes from the GitHub organization teams, as in ADR 0011.
- Documents above LV1 live in a **private repository**, organized by clearance. The website fetches them **with the reader's own GitHub sign-in**, so GitHub decides who can read what: real protection, not hiding.
- GitHub's sign-in needs one small server step (exchanging the sign-in code for a token, which needs the app's secret). This is a tiny relay (for example a Cloudflare Worker) that keeps the secret and nothing else: no database, no logs of tokens. The token stays in the reader's browser for the session only.
- The project lead creates the GitHub OAuth app and the relay. The secret lives only in the relay's settings, never in the repository or a chat ([HP-POL-004](../guides/HP-POL-004-security-policy.md)).
- Profiles show the person's keycard.

## Update 2026-10-23 (v0.0.26)
- The GitHub App is now **Hound ID Sign-in**, owned by the Hound-Protocol organization.
- The website grants a staff card's level only once its signature verifies against the published records key; an edited `staff.json` cannot raise anyone's clearance.
- Restricted documents also appear in the Library as drawers per clearance, with *Access denied* above your level.

## Update 2026-10-23 (v0.0.27)
- **Owner card:** organization owners get LV7 from GitHub itself (the app's read-only Members permission), as ADR 0011 intended. No file can fake it.
- **Guest passes:** the owner can grant a 24-hour LV3 pass, link only. The relay signs and checks it and reads `hp-staff` for the guest with the app's own read-only token ([setup](../signin.md)).

## Consequences
- Verify gets keycards, profiles (`#/verify/HND-NNNN`) and a "Prove a Hound ID" panel. Staff add an SSH signing key on GitHub ([HP-GDE-009](../guides/HP-GDE-009-grades-records-hound-ids.md)).
- The private documents repository and its team access must be kept tidy, like the teams themselves ([HP-SOP-007](../guides/HP-SOP-007-onboarding-offboarding.md)).
- The privacy notice must cover sign-in before it goes live.
- When the API server arrives (ADR 0008), it can take over the relay's job.

## Alternatives considered
- **Passkeys:** easy for non-developers, but need either a server or a manual step to record each public key. Can be added later.
- **Hide documents in the browser only:** rejected, anyone can read them in the repository.
- **Wait for the API server:** rejected for documents, which only need GitHub's own access control.
