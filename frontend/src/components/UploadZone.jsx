import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getSamples } from '../api';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const DEFAULT_SAMPLES = [
  {
    id: "legitimate_invoice.pdf",
    index: "01",
    name: "Authentic Business Invoice",
    type: "PDF",
    badge: "CLEAN // VALID IBAN",
    badgeColor: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
    description: "Standard accounting invoice. Genuine German MOD-97 IBAN and consistent creation timestamps."
  },
  {
    id: "tampered_invoice.pdf",
    index: "02",
    name: "Spoofed Wire Invoice",
    type: "PDF",
    badge: "TAMPERED // PHOTOSHOP",
    badgeColor: "border-[#FF3333]/40 text-[#FF3333] bg-[#FF3333]/5",
    description: "Altered wire payment invoice edited in Adobe Photoshop with failed MOD-97 checksum."
  },
  {
    id: "bfl_tampered_invoice.pdf",
    index: "03",
    name: "BFL Spliced Invoice",
    type: "PDF",
    badge: "CRITICAL // FONT INJECTION",
    badgeColor: "border-[#FF3333]/40 text-[#FF3333] bg-[#FF3333]/5",
    description: "Real invoice with injected font subset 'AAAAXO+DejaVuSans-Bold' and 5.7-year timeline gap."
  },
  {
    id: "spliced_invoice.jpg",
    index: "04",
    name: "Scanned Document Splice",
    type: "IMAGE",
    badge: "IMAGE // ELA HOTSPOT",
    badgeColor: "border-amber-500/40 text-amber-400 bg-amber-500/5",
    description: "High-resolution scanned bill containing spliced text overlay over wire fields detected via ELA."
  }
];

