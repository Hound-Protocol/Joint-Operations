#!/usr/bin/env python3
"""Keep the infraction record for contributors and role holders (HP-POL-009, ADR 0016).

An infraction is a written record that someone broke the quality or duty rules, for
example merging broken code without running the checks. Three active infractions in
the same track suspend the person: contributors from contributing, role holders from
their role. A suspension only ends through an appeal. There are no time limits:
infractions clear through good work, never by waiting.

Tracks:
  contributor  anyone who delivers work (code, docs, research, art)
  duty         role holders: seats, leads, reviewers, Quality, moderators, Administration

Usage:
  python3 tools/infractions.py add --login NAME --track contributor --reason "..." --evidence URL --by ISSUER
  python3 tools/infractions.py credit --login NAME --track contributor --evidence URL   # one clean delivery
  python3 tools/infractions.py overturn --id INF-0003 --reason "appeal accepted" --by ISSUER
  python3 tools/infractions.py reinstate --login NAME --track contributor --by ISSUER --evidence URL
  python3 tools/infractions.py status --login NAME
  python3 tools/infractions.py check --login NAME --track contributor   # exit 1 if suspended (used by CI)
  python3 tools/infractions.py verify                                   # validate the file (used by CI)

Data: data/infractions.json. Every change goes through a pull request, so the git
history is the audit trail (who changed what, when, approved by whom).
"""
import argparse, datetime, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data/infractions.json"
TRACKS = ("contributor", "duty")
LIMIT = 3            # active infractions that suspend
CLEAR_AFTER = 5      # clean deliveries (contributor) or clean duties (role) that clear the oldest active infraction
RE_LOGIN = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")


def load():
    if DATA.exists():
        return json.loads(DATA.read_text(encoding="utf-8"))
    return {"version": 1, "note": "Infraction record. See docs/guides/HP-POL-009-accountability.md. Edit with tools/infractions.py only.", "infractions": [], "credits": [], "suspensions": []}


def save(d):
    DATA.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def today():
    return datetime.date.today().isoformat()


def standing(d, login, track):
    """Active infractions, clean credits since the last one, and whether the person is suspended."""
    lo = login.lower()
    infs = [i for i in d["infractions"] if i["login"].lower() == lo and i["track"] == track and i["status"] == "active"]
    sus = [s for s in d["suspensions"] if s["login"].lower() == lo and s["track"] == track and s["status"] == "active"]
    credits = [c for c in d["credits"] if c["login"].lower() == lo and c["track"] == track and not c.get("used")]
    return {"active": infs, "suspended": bool(sus), "credits": len(credits)}


def next_id(items, prefix):
    n = max([int(i["id"].split("-")[1]) for i in items] + [0]) + 1
    return f"{prefix}-{n:04d}"


def need_login(login):
    if not RE_LOGIN.match(login or ""):
        sys.exit("--login must be a GitHub user name.")


def cmd_add(a):
    need_login(a.login)
    d = load()
    st = standing(d, a.login, a.track)
    if st["suspended"]:
        sys.exit(f"{a.login} is already suspended in the {a.track} track. Handle it through the appeal.")
    rec = {"id": next_id(d["infractions"], "INF"), "login": a.login, "track": a.track, "reason": a.reason,
           "evidence": a.evidence, "by": a.by, "date": a.date or today(), "status": "active"}
    d["infractions"].append(rec)
    n = len(st["active"]) + 1
    msg = f"Added {rec['id']}: {a.login} ({a.track}) · {n} of {LIMIT} active"
    if n >= LIMIT:
        d["suspensions"].append({"id": next_id(d["suspensions"], "SUS"), "login": a.login, "track": a.track,
                                 "date": rec["date"], "by": a.by, "status": "active",
                                 "infractions": [i["id"] for i in st["active"]] + [rec["id"]]})
        msg += " · SUSPENDED. The person must be told how to appeal (HP-SOP-011)."
    save(d)
    print(msg)


def cmd_credit(a):
    """Record one clean delivery or duty. Every CLEAR_AFTER credits clear the oldest active infraction."""
    need_login(a.login)
    d = load()
    st = standing(d, a.login, a.track)
    if st["suspended"]:
        sys.exit(f"{a.login} is suspended in the {a.track} track; credits start again after reinstatement.")
    d["credits"].append({"login": a.login, "track": a.track, "evidence": a.evidence, "date": today()})
    st = standing(d, a.login, a.track)
    if st["active"] and st["credits"] >= CLEAR_AFTER:
        oldest = sorted(st["active"], key=lambda i: i["id"])[0]
        oldest["status"] = "cleared"; oldest["cleared"] = today()
        used = 0
        for c in d["credits"]:
            if c["login"].lower() == a.login.lower() and c["track"] == a.track and not c.get("used") and used < CLEAR_AFTER:
                c["used"] = oldest["id"]; used += 1
        print(f"{oldest['id']} cleared by {CLEAR_AFTER} clean deliveries.")
    else:
        print(f"Credit recorded for {a.login} ({a.track}): {st['credits']} of {CLEAR_AFTER} toward clearing" if st["active"] else f"Credit recorded for {a.login}. No active infractions.")
    save(d)


