"""Error Level Analysis (ELA) for detecting image manipulation.

ELA works by re-saving an image at a known JPEG quality level and
measuring the pixel-level difference between the original and the
re-compressed version.  Regions that have been digitally altered
typically show higher error levels than untouched areas.
"""

from __future__ import annotations

import base64
import io
import logging
import tempfile
from pathlib import Path

try:
    import cv2
    _HAS_CV2 = True
except Exception as _cv2_err:
    _HAS_CV2 = False
    cv2 = None

import pymupdf as fitz
import numpy as np
from PIL import Image

from models import ELAResult

logger = logging.getLogger(__name__)

# ── Tunable constants ───────────────────────────────────────────────────
JPEG_QUALITY: int = 95
ELA_SCALE: int = 20  # amplification factor for the difference image
CONTOUR_AREA_THRESHOLD: int = 25  # min contour area (px²) to count as "suspicious" text/region
DIFFERENCE_THRESHOLD: int = 35  # grayscale threshold for binary mask


def _pdf_first_page_to_image(pdf_path: str, dpi: int = 200) -> Image.Image:
    """Render the first page of a PDF to a PIL ``Image``.

    Args:
        pdf_path: Path to the PDF file.
        dpi: Resolution for the rasterised output.

    Returns:
        An RGB ``Image`` of the first page.
    """
    doc = fitz.open(pdf_path)
    if doc.is_encrypted:
        doc.close()
        return Image.new("RGB", (600, 800), color=(240, 240, 240))
    page = doc[0]
    zoom = dpi / 72  # 72 is the default PDF DPI
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()
    return img


def _compute_ela(original: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    """Compute the ELA difference and scaled heatmap arrays.

    Args:
        original: The input RGB image.

    Returns:
        A tuple of ``(diff_gray, heatmap)`` where *diff_gray* is the
        single-channel absolute difference and *heatmap* is a BGR
        colour-mapped image suitable for encoding to PNG.
    """
    # Re-save at JPEG_QUALITY into an in-memory buffer.
    buffer = io.BytesIO()
    original.save(buffer, format="JPEG", quality=JPEG_QUALITY)
    buffer.seek(0)
    resaved = Image.open(buffer)

    # Pixel-level absolute difference.
    orig_arr = np.array(original, dtype=np.float64)
    resaved_arr = np.array(resaved, dtype=np.float64)
    diff = np.abs(orig_arr - resaved_arr)

    # Convert to grayscale for metrics / thresholding.
    diff_gray = np.mean(diff, axis=2)

    # Scale and clamp for visualisation.
    scaled = np.clip(diff_gray * ELA_SCALE, 0, 255).astype(np.uint8)
    if _HAS_CV2 and cv2 is not None:
        heatmap = cv2.applyColorMap(scaled, cv2.COLORMAP_JET)
    else:
        heatmap = _apply_jet_colormap(scaled)

    return diff_gray, heatmap


def _apply_jet_colormap(gray: np.ndarray) -> np.ndarray:
    """Pure NumPy JET colormap calculation (RGB)."""
    val = gray.astype(np.float64) / 255.0
    r = np.clip(1.5 - np.abs(4.0 * val - 3.0), 0.0, 1.0)
    g = np.clip(1.5 - np.abs(4.0 * val - 2.0), 0.0, 1.0)
    b = np.clip(1.5 - np.abs(4.0 * val - 1.0), 0.0, 1.0)
    return (np.stack([r, g, b], axis=-1) * 255.0).astype(np.uint8)


def _count_suspicious_regions(diff_gray: np.ndarray) -> int:
    """Threshold the difference image and count large contours."""
    binary = (diff_gray > DIFFERENCE_THRESHOLD).astype(np.uint8) * 255
    if _HAS_CV2 and cv2 is not None:
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return sum(1 for c in contours if cv2.contourArea(c) >= CONTOUR_AREA_THRESHOLD)
    else:
        return int(np.sum(diff_gray > DIFFERENCE_THRESHOLD) // (CONTOUR_AREA_THRESHOLD * 2))


def _heatmap_to_base64(heatmap: np.ndarray) -> str:
    """Encode a heatmap array as a base64 PNG string."""
    if _HAS_CV2 and cv2 is not None:
        success, encoded = cv2.imencode(".png", heatmap)
        if success:
            return base64.b64encode(encoded.tobytes()).decode("ascii")

    # Pillow fallback
    try:
        rgb_arr = heatmap[:, :, ::-1] if (_HAS_CV2 and cv2 is not None) else heatmap
        pil_img = Image.fromarray(rgb_arr)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception as exc:
        logger.error("Failed to encode ELA heatmap to PNG: %s", exc)
        return ""


def _risk_from_metrics(
    max_diff: float,
    mean_diff: float,
    suspicious_regions: int,
) -> str:
    """Derive a risk level string from ELA metrics."""
    score = 0
    if mean_diff > 1.5:
        score += 1
    if mean_diff > 15:
        score += 2
    if max_diff > 50:
        score += 1
    if max_diff > 75:
        score += 1
    if suspicious_regions >= 1:
        score += 1
    if suspicious_regions >= 5:
        score += 1

    if score <= 1:
        return "low"
    if score <= 3:
        return "medium"
    return "high"


# ── Public API ──────────────────────────────────────────────────────────


def analyze_ela(file_path: str, file_type: str) -> ELAResult:
    """Run Error Level Analysis on a file.

    Args:
        file_path: Absolute path to the uploaded file.
        file_type: ``"pdf"`` or ``"image"``.

    Returns:
        A populated ``ELAResult``.
    """
    try:
        if file_type == "pdf":
            original = _pdf_first_page_to_image(file_path)
        else:
            original = Image.open(file_path).convert("RGB")
    except Exception as exc:
        logger.error("ELA: failed to load image from %s: %s", file_path, exc)
        return ELAResult(risk_level="low")

    try:
        diff_gray, heatmap = _compute_ela(original)
    except Exception as exc:
        logger.error("ELA: computation failed for %s: %s", file_path, exc)
        return ELAResult(risk_level="low")

    max_diff = float(np.max(diff_gray))
    mean_diff = float(np.mean(diff_gray))
    suspicious_regions = _count_suspicious_regions(diff_gray)
    ela_b64 = _heatmap_to_base64(heatmap)

    risk = _risk_from_metrics(max_diff, mean_diff, suspicious_regions)

    logger.info(
        "ELA results — max=%.2f  mean=%.2f  regions=%d  risk=%s",
        max_diff,
        mean_diff,
        suspicious_regions,
        risk,
    )

    flags = []
    if suspicious_regions > 0:
        flags.append(f"{suspicious_regions} high-contrast spliced region(s) detected via ELA")
    if max_diff > 50:
        flags.append(f"Localized compression artifact disparity (max diff: {max_diff:.1f})")
    if mean_diff > 15:
        flags.append(f"Elevated compression error level across document (mean diff: {mean_diff:.1f})")

    return ELAResult(
        ela_image_base64=ela_b64,
        heatmap_base64=ela_b64,
        max_difference=round(max_diff, 2),
        mean_difference=round(mean_diff, 2),
        suspicious_regions=suspicious_regions,
        risk_level=risk,
        suspicious_flags=flags,
    )
