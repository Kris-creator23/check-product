from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv("env")

BASE_DIR = Path(__file__).parent
USER_DATA_DIR = Path.home() / "Documents" / "CheckApp"

PROCESSED_DIR = USER_DATA_DIR / "processed"
FAILED_DIR = USER_DATA_DIR / "failed"

CHECK_API_URL = os.getenv("CHECK_API_URL", "https://checkapp.fi").rstrip("/")


USER_DATA_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)
FAILED_DIR.mkdir(exist_ok=True)
