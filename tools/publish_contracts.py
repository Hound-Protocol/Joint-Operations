#!/usr/bin/env python3
"""Publish the planned contracts in site/data/contracts.json as GitHub issues.

Creates the labels it needs, then one issue per contract with the goal,
deliverable, acceptance checklist and background links. Dependencies are
written as "Depends on #N" so the website's contract board can read them.
Safe to re-run: contracts whose "[Cxx]" issue already exists are skipped.
Contracts with status "done" are not published.

Uses the GitHub CLI (gh), already logged in with access to the repository.

Usage:
  python3 tools/publish_contracts.py            # show what would be created
  python3 tools/publish_contracts.py --apply    # create labels and issues
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = json.loads((ROOT / "site/data/config.json").read_text(encoding="utf-8")).get("repo", "Hound-Protocol/Joint-Operations")
SITE = "https://hound-protocol.github.io/Joint-Operations/"
MODULES = {"launcher": "Launcher / Injector", "hooks": "Game Hooks", "session": "Session / Host", "net": "Networking", "modapi": "Mod API",
           "lobby": "Lobby App", "web": "Web", "docs": "Docs", "testing": "Testing", "legal": "Legal"}
LABEL_COLORS = {"contract": "c9a24a", "module": "4a6b7a", "difficulty:easy": "7fbf8a", "difficulty:medium": "e3c45a", "difficulty:hard": "d77a6e", "core": "e9edee"}
DIFF = {"easy": "Easy (anyone)", "medium": "Medium (rank A+)", "hard": "Hard (rank S)"}


def gh(*args, body=None):
    cmd = ["gh", "api", *args]
    r = subprocess.run(cmd, input=json.dumps(body) if body is not None else None, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"gh api {' '.join(args)} failed: {r.stderr.strip()[:300]}")
    return json.loads(r.stdout) if r.stdout.strip() else None


def issue_body(c, numbers, docs):
    lines = [f"Module: {MODULES.get(c['module'], c['module'])}", f"Difficulty: {DIFF[c['difficulty']]}" + (" · Core: Development Department only" if c.get("core") else ""), f"Effort: {c.get('effort', '')}", f"Skills: {c.get('skills', '')}"]
    deps = [f"#{numbers[d]}" if d in numbers else d for d in c.get("depends") or []]
    if deps:
        lines.append("Depends on " + ", ".join(deps))
    lines += ["", "## Goal", c.get("goal", ""), ""]
    if c.get("deliverable"):
        lines += ["## Deliverable", c["deliverable"], ""]
    lines += ["## Definition of done"] + [f"- [ ] {a}" for a in c.get("acceptance") or []]
    refs = []
    for r in c.get("refs") or []:
        if r.startswith("phase1:"):
            refs.append(f"[{r.split(':', 1)[1]}]({SITE}#/docs/phase1)")
        elif r in docs:
            refs.append(f"[{r}]({SITE}#/docs/{r})")
    if refs:
        lines += ["", "Background: " + ", ".join(refs)]
    lines += ["", f"Spec: docs/contracts.md ({c['id']}). How contracts work: CONTRIBUTING.md."]
    return "\n".join(lines)


def main():
    apply = "--apply" in sys.argv
    contracts = [c for c in json.loads((ROOT / "site/data/contracts.json").read_text(encoding="utf-8"))["contracts"] if c.get("status") != "done"]
    docs = {d["id"] for d in json.loads((ROOT / "site/data/docs.json").read_text(encoding="utf-8"))["docs"]}
    print(f"Repository: {REPO}  ({'APPLY' if apply else 'DRY RUN: nothing will change'})\n")

    have = {l["name"] for l in gh(f"repos/{REPO}/labels?per_page=100")}
    want = {"contract"} | {f"module:{c['module']}" for c in contracts} | {f"difficulty:{c['difficulty']}" for c in contracts} | ({"core"} if any(c.get("core") for c in contracts) else set())
    for name in sorted(want - have):
        print(f"  create label  {name}")
        if apply:
            gh(f"repos/{REPO}/labels", "--method", "POST", "--input", "-",
               body={"name": name, "color": LABEL_COLORS.get(name, LABEL_COLORS.get(name.split(":")[0], "6b6b6b"))})

    existing = gh(f"repos/{REPO}/issues?labels=contract&state=all&per_page=100") or []
    numbers = {}
    for i in existing:
        t = i.get("title", "")
        if t.startswith("[C") and "]" in t:
            numbers[t[1:t.index("]")]] = i["number"]

    # Dependencies first, so later issues can link to their numbers
    order, placed = [], set(numbers)
    pending = [c for c in contracts if c["id"] not in numbers]
    while pending:
        ready = [c for c in pending if all(d in placed or d not in {x['id'] for x in pending} for d in c.get("depends") or [])]
        if not ready:
            ready = pending[:1]
        for c in ready:
            order.append(c); placed.add(c["id"]); pending.remove(c)

    for c in contracts:
        if c["id"] in numbers:
            print(f"  exists        [{c['id']}] #{numbers[c['id']]}")
    for c in order:
        title = f"[{c['id']}] {c['title']}"
        print(f"  create issue  {title}")
        if apply:
            labels = ["contract", f"module:{c['module']}", f"difficulty:{c['difficulty']}"] + (["core"] if c.get("core") else [])
            r = gh(f"repos/{REPO}/issues", "--method", "POST", "--input", "-",
                   body={"title": title, "body": issue_body(c, numbers, docs), "labels": labels})
            numbers[c["id"]] = r["number"]
    print("\nDone." if apply else "\nDry run complete. Run again with --apply to create them.")


if __name__ == "__main__":
    main()
