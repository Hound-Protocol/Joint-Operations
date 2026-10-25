#!/usr/bin/env python3
"""Generate docs/contracts.md from data/contracts.json.

Usage:
  python3 tools/contracts_md.py          # write docs/contracts.md
  python3 tools/contracts_md.py --check  # fail if docs/contracts.md is out of date
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data/contracts.json"
OUT = ROOT / "docs/contracts.md"
DIFF = {"easy": ("🟢 Easy", ""), "medium": ("🟡 Medium", ""), "hard": ("🔴 Hard", "")}


def ref_link(ref, docs):
    if ref.startswith("phase1:"):
        return f"[{ref.split(':', 1)[1]}](phase1-research-plan.md)"
    path = docs.get(ref)
    if not path:
        return ref
    rel = ("../" + path) if not path.startswith("docs/") else path[len("docs/"):]
    return f"[{ref}]({rel})"


def render():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    docs = {d["id"]: d["path"] for d in json.loads((ROOT / "data/docs.json").read_text(encoding="utf-8"))["docs"]}
    out = ["# Contract specs", "",
           "Generated from `data/contracts.json` by `tools/contracts_md.py`. Edit the JSON, then run the tool.", "",
           "Every contract has a goal, a deliverable and acceptance criteria. The Quality Department checks each criterion before merging. "
           "Difficulty (Easy, Medium, Hard) tells you how demanding a contract is. It is information only: anyone can take any contract. Core contracts are on the 0.1 critical path and reserved for the Development Department. "
           "Each completed contract earns points toward the contractor's grade in its field (E to S++). "
           "See [Contributing](../CONTRIBUTING.md) and [departments.md](departments.md).", "",
           "Version 0.1 is built by the project lead. These contracts open to contractors after 0.1. "
           "Foundation work (IDs starting with F) is everyone's current work on the project, the owner's and AI-assisted work included: "
           "it goes on the board when it starts and is checked off when it is done (`tools/work.py`, [HP-SOP-003](guides/HP-SOP-003-release.md)).", "",
           "| ID | Contract | Module | Difficulty | Depends on | Status | People |", "|---|---|---|---|---|---|---|"]
    cs = data["contracts"]
    for c in cs:
        who = ", ".join(c.get("by") or []) if c.get("status") == "done" else ", ".join(c.get("working") or [])
        if who and c.get("agents"):
            who += " (with " + ", ".join(c["agents"]) + ")"
        out.append(f"| {c['id']} | {c['title']} | {c['module']} | {DIFF[c['difficulty']][0]}{' · Core' if c.get('core') else ''} | {', '.join(c.get('depends') or []) or '—'} | {c.get('status', 'planned')} | {who or '—'} |")
    for c in cs:
        out += ["", f"## {c['id']}", f"**{c['title']}**  ", f"Module: {c['module']} · Difficulty: {DIFF[c['difficulty']][0]}{' (Core: Development Department)' if c.get('core') else ''} · Skills: {c.get('skills', '')}"
                + (f" · Depends on: {', '.join(c['depends'])}" if c.get("depends") else ""), ""]
        if c.get("goal"):
            out += [f"**Goal.** {c['goal']}", ""]
        if c.get("deliverable"):
            out += [f"**Deliverable.** `{c['deliverable']}`" if "/" in c["deliverable"] and " " not in c["deliverable"] else f"**Deliverable.** {c['deliverable']}", ""]
        if c.get("acceptance"):
            out += ["**Acceptance criteria**"] + [f"- {a}" for a in c["acceptance"]]
        if c.get("refs"):
            out += ["", "Background: " + ", ".join(ref_link(r, docs) for r in c["refs"])]
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    text = render()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            sys.exit("docs/contracts.md is out of date. Run: python3 tools/contracts_md.py")
        print("docs/contracts.md is up to date.")
    else:
        OUT.write_text(text, encoding="utf-8")
        print(f"Wrote {OUT.relative_to(ROOT)}")
