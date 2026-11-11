import { useState } from 'react';
import {
  Gauge,
  FileText,
  Eye,
  CreditCard,
  AlignLeft,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Layers
} from 'lucide-react';
import RiskScore from './RiskScore';
import MetadataPanel from './MetadataPanel';
import ELAViewer from './ELAViewer';
import ValidationPanel from './ValidationPanel';
import TextPanel from './TextPanel';

const TABS = [
  { id: 'overview', index: '01', label: 'EXECUTIVE SUMMARY', icon: Gauge },
  { id: 'metadata', index: '02', label: 'PDF METADATA & ENGINE', icon: FileText },
  { id: 'ela', index: '03', label: 'ERROR LEVEL ANALYSIS', icon: Eye },
  { id: 'validation', index: '04', label: 'FINANCIAL CHECKSUMS', icon: CreditCard },
  { id: 'text', index: '05', label: 'RAW EXTRACTED TEXT', icon: AlignLeft },
];

function getVerdictInfo(level) {
  const norm = (level || 'low').toLowerCase();
  if (norm === 'critical') {
    return {
      title: 'REJECT PAYMENT // CRITICAL TAMPERING VERIFIED',
      desc: 'Document exhibits multi-vector manipulation (injected font subsets, impossible timeline gaps, or checksum spoofing).',
      stamp: 'REJECTED: FORGERY CONFIRMED',
      border: 'border-[#FF3333]',
      text: 'text-[#FF3333]',
      bg: 'bg-[#FF3333]/10',
      badge: 'bg-[#FF3333] text-black font-black'
    };
  }
  if (norm === 'high') {
    return {
      title: 'HOLD PAYMENT // HIGH RISK OF SPOOFING',
      desc: 'Severe irregularities detected in document metadata or binary structure (e.g. Photoshop footprint or altered totals).',
      stamp: 'SUSPECTED TAMPERING',
      border: 'border-orange-500',
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      badge: 'bg-orange-500 text-black font-bold'
    };
  }
  if (norm === 'medium') {
    return {
      title: 'MANUAL REVIEW REQUIRED // IRREGULARITIES DETECTED',
      desc: 'Compression discrepancies or unverified identifier formats present. Secondary verification recommended.',
      stamp: 'ANOMALIES PRESENT',
      border: 'border-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      badge: 'bg-amber-500 text-black font-bold'
    };
  }
  return {
    title: 'PAYMENT APPROVED // INTEGRITY VERIFIED',
    desc: 'Document passes structural metadata consistency, ELA visual compression tests, and all banking checksums.',
    stamp: 'VERIFIED AUTHENTIC',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500 text-black font-bold'
  };
}

