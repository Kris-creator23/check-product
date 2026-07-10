from getpass import getpass

import keyring


SERVICE_NAME = "Check Fennoa"
EMAIL_KEY = "fennoa_email"


def get_fennoa_credentials():
    email = keyring.get_password(SERVICE_NAME, EMAIL_KEY)

    if not email:
        print()
        print("=" * 60)
        print("Fennoa-kirjautuminen")
        print("=" * 60)
        email = input("Syötä Fennoa-sähköposti: ").strip()
        keyring.set_password(SERVICE_NAME, EMAIL_KEY, email)

    password = keyring.get_password(SERVICE_NAME, email)

    if not password:
        password = getpass("Syötä Fennoa-salasana: ")
        keyring.set_password(SERVICE_NAME, email, password)

    return email, password


def reset_fennoa_credentials():
    email = keyring.get_password(SERVICE_NAME, EMAIL_KEY)

    if email:
        try:
            keyring.delete_password(SERVICE_NAME, email)
        except keyring.errors.PasswordDeleteError:
            pass

    try:
        keyring.delete_password(SERVICE_NAME, EMAIL_KEY)
    except keyring.errors.PasswordDeleteError:
        pass

    print("Fennoa-kirjautumistiedot poistettu tältä laitteelta.")
