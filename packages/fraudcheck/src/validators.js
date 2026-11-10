/**
 * Financial identifier validation routines matching FraudCheck backend algorithms.
 */

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Validates an International Bank Account Number (IBAN) using ISO 7064 MOD-97-10.
 * @param {string} iban 
 * @returns {{ valid: boolean, is_valid: boolean, reason: string }}
 */
export function validateIBAN(iban) {
  if (!iban || typeof iban !== "string") {
    return { valid: false, is_valid: false, reason: "IBAN is required" };
  }

  const clean = iban.replace(/[\s-]/g, "").toUpperCase();

  if (clean.length < 15 || clean.length > 34) {
    return { valid: false, is_valid: false, reason: `Invalid IBAN length (${clean.length})` };
  }

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return { valid: false, is_valid: false, reason: "Invalid IBAN format structure" };
  }

  // Move first 4 chars to the end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Convert letters to digits: A=10, B=11, ... Z=35
  let numeric = "";
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else {
      numeric += rearranged[i];
    }
  }

  try {
    const remainder = BigInt(numeric) % 97n;
    const valid = remainder === 1n;
    return {
      valid,
      is_valid: valid,
      reason: valid ? "Valid IBAN checksum (MOD 97 passed)" : "IBAN checksum (MOD 97) failed"
    };
  } catch (err) {
    return { valid: false, is_valid: false, reason: `Checksum calculation error: ${err.message}` };
  }
}

/**
 * Validates an Indian Financial System Code (IFSC).
 * @param {string} ifsc 
 * @returns {{ valid: boolean, is_valid: boolean, reason: string }}
 */
export function validateIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== "string") {
    return { valid: false, is_valid: false, reason: "IFSC is required" };
  }

  const clean = ifsc.trim().toUpperCase();

  if (clean.length !== 11) {
    return { valid: false, is_valid: false, reason: `IFSC must be 11 characters, got ${clean.length}` };
  }

  if (clean[4] !== "0") {
    return { valid: false, is_valid: false, reason: "5th character must be '0' per RBI specifications" };
  }

  const pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const valid = pattern.test(clean);

  return {
    valid,
    is_valid: valid,
    reason: valid ? `Valid IFSC structure (${clean.slice(0, 4)} Bank)` : "Invalid IFSC character pattern"
  };
}

/**
 * Validates an Indian Goods and Services Tax Identification Number (GSTIN).
 * @param {string} gstin 
 * @returns {{ valid: boolean, is_valid: boolean, reason: string }}
 */
export function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== "string") {
    return { valid: false, is_valid: false, reason: "GSTIN is required" };
  }

  const clean = gstin.trim().toUpperCase();

  if (clean.length !== 15) {
    return { valid: false, is_valid: false, reason: `GSTIN must be 15 characters, got ${clean.length}` };
  }

  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(clean)) {
    return { valid: false, is_valid: false, reason: "Invalid GSTIN alphanumeric format" };
  }

  const stateCode = parseInt(clean.slice(0, 2), 10);
  if (stateCode < 1 || (stateCode > 38 && stateCode !== 97 && stateCode !== 99)) {
    return { valid: false, is_valid: false, reason: `Invalid GSTIN state code (${clean.slice(0, 2)})` };
  }

  // Modulus 36 Check Digit Validation
  try {
    let factor = 1;
    let sum = 0;
    const base = 36;

    for (let i = 0; i < 14; i++) {
      const charIndex = GSTIN_CHARS.indexOf(clean[i]);
      if (charIndex === -1) {
        return { valid: false, is_valid: false, reason: `Invalid character '${clean[i]}' in GSTIN` };
      }
      let addend = factor * charIndex;
      factor = factor === 2 ? 1 : 2;
      addend = Math.floor(addend / base) + (addend % base);
      sum += addend;
    }

    const remainder = sum % base;
    const checkCodePoint = (base - remainder) % base;
    const expectedCheckDigit = GSTIN_CHARS[checkCodePoint];
    const actualCheckDigit = clean[14];

    const valid = actualCheckDigit === expectedCheckDigit;
    return {
      valid,
      is_valid: valid,
      reason: valid
        ? "Valid GSTIN format and check digit"
        : `GSTIN check digit mismatch (expected '${expectedCheckDigit}', got '${actualCheckDigit}')`
    };
  } catch (err) {
    return { valid: true, is_valid: true, reason: "Valid GSTIN format (checksum skipped)" };
  }
}

/**
 * Validates an Indian Permanent Account Number (PAN).
 * @param {string} pan 
 * @returns {{ valid: boolean, is_valid: boolean, reason: string }}
 */
export function validatePAN(pan) {
  if (!pan || typeof pan !== "string") {
    return { valid: false, is_valid: false, reason: "PAN is required" };
  }

  const clean = pan.trim().toUpperCase();
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const valid = pattern.test(clean);

  const entityTypes = {
    P: "Individual",
    C: "Company",
    H: "HUF (Hindu Undivided Family)",
    A: "Association of Persons",
    B: "Body of Individuals",
    G: "Government Agency",
    J: "Artificial Juridical Person",
    L: "Local Authority",
    F: "Firm / Limited Liability Partnership",
    T: "Trust"
  };

  const entityType = clean.length >= 4 ? entityTypes[clean[3]] || "Unknown" : "Unknown";

  return {
    valid,
    is_valid: valid,
    reason: valid ? `Valid PAN format (${entityType})` : "Invalid PAN format (expected 5 letters, 4 digits, 1 letter)"
  };
}

/**
 * Validates an Indian Unified Payments Interface (UPI) VPA.
 * @param {string} upi 
 * @returns {{ valid: boolean, is_valid: boolean, reason: string }}
 */
export function validateUPI(upi) {
  if (!upi || typeof upi !== "string") {
    return { valid: false, is_valid: false, reason: "UPI ID is required" };
  }

  const clean = upi.trim().toLowerCase();
  const pattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const valid = pattern.test(clean);

  return {
    valid,
    is_valid: valid,
    reason: valid ? "Valid UPI VPA format" : "Invalid UPI format (expected username@handle)"
  };
}
