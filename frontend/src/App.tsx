import { useState } from 'react';
import { analyzeRun } from './api/trainlensApi';
import { sampleRuns } from './data/sampleRuns';
import { DataSourceCard } from './components/DataSourceCard';
import { AnalysisSummary } from './components/AnalysisSummary';
import { AnomalyCard } from './components/AnomalyCard';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import { LossCurveChart } from './components/LossCurveChart';
import { GpuUtilizationChart } from './components/GpuUtilizationChart';
import { MemoryUsageChart } from './components/MemoryUsageChart';
import { ExportPostmortemButton } from './components/ExportPostmortemButton';
import { AnalysisLoadingCard } from './components/AnalysisLoadingCard';
import { AskTrainLensCard } from './components/AskTrainLensCard';
import type { AnalyzeRequest, AnalyzeResponse, Anomaly } from './types/analysis';

type DataSourceMode = 'sample' | 'upload';

export default function App() {
  const [dataSourceMode, setDataSourceMode]   = useState<DataSourceMode>('sample');
  const [selectedKey, setSelectedKey]         = useState<string>(sampleRuns[0].key);
  const [uploadedPayload, setUploadedPayload] = useState<AnalyzeRequest | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [result, setResult]                   = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  // Increments on each completed analysis — forces AskTrainLensCard to remount and clear its state.
  const [analysisKey, setAnalysisKey]         = useState(0);

  const currentSampleRun = sampleRuns.find((r) => r.key === selectedKey) ?? sampleRuns[0];
  const activePayload    = uploadedPayload ?? currentSampleRun.payload;

  const canAnalyze   = dataSourceMode === 'sample' || uploadedPayload !== null;
  const analyzeLabel = loading
    ? 'Analyzing…'
    : dataSourceMode === 'upload' && uploadedFileName
      ? `Analyze · ${uploadedFileName}`
      : `Analyze · ${currentSampleRun.label}`;

  function clearAnalysis() {
    setResult(null);
    setError(null);
    setSelectedAnomaly(null);
  }

  function handleModeChange(mode: DataSourceMode) {
    setDataSourceMode(mode);
    if (mode === 'sample') {
      setUploadedPayload(null);
      setUploadedFileName(null);
    }
    clearAnalysis();
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnomaly(null);

    try {
      const data = await analyzeRun(activePayload);
      setResult(data);
      setAnalysisKey((k) => k + 1);
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
          <p>Your intelligent debugging companion for ML training failures.</p>
        </div>
      </header>

      <main className="container">
        <DataSourceCard
          mode={dataSourceMode}
          onModeChange={handleModeChange}
          selectedKey={selectedKey}
          onSelectedKeyChange={(key) => {
            setSelectedKey(key);
            clearAnalysis();
          }}
          uploadedFileName={uploadedFileName}
          onUpload={(payload, fileName) => {
            setUploadedPayload(payload);
            setUploadedFileName(fileName);
            clearAnalysis();
          }}
          onUploadClear={() => {
            setUploadedPayload(null);
            setUploadedFileName(null);
            clearAnalysis();
          }}
          loading={loading}
        />

        <div className="analyze-action">
          <button
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={loading || !canAnalyze}
          >
            {analyzeLabel}
          </button>
          {dataSourceMode === 'upload' && !uploadedPayload && !loading && (
            <span className="analyze-hint">Upload a JSON file above to enable analysis</span>
          )}
        </div>

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
              No run analyzed yet.<br /><br />
              Select a sample run or upload a JSON file above, then click{' '}
              <strong>Analyze</strong>. TrainLens will detect anomalies, build an
              evidence window, and guide you toward a fix.
            </p>
          </div>
        )}

        {result && (
          <div className="results-layout">
            <div className="results-main">
              <AnalysisSummary response={result} />

              <LossCurveChart
                metrics={activePayload.metrics}
                anomalies={result.anomalies}
                selectedAnomaly={selectedAnomaly}
                onAnomalyClick={setSelectedAnomaly}
              />

              <div className="section-nav">
                <span className="section-nav-label">Resource signals</span>
              </div>
              <p className="section-helper-text">
                GPU and memory traces help explain infrastructure-related anomalies.
              </p>
              <div className="resource-charts-grid">
                <GpuUtilizationChart
                  metrics={activePayload.metrics}
                  anomalies={result.anomalies}
                  selectedAnomaly={selectedAnomaly}
                  onAnomalyClick={setSelectedAnomaly}
                />
                <MemoryUsageChart
                  metrics={activePayload.metrics}
                  anomalies={result.anomalies}
                  selectedAnomaly={selectedAnomaly}
                  onAnomalyClick={setSelectedAnomaly}
                />
              </div>

              {result.anomalies.length > 0 && (
                <div className="section-nav">
                  <span className="section-nav-label">What happened</span>
                </div>
              )}

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

              <div className="section-nav">
                <span className="section-nav-label">Why it happened</span>
              </div>

              <DiagnosisPanel diagnosis={result.diagnosis} />

              <ExportPostmortemButton
                request={activePayload}
                result={result}
                selectedAnomaly={selectedAnomaly}
              />
            </div>

            <aside className="results-sidebar">
              <AskTrainLensCard key={analysisKey} result={result} />
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
