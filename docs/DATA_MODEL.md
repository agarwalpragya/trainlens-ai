# TrainLens AI Data Model

## 1. TrainingMetric

Represents one training step.

| Field | Type | Required | Description |
|---|---|---|---|
| step | int | yes | Training step number |
| train_loss | float | yes | Training loss |
| val_loss | float | no | Validation loss |
| gpu_utilization_percent | float | no | GPU utilization percentage |
| memory_used_gb | float | no | GPU memory used |
| memory_total_gb | float | no | Total GPU memory |
| gradient_norm | float | no | Gradient norm |
| learning_rate | float | no | Learning rate |
| batch_size | int | no | Batch size |
| throughput_samples_per_sec | float | no | Training throughput |
| timestamp | string | no | ISO timestamp |

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