"""
Tests for ask.py — follow-up Q&A via Claude with fallback behavior.
These tests never call the real Claude API.
"""
from unittest.mock import MagicMock, patch

from app.ask import answer_question
from app.models import AnalyzeResponse, Anomaly, Diagnosis, RunSummary


def _make_analysis(with_anomaly: bool = False) -> AnalyzeResponse:
    anomalies = []
    if with_anomaly:
        anomalies = [
            Anomaly(
                anomaly_type="loss_divergence",
                detected_at_step=500,
                severity="critical",
                confidence=0.91,
                relevant_metrics={"train_loss": 2.35, "gradient_norm": 87.4},
                context_window=[],
            )
        ]
    return AnalyzeResponse(
        run_name="test_run",
        summary=RunSummary(total_steps=5, anomalies_detected=len(anomalies)),
        anomalies=anomalies,
        diagnosis=Diagnosis(
            headline="No major anomaly detected.",
            root_cause="The run appears stable.",
            explanation="No issues were found.",
            remediation_steps=[],
        ),
    )


# ── Fallback when API key is absent ──────────────────────────────────────────

def test_missing_api_key_returns_fallback(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    answer = answer_question("Why did this happen?", _make_analysis())
    assert "ANTHROPIC_API_KEY" in answer or "configured" in answer.lower()


def test_empty_api_key_returns_fallback(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")
    answer = answer_question("What should I try?", _make_analysis())
    assert "configured" in answer.lower() or "ANTHROPIC_API_KEY" in answer


# ── Claude returns a valid answer ─────────────────────────────────────────────

def test_valid_claude_response_is_returned():
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="This happened because of a high learning rate.")]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test"}):
        with patch("app.ask.Anthropic") as MockClient:
            MockClient.return_value.messages.create.return_value = mock_response
            answer = answer_question("Why did this happen?", _make_analysis(with_anomaly=True))

    assert answer == "This happened because of a high learning rate."


def test_claude_receives_run_context():
    """Verify that the prompt sent to Claude includes the run name and anomaly type."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Some answer.")]

    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test"}):
        with patch("app.ask.Anthropic") as MockClient:
            MockClient.return_value.messages.create.return_value = mock_response
            answer_question("Why did this happen?", _make_analysis(with_anomaly=True))

    call_args = MockClient.return_value.messages.create.call_args
    prompt_content = call_args.kwargs["messages"][0]["content"]
    assert "test_run" in prompt_content
    assert "loss_divergence" in prompt_content


# ── Fallback when Claude raises an exception ─────────────────────────────────

def test_claude_network_error_returns_fallback():
    with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test"}):
        with patch("app.ask.Anthropic") as MockClient:
            MockClient.return_value.messages.create.side_effect = Exception("connection refused")
            answer = answer_question("What should I try?", _make_analysis())

    assert "configured" in answer.lower() or "ANTHROPIC_API_KEY" in answer
