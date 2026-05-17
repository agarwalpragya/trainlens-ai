import { useState } from 'react';
import { analyzeRun } from './api/trainlensApi';
import { sampleRuns } from './data/sampleRuns';
import { SampleRunSelector } from './components/SampleRunSelector';
import { AnalysisSummary } from './components/AnalysisSummary';
import { AnomalyCard } from './components/AnomalyCard';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import type { AnalyzeResponse } from './types/analysis';

export default function App() {
  const [selectedKey, setSelectedKey] = useState<string>(sampleRuns[0].key);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    const run = sampleRuns.find((r) => r.key === selectedKey);
    if (!run) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeRun(run.payload);
      setResult(data);
    } catch {
      setError(
        'Could not reach the backend. Make sure the API server is running on port 8000.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>TrainLens AI</h1>
        <p>ML training run failure diagnosis</p>
      </header>

      <main className="container">
        <SampleRunSelector
          selectedKey={selectedKey}
          onChange={(key) => {
            setSelectedKey(key);
            setResult(null);
            setError(null);
          }}
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        {loading && (
          <div className="status-loading">
            <span className="spinner" />
            Analyzing run…
          </div>
        )}

        {error && (
          <div className="error-banner">
            <strong>Backend unavailable</strong>
            {error}
          </div>
        )}

        {result && (
          <>
            <AnalysisSummary response={result} />

            {result.anomalies.map((anomaly) => (
              <AnomalyCard key={anomaly.anomaly_type} anomaly={anomaly} />
            ))}

            <DiagnosisPanel diagnosis={result.diagnosis} />
          </>
        )}
      </main>
    </>
  );
}
