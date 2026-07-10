from shutil import move
import re
import subprocess
import time

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from receipt_parser import parse_receipt
from client_settings import ensure_ai_acknowledgement, get_receipts_dir
from config import PROCESSED_DIR, FAILED_DIR
from check_auth import record_receipt_usage


ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


def wait_for_user_receipt_confirmation():
    script = '''
set dialogResult to display dialog "Tarkista ja tallenna kuitti Fennoassa. Kun kuitti on tallennettu, jatka seuraavaan kuittiin valitsemalla OK." buttons {"Keskeytä", "OK"} default button "OK" with title "CheckApp" with icon note
button returned of dialogResult
'''

    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip() == "OK"
    except subprocess.CalledProcessError:
        return False
    except FileNotFoundError:
        input(
            "Kun olet tarkistanut ja tallentanut tämän kuitin Fennoassa, "
            "jatka seuraavaan kuittiin painamalla ENTER..."
        )
        return True


def confirm_receipt_processing_start(page):
    start_script = '''
set dialogResult to display dialog "Fennoa-kirjautuminen on valmis. Aloitetaanko kuittien vienti Fennoaan?" buttons {"Sulje", "Myöhemmin", "Aloita"} default button "Aloita" cancel button "Sulje" with title "CheckApp" with icon note
button returned of dialogResult
'''
    try:
        result = subprocess.run(
            ["osascript", "-e", start_script],
            check=True,
            capture_output=True,
            text=True,
        )
        button = result.stdout.strip()

        if button == "Myöhemmin":
            wait_with_floating_start_button(page)
    except subprocess.CalledProcessError:
        raise KeyboardInterrupt
    except FileNotFoundError:
        input("Aloita kuittien käsittely painamalla ENTER...")


def wait_with_floating_start_button(
    page,
    button_text="Aloita kuittien vienti",
    console_text="CheckApp odottaa. Aloita kuittien vienti Fennoa-ikkunan vihreästä painikkeesta.",
):
    print(console_text)

    if page.is_closed():
        raise RuntimeError(
            "Fennoa-ikkuna suljettiin. Käynnistä CheckApp uudelleen ja pidä Fennoa-ikkuna auki käsittelyn ajan."
        )

    script = """
    (buttonText) => {
      if (window.__checkAppStartReceipts === undefined) {
        window.__checkAppStartReceipts = false;
      }
      if (document.getElementById("checkapp-floating-start")) return;

      if (!document.getElementById("checkapp-floating-style")) {
        const style = document.createElement("style");
        style.id = "checkapp-floating-style";
        style.textContent = `
          @keyframes checkappPulse {
            0% { transform: scale(1); box-shadow: 0 18px 38px rgba(0, 94, 62, .30), inset 0 2px 0 rgba(255,255,255,.32); }
            50% { transform: scale(1.035); box-shadow: 0 22px 46px rgba(0, 123, 82, .40), inset 0 2px 0 rgba(255,255,255,.40); }
            100% { transform: scale(1); box-shadow: 0 18px 38px rgba(0, 94, 62, .30), inset 0 2px 0 rgba(255,255,255,.32); }
          }
        `;
        document.head.appendChild(style);
      }

      const button = document.createElement("button");
      button.id = "checkapp-floating-start";
      button.type = "button";
      button.textContent = buttonText;
      button.style.position = "fixed";
      button.style.right = "28px";
      button.style.bottom = "28px";
      button.style.zIndex = "2147483647";
      button.style.minWidth = "280px";
      button.style.width = buttonText.length > 24 ? "330px" : "260px";
      button.style.height = "64px";
      button.style.borderRadius = "999px";
      button.style.border = "1px solid rgba(160, 255, 214, .85)";
      button.style.background = "linear-gradient(180deg, #16c784 0%, #0b8f62 52%, #066546 100%)";
      button.style.color = "#fff";
      button.style.font = "800 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      button.style.letterSpacing = "0";
      button.style.cursor = "pointer";
      button.style.animation = "checkappPulse 1.45s ease-in-out infinite";
      button.style.textShadow = "0 1px 1px rgba(0,0,0,.24)";
      button.style.backdropFilter = "blur(8px)";
      button.style.webkitBackdropFilter = "blur(8px)";
      button.style.padding = "0 24px";
      button.style.outline = "none";
      button.style.userSelect = "none";

      button.addEventListener("mouseenter", () => {
        button.style.background = "linear-gradient(180deg, #20d993 0%, #0aa66f 54%, #07724f 100%)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = "linear-gradient(180deg, #16c784 0%, #0b8f62 52%, #066546 100%)";
      });
      button.addEventListener("click", () => {
        window.__checkAppStartReceipts = true;
        button.textContent = "Aloitetaan...";
        button.style.animation = "none";
        button.style.opacity = ".92";
        setTimeout(() => button.remove(), 180);
      });

      document.body.appendChild(button);
    }
    """

    try:
        page.evaluate("() => { window.__checkAppStartReceipts = false; }")
        while True:
            if page.is_closed():
                raise RuntimeError(
                    "Fennoa-ikkuna suljettiin. Käynnistä CheckApp uudelleen ja pidä Fennoa-ikkuna auki käsittelyn ajan."
                )
            try:
                page.evaluate(script, button_text)
                if page.evaluate("() => window.__checkAppStartReceipts === true"):
                    break
            except PlaywrightError:
                pass
            page.wait_for_timeout(500)
        print("CheckApp aloittaa kuittien viennin.")
        return
    except Exception as error:
        print()
        print("CheckApp ei voinut näyttää Fennoa-sivun aloituspainiketta.")
        print(f"Tekninen syy: {error}")
        raise KeyboardInterrupt


