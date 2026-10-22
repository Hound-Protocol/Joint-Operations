#!/usr/bin/env python3
"""Signed contributor records for Hound Protocol.

Each completed contract gets one record in site/data/records.json, signed with
the project's Ed25519 key. Anyone can check a record on the website's Verify
page, or with `python3 tools/records.py verify`.

The private key stays on the signer's own machine. It is never committed,
never pasted into chat, and never stored as a GitHub secret.

Commands:
  keygen [--key-id ID]          create a signing key, publish its public half
  add --login LOGIN --contract CXX --pr N [--commit SHA] [--name NAME]
      [--title T --difficulty easy|medium|hard] [--date YYYY-MM-DD] [--key-id ID]
      [--assisted-by "Claude"]   (AI agents used; detected from the pull request when left out)
                                sign and append a record
  staff-add --login LOGIN --card LV3..LV7 --department NAME [--name NAME] [--discord-id ID]
                                issue a signed staff card with a permanent Hound ID (HND-NNNN)
  staff-revoke --id HND-NNNN --reason TEXT
                                mark a staff card as revoked (re-signed, never deleted)
  verify                        check every record and staff card (used by CI)
  show RECORD_ID                print one record

Needs: Python 3.8+ and the `cryptography` package for keygen, add and verify
(pip install --user cryptography).
"""
import argparse, base64, datetime, hashlib, json, os, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
RECORDS = ROOT / "site/data/records.json"
KEYS = ROOT / "site/data/records-key.json"
CONTRACTS = ROOT / "site/data/contracts.json"
STAFF = ROOT / "site/data/staff.json"
CARDS = ("LV3", "LV4", "LV5", "LV6", "LV7")
DEPARTMENTS = ("Administration", "Development", "Quality", "Contractor")
STAFF_FIELDS = {"id", "kind", "login", "github_id", "name", "discord_id", "card", "department", "since", "status", "revoked", "reason", "key", "sig"}
STAFF_REQUIRED = {"id", "kind", "login", "github_id", "card", "department", "since", "status", "key", "sig"}
KEY_DIR = pathlib.Path(os.environ.get("HP_RECORDS_KEY_DIR", pathlib.Path.home() / ".config/hound-protocol"))
DIFFICULTIES = ("easy", "medium", "hard")
FIELDS = {"id", "kind", "login", "name", "contract", "title", "difficulty", "pr", "commit", "date", "assisted", "key", "sig"}
REQUIRED = {"id", "kind", "login", "contract", "title", "difficulty", "pr", "date", "key", "sig"}
RE_LOGIN = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$")


