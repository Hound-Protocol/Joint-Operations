# Funding and distribution

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-21 · Status: desk research. Not legal or tax advice.

## Funding
- A volunteer project is not a legal entity, so donations paid to a person become that person's income. A **fiscal host** holds money for the project instead and handles the paperwork.
- **GitHub Sponsors** can pay out to a fiscal host. Supported hosts include **Open Collective Europe** (relevant for an EU-based lead), Open Source Collective, Hack Club, NumFOCUS, the Python Software Foundation, Radiant Earth and Software in the Public Interest. The choice must be made **at sign-up**; switching later needs GitHub Support.
- Open Collective Europe's FAQ points to its application guide and hosting agreement for fees, taxes and payouts. Those must be read before applying.
- **Risk:** money increases the chance of a rights-holder complaint. Keep funding strictly to costs (hosting, domains, code signing, test hardware), publish every expense, and never sell access or perks.

**Proposed:** no donations until a playable 0.1 exists. Then apply to Open Collective Europe and connect GitHub Sponsors to it.

## Distribution
- Unsigned DLLs that hook a game are often flagged by antivirus software. **Code signing** reduces that.
- The **SignPath Foundation** offers free code signing certificates to open-source projects. Requirements include a fully automated build, and the signed binary must be built directly from the repository's source.
- Release builds should come from **GitHub Actions only**, never from someone's PC, so every published binary can be traced to reviewed code.
- Publish SHA-256 checksums with every release.
- Nexus Mods is the main MGSV mod site. A release there is worth considering after 0.1, with the same files as GitHub.

## Sources
- [GitHub Docs: using a fiscal host for GitHub Sponsors payouts](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/using-a-fiscal-host-to-receive-github-sponsors-payouts)
- [Open Collective Europe: fiscal hosting FAQ](https://docs.opencollective.com/oceurope/faq/fiscal-hosting-faqs)
- [SignPath for open source](https://about.signpath.io/product/open-source)
