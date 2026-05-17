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


def test_detect_vanishing_gradients():
    # gradient_norm < 0.001 for exactly 5 consecutive steps triggers detection.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, gradient_norm=0.5),
        TrainingMetric(step=200, train_loss=0.82, gradient_norm=0.4),
        TrainingMetric(step=300, train_loss=0.75, gradient_norm=0.0005),
        TrainingMetric(step=400, train_loss=0.70, gradient_norm=0.0003),
        TrainingMetric(step=500, train_loss=0.66, gradient_norm=0.0002),
        TrainingMetric(step=600, train_loss=0.63, gradient_norm=0.0004),
        TrainingMetric(step=700, train_loss=0.61, gradient_norm=0.0001),
    ]

    anomalies = detect_anomalies(metrics)

    assert len(anomalies) == 1
    assert anomalies[0].anomaly_type == "vanishing_gradients"
    assert anomalies[0].detected_at_step == 300
    assert anomalies[0].severity == "warning"
    assert anomalies[0].confidence == 0.85


def test_vanishing_gradients_not_triggered_below_consecutive_threshold():
    # Only 4 consecutive steps below 0.001 — should not fire.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, gradient_norm=0.5),
        TrainingMetric(step=200, train_loss=0.82, gradient_norm=0.0005),
        TrainingMetric(step=300, train_loss=0.75, gradient_norm=0.0003),
        TrainingMetric(step=400, train_loss=0.70, gradient_norm=0.0002),
        TrainingMetric(step=500, train_loss=0.66, gradient_norm=0.0004),
    ]

    anomalies = detect_anomalies(metrics)

    assert all(a.anomaly_type != "vanishing_gradients" for a in anomalies)


def test_detect_gpu_underutilization():
    # gpu_utilization_percent < 50 for 5 consecutive steps triggers detection.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, gpu_utilization_percent=78.0),
        TrainingMetric(step=200, train_loss=0.82, gpu_utilization_percent=80.0),
        TrainingMetric(step=300, train_loss=0.75, gpu_utilization_percent=30.0),
        TrainingMetric(step=400, train_loss=0.70, gpu_utilization_percent=35.0),
        TrainingMetric(step=500, train_loss=0.66, gpu_utilization_percent=25.0),
        TrainingMetric(step=600, train_loss=0.63, gpu_utilization_percent=40.0),
        TrainingMetric(step=700, train_loss=0.61, gpu_utilization_percent=20.0),
    ]

    anomalies = detect_anomalies(metrics)

    assert len(anomalies) == 1
    assert anomalies[0].anomaly_type == "gpu_underutilization"
    assert anomalies[0].detected_at_step == 300
    assert anomalies[0].severity == "warning"
    assert anomalies[0].confidence == 0.80


def test_gpu_underutilization_not_triggered_below_consecutive_threshold():
    # Only 4 consecutive steps below 50 — should not fire.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, gpu_utilization_percent=78.0),
        TrainingMetric(step=200, train_loss=0.82, gpu_utilization_percent=30.0),
        TrainingMetric(step=300, train_loss=0.75, gpu_utilization_percent=35.0),
        TrainingMetric(step=400, train_loss=0.70, gpu_utilization_percent=25.0),
        TrainingMetric(step=500, train_loss=0.66, gpu_utilization_percent=40.0),
    ]

    anomalies = detect_anomalies(metrics)

    assert all(a.anomaly_type != "gpu_underutilization" for a in anomalies)


def test_detect_oom_risk():
    # memory_used_gb / memory_total_gb >= 0.90 triggers at the first such step.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, memory_used_gb=9.0, memory_total_gb=24.0),
        TrainingMetric(step=200, train_loss=0.82, memory_used_gb=12.0, memory_total_gb=24.0),
        TrainingMetric(step=300, train_loss=0.75, memory_used_gb=22.0, memory_total_gb=24.0),
        TrainingMetric(step=400, train_loss=0.70, memory_used_gb=23.0, memory_total_gb=24.0),
    ]

    anomalies = detect_anomalies(metrics)

    assert len(anomalies) == 1
    assert anomalies[0].anomaly_type == "oom_risk"
    assert anomalies[0].detected_at_step == 300
    assert anomalies[0].severity == "critical"
    assert anomalies[0].confidence == 0.88


def test_oom_risk_not_triggered_below_threshold():
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, memory_used_gb=9.0, memory_total_gb=24.0),
        TrainingMetric(step=200, train_loss=0.82, memory_used_gb=20.0, memory_total_gb=24.0),
    ]

    anomalies = detect_anomalies(metrics)

    assert all(a.anomaly_type != "oom_risk" for a in anomalies)


def test_oom_risk_missing_memory_fields_no_crash():
    # Missing memory_used_gb and memory_total_gb must not raise an exception.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90),
        TrainingMetric(step=200, train_loss=0.82, memory_used_gb=None, memory_total_gb=None),
    ]

    anomalies = detect_anomalies(metrics)

    assert all(a.anomaly_type != "oom_risk" for a in anomalies)


