import { sampleRuns } from '../data/sampleRuns';

interface Props {
  selectedKey: string;
  onChange: (key: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export function SampleRunSelector({ selectedKey, onChange, onAnalyze, loading }: Props) {
  return (
    <div className="card">
      <div className="card-title">Select a sample run</div>
      <p className="selector-helper">
        Choose a sample training run to diagnose. TrainLens will analyze it for anomalies and prepare an explanation.
      </p>
      <div className="selector-row">
        <select
          value={selectedKey}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        >
          {sampleRuns.map((run) => (
            <option key={run.key} value={run.key}>
              {run.label}
            </option>
          ))}
        </select>
        <button className="btn-analyze" onClick={onAnalyze} disabled={loading}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
    </div>
  );
}
