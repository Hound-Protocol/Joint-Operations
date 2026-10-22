# 0004: Loader
Status: Proposed · Date: 2026-10-21 · Deciders: technical lead

## Context
Native code loads into MGSV through a `dinput8.dll` proxy. IHHook (MIT) is the established proxy and can load DLL plugins from a `plugins` folder. Only one `dinput8.dll` can exist, so mods that each ship one conflict.

## Decision (proposed)
1. Primary: ship our native component as a **plugin loaded by IHHook**, so players can keep Infinite Heaven.
2. Fallback: our own minimal `dinput8.dll` proxy for players without IHHook.
3. Startup **version check**: refuse to run on any build other than the pinned one (1.0.15.4), and log why.
4. Lua side ships as script files, installed without overwriting other mods' files.

## Consequences
- Phase 1 checks that IHHook's plugin interface gives what we need (R2).
- Docs must state that Joint Operations cannot run alongside other mods that replace `dinput8.dll`.
