# Linux and Proton Guide
Code: HP-GDE-002 · Version 1.0 · Effective 2026-10-22 · Owner: Quality · For: players and testers on Linux

## Why it needs one extra step
Joint Operations loads through a `dinput8.dll` file next to the game. Wine and Proton prefer their own copy, so you tell Proton to use ours.

## Setup
1. Install MGSV in Steam and run it once without mods. Reach the main menu, then quit.
2. Steam → MGSV → Properties → **Launch Options**:
   ```
   WINEDLLOVERRIDES="dinput8=n,b" %command%
   ```
   `n,b` means: use the native file (ours) first, then the built-in one.
3. Properties → **Compatibility**: tick "Force the use of a specific Steam Play compatibility tool" and choose **Proton Experimental** or a recent **GE-Proton**.

## Where things are
| What | Path |
|---|---|
| Game folder | `~/.steam/root/steamapps/common/MGS_TPP/` (check in Steam: Manage → Browse local files) |
| Game prefix (Windows files) | `~/.steam/root/steamapps/compatdata/287700/pfx/drive_c/` |

## Bazzite
- Steam, Proton and **Protontricks** come pre-installed.
- Install GE-Proton with **ProtonUp-Qt** (KDE images) or **ProtonPlus** (GNOME images).
- Firefox is a Flatpak. Links like `steam://` open through the desktop portal; allow them when asked.

## Known issues
| Problem | Fix |
|---|---|
| Game closes a few seconds after launch | Switch to Proton Experimental or Proton 8+ |
| Crackling audio in cutscenes (Steam Deck) | Fixed in Proton Experimental (August 2025) |
| Mod does not load | Check the launch option is exactly as above, and that `dinput8.dll` is in the game folder |

## Reporting
Always include: distro and version, Steam client build, Proton version, GPU and driver. Testers follow [HP-GDE-004](HP-GDE-004-quality-testing.md).
