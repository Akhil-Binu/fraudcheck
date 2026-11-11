import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function Header({ onReset, hasResult }) {
  return (
    <header className="border-b border-[#222222] bg-[#0A0A0A]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#FF3333] text-black font-black flex items-center justify-center text-sm font-mono shadow-sm">
              FC
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white uppercase font-sans">
                  FRAUDCHECK
                </span>
                <span className="text-neutral-600 font-mono text-xs">//</span>
                <span className="hidden sm:inline-block font-mono text-[11px] text-[#FF3333] tracking-widest uppercase font-semibold">
                  FORENSIC DOC INTEL
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase -mt-0.5">
                SWISS FORENSIC AUDIT SPEC 4.2
              </span>
            </div>
          </div>

          {/* Right telemetry & action */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-neutral-400 border border-[#222222] px-2.5 py-1 bg-[#111111]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="tracking-widest uppercase">ENGINE: ARMED</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">95% ELA JET</span>
            </div>

            {hasResult && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold tracking-wider uppercase text-white bg-transparent border border-neutral-700 hover:border-white hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>NEW AUDIT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
