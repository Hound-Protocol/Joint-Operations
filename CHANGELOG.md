# Changelog

All notable changes to MGSV: Joint Operations. Versions follow [HP-SOP-003](docs/guides/HP-SOP-003-release.md): **0.0.x** are foundation releases (organization, docs, website, tools), **0.1** is the first playable build.

## v0.0.34 · Deploy hotfix · 2026-10-23
- **Website deploys again:** v0.0.32 and v0.0.33 did not reach the website. The deploy installed its PDF browser from Ubuntu's package mirror, which stalled, and each new release cancelled the stuck one. The Handbook PDFs are now made in Playwright's ready-made image, as the checks already are, with a time limit. This release brings v0.0.32 and v0.0.33 live.
- **Broken-main incidents close themselves:** when the checks pass on `main` again, the open *incident: broken main* issues are closed with a link to the green run. #44 and #46 (mirror timeouts this morning) are closed.
- **Roadmap:** this release's base detail is a searchlight slowly sweeping the sea from the command platform.

## v0.0.33 · Opening a sheet · 2026-10-23
- **Handbook:** opening a sheet is one smooth move. The other sheets fade, the chosen one glides to the middle of the screen, the Handbook controls fade, a short pause, then it zooms up into the reading view, which grows in from the same spot. Calm mode and reduced motion open it at once.
- **Roster:** every card holder is on the Team page's roster, the owner included: the owner's LV7 card comes from owning the GitHub organization until a signed card exists.
- **Roadmap:** this release's base detail is a line of lamps along every bridge, with a light running out from the command platform.

## v0.0.32 · Board hotfix · 2026-10-23
- **Contract board:** the five fields fit side by side in the shared frame again, instead of running off the right edge (a side effect of the layout stability rule in v0.0.29). Narrow screens scroll the board sideways.
- **Column headers line up:** title, description and progress bar sit at the same height in every field.
- **Cards:** "Acceptance criteria" is now **Done when**, so it fits on narrow cards.
- **Profile:** Access granted and Access restricted are information only now: they name each restricted area but no longer list its documents, which open from the Library.
- **Handbook:** the Guides folder now reads **All guides relevant to the Joint Operations Platform**.
- **Sign-in:** the GitHub window is now as small as its sign-in allows (400 × 540), centered, without toolbars. Browsers do not let a page hide or minimize a window; once you have authorized the app, GitHub answers at once and the window closes by itself.

## v0.0.31 · Certificates · 2026-10-23
- **Certificates of service:** a signed summary of someone's work for the project, for an employer, a school or a portfolio. It lists every completed contract, grades per field, the overall grade, clearance and the AI tools credited, with an optional statement. Anyone can check it at `#/verify/HPC-NNNN`: the page checks the certificate's signature and every record on it, in the browser, and a single changed line breaks the check. It prints or saves as PDF on A4. Certificates are listed on Verify and on the holder's Profile ([ADR 0020](docs/decisions/0020-certificates-of-service.md)).
- **Records tool:** `records.py certify` and `certificate-revoke`; `verify` now checks certificates too. Signed bytes are sorted at every depth, the same in Python and on the website.
- **Handbook:** the Procedures folder now reads **How Joint Operations handles the process**.
- **Roadmap:** this release's base detail is a red warning beacon blinking on top of the comms mast.

## v0.0.30 · Rules & Standards · 2026-10-23
- **Completes v0.0.29:** the last part of v0.0.29 was left out of its release by a timing problem in our merge script. It is in this release: claiming from contract cards, all work on the board, the How to Contribute guide and Handbook previews, the new clearance colours, the clearance cards for visitors, and the slim update strip. The merge script now waits until GitHub has registered the latest commit before merging.
- **Handbook:** the Policies folder now reads **Rules & Standards**.
- **Guest passes for every LV7:** any organization owner can grant and manage passes, not only the first owner. The Profile lists passes as **Active**, **Expired** and **Revoked**, with who granted each; expired and revoked ones can be deleted one by one or with **Delete expired**. Records are kept 30 days after a pass ends. Needs the new relay code.
- **Roadmap:** this release's base detail is navigation lights on the helicopter: red and green steady, a white tail light blinking.

