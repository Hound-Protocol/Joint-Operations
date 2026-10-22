# 0005: Project license
Status: Accepted · Date: 2026-10-22 · Deciders: project lead (choice prepared with Claude, AI agent)

## Context
The lead wants: anyone may fork, nobody may claim the work as their own. The draft chose GPL-3.0. Our native code will call the proprietary Steamworks SDK and run inside the game, which a plain GPL-3.0 likely does not permit. See `research/legal-landscape.md`.

## Options
1. **GPL-3.0 plus an additional permission** (section 7) allowing linking with the Steamworks SDK and with Metal Gear Solid V. Forks stay open. *(recommended)*
2. **MPL-2.0:** changes to our files stay open; combining with proprietary parts is allowed. Simpler legally.
3. **MIT:** maximum freedom; forks may close their changes.

All options require keeping copyright and license notices, so nobody can lawfully claim the work as their own.

## Decision
1. **Code: GPL-3.0-only with an additional permission** (section 7) to link and combine with the Steamworks SDK and with Metal Gear Solid V. Forks must stay open and keep attribution; the mod may still run inside the game and use Steam.
2. **Documentation and text: CC BY-SA 4.0.** Credit is required and changed versions stay open, matching the code.
3. **Brand: all rights reserved.** The names, logos, emblem and avatars are not under the open licenses, so forks cannot pass themselves off as Hound Protocol.

Why not the others: MPL-2.0 keeps only changed files open, so a fork could wrap our work in closed code. MIT lets forks close their changes entirely. Both go against the lead's goal that forks stay open and nobody claims the work as their own.

The summary and the exact permission text are in [LICENSING.md](../../LICENSING.md).

## Consequences
- `LICENSE` holds the GPL-3.0 text. `LICENSES/` holds both license texts.
- Commit sign-off (`git commit -s`) now certifies licensing under these terms (CONTRIBUTING).
- Releases may include binaries once there is something to ship (0.1), with source published alongside.
- Every source file may carry the header `SPDX-License-Identifier: GPL-3.0-only WITH LicenseRef-JO-Steamworks-MGSV-exception`.
- Not legal advice. If the project ever takes donations through a fiscal host (ADR 0010), the host's lawyers should review the exception wording.
