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
- Where can this app be installed: **Any account** (Advanced → **Make public** on an existing app). With *Only on this account*, only members of Hound-Protocol can authorize it, and everyone else gets GitHub's **404** page in the sign-in window. Public does not publish anything: it lets any GitHub account sign in, and an install elsewhere reaches only that account's own repositories, never ours.
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

## 6. Guest passes (Guest Pass 2.0)
A guest pass gives someone without a GitHub sign-in a clearance for 24 hours. LV7 holders grant it from the Profile (**Grant Guest Pass**): the owner (`OWNER_GITHUB_ID`) and any owner of the organization, which GitHub confirms on every request.

| Pass | Opens |
|---|---|
| **LV2** Guest Pass | Every section; no restricted documents |
| **LV3** Guest Pass | Staff documents |
| **LV5** Guest Pass · Low Clearance | Staff and Leads documents |
| **LV6** Guest Pass · High Clearance | Staff, Leads and Administration documents |

- **Link:** passes are numbered GC-00001, GC-00002 and so on. The link is the site plus the number and a 6-character secret, for example `…/Joint-Operations/#/GC-00001-7KQ4XW`. The secret stops anyone from claiming a pass by guessing the next number. It is shown once to LV7, and the relay keeps only an HMAC of it.
- **Claim:** the recipient sees *You have been granted temporary clearance via Guest Pass* with the clearance, writes their name (required, for the pass index) and presses **Claim**, within 72 hours. Their credential then rises in the middle of the window.
- **One device:** the claim binds the pass to that browser. The browser makes a key pair (ECDSA P-256) whose private half can never be read out, keeps it in IndexedDB, and signs every request with it. The relay checks each signature, and the request's time must be within 2 minutes. Anyone else opening the link is told *This pass is already in use by …* and gets nothing. If the holder clears their browser's data, the pass stops working there; LV7 can then give it a **New code**.
- **Duration and extension:** 24 hours from the claim. An hour before the end, the guest is warned and may **Request 24 h extension** (also on their Profile). Only one request can wait at a time, and only LV7 can approve it.
- **LV7 desk:** live passes on the left (**New code**, **Revoke**, **Clear**), requests on the right: visitors asking for a pass (approve at LV2, LV3, LV5 or LV6) and extensions. Below them, the **History**: every pass ever issued, to whom, at which level, when it was claimed, extensions, and the outcome (active, never claimed, ran out of time, revoked by whom, ended by the holder). **Clear** only hides a pass from the live list; **Forget** deletes a finished pass from the history, for someone who asks for their name to be removed.
- **Visitor requests:** an approved request is bound at once to the key the visitor's browser sent with it, so the pass opens there by itself.
- **Levels and repositories:** the relay reads restricted documents for the guest with the app's own short-lived, read-only token, only from repositories at or below the pass's level (`GUEST_REPOS`). Passes from before Site 1.3.0 no longer work.

Setup, once:
1. GitHub App → **Credentials** → **Private keys** → **Generate a private key**. A `.pem` file downloads. Keep it private; delete the download after step 3.
2. GitHub App → **General**: note the **App ID** (a number).
3. Cloudflare → hp-signin → **Settings → Variables and Secrets**, add:
   - `OWNER_GITHUB_ID` (Text): `249122176`
   - `GITHUB_APP_ID` (Text): the App ID
   - `GUEST_REPO` (Text): `Hound-Protocol/hp-staff`
   - `GUEST_REPOS` (Text), for LV5 and LV6 passes: `{"3":"Hound-Protocol/hp-staff","5":"Hound-Protocol/hp-leads","6":"Hound-Protocol/hp-admin"}`. Install the GitHub App on `hp-leads` and `hp-admin` too (GitHub App → **Install App** → Hound-Protocol → add the repositories).
   - `GITHUB_APP_PRIVATE_KEY` (Secret): the whole content of the `.pem` file, including the BEGIN and END lines
   - `GUEST_SECRET` (Secret): a long random string, for example 40 characters from a password manager
