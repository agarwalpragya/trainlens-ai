from typing import List
from app.models import Anomaly, Diagnosis


def generate_mock_diagnosis(anomalies: List[Anomaly]) -> Diagnosis:
    """
    Day 1 mock diagnosis.

    Later this will be replaced by Claude/OpenAI diagnosis.
    """

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