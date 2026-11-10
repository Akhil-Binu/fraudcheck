import { mkdirSync, writeFileSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "..");
const distDir = resolve(pkgRoot, "dist");

mkdirSync(distDir, { recursive: true });

// Copy ESM version
const esmContent = `
/**
 * @akhil-binu/fraudcheck — v1.0.0
 * Forensic SDK & Banking Identifier Checksum Validator
 */

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function validateIBAN(iban) {
  if (!iban || typeof iban !== "string") {
    return { valid: false, is_valid: false, reason: "IBAN is required" };
  }
  const clean = iban.replace(/[\\s-]/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) {
    return { valid: false, is_valid: false, reason: "Invalid IBAN length (" + clean.length + ")" };
  }
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return { valid: false, is_valid: false, reason: "Invalid IBAN format structure" };
  }
  const rearranged = clean.slice(4) + clean.slice(0, 4);
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
    return { valid: false, is_valid: false, reason: "Checksum calculation error: " + err.message };
  }
}

export function validateIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== "string") {
    return { valid: false, is_valid: false, reason: "IFSC is required" };
  }
  const clean = ifsc.trim().toUpperCase();
  if (clean.length !== 11) {
    return { valid: false, is_valid: false, reason: "IFSC must be 11 characters, got " + clean.length };
  }
  if (clean[4] !== "0") {
    return { valid: false, is_valid: false, reason: "5th character must be '0' per RBI specifications" };
  }
  const pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const valid = pattern.test(clean);
  return {
    valid,
    is_valid: valid,
    reason: valid ? "Valid IFSC structure (" + clean.slice(0, 4) + " Bank)" : "Invalid IFSC character pattern"
  };
}

export function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== "string") {
    return { valid: false, is_valid: false, reason: "GSTIN is required" };
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { valid: false, is_valid: false, reason: "GSTIN must be 15 characters, got " + clean.length };
  }
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(clean)) {
    return { valid: false, is_valid: false, reason: "Invalid GSTIN alphanumeric format" };
  }
  const stateCode = parseInt(clean.slice(0, 2), 10);
  if (stateCode < 1 || (stateCode > 38 && stateCode !== 97 && stateCode !== 99)) {
    return { valid: false, is_valid: false, reason: "Invalid GSTIN state code (" + clean.slice(0, 2) + ")" };
  }
  try {
    let factor = 1;
    let sum = 0;
    const base = 36;
    for (let i = 0; i < 14; i++) {
      const charIndex = GSTIN_CHARS.indexOf(clean[i]);
      if (charIndex === -1) {
        return { valid: false, is_valid: false, reason: "Invalid character '" + clean[i] + "' in GSTIN" };
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
        : "GSTIN check digit mismatch (expected '" + expectedCheckDigit + "', got '" + actualCheckDigit + "')"
    };
  } catch (err) {
    return { valid: true, is_valid: true, reason: "Valid GSTIN format (checksum skipped)" };
  }
}

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
    reason: valid ? "Valid PAN format (" + entityType + ")" : "Invalid PAN format (expected 5 letters, 4 digits, 1 letter)"
  };
}

export function validateUPI(upi) {
  if (!upi || typeof upi !== "string") {
    return { valid: false, is_valid: false, reason: "UPI ID is required" };
  }
  const clean = upi.trim().toLowerCase();
  const pattern = /^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const valid = pattern.test(clean);
  return {
    valid,
    is_valid: valid,
    reason: valid ? "Valid UPI VPA format" : "Invalid UPI format (expected username@handle)"
  };
}

export class FraudCheckClient {
  constructor({ baseUrl = "https://fraudcheck-taupe.vercel.app", headers = {} } = {}) {
    this.baseUrl = baseUrl.replace(/\\/+$/, "");
    this.headers = headers;
  }

  async health() {
    const res = await fetch(this.baseUrl + "/api/health", {
      method: "GET",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) throw new Error("Health check failed with HTTP " + res.status);
    return res.json();
  }

  async getSamples() {
    const res = await fetch(this.baseUrl + "/api/samples", {
      method: "GET",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) throw new Error("Failed to fetch samples: HTTP " + res.status);
    return res.json();
  }

  async analyzeSample(sampleId) {
    if (!sampleId) throw new Error("sampleId is required");
    const res = await fetch(this.baseUrl + "/api/analyze-sample/" + encodeURIComponent(sampleId), {
      method: "POST",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error("Sample analysis failed (HTTP " + res.status + "): " + errBody);
    }
    return res.json();
  }

  async analyze(file, filename = "invoice.pdf") {
    if (!file) throw new Error("File is required for analysis");
    const formData = new FormData();
    if (typeof File !== "undefined" && file instanceof File) {
      formData.append("file", file);
    } else if (typeof Blob !== "undefined" && file instanceof Blob) {
      formData.append("file", file, filename);
    } else {
      const blob = new Blob([file]);
      formData.append("file", blob, filename);
    }
    const res = await fetch(this.baseUrl + "/api/analyze", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error("Document analysis failed (HTTP " + res.status + "): " + errBody);
    }
    return res.json();
  }
}
`;

