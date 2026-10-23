# Dev Log

News and notes from Hound Protocol, newest first. It is updated regularly, whenever there is something worth telling. Every release, with its full list of changes, is in the [Changelog](../CHANGELOG.md); the plan is in the [Roadmap](../ROADMAP.md).

## 2026-10-24

### Site 1.0.0: the website gets its own version line
*Website*

The website is now **Site 1.0.0**, with its own version line, so **0.1** will mean only the mod's first playable build. The release also adds a Content Security Policy, screen-reader and focus fixes, a health check for the sign-in relay, and relay tests on every pull request.

## 2026-10-23

### Clearance at the door
*Website*

Everyone now starts on a temporary LV1 pass. The public pages stay open; the rest of the site asks you to sign in with GitHub, which gives LV2 at once, or to ask the owner for a guest pass by name. Approved passes open by themselves, and a sign-in now lasts at most 24 hours.

### The Dev Log is now a document
*Website*

The Dev Log moves into the Library as this document, next to the Changelog. The Changelog lists every release; this page holds the news and decisions around them, newest first, and is updated whenever there is something to tell.

## 2026-10-22

### New logos and an accountability system
*Organization*

Hound Protocol and Joint Operations have new logos in the style of unit insignia. And everyone, leads included, is now held to the same standard of care: careless work earns infractions, three suspend, appeals are always open, and there are no time limits. This is a passion project, not a boot camp.

### AI agents are credited, not ranked
*Organization*

Claude now works as a contractor's tool instead of technical lead, which becomes a seat for a person. Work done with an AI agent is credited to the person with the agent named, for example "Forge77, with Claude", detected automatically from commit trailers.

### License chosen, and quiet until 0.1
*Decision*

Code is GPL-3.0 with a permission to run inside MGSV and use Steam; docs are CC BY-SA 4.0; the brand stays ours. Forks are welcome but must stay open and keep the credits. Until 0.1 we build quietly: no promotion, recruiting by invitation.

### Chain of command and MGSV grades
*Organization*

Hound Protocol now runs on a solid hierarchy, open communication and transparency. Moderators and Administration decide social matters, Development and Administration decide technical ones, and Quality and contractors have no authority over others. Contractor grades now follow MGSV exactly: E to S++, held per field like staff per unit.

### Security, keycards and Hound IDs
*Release*

Weekly encrypted backups, keycard access levels LV1 to LV7, verifiable staff identities (Hound IDs), Discord integration, and a clear AI policy: AI can operate tools, but generative AI art is not accepted.

### Departments and contractor ranks
*Decision*

Hound Protocol now runs like Mother Base: Administration, Development, Quality and Contractor departments. Contractors are ranked A to S++ by completed contracts, each backed by a signed record. Version 0.1 is built by the project lead; donations open at 0.1.

### Website live and Discord open
*Milestone*

The site is live on GitHub Pages and the Hound Protocol Discord server is open: https://discord.gg/QTpJ89kMCM

## 2026-10-21

### Pre-development plan and research published
*Milestone*

Desk research on the engine, modding tools, Steam networking, Proton, law and funding, plus decision records and the gates that must close before development starts.

### Scope: a multiplayer mod
*Decision*

Joint Operations brings the game's online multiplayer functionality into the single-player world for up to 16 players. It is a multiplayer mod, not a co-op add-on.

### Website and documentation published
*Milestone*

The Hound Protocol site, project documents, contract board and mod repository went up for review.

### Transport chosen
*Decision*

GameNetworkingSockets over Steam relay, with direct IP as fallback. The Steam API variant will be decided by testing in Phase 1.

### Project founded
*Milestone*

MGSV: Joint Operations started, with Hound Protocol as the development team. Phase 0 (foundation) is underway.
