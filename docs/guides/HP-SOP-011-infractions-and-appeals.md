# Issuing Infractions and Handling Appeals
Code: HP-SOP-011 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · Used by: Development, Administration and the owner

How to apply the [Accountability and Infractions Policy](HP-POL-009-accountability.md) fairly and the same way every time. There are no time limits anywhere in this procedure.

## When main breaks
1. A **Broken main** issue opens automatically when the checks fail on `main`.
2. Make main green first: fix it, or revert the change.
3. Find out why the checks did not stop it:
   - The checks passed and the bug slipped through: **no infraction.** Add a test so it cannot happen again.
   - The checks were skipped, bypassed, ignored or not yet required: go on to the next section.
4. Write what happened on the issue and close it.

## Issuing an infraction
1. **Check it is one.** Read section 3 of HP-POL-009. If it is a first small mistake, write a **note** instead and stop.
2. **Check you may issue it** (HP-POL-009 section 5). If you are involved, hand it to someone else.
3. **Write it down** where it happened (the pull request or issue): what went wrong, the evidence, and which rule it breaks. Be factual and kind.
4. **Record it** with a pull request that runs:
```
python3 tools/infractions.py add --login NAME --track contributor --reason "Merged #123 with failing checks" --evidence https://github.com/Hound-Protocol/Joint-Operations/pull/123 --by YOURNAME
```
Use `--track duty` for role holders.
5. **Tell the person** (mention them and, if possible, a Discord message): the reason, how many active infractions they have, how they clear (five clean deliveries) and how to appeal.
6. **At the second infraction**, ask for a second reviewer on their next work.
7. **At the third**, the tool records a suspension. For a role holder, Administration removes the role and its keycard ([HP-SOP-007](HP-SOP-007-onboarding-offboarding.md)). Send the appeal link.

## Recording clean work
Each merged delivery (contributor track) or completed duty (duty track) by someone with an active infraction is a credit:
```
python3 tools/infractions.py credit --login NAME --track contributor --evidence https://github.com/Hound-Protocol/Joint-Operations/pull/130
```
Five credits clear the oldest active infraction. The tool does this by itself.

## Handling an appeal
1. Appeals arrive as issues (Appeal template) or private messages to Administration.
2. Assign someone one level above the issuer who was not involved. For appeals against Administration, that is the owner.
3. Read the evidence and the person's side. Ask questions in the open where possible.
4. Decide and write the reason on the appeal:
   - **Overturn:**
```
python3 tools/infractions.py overturn --id INF-0003 --reason "Checks were not required yet" --by YOURNAME
```
   - **Reinstate** (lift a suspension, clean slate):
```
python3 tools/infractions.py reinstate --login NAME --track contributor --by YOURNAME --evidence https://github.com/Hound-Protocol/Joint-Operations/issues/140
```
   - **Uphold:** explain why, and that they can appeal again with new information.
5. For a reinstated role holder, Administration restores the role.

## Checking someone's standing
```
python3 tools/infractions.py status --login NAME
```