def wait_for_manual_receipt_completion(page):
    wait_with_floating_start_button(
        page,
        button_text="Jatka tallennetun kuitin jälkeen",
        console_text=(
            "CheckApp on tauolla. Korjaa ja tallenna nykyinen kuitti Fennoassa. "
            "Jatka vihreästä painikkeesta tallennuksen jälkeen."
        ),
    )


def wait_for_manual_new_receipt_view(page):
    wait_with_floating_start_button(
        page,
        button_text="Jatka kun Uusi kuitti on auki",
        console_text=(
            "CheckApp on tauolla. Avaa Fennoassa Uusi kuitti -näkymä. "
            "Jatka vihreästä painikkeesta, kun uusi kuitti on auki."
        ),
    )


def normalize_finnish_date(value):
    if not value:
        return ""

    match = re.search(r"(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})", str(value))
    if not match:
        return ""

    day, month, year = match.groups()
    if len(year) == 2:
        year = f"20{year}"

    return f"{int(day)}.{int(month)}.{year}"


def looks_like_date(value):
    return bool(re.fullmatch(r"\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*", str(value or "")))


def clean_text_field(value, field_name):
    text = str(value or "").strip()
    if not text:
        return ""

    if looks_like_date(text):
        print(f"⚠️ {field_name} skipped: recognized value looked like a date.")
        return ""

    return text


def normalize_country(value):
    country = str(value or "").strip()
    mapping = {
        "suomi": "Finland",
        "finland": "Finland",
    }
    return mapping.get(country.lower(), country)


def expense_description(data):
    expense_type = str(data.get("expense_type") or "").strip()
    if expense_type and not looks_like_raw_receipt_text(expense_type):
        return expense_type[:80]

    supplier = str(data.get("supplier_name") or "").lower()
    note = str(data.get("note") or "").lower()
    text = f"{supplier} {note}"

    if any(word in text for word in ["fuel", "bensin", "diesel", "polttoaine"]):
        return "polttoainekulut"
    if any(word in text for word in ["rauta", "tool", "työkalu", "laite", "kone"]):
        return "laitteiden hankinta"
    if any(word in text for word in ["suojalas", "työvaate", "vaate", "turva"]):
        return "työvaatteet ja suojavarusteet"
    if any(word in text for word in ["office", "toimisto", "paper", "kirja"]):
        return "toimistotarvikkeet"

    return "muut ostot"


