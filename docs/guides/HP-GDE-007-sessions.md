# Sessions Guide: Hosting, Joining and Detection
Code: HP-GDE-007 · Version 1.1 · Effective 2026-10-23 · Owner: Development · For: players

This guide describes how sessions will work from version 0.1. Some details may still change during development; the decisions behind them are [ADR 0007](../decisions/0007-host-authority.md), [ADR 0008](../decisions/0008-browser-launch.md) and [ADR 0012](../decisions/0012-shared-alert.md).

## Host and clients
- One player is the **host**. The host's game runs the session: missions, enemies, the world and time. There is one version of events, so everyone sees the same thing.
- Up to **15 clients** join the host. Each client controls their own character and camera.
- The host holds every command position: the helicopter seat, the Command Center, briefings and radio, cutscenes and Mother Base command.
- If the host leaves, the session ends. Pick a host with a stable connection and a good PC.

## Hosting a session
1. Start the game with Joint Operations installed ([Player Guide](HP-GDE-001-player-guide.md)).
2. Open a session from the game's menu and choose who may join: friends only, by invitation, or listed publicly on the website's Session Browser.
3. Choose a mission or free roam. Clients join while you are in the helicopter or at a checkpoint.
4. Keep Steam running. Connections go through Steam, so there are no ports to open.

## Joining from the Session Browser
1. Open **Session Browser** on the website. Search, filter by region, mission or free slots, and sort.
2. Click **Join**. The site reserves your slot for two minutes and asks your browser to open the Joint Operations launcher (the first time, your browser asks for permission).
3. The launcher checks your install, the mod version and, on Linux, the Proton launch option. Then it starts the game.
4. The game skips the main menu and opens **equipment** (Sortie Prep). Pick your loadout and press **Deploy**. You arrive in the host's world.

You can also join a friend directly through a Steam invite.

## The detection status
The session has **one detection status**, like a single alert for the whole team.

| Status | What it means |
|---|---|
| **Hidden** | Nobody has been spotted. |
| **Searching** | Enemies are suspicious and looking. |
| **Detected** | Someone has been spotted and enemies are in combat. |

- When a player is spotted, **that player joins the status**. Enemies hunt the players who are part of it.
- Everyone else **stays Hidden** unless they are spotted too. Then they join the same status, not a new one.
- When the status winds down, everyone in it returns to Hidden together.
- Your screen shows the session's status and whether you are part of it.

So one careless player does not give the whole squad away, but a second player who gets spotted joins the same fight.

## Good habits
- Agree on a plan before deploying. The host's decisions are final in the game.
- Use voice or text chat. Calling out positions keeps the rest of the team Hidden.
- Report problems with the session's details (host, mission, what happened) in **#bug-reports** on Discord ([Quality Guide](HP-GDE-004-quality-testing.md)).
