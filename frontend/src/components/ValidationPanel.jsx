import { CheckCircle2, AlertTriangle, ShieldCheck, CreditCard } from 'lucide-react';

export default function ValidationPanel({ validation }) {
  const matches = validation?.matches || validation?.identifiers || [];
  const flags = validation?.suspicious_flags || [];
  const riskNorm = (validation?.risk_level || 'low').toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div>
          <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block">
            // TELEMETRY MODULE 04
          </span>
          <h3 className="text-xl font-black uppercase tracking-tight text-white font-sans mt-0.5">
            FINANCIAL CHECKSUMS &amp; REGISTRY VALIDATION
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-neutral-400 uppercase">CHECKSUM STATUS:</span>
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

      {/* Identifiers Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-neutral-400 uppercase tracking-wider">
          <span>// PARSED IDENTIFIER REGISTRY</span>
          <span>{matches.length} RECORD{matches.length !== 1 ? 'S' : ''} FOUND</span>
        </div>

        {matches.length === 0 ? (
          <div className="p-8 border border-[#222222] bg-[#121212] text-center font-mono text-xs text-neutral-400 space-y-1">
            <p>// NO BANKING OR TAX IDENTIFIERS EXTRACTED FROM DOCUMENT TEXT</p>
            <p className="text-neutral-500 text-[11px]">Searched for IBAN, IFSC, GSTIN, PAN, and UPI VPA patterns.</p>
          </div>
        ) : (
          <div className="border border-[#222222] bg-[#121212] overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#222222] bg-[#161616] text-[10px] text-neutral-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">TYPE</th>
                  <th className="py-2.5 px-4">EXTRACTED VALUE</th>
                  <th className="py-2.5 px-4">ALGORITHM / DIAGNOSTIC</th>
                  <th className="py-2.5 px-4 text-right">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E]">
                {matches.map((item, idx) => {
                  const isValid = item.valid ?? item.is_valid ?? false;
                  return (
                    <tr
                      key={idx}
                      className={isValid ? 'hover:bg-[#181818]' : 'bg-[#FF3333]/5 hover:bg-[#FF3333]/10'}
                    >
                      <td className="py-3 px-4 text-neutral-500 text-[11px]">
                        0{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-white uppercase">
                        {item.type}
                      </td>
                      <td className="py-3 px-4 font-bold text-white tracking-wide">
                        {item.value}
                      </td>
                      <td className="py-3 px-4 text-neutral-300 font-sans text-xs">
                        {item.details || item.reason || 'Structural format check'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 border text-[10px] font-bold tracking-wider uppercase font-mono ${
                            isValid
                              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                              : 'border-[#FF3333] text-[#FF3333] bg-[#FF3333]/20 font-black'
                          }`}
                        >
                          {isValid ? 'PASS' : 'FAIL // REJECT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Discrepancy Findings */}
      {flags.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[#222222]">
          <div className="font-mono text-xs text-[#FF3333] font-bold uppercase tracking-wider">
            // FAILED CHECKSUM DISCREPANCIES
          </div>

          <div className="space-y-2 font-mono">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className="p-3.5 border border-[#FF3333]/30 bg-[#FF3333]/5 flex items-start gap-3 text-xs text-[#FF3333]"
              >
                <div className="w-4 h-4 bg-[#FF3333] text-black font-black flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  !
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold block text-neutral-400">
                    CHECKSUM VIOLATION 0{idx + 1}
                  </span>
                  <p className="font-sans font-medium text-white text-xs sm:text-sm mt-0.5">
                    {flag}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
