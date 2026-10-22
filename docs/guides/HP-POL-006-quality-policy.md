# Quality Policy
Code: HP-POL-006 · Version 1.0 · Effective 2026-10-22 · Owner: Quality · Applies to: every change and every release

## 1. Principle
Nothing ships because it is finished. It ships because it is **checked**. The Quality Department signs off every contract and every release.

## 2. Definition of done for a contract
A contract is done when **all** of these are true:
1. Every acceptance criterion in the contract is met, and the reviewer has ticked it.
2. CI is green: data checks, link checks, script checks, browser tests and contributor-record checks.
3. New code has tests where the contract asks for them, and they pass.
4. Docs are updated: anything a user, contributor or admin needs to know is written down.
5. Windows **and** Proton are tested when the change touches the game.
6. The pull request follows [HP-SOP-002](HP-SOP-002-pull-request-review.md), including AI disclosure.

## 3. Release gates
A release may be published only when:
- Its checklist in [HP-SOP-003](HP-SOP-003-release.md) is complete.
- No open bug has severity **S1 (critical)** or **S2 (major)** for that release.
- Quality has tested it on at least one Windows and one Proton machine, with versions recorded.
- For any build that players install: the Steam App ID position is resolved and the license is in place.

## 4. Severity
| Severity | Meaning | Example |
|---|---|---|
| S1 Critical | Data loss, crash on start, security issue | Save damaged, leaked token |
| S2 Major | A core feature fails | Joining a session fails |
| S3 Minor | Works with a workaround | Wrong marker color |
| S4 Cosmetic | Looks wrong, works | Typo, layout gap |

## 5. Measuring
Quality keeps a short report per release: tests run, platforms, open bugs by severity, and what was not tested.
