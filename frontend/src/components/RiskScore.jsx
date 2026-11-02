import { useEffect, useState, useRef } from 'react';

const LEVELS = [
  { max: 25, label: 'Low Risk', color: '#22c55e', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { max: 50, label: 'Medium Risk', color: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  { max: 75, label: 'High Risk', color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { max: 100, label: 'Critical', color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
];

function getLevel(score) {
  return LEVELS.find((l) => score <= l.max) || LEVELS[3];
}

export default function RiskScore({ score = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef(null);

  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const size = (radius + stroke) * 2;

  useEffect(() => {
    let start = null;
    const duration = 1200;
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

  const level = getLevel(animatedScore);
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={stroke}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={level.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-100"
            style={{
              filter: `drop-shadow(0 0 6px ${level.color}40)`,
            }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold"
            style={{ color: level.color }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <div
        className={`mt-4 px-4 py-1.5 rounded-full text-sm font-semibold ${level.bg} ${level.text} ${level.border} border`}
      >
        {level.label}
      </div>
    </div>
  );
}
