"""Financial identifier validation helpers.

Validates IBAN, IFSC, GSTIN, PAN, UPI, email, and phone number strings
found during text extraction.
"""

from __future__ import annotations

import logging
import re

from models import FormatMatch

logger = logging.getLogger(__name__)

# ── Regex patterns ──────────────────────────────────────────────────────
IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$")
UPI_RE = re.compile(r"^[\w.\-]+@[\w]+$")
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9]{1,4}[\s\-]?[0-9]{6,14}$")
IBAN_RE = re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$")


# ── IBAN validation (ISO 13616 MOD 97) ──────────────────────────────────


def _validate_iban(value: str) -> tuple[bool, str]:
    """Validate an IBAN using MOD-97 checksum (ISO 13616).

    Steps:
    1. Move the first four characters to the end.
    2. Replace each letter with two digits (A=10 … Z=35).
    3. The resulting number mod 97 must equal 1.
    """
    cleaned = value.replace(" ", "").upper()
    if len(cleaned) < 15 or not IBAN_RE.match(cleaned):
        return False, "Invalid IBAN format"

    rearranged = cleaned[4:] + cleaned[:4]
    numeric = ""
    for ch in rearranged:
        if ch.isdigit():
            numeric += ch
        else:
            numeric += str(ord(ch) - 55)  # A→10, B→11, …

    if int(numeric) % 97 != 1:
        return False, "IBAN checksum (MOD 97) failed"
    return True, "Valid IBAN (MOD 97 checksum passed)"


# ── IFSC validation ─────────────────────────────────────────────────────


def _validate_ifsc(value: str) -> tuple[bool, str]:
    cleaned = value.strip().upper()
    if IFSC_RE.match(cleaned):
        return True, "Valid IFSC format"
    return False, "Does not match IFSC pattern [A-Z]{4}0[A-Z0-9]{6}"


# ── GSTIN validation ────────────────────────────────────────────────────

_GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _validate_gstin(value: str) -> tuple[bool, str]:
    """Validate a 15-character Indian GSTIN including the check digit."""
    cleaned = value.strip().upper()
    if len(cleaned) != 15:
        return False, f"GSTIN must be 15 characters, got {len(cleaned)}"
    if not GSTIN_RE.match(cleaned):
        return False, "Does not match GSTIN regex pattern"

    # Luhn-like check-digit calculation for GSTIN.
    total = 0
    for i, ch in enumerate(cleaned[:14]):
        idx = _GSTIN_CHARS.index(ch)
        factor = 1 if i % 2 == 0 else 2
        product = idx * factor
        total += (product // len(_GSTIN_CHARS)) + (product % len(_GSTIN_CHARS))

    remainder = total % len(_GSTIN_CHARS)
    expected_idx = (len(_GSTIN_CHARS) - remainder) % len(_GSTIN_CHARS)
    expected_char = _GSTIN_CHARS[expected_idx]

    if cleaned[14] == expected_char:
        return True, "Valid GSTIN (check digit verified)"
    return False, f"GSTIN check digit mismatch: expected '{expected_char}', got '{cleaned[14]}'"


# ── PAN validation ──────────────────────────────────────────────────────


def _validate_pan(value: str) -> tuple[bool, str]:
    cleaned = value.strip().upper()
    if PAN_RE.match(cleaned):
        return True, "Valid PAN format"
    return False, "Does not match PAN pattern [A-Z]{5}[0-9]{4}[A-Z]"


# ── UPI validation ──────────────────────────────────────────────────────


def _validate_upi(value: str) -> tuple[bool, str]:
    cleaned = value.strip()
    if UPI_RE.match(cleaned):
        return True, "Valid UPI ID format"
    return False, "Does not match UPI pattern (handle@provider)"


# ── Email validation ────────────────────────────────────────────────────


def _validate_email(value: str) -> tuple[bool, str]:
    cleaned = value.strip()
    if EMAIL_RE.match(cleaned):
        return True, "Valid email format"
    return False, "Does not match standard email format"


# ── Phone validation ────────────────────────────────────────────────────


def _validate_phone(value: str) -> tuple[bool, str]:
    cleaned = value.strip()
    if PHONE_RE.match(cleaned):
        return True, "Valid international phone format"
    return False, "Does not match international phone format"


# ── Dispatcher ──────────────────────────────────────────────────────────

_VALIDATORS: dict[str, callable] = {
    "IBAN": _validate_iban,
    "IFSC": _validate_ifsc,
    "GSTIN": _validate_gstin,
    "PAN": _validate_pan,
    "UPI": _validate_upi,
    "EMAIL": _validate_email,
    "PHONE": _validate_phone,
}


def validate(identifier_type: str, value: str) -> FormatMatch:
    """Validate a single financial identifier.

    Args:
        identifier_type: One of ``IBAN``, ``IFSC``, ``GSTIN``, ``PAN``,
                         ``UPI``, ``EMAIL``, ``PHONE``.
        value: The raw string to validate.

    Returns:
        A ``FormatMatch`` with the validation outcome.
    """
    validator = _VALIDATORS.get(identifier_type)
    if validator is None:
        return FormatMatch(
            type=identifier_type,
            value=value,
            valid=False,
            is_valid=False,
            details=f"Unknown identifier type: {identifier_type}",
            reason=f"Unknown identifier type: {identifier_type}",
        )
    is_valid, details = validator(value)
    return FormatMatch(
        type=identifier_type,
        value=value,
        valid=is_valid,
        is_valid=is_valid,
        details=details,
        reason="" if is_valid else details,
    )
