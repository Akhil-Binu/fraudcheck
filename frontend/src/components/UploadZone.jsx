import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function UploadZone({ onUpload, onSelectSample, loading, error }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
      return 'Invalid file type. Please upload a PDF or image (PNG, JPG).';
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (f) => {
      setFileError(null);
      const err = validateFile(f);
      if (err) {
        setFileError(err);
        setFile(null);
        return;
      }
      setFile(f);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e) => {
      const f = e.target.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(() => {
    if (file && onUpload) onUpload(file);
  }, [file, onUpload]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="w-16 h-16 text-emerald-400 animate-spin relative" />
        </div>
        <p className="mt-6 text-lg font-medium text-slate-200">
          Analyzing document...
        </p>
        <p className="mt-2 text-sm text-slate-400">
          This may take a moment for large files
        </p>
        <div className="mt-6 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500/60 rounded-full animate-[loading_2s_ease-in-out_infinite]" 
               style={{ animation: 'loading 2s ease-in-out infinite' }} />
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 80%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        className={`
          relative w-full max-w-xl border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all duration-300 cursor-pointer
          ${
            dragOver
              ? 'border-emerald-400 bg-emerald-500/5 scale-[1.02]'
              : file
              ? 'border-slate-600 bg-slate-900/50'
              : 'border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
              <Upload
                className={`w-8 h-8 transition-colors duration-200 ${
                  dragOver ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
            </div>
            <p className="text-lg font-medium text-slate-200 mb-1">
              Drop your invoice here
            </p>
            <p className="text-sm text-slate-400 mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-slate-500">
              Supports PDF, PNG, JPG &bull; Max 20MB
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 text-left">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              className="mt-6 w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Analyze Document
            </button>
          </>
        )}
      </div>

      {(fileError || error) && (
        <div className="mt-4 max-w-xl w-full flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{fileError || error}</p>
        </div>
      )}

      {/* Demo sample test cases */}
      <div className="mt-8 max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Or test with forensic demo samples:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onSelectSample?.('legitimate_invoice.pdf')}
            className="group flex flex-col text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Authentic
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Standard Invoice</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Clean accounting PDF with genuine IBAN & timestamps.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectSample?.('bfl_tampered_invoice.pdf')}
            className="group flex flex-col text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                BFL Spliced
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Font Injection</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Spliced text, injected subset font & 5-year timeline gap.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectSample?.('tampered_invoice.pdf')}
            className="group flex flex-col text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                Spoofed PDF
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Wire Redirection</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Photoshop edited PDF with fake IBAN checksum failure.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectSample?.('spliced_invoice.jpg')}
            className="group flex flex-col text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Scanned Image
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Digital Splice</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Scanned document image with spliced text overlay.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
