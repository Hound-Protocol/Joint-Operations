# AI Use Policy: Code and Mod Content
Code: HP-POL-002 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Applies to: all contributions

## 1. Position
Hound Protocol welcomes AI-assisted work. The technical lead is an AI assistant. Hand-written and AI-assisted contributions are reviewed the same way and earn the same records and ranks. **What counts is that the work is correct, original, licensed and checked.**

## 2. You are responsible
- You are the author of what you submit, whatever tools you used. You must understand it well enough to explain and fix it.
- Run it, test it, and check it against the contract's acceptance criteria before you open a pull request.
- "The AI wrote it" is never an answer in review.

## 3. Disclosure
- Tick **AI-assisted** in the pull request template when AI tools wrote or substantially changed code, text or content in the pull request.
- Name the tool in one line (for example "Claude, for the parser and tests"). You do not need to share prompts.
- Disclosure never lowers your credit. It helps reviewers know where to look.

## 4. Code
| Allowed | Not allowed |
|---|---|
| Generating, refactoring and explaining code | Asking an AI to reproduce code from another mod, a leaked source or a decompiled game binary |
| Writing tests, tools and documentation | Submitting code you have not run |
| Translating our own notes into code | Code that touches Konami's servers, FOBs or anti-cheat |
| Summarizing public documentation in our own words | Pasting game files, extracted scripts or secrets into an AI tool |

- AI output must pass the same checks as any code: CI, review by Quality, and tests where the contract asks for them.
- Do not include large generated files (lockfiles aside) without a reason in the pull request.

## 5. Mod content (images, audio, text, models)
- **Original content only.** AI-generated art, audio or text must not imitate Konami's assets, characters' likeness, logos, or the voices of real actors.
- **No voice cloning** of real people, including the game's cast.
- AI content must be labeled as AI-generated in its pull request and, for released content, in the credits file.
- The project lead may refuse AI content that would harm the project's standing, even if it breaks no rule.

## 6. Data and privacy
- Never paste into an AI tool: tokens, keys, passwords, private messages, players' personal data, or unreleased security reports.
- Game files and extracted assets stay on your machine. Describe them in your own words instead.

## 7. Documentation and research
- Research notes must cite real sources. Check every claim an AI gives you against the source, and mark confidence (confirmed, likely, unknown).
- AI summaries of other projects must not copy their text or code.

## 8. Breaches
Unreviewed or copied AI output is treated like any other copied or broken work under [HP-POL-001](HP-POL-001-contributor-policy.md) and [HP-POL-003](HP-POL-003-clean-room-and-ip.md).
