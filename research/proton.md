# Linux and Proton

Author: Claude (technical lead) · Date: 2026-10-21 · Status: desk research

## How a proxy DLL loads under Proton
Wine prefers its own built-in `dinput8.dll`, so a mod's proxy DLL is ignored unless the user overrides it. The standard Steam launch option is:

```
WINEDLLOVERRIDES="dinput8=n,b" %command%
```

`n,b` means: try the **native** DLL (ours) first, then Wine's **built-in** one. The same pattern is documented for other proxy-DLL tools and in an existing MGSV multiplayer mod's Linux instructions.

## Notes
- IHHook added a DXVK compatibility fix in r24, which suggests it runs under DXVK (as used by Proton). *(IHHook changelog)*
- An existing MGSV multiplayer mod supports Linux and SteamOS with the launch option above. *(Dynamite docs)*
- Steam is native on Linux, so Steam networking works the same way under Proton.

## What we must do
1. The installer and docs must show the launch option clearly. The site's Download page already lists Proton steps.
2. CI cannot run the game, so Proton testing is a manual step with a written checklist (see `docs/development-process.md`).
3. Record the tested Proton version with every test report.

## Bazzite specifics (lead's test rig)
Added 2026-10-22, desk research.
| Fact | Detail | Confidence |
|---|---|---|
| Game prefix | `~/.steam/root/steamapps/compatdata/287700/pfx/drive_c/`. Game files in `steamapps/common/MGS_TPP/` | confirmed (Bazzite guide; folder name to check on rig) |
| Proton versions | ProtonUp-Qt (KDE images) or ProtonPlus (GNOME images) installs GE-Proton and others | confirmed (Bazzite guide) |
| DLL override | Same launch option as above: `WINEDLLOVERRIDES="dinput8=n,b" %command%` | confirmed (Bazzite guide) |
| Windows tools in the prefix | Protontricks is pre-installed. Useful for running .NET mod tools such as GzsTool inside the game's prefix | likely |
| Known game issues | Game closing a few seconds after launch: users report it fixed by choosing Proton 8 or Experimental. Cutscene audio crackling on Steam Deck: fixed in Proton Experimental (August 2025) | likely (user reports, changelog) |

### Rig checklist for R1
1. Record Bazzite image and version (`rpm-ostree status`), Steam client build, Proton version.
2. Run the game once with no mods, reach the main menu, note any crash.
3. Add the launch option and a dummy `dinput8.dll` that writes a log line. Confirm the log appears.
4. Repeat with Proton Experimental and the latest GE-Proton. Note differences.

## Sources
- [Openplanet: Linux compatibility](https://openplanet.dev/docs/help/linux)
- [IHHook, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/1226)
- [Dynamite user documentation](https://github.com/unknown321/dynamite/blob/master/webui/docs/docs.md)
- [Managing and modding games on Bazzite (Universal Blue forum)](https://universal-blue.discourse.group/t/managing-and-modding-games-on-bazzite/2657)
- [Steam Community: game closes on Steam Deck](https://steamcommunity.com/app/287700/discussions/0/7340374598287055187)
- [GamingOnLinux: Proton Experimental fixes, August 2025](https://www.gamingonlinux.com/2025/08/proton-experimental-gets-fixes-for-the-finals-avatar-frontiers-of-pandora-and-metal-gear-solid-v/)
