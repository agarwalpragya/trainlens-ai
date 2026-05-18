import json
import logging
import os
from typing import Any, Dict, List

from anthropic import Anthropic
from app.models import Anomaly, Diagnosis

logger = logging.getLogger(__name__)

# Fields forwarded to Claude from each context_window entry.
# Omitting internal bookkeeping keys (e.g. timestamp) to keep the prompt small.
_CONTEXT_FIELDS = [
    "step",
    "train_loss",
    "val_loss",
    "gpu_utilization_percent",
    "memory_used_gb",
    "memory_total_gb",
    "gradient_norm",
    "learning_rate",
    "batch_size",
    "throughput_samples_per_sec",
]


# ── Mock diagnosis ────────────────────────────────────────────────────────────

def generate_mock_diagnosis(anomalies: List[Anomaly]) -> Diagnosis:
    """Rule-based fallback diagnosis. Used when Claude is unavailable."""

    if not anomalies:
        return Diagnosis(
            headline="No major training anomaly detected.",
            root_cause="The training run appears stable based on the available metrics.",
            explanation="No sharp loss spike was detected in the current metric history.",
            remediation_steps=[],
        )

    primary = anomalies[0]
    step = primary.detected_at_step

    if primary.anomaly_type == "loss_divergence":
        return Diagnosis(
            headline="Training run likely diverged due to unstable optimization.",
            root_cause=(
                f"Training loss increased sharply near step {step}, "
                "which suggests unstable optimization behavior."
            ),
            explanation=(
                "A sudden loss spike can be caused by an overly high learning rate, "
                "exploding gradients, unstable batch data, or numerical instability."
            ),
            remediation_steps=[
                "Reduce the learning rate and rerun from the last stable checkpoint.",
                "Inspect gradient norm around the failure step.",
                "Check whether a specific data batch caused the spike.",
                "Enable gradient clipping if exploding gradients are suspected.",
            ],
        )

    if primary.anomaly_type == "vanishing_gradients":
        return Diagnosis(
            headline="Vanishing gradients detected — model weights are no longer updating.",
            root_cause=(
                f"Gradient norm dropped near zero starting at step {step}, "
                "preventing the optimizer from making meaningful weight updates."
            ),
            explanation=(
                "Vanishing gradients occur when gradients shrink exponentially through "
                "deep layers. Common causes include saturating activations (sigmoid/tanh), "
                "very deep networks without residual connections, or an extremely low learning rate."
            ),
            remediation_steps=[
                "Switch to ReLU or LeakyReLU activations to reduce saturation.",
                "Add skip connections or use a residual architecture.",
                "Try a higher learning rate or a warm restart schedule.",
                "Use gradient norm logging to identify which layers are affected.",
            ],
        )

    if primary.anomaly_type == "gpu_underutilization":
        return Diagnosis(
            headline="GPU is significantly underutilized — training is likely bottlenecked elsewhere.",
            root_cause=(
                f"GPU utilization dropped below 50% starting at step {step}, "
                "indicating the GPU is waiting on something other than computation."
            ),
            explanation=(
                "Low GPU utilization usually means the data pipeline cannot feed the GPU fast enough. "
                "Other causes include small batch sizes, frequent CPU-GPU transfers, or a poorly "
                "parallelized preprocessing step."
            ),
            remediation_steps=[
                "Profile the data loader and increase num_workers.",
                "Increase the batch size if memory allows.",
                "Use prefetch_factor to overlap data loading with computation.",
                "Pin memory (pin_memory=True) to speed up host-to-device transfers.",
            ],
        )

    if primary.anomaly_type == "oom_risk":
        return Diagnosis(
            headline="GPU memory approaching capacity — OOM crash is likely.",
            root_cause=(
                f"Memory utilization exceeded 90% at step {step}, "
                "which puts the run at high risk of an out-of-memory error."
            ),
            explanation=(
                "Near-full GPU memory often precedes a crash. The memory footprint grows "
                "due to large batch sizes, activations stored for backprop, or memory leaks "
                "from tensors not released after use."
            ),
            remediation_steps=[
                "Reduce the batch size and rerun.",
                "Enable gradient checkpointing to trade compute for memory.",
                "Use mixed precision (fp16/bf16) to halve activation memory.",
                "Audit the training loop for tensors being accumulated unintentionally.",
            ],
        )

    if primary.anomaly_type == "training_stall":
        return Diagnosis(
            headline="Training stall detected — validation loss has stopped improving.",
            root_cause=(
                f"Validation loss change fell below 0.001 per step starting at step {step}, "
                "suggesting the model has plateaued."
            ),
            explanation=(
                "A training stall means the optimizer is no longer finding a better minimum. "
                "This can happen when the learning rate is too low, the model has converged, "
                "or the loss landscape is flat in the current neighborhood."
            ),
            remediation_steps=[
                "Try a learning rate warm restart or cyclic learning rate schedule.",
                "Check whether the model has genuinely converged and evaluate on the test set.",
                "Introduce mild regularization changes (dropout, weight decay) to escape the plateau.",
                "Consider early stopping if the plateau persists beyond a patience window.",
            ],
        )

    return Diagnosis(
        headline="Training anomaly detected.",
        root_cause="An unusual training pattern was detected.",
        explanation="Further analysis is needed.",
        remediation_steps=["Inspect the context window around the detected step."],
    )


