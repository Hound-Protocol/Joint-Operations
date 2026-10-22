# 0008: Server browser on the website and one-click join
Status: Proposed · Date: 2026-10-22 · Deciders: project lead, technical lead

## Context
The project lead's goal, inspired by Battlefield 3's Battlelog:

**Search servers on our website → click a server → the game launches straight into equipment → Deploy drops the player into that session.**

What Battlelog did, and what we take from it (details and sources in `research/browser-launch.md`):

| Battlelog (2011) | Lesson for us |
|---|---|
| The server list came from EA's backend, filtered by the player's region | We need our own small **session registry API**. A static site cannot list live sessions, and Steam has no public web API for another app's lobbies |
| Joining asked the backend to **reserve a slot**, which returned a **token**. The plugin started the game with that token, and the game claimed the slot | Reserve a slot before launching, so a player never waits through a load to find the server full |
| A Windows-only **browser plugin** started the game and reported back when it had loaded | Browser plugins died (Chrome removed them in 2015). Use a registered link (`jointops://`) and a small launcher instead. These work in every browser, on Windows and Linux |
| The client pinged each server through the plugin | The website cannot ping. Sort by region and show the ping the launcher measures |
| Loadouts were edited on the web and updated in the game | Optional later: pick equipment on the site, pre-filled in the game |

The game side fits naturally. MGSV already has a **Sortie Prep** screen (equipment, buddy, time and landing zone) before every deployment, and a helicopter drop. "Launch straight into equipment" maps to our version of Sortie Prep. "Deploy" maps to the drop into the host's session.

## Decision (proposed)

### Flow
1. **Host** starts a session in the game. Our plugin creates a Steam lobby and, if the host allows public listing, registers it with the session registry. It then sends a heartbeat every 30 seconds.
2. **Website** Servers page lists sessions from the registry API: search, filters (region, mission or free roam, free slots, mod version, password), sort.
3. Player clicks **Join**. The site asks the API to **reserve a slot** and gets back a short-lived **join ticket** (valid 2 minutes).
4. The site opens `jointops://join/<session id>?t=<ticket>`. The browser asks the player once whether to open the launcher.
5. **Launcher** checks the mod install, the mod version against the session's version, the game build (1.0.15.4) and, on Linux, the Proton launch option. It then starts the game through Steam and hands over the session ID and ticket in a local file.
6. **Game** starts. Our plugin reads the hand-off, joins the host's Steam lobby, and presents the ticket. The host checks it and accepts the player. The player skips the main menu and goes straight to **equipment** (Sortie Prep).
7. Player presses **Deploy** and arrives in the host's world through an in-game arrival (helicopter or the drop chosen in R6/C18).

If the game is already running, steps 5 and 6 take a shortcut: the launcher passes the request to the running game instead of starting it again.

### Session registry API (v1 sketch)
A small public service, documented and versioned, so other tools (our Discord bot, community sites) can use it too.

| Call | Who | Purpose |
|---|---|---|
| `GET /v1/sessions` | Anyone | List public sessions, with filters |
| `GET /v1/sessions/{id}` | Anyone | One session's details |
| `POST /v1/sessions` | Host plugin | Register a session. Returns a session ID and a private host key |
| `PUT /v1/sessions/{id}` | Host plugin (host key) | Heartbeat: player count, mission, state. Sessions with no heartbeat for 90 seconds disappear |
| `DELETE /v1/sessions/{id}` | Host plugin (host key) | End the session |
| `POST /v1/sessions/{id}/reserve` | Website | Reserve a slot, returns a join ticket |
| `GET /v1/sessions/{id}/tickets` | Host plugin (host key) | Fetch pending tickets to check joining players against |

**Session data, public:** session ID, display name, host name (opt-in), region, mission or free roam, players (n/16), mod version, game build, password flag, created time.
**Never public:** Steam lobby ID and Steam IDs (only the launcher receives the lobby ID, with a valid ticket), IP addresses.

### Resilience
The registry is a convenience, not a single point of failure. The launcher and the in-game menu can also find sessions directly through Steam lobby search. If the API is down, joining still works from inside the game.

### Link rules
- Accept exactly `jointops://join/<session id>?t=<ticket>`, with both parts matched against strict patterns. Reject and log anything else.
- Never pass any part of a link to a shell or to Steam unparsed.
- The launcher shows "Join <server name>?" before starting the game.
- Links never install, update or download anything.

### Abuse and privacy
- Registration is rate-limited per IP, and every listing needs regular heartbeats.
- A "Report server" button, with moderators able to remove listings.
- Public listing is opt-in for the host. Private sessions are joined by invite only.
- The privacy notice must be updated before the API goes live: what is stored, for how long (session data deleted when the session ends; rate-limit records after 24 hours).
- Open question: verifying that a host really owns a Steam account needs either the publisher Web API key (which we don't have for MGSV) or a Steam login on our site. Not needed for v1.

### Hosting
A serverless platform with a free tier (for example Cloudflare Workers with a small database). At our scale, the expected cost is zero or close to it. The account must belong to the project, not to one person. The provider is chosen in a separate small decision when we build it.

### Order of work
The first playable build may ship with in-game invites only (Steam's own lobby invites) while the API and launcher are built, but the target is the full flow above.
1. Steam invites in game (needs R13).
2. Launcher and `jointops://` link with a direct "join by code" (needs R14).
3. Registry API, the Servers page on the site, slot reservation and tickets.
4. Optional: equipment chosen on the website and pre-filled in the game.

## Consequences
- We run a public service: uptime, abuse handling, privacy duties and a small ongoing cost. This is the first piece of Hound Protocol that is not static.
- The launcher becomes a required install for website joins, and must be signed and maintained on Windows and Linux.
- The in-game side needs: lobby registration, ticket checks on the host, a direct path to the equipment screen, and arrival on deploy. These become contracts after Phase 1 confirms the basics (R3, R6, R12, R13).
- The website's Sessions page, now a mock-up, becomes the real server browser.

## Alternatives considered
- **Browser plugin, as in Battlelog.** Impossible today: modern browsers removed plugin support.
- **Website talks to a local launcher over localhost.** Possible, but browsers increasingly block websites from reaching local services, and it opens a local attack surface. A registered link is simpler and safer.
- **No API, Steam lobby search only.** Works in the game and the launcher, but the website could not show servers. Kept as the fallback.
- **List lobbies on the website through Valve's web API.** Not possible: lobby search exists only inside the Steam client.

## Open questions for the project lead
1. Is the flow above what you have in mind, including Sortie Prep as the equipment screen?
2. Are you OK with Hound Protocol running a small public service (and the privacy and moderation work that comes with it)?
3. Should equipment on the website (step 4) be on the roadmap now, or later?
