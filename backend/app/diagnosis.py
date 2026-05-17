from typing import Dict, Any, List


def generate_mock_diagnosis(anomalies: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Day 1 mock diagnosis.

    Later this will be replaced by Claude/OpenAI diagnosis.
    """

    if not anomalies:
        return {
            "headline": "No major training anomaly detected.",
            "root_cause": "The training run appears stable based on the available metrics.",
            "explanation": "No sharp loss spike was detected in the current metric history.",
            "remediation_steps": [],
        }

    primary = anomalies[0]

    if primary["anomaly_type"] == "loss_divergence":
        step = primary["detected_at_step"]

        return {
            "headline": "Training run likely diverged due to unstable optimization.",
            "root_cause": (
                f"Training loss increased sharply near step {step}, "
                "which suggests unstable optimization behavior."
            ),
            "explanation": (
                "A sudden loss spike can be caused by an overly high learning rate, "
                "exploding gradients, unstable batch data, or numerical instability."
            ),
            "remediation_steps": [
                "Reduce the learning rate and rerun from the last stable checkpoint.",
                "Inspect gradient norm around the failure step.",
                "Check whether a specific data batch caused the spike.",
                "Enable gradient clipping if exploding gradients are suspected.",
            ],
        }

    return {
        "headline": "Training anomaly detected.",
        "root_cause": "An unusual training pattern was detected.",
        "explanation": "Further analysis is needed.",
        "remediation_steps": [
            "Inspect the context window around the detected step."
        ],
    }