#!/usr/bin/env python3
"""Put every piece of work on the contract board, and check it off when it is done.

All work goes through the board, whoever does it: contractors, staff, the owner, or the owner with an AI agent.
A card shows who is working on it while it is in progress, and who completed it (with any AI agent named) once done.
Edits site/data/contracts.json and regenerates docs/contracts.md. See docs/guides/HP-SOP-003-release.md.

Usage:
  python3 tools/work.py list [--open]
  python3 tools/work.py add --title "Short title" --module web [--difficulty easy|medium|hard] [--goal TEXT]
                            [--deliverable TEXT] [--accept "criterion" ...] [--id F07]
  python3 tools/work.py start ID --login GITHUB_NAME [--agent Claude]
  python3 tools/work.py done  ID --login GITHUB_NAME [--agent Claude]
  python3 tools/work.py drop  ID --login GITHUB_NAME          (stop working on it, without finishing)
"""
import argparse, datetime, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "site/data/contracts.json"
MODULES = ("launcher", "hooks", "session", "net", "modapi", "lobby", "web", "docs", "testing", "legal")
LOGIN = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")


def load():
    return json.loads(SRC.read_text(encoding="utf-8"))


def save(d):
    d["updated"] = datetime.date.today().isoformat()
    SRC.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, str(ROOT / "tools/contracts_md.py")], check=True, stdout=subprocess.DEVNULL)


def find(d, cid):
    c = next((x for x in d["contracts"] if x["id"].upper() == cid.upper()), None)
    if not c:
        sys.exit(f"No contract {cid}.")
    return c


def person(a):
    if not LOGIN.match(a.login):
        sys.exit("--login must be a GitHub user name.")
    return a.login


def cmd_list(a):
    for c in load()["contracts"]:
        st = c.get("status", "planned")
        if a.open and st == "done":
            continue
        who = ", ".join(c.get("working") or []) if st != "done" else ", ".join(c.get("by") or [])
        print(f"{c['id']:5} {st:8} {c['title'][:60]:60} {who}")


def cmd_add(a):
    d = load()
    if a.module not in MODULES:
        sys.exit(f"--module must be one of {', '.join(MODULES)}")
    cid = a.id or "F%02d" % (max([int(x["id"][1:]) for x in d["contracts"] if re.fullmatch(r"F\d+", x["id"])] + [0]) + 1)
    if any(x["id"] == cid for x in d["contracts"]):
        sys.exit(f"{cid} exists already.")
    c = {"id": cid, "title": a.title, "module": a.module, "difficulty": a.difficulty, "skills": a.skills or "", "depends": [],
         "goal": a.goal or "", "deliverable": a.deliverable or "", "acceptance": a.accept or [], "refs": [], "kind": "work"}
    d["contracts"].append(c)
    save(d)
    print(f"Added {cid}: {a.title}")


def cmd_start(a):
    d = load(); c = find(d, a.id); who = person(a)
    if c.get("status") == "done":
        sys.exit(f"{c['id']} is done already.")
    c["working"] = sorted(set((c.get("working") or []) + [who]), key=str.lower)
    if a.agent:
        c["agents"] = sorted(set((c.get("agents") or []) + [a.agent]))
    c["status"] = "claimed"
    save(d)
    print(f"{c['id']}: {who} is working on it")


def cmd_done(a):
    d = load(); c = find(d, a.id); who = person(a)
    c["by"] = sorted(set((c.get("by") or []) + (c.get("working") or []) + [who]), key=str.lower)
    if a.agent:
        c["agents"] = sorted(set((c.get("agents") or []) + [a.agent]))
    c.pop("working", None)
    c["status"] = "done"
    c["completed"] = datetime.date.today().isoformat()
    save(d)
    print(f"{c['id']}: done by {', '.join(c['by'])}" + (f" with {', '.join(c['agents'])}" if c.get("agents") else ""))


def cmd_drop(a):
    d = load(); c = find(d, a.id); who = person(a)
    c["working"] = [x for x in (c.get("working") or []) if x.lower() != who.lower()]
    if not c["working"]:
        c.pop("working")
        if c.get("status") == "claimed":
            c.pop("status")
    save(d)
    print(f"{c['id']}: {who} stopped")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    l = sub.add_parser("list"); l.add_argument("--open", action="store_true")
    ad = sub.add_parser("add"); ad.add_argument("--title", required=True); ad.add_argument("--module", required=True)
    ad.add_argument("--difficulty", default="medium", choices=("easy", "medium", "hard")); ad.add_argument("--goal"); ad.add_argument("--deliverable")
    ad.add_argument("--skills"); ad.add_argument("--accept", action="append"); ad.add_argument("--id")
    for name in ("start", "done", "drop"):
        s = sub.add_parser(name); s.add_argument("id"); s.add_argument("--login", required=True)
        if name != "drop":
            s.add_argument("--agent")
    a = p.parse_args()
    {"list": cmd_list, "add": cmd_add, "start": cmd_start, "done": cmd_done, "drop": cmd_drop}[a.cmd](a)
