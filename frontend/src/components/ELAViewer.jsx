import { useState } from 'react';
import { Eye, Info, X, Maximize2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ELAViewer({ ela }) {
  const [showFullSize, setShowFullSize] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  const b64 = ela?.ela_image_base64 || ela?.heatmap_base64;

  if (!ela || !b64) {
    return (
      <div className="py-16 text-center font-mono text-xs text-neutral-400 space-y-2">
        <p>// NO RASTER VISUAL STREAM AVAILABLE FOR ERROR LEVEL ANALYSIS</p>
        <p className="text-neutral-500 text-[11px]">Vector-only PDFs require high-res rasterization to compute JPEG compression differences.</p>
      </div>
    );
  }

  const riskNorm = (ela.risk_level || 'low').toUpperCase();
  const imgSrc = `data:image/png;base64,${b64}`;
  const maxDiff = Number(ela.max_difference || 0).toFixed(1);
  const meanDiff = Number(ela.mean_difference || 0).toFixed(2);
  const regions = ela.suspicious_regions ?? 0;
  const flags = ela.suspicious_flags || [];

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div>
          <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block">
            // TELEMETRY MODULE 03
          </span>
          <h3 className="text-xl font-black uppercase tracking-tight text-white font-sans mt-0.5">
            ERROR LEVEL ANALYSIS (ELA) SPECTROMETRY
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="px-2.5 py-1 border border-neutral-700 font-mono text-xs text-neutral-300 hover:border-white hover:text-white uppercase transition-all cursor-pointer"
          >
            [ {showFormula ? 'HIDE SPECS' : 'VIEW SPECS'} ]
          </button>

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

      {/* Forensic Formula Specifications Drawer */}
      {showFormula && (
        <div className="p-4 border border-[#262626] bg-[#121212] font-mono text-xs space-y-2 text-neutral-300">
          <div className="flex items-center justify-between text-[#FF3333] font-bold">
            <span>// ELA MATHEMATICAL DISPARITY ALGORITHM</span>
            <span>QUALITY FACTOR: 95%</span>
          </div>
          <p className="text-neutral-400">
            Resaves the document image at fixed 95% JPEG quantization, calculates pixel disparity matrix <span className="text-white">Δ(x, y) = |I_original(x,y) - I_95(x,y)| × 20</span>, and maps values to a high-contrast JET false-color palette.
          </p>
          <div className="pt-2 border-t border-[#1C1C1C] flex gap-4 text-[10px] text-neutral-400">
            <span>BLUE = UNTOUCHED BASELINE</span>
            <span>•</span>
            <span>GREEN/YELLOW = MILD RESIDUAL</span>
            <span>•</span>
            <span>RED/HOTSPOT = DIGITAL SPLICE / SPLICED TEXT</span>
          </div>
        </div>
      )}

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        <div className="p-4 border border-[#222222] bg-[#121212] space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase">// 01 PEAK ERROR DELTA</span>
          <div className="text-2xl font-black text-white">{maxDiff}</div>
          <span className="text-[10px] text-neutral-400 block pt-1 border-t border-[#1C1C1C]">
            THRESHOLD: &gt; 35.0 (SUSPICIOUS)
          </span>
        </div>

        <div className="p-4 border border-[#222222] bg-[#121212] space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase">// 02 MEAN RESIDUAL</span>
          <div className="text-2xl font-black text-white">{meanDiff}</div>
          <span className="text-[10px] text-neutral-400 block pt-1 border-t border-[#1C1C1C]">
            AVERAGE SURFACE QUANTIZATION
          </span>
        </div>

        <div className="p-4 border border-[#222222] bg-[#121212] space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase">// 03 CONTOURS ISOLATED</span>
          <div className="text-2xl font-black text-white">{regions}</div>
          <span className="text-[10px] text-neutral-400 block pt-1 border-t border-[#1C1C1C]">
            HIGH-CONTRAST DIGITAL CLUSTERS
          </span>
        </div>
      </div>

      {/* Visual Heatmap Frame */}
      <div className="space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-neutral-400 uppercase">
          <span>// JET SPECTRAL RESIDUAL MATRIX [ AMPLIFIED 20X ]</span>
          <button
            onClick={() => setShowFullSize(true)}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>FULLSCREEN VIEW</span>
          </button>
        </div>

        <div className="relative border border-[#2D2D2D] bg-[#0A0A0A] p-2 flex items-center justify-center overflow-hidden">
          {/* Corner crosshairs */}
          <span className="absolute top-2 left-2 font-mono text-xs text-neutral-600 select-none">+</span>
          <span className="absolute top-2 right-2 font-mono text-xs text-neutral-600 select-none">+</span>
          <span className="absolute bottom-2 left-2 font-mono text-xs text-neutral-600 select-none">+</span>
          <span className="absolute bottom-2 right-2 font-mono text-xs text-neutral-600 select-none">+</span>

          <img
            src={imgSrc}
            alt="Error Level Analysis Heatmap"
            className="max-h-[500px] w-auto object-contain cursor-pointer transition-transform hover:scale-[1.01]"
            onClick={() => setShowFullSize(true)}
          />
        </div>
      </div>

      {/* Full-screen Inspection Modal */}
      {showFullSize && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-8">
          <div className="flex items-center justify-between border-b border-[#222222] pb-4 font-mono text-xs text-white">
            <span className="uppercase font-bold tracking-wider">// HIGH-RESOLUTION FORENSIC VIEWPORT</span>
            <button
              onClick={() => setShowFullSize(false)}
              className="px-3 py-1 bg-white text-black font-bold uppercase hover:bg-[#FF3333] hover:text-white transition-all cursor-pointer"
            >
              [ CLOSE VIEW ]
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img
              src={imgSrc}
              alt="High-res ELA Heatmap"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
