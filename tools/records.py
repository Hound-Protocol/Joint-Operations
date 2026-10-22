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
      [--title T --size S|M|L] [--date YYYY-MM-DD] [--key-id ID]
                                sign and append a record
  verify                        check every record (used by CI)
  show RECORD_ID                print one record

Needs: Python 3.8+ and the `cryptography` package for keygen, add and verify
(pip install --user cryptography).
"""
import argparse, base64, datetime, hashlib, json, os, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
RECORDS = ROOT / "site/data/records.json"
KEYS = ROOT / "site/data/records-key.json"
CONTRACTS = ROOT / "site/data/contracts.json"
KEY_DIR = pathlib.Path(os.environ.get("HP_RECORDS_KEY_DIR", pathlib.Path.home() / ".config/hound-protocol"))
SIZE_PTS = {"S": 1, "M": 3, "L": 5}
FIELDS = {"id", "kind", "login", "name", "contract", "title", "size", "points", "pr", "commit", "date", "key", "sig"}
REQUIRED = {"id", "kind", "login", "contract", "title", "size", "points", "pr", "date", "key", "sig"}
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
    title, size = a.title or spec.get("title"), (a.size or spec.get("size") or "").upper()
    if not title or size not in SIZE_PTS:
        sys.exit("Unknown contract: give --title and --size.")
    if any(r["contract"] == a.contract and r["login"].lower() == a.login.lower() for r in recs["records"]):
        sys.exit(f"{a.login} already has a record for {a.contract}.")
    if a.commit and not re.fullmatch(r"[0-9a-f]{40}", a.commit):
        sys.exit("--commit must be a full 40-character commit SHA.")
    n = max([int(r["id"].split("-")[1]) for r in recs["records"]] + [0]) + 1
    rec = {"id": f"HP-{n:04d}", "kind": "contract", "login": a.login, "contract": a.contract, "title": title,
           "size": size, "points": SIZE_PTS[size], "pr": a.pr, "date": a.date or datetime.date.today().isoformat(), "key": kid}
    if a.name:
        rec["name"] = a.name
    if a.commit:
        rec["commit"] = a.commit
    priv = private_key(kid)
    raw = priv.public_key().public_bytes(ser.Encoding.Raw, ser.PublicFormat.Raw)
    if base64.b64encode(raw).decode() != pub["public"]:
        sys.exit(f"The private key on this machine does not match published key {kid}.")
    rec["sig"] = base64.b64encode(priv.sign(canonical(rec))).decode()
    recs["records"].append(rec)
    save(RECORDS, recs)
    print(f"Added {rec['id']}: {a.login} · {a.contract} {title} · {size} ({rec['points']} pts)")


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
        if SIZE_PTS.get(r["size"]) != r["points"]:
            errors.append(f"{rid}: points do not match size")
        k = keys.get(r["key"])
        if not k:
            errors.append(f"{rid}: unknown key {r['key']}")
            continue
        try:
            ed25519.Ed25519PublicKey.from_public_bytes(base64.b64decode(k["public"])).verify(base64.b64decode(r["sig"]), canonical(r))
        except Exception:
            errors.append(f"{rid}: signature does not verify")
    for e in errors:
        print("FAIL", e)
    if errors:
        sys.exit(1)
    print(f"{len(recs)} records verified against {len(keys)} key(s).")


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
    d.add_argument("--commit"); d.add_argument("--name"); d.add_argument("--title"); d.add_argument("--size"); d.add_argument("--date"); d.add_argument("--key-id")
    sub.add_parser("verify")
    s = sub.add_parser("show"); s.add_argument("id")
    a = p.parse_args()
    {"keygen": cmd_keygen, "add": cmd_add, "verify": cmd_verify, "show": cmd_show}[a.cmd](a)


if __name__ == "__main__":
    main()
