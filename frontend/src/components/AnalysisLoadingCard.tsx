import { useState, useEffect } from 'react';

const STATUSES = [
  'Reading the loss curve...',
  'Checking gradient behavior...',
  'Evaluating resource pressure...',
  'Building an evidence window...',
  'Preparing diagnosis and remediation steps...',
];

const FACTS = [
  'Loss divergence often appears after a sudden gradient norm spike.',
  'GPU underutilization can mean the data pipeline is slower than the model.',
  'OOM risk usually appears when memory usage crosses a sustained high-water mark.',
  'A validation-loss plateau can suggest stalled learning or reduced generalization improvement.',
  'Context windows help the diagnosis focus on evidence around the failure step.',
];

export function AnalysisLoadingCard() {
  const [statusIdx, setStatusIdx] = useState(0);
  const [factIdx,   setFactIdx]   = useState(0);

  useEffect(() => {
    const statusTimer = setInterval(
      () => setStatusIdx((i) => (i + 1) % STATUSES.length),
      1500,
    );
    const factTimer = setInterval(
      () => setFactIdx((i) => (i + 1) % FACTS.length),
      3000,
    );
    return () => {
      clearInterval(statusTimer);
      clearInterval(factTimer);
    };
  }, []);

  return (
    <div className="card loading-card">
      {/* Signal-bar animation + title */}
      <div className="loading-header">
        <div className="loading-bars" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
        <span className="loading-title">Analyzing</span>
      </div>

      {/* Rotating status — aria-live parent stays mounted so announcements fire */}
      <div className="loading-status" aria-live="polite">
        <span className="loading-text-fade" key={statusIdx}>
          {STATUSES[statusIdx]}
        </span>
      </div>

      {/* Rotating educational fact */}
      <div className="loading-fact-box">
        <span className="loading-fact-label">Did you know</span>
        <div className="loading-fact" aria-live="polite">
          <span className="loading-text-fade" key={`fact-${factIdx}`}>
            {FACTS[factIdx]}
          </span>
        </div>
      </div>
    </div>
  );
}
