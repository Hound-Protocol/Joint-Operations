# Contractor Grades, Records and Hound IDs
Code: HP-GDE-009 · Version 1.2 · Effective 2026-10-23 · Owner: Administration · For: contractors and staff

How your work is counted, how anyone can check it, and how staff prove who they are.

## Grades, like the game's staff grades
You hold a grade from **E** to **S++** in each field, the way staff in the game hold a grade in each unit. The fields are the contract board's columns: Code, Architecture Research, Testing, Design and web, Docs and legal.

Each completed contract earns points in its field: 🟢 Easy **2**, 🟡 Medium **5**, 🔴 Hard **10**.

| Grade | Points | Unlocks |
|---|---|---|
| E | 1 | Contractor role on Discord, listed on the contributor wall |
| D | 4 | |
| C | 8 | |
| B | 14 | Hold two contracts at once |
| A | 22 | Review Easy contracts in this field, as advice to Quality |
| A+ | 32 | Review Medium contracts in this field |
| A++ | 50 | Mentor new contractors in this field |
| S | 80 | Review Hard contracts in this field |
| S+ | 125 | Can be invited into a department |
| S++ | 200 | Candidate for a lead position |

- Your **overall grade** is your best grade. It is your grade role on Discord (named Rank E to Rank S++ there).
- **Commendations** work like medals: Administration can award one for exceptional work. It adds 5 points to every field and is listed publicly.
- Grades never go down. They give no authority over anyone ([HP-POL-007](HP-POL-007-chain-of-command.md)).
- Full rules: [departments.md](../departments.md).

## Contributor records
Every completed contract earns a **signed record**: who delivered which contract, its difficulty, the pull request and the date.
- Records are signed with the project's key (Ed25519). Nobody can fake or edit one without the signature breaking.
- Open **Verify** on the website to see the contributor wall and every record. Your browser checks each signature itself; "Verified" means it is genuine.
- If you used an AI agent, the record says so: "Forge77, with Claude". The credit is yours; the agent is your tool ([ADR 0015](../decisions/0015-ai-agents-and-attribution.md)).

## Hound IDs
Department members get a **Hound ID** (for example HND-0001): a signed staff card with their GitHub account, keycard level and department.
- To check that someone really is staff, open **Verify** and look them up by Hound ID or GitHub name. A revoked card shows as revoked.
- Nobody from Hound Protocol will ever ask for your password or a token, Hound ID or not ([HP-POL-004](HP-POL-004-security-policy.md)).

### Your keycard
Your staff card is shown as a keycard on Verify, with your level, department, Hound ID, grade and your GitHub picture. Its own page is `#/verify/HND-NNNN`.

**Sign in to see it as yours:** click **Sign in** in the website's top bar and sign in with GitHub. Your **Profile** then shows your keycard and the restricted documents your clearance opens. Without a staff card you get a member card (LV2). Details: [Using the Website](HP-GDE-015-using-the-website.md#5-signing-in).

### Prove your Hound ID
A card can be copied, so when someone needs to know it is really you, you sign a challenge with your **SSH signing key** ([ADR 0017](../decisions/0017-hound-id-sign-in.md)).
1. Once: add your public key to GitHub as a **signing key**: Settings → SSH and GPG keys → New SSH key → Key type: **Signing Key**. No key yet? `ssh-keygen -t ed25519`.
2. The person checking you opens Verify → Prove a Hound ID, enters your Hound ID and sends you the challenge.
3. Open Verify → Prove a Hound ID → **Prove it's me**, paste the challenge and run the command shown, for example:
   `printf '%s' 'HOUND-ID PROOF HND-0001 …' | ssh-keygen -Y sign -n hound-id -f ~/.ssh/id_ed25519`
4. Send back everything it prints (from `-----BEGIN SSH SIGNATURE-----` to `-----END SSH SIGNATURE-----`). It is safe to share; your private key never leaves your computer.

The owner can pin one key to your card (`python3 tools/records.py staff-pin --id HND-0001 --ssh-key SHA256:…`, fingerprint from `ssh-keygen -lf ~/.ssh/id_ed25519.pub`). Then only that key proves the card.

Records signers follow [HP-SOP-004](HP-SOP-004-records-and-ranks.md).
