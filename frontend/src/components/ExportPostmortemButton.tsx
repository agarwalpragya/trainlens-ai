import type { AnalyzeRequest, AnalyzeResponse, Anomaly } from '../types/analysis';
import { downloadPostmortem, ANOMALY_LABELS } from '../utils/postmortem';

interface Props {
  request: AnalyzeRequest;
  result: AnalyzeResponse;
  selectedAnomaly: Anomaly | null;
}

export function ExportPostmortemButton({ request, result, selectedAnomaly }: Props) {
  return (
    <div className="card export-row">
      <button
        className="btn-export"
        onClick={() => downloadPostmortem(request, result, selectedAnomaly)}
      >
        Export Postmortem
      </button>
      <span className="export-hint">
        Downloads a Markdown report
        {selectedAnomaly
          ? ` for ${ANOMALY_LABELS[selectedAnomaly.anomaly_type] ?? selectedAnomaly.anomaly_type}`
          : ''}
      </span>
    </div>
  );
}
