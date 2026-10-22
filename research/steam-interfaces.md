# Steam interfaces from inside the game (R13)

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-22 · Status: desk research, not yet tested on a rig · Game build: 1.0.15.4 (title 1.15)

## The question
MGSV ships its own `steam_api64.dll` from 2015. The networking interfaces we want (`ISteamNetworkingMessages`, `ISteamNetworkingSockets`, `ISteamNetworkingUtils`) are newer than that. Can our code, running inside the game process, still reach them? This decides ADR 0003.

## Short answer
**Likely yes.** The game's old DLL is only a loader. The interfaces themselves are served by the Steam client that is installed on the player's machine, and that client is always current. Code can ask the client for a newer interface by its version string, using the handles the game has already opened. *Confidence: likely. Must be confirmed with the test below.*

## How interfaces are served
| Fact | Detail | Confidence | Source |
|---|---|---|---|
| Interfaces are requested by version string | Every interface has a name such as `SteamUser023`. `ISteamClient::GetISteamGenericInterface(user, pipe, version)` returns the interface for that string, or NULL | confirmed | Steamworks ISteamClient docs |
| Valve's own wording | The docs say you "should never need to use this under normal conditions". It is a supported function, but meant for unusual cases like ours | confirmed | Steamworks ISteamClient docs |
| Newer SDKs use the same path | From roughly SDK 1.43 onward, the SDK wraps interface lookup in `SteamInternal_FindOrCreateUserInterface`, which asks the client for a version string in the same way | likely | Steamworks.NET SDK update commits, gbe_fork notes |
| Old and new versions coexist | The client serves many versions of each interface side by side. Each version has its own function table, so the caller must use the exact layout of the version it asked for | confirmed (emulator implementations mirror the client) | gbe_fork interface notes |
| **Precedent** | MetaHookSv's SteamAPIBridge loads plugins into GoldSrc games, which ship a very old Steam API. On that runtime it uses the old `SteamClient012` interface with the game's existing user and pipe to request **newer** interfaces (`SteamUser023`, `SteamScreenshots003`, `SteamHTTP003`) | confirmed (project README) | SteamAPIBridge |

## What this means for our transport
1. Get the game's `ISteamClient` (the old DLL exports `SteamClient()`), plus `GetHSteamUser()` and `GetHSteamPipe()`.
2. Ask for the networking interfaces by exact version string, matching the Steamworks SDK headers we build against.
3. Declare those interfaces in our own code from the SDK headers. Do not mix them with anything the game's DLL declares.
4. **Callbacks are the main risk.** Newer networking callbacks (session requests, connection status) are dispatched through the game's callback loop. Two ways around it, to be tested:
   - Poll instead of waiting for callbacks (`ReceiveMessagesOnChannel` every frame, session requests accepted by policy).
   - For `ISteamNetworkingSockets`, set the connection-status callback as a function pointer through the networking config values. That path does not use the game's dispatcher.
5. Relay (SDR) access is started with `ISteamNetworkingUtils::InitRelayNetworkAccess`. Test that it works from inside the game.

## Rig test (R13, about half a day)
Run on Windows and on Proton (Bazzite). Record the Steam client build and the Proton version.
1. Log the version of the game's `steam_api64.dll` (file version and SHA-256) and its exports. Do not commit the file.
2. From a test plugin, request `SteamNetworkingUtils`, `SteamNetworkingMessages` and `SteamNetworkingSockets` at the versions in the current SDK. Log NULL or not for each.
3. If not NULL: send a reliable message between two accounts on two machines (by Steam ID), polling only.
4. Repeat with a lobby: `ISteamMatchmaking::CreateLobby`. Note which App ID the lobby belongs to (expected 287700).
5. Try both callback approaches from point 4 above. Note which ones fire.
6. Write the results here, with a pass or fail for each step, and update ADR 0003.

**Pass:** steps 2 and 3 work on both platforms. **Fallback if it fails:** the direct path (open-source GameNetworkingSockets over UDP), plus our own small signaling server for NAT traversal. The App ID question in `steam-networking.md` stays a release gate either way.

## Sources
- [Steamworks: ISteamClient](https://partner.steamgames.com/doc/api/ISteamClient)
- [Steamworks: ISteamNetworkingMessages](https://partner.steamgames.com/doc/api/ISteamNetworkingMessages)
- [MetaHookSv SteamAPIBridge](https://github.com/MetaHookSv/SteamAPIBridge)
- [gbe_fork: interface factory and versioning (DeepWiki)](https://deepwiki.com/Detanup01/gbe_fork/3.2-interface-factory-and-versioning)
- [Steamworks.NET: SDK 1.51 update](https://github.com/rlabrecque/Steamworks.NET/commit/6527a29b0e494835b03f71e4af64c8f5de3053bc)
