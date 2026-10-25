# Writing Research Notes
Code: HP-GDE-013 · Version 1.0 · Effective 2026-10-22 · Owner: Development · For: contractors in Architecture Research and anyone writing in research/

Research notes record what we learn about the game, Steam and other tools, in our own words. They are what the code is built on, so they must be accurate, sourced and clean-room ([HP-POL-003](HP-POL-003-clean-room-and-ip.md)).

## File and header
- One topic per file in `research/`, with a short lowercase name, for example `research/alert-system.md`.
- Start with a title and one line of facts:
```
# Alert System
Author: YourName, with Claude (AI agent) · Date: 2026-10-22 · Status: desk research · Game build: 1.0.15.4
```
- Name any AI agent you used, the same way as in commits ([ADR 0015](https://github.com/Hound-Protocol/hound-protocol-web/blob/main/docs/decisions/0015-ai-agents-and-attribution.md)).
- **Status** is one of: desk research (read, not tested), tested on a rig (with the rig and build), or verified (checked by a second person).

## What goes in
1. **Question:** what we want to know and why (link the contract or ADR).
2. **Findings:** short sections, facts first. Mark guesses as guesses.
3. **Evidence:** how you know: a test you ran, a document you read, a log you captured. Enough for someone else to repeat it.
4. **Open questions:** what is still unknown.
5. **Sources:** links to public pages, with what you took from each.

## Clean-room rules
- Write everything in **your own words**. Never paste code, decompiled output or long quotes from other mods or from the game.
- No game files, extracted assets or screenshots of Konami logos in the repository.
- Observing how the game behaves, reading public documentation and reading other projects' public notes are fine. Copying their code is not.
- If you have worked on another MGSV mod's code, say so in the pull request, and do not port it from memory.

## Quality bar
- Short sentences, simple words ([HP-GDE-005](HP-GDE-005-documentation-style.md)).
- Numbers with units and the game build they were measured on.
- Tables for comparisons, numbered steps for procedures.
- Update the note when a later test changes the answer, and say what changed and when.