def load(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def save(path, obj):
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def canonical(record):
    """The exact bytes that are signed: the record without `sig`, keys sorted, no spaces, UTF-8.
    The website builds the same string in JavaScript (site/src/js/19b-verify.js)."""
    body = {k: v for k, v in record.items() if k != "sig"}
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def crypto():
    try:
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.hazmat.primitives import serialization
        from cryptography.exceptions import InvalidSignature
        return ed25519, serialization, InvalidSignature
    except ImportError:
        sys.exit("This command needs the cryptography package: pip install --user cryptography")


def fingerprint(raw):
    return hashlib.sha256(raw).hexdigest()[:16]


def cmd_keygen(a):
    ed25519, ser, _ = crypto()
    keys = load(KEYS, {"keys": []})
    kid = a.key_id or "hp-" + datetime.date.today().strftime("%Y")
    if any(k["id"] == kid for k in keys["keys"]):
        sys.exit(f"A key with id {kid} is already published. Choose another --key-id.")
    path = KEY_DIR / f"records-{kid}.key"
    if path.exists():
        sys.exit(f"{path} already exists. Not overwriting a private key.")
    priv = ed25519.Ed25519PrivateKey.generate()
    KEY_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(KEY_DIR, 0o700)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(priv.private_bytes(ser.Encoding.PEM, ser.PrivateFormat.PKCS8, ser.NoEncryption()))
    raw = priv.public_key().public_bytes(ser.Encoding.Raw, ser.PublicFormat.Raw)
    keys["keys"].append({"id": kid, "alg": "Ed25519", "public": base64.b64encode(raw).decode(),
                         "fingerprint": fingerprint(raw), "owner": a.owner, "added": datetime.date.today().isoformat()})
    save(KEYS, keys)
    print(f"Private key: {path}  (back it up offline; never commit or share it)")
    print(f"Public key published in {KEYS.relative_to(ROOT)} as {kid}, fingerprint {fingerprint(raw)}")


def private_key(kid):
    _, ser, _ = crypto()
    path = KEY_DIR / f"records-{kid}.key"
    if not path.exists():
        sys.exit(f"No private key at {path}. Run keygen first, or set HP_RECORDS_KEY_DIR.")
    return ser.load_pem_private_key(path.read_bytes(), password=None)


def cmd_add(a):
    _, ser, _ = crypto()
    recs = load(RECORDS, {"version": 1, "records": []})
    keys = load(KEYS, {"keys": []})
    if not keys["keys"]:
        sys.exit("No public key is published yet. Run keygen first.")
    kid = a.key_id or keys["keys"][-1]["id"]
    pub = next((k for k in keys["keys"] if k["id"] == kid), None)
    if not pub:
        sys.exit(f"Key {kid} is not published in {KEYS.relative_to(ROOT)}.")
    if not RE_LOGIN.match(a.login):
        sys.exit("--login must be a GitHub user name.")
    spec = next((c for c in load(CONTRACTS, {"contracts": []})["contracts"] if c["id"] == a.contract), {})
    title, diff = a.title or spec.get("title"), (a.difficulty or spec.get("difficulty") or "").lower()
    if not title or diff not in DIFFICULTIES:
        sys.exit("Unknown contract: give --title and --difficulty (" + ", ".join(DIFFICULTIES) + ").")
    if any(r["contract"] == a.contract and r["login"].lower() == a.login.lower() for r in recs["records"]):
        sys.exit(f"{a.login} already has a record for {a.contract}.")
    if a.commit and not re.fullmatch(r"[0-9a-f]{40}", a.commit):
        sys.exit("--commit must be a full 40-character commit SHA.")
    n = max([int(r["id"].split("-")[1]) for r in recs["records"]] + [0]) + 1
    rec = {"id": f"HP-{n:04d}", "kind": "contract", "login": a.login, "contract": a.contract, "title": title,
           "difficulty": diff, "pr": a.pr, "date": a.date or datetime.date.today().isoformat(), "key": kid}
    if a.name:
        rec["name"] = a.name
    if a.commit:
        rec["commit"] = a.commit
    # AI agents used: credited as the person's tool (ADR 0015). Detected from the PR's commit trailers unless given.
    if a.assisted_by is not None:
        agents = [x.strip() for x in a.assisted_by.split(",") if x.strip()]
    else:
        try:
            sys.path.insert(0, str(ROOT / "tools"))
            import agents as agent_detect
            repo = load(ROOT / "site/data/config.json", {}).get("repo")
            agents = agent_detect.detect_commits(agent_detect.pr_commits(a.pr, repo))
        except SystemExit as e:
            sys.exit(f"{e}\nCould not detect AI agents automatically. Pass --assisted-by NAME (or --assisted-by '' for none).")
    if agents:
        rec["assisted"] = agents
    priv = private_key(kid)
    raw = priv.public_key().public_bytes(ser.Encoding.Raw, ser.PublicFormat.Raw)
    if base64.b64encode(raw).decode() != pub["public"]:
        sys.exit(f"The private key on this machine does not match published key {kid}.")
    rec["sig"] = base64.b64encode(priv.sign(canonical(rec))).decode()
    recs["records"].append(rec)
    save(RECORDS, recs)
    print(f"Added {rec['id']}: {a.login} · {a.contract} {title} · {diff}" + (" · with " + ", ".join(agents) if agents else ""))


def signer(kid=None):
    """The published key to sign with, and the matching private key on this machine."""
    _, ser, _ = crypto()
    keys = load(KEYS, {"keys": []})
    if not keys["keys"]:
        sys.exit("No public key is published yet. Run keygen first.")
    kid = kid or keys["keys"][-1]["id"]
    pub = next((k for k in keys["keys"] if k["id"] == kid), None)
    if not pub:
        sys.exit(f"Key {kid} is not published in {KEYS.relative_to(ROOT)}.")
    priv = private_key(kid)
    raw = priv.public_key().public_bytes(ser.Encoding.Raw, ser.PublicFormat.Raw)
    if base64.b64encode(raw).decode() != pub["public"]:
        sys.exit(f"The private key on this machine does not match published key {kid}.")
    return kid, priv


def github_id(login):
    """The numeric GitHub account ID. It never changes, even when the user renames the account."""
    import urllib.request
    req = urllib.request.Request(f"https://api.github.com/users/{login}", headers={"Accept": "application/vnd.github+json", "User-Agent": "hound-protocol-records"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return int(json.load(r)["id"])
    except Exception as e:
        sys.exit(f"Could not look up the GitHub ID of {login} ({e}). Pass it with --github-id. "
                 f"Find it with: gh api users/{login} --jq .id")


def cmd_staff_add(a):
    staff = load(STAFF, {"version": 1, "staff": []})
    if not RE_LOGIN.match(a.login):
        sys.exit("--login must be a GitHub user name.")
    card, dept = a.card.upper(), a.department.capitalize()
    if card not in CARDS or dept not in DEPARTMENTS:
        sys.exit(f"--card must be one of {', '.join(CARDS)}; --department one of {', '.join(DEPARTMENTS)}.")
    gid = a.github_id or github_id(a.login)
    if any(s["github_id"] == gid and s["status"] == "active" for s in staff["staff"]):
        sys.exit(f"{a.login} already has an active staff card. Revoke it first to issue a new one.")
    if a.discord_id and not re.fullmatch(r"\d{15,21}", a.discord_id):
        sys.exit("--discord-id must be the numeric Discord user ID (Developer Mode, right-click, Copy User ID).")
    kid, priv = signer(a.key_id)
    n = max([int(s["id"].split("-")[1]) for s in staff["staff"]] + [0]) + 1
    card_rec = {"id": f"HND-{n:04d}", "kind": "staff", "login": a.login, "github_id": gid, "card": card, "department": dept,
                "since": a.since or datetime.date.today().isoformat(), "status": "active", "key": kid}
    if a.name:
        card_rec["name"] = a.name
    if a.discord_id:
        card_rec["discord_id"] = a.discord_id
    card_rec["sig"] = base64.b64encode(priv.sign(canonical(card_rec))).decode()
    staff["staff"].append(card_rec)
    save(STAFF, staff)
    print(f"Issued {card_rec['id']}: {a.login} (GitHub ID {gid}) · {card} · {dept}")


def cmd_staff_revoke(a):
    staff = load(STAFF, {"version": 1, "staff": []})
    s = next((x for x in staff["staff"] if x["id"] == a.id), None)
    if not s or s["status"] != "active":
        sys.exit("No active staff card with that ID.")
    kid, priv = signer(a.key_id)
    s.update({"status": "revoked", "revoked": datetime.date.today().isoformat(), "reason": a.reason, "key": kid})
    s.pop("sig", None)
    s["sig"] = base64.b64encode(priv.sign(canonical(s))).decode()
    save(STAFF, staff)
    print(f"Revoked {a.id}.")


def cmd_verify(a):
    recs = load(RECORDS, {"version": 1, "records": []})["records"]
    keys = {k["id"]: k for k in load(KEYS, {"keys": []})["keys"]}
    errors = []
    for k in keys.values():
        raw = base64.b64decode(k["public"])
        if len(raw) != 32 or k.get("alg") != "Ed25519" or k.get("fingerprint") != fingerprint(raw):
            errors.append(f"key {k['id']}: malformed")
    if recs:
        ed25519, _, Invalid = crypto()
    seen = set()
    for r in recs:
        rid = r.get("id", "?")
        if set(r) - FIELDS or REQUIRED - set(r):
            errors.append(f"{rid}: fields wrong (unknown {sorted(set(r) - FIELDS)}, missing {sorted(REQUIRED - set(r))})")
            continue
        if rid in seen:
            errors.append(f"{rid}: duplicate id")
        seen.add(rid)
        if r["difficulty"] not in DIFFICULTIES:
            errors.append(f"{rid}: unknown difficulty {r['difficulty']}")
        if "assisted" in r and not (isinstance(r["assisted"], list) and all(isinstance(x, str) and x for x in r["assisted"])):
            errors.append(f"{rid}: assisted must be a list of agent names")
        k = keys.get(r["key"])
        if not k:
            errors.append(f"{rid}: unknown key {r['key']}")
            continue
        try:
            ed25519.Ed25519PublicKey.from_public_bytes(base64.b64decode(k["public"])).verify(base64.b64decode(r["sig"]), canonical(r))
        except Exception:
            errors.append(f"{rid}: signature does not verify")
    staff = load(STAFF, {"version": 1, "staff": []})["staff"]
    if staff and not recs:
        ed25519, _, _ = crypto()
    seen_ids, active_gids = set(), set()
    for s in staff:
        sid = s.get("id", "?")
        if set(s) - STAFF_FIELDS or STAFF_REQUIRED - set(s):
            errors.append(f"{sid}: fields wrong (unknown {sorted(set(s) - STAFF_FIELDS)}, missing {sorted(STAFF_REQUIRED - set(s))})")
            continue
        if sid in seen_ids:
            errors.append(f"{sid}: duplicate id")
        seen_ids.add(sid)
        if s["status"] == "active":
            if s["github_id"] in active_gids:
                errors.append(f"{sid}: a second active card for GitHub ID {s['github_id']}")
            active_gids.add(s["github_id"])
        if s["card"] not in CARDS or s["department"] not in DEPARTMENTS or s["status"] not in ("active", "revoked"):
            errors.append(f"{sid}: card, department or status not allowed")
        k = keys.get(s["key"])
        if not k:
            errors.append(f"{sid}: unknown key {s['key']}")
            continue
        try:
            ed25519.Ed25519PublicKey.from_public_bytes(base64.b64decode(k["public"])).verify(base64.b64decode(s["sig"]), canonical(s))
        except Exception:
            errors.append(f"{sid}: signature does not verify")
    for e in errors:
        print("FAIL", e)
    if errors:
        sys.exit(1)
    print(f"{len(recs)} records and {len(staff)} staff cards verified against {len(keys)} key(s).")


def cmd_show(a):
    r = next((r for r in load(RECORDS, {"records": []})["records"] if r["id"] == a.id), None)
    if not r:
        sys.exit("No such record.")
    print(json.dumps(r, indent=2, ensure_ascii=False))


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    k = sub.add_parser("keygen"); k.add_argument("--key-id"); k.add_argument("--owner", default="TrueMan (project lead)")
    d = sub.add_parser("add")
    d.add_argument("--login", required=True); d.add_argument("--contract", required=True); d.add_argument("--pr", type=int, required=True)
    d.add_argument("--commit"); d.add_argument("--name"); d.add_argument("--title"); d.add_argument("--difficulty"); d.add_argument("--date"); d.add_argument("--key-id")
    d.add_argument("--assisted-by", help="AI agents used, comma separated. Default: detected from the pull request's commits")
    sa = sub.add_parser("staff-add")
    sa.add_argument("--login", required=True); sa.add_argument("--card", required=True); sa.add_argument("--department", required=True)
    sa.add_argument("--name"); sa.add_argument("--discord-id"); sa.add_argument("--github-id", type=int); sa.add_argument("--since"); sa.add_argument("--key-id")
    sr = sub.add_parser("staff-revoke"); sr.add_argument("--id", required=True); sr.add_argument("--reason", required=True); sr.add_argument("--key-id")
    sub.add_parser("verify")
    s = sub.add_parser("show"); s.add_argument("id")
    a = p.parse_args()
    {"keygen": cmd_keygen, "add": cmd_add, "staff-add": cmd_staff_add, "staff-revoke": cmd_staff_revoke, "verify": cmd_verify, "show": cmd_show}[a.cmd](a)


if __name__ == "__main__":
    main()
