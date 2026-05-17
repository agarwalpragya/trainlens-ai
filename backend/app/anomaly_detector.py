from typing import List, Dict, Any, Optional
from app.models import TrainingMetric, Anomaly


def detect_anomalies(metrics: List[TrainingMetric]) -> List[Anomaly]:
    """
    Detects training anomalies from metric history.

    Supported:
    - loss_divergence
    - vanishing_gradients
    - gpu_underutilization
    - oom_risk
    - training_stall
    """

    # Sort by step so positional lookback comparisons are always correct.
    metrics = sorted(metrics, key=lambda m: m.step)

    anomalies: List[Anomaly] = []

    for detector in [
        detect_loss_divergence,
        detect_vanishing_gradients,
        detect_gpu_underutilization,
        detect_oom_risk,
        detect_training_stall,
    ]:
        result = detector(metrics)
        if result:
            anomalies.append(result)

    return anomalies


def detect_loss_divergence(metrics: List[TrainingMetric]) -> Optional[Anomaly]:
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

            return Anomaly(
                anomaly_type="loss_divergence",
                detected_at_step=current.step,
                severity="critical",
                confidence=0.91,  # fixed mock confidence for MVP
                relevant_metrics={
                    "previous_step": previous.step,
                    "previous_train_loss": previous.train_loss,
                    "current_step": current.step,
                    "current_train_loss": current.train_loss,
                    "increase_percent": increase_percent,
                    "gradient_norm": current.gradient_norm,
                    "learning_rate": current.learning_rate,
                },
                context_window=context_window,
            )

    return None


def detect_vanishing_gradients(metrics: List[TrainingMetric]) -> Optional[Anomaly]:
    """
    Vanishing gradients rule:

    If gradient_norm stays below 0.001 for 5 or more consecutive metrics,
    the model is likely stuck — gradients are too small to update weights.
    """

    THRESHOLD = 0.001
    MIN_CONSECUTIVE = 5

    run_start: Optional[int] = None
    run_length = 0

    for index, metric in enumerate(metrics):
        if metric.gradient_norm is None or metric.gradient_norm >= THRESHOLD:
            run_start = None
            run_length = 0
            continue

        if run_length == 0:
            run_start = index
        run_length += 1

        if run_length == MIN_CONSECUTIVE:
            first = metrics[run_start]  # type: ignore[index]
            return Anomaly(
                anomaly_type="vanishing_gradients",
                detected_at_step=first.step,
                severity="warning",
                confidence=0.85,
                relevant_metrics={
                    "gradient_norm": first.gradient_norm,
                    "threshold": THRESHOLD,
                    "consecutive_steps": MIN_CONSECUTIVE,
                },
                context_window=build_context_window(metrics, run_start, window_size=10),  # type: ignore[arg-type]
            )

    return None


def detect_gpu_underutilization(metrics: List[TrainingMetric]) -> Optional[Anomaly]:
    """
    GPU underutilization rule:

    If gpu_utilization_percent stays below 50 for 5 or more consecutive metrics,
    the GPU is likely idle — possibly a data pipeline bottleneck or misconfiguration.
    """

    THRESHOLD = 50.0
    MIN_CONSECUTIVE = 5

    run_start: Optional[int] = None
    run_length = 0

    for index, metric in enumerate(metrics):
        if metric.gpu_utilization_percent is None or metric.gpu_utilization_percent >= THRESHOLD:
            run_start = None
            run_length = 0
            continue

        if run_length == 0:
            run_start = index
        run_length += 1

        if run_length == MIN_CONSECUTIVE:
            first = metrics[run_start]  # type: ignore[index]
            return Anomaly(
                anomaly_type="gpu_underutilization",
                detected_at_step=first.step,
                severity="warning",
                confidence=0.80,
                relevant_metrics={
                    "gpu_utilization_percent": first.gpu_utilization_percent,
                    "threshold_percent": THRESHOLD,
                    "consecutive_steps": MIN_CONSECUTIVE,
                },
                context_window=build_context_window(metrics, run_start, window_size=10),  # type: ignore[arg-type]
            )

    return None


def detect_oom_risk(metrics: List[TrainingMetric]) -> Optional[Anomaly]:
    """
    OOM risk rule:

    If memory_used_gb / memory_total_gb >= 0.90 at any step,
    the process is close to exhausting GPU memory.
    """

    OOM_THRESHOLD = 0.90

    for index, metric in enumerate(metrics):
        # Guard against missing or degenerate memory fields.
        if (
            metric.memory_used_gb is None
            or metric.memory_total_gb is None
            or metric.memory_total_gb <= 0
        ):
            continue

        ratio = metric.memory_used_gb / metric.memory_total_gb

        if ratio >= OOM_THRESHOLD:
            return Anomaly(
                anomaly_type="oom_risk",
                detected_at_step=metric.step,
                severity="critical",
                confidence=0.88,
                relevant_metrics={
                    "memory_used_gb": metric.memory_used_gb,
                    "memory_total_gb": metric.memory_total_gb,
                    "memory_utilization_percent": round(ratio * 100, 2),
                },
                context_window=build_context_window(metrics, index, window_size=10),
            )

    return None


def detect_training_stall(metrics: List[TrainingMetric]) -> Optional[Anomaly]:
    """
    Training stall rule:

    If val_loss changes by less than 0.001 across 5 or more consecutive steps,
    the model has stopped improving — possibly a learning rate too low or a plateau.

    Only evaluated when val_loss is present on both consecutive metrics.
    """

    THRESHOLD = 0.001
    MIN_CONSECUTIVE = 5

    run_start: Optional[int] = None
    run_length = 0

    for index in range(1, len(metrics)):
        prev = metrics[index - 1]
        curr = metrics[index]

        if curr.val_loss is None or prev.val_loss is None:
            run_start = None
            run_length = 0
            continue

        if abs(curr.val_loss - prev.val_loss) < THRESHOLD:
            if run_length == 0:
                run_start = index  # first metric showing the stall property
            run_length += 1

            if run_length == MIN_CONSECUTIVE:
                first = metrics[run_start]  # type: ignore[index]
                return Anomaly(
                    anomaly_type="training_stall",
                    detected_at_step=first.step,
                    severity="warning",
                    confidence=0.82,
                    relevant_metrics={
                        "val_loss_start": first.val_loss,
                        "val_loss_end": curr.val_loss,
                        "change_threshold": THRESHOLD,
                        "consecutive_steps": run_length,
                    },
                    context_window=build_context_window(metrics, run_start, window_size=10),  # type: ignore[arg-type]
                )
        else:
            run_start = None
            run_length = 0

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