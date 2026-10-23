# Tester's Field Manual
Code: HP-GDE-020 · Version 1.0 · Effective 2026-10-23 · Owner: Quality · For: testers and anyone asked to test a feature

This is the hands-on manual for testing: what to click, what to try to break, and how to measure. It works for the website now and for the game from version 0.1. You do not need to code.

**Where it fits:**
- The [Quality Guide](HP-GDE-004-quality-testing.md) has your test rig, the kinds of tests and the bug report template.
- The [Quality Policy](HP-POL-006-quality-policy.md) has the severities (S1 to S4) and the release gates.
- [Reporting a Problem](HP-GDE-016-reporting-a-problem.md) says where reports go.
- Internal play sessions follow the test-session protocol in the Staff drawer of the Library (LV3).

## 1. The testing loop
1. **Get the assignment:** a contract to review, a release to sign off, or a feature someone asks you to try.
2. **Read what changed:** the contract's **Done when** list, the pull request, and the [CHANGELOG](../../CHANGELOG.md) entry. Know what should happen before you look at what does happen.
3. **Write a charter** (section 3), one per thing you test.
4. **Test:** check what was promised first, then try to break it.
5. **Record** every run, including the ones that passed (section 9).
6. **Report** each problem once ([HP-GDE-016](HP-GDE-016-reporting-a-problem.md)), then **retest** when the fix arrives.

## 2. Before you start
- **Note your rig:** browser and version, operating system, screen size. For the game, use the full rig table in [HP-GDE-004](HP-GDE-004-quality-testing.md).
- **Start clean:** use a private window, or clear the site's data. Set **Options** back to defaults. Do a hard refresh (Ctrl+Shift+R) so you test the new release, not a cached one.
- **Check the build:** the top bar shows the build number. It must match the release you were asked to test.
- **Open the browser console** (F12 → Console). Red errors count as findings even when the page looks fine.

## 3. Two ways of testing
**Confirm** what was promised. Go through the **Done when** list or the release checklist one line at a time, and tick each line only after you have seen it yourself.

**Explore**, then **pinch**: use the feature like a curious, impatient, clumsy person would. Explore in short, focused sessions of 30 to 60 minutes, each with a charter:

```
Charter: Explore <feature> with <method or data> to find <kind of problem>
Build:   0.0.xx · Rig: Firefox 13x, Fedora, 1920×1080
Time:    45 min
Notes:   what you tried, in order, and what you saw
Found:   links to the reports
Not tested: what you ran out of time for
```

Example: *Explore the Handbook filter with odd input (empty, symbols, very long words) to find crashes or wrong results.*

## 4. The website: what to click
Go through every section. For each one, check the basics first, then pinch.

| Section | Check that | Pinch |
|---|---|---|
| **Menu and section bar** | Arrows, Enter, ← → and Esc work; every tab opens its section | Switch sections fast; the frame must not change size when you switch (layout stability rule, [HP-GDE-012](HP-GDE-012-website-maintainers.md)) |
| **About** | Text, step cards and FAQ read well; Handbook links open the right sheet | Narrow the window to phone width |
| **Roadmap** | Motherbase draws; clicking a platform shows its tasks; the numbers match ROADMAP.md | Click platforms quickly one after another; leave it running for 10 minutes and watch for slowdowns |
| **Download** | Install steps for Windows and Linux; links work | Every link and button, including ones at the bottom |
| **Contribute** | Board fits; cards open; **Done when** is readable | Claim, Unclaim, Claim again quickly; claim while signed out; claim in two tabs |
| **Team** | Roster shows every card holder in the right level and colour | Very long names; a phone-width screen |
| **Docs → Library** | Drawers open one at a time; documents open; Access denied shows on locked drawers | Search by Name and by Content: `adr 12`, `res 3`, one letter, a word that is nowhere, 200 characters, `<b>x</b>`; Enter, ↑ ↓ and Esc |
| **Docs → Handbook** | Folders lay out sheets; a sheet zooms open; Print and Download PDF work | Click another folder while sheets are still flying; filter while a sheet is opening; Calm mode |
| **Verify** | A real Hound ID and record check as valid | A made-up ID, a changed letter, an empty box |
| **Sign in and Profile** | GitHub window opens and closes by itself; keycard reveal plays; level matches your teams | Close the GitHub window halfway; block pop-ups; sign in in two tabs; sign out and press Back |
| **Guest pass** (LV7 grants) | The link gives a guest card with the time left | Open the link twice, in a second browser, after it is revoked, after it expired |
| **Options** | Each setting changes what it says, and is kept after a reload | Text size largest plus a phone-width screen; Performance plus Calm |
| **Update notice** | A strip appears when a new build goes live while the page is open | Dismiss it, then switch sections |

