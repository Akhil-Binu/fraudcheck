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
        'Analysis failed. Please try again.';
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
        'Failed to analyze demo sample.';
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header onReset={handleReset} hasResult={!!analysisResult} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  );
}
