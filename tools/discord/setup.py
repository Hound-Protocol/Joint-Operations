#!/usr/bin/env python3
"""Build the Hound Protocol Discord server from tools/discord/blueprint.json.

Creates roles, categories, text and voice channels, permissions, and posts the
welcome, rules, roadmap, FAQ, announcement and bug-template messages.
Safe to re-run: roles and channels are matched by name. Re-running brings an
existing server in line with the blueprint: it renames roles and categories
that have a "was" name, updates role colors and permissions, moves channels to
their blueprint category, and resets channel permissions to the blueprint.
Roles and channels that are not in the blueprint are listed but never deleted.
Messages are only posted into channels that are still empty.

Needs only Python 3.8+ (standard library). The bot token is read from the
DISCORD_BOT_TOKEN environment variable and is never printed or saved.

Usage:
  python3 tools/discord/setup.py SERVER_ID            # show what would change
  python3 tools/discord/setup.py SERVER_ID --apply    # make the changes
  add --update-messages to also edit starter messages this bot posted earlier
"""
import json, os, pathlib, re, sys, time, urllib.error, urllib.request

API = "https://discord.com/api/v10"
BP = json.loads((pathlib.Path(__file__).parent / "blueprint.json").read_text(encoding="utf-8"))

PERMS = {
    "view": 1 << 10, "send": 1 << 11, "manage_messages": 1 << 13, "embed": 1 << 14, "attach": 1 << 15,
    "history": 1 << 16, "mention_everyone": 1 << 17, "react": 1 << 6, "kick": 1 << 1, "ban": 1 << 2,
    "connect": 1 << 20, "speak": 1 << 21, "manage_threads": 1 << 34, "moderate": 1 << 40,
    "threads": (1 << 35) | (1 << 38),
}
VIEW, SEND, CONNECT = PERMS["view"], PERMS["send"], PERMS["connect"]
TEXT, VOICE, CATEGORY = 0, 2, 4


def bits(names):
    total = 0
    for n in names:
        total |= PERMS[n]
    return str(total)