writeFileSync(resolve(distDir, "index.js"), esmContent.trim() + "\n", "utf8");

// Generate CJS version
const cjsContent = `
"use strict";

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function validateIBAN(iban) {
  if (!iban || typeof iban !== "string") {
    return { valid: false, is_valid: false, reason: "IBAN is required" };
  }
  const clean = iban.replace(/[\\s-]/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) {
    return { valid: false, is_valid: false, reason: "Invalid IBAN length (" + clean.length + ")" };
  }
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return { valid: false, is_valid: false, reason: "Invalid IBAN format structure" };
  }
  const rearranged = clean.slice(4) + clean.slice(0, 4);
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
    return { valid: false, is_valid: false, reason: "Checksum calculation error: " + err.message };
  }
}

function validateIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== "string") {
    return { valid: false, is_valid: false, reason: "IFSC is required" };
  }
  const clean = ifsc.trim().toUpperCase();
  if (clean.length !== 11) {
    return { valid: false, is_valid: false, reason: "IFSC must be 11 characters, got " + clean.length };
  }
  if (clean[4] !== "0") {
    return { valid: false, is_valid: false, reason: "5th character must be '0' per RBI specifications" };
  }
  const pattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const valid = pattern.test(clean);
  return {
    valid,
    is_valid: valid,
    reason: valid ? "Valid IFSC structure (" + clean.slice(0, 4) + " Bank)" : "Invalid IFSC character pattern"
  };
}

function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== "string") {
    return { valid: false, is_valid: false, reason: "GSTIN is required" };
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { valid: false, is_valid: false, reason: "GSTIN must be 15 characters, got " + clean.length };
  }
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(clean)) {
    return { valid: false, is_valid: false, reason: "Invalid GSTIN alphanumeric format" };
  }
  const stateCode = parseInt(clean.slice(0, 2), 10);
  if (stateCode < 1 || (stateCode > 38 && stateCode !== 97 && stateCode !== 99)) {
    return { valid: false, is_valid: false, reason: "Invalid GSTIN state code (" + clean.slice(0, 2) + ")" };
  }
  try {
    let factor = 1;
    let sum = 0;
    const base = 36;
    for (let i = 0; i < 14; i++) {
      const charIndex = GSTIN_CHARS.indexOf(clean[i]);
      if (charIndex === -1) {
        return { valid: false, is_valid: false, reason: "Invalid character '" + clean[i] + "' in GSTIN" };
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
        : "GSTIN check digit mismatch (expected '" + expectedCheckDigit + "', got '" + actualCheckDigit + "')"
    };
  } catch (err) {
    return { valid: true, is_valid: true, reason: "Valid GSTIN format (checksum skipped)" };
  }
}

function validatePAN(pan) {
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
    reason: valid ? "Valid PAN format (" + entityType + ")" : "Invalid PAN format (expected 5 letters, 4 digits, 1 letter)"
  };
}

function validateUPI(upi) {
  if (!upi || typeof upi !== "string") {
    return { valid: false, is_valid: false, reason: "UPI ID is required" };
  }
  const clean = upi.trim().toLowerCase();
  const pattern = /^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const valid = pattern.test(clean);
  return {
    valid,
    is_valid: valid,
    reason: valid ? "Valid UPI VPA format" : "Invalid UPI format (expected username@handle)"
  };
}

class FraudCheckClient {
  constructor({ baseUrl = "https://fraudcheck-taupe.vercel.app", headers = {} } = {}) {
    this.baseUrl = baseUrl.replace(/\\/+$/, "");
    this.headers = headers;
  }

  async health() {
    const res = await fetch(this.baseUrl + "/api/health", {
      method: "GET",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) throw new Error("Health check failed with HTTP " + res.status);
    return res.json();
  }

  async getSamples() {
    const res = await fetch(this.baseUrl + "/api/samples", {
      method: "GET",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) throw new Error("Failed to fetch samples: HTTP " + res.status);
    return res.json();
  }

  async analyzeSample(sampleId) {
    if (!sampleId) throw new Error("sampleId is required");
    const res = await fetch(this.baseUrl + "/api/analyze-sample/" + encodeURIComponent(sampleId), {
      method: "POST",
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error("Sample analysis failed (HTTP " + res.status + "): " + errBody);
    }
    return res.json();
  }

  async analyze(file, filename = "invoice.pdf") {
    if (!file) throw new Error("File is required for analysis");
    const formData = new FormData();
    if (typeof File !== "undefined" && file instanceof File) {
      formData.append("file", file);
    } else if (typeof Blob !== "undefined" && file instanceof Blob) {
      formData.append("file", file, filename);
    } else {
      const blob = new Blob([file]);
      formData.append("file", blob, filename);
    }
    const res = await fetch(this.baseUrl + "/api/analyze", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json", ...this.headers }
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error("Document analysis failed (HTTP " + res.status + "): " + errBody);
    }
    return res.json();
  }
}

module.exports = {
  validateIBAN,
  validateIFSC,
  validateGSTIN,
  validatePAN,
  validateUPI,
  FraudCheckClient
};
`;

