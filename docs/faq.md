# Frequently Asked Questions

Short answers to what people ask most. The details are in the [Overview](../README.md), the [Player Guide](guides/HP-GDE-001-player-guide.md) and the [Sessions Guide](guides/HP-GDE-007-sessions.md).

## Is it free?

Yes. Joint Operations is free and open source, and it always will be.

## Do I need my own copy of the game?

Yes, Metal Gear Solid V: The Phantom Pain on Steam. We never share game files.

## Is it connected to Konami?

No. Hound Protocol and Joint Operations are an independent fan project: Konami has no part in it and no connection to it.

## How many players?

Up to 16 per session: one host and up to 15 clients.

## When can I play?

From version 0.1, the first playable release. Follow the [roadmap](../ROADMAP.md) and the [Dev Log](devlog.md) to see where we are.

## Does it work on Linux or Steam Deck?

Yes, through Proton. The [Linux and Proton Guide](guides/HP-GDE-002-linux-proton.md) covers the one launch option you need, including Bazzite.

## What happens if the host leaves?

The session ends for everyone. Moving the session to another player (host migration) is planned after 0.1.

## How does detection work?

The session has one detection status: Hidden, Searching or Detected. A player who is spotted joins it; everyone else stays Hidden unless they are spotted too.

## Do I need GitHub or Discord?

Not to play. Discord is where the community talks and helps; GitHub is where you report problems, take contracts and sign in to this site. The [Handbook](guides/HP-GDE-015-using-the-website.md) has a step-by-step guide for each: Joining the Discord and GitHub Basics.

## How can I help?

Testers and reviewers are welcome now. Open Contribute, or say hello on Discord.

## How does a session work?

1. **The host runs the session.** The host is the absolute authority of the session (**host-authoritative** architecture). For now the host is always a player running MGS V; a dedicated server is a research topic for later, because the game itself has to run. The host makes the decisions, progresses missions and sets the direction of the in-game flow. Mission state, enemies and the world are then synchronized with every client.
2. **Clients share the session.** Clients run the same mission in their own game and receive the host's state: enemies, the detection status, events and the other players. Their game is kept in line with the host, so the scene matches on every screen. Each client controls their own character and camera, which respond instantly, and the host confirms the result.
3. **Connect through Steam.** Connection is facilitated via Steam directly. No need for port forwarding, third-party software or additional setup. Navigate to the **Session Browser**, pick your session and hit Join. Simple and clean.
