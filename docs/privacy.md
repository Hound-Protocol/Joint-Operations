# Privacy

Status: Current · Updated: 2026-10-23

This site does not use cookies, analytics, trackers or advertising. It collects no personal data unless you choose to sign in, and even then nothing is stored on our side.

## What the site stores on your device
- Your display settings from the Options page are saved in your browser's local storage. They never leave your device. Use **Options → Reset** to clear them.
- Data read from GitHub is cached in your browser for a few minutes to avoid repeated requests. It is cleared when you close the tab.
- **If you sign in:** your GitHub sign-in token, account number, user name, display name and picture address are kept in this browser tab's session storage, so the Profile page can show your keycard and your documents. They are deleted when you sign out or close the tab, and the token expires on its own within eight hours.

## Sign-in
Signing in is optional and uses your GitHub account ([how it works](signin.md), [ADR 0017](decisions/0017-hound-id-sign-in.md)).
- GitHub shows you what the Hound ID Sign-in app may do: read the contents of our restricted document repositories that your GitHub teams already allow. It cannot write anything, and it cannot read your other repositories.
- A small relay on Cloudflare Workers swaps GitHub's one-time sign-in code for your token. It keeps no database and does not log tokens. Cloudflare receives your IP address and browser details for that request, as it does for any site it serves.
- Your token goes from the relay straight to this page and is used only to call GitHub's API from your browser.
- To revoke access at any time: GitHub → Settings → Applications → Authorized GitHub Apps → Hound ID Sign-in → Revoke.

## Guest passes
- A guest pass link holds a signed code with its expiry time and nothing about you. The site keeps it in the open tab (session storage) until it expires or you end it.
- When you read a Staff document with a guest pass, the sign-in relay fetches it from GitHub for you. The relay stores nothing and keeps no logs of passes.
- The site checks once in a while whether a new version is live, by reading its own build number. Nothing about you is sent.

## Third parties
- **GitHub:** the site is hosted on GitHub Pages, and your browser requests releases, contract issues and commits directly from GitHub's public API. GitHub receives your IP address and browser details for these requests, as it does for any visit to GitHub. See GitHub's privacy statement for how they handle it.
- **Fonts** are served from this site. No requests go to Google or other font services.
- **Discord:** links to Discord open Discord's own site, which has its own privacy policy. When the server widget is switched on, the home page asks Discord's public widget API how many members are online. Discord receives your IP address and browser details for that request.
- **Profile pictures** on keycards are loaded from GitHub's avatar service.

## Contact
Questions about privacy can be raised as an issue on the project's GitHub repository.
