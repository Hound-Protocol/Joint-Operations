# MGSV modding ecosystem

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-21 · Status: desk research

## Tools and mods that matter to us
| Project | What it is | License / terms | Relevance |
|---|---|---|---|
| **Infinite Heaven (IH)** by tinmantex | Large gameplay mod built on Lua. Adds options, custom missions and side ops, and an addon system. Version r267 (2026-09), targets game 1.0.15.4 | Source on GitHub, no software license stated. Nexus terms: no re-uploads, modifications need permission | The de facto base of the scripting scene. Many players already run it. We must stay **compatible** with it, and must not copy its code |
| **IHHook** | Proxy `dinput8.dll` that loads with the game. Adds a Dear ImGui menu, Lua C API access, a named-pipe channel, hooks with per-version addresses, and (r25) loading of DLL and ASI plugins from a `plugins` folder | **MIT** (source repository) | The proven way to run native code in the game. MIT allows reuse with attribution. Its plugin folder could let Joint Operations load **alongside** IH instead of replacing its DLL |
| **SnakeBite** | Mod manager and launcher. Installs `.MGSV` mod packages into the game's `.dat` archives, with backups and presets | `license.txt` present, type not confirmed | Common install path for players. Our installer should not break SnakeBite installs |
| **GzsTool** | Unpacks and repacks the game's archives. See [file-formats-and-tools.md](file-formats-and-tools.md) | **MIT** | Research and, later, build scripts |
| **mgsv_buildmod** | Build tool used to package Infinite Heaven | not checked | Reference for packaging |
| **MockFox** | Mock of the game's Lua environment, used to auto-generate IH docs | not checked | Possible basis for testing our Lua outside the game |

## Key technical points
- Native code loads through a **`dinput8.dll` proxy**. IHHook uses this, and so does an existing multiplayer mod. Only one `dinput8.dll` can sit in the game folder, so two mods that both ship one will conflict. *(confirmed by both projects' docs)*
- The game's Lua is **statically compiled**, so native extensions must be compiled into the hook DLL rather than loaded as Lua modules. *(IHHook docs)*
- Hook addresses are **specific to a game build**. IHHook keeps per-version address tables and a version check. *(IHHook docs)*
- IHHook builds with Visual Studio 2017 (v141) and the Windows 10 SDK. An existing multiplayer mod ported an adapted copy to build on Linux. *(project docs)*

## Recommendation (Proposed, see ADR 0004)
1. Ship our native component as a **plugin that IHHook can load**, if Phase 1 confirms the plugin interface is suitable. Players who use IH then keep their setup.
2. Keep a **standalone fallback**: our own `dinput8.dll` proxy for players without IH.
3. Pin **game build 1.0.15.4** for all address work, with a version check at startup that refuses to run on other builds.
4. Do not depend on code we may not reuse. IHHook (MIT) may be reused with attribution. Infinite Heaven and other mods' code may **not** be copied.

## Sources
- [Infinite Heaven, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/45)
- [Infinite Heaven repository](https://github.com/TinManTex/InfiniteHeaven)
- [IHHook, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/1226)
- [IHHook repository](https://github.com/kapuragu/IHHook)
- [SnakeBite repository](https://github.com/folly-ah-duh/SnakeBite)
- [Dynamite user documentation](https://github.com/unknown321/dynamite/blob/master/webui/docs/docs.md)
