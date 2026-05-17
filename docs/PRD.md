# TrainLens AI PRD

## 1. Product Summary

TrainLens AI is an AI-powered ML training run failure diagnosis platform.

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

1. User loads a sample training log.
2. TrainLens parses the metrics.
3. TrainLens detects anomaly patterns.
4. TrainLens extracts evidence around the failure step.
5. TrainLens returns a diagnosis.
6. TrainLens visualizes the failure point.
7. TrainLens recommends next steps.

## 5. MVP Scope

### Must Have

- Sample JSON training logs for all anomaly scenarios
- FastAPI backend
- Loss divergence detector
- Vanishing gradients detector
- GPU underutilization detector
- OOM risk detector
- Training stall detector
- Mock diagnosis response per anomaly type
- API contract
- Documentation
- Tests

### Should Have

- React dashboard
- D3 loss curve
- Anomaly marker
- Diagnosis panel

### Later

- Real Claude/OpenAI diagnosis
- CSV parser
- PostgreSQL
- Kafka streaming
- Docker Compose
- Deployment

## 6. Success Criteria

### Backend v1 (complete)

- `/api/analyze` accepts a JSON training log.
- Backend detects five anomaly types: loss divergence, vanishing gradients, GPU underutilization, OOM risk, and training stall.
- Backend returns structured anomaly data with a context window around each detected step.
- Backend returns a typed mock diagnosis with remediation steps for each anomaly type.
- 21 tests pass.
- All documentation reflects the implemented API and data models.

### Frontend (Week 2)

- User can submit a sample log from a browser.
- Loss curve renders in a D3 chart.
- Detected anomaly is marked visually.
- Diagnosis appears in a panel with remediation steps.