## v0.0.29 · Roster and bans · 2026-10-23
- **Handbook folders:** guides, policies and procedures sit in three colour-coded kraft folders. Click one and its sheets fly out and lay themselves down; click another and they fly back into their folder before the next one opens. Filters and search still work across all three.
- **Sign-in window:** signing in opens a centered window in the site's own design that explains the three steps, waits for GitHub, and says **Access granted** before your keycard rises. GitHub itself opens in a small window centered over the site (GitHub cannot be shown inside another page).
- **Sign out:** a larger button at the foot of your Profile, and it asks first: "Are you sure you want to log out?"
- **Guest passes:** the owner's Profile lists live passes with **Revoke pass**; a revoked guest sees a small window telling them, within a minute. Needs a KV store on the relay ([setup](docs/signin.md)).
- **Bans (LV0):** banned GitHub accounts are refused at sign-in and see *Access revoked · LV0*. One ban covers linked GitHub, Discord and Steam accounts; no IP bans. New: [HP-SOP-012 Banning an Account](docs/guides/HP-SOP-012-bans.md) and [ADR 0019](docs/decisions/0019-bans-across-accounts.md).
- **Roster:** the Team page lists everyone with a signed card, grouped by clearance, as keycards. Member cards (LV2) can now be issued too.
- **About:** the session diagram is gone; the introduction is centered.
- **Contribute:** the "How it works" panel is gone. The button opens the new [How to Contribute](docs/guides/HP-GDE-019-how-to-contribute.md) guide, the contribution guidelines, which link to Can I Contribute first.
- **Handbook previews:** hovering or focusing any button that opens a Handbook document shows a small preview of it, as wide as the button.
- **Claim on the website:** every contract card has a **Claim** button. Signed in with GitHub, you claim it from the card; the relay asks GitHub who you are, records the claim, and you appear in the card's expandable **Contributors** list straight away. **Unclaim** asks first. Banned accounts cannot claim. Needs the relay's KV storage ([setup](docs/signin.md)).
- **All work on the board:** every piece of work, the owner's and AI-assisted work included, goes on the contract board when it starts and is checked off when done (`tools/work.py`). Each card lists who is working on it or who completed it, with any agent named. Releases fail their check if no work was checked off. The current foundation work (F01 to F08) is on the board.
- **Clearance colours:** LV0 grey and inactive, LV1 slate, LV2 silver, LV3 green, LV4 cyan, LV5 orange, LV6 violet with a banded edge, LV7 blood red on black. Guest passes keep the gold ribbon.
- **Signed out:** under the sign-in card, every clearance card is lined up with a line on what it opens, and three short points on how clearance works.
- **Update notice:** now a slim strip that slides into the top bar, centered, with Reload and a close button.
- **Layout stability:** every section uses the same width, so nothing grows or shrinks when you switch; the smoke test checks it ([HP-GDE-012](docs/guides/HP-GDE-012-website-maintainers.md)).

## v0.0.28 · Keycards · 2026-10-23
- **One card per clearance:** every level has its own card. LV1 a grey day ticket with punched edges, LV2 brushed silver, LV3 a green contract network, LV4 a blue inspection grid with a QA seal, LV5 orange circuit traces, LV6 red with a hazard edge and embossed frame, LV7 black and gold with a moving foil sheen. Guest passes use the LV3 card with the gold 24-hour ribbon.
- **Sign-in reveal:** right after you sign in or open a guest pass, your card rises and fades in from below, every credential is scrambled and clears left to right into your details, and the level counts up to yours. Calm mode and reduced motion skip it.
- **Guest passes:** a clear message instead of "Failed to fetch" when the relay is not reachable or still runs older code.
- **Profile:** spacing fix in Access restricted for the highest card.

