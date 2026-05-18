export interface TrainingMetric {
  step: number;
  train_loss: number;
  val_loss?: number;
  gpu_utilization_percent?: number;
  memory_used_gb?: number;
  memory_total_gb?: number;
  gradient_norm?: number;
  learning_rate?: number;
  batch_size?: number;
  throughput_samples_per_sec?: number;
  timestamp?: string;
}

export interface AnalyzeRequest {
  run_name: string;
  metrics: TrainingMetric[];
}

export interface Anomaly {
  anomaly_type: string;
  detected_at_step: number;
  severity: string;
  confidence: number;
  relevant_metrics: Record<string, unknown>;
  context_window: Record<string, unknown>[];
}

export interface RunSummary {
  total_steps: number;
  anomalies_detected: number;
}

export interface Diagnosis {
  headline: string;
  root_cause: string;
  explanation: string;
  remediation_steps: string[];
}

export interface AnalyzeResponse {
  run_name: string;
  summary: RunSummary;
  anomalies: Anomaly[];
  diagnosis: Diagnosis;
}

export interface AskRequest {
  question: string;
  analysis: AnalyzeResponse;
}

export interface AskResponse {
  answer: string;
}
