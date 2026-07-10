import os
import sys
import time
import webbrowser
from pathlib import Path

from playwright.sync_api import sync_playwright


def configure_playwright_browsers():
    bundled_root = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    bundled_browsers = bundled_root / "ms-playwright"

    if bundled_browsers.exists():
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(bundled_browsers)


def _html():
    return """<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CheckApp</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1f2937;
      --muted: #66737a;
      --line: #dbe3df;
      --green: #17835f;
      --green-dark: #0f6649;
      --soft: #f5f8f6;
      --danger: #b42318;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 16% 0%, rgba(23, 131, 95, .14), transparent 30%),
        linear-gradient(180deg, #ffffff 0%, #f6faf8 100%);
      color: var(--ink);
      min-height: 100vh;
      display: grid;
      place-items: center;
    }
    main {
      width: min(440px, calc(100vw - 40px));
      background: rgba(255, 255, 255, .94);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(31, 41, 55, .16);
      padding: 30px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 26px;
    }
    .mark {
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
    }
    .logo {
      font-size: 30px;
      font-weight: 850;
      letter-spacing: 0;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 25px;
      letter-spacing: 0;
    }
    p {
      margin: 0 0 22px;
      color: var(--muted);
      line-height: 1.45;
      font-size: 14px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 750;
      margin: 18px 0 8px;
    }
    input {
      width: 100%;
      height: 48px;
      border: 1px solid #cfd9d5;
      border-radius: 11px;
      padding: 0 14px;
      font-size: 16px;
      outline: none;
      background: #fff;
    }
    input:focus {
      border-color: var(--green);
      box-shadow: 0 0 0 4px rgba(23, 131, 95, .12);
    }
    button {
      border: 0;
      border-radius: 999px;
      height: 48px;
      padding: 0 18px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
    }
    .primary {
      width: 100%;
      margin-top: 18px;
      background: linear-gradient(180deg, #1f9b72, #127654);
      color: #fff;
      box-shadow: 0 12px 25px rgba(23, 131, 95, .25);
    }
    .secondary {
      width: 100%;
      margin-top: 10px;
      background: #eef5f2;
      color: var(--green-dark);
    }
    .link {
      margin-top: 16px;
      color: var(--green-dark);
      text-align: center;
      font-size: 14px;
      font-weight: 750;
      cursor: pointer;
    }
    .message {
      display: none;
      margin-top: 14px;
      padding: 12px 13px;
      border-radius: 12px;
      background: var(--soft);
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }
    .message.error {
      background: #fff1f0;
      color: var(--danger);
    }
    .small {
      margin-top: 18px;
      font-size: 12px;
      color: #7b878d;
    }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
  <main>
    <div class="brand">
      <div class="mark">✓</div>
      <div class="logo">CheckApp</div>
    </div>

    <section id="emailStep">
      <h1>Kirjaudu sisään</h1>
      <p>Syötä CheckApp-tilisi sähköposti. Jos rekisteröidyit Googlella, käytä samaa Google-sähköpostia.</p>
      <label for="email">Sähköposti</label>
      <input id="email" type="email" autocomplete="email" placeholder="sähköposti@yritys.fi" />
      <button class="primary" id="sendCode">Lähetä kirjautumiskoodi</button>
      <button class="secondary" id="openSite">Avaa CheckApp-tili selaimessa</button>
      <div class="small">CheckApp ei pyydä Google-salasanaa. Google-käyttäjät kirjautuvat sovellukseen sähköpostikoodilla.</div>
    </section>

    <section id="codeStep" hidden>
      <h1>Tarkista sähköposti</h1>
      <p>Lähetimme kertakäyttöisen kirjautumiskoodin osoitteeseen <strong id="emailText"></strong>.</p>
      <label for="code">Kirjautumiskoodi</label>
      <input id="code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" />
      <button class="primary" id="verifyCode">Jatka</button>
      <div class="link" id="changeEmail">Vaihda sähköposti</div>
    </section>

    <section id="passwordStep" hidden>
      <h1>Kirjaudu salasanalla</h1>
      <p>Sähköpostikoodia ei voitu lähettää. Voit kirjautua CheckApp-salasanalla, jos tililläsi on sellainen.</p>
      <label for="password">CheckApp-salasana</label>
      <input id="password" type="password" autocomplete="current-password" />
      <button class="primary" id="passwordLogin">Kirjaudu</button>
      <div class="link" id="backToEmail">Takaisin</div>
    </section>

    <div id="message" class="message"></div>
  </main>

  <script>
    let currentEmail = "";
    const action = (payload) => { window.checkappAction = payload; };
    const $ = (id) => document.getElementById(id);
    const message = $("message");

    function showMessage(text, error = false) {
      message.textContent = text || "";
      message.className = error ? "message error" : "message";
      message.style.display = text ? "block" : "none";
    }

    function showStep(step) {
      ["emailStep", "codeStep", "passwordStep"].forEach((id) => $(id).hidden = id !== step);
      showMessage("");
      setTimeout(() => {
        const field = step === "emailStep" ? $("email") : step === "codeStep" ? $("code") : $("password");
        field.focus();
      }, 50);
    }

    window.checkappShowCode = (email) => {
      currentEmail = email;
      $("emailText").textContent = email;
      showStep("codeStep");
    };
    window.checkappShowError = (text) => showMessage(text, true);
    window.checkappShowPassword = (email, text) => {
      currentEmail = email;
      showStep("passwordStep");
      showMessage(text, true);
    };

    $("sendCode").onclick = () => {
      const email = $("email").value.trim().toLowerCase();
      if (!email) return showMessage("Syötä sähköpostiosoite.", true);
      currentEmail = email;
      showMessage("Lähetetään kirjautumiskoodia...");
      action({ type: "send-code", email });
    };
    $("verifyCode").onclick = () => {
      const code = $("code").value.trim();
      if (!code) return showMessage("Syötä sähköpostissa oleva koodi.", true);
      showMessage("Kirjaudutaan sisään...");
      action({ type: "verify-code", email: currentEmail, code });
    };
    $("passwordLogin").onclick = () => {
      const password = $("password").value;
      if (!password) return showMessage("Syötä salasana.", true);
      showMessage("Kirjaudutaan sisään...");
      action({ type: "password-login", email: currentEmail, password });
    };
    $("openSite").onclick = () => action({ type: "open-site" });
    $("changeEmail").onclick = () => showStep("emailStep");
    $("backToEmail").onclick = () => showStep("emailStep");

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (!$("emailStep").hidden) $("sendCode").click();
      else if (!$("codeStep").hidden) $("verifyCode").click();
      else if (!$("passwordStep").hidden) $("passwordLogin").click();
    });

    $("email").focus();
  </script>
</body>
</html>"""


