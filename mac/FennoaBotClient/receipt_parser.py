import base64
import io
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

import requests

from check_auth import get_check_session
from config import CHECK_API_URL


MAX_IMAGE_SIDE = 1800
JPEG_QUALITY = 78


def image_to_jpeg_bytes(image: Image.Image) -> bytes:
    """Converts an image into compressed JPEG bytes for recognition."""
    image = image.convert("RGB")
    image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue()


def pdf_to_jpeg_bytes(pdf_path: Path) -> bytes:
    """Converts the first PDF page into compressed JPEG bytes."""
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    image = Image.open(io.BytesIO(pix.tobytes("png")))
    jpeg = image_to_jpeg_bytes(image)
    doc.close()
    return jpeg


def image_to_bytes(path: Path) -> bytes:
    """Opens an image and converts it into compressed JPEG bytes."""
    with Image.open(path) as img:
        return image_to_jpeg_bytes(img)


def encode_image(data: bytes) -> str:
    """Encodes image bytes as Base64."""
    return base64.b64encode(data).decode("utf-8")


def response_error(response, fallback):
    try:
        payload = response.json()
        message = payload.get("error")
        if message:
            return str(message)
    except Exception:
        pass
    return fallback


def parse_receipt(receipt_path):
    """
    Recognizes a receipt through the CheckApp backend proxy.
    """

    receipt_path = Path(receipt_path)

    if receipt_path.suffix.lower() == ".pdf":
        image_bytes = pdf_to_jpeg_bytes(receipt_path)
    else:
        image_bytes = image_to_bytes(receipt_path)

    image_b64 = encode_image(image_bytes)

    session = get_check_session()

    response = requests.post(
        f"{CHECK_API_URL}/api/recognize-receipt",
        headers={"Authorization": f"Bearer {session['accessToken']}"},
        json={
            "imageBase64": image_b64,
            "mimeType": "image/jpeg",
        },
        timeout=35,
    )

    if response.status_code == 401:
        raise RuntimeError("authentication required")
    if response.status_code == 403:
        raise RuntimeError(response_error(response, "subscription inactive"))
    if response.status_code == 413:
        raise RuntimeError("file too large after image compression")
    if response.status_code == 415:
        raise RuntimeError(response_error(response, "unsupported file"))
    if response.status_code == 429:
        raise RuntimeError("service temporarily unavailable")
    if not response.ok:
        raise RuntimeError(response_error(response, "recognition failed"))

    try:
        payload = response.json()
    except Exception:
        raise RuntimeError("recognition response was not valid JSON")

    data = payload.get("data") or {}

    if not isinstance(data, dict):
        raise RuntimeError("recognition response data was invalid")

    if (
        (not data.get("total_net") or data.get("total_net") == 0)
        and data.get("total_gross")
        and data.get("vat_amount")
    ):
        data["total_net"] = round(
            float(data["total_gross"]) - float(data["vat_amount"]),
            2,
        )

    return data
