# 0015: AI agents are contractors' tools, and every use is credited
Status: Accepted · Date: 2026-10-22 · Deciders: project lead · Amends: [ADR 0013](0013-chain-of-command.md), [governance](../governance.md)

## Context
Claude, an AI agent, was listed as the project's technical lead. An agent cannot hold accounts, accountability or authority, and the project lead wants every piece of work to show who did it and with what.

## Decision
1. **Claude is a contractor**, listed in the Contractor Department as an AI agent used by the project lead. It holds no seat, no keycard above LV3 and no authority over anyone ([HP-POL-007](../guides/HP-POL-007-chain-of-command.md)).
2. **The technical lead is a person.** It is an open Development seat.
3. **Work done with an agent is credited to the person who did it, with the agent named as their tool.** Example: "Forge77, with Claude". The person is responsible for the work, as with any other tool.
4. **Detection is automatic.** Agents mark their commits with trailers such as `Co-Authored-By: Claude <noreply@anthropic.com>`. `tools/agents.py` reads them:
   - When a pull request is merged, the attribution workflow labels it `agent: <name>` and posts a short credit comment.
   - When a contributor record is signed, `tools/records.py` adds `assisted: ["Claude"]` from the pull request's commits. The website shows "with Claude" on the record and the contributor wall.
5. Contributors also say which agent they used in the pull request template. Leaving trailers out on purpose is a breach of the AI Use Policy ([HP-POL-002](../guides/HP-POL-002-ai-use-policy.md)).

## Consequences
- Grades and records count for the person, not the agent. Agents are never graded.
- Research notes previously signed "Claude (technical lead)" now read "TrueMan, with Claude".
- The Discord role `LV5 · Technical Lead` is for the human technical lead.
