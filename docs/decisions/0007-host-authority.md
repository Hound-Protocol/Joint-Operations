# 0007: Host authority and roles
Status: Accepted · Date: 2026-10-21 · Deciders: project lead

## Decision
- The **host** runs the session. Every command position the game offers (helicopter seat, Aerial Command Center, briefings, radio, cutscenes, Mother Base command) belongs to the host. The host is authoritative for mission state, AI and world state.
- Other players join as **clients**. In the game, each client plays a staff member from the host's Mother Base roster. Each client is one player slot, numbered 2 to 16 (slot 1 is the host).
- Each player owns their own character's movement and camera.
- Host migration is out of scope until after 0.1.

## Terminology (updated 2026-10-22)
The project uses **host** and **client** for players. Earlier wording ("Venom Snake's place", "soldiers") meant the same thing. In-game characters are **Mother Base staff**.
