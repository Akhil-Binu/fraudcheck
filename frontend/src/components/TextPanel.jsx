import { useState, useMemo, useCallback } from 'react';
import {
  FileText,
  Copy,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';

function highlightText(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-400/30 text-amber-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function PageSection({ pageNum, text, searchQuery, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  const hasMatch =
    searchQuery && text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
          open ? 'bg-slate-800/80' : 'bg-slate-800/40 hover:bg-slate-800/60'
        }`}
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <span className="text-sm font-medium text-slate-200">
          Page {pageNum}
        </span>
        {hasMatch && (
          <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Match found
          </span>
        )}
      </button>
      {open && (
        <div className="p-4 bg-slate-900/50 border-t border-slate-700/50">
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {searchQuery ? highlightText(text, searchQuery) : text}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function TextPanel({ textData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Normalize text data to array of {page, text}
  const pages = useMemo(() => {
    if (!textData) return [];
    if (Array.isArray(textData)) {
      return textData.map((item, i) => ({
        page: item.page ?? i + 1,
        text: item.text || item.content || (typeof item === 'string' ? item : ''),
      }));
    }
    if (typeof textData === 'string') {
      return [{ page: 1, text: textData }];
    }
    if (Array.isArray(textData.page_texts) && textData.page_texts.length > 0) {
      return textData.page_texts.map((txt, i) => ({
        page: i + 1,
        text: txt || '',
      }));
    }
    if (textData.pages && Array.isArray(textData.pages) && textData.pages.length > 0) {
      return textData.pages.map((p, i) => ({
        page: p.page ?? i + 1,
        text: p.text || p.content || '',
      }));
    }
    if (textData.full_text) {
      return [{ page: 1, text: textData.full_text }];
    }
    if (textData.text) {
      return [{ page: 1, text: textData.text }];
    }
    return [];
  }, [textData]);

  const fullText = useMemo(() => pages.map((p) => p.text).join('\n\n'), [pages]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = fullText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullText]);

  if (!textData || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FileText className="w-12 h-12 mb-3 opacity-40" />
        <p>No extracted text available</p>
      </div>
    );
  }

  const matchCount = searchQuery
    ? pages.filter((p) =>
        p.text.toLowerCase().includes(searchQuery.toLowerCase())
      ).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with search & copy */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-slate-100">
          Extracted Text
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search text..."
              className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 w-48 sm:w-56"
            />
            {searchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {matchCount} page{matchCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Page sections */}
      <div className="space-y-3">
        {pages.map((page, i) => (
          <PageSection
            key={i}
            pageNum={page.page}
            text={page.text}
            searchQuery={searchQuery}
            defaultOpen={pages.length <= 3}
          />
        ))}
      </div>
    </div>
  );
}
