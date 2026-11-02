# 🧾 FraudCheck — Tampered Invoice & Digital Document Forensics

> Enterprise-grade invoice spoofing detection and digital forensics platform designed to protect accounts payable, small businesses, and freelancers against wire redirection scams and digital document manipulation.

---

## 🚀 Live Servers

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔍 Core Forensic Capabilities

1. **Metadata Inspection (`analyzers/metadata.py`)**
   - Detects traces of raster graphics editors (Adobe Photoshop, GIMP, Inkscape, Foxit Editor, Nitro PDF).
   - Flags anomalies between creation date and modification timestamps (> 1 hour drift).
   - Identifies creator/producer mismatches (e.g. created by Microsoft Word, modified by a third-party editor).
   - Flags stripped or scrubbed EXIF/PDF metadata.

2. **Visual Error Level Analysis (ELA) (`analyzers/ela.py`)**
   - Re-compresses candidate documents/images at fixed 95% JPEG quality.
   - Calculates pixel-level absolute difference and amplifies it $20\times$.
   - Renders a JET colormap heatmap showing splice artifacts and digital insertions (e.g. pasted account numbers).
   - Identifies and counts high-contrast suspicious contours.

3. **Financial Identifier Checksum & Format Validation (`analyzers/validator.py`)**
   - **IBAN**: ISO 13616 MOD-97 checksum algorithm verification.
   - **IFSC**: Indian Financial System Code format pattern validation (`^[A-Z]{4}0[A-Z0-9]{6}$`).
   - **GSTIN**: 15-character alphanumeric Indian Goods & Services Tax ID with Luhn-like check digit validation.
   - **PAN**: Permanent Account Number verification (`^[A-Z]{5}[0-9]{4}[A-Z]$`).
   - **UPI ID**, **Email**, and **Phone Numbers** format parsing and cross-referencing.

4. **Multi-Factor Risk Scoring Engine (`main.py`)**
   - Metadata Risk: 0–30 pts
   - Visual ELA Forensics: 0–40 pts
   - Validation & Identifier Integrity: 0–30 pts
   - Overall Score (0–100) mapped to **Low**, **Medium**, **High**, or **Critical**.

---

## 📁 Repository Structure

```
Fraudcheck/
├── backend/
│   ├── main.py                  # FastAPI server, endpoints & CORS
│   ├── models.py                # Pydantic schemas (AnalysisResponse, ELAResult, etc.)
│   ├── requirements.txt         # Python dependencies
│   ├── venv/                    # Dedicated Python virtual environment
│   └── analyzers/
│       ├── metadata.py          # PDF & image metadata extraction + flags
│       ├── ela.py               # Error Level Analysis & JET heatmap generator
│       ├── validator.py         # MOD-97 IBAN, IFSC, GSTIN, PAN validation
│       └── text_extractor.py    # PyMuPDF text & financial identifier scanner
├── frontend/
│   ├── package.json
│   ├── vite.config.js           # Vite config with /api proxy to localhost:8000
│   └── src/
│       ├── App.jsx              # Main app container & flow
│       ├── api.js               # Axios API client
│       └── components/
│           ├── Header.jsx       # Dark cybersecurity header
│           ├── UploadZone.jsx   # Drag & drop upload + 1-click forensic demo samples
│           ├── AnalysisDashboard.jsx # Tabbed forensics report
│           ├── RiskScore.jsx    # Circular animated gauge (Low → Critical)
│           ├── MetadataPanel.jsx    # Timestamp & editing tool inspector
│           ├── ELAViewer.jsx        # Side-by-side ELA heatmap viewer & metrics
│           ├── ValidationPanel.jsx  # IBAN, IFSC, Tax ID validation results
│           └── TextPanel.jsx        # Extracted text with search & copy
└── samples/
    ├── legitimate_invoice.pdf   # Clean business invoice (Clean MOD-97 IBAN)
    ├── tampered_invoice.pdf     # Attacker edited with Photoshop + Fake IBAN
    └── spliced_invoice.jpg      # Scanned image invoice with spliced account box
```

---

## 🛠️ How to Run Locally

### 1. Start Backend
```powershell
cd backend
.\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend
```powershell
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
