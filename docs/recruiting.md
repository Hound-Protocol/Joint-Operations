# Recruiting kit

Status: DRAFT. Nothing here is posted yet. The project lead decides when and where to post.

This kit has ready-to-post texts, one pitch per role, answers to the usual questions, and the rules for whoever posts. Every post points to the Discord and the contract board.

- Discord: https://discord.gg/QTpJ89kMCM
- Website: https://hound-protocol.github.io/Joint-Operations/
- Code: https://github.com/Hound-Protocol/Joint-Operations
- Contract specs: [contracts.md](contracts.md)

## Before posting (checklist)
- [ ] The contract board has live GitHub issues (contract C15), so newcomers can claim something on day one
- [ ] Discord onboarding is on, and #welcome explains roles
- [ ] License decision recorded (ADR 0005). Contributors will ask
- [ ] Someone can answer replies for the first 48 hours
- [ ] Each venue's self-promotion rules read and followed

## Long post (Reddit, forums, Nexus)
**MGSV: Joint Operations: a multiplayer mod for Metal Gear Solid V, for up to 16 players (PC, looking for contributors)**

Hound Protocol is a community development team building **MGSV: Joint Operations**. It brings online play into the single-player world of The Phantom Pain: one player hosts from Venom Snake's position (helicopter, Command Center, briefings, Mother Base), and up to 15 others deploy as soldiers from the Mother Base roster. Players arrive and leave through the game's own mechanics, not pop-ins.

**What it is**
- Unofficial, fan-made, non-commercial and open source.
- For Windows, and Linux through Proton.
- Built in the open: roadmap, architecture and every decision are public.
- Never touches Konami's online services, FOBs or anti-cheat.

**Where we are:** early. Phase 0 (structure and documentation) is almost done, and Phase 1 research is starting. Nothing is playable yet, and we won't give a release date.

**How it works:** we run as a contract network. Every task is a contract with a clear goal and acceptance criteria. Take one, deliver it, leave whenever you like. Hand-written and AI-assisted work count the same: what matters is that it meets the criteria and passes review. Completed contracts earn rank, and a signed contributor record is planned.

**Who we need**
- Reverse engineering and game hooks (C++, x64, debuggers)
- Networking (UDP, state sync, Steamworks)
- Linux/Proton and Windows testers with a legal copy of the game
- Docs writers, web developers, community moderators

**Start here:** read the contract board, pick one with no open dependencies, and say hi in Discord.
Discord: https://discord.gg/QTpJ89kMCM · Site: https://hound-protocol.github.io/Joint-Operations/

## Short post (Discord servers, Bluesky, X, Mastodon)
Building MGSV: Joint Operations, an unofficial open-source multiplayer mod for Metal Gear Solid V (PC, Windows and Linux/Proton), for up to 16 players. Early stage. Looking for reverse engineers, netcode devs, Proton testers and docs writers. Contract-based: take a task, deliver it, leave any time. https://discord.gg/QTpJ89kMCM

## One-liner (bios, signatures)
MGSV: Joint Operations · open-source 16-player multiplayer mod for The Phantom Pain · contributors wanted · discord.gg/QTpJ89kMCM

## Role pitches
Use these as replies to "what could I do?" or as separate posts in specialist communities.

| Role | Pitch | First contracts |
|---|---|---|
| **RE / hooks** | Find out how the game spawns the player and companions, and whether more controllable characters can exist. The core unknown of the project | C04, C06, C19 |
| **Networking** | Prove the transport outside the game, then measure 16 players. Steamworks or GameNetworkingSockets experience helps | C09, C10, C20 |
| **Proton tester** | Set up the Linux rig and confirm the mod loads under Proton. Bazzite, SteamOS or any distro with Steam | C02, C05, C21 |
| **Windows tester** | Pin the game build and keep a clean, repeatable test rig | C01, C12 |
| **Tooling** | A mock Steam DLL and bad-network profiles so we can test on one PC | C11, C12 |
| **Docs and community** | Keep the docs readable, run onboarding, moderate | C15, docs fixes |
| **Web and design** | Lobby and session screens, the website | C16 |

## Answers to the usual questions
- **Is this approved by Konami?** No. It is an unofficial fan project, not affiliated with or endorsed by Konami.
- **Will it get me banned?** We never touch FOBs, Konami's servers or anti-cheat. Our sessions are separate from the game's online mode. Each build will say exactly what it changes.
- **Is it co-op?** It's a multiplayer mod. It brings online functionality into the single-player world, with one host in Venom Snake's position and players as Mother Base soldiers.
- **When is it out?** No date. The roadmap shows the phases and what is done.
- **Do I get paid?** Not now. Contributions are recorded publicly, and signed records are planned. If donations open later, they go to hosting and development, are reported openly, and any payouts follow the published rules.
- **Can I use AI tools?** Yes. Hand-written and AI-assisted work are reviewed and counted the same way. You are responsible for what you submit.
- **Do I need to commit to anything?** No. Take one contract, finish it or hand it off with a short note.
- **Is the code from another mod?** No. We don't copy other mods' code. We study public documentation and observed game behavior, and credit what we learn from.

## Where to post (to be confirmed by the lead)
| Venue | Text | Notes |
|---|---|---|
| r/metalgearsolid | Long | Check self-promotion rules. Post once, answer replies |
| r/moddergearsolid | Long, technical angle | Lead with RE and research needs |
| Nexus Mods forums (MGSV) | Long | No download yet. Say so clearly |
| Linux gaming communities (r/linux_gaming, Bazzite and Universal Blue forums) | Role pitch: Proton tester | Linux support is a selling point |
| Modding Discords | Short | Only where promotion is allowed, in the right channel |
| Bluesky, X, Mastodon | Short | Add a screenshot of the website |

## Rules for anyone posting for us
- Say clearly that the project is unofficial and early.
- Never promise dates, pay or features.
- Never recruit by naming or criticizing other mods or their authors.
- Never ask anyone for game files, tokens, passwords or personal data.
- Post once per venue. No mass DMs.
- Log what was posted where, with the date, in the moderators' channel so we don't post twice.
