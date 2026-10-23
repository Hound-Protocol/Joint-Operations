# Research

Findings are written in our own words. Sources are recorded with URL and date. No copied third-party code. Each note lists its author, date and the confidence of its claims.

## Index
| Note | Topic | Status |
|---|---|---|
| [game-and-engine.md](game-and-engine.md) | MGSV build, Fox Engine, Lua, engine multiplayer capability | Desk research |
| [launch-and-second-player.md](launch-and-second-player.md) | How the game starts, where our code runs, where a second player can come in (R2, R3 desk part) | Desk research, rig tests planned |
| [state-inventory.md](state-inventory.md) | What a session must keep in sync, by owner and priority (R4 draft) | Draft |
| [modding-ecosystem.md](modding-ecosystem.md) | Infinite Heaven, IHHook, SnakeBite, loading native code | Desk research |
| [steam-networking.md](steam-networking.md) | Steam networking APIs, relay, lobbies, App ID, matchmaking | Desk research |
| [steam-networking-api.md](steam-networking-api.md) | Steam Networking Messages or Sockets for a host-authoritative session (R7 desk part), proposes ADR 0018 | Desk research, spike planned |
| [steam-interfaces.md](steam-interfaces.md) | Reaching current Steam networking from the game's old Steam API (R13) | Desk research, rig test planned |
| [proton.md](proton.md) | Loading the mod under Linux and Proton, Bazzite notes | Desk research |
| [file-formats-and-tools.md](file-formats-and-tools.md) | Archives, formats, extraction tools, Lua knowns and unknowns | Desk research |
| [legal-landscape.md](legal-landscape.md) | EU reverse-engineering law, Konami, license conflicts | Desk research, not legal advice |
| [funding-and-distribution.md](funding-and-distribution.md) | Fiscal hosts, sponsorship, code signing, releases | Desk research |
| [ai-system.md](ai-system.md) | How the enemy AI notices, reports and hunts, and what changes with several players (R15) | Desk research, rig test planned |
| [browser-launch.md](browser-launch.md) | Joining from the website: Steam links, launch arguments, `jointops://` (R14) | Desk research |
| [networking-playbook-summary.md](networking-playbook-summary.md) | Sync models and netcode techniques (R11) | Done |
| [prior-art/dynamite.md](prior-art/dynamite.md) | Study of an existing MGSV multiplayer mod | Done |

## Template for new notes
Full guide: [HP-GDE-013 Writing Research Notes](../docs/guides/HP-GDE-013-research-notes.md).
```
# Title
Author: · Date: · Game build: · Status:

## Question
## Findings (each with confidence: confirmed / likely / unknown)
## What this means for us
## Sources
```
