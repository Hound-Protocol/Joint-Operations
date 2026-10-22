# File formats and modding tools

Author: Claude (technical lead) · Date: 2026-10-22 · Status: desk research · Game build: 1.0.15.4

## Why this matters
The game's Lua scripts, mission data and assets live inside packed archives. Phase 1 work on players, the roster and missions (R3, R5, R6) starts with reading those files on our own machines. This note lists the tools, what each handles, and whether we may reuse it.

## Formats in brief
| Format | What it holds |
|---|---|
| `.dat` (QAR) | The game's top-level archives. Some entries are encrypted |
| `.fpk` / `.fpkd` | Packs. `fpk` usually holds assets, `fpkd` holds data such as `.fox2` entity files and scripts |
| `.fox2` | Fox Engine entity data (binary). Tools convert it to XML |
| `.pftxs` | Texture packs |
| `.sbp`, `.stp`, `.sab` | Sound packs |
| `.mtar` | Animation archives |
| `.fmdl`, `.ftex`, `.gani`, `.frig` | Models, textures, animations, rigs |
| `.lua` | Game scripts, inside the archives. Mission scripts sit with their mission packs |

File names inside archives are stored as **hashes**. Tools turn them back into names with community **dictionaries** (TinManTex's `mgsv-lookup-strings`). Unknown hashes stay as numbers.

## Tools
| Tool | Handles | License / terms | Use for us |
|---|---|---|---|
| **GzsTool** (Atvaark) | Unpack and repack dat/qar, fpk, fpkd, pftxs, sbp. Writes an XML file per archive, used to repack | **MIT**, C#, .NET Framework 4.5 | Main extraction tool for research. Note: repacking does not re-encrypt, so repacked archives are smaller |
| **FoxTool** | fox2 to XML and back | see wiki | Reading entity data |
| **FoxBrowser** (Nexus 2531) | Read-only browser for nearly all formats above, previews, Lua view, fox2 as XML, export | No open-source license. No re-uploads, permission needed for changes | Fast way to look around. **Use only, never redistribute or copy** |
| **SnakeBite** | Mod manager: installs `.MGSV` packages into the archives | license file present, type not confirmed | Players use it. Our installer must not break it |
| **MtarTool, FtexTool, Fmdl Studio v2, LangTool, SubpTool, FcnpTool, LbaTool, VfxTool** | Single formats (animations, textures, models, text, subtitles, others) | various | Only needed later, if we touch those formats |
| **MockFox** | Mock of the game's Lua environment | not checked | Possible test bed for our Lua outside the game |

The r/moddergearsolid wiki keeps the current list of tools and download links.

## Lua: what we know and what we don't
- The game's Lua is **statically compiled**. We cannot load native Lua modules. Native code goes through the hook DLL. *(confirmed, IHHook docs)*
- Mission scripts and the systems they call are plain Lua inside the archives, readable after extraction. *(confirmed by tool support)*
- Infinite Heaven shows that large gameplay changes are possible from Lua alone. Its repository has **no software license**, so we **read for understanding only** and copy nothing. *(confirmed, repo README)*
- **Unknown, for R3/R5/R6 on a rig:** which scripts control player spawn, buddy control and helicopter arrival; whether the soldier roster can be read from Lua; how the FOB and MGO code paths set up extra players.

## Rules for using these tools
1. Extract on your own machine from your own copy. Extracted files never go into our repository.
2. Write findings in our own words, with the file path inside the archive and the game build.
3. Record the tool name and version with every finding.
4. GzsTool and other MIT tools may be used in our build scripts later with attribution. FoxBrowser and other unlicensed tools may not be bundled.

## Sources
- [GzsTool repository](https://github.com/Atvaark/GzsTool)
- [FoxBrowser, Nexus Mods](https://www.nexusmods.com/metalgearsolidvtpp/mods/2531)
- [r/moddergearsolid wiki](https://www.reddit.com/r/moddergearsolid/wiki/index)
- [Infinite Heaven repository](https://github.com/TinManTex/InfiniteHeaven)
- [SnakeBite repository](https://github.com/folly-ah-duh/SnakeBite)
