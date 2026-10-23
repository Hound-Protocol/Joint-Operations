#!/usr/bin/env python3
"""Smoke-test the assembled site in real browser engines.

Usage: python3 tests/browser_smoke.py SITE_DIR [chromium firefox webkit]
Checks every section at desktop and phone sizes: no script errors, no
horizontal overflow, headings render, and key features work.
"""
import asyncio, functools, http.server, sys, threading
from playwright.async_api import async_playwright

site = sys.argv[1]
engines = sys.argv[2:] or ["chromium", "firefox", "webkit"]
VIEWS = ["briefing", "roadmap", "download", "sessions", "contribute", "team", "mods", "devlog", "guides", "guides/hp-pol-002", "verify", "docs/architecture", "options"]

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


handler = functools.partial(Quiet, directory=site)
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_address[1]}/"


async def check(browser, name, size):
    failures = []
    page = await browser.new_page(viewport=size)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.goto(BASE)
    await page.wait_for_timeout(1200)
    if await page.locator("#menu a").count() != 8:
        failures.append("menu does not have 8 items")
    for v in VIEWS:
        await page.goto(BASE + "#/" + v)
        await page.wait_for_timeout(900)
        if not await page.locator(".vh h2").count():
            failures.append(f"{v}: no heading")
        if await page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"):
            failures.append(f"{v}: horizontal overflow")
    await page.goto(BASE + "#/briefing"); await page.wait_for_timeout(900)
    if await page.locator(".bf-steps li").count() < 3:
        failures.append("briefing: session steps missing")
    await page.goto(BASE + "#/team"); await page.wait_for_timeout(900)
    if await page.locator(".chain .tier").count() < 6:
        failures.append("team: chain of command missing")
    await page.goto(BASE + "#/contribute"); await page.wait_for_timeout(900)
    await page.click('[data-tab="ranks"]'); await page.wait_for_timeout(300)
    if await page.locator(".ranks .rank").count() != 10:
        failures.append("contribute: expected 10 grades, E to S++")
    await page.goto(BASE + "#/devlog"); await page.wait_for_timeout(900)
    await page.fill("#lq", "zzzz-no-match"); await page.wait_for_timeout(500)
    if not await page.locator(".empty").count():
        failures.append("devlog: search did not filter")
    await page.goto(BASE + "#/verify"); await page.wait_for_timeout(900)
    if not await page.locator(".hks .hk").count() or not await page.locator("#kcCh").inner_text():
        failures.append("verify: keycards or Hound ID challenge missing")
    await page.goto(BASE + "#/roadmap"); await page.wait_for_timeout(900)
    if await page.locator(".mb-mod").count() < 3:
        failures.append("roadmap: base platforms missing")
    else:
        await page.dispatch_event('.mb-mod[data-i="1"]', "click"); await page.wait_for_timeout(300)
        if "Phase 1" not in await page.inner_text("#mbPanel"):
            failures.append("roadmap: clicking a platform did not open its progress")
    await page.goto(BASE + "#/docs/plan"); await page.wait_for_timeout(1500)
    view = await page.evaluate("JO.docsView()")
    if view["mode"] != "cabinet" or view["open"] != "plan" or view["drawers"] < 3:
        failures.append("docs: cabinet did not open the plan file")
    if len(await page.inner_text("#docBody")) < 200:
        failures.append("docs: case file is empty")
    await page.fill("#cq", "pol 9"); await page.wait_for_timeout(1800)
    first = await page.locator(".cab-hits a").first.inner_text() if await page.locator(".cab-hits a").count() else ""
    if "HP-POL-009" not in first:
        failures.append("docs: search by file number did not rank HP-POL-009 first")
    await page.fill("#cq", "keycard signing"); await page.wait_for_timeout(800)
    if not await page.locator(".cab-hits a").count():
        failures.append("docs: full-text search found nothing")
    await page.press("#cq", "Enter"); await page.wait_for_timeout(1500)
    if not await page.locator("#vb mark.hl").count():
        failures.append("docs: opening a result did not highlight the match")
    await page.fill("#cq", "")
    await page.goto(BASE + "#/options"); await page.wait_for_timeout(500)
    await page.click('[data-opt="grid"]')
    if "no-grid" not in (await page.evaluate("document.body.className")):
        failures.append("options: toggle did not apply")
    await page.click('[data-preset="light"]')
    if "no-motion" not in (await page.evaluate("document.body.className")):
        failures.append("options: performance preset did not apply")
    await page.click('[data-preset="full"]')
    if errors:
        failures.append("script errors: " + "; ".join(errors))
    await page.close()
    # Old browsers: without CSS variables support the plain fallback page shows instead of the app
    old_page = await browser.new_page(viewport=size)
    await old_page.add_init_script("window.CSS = undefined;")
    await old_page.goto(BASE); await old_page.wait_for_timeout(600)
    if not await old_page.locator("#legacy").is_visible():
        failures.append("legacy: fallback page not shown")
    await old_page.close()
    return failures


async def main():
    total = 0
    async with async_playwright() as p:
        for engine in engines:
            browser = await getattr(p, engine).launch()
            for label, size in [("desktop", {"width": 1440, "height": 900}), ("phone", {"width": 390, "height": 844})]:
                fails = await check(browser, engine, size)
                total += len(fails)
                print(f"{engine:9} {label:8} {'PASS' if not fails else 'FAIL'}")
                for f in fails:
                    print("    - " + f)
            await browser.close()
    sys.exit(1 if total else 0)

asyncio.run(main())
