# TrainLens AI API Specification

## Base URL

Local development:

```text
http://localhost:8000
```

Production (Railway):

```text
https://trainlens-ai-backend.up.railway.app
```

The frontend reads the base URL from `VITE_API_BASE_URL` at build time; the default is `http://localhost:8000` for local development.

## GET /

Health check endpoint.

### Purpose

Used to confirm that the backend API is running.

### Response

```json
{
  "status": "ok",
  "service": "TrainLens AI API",
  "version": "0.1.0"
}
```

---

## POST /api/analyze

Analyzes a training run and returns detected anomalies with diagnosis.

### Purpose

This is the main MVP endpoint.

It accepts a training log, runs five anomaly detectors, and returns:

- run summary
- detected anomalies (one per anomaly type, at most)
- diagnosis for the primary anomaly
- remediation steps

### Request Body

`run_name` is required. `metrics` must be a non-empty array. Only `step` and `train_loss` are required per metric; all other fields are optional.

```json
{
  "run_name": "resnet50_diverging_loss_demo",
  "metrics": [
    {
      "step": 100,
      "train_loss": 0.92,
      "val_loss": 1.04,
      "gpu_utilization_percent": 78,
      "memory_used_gb": 9.1,
      "memory_total_gb": 24,
      "gradient_norm": 1.1,
      "learning_rate": 0.001,
      "batch_size": 64,
      "throughput_samples_per_sec": 520,
      "timestamp": "2026-05-17T10:00:00Z"
    }
  ]
}
```

### Response Body

Example based on `sample_logs/diverging_run.json` (6 steps, loss divergence detected at step 500).

Each entry in `context_window` contains all `TrainingMetric` fields; optional fields are `null` when not provided in the request.

```json
{
  "run_name": "resnet50_diverging_loss_demo",
  "summary": {
    "total_steps": 6,
    "anomalies_detected": 1
  },
  "anomalies": [
    {
      "anomaly_type": "loss_divergence",
      "detected_at_step": 500,
      "severity": "critical",
      "confidence": 0.91,
      "relevant_metrics": {
        "previous_step": 200,
        "previous_train_loss": 0.71,
        "current_step": 500,
        "current_train_loss": 2.35,
        "increase_percent": 230.99,
        "gradient_norm": 87.4,
        "learning_rate": 0.001
      },
      "context_window": [
        {
          "step": 100,
          "train_loss": 0.92,
          "val_loss": 1.04,
          "gpu_utilization_percent": 78,
          "memory_used_gb": 9.1,
          "memory_total_gb": 24,
          "gradient_norm": 1.1,
          "learning_rate": 0.001,
          "batch_size": 64,
          "throughput_samples_per_sec": 520,
          "timestamp": "2026-05-17T10:00:00Z"
        },
        {
          "step": 500,
          "train_loss": 2.35,
          "val_loss": 2.91,
          "gpu_utilization_percent": 84,
          "memory_used_gb": 10.2,
          "memory_total_gb": 24,
          "gradient_norm": 87.4,
          "learning_rate": 0.001,
          "batch_size": 64,
          "throughput_samples_per_sec": 522,
          "timestamp": "2026-05-17T10:04:00Z"
        }
      ]
    }
  ],
  "diagnosis": {
    "headline": "Training run likely diverged due to unstable optimization.",
    "root_cause": "Training loss increased sharply near step 500, which suggests unstable optimization behavior.",
    "explanation": "A sudden loss spike can be caused by an overly high learning rate, exploding gradients, unstable batch data, or numerical instability.",
    "remediation_steps": [
      "Reduce the learning rate and rerun from the last stable checkpoint.",
      "Inspect gradient norm around the failure step.",
      "Check whether a specific data batch caused the spike.",
      "Enable gradient clipping if exploding gradients are suspected."
    ]
  }
}
```

Note: `context_window` is truncated above for readability. The actual response includes all steps within the ±10 step window around the detected anomaly.

---

## Supported anomaly types

The `anomaly_type` field in each anomaly object will be one of:

| Value | Severity | Detection rule |
|---|---|---|
| `loss_divergence` | critical | train_loss increased >200% within a 3-step window |
| `vanishing_gradients` | warning | gradient_norm < 0.001 for 5+ consecutive steps |
| `gpu_underutilization` | warning | gpu_utilization_percent < 50 for 5+ consecutive steps |
| `oom_risk` | critical | memory_used_gb / memory_total_gb ≥ 0.90 at any step |
| `training_stall` | warning | val_loss changed by < 0.001 for 5+ consecutive steps |

The `diagnosis` field always reflects the first anomaly in the `anomalies` array.

---

## POST /api/ask

Answers a follow-up question about an already-analyzed training run using Claude.

### Purpose

Enables contextual Q&A grounded in the run's training metrics, detected anomalies, and diagnosis. The full `AnalyzeResponse` is submitted alongside the question so the model answers only from available evidence.

When `ANTHROPIC_API_KEY` is absent or the Claude call fails, the endpoint returns a descriptive fallback message rather than an error.

### Request Body

```json
{
  "question": "Why did the training run diverge?",
  "analysis": {
    "run_name": "resnet50_diverging_loss_demo",
    "summary": { "total_steps": 6, "anomalies_detected": 1 },
    "anomalies": [ { "...": "..." } ],
    "diagnosis": { "...": "..." }
  }
}
```

`question` is a free-form string. `analysis` is the complete `AnalyzeResponse` object returned by `POST /api/analyze`.

### Response Body

```json
{
  "answer": "The training run diverged because..."
}
```

### Fallback behavior

When `ANTHROPIC_API_KEY` is not set or the Claude API call fails, the endpoint returns HTTP 200 with:

```json
{
  "answer": "Follow-up Q&A requires Claude to be configured. Add ANTHROPIC_API_KEY to backend/.env and restart the server."
}
```

---

## Error Handling

Future API versions should return structured errors:

```json
{
  "error": "invalid_payload",
  "message": "metrics must contain at least one training step"
}
```
