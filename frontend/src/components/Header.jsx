import { ShieldCheck } from 'lucide-react';

export default function Header({ onReset, hasResult }) {
  return (
    <header className="bg-slate-900 border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                FraudCheck
              </h1>
              <p className="text-xs text-slate-400 -mt-0.5">
                Invoice &amp; Document Forensics
              </p>
            </div>
          </div>

          {hasResult && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              Analyze Another
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
