import { useState } from 'react';
import {
  Gauge,
  FileText,
  Eye,
  CreditCard,
  AlignLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import RiskScore from './RiskScore';
import MetadataPanel from './MetadataPanel';
import ELAViewer from './ELAViewer';
import ValidationPanel from './ValidationPanel';
import TextPanel from './TextPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'metadata', label: 'Metadata', icon: FileText },
  { id: 'ela', label: 'ELA Analysis', icon: Eye },
  { id: 'validation', label: 'Validation', icon: CreditCard },
  { id: 'text', label: 'Extracted Text', icon: AlignLeft },
];

function riskColor(level) {
  const map = {
    low: 'text-emerald-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };
  return map[level] || 'text-slate-400';
}

function riskBg(level) {
  const map = {
    low: 'bg-emerald-500/10 border-emerald-500/20',
    medium: 'bg-yellow-500/10 border-yellow-500/20',
    high: 'bg-orange-500/10 border-orange-500/20',
    critical: 'bg-red-500/10 border-red-500/20',
  };
  return map[level] || 'bg-slate-800/50 border-slate-700/50';
}

function SummaryCard({ title, riskLevel, icon: Icon, flagCount }) {
  const safeLevel = riskLevel || 'low';
  return (
    <div
      className={`p-4 rounded-xl border ${riskBg(safeLevel)} flex items-start gap-3`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${riskColor(safeLevel)}`} />
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className={`text-xs font-semibold mt-1 ${riskColor(safeLevel)}`}>
          {safeLevel.charAt(0).toUpperCase() + safeLevel.slice(1)} Risk
        </p>
        {flagCount > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">
            {flagCount} issue{flagCount !== 1 ? 's' : ''} detected
          </p>
        )}
      </div>
    </div>
  );
}

export default function AnalysisDashboard({ result }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!result) return null;

  const overallScore = result.overall_risk_score ?? result.risk_score ?? 0;

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex overflow-x-auto gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === id
                ? 'bg-slate-700/80 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Risk score */}
            <div className="flex flex-col items-center">
              <RiskScore score={overallScore} />
              <p className="mt-4 text-sm text-slate-400 text-center max-w-md">
                This score is calculated from metadata analysis, error level
                analysis, and financial identifier validation.
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Metadata"
                riskLevel={result.metadata?.risk_level}
                icon={FileText}
                flagCount={result.metadata?.suspicious_flags?.length || 0}
              />
              <SummaryCard
                title="ELA Analysis"
                riskLevel={result.ela?.risk_level}
                icon={Eye}
                flagCount={result.ela?.suspicious_regions || result.ela?.suspicious_flags?.length || 0}
              />
              <SummaryCard
                title="Validation"
                riskLevel={result.validation?.risk_level}
                icon={CreditCard}
                flagCount={
                  (result.validation?.matches || result.validation?.identifiers || []).filter(
                    (id) => !(id.valid ?? id.is_valid)
                  ).length
                }
              />
              <SummaryCard
                title="Text Extraction"
                riskLevel="low"
                icon={AlignLeft}
                flagCount={0}
              />
            </div>

            {/* Overall suspicious flags */}
            {(() => {
              const allFlags = Array.from(
                new Set([
                  ...(result.suspicious_flags || []),
                  ...(result.metadata?.suspicious_flags || []),
                  ...(result.ela?.suspicious_flags || []),
                  ...(result.validation?.suspicious_flags || []),
                ])
              );

              if (allFlags.length === 0) {
                return (
                  <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-200">
                        No critical issues detected
                      </p>
                      <p className="text-xs text-emerald-300/60 mt-0.5">
                        Review individual sections for detailed findings.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Key Findings ({allFlags.length})
                  </h4>
                  {allFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-200">{flag}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'metadata' && (
          <MetadataPanel metadata={result.metadata} />
        )}

        {activeTab === 'ela' && <ELAViewer ela={result.ela} />}

        {activeTab === 'validation' && (
          <ValidationPanel validation={result.validation} />
        )}

        {activeTab === 'text' && <TextPanel textData={result.text} />}
      </div>
    </div>
  );
}