## 5. The pinch list
Try these on anything new. Each line is a classic way software breaks.

**Input:** nothing at all, one character, very long text, emoji, other alphabets (日本語, Ελληνικά), spaces only, pasted text, HTML like `<script>`.

**Timing:** double-click, click twice quickly on two things, click while something is still loading or animating, press Esc halfway.

**Navigation:** Back and Forward, reload in the middle of an action, open the same page in two tabs, bookmark a deep link and open it cold, copy a link and open it in another browser.

**Screens:** phone width (DevTools → device toolbar), a very wide screen, browser zoom at 200 %, the largest text size in Options, portrait and landscape on a phone.

**Accessibility:** keyboard only (Tab, Shift+Tab, Enter, Esc). Can you see where the focus is? Turn on reduced motion in your system settings: animations must stop or shorten.

**Network:** slow network (DevTools → Network → Slow 4G), offline after the page has loaded, blocked pop-ups, ad blockers and privacy extensions on.

**Browsers:** Chromium (Chrome, Edge, Brave), Firefox, and Safari or another WebKit browser. Our checks test all three engines automatically, but people find what scripts miss.

**State:** signed out, signed in at each level you can reach, a guest pass, a session that expired (leave a tab for eight hours), and after **Sign out**.

## 6. Benchmarking the website
Measure, so we can compare releases.

1. Open the site in Chrome or Edge, in a private window with no extensions.
2. DevTools → **Lighthouse**. Choose **Mobile**, categories **Performance** and **Accessibility**, then **Analyze page load**.
3. Run it **3 times** and keep the middle result.
4. Repeat for **Desktop**, and for the Roadmap, Docs and Contribute pages.
5. Write down the scores and these three numbers. The "good" limits are Google's Core Web Vitals:

| Number | What it means | Good |
|---|---|---|
| **LCP** (Largest Contentful Paint) | When the main content appears | 2.5 s or less |
| **CLS** (Cumulative Layout Shift) | How much things jump around while loading | 0.1 or less |
| **TBT** (Total Blocking Time) | How long the page cannot react | 200 ms or less |

**Animations:** DevTools → **Performance**, set CPU to **4× slowdown**, record 10 seconds on the Roadmap and while opening a Handbook sheet. Look for long red bars (slow frames). Compare with **Options → Performance**.

**Compare:** put the numbers next to the previous release's. A drop of more than 10 points, or a Core Web Vital crossing its limit, is a finding (S3 normally, S2 if a page becomes hard to use).

## 7. The game and the mod (from 0.1)
**Safety first:**
- Play offline only. Nothing we test may touch Konami's servers or anti-cheat ([HP-POL-003](HP-POL-003-clean-room-and-ip.md)).
- Copy your save folder before every test day.
- Never attach game files to a report. Attach the mod's log only.
- Test with no other mods unless a mod is what you are testing.

