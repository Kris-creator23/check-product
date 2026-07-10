import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


def configure_playwright_browsers():
    bundled_root = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    bundled_browsers = bundled_root / "ms-playwright"

    if bundled_browsers.exists():
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(bundled_browsers)


def choose_folder():
    script = 'POSIX path of (choose folder with prompt "Valitse kuittikansio")'
    result = subprocess.run(
        ["osascript", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def _html(saved_path="", acknowledged=False):
    checked = "checked" if acknowledged else ""
    return f"""<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CheckApp</title>
  <style>
    :root {{
      --ink: #1f2937;
      --muted: #66737a;
      --line: #dbe3df;
      --green: #17835f;
      --green-dark: #0f6649;
      --soft: #f5f8f6;
      --danger: #b42318;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      color: var(--ink);
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 10% 0%, rgba(23, 131, 95, .16), transparent 32%),
        linear-gradient(180deg, #ffffff 0%, #f6faf8 100%);
    }}
    main {{
      width: min(540px, calc(100vw - 40px));
      background: rgba(255, 255, 255, .95);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(31, 41, 55, .16);
      padding: 30px;
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }}
    .mark {{
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: linear-gradient(145deg, #20a879, #0f6b4c);
      color: white;
      display: grid;
      place-items: center;
      font-size: 25px;
      font-weight: 900;
      box-shadow: 0 10px 22px rgba(23, 131, 95, .28);
    }}
    .logo {{
      font-size: 30px;
      font-weight: 850;
    }}
    h1 {{
      margin: 0 0 8px;
      font-size: 25px;
      letter-spacing: 0;
    }}
    p {{
      margin: 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 14px;
    }}
    .panel {{
      margin-top: 18px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fbfdfc;
    }}
    .label {{
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 800;
    }}
    .path {{
      min-height: 46px;
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid #cfd9d5;
      border-radius: 11px;
      color: var(--muted);
      font-size: 13px;
      overflow-wrap: anywhere;
      background: white;
    }}
    button {{
      border: 0;
      border-radius: 999px;
      height: 48px;
      padding: 0 18px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
    }}
    .primary {{
      width: 100%;
      margin-top: 18px;
      background: linear-gradient(180deg, #1f9b72, #127654);
      color: #fff;
      box-shadow: 0 12px 25px rgba(23, 131, 95, .25);
    }}
    .secondary {{
      width: 100%;
      margin-top: 12px;
      background: #eef5f2;
      color: var(--green-dark);
    }}
    .checkrow {{
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 12px;
      align-items: start;
      margin-top: 18px;
      color: var(--ink);
      font-size: 14px;
      line-height: 1.45;
    }}
    input[type="checkbox"] {{
      width: 20px;
      height: 20px;
      accent-color: var(--green);
      margin-top: 1px;
    }}
    .message {{
      display: none;
      margin-top: 14px;
      padding: 12px 13px;
      border-radius: 12px;
      background: var(--soft);
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }}
    .message.error {{
      background: #fff1f0;
      color: var(--danger);
    }}
  </style>
</head>
<body>
  <main>
    <div class="brand">
      <div class="mark">✓</div>
      <div class="logo">CheckApp</div>
    </div>
    <h1>Valmistele kuittien vienti</h1>
    <p>Valitse kuittikansio ja vahvista tietojen käsittely ennen Fennoaan siirtymistä.</p>

    <div class="panel">
      <div class="label">Kuittikansio</div>
      <div class="path" id="folderPath">{saved_path or "Kansiota ei ole vielä valittu"}</div>
      <button class="secondary" id="chooseFolder">Valitse kansio</button>
    </div>

    <label class="checkrow">
      <input id="ack" type="checkbox" {checked} />
      <span>
        Ymmärrän, että CheckApp lähettää kuitin visuaalisen sisällön CheckAppin palvelimen kautta OpenAI API -palveluun tunnistamista varten. Tarkistan tiedot Fennoassa ennen niiden käyttämistä kirjanpidossa, verotuksessa tai maksamisessa.
      </span>
    </label>

    <button class="primary" id="continue">Jatka Fennoaan</button>
    <div id="message" class="message"></div>
  </main>

  <script>
    let folderPath = {saved_path!r};
    const $ = (id) => document.getElementById(id);
    const message = $("message");
    const action = (payload) => {{ window.checkappAction = payload; }};

    function showMessage(text, error = false) {{
      message.textContent = text || "";
      message.className = error ? "message error" : "message";
      message.style.display = text ? "block" : "none";
    }}

    window.checkappSetFolder = (path) => {{
      folderPath = path;
      $("folderPath").textContent = path;
      showMessage("");
    }};
    window.checkappShowError = (text) => showMessage(text, true);

    $("chooseFolder").onclick = () => action({{ type: "choose-folder" }});
    $("continue").onclick = () => {{
      if (!folderPath) return showMessage("Valitse ensin kuittikansio.", true);
      if (!$("ack").checked) return showMessage("Vahvista tietojen käsittely ennen jatkamista.", true);
      action({{ type: "continue", folderPath, acknowledged: true }});
    }};
  </script>
</body>
</html>"""


def run_receipt_setup_window(saved_path="", acknowledged=False):
    configure_playwright_browsers()
    playwright = sync_playwright().start()
    browser = None
    try:
        browser = playwright.chromium.launch(
            headless=False,
            slow_mo=80,
            args=["--app=data:text/html,CheckApp"],
        )
        context = browser.new_context(viewport={"width": 600, "height": 720})
        page = context.new_page()
        page.set_content(_html(saved_path, acknowledged), wait_until="domcontentloaded")

        while True:
            if page.is_closed():
                raise RuntimeError("CheckApp-valmistelu peruttiin.")

            action = page.evaluate("window.checkappAction || null")
            if not action:
                time.sleep(0.15)
                continue

            page.evaluate("window.checkappAction = null")
            action_type = action.get("type")

            if action_type == "choose-folder":
                try:
                    folder = choose_folder()
                    page.evaluate("(path) => window.checkappSetFolder(path)", folder)
                except subprocess.CalledProcessError:
                    page.evaluate(
                        "(message) => window.checkappShowError(message)",
                        "Kansiota ei valittu.",
                    )
                continue

            if action_type == "continue":
                folder = Path(action.get("folderPath") or "").expanduser()
                if not folder.exists() or not folder.is_dir():
                    page.evaluate(
                        "(message) => window.checkappShowError(message)",
                        "Valittua kansiota ei löydy.",
                    )
                    continue
                browser.close()
                playwright.stop()
                return str(folder), bool(action.get("acknowledged"))
    finally:
        try:
            if browser:
                browser.close()
        except Exception:
            pass
        try:
            playwright.stop()
        except Exception:
            pass