def clean_invoice_number(value):
    text = clean_text_field(value, "receipt number")
    if not text:
        return ""

    if normalize_finnish_date(text):
        return ""

    return text[:80]


def clean_vat_number(value):
    text = str(value or "").strip().upper().replace(" ", "")
    if not text or looks_like_date(text):
        if text:
            print("⚠️ VAT number skipped: recognized value looked like a date.")
        return ""

    if re.fullmatch(r"FI\d{8}", text):
        return text

    if re.fullmatch(r"[A-Z]{2}[A-Z0-9]{6,14}", text):
        return text

    print("⚠️ VAT number skipped: recognized value was not a VAT number.")
    return ""


def clean_business_id(value):
    text = str(value or "").strip().upper().replace(" ", "")
    if not text or looks_like_date(text):
        if text:
            print("⚠️ Business ID skipped: recognized value looked like a date.")
        return ""

    if re.fullmatch(r"\d{7}-\d", text):
        return text

    print("⚠️ Business ID skipped: recognized value was not a Finnish Y-tunnus.")
    return ""


def sanitize_receipt_data(data):
    data["supplier_name"] = clean_text_field(data.get("supplier_name"), "supplier name")
    data["vat_number"] = clean_vat_number(data.get("vat_number"))
    data["business_id"] = clean_business_id(data.get("business_id"))
    data["invoice_number"] = clean_invoice_number(data.get("invoice_number"))

    data["note"] = clean_text_field(data.get("note"), "note")
    data["expense_type"] = clean_text_field(data.get("expense_type"), "expense type")
    if looks_like_raw_receipt_text(data.get("expense_type")):
        data["expense_type"] = ""

    return data


def looks_like_raw_receipt_text(value):
    text = str(value or "").strip().lower()
    if not text:
        return False

    blocked_patterns = [
        r"\bmyymäl[äa]\b",
        r"\bkassa\b",
        r"\bcashier\b",
        r"\bkuitti\b",
        r"\breceipt\b",
        r"\bvisa\b",
        r"\bmastercard\b",
        r"\bcard\b",
        r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b",
        r"\b\d{1,2}[:.]\d{2}\b",
    ]

    return any(re.search(pattern, text) for pattern in blocked_patterns)


def click_first_available(page, candidates, timeout=1200):
    for candidate in candidates:
        try:
            candidate().click(timeout=timeout)
            return True
        except Exception:
            continue
    return False


def click_by_visible_text(page, text):
    try:
        return page.evaluate(
            """(targetText) => {
                const normalizedTarget = targetText.toLowerCase();
                const elements = Array.from(document.querySelectorAll("a, button, [role='button'], [aria-label], [title]"));
                const visible = elements.filter((element) => {
                    const rect = element.getBoundingClientRect();
                    const style = window.getComputedStyle(element);
                    return rect.width > 1 && rect.height > 1 && style.visibility !== "hidden" && style.display !== "none";
                });
                const match = visible.find((element) => {
                    const values = [
                        element.textContent || "",
                        element.getAttribute("aria-label") || "",
                        element.getAttribute("title") || "",
                        element.getAttribute("href") || "",
                    ];
                    return values.some((value) => value.replace(/\\s+/g, " ").trim().toLowerCase().includes(normalizedTarget));
                });
                if (!match) return false;
                match.scrollIntoView({ block: "center", inline: "center" });
                match.click();
                return true;
            }""",
            text,
        )
    except Exception:
        return False


def click_by_visible_text_poll(page, text, timeout=4000, interval=250):
    deadline = time.monotonic() + (timeout / 1000)
    while time.monotonic() < deadline:
        if click_by_visible_text(page, text):
            return True
        page.wait_for_timeout(interval)
    return False


