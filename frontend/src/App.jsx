import { useState, useCallback } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import AnalysisDashboard from './components/AnalysisDashboard';
import { analyzeDocument, analyzeSample } from './api';

export default function App() {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeDocument(selectedFile);
      setAnalysisResult(result);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'ANALYSIS FAILED: PLEASE VERIFY FILE INTEGRITY AND RETRY.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSampleSelect = useCallback(async (sampleId) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeSample(sampleId);
      setAnalysisResult(result);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'FAILED TO EXECUTE DEMO FORENSIC SAMPLE.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setAnalysisResult(null);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-grid-pattern text-[#EDEDED] flex flex-col justify-between selection:bg-[#FF3333] selection:text-white">
      <div>
        <Header onReset={handleReset} hasResult={!!analysisResult} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {!analysisResult ? (
            <UploadZone
              onUpload={handleUpload}
              onSelectSample={handleSampleSelect}
              loading={loading}
              error={error}
            />
          ) : (
            <AnalysisDashboard result={analysisResult} />
          )}
        </main>
      </div>

      {/* Swiss Style Architectural Footer */}
      <footer className="border-t border-[#222222] bg-[#0A0A0A] mt-16 font-mono text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#FF3333]"></span>
              <span className="text-white font-bold tracking-tight uppercase">
                FRAUDCHECK LABS
              </span>
              <span className="text-neutral-600">//</span>
              <span className="text-[11px] text-neutral-400">
                BUILT BY{' '}
                <a
                  href="https://github.com/Akhil-Binu"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white font-bold hover:text-[#FF3333] transition-colors underline decoration-neutral-700 underline-offset-4"
                >
                  AKHIL BINU
                </a>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <a
                href="https://github.com/Akhil-Binu/fraudcheck"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                [ GITHUB REPOSITORY ]
              </a>
              <span className="text-neutral-700">•</span>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                [ FASTAPI SWAGGER ]
              </a>
              <span className="text-neutral-700">•</span>
              <span className="text-neutral-400">
                ZERO PERSISTENCE MEMORY
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
