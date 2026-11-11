import { useState, useMemo } from 'react';
import { Copy, Check, Search, Layers, FileText } from 'lucide-react';

export default function TextPanel({ textData }) {
  const [copied, setCopied] = useState(false);
  const [selectedPage, setSelectedPage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fullText = textData?.full_text || textData?.text || '';
  const pageTexts = textData?.page_texts || (textData?.pages?.map((p) => p.text) || []);

  const activeText = useMemo(() => {
    if (selectedPage === 'all') return fullText;
    const pageIndex = parseInt(selectedPage, 10);
    return pageTexts[pageIndex] || fullText;
  }, [selectedPage, fullText, pageTexts]);

  const lines = useMemo(() => {
    if (!activeText) return [];
    const rawLines = activeText.split('\n');
    if (!searchQuery.trim()) return rawLines;
    const q = searchQuery.toLowerCase();
    return rawLines.map((line) => (line.toLowerCase().includes(q) ? line : ''));
  }, [activeText, searchQuery]);

  const handleCopy = () => {
    if (!activeText) return;
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!fullText) {
    return (
      <div className="py-16 text-center font-mono text-xs text-neutral-400">
        // NO EXTRACTABLE TEXT FOUND IN DOCUMENT STREAM
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div>
          <span className="text-[11px] text-neutral-400 uppercase tracking-widest block">
            // TELEMETRY MODULE 05
          </span>
          <h3 className="text-xl font-black uppercase tracking-tight text-white font-sans mt-0.5">
            EXTRACTED DOCUMENT TEXT STREAM
          </h3>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3.5 py-1.5 border border-neutral-700 hover:border-white hover:bg-white hover:text-black text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY ALL TEXT'}</span>
        </button>
      </div>

      {/* Controls Bar: Page filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Page selector */}
        {pageTexts.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] text-neutral-500 uppercase mr-1">VIEW:</span>
            <button
              onClick={() => setSelectedPage('all')}
              className={`px-3 py-1 border text-xs uppercase tracking-wider transition-all cursor-pointer ${
                selectedPage === 'all'
                  ? 'border-white bg-white text-black font-bold'
                  : 'border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
              }`}
            >
              ALL PAGES
            </button>
            {pageTexts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPage(String(idx))}
                className={`px-3 py-1 border text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedPage === String(idx)
                    ? 'border-white bg-white text-black font-bold'
                    : 'border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
                }`}
              >
                PAGE 0{idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Filter / Search input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER KEYWORDS..."
            className="w-full bg-[#121212] border border-[#262626] py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white uppercase"
          />
        </div>
      </div>

      {/* Transcript Ledger View */}
      <div className="border border-[#222222] bg-[#0A0A0A] p-4 max-h-[500px] overflow-y-auto">
        <div className="space-y-1 text-xs leading-relaxed">
          {lines.map((line, idx) => {
            if (searchQuery.trim() && !line) return null;
            return (
              <div key={idx} className="flex items-start gap-4 hover:bg-[#141414] px-1 py-0.5">
                <span className="text-[10px] text-neutral-600 select-none w-8 text-right shrink-0">
                  {String(idx + 1).padStart(3, '0')}
                </span>
                <span className="text-neutral-200 break-words flex-1 font-mono">
                  {line || <span className="opacity-0">.</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
