# 0020: Certificates of service
Status: Accepted · Date: 2026-10-23 · Deciders: project lead

## Context
Contributors want proof of their work they can show others: an employer, a school, a portfolio. Each completed contract already earns a signed record (ADR 0009, HP-SOP-004). Open Badges 3.0 was considered; its official certification needs a paid 1EdTech membership, so we build our own certificate first, on the same signing key.

## Decision
- A **certificate of service** (`HPC-NNNN`) is a signed summary of one person's work: every signed record, points and grades per field, the overall grade, clearance at issue, AI tools credited, an optional statement, and the period covered.
- It is issued by the owner with `python3 tools/records.py certify --login NAME`, signed with the records key on the owner's computer, and published in `data/certificates.json`.
- Anyone can check it at `#/verify/HPC-NNNN`: the page checks the certificate's signature and the signature of every record it lists, in the browser. Changing any line breaks the check. It prints or saves as PDF on A4.
- A new certificate can be issued as work grows; old ones stay valid for the period they cover. A certificate is never deleted: it is revoked (`records.py certificate-revoke`) and shows as revoked.
- The signed bytes are the certificate without `sig`, keys sorted at every depth, no spaces, UTF-8, the same in Python and JavaScript.
- Open Badges 3.0 export can be added later on the same data; certification stays optional.

## Consequences
- Certificates are public, like records: name, GitHub account, contracts and grades. A person can ask for theirs to be revoked.
- CI verifies every certificate on every pull request (`records.py verify`).
- Certificates can only be issued once the records key exists.
