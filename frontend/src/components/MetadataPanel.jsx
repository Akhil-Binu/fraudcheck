import {
  FileText,
  Calendar,
  User,
  Printer,
  Hash,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

const FIELD_DEFS = [
  { key: 'creator', code: '01', label: 'ORIGINATING APPLICATION (CREATOR)', icon: User },
  { key: 'producer', code: '02', label: 'PDF PRODUCER ENGINE', icon: Printer },
  { key: 'creation_date', code: '03', label: 'RECORDED CREATION TIMESTAMP', icon: Calendar },
  { key: 'modification_date', code: '04', label: 'LAST MODIFIED TIMESTAMP', icon: Calendar },
  { key: 'page_count', code: '05', label: 'TOTAL RENDERED PAGES', icon: Hash },
  { key: 'file_size', code: '06', label: 'ALLOCATED BINARY SIZE', icon: HardDrive },
];

export default function MetadataPanel({ metadata }) {
  if (!metadata) {
    return (
      <div className="py-16 text-center font-mono text-xs text-neutral-400">
        // NO METADATA CATALOGUE RETURNED FOR THIS FILE
      </div>
    );
  }

  const flags = metadata.suspicious_flags || [];
  const riskNorm = (metadata.risk_level || 'low').toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div>
          <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block">
            // TELEMETRY MODULE 02
          </span>
          <h3 className="text-xl font-black uppercase tracking-tight text-white font-sans mt-0.5">
            PDF METADATA &amp; SOFTWARE SIGNATURES
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-neutral-400 uppercase">CLASSIFICATION:</span>
          <span
            className={`px-3 py-1 border font-mono text-xs font-bold uppercase tracking-wider ${
              riskNorm === 'CRITICAL' || riskNorm === 'HIGH'
                ? 'border-[#FF3333] bg-[#FF3333]/10 text-[#FF3333]'
                : riskNorm === 'MEDIUM'
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {riskNorm} RISK
          </span>
        </div>
      </div>

      {/* Structural Data Specification Grid (6 Cells) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
        {FIELD_DEFS.map(({ key, code, label, icon: Icon }) => {
          const val = metadata[key] ?? (key === 'file_size' ? metadata.file_size_bytes : null);
          const displayVal = val !== null && val !== undefined ? String(val) : null;

          return (
            <div
              key={key}
              className="p-4 border border-[#222222] bg-[#121212] space-y-2"
            >
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>SPEC // {code}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                {label}
              </div>

              <div className="text-sm font-bold text-white break-words pt-1 font-mono">
                {displayVal || (
                  <span className="text-neutral-500 italic font-normal text-xs">
                    [ STRIPPED / NOT RECORDED ]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suspicious Anomalies Section */}
      <div className="space-y-3 pt-4 border-t border-[#222222]">
        <div className="flex items-center justify-between font-mono text-xs text-neutral-400 uppercase tracking-wider">
          <span>// METADATA INTEGRITY AUDIT FINDINGS</span>
          <span>{flags.length} ANOMAL{flags.length !== 1 ? 'IES' : 'Y'} REGISTERED</span>
        </div>

        {flags.length === 0 ? (
          <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3 font-mono text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>METADATA INTEGRITY VERIFIED — NO TRACES OF RASTER EDITORS OR TIMELINE INCONSISTENCIES</span>
          </div>
        ) : (
          <div className="space-y-2 font-mono">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className="p-3.5 border border-[#262626] bg-[#141414] flex items-start gap-3 text-xs"
              >
                <div className="w-4 h-4 bg-[#FF3333] text-black font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  !
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                    ANOMALY // 0{idx + 1}
                  </span>
                  <p className="text-white font-sans text-xs sm:text-sm font-medium">
                    {flag}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
