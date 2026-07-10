import json
from pathlib import Path

from check_setup_window import run_receipt_setup_window


SETTINGS_FILE = Path.home() / ".check_fennoa_client_settings.json"
AI_ACKNOWLEDGEMENT_KEY = "ai_receipt_processing_acknowledged"


def _load_settings():
    if not SETTINGS_FILE.exists():
        return {}

    try:
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_settings(settings):
    SETTINGS_FILE.write_text(json.dumps(settings, indent=2), encoding="utf-8")


def _valid_saved_receipts_dir(settings):
    saved_path = settings.get("receipts_dir")
    if not saved_path:
        return None

    receipts_dir = Path(saved_path).expanduser()
    if receipts_dir.exists() and receipts_dir.is_dir():
        return receipts_dir

    return None


def ensure_receipt_setup():
    settings = _load_settings()
    receipts_dir = _valid_saved_receipts_dir(settings)
    acknowledged = settings.get(AI_ACKNOWLEDGEMENT_KEY) is True

    selected_path, accepted = run_receipt_setup_window(
        str(receipts_dir) if receipts_dir else "",
        acknowledged,
    )

    if not accepted:
        raise RuntimeError("Kuitin käsittely peruttiin: hyväksyntää ei annettu.")

    receipts_dir = Path(selected_path).expanduser()
    if not receipts_dir.exists() or not receipts_dir.is_dir():
        raise RuntimeError("Valittua kuittikansiota ei löydy.")

    settings["receipts_dir"] = str(receipts_dir)
    settings[AI_ACKNOWLEDGEMENT_KEY] = True
    _save_settings(settings)
    return receipts_dir


def get_receipts_dir():
    return ensure_receipt_setup()


def reset_receipts_dir():
    settings = _load_settings()
    settings.pop("receipts_dir", None)
    _save_settings(settings)
    print("Kuittikansion valinta poistettu.")


def ensure_ai_acknowledgement():
    ensure_receipt_setup()
