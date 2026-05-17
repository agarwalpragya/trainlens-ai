from app.anomaly_detector import detect_anomalies
from app.models import TrainingMetric


def test_detect_loss_divergence():
    metrics = [
        TrainingMetric(step=100, train_loss=0.92),
        TrainingMetric(step=200, train_loss=0.71),
        TrainingMetric(step=300, train_loss=0.56),
        TrainingMetric(step=400, train_loss=0.48),
        TrainingMetric(step=500, train_loss=2.35, gradient_norm=87.4, learning_rate=0.001),
    ]

    anomalies = detect_anomalies(metrics)

    assert len(anomalies) == 1
    assert anomalies[0]["anomaly_type"] == "loss_divergence"
    assert anomalies[0]["detected_at_step"] == 500
    assert anomalies[0]["severity"] == "critical"