"""Pydantic response models for the FraudCheck API."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class MetadataResult(BaseModel):
    """Result of PDF/image metadata extraction and analysis."""

    creator: str | None = None
    producer: str | None = None
    creation_date: str | None = None
    modification_date: str | None = None
    page_count: int = 0
    file_size_bytes: int = 0
    file_size: str = ""
    suspicious_flags: list[str] = Field(default_factory=list)
    risk_level: str = "low"


class ELAResult(BaseModel):
    """Result of Error Level Analysis on a document or image."""

    ela_image_base64: str = ""
    heatmap_base64: str = ""  # Backward-compatible alias
    max_difference: float = 0.0
    mean_difference: float = 0.0
    suspicious_regions: int = 0
    risk_level: str = "low"
    suspicious_flags: list[str] = Field(default_factory=list)


class FormatMatch(BaseModel):
    """A single detected and validated financial identifier."""

    type: str
    value: str
    valid: bool
    is_valid: bool = False  # Backward-compatible alias
    details: str
    reason: str = ""  # Backward-compatible alias


class ValidationResult(BaseModel):
    """Aggregated validation result for all detected financial identifiers."""

    matches: list[FormatMatch] = Field(default_factory=list)
    identifiers: list[FormatMatch] = Field(default_factory=list)  # Alias
    risk_level: str = "low"
    suspicious_flags: list[str] = Field(default_factory=list)


class TextPage(BaseModel):
    """A single page's text."""
    page: int
    text: str


class TextExtractionResult(BaseModel):
    """Extracted text content from a document."""

    full_text: str = ""
    text: str = ""  # Alias
    page_texts: list[str] = Field(default_factory=list)
    pages: list[TextPage] = Field(default_factory=list)  # Alias


class AnalysisResponse(BaseModel):
    """Complete analysis response combining all analyzer outputs."""

    filename: str
    file_type: str
    metadata: MetadataResult
    ela: ELAResult
    validation: ValidationResult
    text: TextExtractionResult
    overall_risk_score: float = Field(ge=0, le=100)
    overall_risk_level: str
    suspicious_flags: list[str] = Field(default_factory=list)
