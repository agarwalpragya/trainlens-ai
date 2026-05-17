# TrainLens AI API Specification

## Base URL

Local:

```text
http://localhost:8000
```

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

It accepts a training log, detects anomalies, and returns:

- run summary
- detected anomalies
- diagnosis
- remediation steps

### Request Body

```json
{
  "run_name": "diverging_run",
  "metrics": [
    {
      "step": 1,
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

```json
{
  "run_name": "diverging_run",
  "summary": {
    "total_steps": 100,
    "anomalies_detected": 1
  },
  "anomalies": [
    {
      "anomaly_type": "loss_divergence",
      "detected_at_step": 500,
      "severity": "critical",
      "confidence": 0.91,
      "relevant_metrics": {
        "previous_step": 400,
        "previous_train_loss": 0.48,
        "current_step": 500,
        "current_train_loss": 2.35,
        "increase_percent": 389.58,
        "gradient_norm": 87.4,
        "learning_rate": 0.001
      },
      "context_window": []
    }
  ],
  "diagnosis": {
    "headline": "Training run likely diverged due to unstable optimization.",
    "root_cause": "Loss increased sharply within a short step window.",
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

## Error Handling

Future API versions should return structured errors:

```json
{
  "error": "invalid_payload",
  "message": "metrics must contain at least one training step"
}
```