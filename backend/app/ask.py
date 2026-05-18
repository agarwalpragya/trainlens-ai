import json
import logging
import os

from anthropic import Anthropic

from app.models import AnalyzeResponse

logger = logging.getLogger(__name__)

_FALLBACK_ANSWER = (
    "Follow-up Q&A requires Claude to be configured. "
    "Add ANTHROPIC_API_KEY to backend/.env and restart the server."
)


def _build_prompt(question: str, analysis: AnalyzeResponse) -> str:
    anomaly_lines = []
    for a in analysis.anomalies:
        anomaly_lines.append(
            f"- {a.anomaly_type} (severity: {a.severity}, "
            f"step: {a.detected_at_step}, confidence: {a.confidence:.0%}, "
            f"relevant metrics: {json.dumps(a.relevant_metrics)})"
        )
    anomalies_text = "\n".join(anomaly_lines) if anomaly_lines else "  None detected."

    remediation_text = "\n".join(
        f"  {i + 1}. {step}"
        for i, step in enumerate(analysis.diagnosis.remediation_steps)
    ) or "  None."

    return f"""You are answering a follow-up question about a machine learning training run that has already been analyzed.

Run: {analysis.run_name}
Total steps: {analysis.summary.total_steps}
Anomalies detected: {analysis.summary.anomalies_detected}

Anomalies:
{anomalies_text}

Diagnosis:
  Headline: {analysis.diagnosis.headline}
  Root cause: {analysis.diagnosis.root_cause}
  Explanation: {analysis.diagnosis.explanation}
  Remediation steps:
{remediation_text}

Instructions:
- Answer ONLY based on the run context provided above.
- Do not introduce information not present in the analysis.
- If the question cannot be answered from the available evidence, say so clearly.
- Keep the answer concise and engineer-readable.
- Do not repeat the question back.

Question: {question}"""


def answer_question(question: str, analysis: AnalyzeResponse) -> str:
    """
    Answer a follow-up question using Claude.
    Returns the fallback message if the API key is absent or the call fails.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _FALLBACK_ANSWER

    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")
    prompt = _build_prompt(question, analysis)

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception:
        logger.warning("Claude /api/ask call failed.", exc_info=True)
        return _FALLBACK_ANSWER
