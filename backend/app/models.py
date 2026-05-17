from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class TrainingMetric(BaseModel):
    step: int
    train_loss: float
    val_loss: Optional[float] = None
    gpu_utilization_percent: Optional[float] = None
    memory_used_gb: Optional[float] = None
    memory_total_gb: Optional[float] = None
    gradient_norm: Optional[float] = None
    learning_rate: Optional[float] = None
    batch_size: Optional[int] = None
    throughput_samples_per_sec: Optional[float] = None
    timestamp: Optional[str] = None


class AnalyzeRequest(BaseModel):
    run_name: str
    metrics: List[TrainingMetric]


class Anomaly(BaseModel):
    anomaly_type: str
    detected_at_step: int
    severity: str
    confidence: float
    relevant_metrics: Dict[str, Any]
    context_window: List[Dict[str, Any]]