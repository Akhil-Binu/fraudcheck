"""Text extraction and regex-based financial identifier scanning.

Extracts text from PDFs (via PyMuPDF) or images (with a graceful
fallback when Tesseract is unavailable) and scans for IBANs, IFSCs,
GSTINs, PANs, UPI IDs, emails, phone numbers, and monetary amounts.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

import pymupdf as fitz

from models import TextExtractionResult, TextPage

logger = logging.getLogger(__name__)

# ── Scanning patterns ───────────────────────────────────────────────────
# Each tuple: (identifier_type, compiled regex).  The regex should be
# liberal enough to catch plausible candidates; the validator module
# handles strict checking.

_SCAN_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("IBAN", re.compile(r"\b[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}\b")),
    ("IFSC", re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")),
    ("GSTIN", re.compile(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]\b")),
    ("PAN", re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")),
    ("UPI", re.compile(r"\b[\w.\-]+@[a-z]{2,}\b")),
    ("EMAIL", re.compile(r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b")),
    ("PHONE", re.compile(r"(?<!\d)\+?[0-9]{1,4}[\s\-]?[0-9]{6,14}(?!\d)")),
    ("AMOUNT", re.compile(
        r"(?:(?:Rs\.?|INR|USD|\$|€|£|₹)\s?[0-9]{1,3}(?:[,\s]?[0-9]{3})*(?:\.[0-9]{1,2})?)"
        r"|(?:[0-9]{1,3}(?:[,\s]?[0-9]{3})*(?:\.[0-9]{1,2})?\s?(?:Rs\.?|INR|USD|EUR|GBP))"
    )),
]


@dataclass
class _ScanHit:
    """Internal representation of a regex match before validation."""

    identifier_type: str
    value: str


def _scan_text(text: str) -> list[_ScanHit]:
    """Scan *text* for all financial-identifier regex matches."""
    hits: list[_ScanHit] = []
    seen: set[tuple[str, str]] = set()

    for id_type, pattern in _SCAN_PATTERNS:
        for m in pattern.finditer(text):
            val = m.group(0).strip()
            key = (id_type, val)
            if key not in seen:
                seen.add(key)
                hits.append(_ScanHit(identifier_type=id_type, value=val))

    # Filter out spurious phone or amount matches that are substrings of IBAN/GSTIN/PAN
    strong_values = [h.value for h in hits if h.identifier_type in ("IBAN", "GSTIN", "PAN")]
    filtered: list[_ScanHit] = []
    for h in hits:
        if h.identifier_type in ("PHONE", "AMOUNT"):
            if any(h.value in sv for sv in strong_values):
                continue
        filtered.append(h)

    return filtered


# ── PDF text extraction ─────────────────────────────────────────────────


def extract_text_from_pdf(file_path: str) -> TextExtractionResult:
    """Extract text from every page of a PDF.

    Args:
        file_path: Absolute path to the PDF.

    Returns:
        A ``TextExtractionResult`` with per-page and concatenated text.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        logger.error("Failed to open PDF for text extraction: %s", exc)
        return TextExtractionResult()

    if doc.is_encrypted:
        doc.close()
        note = "[Encrypted PDF] Document is password-protected; text extraction locked."
        return TextExtractionResult(
            full_text=note,
            text=note,
            page_texts=[note],
            pages=[TextPage(page=1, text=note)],
        )

    page_texts: list[str] = []
    for page in doc:
        page_texts.append(page.get_text("text") or "")
    doc.close()

    full_text = "\n\n".join(page_texts)
    pages = [TextPage(page=i + 1, text=txt) for i, txt in enumerate(page_texts)]
    return TextExtractionResult(
        full_text=full_text,
        text=full_text,
        page_texts=page_texts,
        pages=pages,
    )


# ── Image text extraction ───────────────────────────────────────────────


def extract_text_from_image(file_path: str) -> TextExtractionResult:
    """Attempt text extraction from an image.

    If Tesseract (pytesseract) is installed, uses OCR.  Otherwise returns
    a friendly fallback message.
    """
    try:
        import pytesseract  # type: ignore[import-untyped]
        from PIL import Image

        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        pages = [TextPage(page=1, text=text)]
        return TextExtractionResult(
            full_text=text,
            text=text,
            page_texts=[text],
            pages=pages,
        )
    except ImportError:
        logger.info("pytesseract not installed — OCR unavailable for images")
        note = (
            "[OCR note] Direct scanned image uploaded. Install 'pytesseract' and Tesseract-OCR "
            "for deep character recognition, or inspect visual ELA heatmap for splice artifacts."
        )
        pages = [TextPage(page=1, text=note)]
        return TextExtractionResult(
            full_text=note,
            text=note,
            page_texts=[note],
            pages=pages,
        )
    except Exception as exc:
        logger.error("Image OCR failed: %s", exc)
        err = f"[OCR error] {exc}"
        return TextExtractionResult(
            full_text=err,
            text=err,
            page_texts=[err],
            pages=[TextPage(page=1, text=err)],
        )


# ── Public API ──────────────────────────────────────────────────────────


def extract_and_scan(
    file_path: str,
    file_type: str,
) -> tuple[TextExtractionResult, list[_ScanHit]]:
    """Extract text from a file and scan it for financial identifiers.

    Args:
        file_path: Absolute path to the uploaded file.
        file_type: ``"pdf"`` or ``"image"``.

    Returns:
        A ``(TextExtractionResult, list[_ScanHit])`` tuple.
    """
    if file_type == "pdf":
        text_result = extract_text_from_pdf(file_path)
    else:
        text_result = extract_text_from_image(file_path)

    hits = _scan_text(text_result.full_text)
    logger.info("Scanned text — found %d identifier hits", len(hits))
    return text_result, hits
