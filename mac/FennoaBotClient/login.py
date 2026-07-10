import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


def configure_playwright_browsers():
    bundled_root = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    bundled_browsers = bundled_root / "ms-playwright"

    if bundled_browsers.exists():
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(bundled_browsers)


def find_first(page, candidates, timeout=3000):
    for candidate in candidates:
        locator = candidate()
        try:
            locator.wait_for(timeout=timeout)
            return locator
        except Exception:
            continue
    return None


def wait_until_inside_fennoa(page):
    try:
        page.wait_for_function(
            """() => {
                const url = window.location.href.toLowerCase();
                const text = document.body?.innerText || "";
                return !url.includes("/login") || text.includes("Ostot") || text.includes("Uusi kuitti");
            }""",
            timeout=300000,
        )
        return
    except PlaywrightTimeoutError:
        print()
        print("CheckApp ei tunnistanut Fennoan kirjautumisen valmistumista automaattisesti.")
        input("Kun Fennoa-etusivu on auki selaimessa, jatka painamalla ENTER...")


def login():
    configure_playwright_browsers()

    playwright = sync_playwright().start()

    browser = playwright.chromium.launch(
        headless=False,
        slow_mo=300
    )

    context = browser.new_context()

    page = context.new_page()

    page.goto("https://app.fennoa.com/login")

    page.wait_for_load_state("networkidle")

    print("Fennoan kirjautumissivu avattu.")

    email_field = find_first(
        page,
        [
            lambda: page.get_by_role("textbox", name="Sähköposti"),
            lambda: page.locator('input[type="email"]').first,
            lambda: page.locator('input[name*="email" i]').first,
            lambda: page.locator('input[id*="email" i]').first,
            lambda: page.locator('input').first,
        ],
    )

    password_field = find_first(
        page,
        [
            lambda: page.get_by_role("textbox", name="Salasana"),
            lambda: page.locator('input[type="password"]').first,
            lambda: page.locator('input[name*="password" i]').first,
            lambda: page.locator('input[id*="password" i]').first,
        ],
    )

    if email_field and password_field:
        print()
        print("Kirjaudu Fennoaan avatussa selainikkunassa.")
        print("CheckApp ei kysy eikä tallenna Fennoa-salasanaa.")
        print("CheckApp jatkaa automaattisesti, kun kirjautuminen on valmis.")
    else:
        print()
        print("CheckApp ei löytänyt Fennoan kirjautumiskenttiä automaattisesti.")
        print("Kirjaudu Fennoaan selaimessa. CheckApp jatkaa automaattisesti.")

    print()
    print("=" * 60)
    print("Syötä 2FA-koodi Fennoan kirjautumisnäkymässä.")
    print("CheckApp jatkaa automaattisesti, kun kirjautuminen on valmis.")
    print("=" * 60)

    wait_until_inside_fennoa(page)

    print("✅ Kirjautuminen valmis.")

    return page
