import {
  CheckCircle,
  XCircle,
  CreditCard,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';

function riskBadge(level) {
  const map = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[level] || map.low;
}

const TYPE_COLORS = {
  IBAN: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  IFSC: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  GSTIN: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  PAN: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  UPI: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
};

function getTypeColor(type) {
  return (
    TYPE_COLORS[type?.toUpperCase()] ||
    'bg-slate-600/15 text-slate-400 border-slate-500/25'
  );
}

export default function ValidationPanel({ validation }) {
  if (!validation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <CreditCard className="w-12 h-12 mb-3 opacity-40" />
        <p>No validation data available</p>
      </div>
    );
  }

  const identifiers = validation.matches || validation.identifiers || [];
  const riskLevel = validation.risk_level || 'low';
  const validCount = identifiers.filter((id) => id.valid ?? id.is_valid).length;
  const invalidCount = identifiers.filter((id) => !(id.valid ?? id.is_valid)).length;

  if (identifiers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">
            Financial Identifier Validation
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskBadge(riskLevel)}`}
          >
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Info className="w-10 h-10 text-slate-500 mb-3" />
          <p className="text-slate-300 font-medium">
            No financial identifiers found
          </p>
          <p className="text-sm text-slate-500 mt-1">
            No IBAN, IFSC, GSTIN, PAN, or UPI IDs were detected in this document
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-slate-100">
          Financial Identifier Validation
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskBadge(riskLevel)}`}
        >
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Total Found
          </p>
          <p className="text-2xl font-bold text-slate-100">
            {identifiers.length}
          </p>
        </div>
        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15 text-center">
          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">
            Valid
          </p>
          <p className="text-2xl font-bold text-emerald-400">{validCount}</p>
        </div>
        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/15 text-center">
          <p className="text-xs text-red-400 uppercase tracking-wider mb-1">
            Invalid
          </p>
          <p className="text-2xl font-bold text-red-400">{invalidCount}</p>
        </div>
      </div>

      {/* Suspicious flags */}
      {validation.suspicious_flags && validation.suspicious_flags.length > 0 && (
        <div className="space-y-2">
          {validation.suspicious_flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">{flag}</p>
            </div>
          ))}
        </div>
      )}

      {(!validation.suspicious_flags || validation.suspicious_flags.length === 0) && (
        <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200">
            All financial identifiers passed validation
          </p>
        </div>
      )}

      {/* Identifier list */}
      <div className="space-y-3">
        {identifiers.map((id, i) => {
          const isValid = Boolean(id.valid ?? id.is_valid);
          return (
            <div
              key={i}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-start gap-4"
            >
              <div className="shrink-0 mt-0.5">
                {isValid ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                      id.type
                    )}`}
                  >
                    {id.type}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isValid ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-mono break-all">
                  {id.value}
                </p>
                {id.details && (
                  <p className="text-xs text-slate-400 mt-1">{id.details}</p>
                )}
                {id.reason && !isValid && id.reason !== id.details && (
                  <p className="text-xs text-red-300/70 mt-1">{id.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
