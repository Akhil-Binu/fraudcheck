"""FraudCheck — FastAPI backend for document fraud analysis.

Exposes a single ``POST /api/analyze`` endpoint that accepts a PDF or
image upload, runs metadata extraction, Error Level Analysis, text
extraction with identifier scanning, and financial-identifier validation,
then returns a unified JSON response with an overall risk score.
"""

from __future__ import annotations

import logging
import os
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from analyzers.ela import analyze_ela
from analyzers.metadata import analyze_image_metadata, analyze_pdf_metadata
from analyzers.text_extractor import extract_and_scan
from analyzers.validator import validate
from models import (
    AnalysisResponse,
    ELAResult,
    MetadataResult,
    ValidationResult,
)

# ── Logging setup ───────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI application ─────────────────────────────────────────────────
app = FastAPI(
    title="FraudCheck API",
    description="Automated document fraud detection via metadata, ELA, and identifier analysis.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Allowed MIME / extension sets ───────────────────────────────────────
PDF_EXTENSIONS = {".pdf"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"}
ALLOWED_EXTENSIONS = PDF_EXTENSIONS | IMAGE_EXTENSIONS
SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"


def _classify_file(filename: str) -> str:
    """Return ``"pdf"`` or ``"image"`` based on the file extension.

    Raises:
        HTTPException: If the extension is not supported.
    """
    ext = Path(filename).suffix.lower()
    if ext in PDF_EXTENSIONS:
        return "pdf"
    if ext in IMAGE_EXTENSIONS:
        return "image"
    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type '{ext}'. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
    )


# ── Risk-score helpers ──────────────────────────────────────────────────

_RISK_LEVEL_WEIGHTS = {"low": 0.0, "medium": 0.5, "high": 1.0}

METADATA_MAX_POINTS = 30
ELA_MAX_POINTS = 40
VALIDATION_MAX_POINTS = 30


def _metadata_score(result: MetadataResult) -> float:
    """Convert metadata risk into a 0–30 numeric score."""
    weight = _RISK_LEVEL_WEIGHTS.get(result.risk_level, 0.0)
    return round(METADATA_MAX_POINTS * weight, 2)


def _ela_score(result: ELAResult) -> float:
    """Convert ELA risk into a 0–40 numeric score."""
    weight = _RISK_LEVEL_WEIGHTS.get(result.risk_level, 0.0)
    return round(ELA_MAX_POINTS * weight, 2)


def _validation_score(result: ValidationResult) -> float:
    """Convert validation risk into a 0–30 numeric score."""
    weight = _RISK_LEVEL_WEIGHTS.get(result.risk_level, 0.0)
    return round(VALIDATION_MAX_POINTS * weight, 2)


def _overall_risk_level(score: float) -> str:
    """Map a 0–100 score to a risk-level label."""
    if score <= 25:
        return "low"
    if score <= 50:
        return "medium"
    if score <= 75:
        return "high"
    return "critical"


def _run_analysis(file_path: str, filename: str) -> AnalysisResponse:
    """Core analysis logic executed for both uploads and demo samples."""
    file_type = _classify_file(filename)

    # 1. Metadata
    if file_type == "pdf":
        metadata_result = analyze_pdf_metadata(file_path)
    else:
        metadata_result = analyze_image_metadata(file_path)

    # 2. Error Level Analysis
    ela_result = analyze_ela(file_path, file_type)

    # 3. Text extraction + scanning
    text_result, scan_hits = extract_and_scan(file_path, file_type)

    # 4. Validate each scanned identifier
    matches = [
        validate(hit.identifier_type, hit.value)
        for hit in scan_hits
        if hit.identifier_type != "AMOUNT"
    ]

    invalid_count = sum(1 for m in matches if not m.valid)
    if invalid_count == 0:
        val_risk = "low"
    elif invalid_count <= 2:
        val_risk = "medium"
    else:
        val_risk = "high"

    val_flags = [f"Invalid {m.type}: {m.value} ({m.details})" for m in matches if not m.valid]
    validation_result = ValidationResult(
        matches=matches,
        identifiers=matches,
        risk_level=val_risk,
        suspicious_flags=val_flags,
    )

    # 5. Aggregate all suspicious flags across modules
    all_flags = list(metadata_result.suspicious_flags) + list(ela_result.suspicious_flags) + val_flags

    # 6. Overall risk score
    total_score = (
        _metadata_score(metadata_result)
        + _ela_score(ela_result)
        + _validation_score(validation_result)
    )

    # Forensic override: if critical anomalies (font injection, backdating > 1yr, or invalid banking) are detected
    if any("critical" in f.lower() or "injection" in f.lower() for f in all_flags):
        total_score = max(total_score, 80.0)
    elif len(all_flags) >= 3:
        total_score = max(total_score, 65.0)
    elif len(all_flags) >= 1:
        total_score = max(total_score, 40.0)

    total_score = min(total_score, 100.0)

    return AnalysisResponse(
        filename=filename,
        file_type=file_type,
        metadata=metadata_result,
        ela=ela_result,
        validation=validation_result,
        text=text_result,
        overall_risk_score=total_score,
        overall_risk_level=_overall_risk_level(total_score),
        suspicious_flags=all_flags,
    )


# ── Routes ──────────────────────────────────────────────────────────────


@app.get("/health")
@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Return service health status."""
    return {"status": "healthy"}


@app.get("/api/samples")
async def list_samples() -> list[dict[str, str]]:
    """List preloaded demonstration samples."""
    return [
        {
            "id": "legitimate_invoice.pdf",
            "name": "Authentic Business Invoice",
            "type": "pdf",
            "badge": "Clean / Legitimate",
            "description": "Standard invoice generated with accounting software. Genuine IBAN and metadata consistency."
        },
        {
            "id": "tampered_invoice.pdf",
            "name": "Spoofed Wire Invoice",
            "type": "pdf",
            "badge": "Tampered (Photoshop + Fake IBAN)",
            "description": "Invoice modified with Adobe Photoshop with altered wire payment details and checksum failure."
        },
        {
            "id": "bfl_tampered_invoice.pdf",
            "name": "BFL Invoice (Font Spliced)",
            "type": "pdf",
            "badge": "Tampered (Font Subset + Backdated)",
            "description": "Real-world invoice with spliced text, conflicting subset font injection, and 5-year timeline gap."
        },
        {
            "id": "spliced_invoice.jpg",
            "name": "Scanned Document Splice",
            "type": "image",
            "badge": "Image Forensics",
            "description": "Scanned invoice with newly spliced high-quality text overlay over the account fields."
        }
    ]


@app.post("/api/analyze-sample/{sample_id}", response_model=AnalysisResponse)
async def analyze_sample(sample_id: str) -> AnalysisResponse:
    """Analyze one of the preloaded demo sample documents."""
    sample_file = SAMPLES_DIR / sample_id
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")
    return _run_analysis(str(sample_file), sample_id)


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_document(file: UploadFile = File(...)) -> AnalysisResponse:
    """Analyze an uploaded PDF or image for signs of fraud."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    _classify_file(file.filename)

    # Save upload to a temp file
    suffix = Path(file.filename).suffix
    tmp_dir = tempfile.mkdtemp(prefix="fraudcheck_")
    tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4().hex}{suffix}")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(tmp_path, "wb") as fp:
            fp.write(contents)

        logger.info(
            "Analyzing '%s' (%d bytes)",
            file.filename,
            len(contents),
        )

        return _run_analysis(tmp_path, file.filename)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unhandled error during analysis")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc
    finally:
        # Cleanup temp file
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            if os.path.isdir(tmp_dir):
                os.rmdir(tmp_dir)
        except OSError as cleanup_err:
            logger.warning("Temp cleanup failed: %s", cleanup_err)


# ── Serve Built Frontend (Single-Port Production Deployment) ─────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
