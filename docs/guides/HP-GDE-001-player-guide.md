# Player Guide: Installing and Playing
Code: HP-GDE-001 · Version 1.0 · Effective 2026-10-22 · Owner: Administration · For: players

> **Status:** Joint Operations is in development. The first playable version is **0.1**. This guide describes how it will work and is updated with every release.

## What you need
- Metal Gear Solid V: The Phantom Pain on Steam, your own copy, updated to the current version (1.0.15.4).
- Windows 10 or 11, or Linux with Steam and Proton (Bazzite, SteamOS, or any distro).
- The Steam client running and signed in.
- A save made with the normal game, kept safe. Joint Operations uses its own saves.

## Install (from 0.1)
1. Download the latest release from the website's **Download** page. Check the file against `SHA256SUMS` if you can.
2. Follow the install notes in the release. The installer backs up your saves and checks your game version.
3. **Linux only:** in Steam, right-click MGSV → Properties → Launch Options and enter:
   ```
   WINEDLLOVERRIDES="dinput8=n,b" %command%
   ```
   See [HP-GDE-002](HP-GDE-002-linux-proton.md).

## Play
- **Host:** start a session from the in-game menu. You take Venom Snake's position: helicopter, Command Center, briefings, Mother Base.
- **Join:** pick a server on the website's **Sessions** page or accept a Steam invite. You deploy as a soldier from the host's Mother Base roster, after choosing your equipment.
- Up to 16 players per session.

## Stay safe
- Joint Operations never touches Konami's servers, FOBs or anti-cheat. Don't use it with them.
- Download only from our website or our GitHub releases. Never run a "Joint Operations" file from anywhere else.
- We will never ask for your Steam password, game files or payment.

## Problems
- Check the **Known issues** list in the release notes first.
- Report bugs on GitHub (bug report template) or in #bug-reports on Discord, with your game version, platform and steps to reproduce.

## Uninstall
Use the uninstaller from the release, or remove the files listed in the release notes. Your normal saves are never changed.
