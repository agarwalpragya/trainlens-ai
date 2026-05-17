# TrainLens AI Architecture

## 1. System Overview

TrainLens AI analyzes ML training logs and detects training failure patterns.

The MVP is intentionally simple:

- FastAPI backend
- Sample JSON logs
- Rule-based anomaly detector
- Mock diagnosis generator
- React/D3 frontend later

## 2. High-Level Flow

```mermaid
flowchart LR
    A[Training Log JSON] --> B[FastAPI Analyze Endpoint]
    B --> C[Schema Validation]
    C --> D[Anomaly Detector]
    D --> E[Diagnosis Generator]
    E --> F[Structured API Response]
    F --> G[React Dashboard]
    G --> H[D3 Failure Visualization]
```

## 3. Backend Components

```mermaid
flowchart TD
    A[main.py] --> B[models.py]
    A --> C[anomaly_detector.py]
    A --> D[diagnosis.py]
    C --> E[Loss Divergence Rule]
    C --> F[Future: Gradient Rules]
    C --> G[Future: GPU Rules]
    D --> H[Mock Diagnosis]
    D --> I[Future: Claude Diagnosis]
```

## 4. MVP Architecture Decisions

- Use FastAPI for lightweight API development.
- Use uv for modern Python dependency management.
- Use rule-based detection before LLM diagnosis.
- Start with JSON logs instead of real-time streaming.
- Mock diagnosis before integrating Claude.
- Delay database until the core loop works.

## 5. Future Architecture

```mermaid
flowchart LR
    A[Training Job / Logs] --> B[Ingestion API]
    B --> C[PostgreSQL]
    B --> D[Anomaly Detector]
    D --> E[Claude Diagnosis Engine]
    E --> F[Analysis Store]
    F --> G[React Dashboard]
    G --> H[D3 Charts]
    I[Kafka Stream] --> B
```