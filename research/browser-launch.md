# Starting the game from a website

Author: Claude (technical lead) · Date: 2026-10-22 · Status: desk research · Supports ADR 0008 (server browser and one-click join)

## Findings
| Fact | Detail | Confidence | Source |
|---|---|---|---|
| Steam lobby links start the game | When a player accepts a lobby invite and the game is not running, Steam starts it with `+connect_lobby <64-bit lobby id>` | confirmed | Steamworks matchmaking docs |
| Running game gets an event | If the game is running, Steam sends `GameLobbyJoinRequested_t` with the lobby ID | confirmed | Steamworks matchmaking docs |
| Link form | `steam://joinlobby/<app id>/<lobby id>/<host steam id>` is widely used by games and community sites | likely (community usage, not in Valve's public docs) | Facepunch.Steamworks wiki, community reports |
| Launch-argument warning | Steam may warn the player about launch arguments. Games silence it with `ISteamApps::GetLaunchCommandLine` (newer SDK) | confirmed (docs), unknown for MGSV | Steamworks matchmaking docs |
| Custom scheme on Windows | Registry key `HKEY_CURRENT_USER\Software\Classes\jointops` with an empty `URL Protocol` value and `shell\open\command` = `"launcher.exe" "%1"`. No admin rights needed | confirmed | Wails custom protocol guide |
| Custom scheme on Linux | A `.desktop` file with `MimeType=x-scheme-handler/jointops;` and `Exec=… %u`, then `update-desktop-database` and `xdg-mime default`. Check with `xdg-mime query default x-scheme-handler/jointops` | confirmed | Wails custom protocol guide |
| Flatpak browsers | Sandboxed browsers open outside links through the desktop portal, which follows the same xdg handlers. Needs testing on Bazzite | likely | KDE bug 401604, xdg docs |
| Link safety | Validate the scheme and the path against a strict pattern, never run link content, require a confirmation | confirmed (common guidance) | Wails custom protocol guide |
| MGSV start chain | Steam starts Konami's settings launcher first, which then starts the game. Whether launch arguments are passed on is unknown | unknown | to test on the rig |

## How Battlelog did it (Battlefield 3, 2011)
| Fact | Detail | Confidence | Source |
|---|---|---|---|
| Browser plugin launched the game | An optional Windows-only plugin started the game from the website and could also close it or start other modes | confirmed (observed by an outside engineer) | Ronacher, "Battlelog: Modern Web Applications are Here" |
| Slot reservation with a token | To join, the site asked the backend for a reserved slot and got a token. The plugin started the game with the token and a secret. The game used it to claim the slot | likely (inferred from observation) | same |
| Game reported back | The game booted in the background and told the page through the plugin when it had loaded | likely | same |
| Live updates | WebSockets through a push hub, also used for chat and game invites | likely | same |
| Server list | Pre-filtered by the player's approximate location from their IP. Servers reported their distance to regional ping sites. The client pinged each server through the plugin | likely | same |
| Loadouts on the web | Battlelog 2.0 let players customize weapons, kits and appearance on the site, updated in the game, with saved presets | confirmed | Battlefield Wiki |
| Server search everywhere | Battlelog 2.0 offered server search on the website and in the game | confirmed | Battlefield Wiki |
| End of browser plugins | Chrome removed NPAPI plugin support in 2015, which ended plugin-based launching. Launching then went through EA's Origin client | confirmed (Chrome), likely (Origin path) | Chromium blog, EA forums |

**What we take from it:** the slot reservation with a short-lived token, the server list from our own backend, joining straight into the game, and loadouts on the web as a later extra. **What we avoid:** a browser plugin. A registered link plus a small launcher does the same job in every browser.

## Session registry: facts that shape the API
| Fact | Detail | Confidence |
|---|---|---|
| No public lobby web API | Steam lobby search (`RequestLobbyList`) exists only inside the Steam client. A website cannot list our lobbies without our own service | confirmed (Steamworks docs list it only as a client API) |
| Host identity | Verifying a Steam user from a web service normally uses a session ticket checked through Valve's partner Web API, which needs the app's publisher key. We don't have one for MGSV | likely |
| Steam login on a website | Steam's OpenID sign-in works for any site, without a publisher key | confirmed (common practice) |
| Ping without a plugin | Steam gives each machine a ping location string, and two strings give an estimated ping (`ISteamNetworkingUtils`). The launcher or game could show real estimates. The website can only sort by region | likely |

## Rig tests (proposed as R14)
1. Start MGSV with `steam://run/287700//+connect_lobby 1234/` and log the game process's command line from a test plugin. Do this on Windows and on Proton.
2. Same through a real lobby invite between two accounts.
3. With the game running, accept an invite and confirm that `GameLobbyJoinRequested_t` fires (or that polling sees it, see R13 callback notes).
4. On Bazzite, open a `steam://` link from Firefox (Flatpak) and from a native browser. Note the prompts.
5. Register a dummy `jointops://` handler on both platforms and confirm the browser prompt and the received argument.
6. From a test plugin, find out whether the game can skip the title screen and open Sortie Prep directly (feeds R6 and C18).

## Sources
- [Steamworks: Matchmaking and lobbies](https://partner.steamgames.com/doc/features/multiplayer/matchmaking)
- [Facepunch.Steamworks: OnGameLobbyJoinRequested](https://wiki.facepunch.com/steamworks/SteamFriends.OnGameLobbyJoinRequested~edit)
- [Wails: custom URL protocols](https://docs-preview.wails.io/guides/distribution/custom-protocols/)
- [KDE bug 401604: URL scheme handlers](https://bugs.kde.org/show_bug.cgi?id=401604)
- [Armin Ronacher: Battlelog, modern web applications are here (2011)](https://lucumr.pocoo.org/2011/11/15/modern-web-applications-are-here/)
- [Battlefield Wiki: Battlelog](https://battlefield.fandom.com/wiki/Battlelog)
- [Chromium blog, November 2014 (NPAPI deprecation)](https://blog.chromium.org/2014/11)
