import type { AnalyzeResponse } from '../types/analysis';

interface Props {
  response: AnalyzeResponse;
}

export function AnalysisSummary({ response }: Props) {
  const { run_name, summary } = response;
  const { total_steps, anomalies_detected } = summary;

  return (
    <div className="card">
      <div className="card-title">Run summary</div>
      <div className="summary-stats">
        <div className="stat">
          <span className="stat-label">Run name</span>
          <span className="stat-value run-name">{run_name}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Steps</span>
          <span className="stat-value">{total_steps}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Anomalies detected</span>
          <span className={`stat-value ${anomalies_detected === 0 ? 'zero' : 'nonzero'}`}>
            {anomalies_detected}
          </span>
        </div>
      </div>
    </div>
  );
}
