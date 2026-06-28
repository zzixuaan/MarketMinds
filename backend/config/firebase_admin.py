from pathlib import Path
import os

import firebase_admin
from firebase_admin import credentials, firestore, auth

credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if credential_path:
    service_account_path = Path(credential_path)
else:
    BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
    SERVICE_ACCOUNT_PATH = BACKEND_DIRECTORY / "serviceAccountKey.json"


if not SERVICE_ACCOUNT_PATH.exists():
    raise FileNotFoundError(
        f"Firebase service account file not found at "
        f"{SERVICE_ACCOUNT_PATH}"
    )


if not firebase_admin._apps:
    firebase_credential = credentials.Certificate(
        str(SERVICE_ACCOUNT_PATH)
    )

    firebase_admin.initialize_app(firebase_credential)


db = firestore.client()

def verify_token(id_token : str):
    decoded = auth.verify_id_token(id_token)
    return decoded


print("firebase_admin.py loaded")
print("verify_token exists:", callable(verify_token))