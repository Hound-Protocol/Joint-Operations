# Sign-in setup (owner)

Status: Current · Updated: 2026-10-23 · Owner: project lead · Decision: [ADR 0017](decisions/0017-hound-id-sign-in.md)

Sign-in lets people open the website with their GitHub account. Their keycard comes from their signed staff card (matched by GitHub account number), and they can read the restricted documents their clearance allows. **GitHub enforces the access**: restricted documents live in private repositories, and the website reads them with the reader's own sign-in.

Nothing here needs a password or token pasted anywhere. The one secret (the app's client secret) goes straight from GitHub into the relay's settings.

## 1. Private document repositories
Create three **private** repositories in the Hound-Protocol organization and give the teams read access:

| Repository | Clearance | Teams with read access |
|---|---|---|
| `hp-staff` | LV3 and up | contractors, quality, development, administration, owners |
| `hp-leads` | LV5 and up | development, administration, owners |
| `hp-admin` | LV6 and up | administration, owners |

Put Markdown documents in them (any folders). The website lists every `.md` file.

## 2. GitHub App
Organization → Settings → Developer settings → GitHub Apps → **New GitHub App**:
- Name: `Hound Protocol Sign-in`. Homepage: the website URL.
- Callback URL: `https://<your-relay>.workers.dev/callback` (from step 3; you can edit it later).
- **Expire user authorization tokens:** on. **Webhook:** off.
- Permissions → Repository → **Contents: Read-only**. Nothing else.
- Where can this app be installed: **Only on this account**.
- Create, then **Generate a new client secret**. Copy it straight into step 3. Do not save it in a file, chat or repository.
- **Install App** → Hound-Protocol → **Only select repositories**: `hp-staff`, `hp-leads`, `hp-admin`.

## 3. Relay (Cloudflare Worker, free plan)
Cloudflare dashboard → Workers → **Create** → name it `hp-signin` → paste `tools/signin-relay/worker.js` → Deploy. Then Settings → Variables:
- `GITHUB_CLIENT_ID`: the app's Client ID (not secret).
- `SITE_ORIGIN`: `https://hound-protocol.github.io`
- `GITHUB_CLIENT_SECRET`: **Encrypt** (secret), paste the client secret.

## 4. Switch it on
The relay URL goes in `site/data/config.json` → `signin.relay`, with the restricted areas in `signin.areas`. Neither the URL nor the client ID is secret. Live since v0.0.22: `https://hp-signin.trueman-truetown.workers.dev`.

## Using it
- **Sign in:** the **Sign in** badge in the top bar, or the Profile page (`#/profile`). A GitHub window asks you to authorize *Hound Protocol Sign-in* once.
- **Profile:** your keycard (your signed staff card, or a member card), your session, and your documents.
- **Your documents:** one area per private repository. Areas above your clearance stay locked; inside an area GitHub decides what you can read.
- **Sign out:** the button on the Profile page, or close the tab.

## How it stays safe
- The relay keeps the client secret and nothing else: no database, no logs of tokens.
- The token lives only in the reader's browser tab (session storage) and expires within 8 hours. Signing out removes it.
- The token can only read the contents of the three private repositories, and only those the person's teams can already read.
- Leaving a team removes access immediately ([HP-SOP-007](guides/HP-SOP-007-onboarding-offboarding.md)).
