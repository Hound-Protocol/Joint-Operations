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
    if await page.locator("#menu a").count() != 9:
        failures.append("menu does not have 9 items")
    for v in VIEWS:
        await page.goto(BASE + "#/" + v)
        await page.wait_for_timeout(900)
        if not await page.locator(".vh h2").count():
            failures.append(f"{v}: no heading")
        if await page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"):
            failures.append(f"{v}: horizontal overflow")
    await page.goto(BASE + "#/briefing"); await page.wait_for_timeout(900)
    if not await page.locator("svg.how").count():
        failures.append("briefing: diagram missing")
    await page.goto(BASE + "#/roadmap"); await page.wait_for_timeout(900)
    if await page.locator(".bf-road .ph").count() < 3:
        failures.append("roadmap: phases missing")
    await page.goto(BASE + "#/docs/plan"); await page.wait_for_timeout(3600)
    if len(await page.inner_text("#nwBody")) < 200:
        failures.append("docs: plan did not open in the neural web")
    graph = await page.evaluate("JO.docsGraph()")
    if not graph or not graph["ready"] or not all(n["on"] for n in graph["nodes"]):
        failures.append("docs: neural web did not finish building in time")
    await page.evaluate("document.querySelector('#nwClassic').click()"); await page.wait_for_timeout(900)
    if len(await page.inner_text("#docBody")) < 200:
        failures.append("docs: classic view did not render")
    await page.evaluate("document.querySelector('#toNeural').click()"); await page.wait_for_timeout(300)
    await page.goto(BASE + "#/options"); await page.wait_for_timeout(500)
    await page.click('[data-opt="grid"]')
    if "no-grid" not in (await page.evaluate("document.body.className")):
        failures.append("options: toggle did not apply")
    if errors:
        failures.append("script errors: " + "; ".join(errors))
    await page.close()
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
