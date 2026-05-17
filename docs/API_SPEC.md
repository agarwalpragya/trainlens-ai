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

Example based on `sample_logs/diverging_run.json` (6 steps, divergence detected at step 500).

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
        {"step": 100, "train_loss": 0.92, "val_loss": 1.04, "gradient_norm": 1.1, "learning_rate": 0.001},
        {"step": 200, "train_loss": 0.71, "val_loss": 0.91, "gradient_norm": 1.2, "learning_rate": 0.001},
        {"step": 300, "train_loss": 0.56, "val_loss": 0.82, "gradient_norm": 1.4, "learning_rate": 0.001},
        {"step": 400, "train_loss": 0.48, "val_loss": 0.77, "gradient_norm": 1.5, "learning_rate": 0.001},
        {"step": 500, "train_loss": 2.35, "val_loss": 2.91, "gradient_norm": 87.4, "learning_rate": 0.001},
        {"step": 600, "train_loss": 7.82, "val_loss": 9.21, "gradient_norm": 132.6, "learning_rate": 0.001}
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

## Error Handling

Future API versions should return structured errors:

```json
{
  "error": "invalid_payload",
  "message": "metrics must contain at least one training step"
}
```