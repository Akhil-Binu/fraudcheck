import { useState } from 'react';
import { Eye, Info, X, AlertTriangle, ShieldCheck } from 'lucide-react';

function riskBadge(level) {
  const map = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[level] || map.low;
}

export default function ELAViewer({ ela }) {
  const [showFullSize, setShowFullSize] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const b64 = ela?.ela_image_base64 || ela?.heatmap_base64;

  if (!ela || !b64) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Eye className="w-12 h-12 mb-3 opacity-40" />
        <p>No ELA analysis available</p>
        <p className="text-xs mt-1 text-slate-500">
          Error Level Analysis requires visual raster content.
        </p>
      </div>
    );
  }

  const riskLevel = ela.risk_level || 'low';
  const imgSrc = `data:image/png;base64,${b64}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-100">
            Error Level Analysis
          </h3>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors cursor-pointer"
            title="What is ELA?"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskBadge(riskLevel)}`}
        >
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      </div>

      {/* Info tooltip */}
      {showInfo && (
        <div className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-slate-300 space-y-2">
          <p>
            <strong className="text-slate-100">Error Level Analysis (ELA)</strong>{' '}
            detects areas of an image that have been modified by examining
            compression artifacts.
          </p>
          <p>
            In the heatmap, <strong className="text-amber-300">bright areas</strong>{' '}
            indicate regions that may have been edited or added after the
            original image was created. Uniform brightness suggests the image is
            likely unmodified.
          </p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Max Difference
          </p>
          <p className="text-xl font-bold text-slate-100">
            {ela.max_difference ?? '—'}
          </p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Mean Difference
          </p>
          <p className="text-xl font-bold text-slate-100">
            {ela.mean_difference != null
              ? Number(ela.mean_difference).toFixed(2)
              : '—'}
          </p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Suspicious Regions
          </p>
          <p className="text-xl font-bold text-slate-100">
            {ela.suspicious_regions ?? '—'}
          </p>
        </div>
      </div>

      {/* Suspicious flags */}
      {ela.suspicious_flags && ela.suspicious_flags.length > 0 ? (
        <div className="space-y-2">
          {ela.suspicious_flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">{flag}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200">
            No suspicious editing patterns detected
          </p>
        </div>
      )}

      {/* Heatmap image */}
      <div className="relative">
        <div
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setShowFullSize(true)}
        >
          <img
            src={imgSrc}
            alt="ELA Heatmap"
            className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg text-sm text-white flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Click to view full size
            </span>
          </div>
        </div>
      </div>

      {/* Full size modal */}
      {showFullSize && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullSize(false)}
        >
          <button
            onClick={() => setShowFullSize(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imgSrc}
            alt="ELA Heatmap Full Size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
