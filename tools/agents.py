#!/usr/bin/env python3
"""Detect which AI agents helped with a pull request, from its commits.

Work done with an AI agent is credited to the person who did it, with the agent
named as the tool they used (HP-POL-002, ADR 0015). Agents announce themselves in
commit trailers (for example `Co-Authored-By: Claude <noreply@anthropic.com>`) or
as the commit author. This tool reads those and returns the agents' names.

Usage:
  python3 tools/agents.py --pr 28                 # read the PR's commits through the gh CLI
  python3 tools/agents.py --pr 28 --repo OWNER/NAME --json
  git log --format='%an <%ae>%n%B' main..HEAD | python3 tools/agents.py --stdin

Used by tools/records.py (records list the agents) and by the attribution workflow
(labels and credits merged pull requests).
"""
import argparse, json, re, subprocess, sys

# Display name, and a pattern matched against trailer lines and commit authors
AGENTS = [
    ("Claude", r"\bclaude\b|anthropic\.com"),
    ("GitHub Copilot", r"copilot"),
    ("OpenAI Codex", r"\bcodex\b|chatgpt|openai\.com"),
    ("Cursor", r"\bcursor(?:agent)?\b|cursor\.(?:sh|com)"),
    ("Gemini", r"\bgemini\b|google-labs-jules|\bjules\b"),
    ("Devin", r"\bdevin(?:-ai)?\b"),
    ("Aider", r"\baider\b"),
]
TRAILER = re.compile(r"^\s*(co-authored-by|assisted-by|generated-by|ai-agent|ai-assisted-by)\s*:\s*(.+)$", re.I | re.M)


def detect_text(text):
    """Agents named in commit trailers or author lines of `text`."""
    found = []
    candidates = [m.group(2) for m in TRAILER.finditer(text)]
    candidates += re.findall(r"^author:\s*(.+)$", text, re.I | re.M)
    for name, pat in AGENTS:
        if any(re.search(pat, c, re.I) for c in candidates) and name not in found:
            found.append(name)
    return found


def detect_commits(commits):
    """commits: GitHub API commit objects (as returned by /pulls/N/commits)."""
    text = []
    for c in commits:
        cm = c.get("commit", {})
        for who in (cm.get("author") or {}, cm.get("committer") or {}):
            text.append(f"author: {who.get('name', '')} <{who.get('email', '')}>")
        for who in (c.get("author") or {}, c.get("committer") or {}):
            if who and who.get("login"):
                text.append(f"author: {who['login']}")
        text.append(cm.get("message", ""))
    return detect_text("\n".join(text))


def pr_commits(pr, repo=None):
    cmd = ["gh", "api", "--paginate", "--jq", ".[]", f"repos/{repo or '{owner}/{repo}'}/pulls/{pr}/commits"]
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode:
        raise SystemExit(f"Could not read pull request #{pr}: {out.stderr.strip() or 'gh failed'}")
    return [json.loads(line) for line in out.stdout.splitlines() if line.strip()]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--pr", type=int); ap.add_argument("--repo"); ap.add_argument("--stdin", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if a.stdin:
        agents = detect_text(sys.stdin.read())
    elif a.pr:
        agents = detect_commits(pr_commits(a.pr, a.repo))
    else:
        ap.error("give --pr N or --stdin")
    if a.json:
        print(json.dumps({"agents": agents}))
    else:
        print(", ".join(agents) if agents else "No AI agent detected")


if __name__ == "__main__":
    main()
