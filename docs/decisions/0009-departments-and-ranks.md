# 0009: Departments, contractor ranks and how 0.1 is built
Status: Accepted · Date: 2026-10-22 · Deciders: project lead

## Context
The project needed a structure that newcomers understand at a glance and that fits the game's world. The first draft used generic roles and point-based ranks (Recruit to Commander). The project lead also wants a polished foundation and a presentable first version before others build on it.

## Decision
1. **Four departments**, Mother Base style: Administration, Development, Quality and Contractor. Details are in [departments.md](../departments.md).
2. **Contractor ranks A, A+, A++, S, S+, S++**, based on the number of completed contracts. They replace the point-based ranks.
3. **Contract difficulty** Basic, Standard, Advanced, Expert and Core, gated by rank (Core is Development Department only), with a separate effort estimate. This replaces sizes S, M and L, which clashed with the S ranks.
4. **A Quality Department** signs off every release and checks every contract against its acceptance criteria.
5. **Version 0.1 is built by the project lead** with the technical lead. Contracts open to outside contractors after 0.1. Until then the contract board shows the plan.

## Consequences
- The website, Discord blueprint, CONTRIBUTING and governance documents use the departments and the new ranks.
- Contract sizes (S, M, L) are replaced by **difficulty** (Basic, Standard, Advanced, Expert, Core), which sets who can claim a contract, plus a separate effort estimate. Points are no longer used.
- Discord roles must be updated with the setup script (see docs/discord.md).
- Recruiting before 0.1 focuses on Quality (testers) and on people who want to follow the project. Calls for developers come after 0.1.
