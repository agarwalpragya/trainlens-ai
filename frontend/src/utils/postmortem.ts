import type { AnalyzeRequest, AnalyzeResponse, Anomaly } from '../types/analysis';

export const ANOMALY_LABELS: Record<string, string> = {
  loss_divergence:    'Loss Divergence',
  vanishing_gradients:'Vanishing Gradients',
  gpu_underutilization:'GPU Underutilization',
  oom_risk:           'OOM Risk',
  training_stall:     'Training Stall',
};

// Columns rendered in the context-window table, in order.
const CONTEXT_COLS = [
  'step', 'train_loss', 'val_loss', 'gpu_utilization_percent',
  'memory_used_gb', 'memory_total_gb', 'gradient_norm', 'learning_rate',
] as const;

const CONTEXT_HEADERS = [
  'Step', 'Train Loss', 'Val Loss', 'GPU %',
  'Mem Used (GB)', 'Mem Total (GB)', 'Gradient Norm', 'Learning Rate',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : parseFloat(v.toPrecision(6)).toString();
  }
  return String(v);
}

function mdTable(rows: Record<string, unknown>[], cols: readonly string[], headers: string[]): string {
  const head = `| ${headers.join(' | ')} |`;
  const sep  = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${cols.map((c) => fmt(row[c])).join(' | ')} |`)
    .join('\n');
  return `${head}\n${sep}\n${body}`;
}

function fmtTimestamp(date: Date): string {
  return date.toUTCString().replace('GMT', 'UTC');
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function safeFilename(runName: string): string {
  const slug = runName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `trainlens-postmortem-${slug}.md`;
}

// ── Markdown generator ────────────────────────────────────────────────────────

export function generatePostmortem(
  request: AnalyzeRequest,
  result: AnalyzeResponse,
  selectedAnomaly: Anomaly | null,
): string {
  const primaryAnomaly = selectedAnomaly ?? result.anomalies[0] ?? null;
  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push('# TrainLens AI Postmortem');
  lines.push('');
  lines.push(`**Generated:** ${fmtTimestamp(new Date())}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Run summary ───────────────────────────────────────────────────────────
  lines.push('## Run Summary');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Run name | ${result.run_name} |`);
  lines.push(`| Total steps | ${result.summary.total_steps} |`);
  lines.push(`| Anomalies detected | ${result.summary.anomalies_detected} |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Primary anomaly ───────────────────────────────────────────────────────
  lines.push('## Primary Anomaly');
  lines.push('');

  if (!primaryAnomaly) {
    lines.push('_No major anomaly detected. Training run appears stable._');
  } else {
    const label = ANOMALY_LABELS[primaryAnomaly.anomaly_type] ?? primaryAnomaly.anomaly_type;
    lines.push('| Field | Value |');
    lines.push('| --- | --- |');
    lines.push(`| Type | ${label} |`);
    lines.push(`| Detected at step | ${primaryAnomaly.detected_at_step} |`);
    lines.push(`| Severity | ${titleCase(primaryAnomaly.severity)} |`);
    lines.push(`| Confidence | ${Math.round(primaryAnomaly.confidence * 100)}% |`);

    const metricEntries = Object.entries(primaryAnomaly.relevant_metrics);
    if (metricEntries.length > 0) {
      lines.push('');
      lines.push('### Relevant Metrics');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('| --- | --- |');
      for (const [key, value] of metricEntries) {
        const metricLabel = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        lines.push(`| ${metricLabel} | ${fmt(value)} |`);
      }
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Diagnosis ─────────────────────────────────────────────────────────────
  lines.push('## Diagnosis');
  lines.push('');
  lines.push(`**Headline:** ${result.diagnosis.headline}`);
  lines.push('');
  lines.push(`**Root cause:** ${result.diagnosis.root_cause}`);
  lines.push('');
  lines.push(`**Explanation:** ${result.diagnosis.explanation}`);
  lines.push('');

  if (result.diagnosis.remediation_steps.length > 0) {
    lines.push('### Remediation Steps');
    lines.push('');
    result.diagnosis.remediation_steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
  } else {
    lines.push('_No remediation steps needed._');
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Context window ────────────────────────────────────────────────────────
  lines.push('## Context Window');
  lines.push('');

  // For anomaly runs: use the context_window attached to the anomaly.
  // For healthy runs: use the full metrics from the request payload.
  const contextRows: Record<string, unknown>[] = primaryAnomaly
    ? primaryAnomaly.context_window
    : (request.metrics as unknown as Record<string, unknown>[]);

  if (contextRows.length === 0) {
    lines.push('_No context data available._');
  } else {
    lines.push(mdTable(contextRows, CONTEXT_COLS, CONTEXT_HEADERS));
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('_Generated by TrainLens AI_');
  lines.push('');

  return lines.join('\n');
}

// ── Download trigger ──────────────────────────────────────────────────────────

export function downloadPostmortem(
  request: AnalyzeRequest,
  result: AnalyzeResponse,
  selectedAnomaly: Anomaly | null,
): void {
  const markdown = generatePostmortem(request, result, selectedAnomaly);
  const filename = safeFilename(result.run_name);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