4. Paste the current `tools/signin-relay/worker.js` into the worker (**Edit code** → **Deploy**) and check the variables are all still listed.
5. **Storage for claims and revoking passes:** Cloudflare → **Storage & Databases → KV** → **Create** a namespace named `hp-relay`. Then hp-signin → **Settings → Bindings → Add → KV namespace**: variable name `HP_KV`, namespace `hp-relay` → **Deploy**. It enables **Claim** on the contract board and every guest pass feature. It holds contract claims (GitHub name and number), guest passes and their history (number, level, holder's name, times, outcome, the holder's public key), and visitor requests for 2 days.

## 6b. Clearance for visitors (LV1) and guest pass requests
- Everyone who is not signed in holds a temporary **LV1** pass. LV1 can **read every section**. **Acting** (claiming a contract, downloading a build, and later joining a session) opens a small *LV2 needed* window with **Sign in with GitHub** (LV2 at once) and **Request a guest pass**. Restricted documents stay behind their own clearance. A section can still be closed to LV1 completely (it then shows **No access** over a blurred page); none is today. This is a gate in the interface; public documents and release files stay public on GitHub.
- On each visit, a visitor sees a welcome window explaining restricted clearance, until that browser has once signed in with GitHub.
- **Requests:** a visitor asks with their name (2 to 40 characters, required), at most once a minute. The relay keeps open requests in one KV record (`asks`): at most 25 waiting, removed 2 days after they were made. LV7 sees them on the right half of the guest pass panel and approves or declines. LV7 picks the level when approving; the pass is bound to the visitor's browser at once, which collects it by itself (it checks every 20 seconds while open, and on each visit).
- **Sign-in length:** a sign-in lasts at most 24 hours at every level, then the person signs in again.
- **Keep me signed in on this device:** an opt-in box in the sign-in window (off by default). The sign-in is then kept in local storage, shared by every tab on that browser, and signing out in one tab signs out all of them. The page's security policy only lets the site's own scripts run, which keeps the token away from foreign scripts.
- Needs the KV storage (section 6, step 5) and the current `worker.js`.
- **Health:** `/health` answers the relay's version and whether its storage, guest settings and app key are present (yes or no, never their values). The site expects the version in `config.json` (`signin.relayVersion`); LV7 gets a message when the relay is behind, and **Options → Sign-in relay** shows its state for everyone.

## 7. Bans (LV0)
Banned GitHub accounts are refused at sign-in and see *Access revoked · LV0*. Add the GitHub account numbers to `BANNED_GITHUB_IDS` (Secret), separated by commas. The full procedure, across GitHub, Discord and Steam, is [HP-SOP-012](guides/HP-SOP-012-bans.md).

## Using it
- **Sign in:** the welcome window, a No access window, or the Profile page (the gear in the top bar, `#/profile`). A GitHub window asks you to authorize *Hound ID Sign-in* once.
- **Profile:** your keycard (your signed staff card, or a member card), your session, and your documents.
- **Your documents:** one area per private repository. Areas above your clearance stay locked; inside an area GitHub decides what you can read.
- **Guest:** open the link the owner sent, or ask for a pass with your name and wait for the owner's answer. The pass is kept in that tab; **End guest pass** on the Profile removes it.
- **Sign out:** the button on the Profile page, or close the tab (unless you chose to stay signed in on the device).

## How it stays safe
- The relay keeps its secrets (client secret, app key, guest secret) and nothing else: no database, no logs of tokens or passes.
- Guest passes are signed by the relay and checked by the relay on every request. The browser cannot forge, extend or widen one. Only LV7 (the owner, or an organization owner GitHub confirms) can grant or approve them.
- The token lives in the reader's browser tab (session storage), or on that device (local storage) when they choose to stay signed in, and the sign-in ends after at most 24 hours. Signing out removes it.
- The token can only read the contents of the three private repositories, and only those the person's teams can already read.
- Leaving a team removes access immediately ([HP-SOP-007](guides/HP-SOP-007-onboarding-offboarding.md)).
