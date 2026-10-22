# Security policy

Joint Operations runs code inside a game on players' computers and talks to other players over the network. Security problems matter.

## Reporting
Do **not** open a public issue for a security problem. Use GitHub's private vulnerability reporting on this repository (Security tab, "Report a vulnerability").

Please include what is affected, how to reproduce it, and the impact. We aim to reply within 7 days.

## In scope
- Ways for another player to run code, crash, or read files on someone's computer through the mod
- Exposure of IP addresses or Steam data beyond what joining a session needs
- Problems in release builds or the build pipeline

## Out of scope
- Problems in the game itself, Steam, or other mods
- Cheating within a session you host

## Releases
Only binaries built by GitHub Actions from this repository are official. Check the SHA-256 checksums published with each release.
