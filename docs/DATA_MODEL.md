# TrainLens AI Data Model

All models are implemented as Pydantic `BaseModel` classes in `backend/app/models.py`.

---

## TrainingMetric

Represents one training step.

| Field | Type | Required | Description |
|---|---|---|---|
| step | int | yes | Training step number |
| train_loss | float | yes | Training loss |
| val_loss | float | no | Validation loss |
| gpu_utilization_percent | float | no | GPU utilization percentage (0–100) |
| memory_used_gb | float | no | GPU memory currently used |
| memory_total_gb | float | no | Total GPU memory available |
| gradient_norm | float | no | Gradient norm at this step |
| learning_rate | float | no | Learning rate at this step |
| batch_size | int | no | Batch size |
| throughput_samples_per_sec | float | no | Training throughput |
| timestamp | string | no | ISO 8601 timestamp |

### Example

```json
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
```

---

## AnalyzeRequest

The request body for `POST /api/analyze`.

| Field | Type | Required | Description |
|---|---|---|---|
| run_name | string | yes | Name identifying the training run |
| metrics | TrainingMetric[] | yes | Ordered or unordered list of training step metrics |

The backend sorts metrics by `step` before detection, so submission order does not matter.

### Example

```json
{
  "run_name": "resnet50_diverging_loss_demo",
  "metrics": [
    { "step": 100, "train_loss": 0.92 },
    { "step": 200, "train_loss": 0.71 }
  ]
}
```

---

## Anomaly

Represents a single detected anomaly.

| Field | Type | Description |
|---|---|---|
| anomaly_type | string | One of the five supported anomaly types |
| detected_at_step | int | Step number where the anomaly was first detected |
| severity | string | `"critical"` or `"warning"` |
| confidence | float | Detector confidence score (0.0–1.0) |
| relevant_metrics | object | Key metric values at the detected step |
| context_window | TrainingMetric[] | Surrounding steps (up to ±10 steps) for downstream diagnosis |

`relevant_metrics` keys vary by anomaly type. See the anomaly types table in `API_SPEC.md` for detection rules.

### Example

```json
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
  "context_window": []
}
```

---

## RunSummary

High-level statistics for the analyzed run.

| Field | Type | Description |
|---|---|---|
| total_steps | int | Number of metrics submitted in the request |
| anomalies_detected | int | Number of anomalies found |

### Example

```json
{
  "total_steps": 6,
  "anomalies_detected": 1
}
```

---

## Diagnosis

Root-cause analysis for the primary detected anomaly.

| Field | Type | Description |
|---|---|---|
| headline | string | One-line summary of the failure |
| root_cause | string | What specifically went wrong and at which step |
| explanation | string | Why this pattern occurs in training |
| remediation_steps | string[] | Ordered list of recommended fixes |

The diagnosis is generated for `anomalies[0]`. If no anomalies are detected, all fields reflect a stable run with an empty `remediation_steps` array.

### Example

```json
{
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
```

---

## AnalyzeResponse

The full response from `POST /api/analyze`.

| Field | Type | Description |
|---|---|---|
| run_name | string | Echoed from the request |
| summary | RunSummary | Step count and anomaly count |
| anomalies | Anomaly[] | All detected anomalies, one per type at most |
| diagnosis | Diagnosis | Root-cause analysis for the first anomaly |