export default function UploadZone({ onUpload, onSelectSample, loading, error }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);
  const inputRef = useRef(null);

  useEffect(() => {
    getSamples()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const merged = data.map((item, idx) => ({
            ...item,
            index: `0${idx + 1}`.slice(-2),
            badgeColor: item.badge?.toLowerCase().includes("clean") || item.badge?.toLowerCase().includes("legitimate")
              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
              : "border-[#FF3333]/40 text-[#FF3333] bg-[#FF3333]/5"
          }));
          setSamples(merged);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_SAMPLES
      });
  }, []);

  const validateFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return 'UNSUPPORTED FORMAT: ACCEPTED TYPES ARE PDF, PNG, JPG, JPEG';
    }
    if (f.size > MAX_FILE_SIZE) {
      return `FILE EXCEEDS MAXIMUM THRESHOLD (MAX ${formatBytes(MAX_FILE_SIZE)})`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (f) => {
      setFileError(null);
      const err = validateFile(f);
      if (err) {
        setFileError(err);
        setFile(null);
        return;
      }
      setFile(f);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(() => {
    if (file && onUpload) onUpload(file);
  }, [file, onUpload]);

  // Loading state styled like a high-precision telemetry progress bar
  if (loading) {
    return (
      <div className="py-24 border border-[#222222] bg-[#0E0E0E] relative overflow-hidden">
        <div className="max-w-xl mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#FF3333] animate-ping"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#FF3333] font-bold">
              FORENSIC TELEMETRY ACTIVE
            </span>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tight text-white font-sans">
            EXECUTING DOCUMENT AUDIT
          </h2>

          {/* Stepped progress indicators */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { code: '01', label: 'METADATA' },
              { code: '02', label: 'ELA MATRIX' },
              { code: '03', label: 'FONT PARSER' },
              { code: '04', label: 'CHECKSUMS' },
            ].map((step, idx) => (
              <div key={step.code} className="border border-[#262626] p-2 bg-[#141414] text-left font-mono">
                <span className="text-[10px] text-neutral-400 block">// {step.code}</span>
                <span className="text-xs font-bold text-white block mt-0.5">{step.label}</span>
                <div className="h-0.5 bg-[#FF3333] w-full mt-2 animate-pulse" style={{ animationDelay: `${idx * 150}ms` }}></div>
              </div>
            ))}
          </div>

          <p className="font-mono text-xs text-neutral-400">
            PROCESSING PIXEL DISPARITY &amp; CROSS-REFERENCING FINANCIAL IDENTIFIERS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ── Swiss Poster Header ──────────────────────────────────────── */}
      <div className="border-b border-[#222222] pb-8 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-400">
              <span className="w-2 h-2 bg-[#FF3333]"></span>
              <span>SECTION 01 // INGESTION INTERFACE</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white font-sans leading-[0.95]">
              PRECISION DOCUMENT FORENSICS
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 max-w-2xl font-sans pt-1">
              Automated Error Level Analysis, PDF font subset injection scanning, timeline discrepancy detection, and ISO 13616 banking checksum audits.
            </p>
          </div>

          <div className="hidden lg:block text-right font-mono text-[11px] text-neutral-400 border border-[#222222] p-3 bg-[#111111]">
            <div className="text-white font-bold">REVISION 2026.11</div>
            <div>SPEC: ISO-13616 / MOD-97</div>
            <div className="text-[#FF3333]">STATUS: READY FOR INPUT</div>
          </div>
        </div>
      </div>

      {/* ── Ingestion Drop Zone ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-neutral-400 uppercase tracking-wider">
          <span>// DROP BAY [ TARGET: PRIMARY INVOICE ]</span>
          <span>SUPPORTED: PDF, PNG, JPG, JPEG</span>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          className={`relative border transition-all ${
            dragOver
              ? 'border-[#FF3333] bg-[#FF3333]/5'
              : 'border-[#2D2D2D] bg-[#0E0E0E] hover:border-neutral-500'
          } p-8 sm:p-12 text-center`}
        >
          {/* Architectural corner crosshairs */}
          <span className="absolute top-2 left-2 font-mono text-xs text-neutral-600 select-none">+</span>
          <span className="absolute top-2 right-2 font-mono text-xs text-neutral-600 select-none">+</span>
          <span className="absolute bottom-2 left-2 font-mono text-xs text-neutral-600 select-none">+</span>
          <span className="absolute bottom-2 right-2 font-mono text-xs text-neutral-600 select-none">+</span>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              const f = e.target.files[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />

          {!file ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto border border-neutral-700 bg-[#141414] flex items-center justify-center text-white">
                <Upload className="w-5 h-5" />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-6 py-2.5 bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#FF3333] hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  SELECT FILE FROM SYSTEM
                </button>
                <p className="mt-3 font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  OR DRAG &amp; DROP SUSPICIOUS INVOICE HERE
                </p>
              </div>

              <div className="pt-4 border-t border-[#1F1F1F] flex items-center justify-center gap-4 font-mono text-[10px] text-neutral-400">
                <span>MAX FILE: 20MB</span>
                <span>•</span>
                <span>IN-MEMORY PROCESSING</span>
                <span>•</span>
                <span>ZERO RETENTION</span>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto bg-[#141414] border border-neutral-700 p-5 text-left space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-[#222222] pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-white text-black flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white font-mono truncate">{file.name}</p>
                    <p className="text-[11px] font-mono text-neutral-400">{formatBytes(file.size)} // READY</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 text-neutral-400 hover:text-[#FF3333] transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-[#FF3333] text-black font-mono text-xs font-black tracking-widest uppercase hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>RUN FORENSIC ANALYSIS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="py-3 px-4 border border-neutral-700 text-neutral-300 font-mono text-xs tracking-wider uppercase hover:border-white hover:text-white transition-all cursor-pointer"
                >
                  CHANGE
                </button>
              </div>
            </div>
          )}

          {/* Validation or API error display */}
          {(fileError || error) && (
            <div className="mt-6 max-w-md mx-auto p-3 border border-[#FF3333] bg-[#FF3333]/10 text-left flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#FF3333] shrink-0 mt-0.5" />
              <div className="font-mono text-xs text-[#FF3333]">
                <span className="font-bold uppercase">INGESTION ERROR: </span>
                <span>{fileError || error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 02: Calibration / Demonstration Samples ──────── */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b border-[#222222] pb-2 font-mono text-xs text-neutral-400 uppercase tracking-wider">
          <span>// SECTION 02 — CALIBRATION SAMPLES</span>
          <span className="hidden sm:inline">1-CLICK INSTANT AUDIT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {samples.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSample && onSelectSample(s.id)}
              className="group p-4 bg-[#0E0E0E] border border-[#222222] hover:border-white transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-neutral-400 group-hover:text-white font-bold transition-colors">
                    SAMPLE // {s.index || '00'}
                  </span>
                  <span className="text-neutral-400 uppercase">{s.type || 'PDF'}</span>
                </div>

                <h3 className="text-sm font-bold text-white font-sans group-hover:text-[#FF3333] transition-colors leading-snug">
                  {s.name}
                </h3>

                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between">
                <span className={`px-2 py-0.5 border font-mono text-[9px] font-bold tracking-wider uppercase ${s.badgeColor || 'border-neutral-700 text-neutral-300'}`}>
                  {s.badge}
                </span>
                <span className="font-mono text-xs text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