export default function AnalysisDashboard({ result }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!result) return null;

  const overallScore = result.overall_risk_score ?? result.risk_score ?? 0;
  const riskLevel = result.overall_risk_level || (overallScore >= 75 ? 'critical' : overallScore >= 50 ? 'high' : overallScore >= 25 ? 'medium' : 'low');
  const verdict = getVerdictInfo(riskLevel);
  const flags = result.suspicious_flags || [];

  return (
    <div className="space-y-8">
      {/* ── Document Technical Passport / Header ───────────────────────── */}
      <div className="border border-[#2D2D2D] bg-[#0E0E0E] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#222222] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400 uppercase">
              <span className="w-2 h-2 bg-[#FF3333]"></span>
              <span>AUDIT REPORT // PASSPORT ID: {result.filename}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
              {result.filename}
            </h2>
            <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-xs text-neutral-400">
              <span>FORMAT: <strong className="text-white uppercase">{result.file_type || 'PDF'}</strong></span>
              <span className="text-neutral-600">|</span>
              <span>SIZE: <strong className="text-white">{result.metadata?.file_size || 'N/A'}</strong></span>
              <span className="text-neutral-600">|</span>
              <span>PAGES: <strong className="text-white">{result.metadata?.page_count || 1}</strong></span>
              <span className="text-neutral-600">|</span>
              <span>TIMESTAMP: <strong className="text-white">{new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC</strong></span>
            </div>
          </div>

          {/* Official Swiss Verdict Stamp */}
          <div className="text-left lg:text-right shrink-0">
            <div className={`inline-block border-2 ${verdict.border} ${verdict.bg} px-4 py-2 font-mono text-left`}>
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest">// OFFICIAL AUDIT STAMP</div>
              <div className={`text-sm font-black tracking-widest uppercase ${verdict.text}`}>
                [ {verdict.stamp} ]
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Executive Guideline Banner */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 text-[10px] uppercase font-mono ${verdict.badge}`}>
              ACTION
            </span>
            <span className="font-bold text-white uppercase tracking-wider">{verdict.title}</span>
          </div>
          <div className="text-neutral-400 text-[11px]">
            {flags.length} ANOMAL{flags.length === 1 ? 'Y' : 'IES'} REGISTERED
          </div>
        </div>
      </div>

      {/* ── Swiss Architectural Navigation Bar ────────────────────────── */}
      <div className="border border-[#222222] bg-[#0E0E0E]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-[#222222]">
          {TABS.map(({ id, index, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`p-3.5 text-left font-mono transition-all flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold'
                    : 'bg-transparent text-neutral-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span>// {index}</span>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs uppercase tracking-tight truncate">
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content Panels ────────────────────────────────────────── */}
      <div className="border border-[#222222] bg-[#0E0E0E] p-6 lg:p-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Split Grid: Instrument Dial vs Forensic Flags Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Dial Gauge */}
              <div className="lg:col-span-5 p-6 border border-[#222222] bg-[#121212]">
                <RiskScore score={overallScore} />
              </div>

              {/* Flags Ledger */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-[#222222] pb-2 font-mono text-xs text-neutral-400 uppercase tracking-wider">
                  <span>// FORENSIC INCIDENT LEDGER</span>
                  <span>{flags.length} ITEM{flags.length !== 1 ? 'S' : ''} DETECTED</span>
                </div>

                {flags.length === 0 ? (
                  <div className="p-8 border border-emerald-500/30 bg-emerald-500/5 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-mono text-sm font-bold text-white uppercase">
                      ZERO ANOMALIES DETECTED
                    </p>
                    <p className="font-mono text-xs text-neutral-400 max-w-md mx-auto">
                      All metadata structures, ELA compression matrices, and financial format checksums conform to genuine authentic baselines.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {flags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 border border-[#262626] bg-[#141414] flex items-start gap-3 font-mono text-xs"
                      >
                        <div className="w-5 h-5 bg-[#FF3333] text-black font-black flex items-center justify-center shrink-0 text-[10px]">
                          !
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                              FINDING 0{idx + 1}
                            </span>
                            <span className="text-neutral-600">|</span>
                            <span className="text-[10px] text-[#FF3333] font-bold uppercase">
                              SUSPICIOUS ARTIFACT
                            </span>
                          </div>
                          <p className="text-white font-sans text-xs sm:text-sm font-medium leading-snug">
                            {flag}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metric Vectors Ledger (4 Modules) */}
            <div className="space-y-3 pt-4 border-t border-[#222222]">
              <div className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                // FORENSIC VECTOR TELEMETRY BREAKDOWN
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                {/* 1. Metadata */}
                <div
                  onClick={() => setActiveTab('metadata')}
                  className="p-4 border border-[#222222] bg-[#121212] hover:border-white transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>VECTOR 01</span>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white uppercase">METADATA AUDIT</div>
                  <div className="pt-2 border-t border-[#1F1F1F] text-[10px] flex justify-between">
                    <span className="text-neutral-400">STATUS:</span>
                    <span className={result.metadata?.risk_level === 'high' || result.metadata?.risk_level === 'critical' ? 'text-[#FF3333] font-bold' : 'text-emerald-400'}>
                      {(result.metadata?.risk_level || 'LOW').toUpperCase()} RISK
                    </span>
                  </div>
                </div>

                {/* 2. Visual ELA */}
                <div
                  onClick={() => setActiveTab('ela')}
                  className="p-4 border border-[#222222] bg-[#121212] hover:border-white transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>VECTOR 02</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white uppercase">VISUAL ELA FORENSICS</div>
                  <div className="pt-2 border-t border-[#1F1F1F] text-[10px] flex justify-between">
                    <span className="text-neutral-400">MAX DELTA:</span>
                    <span className="text-white font-bold">{result.ela?.max_difference?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>

                {/* 3. Checksums */}
                <div
                  onClick={() => setActiveTab('validation')}
                  className="p-4 border border-[#222222] bg-[#121212] hover:border-white transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>VECTOR 03</span>
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white uppercase">CHECKSUM VALIDATION</div>
                  <div className="pt-2 border-t border-[#1F1F1F] text-[10px] flex justify-between">
                    <span className="text-neutral-400">IDENTIFIERS:</span>
                    <span className="text-white font-bold">{(result.validation?.matches || result.validation?.identifiers || []).length} DETECTED</span>
                  </div>
                </div>

                {/* 4. Text Content */}
                <div
                  onClick={() => setActiveTab('text')}
                  className="p-4 border border-[#222222] bg-[#121212] hover:border-white transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>VECTOR 04</span>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white uppercase">DOCUMENT TEXT EXTRACT</div>
                  <div className="pt-2 border-t border-[#1F1F1F] text-[10px] flex justify-between">
                    <span className="text-neutral-400">PAGES:</span>
                    <span className="text-white font-bold">{result.metadata?.page_count || 1} PAGE(S)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* METADATA TAB */}
        {activeTab === 'metadata' && <MetadataPanel metadata={result.metadata} />}

        {/* ELA TAB */}
        {activeTab === 'ela' && <ELAViewer ela={result.ela} />}

        {/* VALIDATION TAB */}
        {activeTab === 'validation' && <ValidationPanel validation={result.validation} />}

        {/* TEXT TAB */}
        {activeTab === 'text' && <TextPanel textData={result.text} />}
      </div>
    </div>
  );
}