# ── Claude diagnosis ──────────────────────────────────────────────────────────

def _trim_context_window(context_window: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Strip non-metric keys from context_window entries to keep the prompt compact."""
    trimmed = []
    for entry in context_window:
        row = {k: entry[k] for k in _CONTEXT_FIELDS if k in entry and entry[k] is not None}
        trimmed.append(row)
    return trimmed


def _build_prompt(anomaly: Anomaly) -> str:
    trimmed_context = _trim_context_window(anomaly.context_window)
    return f"""You are analyzing a machine learning training run that produced the following anomaly.

Anomaly:
- type: {anomaly.anomaly_type}
- severity: {anomaly.severity}
- detected_at_step: {anomaly.detected_at_step}
- confidence: {anomaly.confidence}
- relevant_metrics: {json.dumps(anomaly.relevant_metrics)}

Context window (steps around the anomaly):
{json.dumps(trimmed_context, indent=2)}

Instructions:
- Base your diagnosis ONLY on the metrics provided above. Do not invent unsupported evidence.
- If the evidence is insufficient to make a confident claim, say so clearly in the explanation.
- Use hedged language when inferring causes that are not directly observable in the metrics.
  Use phrases like "may indicate," "suggests," "is consistent with," or "could be caused by"
  rather than stating inferred causes as definitive facts.
  Reserve direct language (e.g. "caused by") only when the metric evidence makes it unambiguous.
- Keep the diagnosis practical and engineer-readable.
- Return a JSON object with EXACTLY these four keys:
  - "headline": one-sentence summary of the problem (string)
  - "root_cause": concise root-cause statement; use hedged language if the cause is inferred (string)
  - "explanation": 2–4 sentence technical explanation (string)
  - "remediation_steps": list of 2–5 actionable steps (array of strings)

Return JSON only. No markdown, no code fences, no extra text."""


def generate_claude_diagnosis(anomaly: Anomaly) -> Diagnosis:
    """
    Call the Claude API and parse the response into a Diagnosis.
    Raises on network errors, non-JSON responses, or missing keys.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-5")

    client = Anthropic(api_key=api_key)
    prompt = _build_prompt(anomaly)

    response = client.messages.create(
        model=model,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    data = json.loads(raw)  # raises json.JSONDecodeError on bad output

    return Diagnosis(
        headline=data["headline"],
        root_cause=data["root_cause"],
        explanation=data["explanation"],
        remediation_steps=data["remediation_steps"],
    )


# ── Public entry point ────────────────────────────────────────────────────────

def generate_diagnosis(anomalies: List[Anomaly]) -> Diagnosis:
    """
    Generate a diagnosis for the detected anomalies.

    Priority:
      1. No anomalies → stable "no anomaly" response (never calls Claude).
      2. ANTHROPIC_API_KEY missing → mock diagnosis.
      3. Claude call succeeds → return Claude diagnosis.
      4. Claude call fails for any reason → log warning, return mock diagnosis.
    """
    if not anomalies:
        return generate_mock_diagnosis(anomalies)

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return generate_mock_diagnosis(anomalies)

    try:
        return generate_claude_diagnosis(anomalies[0])
    except Exception:
        logger.warning(
            "Claude diagnosis failed; falling back to mock diagnosis.",
            exc_info=True,
        )
        return generate_mock_diagnosis(anomalies)