def open_purchases(page):
    if page.is_closed():
        raise RuntimeError(
            "Fennoa-ikkuna suljettiin ennen Ostot-näkymän avaamista. Käynnistä CheckApp uudelleen."
        )

    opened = click_first_available(
        page,
        [
            lambda: page.get_by_role("link", name=" Ostot"),
            lambda: page.get_by_role("link", name="Ostot"),
            lambda: page.locator("a").filter(has_text="Ostot").first,
            lambda: page.get_by_text("Ostot", exact=True),
        ],
    )

    if not opened:
        print()
        print("CheckApp ei löytänyt Fennoan Ostot-linkkiä automaattisesti.")
        input("Avaa Fennoassa Ostot-näkymä ja jatka painamalla ENTER...")

    try:
        page.wait_for_load_state("domcontentloaded", timeout=5000)
    except PlaywrightTimeoutError:
        pass


def open_new_receipt(page):
    if page.is_closed():
        raise RuntimeError(
            "Fennoa-ikkuna suljettiin ennen uuden kuitin avaamista. Käynnistä CheckApp uudelleen."
        )

    opened = click_by_visible_text(page, "Uusi kuitti")

    if not opened:
        opened = click_first_available(
            page,
            [
                lambda: page.get_by_role("link", name="Uusi kuitti"),
                lambda: page.get_by_role("button", name="Uusi kuitti"),
                lambda: page.locator("a").filter(has_text="Uusi kuitti").first,
                lambda: page.locator("button").filter(has_text="Uusi kuitti").first,
                lambda: page.get_by_text("Uusi kuitti", exact=True),
            ],
            timeout=300,
        )

    if not opened:
        opened = click_by_visible_text_poll(page, "Uusi kuitti", timeout=1200, interval=100)

    if not opened:
        print()
        print("CheckApp ei löytänyt Fennoan Uusi kuitti -painiketta automaattisesti.")
        wait_for_manual_new_receipt_view(page)

    try:
        page.wait_for_load_state("domcontentloaded", timeout=5000)
    except PlaywrightTimeoutError:
        pass


def vat_to_business_id(vat):
    """
    Converts Finnish VAT format FI12345678 into Y-tunnus 1234567-8.
    """

    if not vat:
        return ""

    vat = vat.strip().upper()

    if vat.startswith("FI"):
        vat = vat[2:]

    if len(vat) == 8 and vat.isdigit():
        return f"{vat[:7]}-{vat[7]}"

    return ""


def select_country(page, country):
    """Selects supplier country in Fennoa."""
    try:
        page.get_by_role("textbox", name="Finland").click()
        page.locator(".select2-search__field").fill(country)
        page.get_by_role("option", name=country).click()
    except Exception:
        print("⚠️ Fennoa field selection failed: country.")


def select_currency(page, currency):
    """Selects currency in Fennoa."""
    try:
        page.get_by_role("textbox", name="Euro (EUR)").click()

        currency_map = {
            "EUR": "Euro (EUR)",
            "SEK": "Swedish krona (SEK)",
            "NOK": "Norwegian krone (NOK)",
            "DKK": "Danish krone (DKK)",
            "USD": "US dollar (USD)",
            "GBP": "British pound (GBP)",
        }

        option = currency_map.get(currency, currency)

        page.locator(".select2-search__field").fill(option)
        page.get_by_role("option", name=option).click()

    except Exception:
        print("⚠️ Fennoa field selection failed: currency.")


def set_field_value(page, selectors, value):
    if not value:
        return False

    for selector in selectors:
        try:
            field = page.locator(selector).first
            field.wait_for(timeout=1500)
            field.fill(str(value))
            return True
        except Exception:
            continue

    return False


