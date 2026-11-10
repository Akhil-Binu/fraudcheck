# @akhil-binu/fraudcheck

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-Published-blue?style=flat-square&logo=github)](https://github.com/Akhil-Binu/fraudcheck/packages)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> Official JavaScript & TypeScript client and forensic banking identifier validation SDK for **FraudCheck**.

---

## 📦 Installation

To install from **GitHub Packages**, configure your `.npmrc` file:

```ini
@akhil-binu:registry=https://npm.pkg.github.com
```

Then install via npm, pnpm, or yarn:

```bash
npm install @akhil-binu/fraudcheck
```

---

## ⚡ Quick Start

### 1. Client-Side Banking Identifier Validation
Validate banking identifiers instantly without network calls:

```javascript
import {
  validateIBAN,
  validateIFSC,
  validateGSTIN,
  validatePAN,
  validateUPI
} from "@akhil-binu/fraudcheck";

// ISO 13616 / 7064 MOD-97 Checksum
const ibanResult = validateIBAN("DE89370400440532013000");
console.log(ibanResult.valid); // true

// Fake or Tampered IBAN
const fakeResult = validateIBAN("GB00FAKE99999999999999");
console.log(fakeResult.valid);  // false
console.log(fakeResult.reason); // "IBAN checksum (MOD 97) failed"

// Indian IFSC Validation
const ifscResult = validateIFSC("HDFC0001234");
console.log(ifscResult.valid); // true

// Indian GSTIN Modulus-36 Checksum
const gstinResult = validateGSTIN("27AAPFU12341ZV");
console.log(gstinResult.valid); // true or false
```

---

### 2. Full Forensic Document Analysis via API

Upload an invoice PDF or image to inspect metadata, compute Error Level Analysis (ELA) heatmaps, and detect font subset splicing:

```javascript
import { FraudCheckClient } from "@akhil-binu/fraudcheck";

const client = new FraudCheckClient({
  baseUrl: "https://fraudcheck-taupe.vercel.app" // or your self-hosted instance
});

// Upload a document (Browser File / Blob or Node Buffer)
const result = await client.analyze(file, "invoice.pdf");

console.log("Risk Score:", result.overall_risk_score); // e.g. 80.0
console.log("Risk Level:", result.overall_risk_level); // "critical"
console.log("Suspicious Flags:", result.suspicious_flags);
// [
//   "Font injection detected: 'AAAAXO+DejaVuSans-Bold' spliced on Page 1",
//   "Critical timeline mismatch: Invoice date is 2021, PDF modified in 2026",
//   "Asymmetric metadata: CreationDate stripped"
// ]

// ELA Heatmap Image (Base64 JPEG with JET colormap)
const heatmapBase64 = result.ela.heatmap_base64;
```

---

## 🛠️ TypeScript Support

Full TypeScript definitions are included out of the box:

```typescript
import {
  FraudCheckClient,
  AnalysisResponse,
  ValidationResult
} from "@akhil-binu/fraudcheck";
```

---

## 📄 License

MIT © [Akhil Binu](https://github.com/Akhil-Binu)
