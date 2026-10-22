# Enemy AI in MGSV: How It Works
Author: TrueMan, with Claude (AI agent) · Date: 2026-10-23 · Status: desk research, not yet tested on a rig · Game build: 1.0.15.4 · Supports [ADR 0012](../docs/decisions/0012-shared-alert.md), contract C28

## Question
How do the guards in The Phantom Pain notice, report and hunt the player, and which parts can be made to work with up to 16 players and one shared detection status?

## Findings
The AI works on three layers. Facts first, guesses marked.

### 1. The soldier: perception
- Each soldier notices the player by **sight** and **sound**. Body pose, movement speed, light, weather and distance change how fast he notices: prone and still is very hard to see, fast crouched movement is heard at roughly 6 to 7 m, rain dulls hearing, sandstorms cut sight to a few metres, night needs light ([Prima](https://primagames.com/featured/metal-gear-solid-v-the-phantom-pain-spoiler-free-guide)).
- Noticing is gradual: a **suspicion indicator** fills before the soldier is sure. Then **Reflex Mode** gives the player a few seconds before he reports.
- A soldier also reacts to **evidence** without seeing anyone: bodies, sleeping or missing comrades, a Fulton balloon, noises.

### 2. The command post: the alert phase
- Soldiers belong to a **command post (CP)**: an outpost, a guard post or a base. The **phase** is kept per CP, not per player: Sneak, Caution, Evasion and Alert ([Infinite Heaven](https://nexusmods.com/metalgearsolidvtpp/articles/5) changes min and max phase per CP).
- A soldier who is sure **reports by radio**; the CP raises its phase. Without a working radio or comms equipment the report does not spread (gameplay knowledge, not verified in code).
- After combat the CP steps down over time: Alert → Evasion (lost sight, searching the last known position) → Caution → Sneak.
- Each CP walks its soldiers along **routes**, grouped in **route sets**, with a different set per phase. Infinite Heaven can re-randomize a CP's route set on phase change, which shows routes are data the CP selects, not fixed in code.

### 3. The mission: reinforcements and preparedness
- In combat a CP can call **reinforcements** (soldiers by helicopter or vehicle, in some missions only).
- The **Revenge System** adapts enemy equipment across missions to how the player plays: helmets after headshots, night-vision goggles after night ops, decoys and cameras after stealth, armor and shields after combat ([Metal Gear Wiki](https://metalgear.fandom.com/wiki/Revenge_System_(enemy_preparedness))). It is a campaign-wide counter, not live during a fight.

## What this means for Joint Operations
| Layer | Single player | With up to 16 players (planned) |
|---|---|---|
| Soldier perception | Watches one player | Must see **every** player in range. Each spotted player becomes known to that soldier |
| CP phase | One per CP | Kept as is, **per CP**. The session shows the highest phase of any CP as its one status |
| Who is hunted | The player | Only the players who were spotted (**members** of the alert). Everyone else stays Hidden |
| Suspicion without a culprit | Caution | Caution with nobody joining, until someone is actually seen |
| Reinforcements | Per mission | Unchanged, driven by the host |
| Revenge System | Your play style | The host's campaign; clients' actions count toward it (open question) |

The CP already keeps the phase for the guards, so a shared status fits the game's design. The new parts are a **membership list** (which players each CP knows about) and making perception and search target those players instead of one.

## Open questions (for C28 on a rig)
1. Where does a soldier keep the player he noticed and the last known position? Can it hold several targets?
2. Does perception run against a single player object, or against a list of characters we can extend with the clients' characters?
3. Which Lua or engine calls raise and lower a CP's phase? Can the host set them for the session?
4. How are radio reports modelled, so a report names the player who was seen?
5. Does Evasion search around one last known position, and can it search around several?
6. How should clients' actions count toward the Revenge System?

## Leads to check
- ModdersHeaven on X (https://x.com/ModdersHeaven_): suggested by the project lead as a source of MGSV modding knowledge. X needs a login to read, so it is not reviewed yet. Anything taken from it is written here in our own words, with credit.

## Sources
- Prima Games, MGSV spoiler-free guide: detection, suspicion, Reflex Mode, weather.
- Infinite Heaven feature list: phases per command post, route sets per phase.
- Metal Gear Wiki, Revenge System: preparedness categories and how they change.
- Observed gameplay: phase step-down, radio reports, reinforcements (to confirm on a rig).
