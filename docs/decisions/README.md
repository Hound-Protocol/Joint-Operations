# Decision records

Each significant decision gets a short record: context, the decision, and its consequences. Records are never deleted. A changed decision gets a new record that **supersedes** the old one.

Status values: **Proposed** (waiting for the project lead), **Accepted**, **Superseded**, **Rejected**.

| # | Decision | Status |
|---|---|---|
| [0001](0001-multiplayer-scope.md) | Joint Operations is a multiplayer mod that brings online functionality into the single-player world | Accepted |
| [0002](0002-integration-strategy.md) | Build on the engine's own multiplayer layer first; own netcode as fallback | Proposed |
| [0003](0003-transport.md) | Steam networking through the game's Steam API; open-source GNS for direct connections | Proposed |
| [0004](0004-loader.md) | Native code ships as an IHHook-compatible plugin, with a standalone proxy fallback | Proposed |
| [0005](0005-license.md) | Code GPL-3.0-only with a Steamworks/MGSV linking permission; docs CC BY-SA 4.0; brand reserved | Accepted |
| [0006](0006-no-konami-services.md) | Never use Konami online services; matchmaking by Steam or our own server | Accepted |
| [0007](0007-host-authority.md) | The host is authoritative; other players join as clients | Accepted |
| [0008](0008-browser-launch.md) | Server browser on the website and one-click join, Battlelog-style: session registry API, `jointops://` launcher, straight to equipment, then deploy | Proposed |
| [0009](0009-departments-and-ranks.md) | Four departments (Administration, Development, Quality, Contractor), contractor grades E to S++, 0.1 built by the project lead | Accepted |
| [0010](0010-funding.md) | Donations open at version 0.1, through a fiscal host | Accepted |
| [0011](0011-keycard-access.md) | Keycard access levels LV1 to LV7, GitHub teams as the source, server-side checks, matching Discord roles | Accepted (sign-in part live via ADR 0017) |
| [0012](0012-shared-alert.md) | One session detection status (Hidden, Searching, Detected); spotted players join it, others stay hidden; per-outpost phases underneath (proposed) | Accepted, revised |
| [0013](0013-chain-of-command.md) | Chain of command: social, technical and organizational authority, open communication, transparency | Accepted |
| [0014](0014-quiet-until-0-1.md) | Quiet development until 0.1: no promotion, quiet recruiting, public launch with 0.1 | Accepted |
| [0015](0015-ai-agents-and-attribution.md) | AI agents are contractors' tools; work credited to the person with the agent named, detected from commit trailers | Accepted |
| [0016](0016-accountability.md) | Accountability: infractions for contributors and role holders, three suspend, no time limits, appeals | Accepted |
| [0017](0017-hound-id-sign-in.md) | Hound ID proof with the holder's SSH signing key; GitHub sign-in with restricted documents in private repositories (live since v0.0.22) | Accepted |

## Template
```
# NNNN: Title
Status: Proposed · Date: YYYY-MM-DD · Deciders:

## Context
## Decision
## Consequences
## Alternatives considered
```
