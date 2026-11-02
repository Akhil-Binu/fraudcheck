import {
  FileText,
  Calendar,
  User,
  Printer,
  Hash,
  HardDrive,
  AlertTriangle,
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

const FIELD_ICONS = {
  creator: User,
  producer: Printer,
  creation_date: Calendar,
  modification_date: Calendar,
  page_count: Hash,
  file_size: HardDrive,
};

function FieldCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="shrink-0 p-2 rounded-lg bg-slate-700/50">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-sm text-slate-200 break-words">
          {value || <span className="text-slate-500 italic">Not available</span>}
        </p>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function MetadataPanel({ metadata }) {
  if (!metadata) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FileText className="w-12 h-12 mb-3 opacity-40" />
        <p>No metadata available</p>
      </div>
    );
  }

  const fields = [
    { key: 'creator', label: 'Creator', icon: FIELD_ICONS.creator },
    { key: 'producer', label: 'Producer', icon: FIELD_ICONS.producer },
    { key: 'creation_date', label: 'Creation Date', icon: FIELD_ICONS.creation_date },
    { key: 'modification_date', label: 'Modification Date', icon: FIELD_ICONS.modification_date },
    { key: 'page_count', label: 'Page Count', icon: FIELD_ICONS.page_count },
    { key: 'file_size', label: 'File Size', icon: FIELD_ICONS.file_size },
  ];

  const riskLevel = metadata.risk_level || 'low';
  const suspiciousFlags = metadata.suspicious_flags || [];

  return (
    <div className="space-y-6">
      {/* Risk level header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">
          Document Metadata
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskBadge(riskLevel)}`}
        >
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      </div>

      {/* Suspicious flags */}
      {suspiciousFlags.length > 0 && (
        <div className="space-y-2">
          {suspiciousFlags.map((flag, i) => (
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

      {suspiciousFlags.length === 0 && (
        <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200">
            No suspicious metadata flags detected
          </p>
        </div>
      )}

      {/* Metadata fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(({ key, label, icon }) => {
          let val = metadata[key];
          if (!val && key === 'file_size' && metadata.file_size_bytes) {
            val = formatBytes(metadata.file_size_bytes);
          }
          return (
            <FieldCard
              key={key}
              label={label}
              value={val ? String(val) : null}
              icon={icon}
            />
          );
        })}
      </div>
    </div>
  );
}
