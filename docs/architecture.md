# Architecture

Status: DRAFT

## 1. Overview
Host-authoritative multiplayer. One machine (Venom Snake) runs the canonical state.
Other machines are clients (soldiers) that send inputs and receive state.

## 2. Components
1. Launcher / injector: starts MGSV with the mod loaded. Windows and Proton.
2. Game hook layer: reads and writes game state. Isolated from networking.
3. Session and host logic: the authority. Runs canonical state.
4. Networking: transport, message types for input, snapshots, join and leave.
5. Player slots: fixed IDs 1 to 16. Scaling is configuration, not redesign.
6. Config and mod API: settings now, extension point in Phase 4.
7. Apps and web: lobby, browser, docs. Outside the game process.

## 3. Roles in a session
- Venom Snake: host.
- Soldiers: clients, each chosen from the Mother Base roster, mapped to one player slot.

## 4. Sync model
- Host-authoritative state sync.
- Client owns its own avatar and camera.
- Priority and delta compression needed at scale.

## 5. Transport
- Library: GameNetworkingSockets (BSD-3-Clause).
- Primary path: Steam relay (SDR). Steam only.
- Fallback: direct IP:port, always kept working.
- Steam API (Networking Messages vs Networking Sockets): undecided, Phase 1 test.
- Discovery: Steam lobbies and friend invites.

## 6. Open questions (Phase 1)
1. Steam App ID and rights (BLOCKING for release).
2. Steam API choice, tested at 16 players.
3. Serialization format and sync rate.
4. Priority and interest management at 16 players.
5. Input model and host validation.
6. Host disconnect behavior (session end; host migration out of scope for 0.1).

## 7. Testing
- Mock Steam DLL for two clients on one PC.
- clumsy (Windows) and tc netem (Linux) for bad-network profiles.
- State hash logging on both ends to detect desync.
- Real two-account Steam relay test is a separate human step, listed as untested until done.

## 8. References
- Co-op Anything playbook (MIT): networking.md and networking-steam-spacewar.md. Read and summarized in research/, not copied.