def set_dates(page, purchase_date):
    if not purchase_date:
        return

    selectors = [
        "#PurchaseInvoicePurchaseDate",
        "#PurchaseInvoiceReceiptDate",
        "#PurchaseInvoiceDate",
        "#PurchaseInvoiceInvoiceDate",
        "#PurchaseInvoiceEntryDate",
        'input[name*="PurchaseDate"]',
        'input[name*="ReceiptDate"]',
        'input[name*="InvoiceDate"]',
        'input[name*="EntryDate"]',
        'input[id*="PurchaseDate"]',
        'input[id*="ReceiptDate"]',
        'input[id*="InvoiceDate"]',
        'input[id*="EntryDate"]',
    ]

    try:
        page.evaluate(
            """({ dateValue, selectors }) => {
                const seen = new Set();
                const fillInput = (input) => {
                    if (!input || input.disabled || input.readOnly) return;
                    if (seen.has(input)) return;
                    seen.add(input);
                    input.focus();
                    input.value = dateValue;
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    input.dispatchEvent(new Event("blur", { bubbles: true }));
                };

                for (const selector of selectors) {
                    document.querySelectorAll(selector).forEach(fillInput);
                }
            }""",
            {"dateValue": purchase_date, "selectors": selectors},
        )
    except Exception:
        for selector in selectors:
            set_field_value(page, [selector], purchase_date)


def fill_accounting_description(page, description):
    if not description:
        return

    try:
        page.evaluate(
            """(description) => {
                const headers = Array.from(document.querySelectorAll("th, div, span"))
                    .filter((node) => (node.textContent || "").trim() === "Selite");
                for (const header of headers) {
                    const section = header.closest("table, form, section, div");
                    const fields = Array.from(section?.querySelectorAll("textarea, input:not([type='hidden'])") || []);
                    for (const field of fields) {
                        const rect = field.getBoundingClientRect();
                        const value = field.value || "";
                        if (rect.width < 120 || rect.height < 20) continue;
                        if (value && !/receipt date|cashier|card payment|visa|mastercard/i.test(value)) continue;
                        field.focus();
                        field.value = description;
                        field.dispatchEvent(new Event("input", { bubbles: true }));
                        field.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }
            }""",
            description,
        )
    except Exception:
        pass


def categorize_error(error):
    message = str(error).lower()

    if "openai" in message or "json" in message or "recognition" in message:
        return "OpenAI recognition failed"
    if "timeout" in message or "purchaseinvoice" in message:
        return "Fennoa UI changed or did not load"
    if "subscription" in message or "tilaus" in message or "quota" in message:
        return "subscription inactive or usage limit reached"
    if "unsupported" in message:
        return "file unsupported"
    if "file too large" in message:
        return "receipt image too large"
    return "processing failed"


def safe_error_detail(error):
    message = str(error).replace("\n", " ").strip()
    if not message:
        return type(error).__name__
    return message[:300]


def find_receipts(receipts_dir):
    return [
        file
        for file in receipts_dir.iterdir()
        if file.is_file()
        and not file.name.startswith(".")
        and file.suffix.lower() in ALLOWED_EXTENSIONS
    ]


