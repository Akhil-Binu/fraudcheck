"""PDF and image metadata extraction and suspicious-pattern detection.

Extracts metadata from PDFs (via PyMuPDF) and images (via Pillow EXIF),
then flags suspicious patterns such as editing-tool fingerprints, date
mismatches, and stripped metadata.
"""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime, timedelta
from pathlib import Path

import pymupdf as fitz
from PIL import Image
from PIL.ExifTags import TAGS

from models import MetadataResult

logger = logging.getLogger(__name__)

# Known editing-tool keywords that raise suspicion when found in
# Creator / Producer metadata fields.
SUSPICIOUS_TOOLS: list[str] = [
    "photoshop",
    "gimp",
    "nitro",
    "foxit",
    "inkscape",
    "affinity",
    "illustrator",
    "corel",
    "paint.net",
    "pixlr",
    "canva",
    "acrobat pro",
]

# Legitimate PDF producer/creator combos — a mismatch between these
# categories hints at post-creation editing.
OFFICE_CREATORS: list[str] = ["microsoft", "word", "excel", "libreoffice", "openoffice", "google"]
PDF_EDITOR_PRODUCERS: list[str] = ["nitro", "foxit", "phantompdf", "pdf-xchange", "smallpdf", "ilovepdf"]


def _parse_pdf_date(raw: str | None) -> datetime | None:
    """Parse a PDF date string like ``D:20230415120000+05'30'`` into a datetime.

    Returns ``None`` when the string is missing or unparseable.
    """
    if not raw:
        return None
    # Strip the ``D:`` prefix that PDF dates commonly use.
    cleaned = raw.strip()
    if cleaned.startswith("D:"):
        cleaned = cleaned[2:]
    # Remove timezone offset characters that Python < 3.12 can't parse directly.
    cleaned = cleaned.replace("'", "").replace("Z", "+0000")
    for fmt in (
        "%Y%m%d%H%M%S%z",
        "%Y%m%d%H%M%S",
        "%Y%m%d%H%M",
        "%Y%m%d",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
    ):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    logger.debug("Unable to parse PDF date: %s", raw)
    return None


def _check_suspicious_tool(value: str | None, flags: list[str]) -> None:
    """Append a flag when *value* contains a known editing-tool name."""
    if not value:
        return
    lower = value.lower()
    for tool in SUSPICIOUS_TOOLS:
        if tool in lower:
            flags.append(f"Modified with {tool.title()}")
            break


def _check_date_mismatch(
    creation_raw: str | None,
    modification_raw: str | None,
    flags: list[str],
) -> None:
    """Flag when creation and modification dates differ significantly."""
    cdate = _parse_pdf_date(creation_raw)
    mdate = _parse_pdf_date(modification_raw)
    if cdate and mdate:
        delta = abs(mdate - cdate)
        if delta > timedelta(hours=1):
            flags.append("Creation date != Modification date")


def _check_producer_creator_mismatch(
    creator: str | None,
    producer: str | None,
    flags: list[str],
) -> None:
    """Flag when a document was created by an office suite but produced by a PDF editor."""
    if not creator or not producer:
        return
    creator_lower = creator.lower()
    producer_lower = producer.lower()
    is_office_creator = any(k in creator_lower for k in OFFICE_CREATORS)
    is_editor_producer = any(k in producer_lower for k in PDF_EDITOR_PRODUCERS)
    if is_office_creator and is_editor_producer:
        flags.append(f"Producer/Creator mismatch (created by '{creator}', produced by '{producer}')")


def _format_size(size_bytes: int) -> str:
    val = float(size_bytes)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if val < 1024:
            return f"{val:.1f} {unit}" if unit != 'B' else f"{int(val)} B"
        val /= 1024
    return f"{val:.1f} TB"


def _risk_from_flags(flags: list[str]) -> str:
    """Map the number and severity of suspicious flags to a risk level string."""
    if not flags:
        return "low"
    if any("critical" in f.lower() or "injection" in f.lower() for f in flags) or len(flags) >= 2:
        return "high"
    return "medium"


# ── Public API ──────────────────────────────────────────────────────────


