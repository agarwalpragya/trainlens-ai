# TrainLens AI PRD

## 1. Product Summary

TrainLens AI is an AI-assisted ML training run failure diagnosis platform.

It helps ML engineers understand why a training run likely failed by parsing logs and metrics, detecting anomaly patterns, extracting evidence, generating a diagnosis, and visualizing the failure point.

## 2. Problem Statement

ML training failures are difficult to debug because signals are scattered across loss curves, GPU utilization, memory usage, gradient norms, logs, and checkpoints.

Existing tools are strong at tracking training metrics. TrainLens focuses on the next layer: explainable failure diagnosis.

## 3. Target Users

- ML engineers
- MLOps engineers
- AI infrastructure engineers
- Platform engineers
- Full-stack engineers building AI tools

## 4. MVP User Flow

1. User selects a sample training log.
2. TrainLens parses the training metrics.
3. TrainLens runs five anomaly detectors across the metric history.
4. TrainLens extracts an evidence context window around the detected failure step.
5. TrainLens generates a diagnosis (Claude-powered with deterministic fallback).
6. TrainLens visualizes the loss curve and anomaly markers in a D3 chart.
7. TrainLens displays root cause, explanation, and numbered remediation steps.
8. User can ask follow-up questions via the Ask TrainLens Q&A panel.
9. User can export a Markdown postmortem report.

## 5. Scope

### Implemented (MVP)

- Sample JSON training logs for all anomaly scenarios
- FastAPI backend with Pydantic v2 validation
- Five rule-based anomaly detectors:
  - Loss divergence
  - Vanishing gradients
  - GPU underutilization
  - OOM risk
  - Training stall
- Claude-powered diagnosis with deterministic fallback (`app/diagnosis.py`)
- Ask TrainLens Q&A endpoint — `/api/ask` — Claude-powered with fallback
- React + TypeScript + Vite frontend
- D3 loss curve chart with anomaly markers and cross-highlighting
- Premium dark UI with sticky header and mentor-style loading state
- Two-column layout — main content + sticky Ask TrainLens sidebar
- Markdown postmortem export

### Not Yet Implemented

- Real training log file upload
- Persistent analysis history (no database)
- Authentication or multi-user support
- Deployed demo environment
- Frontend unit tests

### Out of Scope (v1)

- CSV/TensorBoard log parsing
- PostgreSQL persistence
- Kafka streaming ingestion
- Docker Compose deployment
- OpenAI integration (Anthropic only)

## 6. Success Criteria

### Backend

- `/api/analyze` accepts a JSON training log.
- Backend detects five anomaly types: loss divergence, vanishing gradients, GPU underutilization, OOM risk, and training stall.
- Backend returns structured anomaly data with a context window around each detected step.
- Backend returns a Claude-powered diagnosis with a deterministic fallback.
- `/api/ask` returns Claude-grounded answers to follow-up questions; falls back gracefully when Claude is not configured.
- 34 tests pass.
- All documentation reflects the implemented API and data models.

### Frontend

- User can submit a sample log from a browser and view results.
- Loss curve renders in a D3 chart with anomaly markers.
- Cross-highlighting: clicking an anomaly card or chart marker keeps both in sync.
- Diagnosis appears in a panel with remediation steps.
- Ask TrainLens Q&A panel is visible and functional.
- Postmortem export downloads a Markdown file.
- UI is responsive — works on desktop and narrow screens.
