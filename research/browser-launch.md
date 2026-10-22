# Starting the game from a website

Author: Claude (technical lead) · Date: 2026-10-22 · Status: desk research · Supports ADR 0008

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

## Rig tests (proposed as R14)
1. Start MGSV with `steam://run/287700//+connect_lobby 1234/` and log the game process's command line from a test plugin. Do this on Windows and on Proton.
2. Same through a real lobby invite between two accounts.
3. With the game running, accept an invite and confirm that `GameLobbyJoinRequested_t` fires (or that polling sees it, see R13 callback notes).
4. On Bazzite, open a `steam://` link from Firefox (Flatpak) and from a native browser. Note the prompts.
5. Register a dummy `jointops://` handler on both platforms and confirm the browser prompt and the received argument.

## Sources
- [Steamworks: Matchmaking and lobbies](https://partner.steamgames.com/doc/features/multiplayer/matchmaking)
- [Facepunch.Steamworks: OnGameLobbyJoinRequested](https://wiki.facepunch.com/steamworks/SteamFriends.OnGameLobbyJoinRequested~edit)
- [Wails: custom URL protocols](https://docs-preview.wails.io/guides/distribution/custom-protocols/)
- [KDE bug 401604: URL scheme handlers](https://bugs.kde.org/show_bug.cgi?id=401604)
