import { useState } from 'react';
import { analyzeRun } from './api/trainlensApi';
import { sampleRuns } from './data/sampleRuns';
import { SampleRunSelector } from './components/SampleRunSelector';
import { AnalysisSummary } from './components/AnalysisSummary';
import { AnomalyCard } from './components/AnomalyCard';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import { LossCurveChart } from './components/LossCurveChart';
import { ExportPostmortemButton } from './components/ExportPostmortemButton';
import { AnalysisLoadingCard } from './components/AnalysisLoadingCard';
import type { AnalyzeResponse, Anomaly } from './types/analysis';

export default function App() {
  const [selectedKey, setSelectedKey] = useState<string>(sampleRuns[0].key);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const currentRun = sampleRuns.find((r) => r.key === selectedKey) ?? sampleRuns[0];

  async function handleAnalyze() {
    const run = sampleRuns.find((r) => r.key === selectedKey);
    if (!run) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnomaly(null);

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
        <div className="app-header-inner">
          <h1>TrainLens AI</h1>
          <p>ML training run failure diagnosis</p>
        </div>
      </header>

      <main className="container">
        <SampleRunSelector
          selectedKey={selectedKey}
          onChange={(key) => {
            setSelectedKey(key);
            setResult(null);
            setError(null);
            setSelectedAnomaly(null);
          }}
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        {loading && <AnalysisLoadingCard />}

        {error && (
          <div className="error-banner">
            <strong>Connection error</strong>
            Could not connect to the analysis server. Please try again.
          </div>
        )}

        {!result && !loading && !error && (
          <div className="empty-state">
            <p className="empty-state-text">
              Select a sample run above and click <strong>Analyze</strong> to see anomaly detection results and diagnosis.
            </p>
          </div>
        )}

        {result && (
          <>
            <AnalysisSummary response={result} />

            <LossCurveChart
              metrics={currentRun.payload.metrics}
              anomalies={result.anomalies}
              selectedAnomaly={selectedAnomaly}
              onAnomalyClick={setSelectedAnomaly}
            />

            {result.anomalies.map((anomaly) => (
              <AnomalyCard
                key={anomaly.anomaly_type}
                anomaly={anomaly}
                isSelected={selectedAnomaly?.anomaly_type === anomaly.anomaly_type}
                onClick={() =>
                  setSelectedAnomaly((prev) =>
                    prev?.anomaly_type === anomaly.anomaly_type ? null : anomaly,
                  )
                }
              />
            ))}

            <DiagnosisPanel diagnosis={result.diagnosis} />

            <ExportPostmortemButton
              request={currentRun.payload}
              result={result}
              selectedAnomaly={selectedAnomaly}
            />
          </>
        )}
      </main>
    </>
  );
}