def run_check_login_window(request_handler, error_message):
    configure_playwright_browsers()
    playwright = sync_playwright().start()
    browser = None
    try:
        browser = playwright.chromium.launch(
            headless=False,
            slow_mo=80,
            args=["--app=data:text/html,CheckApp"],
        )
        context = browser.new_context(viewport={"width": 500, "height": 660})
        page = context.new_page()
        page.set_content(_html(), wait_until="domcontentloaded")

        while True:
            if page.is_closed():
                raise RuntimeError("CheckApp-kirjautuminen peruttiin.")

            action = page.evaluate("window.checkappAction || null")
            if not action:
                time.sleep(0.15)
                continue

            page.evaluate("window.checkappAction = null")
            action_type = action.get("type")

            if action_type == "open-site":
                webbrowser.open("https://checkapp.fi/dashboard")
                continue

            if action_type == "send-code":
                ok, result = request_handler(action)
                if ok:
                    page.evaluate(
                        "(email) => window.checkappShowCode(email)",
                        action.get("email", ""),
                    )
                else:
                    page.evaluate(
                        "({ email, message }) => window.checkappShowPassword(email, message)",
                        {
                            "email": action.get("email", ""),
                            "message": result or error_message,
                        },
                    )
                continue

            if action_type == "verify-code":
                ok, result = request_handler(action)
                if not ok:
                    page.evaluate(
                        "(message) => window.checkappShowError(message)",
                        result or error_message,
                    )
                    continue
                session = result
                browser.close()
                playwright.stop()
                return session

            if action_type == "password-login":
                ok, result = request_handler(action)
                if not ok:
                    page.evaluate(
                        "(message) => window.checkappShowError(message)",
                        result or error_message,
                    )
                    continue
                session = result
                browser.close()
                playwright.stop()
                return session

            page.evaluate(
                "(message) => window.checkappShowError(message)",
                error_message,
            )
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