def cmd_overturn(a):
    d = load()
    rec = next((i for i in d["infractions"] if i["id"] == a.id), None)
    if not rec:
        sys.exit(f"No infraction {a.id}.")
    rec["status"] = "overturned"; rec["overturned"] = {"date": today(), "by": a.by, "reason": a.reason}
    # An overturned infraction can lift a suspension that depended on it
    for s in d["suspensions"]:
        if s["status"] == "active" and a.id in s["infractions"]:
            s["status"] = "lifted"; s["lifted"] = {"date": today(), "by": a.by, "reason": f"{a.id} overturned"}
            print(f"{s['id']} lifted: it depended on {a.id}.")
    save(d)
    print(f"{a.id} overturned.")


def cmd_reinstate(a):
    """End a suspension after an accepted appeal. Active infractions stay on record but no longer count."""
    need_login(a.login)
    d = load()
    s = next((s for s in d["suspensions"] if s["login"].lower() == a.login.lower() and s["track"] == a.track and s["status"] == "active"), None)
    if not s:
        sys.exit(f"{a.login} is not suspended in the {a.track} track.")
    s["status"] = "lifted"; s["lifted"] = {"date": today(), "by": a.by, "reason": "appeal accepted", "evidence": a.evidence}
    for i in d["infractions"]:
        if i["id"] in s["infractions"] and i["status"] == "active":
            i["status"] = "closed-by-appeal"
    save(d)
    print(f"{s['id']} lifted. {a.login} can {'contribute' if a.track == 'contributor' else 'hold roles'} again, with a clean slate.")


def cmd_status(a):
    d = load()
    for t in TRACKS:
        st = standing(d, a.login, t)
        state = "SUSPENDED" if st["suspended"] else f"{len(st['active'])} of {LIMIT} active"
        print(f"{a.login} · {t}: {state}" + (f" · {st['credits']} of {CLEAR_AFTER} clean toward clearing" if st["active"] and not st["suspended"] else ""))
        for i in st["active"]:
            print(f"  {i['id']} {i['date']} {i['reason']} ({i['evidence']})")


def cmd_check(a):
    d = load()
    if standing(d, a.login, a.track)["suspended"]:
        print(f"{a.login} is suspended in the {a.track} track (HP-POL-009). Appeal: see HP-SOP-011.")
        sys.exit(1)
    print(f"{a.login}: in good standing ({a.track}).")


def cmd_verify(a):
    d = load()
    errors, ids = [], set()
    for i in d["infractions"]:
        if i.get("track") not in TRACKS or i.get("status") not in ("active", "cleared", "overturned", "closed-by-appeal"):
            errors.append(f"{i.get('id')}: bad track or status")
        if not i.get("reason") or not i.get("evidence") or not i.get("by"):
            errors.append(f"{i.get('id')}: needs a reason, evidence and the issuer")
        if i["id"] in ids:
            errors.append(f"{i['id']}: duplicate id")
        ids.add(i["id"])
    for s in d["suspensions"]:
        if any(x not in ids for x in s.get("infractions", [])):
            errors.append(f"{s.get('id')}: refers to an unknown infraction")
    if errors:
        print("\n".join(errors)); sys.exit(1)
    print(f"{len(d['infractions'])} infractions, {len(d['suspensions'])} suspensions: valid.")


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    x = sub.add_parser("add"); x.add_argument("--login", required=True); x.add_argument("--track", choices=TRACKS, required=True)
    x.add_argument("--reason", required=True); x.add_argument("--evidence", required=True); x.add_argument("--by", required=True); x.add_argument("--date")
    x = sub.add_parser("credit"); x.add_argument("--login", required=True); x.add_argument("--track", choices=TRACKS, required=True); x.add_argument("--evidence", required=True)
    x = sub.add_parser("overturn"); x.add_argument("--id", required=True); x.add_argument("--reason", required=True); x.add_argument("--by", required=True)
    x = sub.add_parser("reinstate"); x.add_argument("--login", required=True); x.add_argument("--track", choices=TRACKS, required=True); x.add_argument("--by", required=True); x.add_argument("--evidence", required=True)
    x = sub.add_parser("status"); x.add_argument("--login", required=True)
    x = sub.add_parser("check"); x.add_argument("--login", required=True); x.add_argument("--track", choices=TRACKS, default="contributor")
    sub.add_parser("verify")
    a = p.parse_args()
    {"add": cmd_add, "credit": cmd_credit, "overturn": cmd_overturn, "reinstate": cmd_reinstate, "status": cmd_status, "check": cmd_check, "verify": cmd_verify}[a.cmd](a)


if __name__ == "__main__":
    main()
