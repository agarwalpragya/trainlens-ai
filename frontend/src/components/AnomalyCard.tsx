import type { Anomaly } from '../types/analysis';

interface Props {
  anomaly: Anomaly;
  isSelected?: boolean;
  onClick?: () => void;
}

const ANOMALY_LABELS: Record<string, string> = {
  loss_divergence: 'Loss Divergence',
  vanishing_gradients: 'Vanishing Gradients',
  gpu_underutilization: 'GPU Underutilization',
  oom_risk: 'OOM Risk',
  training_stall: 'Training Stall',
};

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    // Show integers without decimals, floats up to 6 significant digits.
    return Number.isInteger(value) ? String(value) : parseFloat(value.toPrecision(6)).toString();
  }
  return String(value);
}

export function AnomalyCard({ anomaly, isSelected, onClick }: Props) {
  const { anomaly_type, detected_at_step, severity, confidence, relevant_metrics } = anomaly;
  const label = ANOMALY_LABELS[anomaly_type] ?? anomaly_type;

  return (
    <div
      className={`anomaly-card ${severity}${isSelected ? ' selected' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="anomaly-header">
        <span className="anomaly-type">{label}</span>
        <div className="anomaly-meta">
          <span className={`badge ${severity}`}>{severity}</span>
          <span className="anomaly-step">Step {detected_at_step}</span>
          <span className="anomaly-confidence">
            Confidence {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>
      {Object.keys(relevant_metrics).length > 0 && (
        <div className="anomaly-metrics">
          <table className="metrics-table">
            <tbody>
              {Object.entries(relevant_metrics).map(([key, value]) => (
                <tr key={key}>
                  <td>{formatKey(key)}</td>
                  <td>{formatValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
