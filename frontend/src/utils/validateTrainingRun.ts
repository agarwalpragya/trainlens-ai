import type { AnalyzeRequest } from '../types/analysis';

type ValidationOk   = { valid: true;  payload: AnalyzeRequest };
type ValidationFail = { valid: false; error: string };
export type ValidationResult = ValidationOk | ValidationFail;

export function validateTrainingRun(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { valid: false, error: 'JSON must be an object with run_name and metrics.' };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.run_name !== 'string' || obj.run_name.trim() === '') {
    return { valid: false, error: 'run_name is missing or must be a non-empty string.' };
  }

  if (!Array.isArray(obj.metrics)) {
    return { valid: false, error: 'metrics must be an array of training step objects.' };
  }

  if (obj.metrics.length === 0) {
    return { valid: false, error: 'metrics array must contain at least one step.' };
  }

  for (let i = 0; i < obj.metrics.length; i++) {
    const m = obj.metrics[i];
    if (typeof m !== 'object' || m === null || Array.isArray(m)) {
      return { valid: false, error: `metrics[${i}] must be an object.` };
    }
    const metric = m as Record<string, unknown>;
    if (typeof metric.step !== 'number') {
      return { valid: false, error: `metrics[${i}] must have a numeric step field.` };
    }
    if (typeof metric.train_loss !== 'number') {
      return { valid: false, error: `metrics[${i}] must have a numeric train_loss field.` };
    }
  }

  return { valid: true, payload: raw as AnalyzeRequest };
}
