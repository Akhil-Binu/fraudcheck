import { useEffect, useState, useRef } from 'react';

const TIERS = [
  { min: 0, max: 24, code: '01', label: 'LOW RISK', sub: 'AUTHENTIC INTEGRITY', color: '#10b981', border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { min: 25, max: 49, code: '02', label: 'MEDIUM RISK', sub: 'ANOMALIES PRESENT', color: '#f59e0b', border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  { min: 50, max: 74, code: '03', label: 'HIGH RISK', sub: 'TAMPERING SUSPECTED', color: '#f97316', border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  { min: 75, max: 100, code: '04', label: 'CRITICAL', sub: 'VERIFIED MANIPULATION', color: '#FF3333', border: 'border-[#FF3333]', bg: 'bg-[#FF3333]/10', text: 'text-[#FF3333]' },
];

function getTier(score) {
  return TIERS.find((t) => score <= t.max) || TIERS[3];
}

export default function RiskScore({ score = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef(null);

  const radius = 64;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const size = (radius + stroke) * 2;

  useEffect(() => {
    let start = null;
    const duration = 1000;
    const from = 0;
    const to = Math.min(Math.max(score, 0), 100);

    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const activeTier = getTier(animatedScore);
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Top Swiss Index Header */}
      <div className="flex items-center justify-between w-full border-b border-[#222222] pb-2 mb-6 font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
        <span>// METRIC 01.0</span>
        <span className="text-white font-bold">COMPOSITE RISK INDEX</span>
        <span>SCALE: 0.0 — 100.0</span>
      </div>

      {/* Dial Instrument */}
      <div className="relative my-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1c1c1c"
            strokeWidth={stroke}
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={activeTier.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="square"
            className="transition-all duration-75"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-black tracking-tighter text-white">
            {animatedScore}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
            SCORE / 100
          </span>
        </div>
      </div>

      {/* Verdict Stamp */}
      <div className="mt-5 text-center">
        <div
          className={`inline-block px-4 py-1.5 border ${activeTier.border} ${activeTier.bg} font-mono text-xs font-black tracking-widest uppercase ${activeTier.text}`}
        >
          [ TIER {activeTier.code} // {activeTier.label} : {activeTier.sub} ]
        </div>
      </div>

      {/* Segmented Tiers Matrix */}
      <div className="grid grid-cols-4 gap-1.5 w-full mt-6 pt-4 border-t border-[#222222] font-mono text-[10px]">
        {TIERS.map((tier) => {
          const isActive = activeTier.code === tier.code;
          return (
            <div
              key={tier.code}
              className={`p-2 border transition-all ${
                isActive
                  ? `${tier.border} ${tier.bg} text-white`
                  : 'border-[#1E1E1E] bg-[#111111] text-neutral-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{tier.code}</span>
                <span>{tier.min}-{tier.max}</span>
              </div>
              <div className="mt-1 font-semibold truncate text-[9px] tracking-tight uppercase">
                {tier.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
