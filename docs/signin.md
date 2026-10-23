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
- Name: `Hound ID Sign-in`, owned by the Hound-Protocol organization. Homepage: the website URL. Client secrets are under **Credentials** in the app settings.
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

## 5. Owner card (LV7) from GitHub
Organization owners hold LV7 (ADR 0011). The website asks GitHub whether the signed-in account owns the organization, so nothing can be edited to fake it.
- GitHub App → **Permissions & events** → **Organization permissions** → **Members: Read-only** → **Save changes**.
- GitHub asks the organization to accept the new permission: **Hound-Protocol → Settings → GitHub Apps → Hound ID Sign-in → Review request → Accept**.
- Sign out and in again on the website. The Profile shows an **Owner card**, LV7, "Confirmed by GitHub".
A signed staff card (`records.py staff-add`) adds a permanent Hound ID later; it is not needed for LV7.

## 6. Guest passes (owner only)
A guest pass gives LV3 (Staff) access for 24 hours to whoever has its link, without a GitHub account. The owner grants it from the Profile (**Grant Guest Pass**). The relay checks with GitHub that the request comes from the owner's account, signs the pass, and later reads the Staff documents for the guest with the app's own short-lived token, limited to `hp-staff` and to reading. A pass cannot be extended; to cancel every pass at once, change `GUEST_SECRET`.

Setup, once:
1. GitHub App → **Credentials** → **Private keys** → **Generate a private key**. A `.pem` file downloads. Keep it private; delete the download after step 3.
2. GitHub App → **General**: note the **App ID** (a number).
3. Cloudflare → hp-signin → **Settings → Variables and Secrets**, add:
   - `OWNER_GITHUB_ID` (Text): `249122176`
   - `GITHUB_APP_ID` (Text): the App ID
   - `GUEST_REPO` (Text): `Hound-Protocol/hp-staff`
   - `GITHUB_APP_PRIVATE_KEY` (Secret): the whole content of the `.pem` file, including the BEGIN and END lines
   - `GUEST_SECRET` (Secret): a long random string, for example 40 characters from a password manager
4. Paste the current `tools/signin-relay/worker.js` into the worker (**Edit code** → **Deploy**) and check the variables are all still listed.
5. **Storage for claims and revoking passes:** Cloudflare → **Storage & Databases → KV** → **Create** a namespace named `hp-relay`. Then hp-signin → **Settings → Bindings → Add → KV namespace**: variable name `HP_KV`, namespace `hp-relay` → **Deploy**. It enables **Claim** on the contract board, and your Profile lists live guest passes with **Revoke pass** (a revoked guest is told within a minute). It holds only contract claims (GitHub name and number) and pass numbers.

## 7. Bans (LV0)
Banned GitHub accounts are refused at sign-in and see *Access revoked · LV0*. Add the GitHub account numbers to `BANNED_GITHUB_IDS` (Secret), separated by commas. The full procedure, across GitHub, Discord and Steam, is [HP-SOP-012](guides/HP-SOP-012-bans.md).

## Using it
- **Sign in:** the **Sign in** badge in the top bar, or the Profile page (`#/profile`). A GitHub window asks you to authorize *Hound ID Sign-in* once.
- **Profile:** your keycard (your signed staff card, or a member card), your session, and your documents.
- **Your documents:** one area per private repository. Areas above your clearance stay locked; inside an area GitHub decides what you can read.
- **Guest:** open the link the owner sent. The pass is kept in that tab; **End guest pass** on the Profile removes it.
- **Sign out:** the button on the Profile page, or close the tab.

## How it stays safe
- The relay keeps its secrets (client secret, app key, guest secret) and nothing else: no database, no logs of tokens or passes.
- Guest passes are signed by the relay and checked by the relay on every request. The browser cannot forge, extend or widen one. Only the owner's GitHub account can grant them.
- The token lives only in the reader's browser tab (session storage) and expires within 8 hours. Signing out removes it.
- The token can only read the contents of the three private repositories, and only those the person's teams can already read.
- Leaving a team removes access immediately ([HP-SOP-007](guides/HP-SOP-007-onboarding-offboarding.md)).
