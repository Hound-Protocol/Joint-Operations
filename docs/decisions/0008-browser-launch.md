# 0008: Joining a session from the website
Status: Proposed · Date: 2026-10-22 · Deciders: project lead, technical lead

## Context
The project lead wants a Battlelog-style flow. A player opens our website, picks a session and clicks Deploy. The game starts and the player arrives in the session, after a gear selection step. This was discussed, not decided ("don't build yet").

The flow we discussed:
**website → our launcher (through a `jointops://` link) → Steam → game → gear selection → session.**

Facts that shape the design (see `research/browser-launch.md`):
1. A website cannot start a program by itself. It can only open a link whose scheme a program has registered, such as `steam://` or our own `jointops://`. The browser asks the player first.
2. Steam already has this built in for lobbies. If the game is not running, a lobby join link starts it with `+connect_lobby <lobby id>`. If it is running, the game gets a `GameLobbyJoinRequested_t` event. Our lobbies would belong to MGSV's App ID (287700), because our code runs inside the game.
3. Our site is static (GitHub Pages). It cannot list live sessions without a server, and Steam does not offer a public web API for another app's lobbies.
4. MGSV starts through Konami's settings launcher (`mgsvlauncher.exe`) before the game itself. Whether command-line arguments reach the game through it is **unknown**.

## Decision (proposed)
Build it in three stages. Each stage works on its own, so we can stop at any stage.

**Stage 1. Invite links, no launcher (first playable build).**
- The host's in-game menu creates a lobby and copies an invite link to our site: `/#/join/<lobby id>`.
- That page checks nothing on the player's PC. It explains the requirements, then offers a **Join through Steam** button that opens Steam's own lobby link.
- Our plugin reads `+connect_lobby` at start-up, or the join event if the game is already running, and joins.
- Gear selection happens in the game, in our own menu, before the player is deployed.

**Stage 2. Our `jointops://` launcher.**
- A small launcher app registers `jointops://`. Before the game starts, it does what Steam cannot do: it checks that the mod is installed and on the right version, checks the game build (1.0.15.4) and, on Linux, checks the Proton launch option.
- It then starts the game through Steam and hands over the join request in a small local file that our plugin reads. That way the request does not depend on arguments surviving Konami's launcher.
- Optional: a loadout chosen on the website is passed the same way and pre-filled in the in-game gear screen.

**Stage 3. Session browser on the website.**
- Only if the community wants it. It needs a small session list service that hosts opt into, and a privacy review before launch. Until then, the server list stays in the game and the launcher.

**Link rules (all stages):**
- Accept exactly one form: `jointops://join/<lobby id>`, where the lobby ID is digits only. Reject anything else and log it.
- Never pass any part of a link to a shell or to Steam unparsed.
- Always show a confirmation ("Join <host name>'s session?") before starting the game.
- Links never install, update or download anything.

## Consequences
- Stage 1 needs no installer changes and works on Windows and on Linux, including Flatpak browsers, because Steam already handles `steam://` links.
- Stage 1 depends on the R13 result (current Steam interfaces reachable from the game). If R13 fails, joining falls back to the direct path, and Stage 1 becomes "copy the host's code into the game".
- Stage 2 adds a program players must install and that we must sign and maintain on two platforms.
- Stage 3 adds a server: cost, uptime and personal data (host names, Steam IDs). It would need our privacy notice updated first.

## Alternatives considered
- **Launcher-only from day one.** It matches the Battlelog feel best. Rejected for now: it adds a signed native app before we have a working session.
- **Session browser on the static site through the Steam Web API.** Not possible: lobby search runs inside the Steam client, not on Valve's public web API.
- **Browser extension.** Rejected: hard to install, and different for every browser.

## Open questions for the project lead
1. Is Stage 1 (Steam's join link plus our invite page) acceptable for the first playable build?
2. Should gear selection live only in the game, or also on the website (Stage 2)?
3. Should Stage 3 be on the roadmap at all, given the server and privacy cost?
