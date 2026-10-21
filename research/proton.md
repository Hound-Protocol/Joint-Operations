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

## Sources
- [Openplanet: Linux compatibility](https://openplanet.dev/docs/help/linux)
- [IHHook, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/1226)
- [Dynamite user documentation](https://github.com/unknown321/dynamite/blob/master/webui/docs/docs.md)
