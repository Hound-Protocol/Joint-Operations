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
| [0007](0007-host-authority.md) | Host (Venom Snake) is authoritative; players join as Mother Base soldiers | Accepted |
| [0008](0008-browser-launch.md) | Join from the website in stages: Steam invite links first, our `jointops://` launcher second, session browser last | Proposed |

## Template
```
# NNNN: Title
Status: Proposed · Date: YYYY-MM-DD · Deciders:

## Context
## Decision
## Consequences
## Alternatives considered
```