class Discord:
    def __init__(self, token):
        self.headers = {"Authorization": "Bot " + token, "Content-Type": "application/json",
                        "User-Agent": "HoundProtocolSetup (https://github.com/Hound-Protocol/Joint-Operations, 1.0)"}

    def call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        for _ in range(6):
            req = urllib.request.Request(API + path, data=data, method=method, headers=self.headers)
            try:
                with urllib.request.urlopen(req) as r:
                    raw = r.read()
                    return json.loads(raw) if raw else None
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait = float(json.loads(e.read() or b"{}").get("retry_after", 2))
                    time.sleep(wait + 0.2)
                    continue
                detail = e.read().decode(errors="replace")[:300]
                if e.code == 401:
                    sys.exit("Discord rejected the token (401). Check DISCORD_BOT_TOKEN.")
                if e.code == 403:
                    sys.exit(f"Missing permission (403) on {method} {path}. Give the bot Administrator for the setup, then remove it.\n{detail}")
                if e.code == 404:
                    sys.exit(f"Not found (404) on {method} {path}. Check the server ID and that the bot is in the server.\n{detail}")
                raise SystemExit(f"Discord error {e.code} on {method} {path}: {detail}")
        sys.exit("Rate limited too many times. Try again in a minute.")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    apply = "--apply" in sys.argv
    update_msgs = "--update-messages" in sys.argv
    if len(args) != 1 or not args[0].isdigit():
        sys.exit(__doc__)
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token:
        sys.exit("Set the DISCORD_BOT_TOKEN environment variable first (see docs/discord.md).")
    gid = args[0]
    d = Discord(token)
    guild = d.call("GET", f"/guilds/{gid}")
    print(f"Server: {guild['name']}  ({'APPLY' if apply else 'DRY RUN: nothing will change'})\n")
    everyone = gid  # the @everyone role has the server's ID
    bot_id = d.call("GET", "/users/@me")["id"]

    # Roles
    roles = {r["name"]: r for r in d.call("GET", f"/guilds/{gid}/roles")}
    for spec in BP["roles"]:
        want = {"name": spec["name"], "color": int(spec["color"].lstrip("#"), 16), "hoist": spec.get("hoist", False),
                "permissions": bits(spec["permissions"])}
        was = spec.get("was") or []
        old = next((w for w in ([was] if isinstance(was, str) else was) if w in roles), None)
        if spec["name"] not in roles and old:
            print(f"  rename role     {old} -> {spec['name']}")
            if apply:
                roles[spec["name"]] = d.call("PATCH", f"/guilds/{gid}/roles/{roles[old]['id']}", want)
            else:
                roles[spec["name"]] = roles[old]
            roles.pop(old, None)
            continue
        if spec["name"] in roles:
            r = roles[spec["name"]]
            if (r.get("color"), r.get("hoist"), str(r.get("permissions"))) != (want["color"], want["hoist"], want["permissions"]):
                print(f"  update role     {spec['name']}")
                if apply:
                    roles[spec["name"]] = d.call("PATCH", f"/guilds/{gid}/roles/{r['id']}", want)
            else:
                print(f"  role ok         {spec['name']}")
            continue
        print(f"  create role     {spec['name']}")
        if apply:
            roles[spec["name"]] = d.call("POST", f"/guilds/{gid}/roles", dict(want, mentionable=False))
    known = {s["name"] for s in BP["roles"]} | {"@everyone"}
    for name, r in roles.items():
        if name not in known and not r.get("managed"):
            print(f"  not in blueprint (left alone): role {name}")
    if apply:
        # Order: blueprint order from the top, just below the bot's own role.
        me = d.call("GET", "/users/@me")
        member = d.call("GET", f"/guilds/{gid}/members/{me['id']}")
        current = {r["id"]: r for r in d.call("GET", f"/guilds/{gid}/roles")}
        top = max((current[r]["position"] for r in member["roles"] if r in current), default=1) - 1
        order = [roles[s["name"]]["id"] for s in BP["roles"] if s["name"] in roles]
        positions = [{"id": rid, "position": max(1, top - i)} for i, rid in enumerate(order)]
        try:
            d.call("PATCH", f"/guilds/{gid}/roles", positions)
        except SystemExit as e:
            print(f"  note: could not reorder roles ({e}). Drag them into order in Server Settings > Roles.")

    def overwrites(category, extra_roles=None):
        allowed = extra_roles or category.get("roles")
        access = "roles" if extra_roles else category["access"]
        if access == "read_only":
            ow = [{"id": everyone, "type": 0, "allow": str(VIEW), "deny": str(SEND)}]
            for n in ("LV7 · Owner", "LV6 · Administration", "LV6 · Moderator"):
                if n in roles:
                    ow.append({"id": roles[n]["id"], "type": 0, "allow": str(SEND), "deny": "0"})
            return ow
        if access == "roles":
            ow = [{"id": everyone, "type": 0, "allow": "0", "deny": str(VIEW | CONNECT)}]
            for n in allowed:
                if n in roles:
                    ow.append({"id": roles[n]["id"], "type": 0, "allow": str(VIEW | SEND | CONNECT), "deny": "0"})
            return ow
        return []

    # Categories and channels
    channels = d.call("GET", f"/guilds/{gid}/channels")
    cats = {c["name"].lower(): c for c in channels if c["type"] == CATEGORY}
    by_name = {(c["type"], c["name"].lower()): c for c in channels if c["type"] != CATEGORY}
    created_text, seen, cat_ids = {}, set(), []

    def sync(existing, body, label):
        """Move a channel into its category and reset its permissions to the blueprint."""
        if not apply or existing.get("id") in (None, "0"):
            return
        d.call("PATCH", f"/channels/{existing['id']}", body)

    for pos, cat in enumerate(BP["categories"]):
        old = (cat.get("was") or "").lower()
        if cat["name"].lower() in cats:
            parent = cats[cat["name"].lower()]
            print(f"  category ok     {cat['name']} (permissions synced)")
            sync(parent, {"permission_overwrites": overwrites(cat)}, cat["name"])
        elif old and old in cats:
            parent = cats[old]
            print(f"  rename category {cat['was']} -> {cat['name']}")
            sync(parent, {"name": cat["name"], "permission_overwrites": overwrites(cat)}, cat["name"])
        else:
            print(f"  create category {cat['name']}")
            parent = d.call("POST", f"/guilds/{gid}/channels", {"name": cat["name"], "type": CATEGORY, "position": pos,
                                                                  "permission_overwrites": overwrites(cat)}) if apply else {"id": None}
        seen.add(parent.get("id"))
        cat_ids.append(parent.get("id"))
        for ch in cat.get("channels", []):
            ex = by_name.get((TEXT, ch["name"]))
            if ex:
                seen.add(ex["id"])
                moved = ex.get("parent_id") != parent.get("id")
                print(f"    {'move text    ' if moved else 'text ok      '} #{ch['name']}")
                sync(ex, {"parent_id": parent.get("id"), "topic": ch.get("topic", ""), "permission_overwrites": overwrites(cat)}, ch["name"])
                created_text[ch["name"]] = (ex, False)
                continue
            print(f"    create text   #{ch['name']}")
            if apply:
                c = d.call("POST", f"/guilds/{gid}/channels", {"name": ch["name"], "type": TEXT, "topic": ch.get("topic", ""),
                                                               "parent_id": parent["id"], "permission_overwrites": overwrites(cat)})
                created_text[ch["name"]] = (c, True)
            else:
                created_text[ch["name"]] = ({"id": "0"}, True)
        for vc in cat.get("voice", []):
            ex = by_name.get((VOICE, vc["name"].lower()))
            if ex:
                seen.add(ex["id"])
                print(f"    voice ok      {vc['name']}")
                sync(ex, {"parent_id": parent.get("id"), "permission_overwrites": overwrites(cat, vc.get("roles"))}, vc["name"])
                continue
            print(f"    create voice  {vc['name']}")
            if apply:
                d.call("POST", f"/guilds/{gid}/channels", {"name": vc["name"], "type": VOICE, "parent_id": parent["id"],
                                                           "permission_overwrites": overwrites(cat, vc.get("roles"))})
    if apply and all(cat_ids):
        d.call("PATCH", f"/guilds/{gid}/channels", [{"id": cid, "position": i} for i, cid in enumerate(cat_ids)])
    for c in channels:
        if c["id"] not in seen:
            print(f"  not in blueprint (left alone): {'category' if c['type'] == CATEGORY else 'channel'} {c['name']}")

    # Messages, only into empty channels
    ids = {name: c["id"] for name, (c, _) in created_text.items()}
    for name, text in BP["messages"].items():
        if name not in created_text:
            continue
        chan, new = created_text[name]
        text = re.sub(r"<#([a-z0-9-]+)>", lambda m: f"<#{ids[m.group(1)]}>" if m.group(1) in ids else "#" + m.group(1), text)
        if not new:
            existing = d.call("GET", f"/channels/{chan['id']}/messages?limit=50") or []
            if existing:
                mine = [m for m in existing if m.get("author", {}).get("id") == bot_id]
                if update_msgs and mine:
                    first = mine[-1]  # messages come newest first; the starter message is the oldest
                    if first.get("content") != text:
                        print(f"  update message  #{name}")
                        if apply:
                            d.call("PATCH", f"/channels/{chan['id']}/messages/{first['id']}", {"content": text, "allowed_mentions": {"parse": []}})
                    else:
                        print(f"  message ok      #{name}")
                else:
                    print(f"  message skipped #{name} (channel not empty)")
                continue
        if not apply:
            print(f"  post message    #{name}")
            continue
        print(f"  post message    #{name}")
        d.call("POST", f"/channels/{chan['id']}/messages", {"content": text, "allowed_mentions": {"parse": []}})

    print("\nDone." if apply else "\nDry run complete. Run again with --apply to make these changes.")
    if apply:
        print("Next: remove the bot (or its Administrator permission) and reset its token. See docs/discord.md.")


if __name__ == "__main__":
    main()