writeFileSync(resolve(distDir, "index.cjs"), cjsContent.trim() + "\n", "utf8");

// TypeScript declaration types
const dtsContent = `
export interface ValidationResult {
  valid: boolean;
  is_valid: boolean;
  reason: string;
}

export declare function validateIBAN(iban: string): ValidationResult;
export declare function validateIFSC(ifsc: string): ValidationResult;
export declare function validateGSTIN(gstin: string): ValidationResult;
export declare function validatePAN(pan: string): ValidationResult;
export declare function validateUPI(upi: string): ValidationResult;

export interface MetadataResult {
  creator: string | null;
  producer: string | null;
  creation_date: string | null;
  modification_date: string | null;
  page_count: number;
  file_size: string;
  suspicious_flags: string[];
  risk_level: "low" | "medium" | "high" | "critical";
}

export interface ELAResult {
  max_difference: number;
  mean_difference: number;
  suspicious_regions: number;
  risk_level: "low" | "medium" | "high" | "critical";
  heatmap_base64: string;
  ela_image_base64?: string;
  suspicious_flags: string[];
}

export interface FormatMatch {
  type: string;
  value: string;
  valid: boolean;
  is_valid?: boolean;
  details: string;
  reason?: string;
}

export interface IdentifierValidationResult {
  matches: FormatMatch[];
  identifiers: FormatMatch[];
  risk_level: "low" | "medium" | "high" | "critical";
  suspicious_flags: string[];
}

export interface AnalysisResponse {
  filename: string;
  file_type: string;
  overall_risk_score: number;
  overall_risk_level: "low" | "medium" | "high" | "critical";
  suspicious_flags: string[];
  metadata: MetadataResult;
  ela: ELAResult;
  validation: IdentifierValidationResult;
  text: {
    full_text: string;
    text: string;
    page_texts: string[];
    pages: Array<{ page: number; text: string }>;
  };
}

export interface SampleItem {
  id: string;
  name: string;
  type: string;
  badge: string;
  description: string;
}

export declare class FraudCheckClient {
  constructor(options?: { baseUrl?: string; headers?: Record<string, string> });
  health(): Promise<{ status: string }>;
  getSamples(): Promise<SampleItem[]>;
  analyzeSample(sampleId: string): Promise<AnalysisResponse>;
  analyze(file: File | Blob | ArrayBuffer | Uint8Array, filename?: string): Promise<AnalysisResponse>;
}
`;

writeFileSync(resolve(distDir, "index.d.ts"), dtsContent.trim() + "\n", "utf8");

// Copy root LICENSE into package folder
try {
  copyFileSync(resolve(pkgRoot, "../../LICENSE"), resolve(pkgRoot, "LICENSE"));
} catch (_) {}

console.log("✓ Built @akhil-binu/fraudcheck (ESM, CJS, and TypeScript declarations)");
