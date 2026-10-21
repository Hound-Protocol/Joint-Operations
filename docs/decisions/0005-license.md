# 0005: Project license
Status: Proposed · Date: 2026-10-21 · Deciders: project lead

## Context
The lead wants: anyone may fork, nobody may claim the work as their own. The draft chose GPL-3.0. Our native code will call the proprietary Steamworks SDK and run inside the game, which a plain GPL-3.0 likely does not permit. See `research/legal-landscape.md`.

## Options
1. **GPL-3.0 plus an additional permission** (section 7) allowing linking with the Steamworks SDK and with Metal Gear Solid V. Forks stay open. *(recommended)*
2. **MPL-2.0:** changes to our files stay open; combining with proprietary parts is allowed. Simpler legally.
3. **MIT:** maximum freedom; forks may close their changes.

All options require keeping copyright and license notices, so nobody can lawfully claim the work as their own.

## Decision
Pending. Until decided, the LICENSE file stays a placeholder and no binaries are published.