def test_oom_risk_zero_memory_total_no_crash():
    # memory_total_gb = 0 must not cause a ZeroDivisionError.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, memory_used_gb=10.0, memory_total_gb=0.0),
    ]

    anomalies = detect_anomalies(metrics)

    assert all(a.anomaly_type != "oom_risk" for a in anomalies)


def test_detect_training_stall():
    # val_loss change < 0.001 for 5 consecutive steps triggers detection.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90, val_loss=0.95),
        TrainingMetric(step=200, train_loss=0.80, val_loss=0.85),
        TrainingMetric(step=300, train_loss=0.70, val_loss=0.60),
        TrainingMetric(step=400, train_loss=0.62, val_loss=0.60005),   # stall step 1
        TrainingMetric(step=500, train_loss=0.55, val_loss=0.59998),   # stall step 2
        TrainingMetric(step=600, train_loss=0.50, val_loss=0.60001),   # stall step 3
        TrainingMetric(step=700, train_loss=0.46, val_loss=0.60003),   # stall step 4
        TrainingMetric(step=800, train_loss=0.43, val_loss=0.60002),   # stall step 5
    ]

    anomalies = detect_anomalies(metrics)

    assert len(anomalies) == 1
    assert anomalies[0].anomaly_type == "training_stall"
    assert anomalies[0].detected_at_step == 400
    assert anomalies[0].severity == "warning"
    assert anomalies[0].confidence == 0.82


def test_training_stall_skipped_when_val_loss_missing():
    # When val_loss is absent, training_stall must not fire or crash.
    metrics = [
        TrainingMetric(step=100, train_loss=0.90),
        TrainingMetric(step=200, train_loss=0.82),
        TrainingMetric(step=300, train_loss=0.75),
        TrainingMetric(step=400, train_loss=0.70),
        TrainingMetric(step=500, train_loss=0.66),
        TrainingMetric(step=600, train_loss=0.63),
    ]

    anomalies = detect_anomalies(metrics)

    assert all(a.anomaly_type != "training_stall" for a in anomalies)


def test_normal_run_all_detectors_return_no_anomalies():
    # Full-field metrics that are clean across all five detectors.
    metrics = [
        TrainingMetric(
            step=i * 100,
            train_loss=round(1.0 - i * 0.08, 2),
            val_loss=round(1.05 - i * 0.07, 2),
            gpu_utilization_percent=80.0,
            memory_used_gb=9.0,
            memory_total_gb=24.0,
            gradient_norm=1.0,
            learning_rate=0.001,
        )
        for i in range(1, 7)
    ]

    anomalies = detect_anomalies(metrics)

    assert anomalies == []


def test_diagnosis_no_anomalies_returns_stable_headline():
    diagnosis = generate_mock_diagnosis([])

    assert diagnosis.headline == "No major training anomaly detected."
    assert diagnosis.remediation_steps == []


def test_diagnosis_loss_divergence_headline():
    from app.models import Anomaly
    anomaly = Anomaly(
        anomaly_type="loss_divergence",
        detected_at_step=500,
        severity="critical",
        confidence=0.91,
        relevant_metrics={},
        context_window=[],
    )
    diagnosis = generate_mock_diagnosis([anomaly])
    assert "diverged" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps


def test_diagnosis_vanishing_gradients_headline():
    from app.models import Anomaly
    anomaly = Anomaly(
        anomaly_type="vanishing_gradients",
        detected_at_step=300,
        severity="warning",
        confidence=0.85,
        relevant_metrics={},
        context_window=[],
    )
    diagnosis = generate_mock_diagnosis([anomaly])
    assert "vanishing" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps


def test_diagnosis_gpu_underutilization_headline():
    from app.models import Anomaly
    anomaly = Anomaly(
        anomaly_type="gpu_underutilization",
        detected_at_step=300,
        severity="warning",
        confidence=0.80,
        relevant_metrics={},
        context_window=[],
    )
    diagnosis = generate_mock_diagnosis([anomaly])
    assert "gpu" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps


def test_diagnosis_oom_risk_headline():
    from app.models import Anomaly
    anomaly = Anomaly(
        anomaly_type="oom_risk",
        detected_at_step=300,
        severity="critical",
        confidence=0.88,
        relevant_metrics={},
        context_window=[],
    )
    diagnosis = generate_mock_diagnosis([anomaly])
    assert "memory" in diagnosis.headline.lower() or "oom" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps


def test_diagnosis_training_stall_headline():
    from app.models import Anomaly
    anomaly = Anomaly(
        anomaly_type="training_stall",
        detected_at_step=400,
        severity="warning",
        confidence=0.82,
        relevant_metrics={},
        context_window=[],
    )
    diagnosis = generate_mock_diagnosis([anomaly])
    assert "stall" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps