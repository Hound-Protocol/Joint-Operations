# Documentation Style Guide
Code: HP-GDE-005 · Version 1.1 · Effective 2026-10-23 · Owner: Administration · For: everyone who writes docs

## Principles
1. **Write for a newcomer.** Assume they are smart, but new to the project.
2. **Plain English.** Short sentences, active voice, common words. Explain jargon once, or link the [glossary](../glossary.md).
3. **One topic per document.** Link rather than repeat.
4. **Facts with sources.** Research claims carry a source and a confidence: confirmed, likely or unknown.
5. **Honest status.** Say what is not done. "Planned for 0.1" beats silence.

## Structure
- Start with a one-line purpose.
- Headings that say what the section is about.
- Tables for comparisons and lists of facts. Numbered lists for steps.
- Code blocks for commands, exactly as typed.
- End research notes with a **Sources** list.

## Handbook documents
| Type | Code | Use for |
|---|---|---|
| Policy | HP-POL-NNN | Rules everyone must follow |
| SOP | HP-SOP-NNN | Step-by-step procedures |
| Guide | HP-GDE-NNN | How-to help for an audience |

Each starts with a title, then one metadata line: `Code · Version · Effective date · Owner department · Audience`. Add its audience and one-line summary to `tools/guides_index.py`, then run `python3 tools/guides_index.py`: it writes `site/data/guides.json`, and the document appears in the website's Handbook with a PDF. Raise the version when the meaning changes (1.0 → 1.1 for small changes, 2.0 for rewrites).

## Words we use
| Use | Not |
|---|---|
| multiplayer mod | co-op mod |
| host, client | Venom Snake player, soldier (for players) |
| Mother Base staff (in-game characters) | soldiers |
| contract, contractor | ticket, freelancer |
| department | team (for the four departments) |
| grade, overall grade | rank (except the Discord role names) |
| detection status | alert, shared alert |
| Documentation, Library, Handbook | Docs page, Guides page |
| unofficial fan project | official, licensed |

## Never
Paste game text or files, copy other projects' docs, promise dates, or name and criticize other mods.
