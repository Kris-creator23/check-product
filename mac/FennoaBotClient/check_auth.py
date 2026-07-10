import json
from pathlib import Path

import requests

from check_login_window import run_check_login_window
from config import CHECK_API_URL


SESSION_FILE = Path.home() / ".check_fennoa_client_session.json"


def _headers(access_token):
    return {"Authorization": f"Bearer {access_token}"}


def _save_session(session):
    SESSION_FILE.write_text(json.dumps(session), encoding="utf-8")


def _load_session():
    if not SESSION_FILE.exists():
        return None

    try:
        return json.loads(SESSION_FILE.read_text(encoding="utf-8"))
    except Exception:
        return None


def _error_message(response):
    try:
        payload = response.json()
        message = payload.get("error")
        if message:
            if str(message).lower() == "signups not allowed for otp":
                return (
                    "Sähköpostilla ei löytynyt aktiivista CheckApp-tiliä. "
                    "Rekisteröidy tai aloita kokeilu ensin osoitteessa https://checkapp.fi."
                )
            return message
    except Exception:
        pass

    if response.status_code == 400:
        return (
            "Kirjautumiskoodia ei voitu lähettää. Tarkista, että sähköpostilla "
            "on CheckApp-tili ja aktiivinen kokeilu tai tilaus osoitteessa https://checkapp.fi."
        )
    if response.status_code == 401:
        return "Kirjautuminen epäonnistui. Tarkista sähköpostiin lähetetty koodi."
    if response.status_code >= 500:
        return "CheckApp-palvelu ei vastaa juuri nyt. Yritä hetken kuluttua uudelleen."

    return f"CheckApp-palvelu palautti virheen {response.status_code}."


def _request_code():
    def handle_login_action(action):
        action_type = action.get("type")
        email = (action.get("email") or "").strip().lower()

        if action_type == "send-code":
            response = requests.post(
                f"{CHECK_API_URL}/api/app/send-code",
                json={"email": email},
                timeout=30,
            )
            if not response.ok:
                return False, _error_message(response)
            return True, None

        if action_type == "verify-code":
            response = requests.post(
                f"{CHECK_API_URL}/api/app/verify-code",
                json={"email": email, "code": (action.get("code") or "").strip()},
                timeout=30,
            )
        elif action_type == "password-login":
            response = requests.post(
                f"{CHECK_API_URL}/api/app/password-login",
                json={"email": email, "password": action.get("password") or ""},
                timeout=30,
            )
        else:
            return False, "Tuntematon kirjautumistapa."

        if not response.ok:
            return False, _error_message(response)

        session = response.json()
        _save_session(session)
        return True, session

    return run_check_login_window(
        handle_login_action,
        "CheckApp-kirjautuminen epäonnistui. Yritä uudelleen.",
    )


def get_check_session():
    session = _load_session()
    if session and session.get("accessToken"):
        return session

    return _request_code()


def get_license():
    session = get_check_session()

    response = requests.get(
        f"{CHECK_API_URL}/api/license",
        headers=_headers(session["accessToken"]),
        timeout=30,
    )

    if response.status_code == 401:
        if SESSION_FILE.exists():
            SESSION_FILE.unlink()
        session = _request_code()
        response = requests.get(
            f"{CHECK_API_URL}/api/license",
            headers=_headers(session["accessToken"]),
            timeout=30,
        )

    if not response.ok:
        raise RuntimeError(_error_message(response))
    return response.json()


def require_active_subscription():
    license_info = get_license()

    if not license_info.get("active"):
        reason = license_info.get("reason") or "inactive_subscription"
        if reason == "no_profile":
            raise RuntimeError(
                "CheckApp-tililtä ei löytynyt aktiivista kokeilua tai tilausta. "
                "Kirjaudu osoitteessa https://checkapp.fi ja aloita kokeilu tai valitse tilaus."
            )
        if reason == "quota_exceeded":
            raise RuntimeError(
                "Kuukausittainen kuittikiintiö on täynnä. Vaihda suurempaan pakettiin tai odota seuraavaa laskutuskautta."
            )
        raise RuntimeError(
            "CheckApp-tilaus ei ole aktiivinen. Kirjaudu osoitteessa https://checkapp.fi ja tarkista tilauksesi."
        )

    receipts_used = license_info.get("receiptsUsed") or 0
    quota = license_info.get("quota") or 0
    receipts_remaining = license_info.get("receiptsRemaining")
    if receipts_remaining is None:
        receipts_remaining = max(0, quota - receipts_used)

    print()
    print("=" * 60)
    print("CheckApp-tilaus aktiivinen")
    print(f"Paketti: {license_info.get('plan')}")
    print(f"Kuitteja jäljellä: {receipts_remaining} / {quota}")
    print("=" * 60)

    return license_info


def record_receipt_usage(count=1):
    session = get_check_session()
    response = requests.post(
        f"{CHECK_API_URL}/api/usage",
        headers=_headers(session["accessToken"]),
        json={"count": count},
        timeout=30,
    )
    if not response.ok:
        raise RuntimeError(_error_message(response))
    return response.json()