**What to click, in order:**
1. **Install:** follow the [Player Guide](HP-GDE-001-player-guide.md) exactly as written, on Windows or on Proton ([HP-GDE-002](HP-GDE-002-linux-proton.md)). Every step that is unclear is a documentation bug.
2. **Smoke:** the game starts, the mod loads, the main menu appears, the mod version is shown.
3. **Host:** open a session; check each privacy choice (friends, invitation, public).
4. **Join:** from the Session Browser and from a Steam invite. The launcher checks your install and opens **Sortie Prep**; **Deploy** puts you in the host's world.
5. **Play:** move, fight, pick up items and use the helicopter with 2 players, then 4, 8 and 16 when we can.
6. **Detection:** get one player spotted, and check that only that player joins **Detected**. Then get a second player spotted (they join the same status), and let it wind down (everyone returns to Hidden). The rules are in [HP-GDE-007](HP-GDE-007-sessions.md).
7. **Leave:** clients leave and rejoin; the host leaves (the session must end cleanly for everyone).

**Pinch the game:**
- Join during a cutscene, a loading screen, the pause menu or extraction.
- Alt-Tab away for a minute. Unplug the network for 10 seconds, then plug it back in.
- Have two players grab the same item, or extract the same target, at the same moment.
- Have the host load a checkpoint or restart the mission while clients are in.
- Mix Windows and Proton players; mix controller and keyboard; mix very different frame rates and resolutions.
- Rejoin repeatedly (10 times in a row), and stay in one session for 2 hours (soak).

## 8. Benchmarking the game
**Method:** the same save, the same route, the same settings, run **3 times** for 90 seconds each. Always measure **without the mod first** (baseline), then with it as host, then as a client. The cost of the mod is the difference.

**Frame rate and frame time:**

| Platform | Tool |
|---|---|
| Linux / Proton | **MangoHud** with logging on (records FPS, frame times, CPU and GPU load) |
| Windows | **PresentMon** or **CapFrameX** |

Record the **average FPS**, the **1 % low** (how bad the worst moments are) and any frame-time spikes over 50 ms. A smooth average with bad 1 % lows still feels like stutter.

**Network:** note the ping shown in the session, desync moments (players or enemies in different places on different screens) and rubber-banding. Test the three standard profiles:

| Profile | Delay | Packet loss | Jitter |
|---|---|---|---|
| Good | 30 ms | 0 % | 5 ms |
| Typical | 80 ms | 1 % | 15 ms |
| Bad | 200 ms | 5 % | 40 ms |

Shape the network with **clumsy** on Windows or `tc netem` on Linux, on a client, never on someone else's machine without asking.

**Soak:** in a 2-hour session, note memory use every 15 minutes (MangoHud or Task Manager). Memory that only ever goes up is a leak.

## 9. Recording results
Write down every run, also the passes: "it worked" is a result.

```
Test:     <charter or checklist name>
Build:    mod 0.x.y · site 0.0.xx · game 1.0.15.4
Rig:      <OS / Proton / browser / GPU>
Result:   Pass / Fail / Blocked
Numbers:  <Lighthouse scores, FPS avg / 1 % low, ping>
Found:    <links to reports>
Not tested: <what and why>
```

- **Contract review:** post it on the pull request and tick each **Done when** line ([HP-SOP-002](HP-SOP-002-pull-request-review.md)).
- **Release sign-off:** it goes into the release quality report ([HP-POL-006](HP-POL-006-quality-policy.md)).
- **Play sessions:** the note-taker posts in **#test-sessions**.

## 10. Pinch responsibly
- Test only our things: our website, our builds, our sessions. Do not probe GitHub, Discord, Steam or Cloudflare themselves.
- Do not flood the sign-in relay or the claim buttons with scripts. A handful of quick clicks is a test; thousands is an attack.
- Never test bans, guest passes or clearances on someone else's account without their agreement.
- Found a way to see what you should not, or to harm others? Stop, and report it privately ([SECURITY.md](../../SECURITY.md)). Do not post it in public.
- Being slow or finding nothing is fine. Write down what you tried; that is useful too.
