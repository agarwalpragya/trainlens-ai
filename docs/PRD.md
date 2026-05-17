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

- Sample JSON training logs
- FastAPI backend
- Loss divergence detector
- Mock diagnosis response
- API contract
- Documentation
- First GitHub commit

### Should Have

- React dashboard
- D3 loss curve
- Anomaly marker
- Diagnosis panel

### Later

- Real Claude/OpenAI diagnosis
- GPU underutilization detector
- OOM risk detector
- Vanishing/exploding gradient detector
- CSV parser
- PostgreSQL
- Kafka streaming
- Docker Compose
- Deployment

## 6. Success Criteria

Day 1 is successful when:

- `/api/analyze` accepts a training log.
- Backend detects at least one loss divergence anomaly.
- Backend returns a structured anomaly and mocked diagnosis.
- Code is committed to GitHub.