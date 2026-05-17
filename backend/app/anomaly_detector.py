from typing import List, Dict, Any
from app.models import TrainingMetric


def detect_anomalies(metrics: List[TrainingMetric]) -> List[Dict[str, Any]]:
    """
    Detects training anomalies from metric history.

    Day 1 supports:
    - loss_divergence

    Future:
    - vanishing_gradients
    - gpu_underutilization
    - oom_risk
    - training_stall
    """

    anomalies = []
    loss_divergence = detect_loss_divergence(metrics)

    if loss_divergence:
        anomalies.append(loss_divergence)

    return anomalies


def detect_loss_divergence(metrics: List[TrainingMetric]):
    """
    Loss divergence rule:

    If train_loss increases by more than 200% within a 3-step window,
    flag it as a critical anomaly.

    Example:
    Previous loss: 0.40
    Current loss: 1.40
    Increase: 250%
    """

    if len(metrics) < 4:
        return None

    for index in range(3, len(metrics)):
        previous = metrics[index - 3]
        current = metrics[index]

        if previous.train_loss <= 0:
            continue

        increase_factor = current.train_loss / previous.train_loss
        increase_percent = round((increase_factor - 1) * 100, 2)

        if increase_percent > 200:
            context_window = build_context_window(metrics, index, window_size=10)

            return {
                "anomaly_type": "loss_divergence",
                "detected_at_step": current.step,
                "severity": "critical",
                "confidence": 0.91,
                "relevant_metrics": {
                    "previous_step": previous.step,
                    "previous_train_loss": previous.train_loss,
                    "current_step": current.step,
                    "current_train_loss": current.train_loss,
                    "increase_percent": increase_percent,
                    "gradient_norm": current.gradient_norm,
                    "learning_rate": current.learning_rate,
                },
                "context_window": context_window,
            }

    return None


def build_context_window(
    metrics: List[TrainingMetric],
    center_index: int,
    window_size: int = 10,
) -> List[Dict[str, Any]]:
    """
    Returns metrics around the detected anomaly.

    This gives the future AI diagnosis engine enough evidence
    without sending the full training run.
    """

    start = max(0, center_index - window_size)
    end = min(len(metrics), center_index + window_size + 1)

    return [metric.model_dump() for metric in metrics[start:end]]