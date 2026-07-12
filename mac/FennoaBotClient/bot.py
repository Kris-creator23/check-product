import subprocess
import sys

from check_auth import require_active_subscription
from client_settings import ensure_receipt_setup
from login import configure_playwright_browsers, login
from fennoa import upload_all_receipts
from playwright.sync_api import sync_playwright


def show_dialog(message, title="CheckApp"):
    script = '''
on run argv
  display dialog (item 1 of argv) buttons {"OK"} default button "OK" with title (item 2 of argv) with icon note
end run
'''
    try:
        subprocess.run(["osascript", "-e", script, message, title], check=False)
    except Exception:
        print(message)


def main():
    print("CheckApp käynnistyy.")
    require_active_subscription()
    receipts_dir = ensure_receipt_setup()
    page = login()
    result = upload_all_receipts(page, receipts_dir)
    if result["failed"]:
        show_dialog(
            "Kuittien käsittely päättyi, mutta kaikkia kuitteja ei saatu käsiteltyä.\n\n"
            f"Onnistui: {result['processed']}\n"
            f"Epäonnistui: {result['failed']}\n\n"
            "Epäonnistuneet tiedostot siirrettiin failed-kansioon."
        )
    else:
        show_dialog("Valmis. Kuittien käsittely on päättynyt.")


def run_playwright_self_test():
    """Launch the bundled driver and browser before a release is published."""
    configure_playwright_browsers()
    playwright = sync_playwright().start()
    browser = None
    try:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content("<title>CheckApp Playwright OK</title>")
        if page.title() != "CheckApp Playwright OK":
            raise RuntimeError("Playwright smoke test returned an unexpected page title.")
        print("PLAYWRIGHT_SELF_TEST_OK")
    finally:
        if browser:
            browser.close()
        playwright.stop()


if __name__ == "__main__":
    try:
        if "--self-test-playwright" in sys.argv:
            run_playwright_self_test()
        else:
            main()
    except KeyboardInterrupt:
        print("\nKeskeytetty.")
    except Exception as error:
        print()
        print("=" * 60)
        print("CheckApp ei voinut jatkaa")
        print("=" * 60)
        print(str(error))
        show_dialog(f"CheckApp ei voinut jatkaa:\n\n{error}")