## v0.0.27 · Guest pass · 2026-10-23
- **Owner card (LV7) from GitHub:** if GitHub confirms you own the Hound-Protocol organization, your Profile shows an Owner card, LV7, "Confirmed by GitHub". It needs the sign-in app's read-only Members permission ([setup](docs/signin.md#5-owner-card-lv7-from-github)). No file can fake it.
- **Guest passes:** the owner (only the owner, checked by GitHub through the relay) can **Grant Guest Pass** on the Profile: a link that gives LV3 (Staff) access for 24 hours, no account needed. The guest gets a gold guest card with the time left; the relay signs and checks the pass and reads the Staff documents for them. A pass cannot be extended ([setup](docs/signin.md#6-guest-passes-lv7-only)).
- **Update notice:** when a new release goes live while the site is open, a small notice slides in at the top and offers to reload.
- **Search by name or content:** a switch under the search in the Library and the Handbook. Name (the default) searches numbers and titles; Content searches what the documents say.
- **Fix:** opening a guide from the Handbook no longer highlights words, and one- or two-letter words are never highlighted.
- **CI:** browser tests now run inside Playwright's own image, so a slow Ubuntu package mirror can no longer stall a release.
- **Roadmap:** this release's base detail is a windsock beside the command helipad.

## v0.0.26 · Clearance · 2026-10-23
- **Sign-in is live** with the new GitHub App **Hound ID Sign-in**, owned by the Hound-Protocol organization ([setup](docs/signin.md)).
- **Clearance in the Library:** a line above every document says **Access granted** and its level: LV1 (public) for the public repository, LV3 to LV6 for restricted documents. New **Staff**, **Leads** and **Administration** drawers hold the restricted documents, read from the private repositories with your own sign-in. Above your clearance, the drawer is locked and the document shows as a greyed-out draft behind an **Access denied** screen with the level required and a way to contact Administration. Handbook sheets carry the clearance line too.
- **Profile:** the row of document areas is replaced by **Access granted** and **Access restricted**: every level's rights from ADR 0011, split at your clearance, with your restricted documents listed under the level that opens them and planned rights marked as such.
- **Keycard:** a larger photo with frame corners, a light sweep across the card, and a glow in the level's colour.
- **Tamper-proof clearance:** a staff card raises your level only after its signature checks out in your browser, so an edited `staff.json` cannot grant anything. Staff cards, records, the records key, the sign-in code and site settings now need the owner's review (CODEOWNERS).
- **About, modernized:** a live session diagram (one host, fifteen clients, state flowing out), a stat strip, step cards, links into the Handbook, and the FAQ in two columns. Same content.
- **Roadmap:** this release's base detail is a ring of lights on every helipad, chasing faster where the helicopter is about to land.
- Docs: Using the Website 1.2, sign-in setup, privacy, account security, admin handbook, ADR 0011 and ADR 0017 updated.

## v0.0.25 · Clean library · 2026-10-23
- **Library search filters the folders:** the search box now searches the Library only and shows the results as the folders themselves. Drawers without a match disappear, matching folders stay in their drawers with the best drawer and the best match first, titles are highlighted, and folders that match only inside the text are marked **In text**. ↑ ↓ select a folder, Enter opens it, Esc clears. No more list of snippets, and no jump into the Handbook.
- **Handbook filter:** type a word, part of a word or a topic, and the sheets narrow as you type. Titles, summaries, codes and the full text count, and everyday words find their handbook terms ("ban" finds suspensions, "linux" finds Proton). Works together with the audience tabs; Enter opens the first sheet.
- **One drawer at a time:** opening a drawer closes the others; opening a document opens only its own drawer.
- **Motion:** drawers slide open and closed and the open one pulls out, folders lift and tilt on hover, search results pop in, the search line scans while the text is read, the document slides out of its folder and its clip snaps on, the zone cards catch a light sweep. Calm mode and reduced motion turn it all off.
- **Long and wide documents:** the paper behind the page no longer drifts on long documents, punch holes repeat down the whole margin, and wide tables scroll inside the page with shadows at the cut edges instead of stretching the paper.
- **Sign-in relay:** when GitHub refuses a sign-in, the relay now says why (for example a client secret that does not match), so setup problems can be fixed quickly ([setup](docs/signin.md)).
- **Roadmap:** this release's base detail is a set of red and green channel buoys blinking along the shipping lane.
- **New guides:** [Can I Contribute?](docs/guides/HP-GDE-017-can-i-contribute.md) helps anyone unsure find where they fit in five questions, with what is open now and a first step today. [Working with AI Assistants](docs/guides/HP-GDE-018-working-with-ai-assistants.md) covers Claude, ChatGPT and Gemini in practice: which tool for what, a working loop, prompts that work, checking the output, and submitting AI-assisted work with credit. Linked from CONTRIBUTING, the Quick Start, the AI Use Policy and the knowledge map.
- [Using the Website](docs/guides/HP-GDE-015-using-the-website.md) is updated (version 1.1).

## v0.0.24 · Desk research · 2026-10-23
- **How the game starts, and where a second player comes in:** [a new research note](research/launch-and-second-player.md) follows the start chain from Steam to the field, lists where our code can run (our own proxy, an IHHook plugin, Lua through the hook), and the two routes for extra players: the engine's own session (two players shown publicly, more than two never shown) or our own stand-ins. Joining is designed around Sortie Prep and the helicopter. Each claim has a confidence level and the rig tests it needs (R2, R3; contracts C04, C05, C06, C19).
- **What must stay in sync:** [a draft state inventory](research/state-inventory.md) lists players, combat, enemies and detection, markers, world objects, vehicles and buddies, support, mission and the host's campaign, each with owner, reliable or unreliable, rate, late-join snapshot and priority P0 to P3, plus a build order and open design questions (R4; contract C08).
- **Steam networking:** [a comparison](research/steam-networking-api.md) of `ISteamNetworkingMessages` and `ISteamNetworkingSockets` from Valve's documentation, and a proposed [ADR 0018](docs/decisions/0018-steam-networking-sockets.md): Sockets for the Steam path (listen socket on the host, poll group, lanes, the status callback set through the connection's configuration), Messages as a fallback. It becomes final only after the spike and the rig test (C09, C20).
- **Linked everywhere:** research index, decision index, knowledge map, Phase 1 plan, architecture, ADR 0003 and the matching contracts. ADR 0016 and 0017 are now in the Library too.
- **Roadmap:** this release's base detail is a flock of gulls circling over Joint Operations Motherbase.

## v0.0.23 · Field manual · 2026-10-23
- **Everything aligned:** every document and the site data were checked against the current state of the project and corrected: seats after the playable prototype, the detection status, sign-in, the Documentation zones, grades (not ranks), the license and Pages being done, and the old Mother Base comparisons for the organization. Status lines and dates are current; drafts that are settled now say so.
- **New guides:** [GitHub Basics](docs/guides/HP-GDE-014-github-basics.md) (from no account to your first pull request), [Using the Website and Documentation](docs/guides/HP-GDE-015-using-the-website.md) (every section, search tips, signing in) and [Reporting a Problem](docs/guides/HP-GDE-016-reporting-a-problem.md). The [Discord Member Guide](docs/guides/HP-GDE-008-discord-members.md) now walks through joining step by step.
- **Knowledge map:** [one page](docs/knowledge-map.md) that points every topic to the document that holds it, with a list of what is not written yet. It is the first file in the Library.
- **Updated:** README, CONTRIBUTING, team, governance, departments, Discord blueprint, recruiting kit, GitHub setup, development process, risk register (three new risks), legal (personal data), contributor records, brand, glossary, Phase 1 plan, research index, ADR 0009 and 0011 notes, and 15 handbook documents (new versions).
- **Link checker:** `tools/check_links.py` checks every internal link and anchor in the documents and every `#/docs` and `#/guides` link in the site; CI runs it on every pull request.
- **About:** a new FAQ on GitHub and Discord. **Issue forms:** questions now point to the Discord and the Documentation.

## v0.0.22 · Sign-in · 2026-10-23
- **Sign-in with GitHub** ([ADR 0017](docs/decisions/0017-hound-id-sign-in.md), [setup](docs/signin.md)): a **Sign in** badge in the top bar and a new **Profile** page. Signed in, you see your keycard (your signed staff card, or a member card) with your GitHub picture, your session, and **your documents**: one restricted area per clearance (Staff LV3, Leads LV5, Administration LV6), read straight from private repositories with your own sign-in, so GitHub enforces access. Areas above your clearance stay locked. The token stays in the tab and expires within eight hours; sign out any time. The relay code is in `tools/signin-relay/`.
- **Keycards:** the holder's GitHub picture replaces the chip; the notch on the edge is gone; profile pages no longer repeat what the card already shows.
- **Smoother loading:** each page waits until its content, fonts and images are ready, shows a thin loading line meanwhile, then fades in at once. The interface fades in once on a cold start instead of flashing, and data files are retried once if a request fails.
- **Roadmap:** the heading reads **Joint Operations Motherbase**; the base fits the screen; a comms mast on the command platform now sends signal rings (this release's base detail).
- **Privacy:** the notice covers sign-in: what is kept in your tab, what the relay does, and how to revoke access.

## v0.0.21 · Polish pass · 2026-10-23
- **Documentation:** Guides and Docs are merged into one Documentation section with two zones: the **Library** (plans, decisions, research, technical, community, legal) and the **Handbook** (guides, policies and procedures as printable A4 sheets). Search covers both and opens handbook results in the Handbook with the words highlighted. The Guides tab is gone; old links still work.
- **Critical seats** (technical lead, second GitHub owner, Discord admins, moderators, release signers) are filled once there is a playable prototype. The roadmap moves them to Phase 2, the Team page shows them as "After prototype" and they no longer count as open positions.
- **Wording:** clearer section descriptions; "Contractor grades" everywhere (not ranks); the shared alert is now called the shared detection status in the sessions guide, contracts and architecture; the pre-development plan is up to date.
- **Roadmap:** the base fits the screen height and its labels scale with it; phones get the stacked layout back (a broken style had put the panel over the map).
- **Fixes:** dev log no longer lists release merges twice; Verify hides the empty Records heading; the profile keycard is compact on phones; menu descriptions wrap on phones; Options buttons stay on one line; wide tables scroll inside documents on phones.
- **Hound Protocol website:** the Joint Operations contract board link is removed from the Join section.

## v0.0.20 · Paper classes · 2026-10-23
- **Docs:** each document shows its class (Policy, Procedure, Guide, Decision record, Research, Technical, Community, Project, Legal) instead of "case file", and each class has its own paper: linen for policies, dot grid for procedures, graph paper for guides, ruled paper for decisions, triangle grid for research, millimetre paper for technical, green bars for community, pinstripe for project and a yellow legal pad for legal. Stamps removed.
- **Search:** every word must match; file numbers ("pol 9", "adr 12") and titles rank first, then headings, then text. Results show the section they come from. Arrow keys and Enter open a result, Esc clears, and the opened page highlights the words and scrolls to the first one. Light stemming ("appeals" finds "appeal").
- **Folders:** smoother hover and opening; drawers open in place without redrawing the others.
- **Classic list removed.** The cabinet is the only Docs view.
- **Main menu:** "Join the Hound" is now "Explore the Hound", linking to the Hound Protocol website.
- **Fixed:** the contract board was broken by the keycard styles (both used the same class name). Keycards now have their own names, contract cards are back, and "Acceptance criteria" stays on one line.

## v0.0.19 · Dossier cabinet · 2026-10-23
- **Roadmap:** the ticker line and the radar sweep are gone, and the hint reads "Click a platform for details".
- **Docs:** the neural web is replaced by a dossier cabinet. Each library group is a drawer of kraft case files with a file number (HP-POL-009, ADR-0012, RES-03…). The open file lies on the desk as a typed, ruled page clipped into its folder, with punch holes, a stamp and the group's colour. Guides keep their printed A4 sheet look; documents now have their own case-file identity.
- **Search:** Ctrl+K or / jumps to the search; titles filter the drawers at once, and from three letters the full text of every file is searched with highlighted snippets.
- The classic list stays available (button, or Options → Docs view).

## v0.0.18 · Base operations · 2026-10-23
- **Roadmap:** the base fills 80% of the 16:9 screen with the progress panel floating on the right. Platforms are named after the phases. Opening the page builds the base: platforms rise, bridges are laid, then each gauge fills with a moving waterline; unfinished parts show as scaffolding. Cargo ships dock beside platforms under construction and crews carry crates to the stockpile; plus cloud shadows, ripples and beacons. Crews stay on the decks.
- **Guides:** the type stripe runs along the right edge; mini sheets keep their A4 shape (no wrapped codes or overflowing text).
- **Release procedure:** each release also adds a matching detail to the base ([HP-SOP-003](docs/guides/HP-SOP-003-release.md) 1.1).
- **CI:** the browser download retries when it stalls.

## v0.0.17 · Keycards · 2026-10-23
- **Keycards:** staff cards on Verify are drawn as security cards (original design): level, clearance color, department, Hound ID, grade and a live signature check. Each has its own profile page (`#/verify/HND-0001`). Until the first card is issued, a specimen shows the design.
- **Prove a Hound ID** ([ADR 0017](docs/decisions/0017-hound-id-sign-in.md)): a card can be copied, so the holder proves it by signing a one-time challenge with the SSH signing key on their GitHub account. Checked in the browser (ed25519, RSA, ECDSA), no passwords or tokens. Cards can pin one key (`records.py staff-pin`). How to: [HP-GDE-009](docs/guides/HP-GDE-009-grades-records-hound-ids.md).
- **Decided:** sign-in with GitHub, with restricted documents in a private repository so GitHub enforces clearance (ADR 0017). Build next.

## v0.0.16 · Base construction · 2026-10-23
- **Roadmap:** rebuilt as a base under construction, seen from above. Phase 0 is the command platform in the centre, each later phase a platform on its own bridge. Each platform fills up like a gauge with the share of its tasks done, color coded (complete green, under construction amber, planned blueprint blue), with the percentage above it. Point at a platform to light it orange, click it to see its tasks on the right. Boats, crews, cranes and a helicopter keep the base busy (off with Options → Animations).
- **Guides:** stronger color per document type (Guide ochre, Policy red, Procedure blue) on paper, headings and borders, with a type stripe 20% in from the right edge that names the type. Background patterns are fainter so the text stands out.
- **PDF and print:** pages print full width on a white page with room inside the frame (the dark page margins are gone).

## v0.0.15 · Field notes · 2026-10-23
- **About:** clearer host and client text (host-authoritative; the host is a player's game for now, a dedicated server is later research; clients follow the host's state and control their own character), the new Steam connection text, and an FAQ at the bottom. The shared-alert section moved into the FAQ.
- **Research:** how the enemy AI notices, reports and hunts ([research/ai-system.md](research/ai-system.md)). ADR 0012 revised to one session detection status that spotted players join, with two proposed additions.
- **Roadmap:** brought up to date (license, organization, brand, handbook) with open questions; the release check now fails if the version changes without a roadmap update.
- **Contribute:** completed contracts are crossed out with a line texture; each field column has its own space and divider.
- **Team:** contractors active in the last 7 days show as live badges, from signed records.
- **Guides:** every document has a printed frame in its type's color (Policy red, Procedure blue, Guide gold).

## v0.0.14 · Badge backdrop · 2026-10-22
- The main menu background is now the Joint Operations badge, large and faint behind the menu (Options → Background logo turns it off).

## v0.0.13 · Insignia and accountability · 2026-10-22
- **New logos:** Hound Protocol is a geometric hound over a red slash, with a heavy HOUND / PROTOCOL wordmark. Joint Operations is a unit badge with a sixteen-point star around the host diamond, plus a wordmark with the star inside the O. Full color, one color and light versions, avatars, favicon and link banner. Drawn in code (`tools/brand/logos.py`); the old emblem is retired.
- **Accountability** ([HP-POL-009](docs/guides/HP-POL-009-accountability.md), [ADR 0016](docs/decisions/0016-accountability.md)): infractions for careless work (contributor track) and duty breaches (role holders, leads included). Three active infractions suspend; five clean deliveries clear one; appeals any time. Never for speed or inactivity: no time limits.
- **Enforcement:** `tools/infractions.py` keeps the record, a **Contributor standing** check blocks merges by suspended contributors, `/claim` refuses them with the appeal link, and a **Broken main** issue opens when checks fail on main (not an infraction by itself). Procedure: [HP-SOP-011](docs/guides/HP-SOP-011-infractions-and-appeals.md). New Appeal issue template.
- **Team page:** Seats and Wanted are one **Positions** board, grouped by department, with filled slots shown. The "no authority" tags are gone.
- **Hound Protocol description:** a community-focused organization that builds ambitious projects, one of them being Joint Operations.

## v0.0.12 · Handbook expansion · 2026-10-22
Nine new handbook documents, so everything in the docs has a practical guide (31 in total):

- **HP-GDE-007 Sessions Guide:** hosting, joining from the Session Browser, and the one shared alert.
- **HP-GDE-008 Discord Member Guide:** channels, roles and ranks, who decides what, the rules in short.
- **HP-GDE-009 Contractor Grades, Records and Hound IDs.**
- **HP-GDE-010 Account Security Setup:** two-factor, passkeys, signed commits, Discord.
- **HP-GDE-011 Brand and Media Guide:** the two brands, their colors and files, third-party graphics, posting.
- **HP-GDE-012 Website Maintainer Guide:** how the site is built and changed safely.
- **HP-GDE-013 Writing Research Notes:** clean-room notes with evidence and sources.
- **HP-POL-008 Licensing and Attribution Policy:** our licenses, credit for people and AI agents, third-party material.
- **HP-SOP-010 Publishing Contracts as GitHub Issues** (from 0.1).
- `THIRD_PARTY_NOTICES.md` started (fonts).

## v0.0.11 · Click to copy · 2026-10-22
- **Click to copy:** commands, file names and code in documents, guides and steps copy to the clipboard with one click. Pointing at them types "click to copy this text"; after a click it says "copied to clipboard". Works by keyboard (Tab, then Enter) and in older browsers.
- **Handbook PDFs:** every guide has a **Download PDF** button. The PDFs are built from the print layout when the site deploys (`tools/guides_pdf.py`), so they work even where the browser's print dialog does not open (for example Flatpak browsers without a print portal).
- **Session Browser:** the counters are Sessions, Online and Total players (the 16-player limit is known).
- **Print:** if no print dialog appears, the status line says to press Ctrl+P (Cmd+P on Mac) or to use Download PDF.

## v0.0.10 · Salute · 2026-10-22
- **New background artwork:** a line of saluting operatives with their commander standing behind them. Original vector art drawn in code (`tools/brand/salute.py`), one color, faint behind every page. The commander is our own figure, not an existing character. Options → Background artwork turns it off.
- **Download stands out:** orange in the main menu and the section bar, in Joint Operations colors.
- **Download is about the game only:** the mod's status, its current roadmap phase and progress toward 0.1, install steps and requirements. Website and foundation updates moved out (they are in the Dev Log). "Help test" is now "Contribute to Joint Operations".

## v0.0.9 · Agent attribution · 2026-10-22
Who did it, and with what.

- **Claude is a contractor:** listed in the Contractor Department as an AI agent used by the project lead, with no seat or authority. The **technical lead** is now a seat for a person ([ADR 0015](docs/decisions/0015-ai-agents-and-attribution.md)).
- **Automatic credit for AI agents:** `tools/agents.py` detects agents from commit trailers (Claude, GitHub Copilot, OpenAI Codex, Cursor, Gemini, Devin, Aider). Merged pull requests get an `agent: <name>` label and a credit comment ("Credited to @Forge77, with Claude").
- **Records list the agent:** `tools/records.py add` detects agents from the pull request and signs them into the record. The Verify page shows "with Claude" on records and the contributor wall.
- AI Use Policy, chain of command, governance, Team page, Discord roles and the pull request template updated to match. Research notes are now signed "TrueMan, with Claude".

## v0.0.8 · Brand colors and license · 2026-10-22
New brand colors, a chosen license, a smoother site and a sharper contract board.

- **Logos:** Joint Operations is now orange and white; Hound Protocol is white, black and red, with a red collar and eye on the hound. New emblem, marks, lockups, avatars, favicon and link banner ([brand guide](docs/brand.md)).
- **License** ([ADR 0005](docs/decisions/0005-license.md), [LICENSING.md](LICENSING.md)): code GPL-3.0-only with a permission to link with the Steamworks SDK and run inside MGSV; documentation CC BY-SA 4.0; names and logos reserved. Forks are welcome, must stay open and keep the credits.
- **Quiet until 0.1** ([ADR 0014](docs/decisions/0014-quiet-until-0-1.md)): no promotion before 0.1, recruiting by invitation, public launch with 0.1.
- **Contribute:** labeled separators between rows; columns renamed **Code** and **Architecture Research**; bigger counts; "Select your difficulty to apply filters" with a clear "Filter on" state; **How it works** as a large centered button with its own caption; last update time; Acceptance criteria and Open as issue as real buttons. Nine new contracts (C22 to C30).
- **Docs:** the neural web builds twice as fast; a "Don't like the neural interface? Switch back to classic" bar above it; a guide beside it that explains what you can do.
- **Readability:** small text across the site is a size larger.
- **Smooth interface:** pages and tabs rise in gently, cards stagger in, hovers and state changes ease instead of snapping.

## v0.0.7 · Chain of command · 2026-10-22
A solid hierarchy, grades that match the game, a calmer interface and support for older browsers.

- **Chain of command:** three kinds of authority (social, technical, organizational) that only flow down the keycard levels. Moderators and Administration decide social matters; Development and Administration decide technical ones; Quality, contractors and members have no authority over others. Open communication and transparency rules, and appeals one level up. New policy [HP-POL-007](docs/guides/HP-POL-007-chain-of-command.md) and [ADR 0013](docs/decisions/0013-chain-of-command.md). Discord permissions follow it: only LV6 and LV7 roles can moderate.
- **Team page:** the hierarchy as a tree, from LV7 down to LV2, with each role's authority and holders.
- **Contractor grades like MGSV:** E, D, C, B, A, A+, A++, S, S+, S++, held per field the way staff hold a grade per unit. Contracts earn points in their field (Easy 2, Medium 5, Hard 10), thresholds climb steeply, commendations work like medals. Grades carry no authority.
- **Section tabs:** bigger, centered, with icons, and a description under the bar for the tab you point at.
- **About:** the session diagram is replaced by short, numbered text.
- **Session Browser:** a calm "no connection" icon instead of the flashing scan.
- **Download:** redesigned, with release status, install steps per system (your system is preselected), requirements and the foundation builds.
- **Mods:** mod cards and how a mod gets listed.
- **Dev Log:** search, a project status strip and release-note excerpts.
- **Options:** presets (Full effects, Calm, Performance), grouped settings, a Docs view choice and a background emblem switch. The moving light band behind the page is gone. Animations start off if your system asks for reduced motion.
- **Older browsers:** CSS fallbacks for layout (checked in CI by `tools/css_compat.py`), a fetch fallback, small polyfills, the classic Docs list where the neural web cannot run, and a plain page with the essentials for browsers too old for the app.

## v0.0.6 · Official emblem · 2026-10-22
Official emblem, a 16:9 layout and a smoother interface.

- **Joint Operations emblem:** three operatives inside a ring of sixteen marks (sixteen players), with the host marker over the centre operative. Original vector art built in code (`tools/brand/emblem.py`), in full colour, one colour and white. Used on the team page, the lockup, the avatar and the site background.
- **16:9 layout:** the page now lays out inside a 16:9 frame on any screen. Contribute, Sessions and Mods use the full width, so all five contract columns fit side by side.
- **Neural docs:** the web fills 80% of the frame. Labels no longer pile up: each sits beside its neuron, only shows where it has room, and fades in and out.
- **Smoother interface:** highlights, hover effects and the tooltip ease in and glide instead of snapping. Hover and state changes across the site are slower and calmer.

## v0.0.5 · Neural docs · 2026-10-22
The documentation becomes a living map, and the Contribute board gets columns.

### Added
- **Neural web for Docs:** every document is a neuron, grouped around colored hubs (Project, Technical, Decisions, Research, Community, Legal, Handbook), with synapses for the links between documents. Real physics: neurons collide, keep their distance and can be dragged.
  - Builds itself from the first neuron to the last in 3 seconds each time you open it, with signals travelling along the synapses.
  - Point at a neuron to highlight it and its connections. It lifts toward you by 10%.
  - Click to slide the web aside and open the document as an A4 window with minimize and close.
  - Several open documents stack: their headers stay visible and the focused one sits at the bottom.
  - Minimize sends a document to a dock at the bottom center (up to 5). Hover a tab for a preview, click to restore with an animation.
  - Close everything and the web resets and rebuilds.
  - Search, group filters, a keyboard-accessible list, and a **Classic view** switch (remembered per browser).
- **Contribute board in columns by field:** Programming, Reverse engineering, Testing, Design and web, Docs and legal, each with a progress bar. Cards now show their status clearly: open (green), planned (dashed), claimed or in review (amber), blocked (red stripes), done (green stamp, struck-through title, sorted last).
- **Live claims:** comment `/claim` on a contract's GitHub issue and you are assigned at once (`/unclaim` to leave). Several people can claim one contract, up to 10. Every claimant shows on the board as a token with their name. The board refreshes itself every 2 minutes.
- **Guides with personality:** each document type has its own paper. Guides use field-manual graph paper, policies use formal linen with a seal, and procedures use an engineering pad with a dotted grid and a margin rule.
- **About: one shared alert** ([ADR 0012](docs/decisions/0012-shared-alert.md)). Enemies target players individually by distance and detection, but the session has one status, hidden, searched for or detected, that players join.
- **Session Browser empty state:** a faster, flashier area scan with a green grid radar, sweep, pings, enemy blips, static bursts, frequency tuning and a glitching "No sessions detected" alert.

- **Brand marks:** the Hound Protocol insignia (a hound in a hexagon) and the Joint Operations mark (sixteen marks around a gold host diamond), with lockups, light and one-colour versions, a new favicon, a new link-preview banner and avatars for Discord and GitHub. All original vector work drawn in code, with clear rules on taking inspiration without imitating ([docs/brand.md](docs/brand.md)). They appear on the home page, the side panels and the Team page.

### Changed
- **Contract difficulty is information, not a gate.** Anyone can take any contract. Ranks now give claim capacity and review rights instead.
- Time estimates are removed from contracts.

### Fixed
- Home page on large screens: the menu now stays centered and both side panels show, even when the site settings load slowly.
- Home page on phones: the layout no longer grows wider than the screen.
- Wording: the host runs the missions, clients share the session. "Friends" is gone.

## v0.0.4 · Security and keycards · 2026-10-22
Backups, verified staff identities, keycard access levels and clearer wording.

### Added
- **Weekly backups** for the owner's Bazzite computer: a full git mirror, dated snapshots, and exports of issues, pull requests and releases, with an encrypted copy on Google Drive. Includes an installer, a systemd timer and a restore guide ([HP-SOP-009](docs/guides/HP-SOP-009-backup-and-restore.md)).
- **Keycard access levels LV1 to LV7** ([ADR 0011](docs/decisions/0011-keycard-access.md)). Discord roles now carry the card level (LV7 · Owner down to LV2 · Member), and the setup script renames existing roles automatically.
- **Hound IDs:** signed staff cards (`HND-0001`) tied to each person's permanent GitHub account number, checkable by anyone on the Verify page by Hound ID, GitHub name or Discord ID.
- **Discord integration:** live online count on the home page (once the server widget is on), and new releases posted to Discord automatically (once the webhook secret is set).

### Changed
- **Host and client** replace "Venom Snake" and "soldiers" across the website and docs. In-game characters are Mother Base staff.
- **AI Use Policy 1.1:** AI may operate tools (Canva, vector drawing in code, layout, editing). Generative AI images, artwork, music and voices are not accepted.
- Security Policy 1.1: organization-wide 2FA, passkeys or security keys for LV6 and LV7, signed commits for LV4 and up, backups.
- Admin handbook and Discord SOP: widget, webhook and backup duties.

### Fixed
- A Python cache file that had been committed by mistake is removed and now ignored.

## v0.0.3 · Polish · 2026-10-22
A cleaner, clearer website for everyone, not only contributors.

### Added
- **Menu icons** for every section, drawn for this site.
- **Home side panels:** what Joint Operations is on the left, who Hound Protocol is on the right. Shown beside the menu on wide screens, below it on smaller ones.
- Automatic GitHub releases: changing the version on main publishes the release, with notes from this changelog.

### Changed
- New tagline: *Metal Gear Solid V, now with up to 16 players.*
- Menu: **About Joint Operations**, **Session Browser** ("Browse, Create & Join active Joint Operations"), **Contribute** ("Take part in development & Become a Hound Member"), **Mods** ("Upload, Download & Browse Re-Engineered mods curated to function with Joint Operations"), **Docs**.
- Rewritten in plain words: About page, Download (Linux steps now include the launch option), Session Browser, Mods, Contribute, status messages and search previews.
- Session Browser shows a **Host a session** button, active from 0.1.
- **Contract difficulty is now Easy, Medium and Hard**, color-coded green, yellow and red everywhere. Each one explains what makes a contract that hard and who can claim it. **Core** marks 0.1 critical-path work for the Development Department.
- Contribute page: difficulty cards that double as filters, colored contract cards, and color-coded rank rewards.

### Fixed
- Removed unused styles from an older Briefing layout.

## v0.0.2 · Foundation update · 2026-10-22
The foundation is now organized like Mother Base, documented end to end, and ready for contributors.

### Added
- **Departments:** Administration, Development, Quality and Contractor, on the website, in the docs and in the Discord blueprint ([ADR 0009](docs/decisions/0009-departments-and-ranks.md)).
- **Contractor ranks A, A+, A++, S, S+, S++** by completed contracts, shown on the Contribute and Verify pages.
- **Contract difficulty** Basic, Standard, Advanced, Expert and Core, gated by rank, plus an effort estimate per contract.
- **Handbook:** 20 versioned documents on the new **Guides** page, readable as A4 sheets and printable to PDF.
  - Guides: Player, Linux and Proton, Contributor Quick Start, Quality and Testing, Documentation Style, Administration Handbook.
  - Policies: Contributor, AI Use (code and mod content), Clean-Room and IP, Security, Community and Moderation, Quality.
  - Procedures: Contract Lifecycle, Pull Request and Review, Release and Versioning, Records and Ranks, Bug Triage, Security Incident, Onboarding and Offboarding, Discord Administration.
- **Signed contributor records** and the **Verify** page with the contributor wall.
- **Decision records:** 0008 server browser and one-click join (Proposed), 0009 departments and ranks, 0010 donations open at 0.1.
- **Research:** Steam interfaces from inside the game (R13), file formats and tools, Bazzite notes, Battlelog and browser launch (R14).
- **Tools:** handbook index, contract spec generator, contract publisher, records signer. The Discord setup now updates an existing server (renames, moves, permissions, starter messages).
- `CHANGELOG.md`, and GitHub releases for every foundation version.

### Changed
- README rewritten for the GitHub front page.
- Contract specs with goals, deliverables and acceptance criteria for all 21 contracts.
- Pull request template: AI-assistance disclosure and acceptance-criteria check.
- The Download page lists playable releases only (0.1 and later). Foundation releases appear in the Dev Log.
- Recruiting kit: two waves (Quality and Administration now, contractors after 0.1).

## v0.0.1 · Foundation · 2026-10-21
- Repository, website on GitHub Pages, CI on Chromium, Firefox and WebKit, protected main branch.
- Pre-development plan, architecture, governance, risk register, decision records 0001 to 0007.
- Desk research: engine, modding ecosystem, Steam networking, Proton, legal landscape, funding.
- Discord server built from a blueprint.
