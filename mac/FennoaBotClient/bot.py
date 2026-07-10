import json
import subprocess

from check_auth import require_active_subscription
from client_settings import ensure_receipt_setup
from login import login
from fennoa import upload_all_receipts


def show_dialog(message, title="CheckApp"):
    message_literal = json.dumps(message)
    title_literal = json.dumps(title)
    script = (
        f'display dialog {message_literal} '
        f'buttons {{"OK"}} default button "OK" '
        f'with title {title_literal} with icon note'
    )
    try:
        subprocess.run(["osascript", "-e", script], check=False)
    except Exception:
        print(message)


def main():
    print("CheckApp käynnistyy.")
    require_active_subscription()
    receipts_dir = ensure_receipt_setup()
    page = login()
    upload_all_receipts(page, receipts_dir)
    show_dialog("Valmis. Kuittien käsittely on päättynyt.")


if __name__ == "__main__":
    try:
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
