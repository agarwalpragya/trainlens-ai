"""
Tests for diagnosis.py — Claude path and fallback behavior.
These tests never call the real Claude API.
"""
import json
from unittest.mock import MagicMock, patch

from app.diagnosis import generate_diagnosis, generate_mock_diagnosis
from app.models import Anomaly, Diagnosis

# ── Shared fixture ────────────────────────────────────────────────────────────

def _make_anomaly(anomaly_type: str = "loss_divergence") -> Anomaly:
    return Anomaly(
        anomaly_type=anomaly_type,
        detected_at_step=500,
        severity="critical",
        confidence=0.91,
        relevant_metrics={"train_loss": 2.35, "gradient_norm": 87.4},
        context_window=[
            {"step": 400, "train_loss": 0.48},
            {"step": 500, "train_loss": 2.35, "gradient_norm": 87.4},
        ],
    )


# ── generate_diagnosis: no anomalies ─────────────────────────────────────────

def test_no_anomalies_returns_stable_diagnosis_without_calling_claude():
    """When there are no anomalies, Claude is never called."""
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-key"}):
        with patch("app.diagnosis.generate_claude_diagnosis") as mock_claude:
            diagnosis = generate_diagnosis([])

    mock_claude.assert_not_called()
    assert diagnosis.headline == "No major training anomaly detected."
    assert diagnosis.remediation_steps == []


# ── generate_diagnosis: missing API key ──────────────────────────────────────

def test_missing_api_key_falls_back_to_mock(monkeypatch):
    """When ANTHROPIC_API_KEY is absent, mock diagnosis is returned."""
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    anomaly = _make_anomaly("loss_divergence")
    diagnosis = generate_diagnosis([anomaly])

    assert "diverged" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps


def test_empty_api_key_falls_back_to_mock(monkeypatch):
    """When ANTHROPIC_API_KEY is set but empty, mock diagnosis is returned."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")

    anomaly = _make_anomaly("loss_divergence")
    diagnosis = generate_diagnosis([anomaly])

    assert "diverged" in diagnosis.headline.lower()


# ── generate_diagnosis: Claude returns valid JSON ─────────────────────────────

def test_valid_claude_response_returns_claude_diagnosis():
    """When Claude returns valid JSON, its output is used as the diagnosis."""
    claude_payload = {
        "headline": "Training diverged due to high learning rate.",
        "root_cause": "LR too large caused explosive gradient updates.",
        "explanation": "The gradient norm spiked at step 500, correlating with the LR value.",
        "remediation_steps": ["Reduce learning rate.", "Add gradient clipping."],
    }

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps(claude_payload))]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-key"}):
        with patch("app.diagnosis.Anthropic") as MockClient:
            MockClient.return_value.messages.create.return_value = mock_response
            diagnosis = generate_diagnosis([_make_anomaly()])

    assert diagnosis.headline == claude_payload["headline"]
    assert diagnosis.root_cause == claude_payload["root_cause"]
    assert diagnosis.remediation_steps == claude_payload["remediation_steps"]


# ── generate_diagnosis: Claude returns invalid JSON ───────────────────────────

def test_invalid_json_from_claude_falls_back_to_mock():
    """When Claude returns non-JSON text, mock diagnosis is used."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Sorry, I cannot help with that.")]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-key"}):
        with patch("app.diagnosis.Anthropic") as MockClient:
            MockClient.return_value.messages.create.return_value = mock_response
            diagnosis = generate_diagnosis([_make_anomaly("loss_divergence")])

    # Should have fallen back to mock for loss_divergence
    assert "diverged" in diagnosis.headline.lower()


def test_missing_json_keys_from_claude_falls_back_to_mock():
    """When Claude JSON is missing required keys, mock diagnosis is used."""
    incomplete = {"headline": "Something went wrong."}  # missing root_cause etc.

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text=json.dumps(incomplete))]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-key"}):
        with patch("app.diagnosis.Anthropic") as MockClient:
            MockClient.return_value.messages.create.return_value = mock_response
            diagnosis = generate_diagnosis([_make_anomaly("loss_divergence")])

    assert "diverged" in diagnosis.headline.lower()


# ── generate_diagnosis: Claude raises a network error ────────────────────────

def test_claude_network_error_falls_back_to_mock():
    """When the Anthropic client raises an exception, mock diagnosis is used."""
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-key"}):
        with patch("app.diagnosis.Anthropic") as MockClient:
            MockClient.return_value.messages.create.side_effect = Exception("connection refused")
            diagnosis = generate_diagnosis([_make_anomaly("loss_divergence")])

    assert "diverged" in diagnosis.headline.lower()
    assert diagnosis.remediation_steps


# ── generate_mock_diagnosis: existing tests still work ───────────────────────

def test_mock_diagnosis_all_anomaly_types():
    """Smoke-test that generate_mock_diagnosis covers all five anomaly types."""
    types_and_keywords = [
        ("loss_divergence", "diverged"),
        ("vanishing_gradients", "vanishing"),
        ("gpu_underutilization", "gpu"),
        ("oom_risk", "memory"),
        ("training_stall", "stall"),
    ]
    for anomaly_type, keyword in types_and_keywords:
        anomaly = _make_anomaly(anomaly_type)
        diagnosis = generate_mock_diagnosis([anomaly])
        assert keyword in diagnosis.headline.lower(), (
            f"Expected '{keyword}' in headline for {anomaly_type}: {diagnosis.headline!r}"
        )
        assert diagnosis.remediation_steps