def upload_all_receipts(page, receipts_dir=None):
    if receipts_dir is None:
        ensure_ai_acknowledgement()
        receipts_dir = get_receipts_dir()

    print(f"Kuittikansio: {receipts_dir}")

    receipts = find_receipts(receipts_dir)

    if not receipts:
        raise RuntimeError(
            "Valitusta kuittikansiosta ei löytynyt PDF-, JPG-, JPEG- tai PNG-kuitteja. "
            "Lisää kuitit kansioon tai valitse toinen kuittikansio."
        )

    confirm_receipt_processing_start(page)

    print()
    print("=" * 60)
    print("Kuittien käsittely alkaa")
    print("=" * 60)
    print("Seuraavaksi CheckApp käyttää valittua kuittikansiota tai kysyy uuden kansion polun.")
    print(f"Kuittikansio: {receipts_dir}")

    print(f"Löytyi kuittitiedostoja: {len(receipts)}")

    open_purchases(page)

    processed_count = 0
    failed_count = 0

    for index, receipt in enumerate(receipts, start=1):

        print()
        print("=" * 60)
        print(f"Processing receipt {index}/{len(receipts)}")
        print("=" * 60)

        try:

            print("Recognition started.")
            data = parse_receipt(receipt)
            data = sanitize_receipt_data(data)
            print("Recognition completed.")

            open_new_receipt(page)

            page.locator(
                'input[type="file"]'
            ).set_input_files(str(receipt))

            print("✅ Kuitti ladattu Fennoaan.")

            page.wait_for_selector(
                "#PurchaseInvoiceSupplierName",
                timeout=60000
            )

            data["country"] = normalize_country(data.get("country"))

            # Normalize Finnish VAT ID to Y-tunnus when possible.
            if (
                data.get("country") == "Finland"
                and
                not data.get("business_id")
                and data.get("vat_number")
            ):
                business_id = vat_to_business_id(
                    data["vat_number"]
                )

                if business_id:
                    data["business_id"] = business_id
                    print("Business identifier normalized.")

            # Supplier
            if data.get("supplier_name"):
                page.locator(
                    "#PurchaseInvoiceSupplierName"
                ).fill(data["supplier_name"])

            # Country
            if data.get("country") and data["country"] != "Finland":
                select_country(page, data["country"])

            # VAT
            if data.get("vat_number"):
                page.locator(
                    "#PurchaseInvoiceSupplierVatNumber"
                ).fill(data["vat_number"])

            # Business ID
            if data.get("country") == "Finland" and data.get("business_id"):
                page.locator(
                    "#PurchaseInvoiceSupplierBusinessId"
                ).fill(data["business_id"])

            # Invoice number
            if data.get("invoice_number"):
                page.locator(
                    "#PurchaseInvoiceInvoiceNumber"
                ).fill(data["invoice_number"])

            # Note
            description = expense_description(data)

            page.locator(
                "#PurchaseInvoiceNote"
            ).fill(description)

            # Dates
            purchase_date = normalize_finnish_date(data.get("invoice_date")) or normalize_finnish_date(data.get("entry_date"))
            set_dates(page, purchase_date)

            # Totals
            if data.get("total_net"):
                page.locator(
                    "#PurchaseInvoiceTotalNet"
                ).fill(str(data["total_net"]))

            if data.get("total_gross"):
                page.locator(
                    "#PurchaseInvoiceTotalGross"
                ).fill(str(data["total_gross"]))

            # Currency
            if (
                data.get("currency")
                and data["currency"] != "EUR"
            ):
                select_currency(page, data["currency"])

            print("Fennoa fields filled.")

            fill_accounting_description(page, description)

            page.wait_for_timeout(1000)

            page.get_by_role(
                "link",
                name=" Tallenna"
            ).click()

            page.wait_for_timeout(3000)

            print(
                "CheckApp tallensi kuitin perustiedot Fennoaan. "
                "Täydennä Fennoassa tarvittavat vientirivit ja tallenna tosite."
            )
            receipt_confirmed = wait_for_user_receipt_confirmation()
            if not receipt_confirmed:
                print(
                    "Automaattinen käsittely keskeytettiin nykyisen kuitin kohdalla. "
                    "Tee tarvittavat korjaukset ja tallenna kuitti Fennoassa."
                )
                wait_for_manual_receipt_completion(page)

            move(
                str(receipt),
                str(PROCESSED_DIR / receipt.name)
            )

            try:
                usage = record_receipt_usage(1)
                print(
                    "CheckApp: "
                    f"{usage.get('receiptsUsed')} / {usage.get('quota')} "
                    "kuittia käytetty tässä kuussa."
                )
            except Exception as usage_error:
                print("⚠️ CheckApp-käyttömäärän päivitys epäonnistui.")

            processed_count += 1
            print("✅ Receipt confirmed and moved to processed.")

        except Exception as e:

            print()
            print(f"❌ Receipt failed: {categorize_error(e)}")
            print(f"Technical reason: {safe_error_detail(e)}")

            try:
                move(
                    str(receipt),
                    str(FAILED_DIR / receipt.name)
                )
            except Exception:
                pass

            failed_count += 1
            continue

    print()
    print("=" * 60)
    print("Processing summary")
    print(f"Successful: {processed_count}")
    print(f"Failed: {failed_count}")
    print("Successful files were moved to processed. Failed files were moved to failed.")
    print(
        "Review saved data in Fennoa before using it for bookkeeping, taxes or "
        "payments."
    )
    print("=" * 60)
