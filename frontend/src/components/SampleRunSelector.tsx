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