def analyze_pdf_metadata(file_path: str) -> MetadataResult:
    """Extract and analyze metadata from a PDF file.

    Args:
        file_path: Absolute path to the PDF on disk.

    Returns:
        A populated ``MetadataResult``.
    """
    flags: list[str] = []
    file_size = os.path.getsize(file_path)

    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        logger.error("Failed to open PDF %s: %s", file_path, exc)
        flags.append("Failed to open PDF — file may be corrupted")
        return MetadataResult(
            file_size_bytes=file_size,
            file_size=_format_size(file_size),
            suspicious_flags=flags,
            risk_level="high",
        )

    if doc.is_encrypted:
        flags.append("PDF is encrypted or password-protected")
        doc.close()
        return MetadataResult(
            file_size_bytes=file_size,
            file_size=_format_size(file_size),
            suspicious_flags=flags,
            risk_level="medium",
        )

    meta = doc.metadata or {}
    creator = meta.get("creator") or None
    producer = meta.get("producer") or None
    creation_date = meta.get("creationDate") or None
    modification_date = meta.get("modDate") or None
    page_count = doc.page_count

    # 1. Standard tool and mismatch checks
    _check_suspicious_tool(creator, flags)
    _check_suspicious_tool(producer, flags)
    _check_date_mismatch(creation_date, modification_date, flags)
    _check_producer_creator_mismatch(creator, producer, flags)

    # 2. Asymmetric metadata (modDate present but creationDate stripped)
    if modification_date and not creation_date:
        flags.append(
            f"Asymmetric metadata: Modification timestamp present ({modification_date[:16]}) "
            "but creation date is stripped/missing (indicates PDF editor re-save)"
        )

    # 3. Stripped creator with generic producer library
    if not creator and producer and producer.strip():
        flags.append(
            f"Stripped application metadata: Creator is empty while modified by engine '{producer.strip()}'"
        )

    # 4. Font subset injection analysis (detects spliced text)
    subset_fonts = []
    non_subset_fonts = []
    for pno, page in enumerate(doc):
        for f in page.get_fonts(full=True):
            fname = f[3]
            if "+" in fname:
                subset_fonts.append((pno + 1, fname))
            else:
                non_subset_fonts.append((pno + 1, fname))

    non_subset_names = {fn[1] for fn in non_subset_fonts}
    for pno, s_fn in subset_fonts:
        base_name = s_fn.split("+")[1]
        if base_name in non_subset_names:
            flags.append(
                f"Font injection detected on Page {pno}: Injected font subset '{s_fn}' "
                f"coexists with base document font '{base_name}' (tampered text insertion)"
            )

    # 5. Timeline anomaly: Invoice Date printed in document text vs PDF modification timestamp
    try:
        full_text = "\n".join(page.get_text() for page in doc)
        if modification_date:
            mod_clean = modification_date.replace("D:", "")[:8]
            mod_dt = datetime.strptime(mod_clean, "%Y%m%d")
            date_patterns = [
                r"Invoice\s*Date\s*:\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})",
                r"Date\s*:\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})",
                r"\b([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})\b",
            ]
            for pat in date_patterns:
                m = re.search(pat, full_text, re.IGNORECASE)
                if m:
                    d_str = m.group(1)
                    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%y", "%d/%m/%y"):
                        try:
                            doc_dt = datetime.strptime(d_str, fmt)
                            if doc_dt.year < 100:
                                doc_dt = doc_dt.replace(year=doc_dt.year + 2000)
                            diff_days = (mod_dt - doc_dt).days
                            if diff_days > 365:
                                years = round(diff_days / 365.25, 1)
                                flags.append(
                                    f"Critical timeline mismatch: Document invoice date is {d_str}, "
                                    f"but PDF was modified on {mod_dt.strftime('%Y-%m-%d')} "
                                    f"({diff_days} days / ~{years} years later — retroactive tampering / backdating)"
                                )
                                break
                            elif diff_days > 30:
                                flags.append(
                                    f"Timeline anomaly: Document invoice date is {d_str}, "
                                    f"but PDF was modified on {mod_dt.strftime('%Y-%m-%d')} ({diff_days} days later)"
                                )
                                break
                        except ValueError:
                            pass
                    if any("timeline" in f.lower() for f in flags):
                        break
    except Exception as ex:
        logger.debug("Date parse error: %s", ex)

    doc.close()

    if not meta or all(v in (None, "") for v in meta.values()):
        flags.append("Missing or stripped metadata")

    return MetadataResult(
        creator=creator,
        producer=producer,
        creation_date=creation_date,
        modification_date=modification_date,
        page_count=page_count,
        file_size_bytes=file_size,
        file_size=_format_size(file_size),
        suspicious_flags=flags,
        risk_level=_risk_from_flags(flags),
    )


def analyze_image_metadata(file_path: str) -> MetadataResult:
    """Extract and analyze metadata (EXIF) from an image file.

    Args:
        file_path: Absolute path to the image on disk.

    Returns:
        A populated ``MetadataResult``.
    """
    flags: list[str] = []
    file_size = os.path.getsize(file_path)

    try:
        img = Image.open(file_path)
    except Exception as exc:
        logger.error("Failed to open image %s: %s", file_path, exc)
        flags.append("Failed to open image — file may be corrupted")
        return MetadataResult(
            file_size_bytes=file_size,
            suspicious_flags=flags,
            risk_level="high",
        )

    exif_data = img.getexif()
    img.close()

    if not exif_data:
        flags.append("Missing or stripped metadata")
        return MetadataResult(
            page_count=1,
            file_size_bytes=file_size,
            file_size=_format_size(file_size),
            suspicious_flags=flags,
            risk_level=_risk_from_flags(flags),
        )

    # Build a human-readable tag dict from the raw EXIF.
    decoded: dict[str, str] = {}
    for tag_id, value in exif_data.items():
        tag_name = TAGS.get(tag_id, str(tag_id))
        decoded[tag_name] = str(value)

    creator = decoded.get("Software") or decoded.get("Artist")
    creation_date = decoded.get("DateTimeOriginal") or decoded.get("DateTime")
    modification_date = decoded.get("DateTime")

    _check_suspicious_tool(creator, flags)

    if creation_date and modification_date and creation_date != modification_date:
        flags.append("Creation date != Modification date")

    return MetadataResult(
        creator=creator,
        producer=decoded.get("Software"),
        creation_date=creation_date,
        modification_date=modification_date,
        page_count=1,
        file_size_bytes=file_size,
        file_size=_format_size(file_size),
        suspicious_flags=flags,
        risk_level=_risk_from_flags(flags),
    )
