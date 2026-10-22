# Decision records

Each significant decision gets a short record: context, the decision, and its consequences. Records are never deleted. A changed decision gets a new record that **supersedes** the old one.

Status values: **Proposed** (waiting for the project lead), **Accepted**, **Superseded**, **Rejected**.

| # | Decision | Status |
|---|---|---|
| [0001](0001-multiplayer-scope.md) | Joint Operations is a multiplayer mod that brings online functionality into the single-player world | Accepted |
| [0002](0002-integration-strategy.md) | Build on the engine's own multiplayer layer first; own netcode as fallback | Proposed |
| [0003](0003-transport.md) | Steam networking through the game's Steam API; open-source GNS for direct connections | Proposed |
| [0004](0004-loader.md) | Native code ships as an IHHook-compatible plugin, with a standalone proxy fallback | Proposed |
| [0005](0005-license.md) | License that allows linking with Steamworks and the game | Proposed |
| [0006](0006-no-konami-services.md) | Never use Konami online services; matchmaking by Steam or our own server | Accepted |
| [0007](0007-host-authority.md) | The host is authoritative; other players join as clients | Accepted |
| [0008](0008-browser-launch.md) | Server browser on the website and one-click join, Battlelog-style: session registry API, `jointops://` launcher, straight to equipment, then deploy | Proposed |
| [0009](0009-departments-and-ranks.md) | Four departments (Administration, Development, Quality, Contractor), contractor ranks A to S++, 0.1 built by the project lead | Accepted |
| [0010](0010-funding.md) | Donations open at version 0.1, through a fiscal host | Accepted |
| [0011](0011-keycard-access.md) | Keycard access levels LV1 to LV7, GitHub teams as the source, server-side checks, matching Discord roles | Accepted (design) |
| [0012](0012-shared-alert.md) | Enemies target players individually; one shared alert status (hidden, searched for, detected) that players join | Accepted |
| [0013](0013-chain-of-command.md) | Chain of command: social, technical and organizational authority, open communication, transparency | Accepted |

## Template
```
# NNNN: Title
Status: Proposed · Date: YYYY-MM-DD · Deciders:

## Context
## Decision
## Consequences
## Alternatives considered
```
