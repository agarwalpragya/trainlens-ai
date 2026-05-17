from app.anomaly_detector import detect_anomalies
from app.diagnosis import generate_mock_diagnosis
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
    assert anomalies[0].anomaly_type == "loss_divergence"
    assert anomalies[0].detected_at_step == 500
    assert anomalies[0].severity == "critical"


def test_no_anomaly_on_stable_run():
    metrics = [
        TrainingMetric(step=100, train_loss=0.90),
        TrainingMetric(step=200, train_loss=0.75),
        TrainingMetric(step=300, train_loss=0.60),
        TrainingMetric(step=400, train_loss=0.50),
        TrainingMetric(step=500, train_loss=0.45),
    ]

    anomalies = detect_anomalies(metrics)

    assert anomalies == []


def test_too_few_metrics_returns_no_anomaly():
    metrics = [
        TrainingMetric(step=100, train_loss=0.90),
        TrainingMetric(step=200, train_loss=0.80),
    ]

    anomalies = detect_anomalies(metrics)

    assert anomalies == []


def test_unordered_metrics_are_sorted_before_detection():
    # Steps arrive out of order; the spike is step 500 vs step 200.
    # If not sorted, the detector would compare wrong rows and miss it.
    metrics = [
        TrainingMetric(step=500, train_loss=2.35),
        TrainingMetric(step=100, train_loss=0.92),
        TrainingMetric(step=300, train_loss=0.56),
        TrainingMetric(step=200, train_loss=0.71),
        TrainingMetric(step=400, train_loss=0.48),
    ]

    anomalies = detect_anomalies(metrics)

    assert len(anomalies) == 1
    assert anomalies[0].detected_at_step == 500


def test_diagnosis_no_anomalies_returns_stable_headline():
    diagnosis = generate_mock_diagnosis([])

    assert diagnosis.headline == "No major training anomaly detected."
    assert diagnosis.remediation_steps == []