# Working with AI Assistants
Code: HP-GDE-018 · Version 1.0 · Effective 2026-10-23 · Owner: Development · For: contributors using Claude, ChatGPT, Gemini or similar tools

AI assistants are welcome at Hound Protocol. Used well, they make you faster and help you learn. Used badly, they produce work that looks right and is not. This guide shows how to get quality work out of them and how to submit it correctly. The rules themselves are in the [AI Use Policy](HP-POL-002-ai-use-policy.md); this guide is the practice.

## 1. The three rules that never change
1. **You are the author.** You must understand what you submit well enough to explain and fix it. "The AI wrote it" is never an answer in review.
2. **No AI art.** Images, textures, icons, logos, music, sound and voices made by an image or audio model are not accepted. AI may operate tools (lay out a design, draw an SVG in code), but not generate art.
3. **Nothing private or copied goes in.** Never paste game files, extracted scripts, other mods' code, tokens, passwords, keys or other people's personal data into an AI tool ([HP-POL-003](HP-POL-003-clean-room-and-ip.md), [HP-POL-004](HP-POL-004-security-policy.md)).

## 2. Which tool for what
Any capable assistant works. Use what you have; what matters is how you check the result.

| Tool | Good at | Watch out for |
|---|---|---|
| **Claude** (claude.ai, Claude Code) | Long documents, careful code changes across several files, following project rules you give it, working in your repository with Claude Code | Give it our policies and the contract text; check facts against sources |
| **ChatGPT** | Explaining concepts, quick code drafts, rewriting text | Confident answers on niche topics (MGSV internals, Fox Engine) that may be invented |
| **Gemini** | Searching and summarizing public pages, long inputs | Summaries that blend sources; open the source and check |

For anything about the game's internals, every assistant is weak: there is little public information, and they fill gaps by guessing. Treat every claim as **unknown** until a real source or a test confirms it.

## 3. A good working loop
1. **Start from the contract.** Paste the contract's goal, deliverable and acceptance criteria. Tell the assistant which rules apply: "clean-room, our own words, cite sources, no game files".
2. **Give it context, not secrets.** Paste the relevant file from our repository, the error message, or our style guide ([HP-GDE-005](HP-GDE-005-documentation-style.md)). Describe game behaviour in your own words.
3. **Ask for small steps.** One function, one section, one test at a time is easier to check than a whole feature.
4. **Ask it to explain.** "Why this approach? What could go wrong? What did you assume?" If you cannot follow the explanation, you are not ready to submit it.
5. **Check every result** (section 4). Then iterate.
6. **Write the final version yourself where it matters**: the pull request description, the summary of a research note, any decision text.

### Prompts that work
- *"Here is our contract and acceptance criteria. Propose a plan in steps before writing code. List what you are unsure about."*
- *"Review this pull request against these criteria. Point out bugs, missing tests and unclear names. Do not rewrite it."*
- *"Rewrite this guide section in plain English, short sentences, active voice. Keep every fact and link; do not add new claims."*
- *"Summarize this public page in your own words, with the URL, and mark each claim confirmed, likely or unknown."*

## 4. Checking the work (the part that earns your grade)
| You made | Check before you submit |
|---|---|
| **Code** | It builds; you ran it; the project's checks pass locally ([Quick Start](HP-GDE-003-contributor-quick-start.md)); tests cover the acceptance criteria; no copied code from other mods or leaked sources; no secrets in it |
| **Documentation** | Every link works (`python3 tools/check_links.py`); facts match the repository; it follows the style guide; no invented features or numbers |
| **Research** | Every claim has a real source you opened yourself; the text is in your own words; confidence is marked; no game files quoted |
| **Tests and reports** | Steps reproduce on your machine; versions and logs are real, not generated |

Common AI mistakes to look for: invented functions or APIs, links to pages that do not exist, version numbers that are wrong, "fixes" that silence an error instead of solving it, and text that sounds right but says nothing.

## 5. Submitting AI-assisted work
1. Open the pull request as usual ([GitHub Basics](HP-GDE-014-github-basics.md)), with sign-off on every commit.
2. In the pull request template, tick **AI-assisted** and name the tool and its part in one line, for example: *"Claude, for the parser and its tests; I wrote the docs."* You do not need to share your prompts.
3. If the tool made the commits (for example Claude Code), **keep its commit trailers** such as `Co-Authored-By: Claude <noreply@anthropic.com>`. Removing them on purpose breaks the policy.
4. Answer review comments yourself. Use the assistant to help, but the reply and the fix are yours.

What happens next: the checks detect the agent, the merged pull request gets an `agent:` label, and your signed record reads "your name, with Claude" (or the tool you used). **Your grade and credit are the same as for hand-written work** ([ADR 0015](https://github.com/Hound-Protocol/hound-protocol-web/blob/main/docs/decisions/0015-ai-agents-and-attribution.md)). Disclosure never lowers your credit.

## 6. Quick checklist
- [ ] I understand every line and can explain it.
- [ ] I ran it and the checks pass.
- [ ] No game files, other mods' code, secrets or personal data went into the tool or the pull request.
- [ ] No AI-generated images, music or voices.
- [ ] Facts are checked against real sources.
- [ ] **AI-assisted** is ticked and the tool is named; agent trailers are kept.
