# TrainLens AI

TrainLens AI is an AI-powered ML training run failure diagnosis platform.

It parses ML training logs and metrics, detects failure patterns such as loss divergence, exploding gradients, vanishing gradients, GPU underutilization, and OOM risk, then generates explainable root-cause analysis and remediation guidance.

## Current State

The project is fully implemented and deployed.

- Backend: FastAPI with 5 anomaly detectors, Claude diagnosis, Ask TrainLens Q&A, deterministic fallbacks
- Frontend: React + TypeScript + Vite, D3 charts, premium dark UI, file upload, postmortem export
- Deployed: backend on Railway, frontend on Vercel
- Live: https://trainlens-ai-azure.vercel.app/
- Tests: 34 backend tests passing

## Stack

Frontend:
- React
- TypeScript
- Vite
- D3.js

Backend:
- Python
- FastAPI
- Pydantic
- uv for dependency management
- Anthropic Python SDK (claude-sonnet-4-5 by default)

Deployed:
- Railway (backend)
- Vercel (frontend)

Not implemented (out of scope for this MVP):
- PostgreSQL
- Redis
- Celery
- Kafka
- Docker
- LangSmith
- Authentication
- Persistent storage

## Engineering Rules

- Use uv, not pip/requirements.txt.
- Do not add database.
- Do not add auth.
- Do not add Kafka.
- Do not add Kubernetes.
- Do not add Docker.
- Do not hardcode API keys.
- Do not change the backend API contracts (POST /api/analyze, POST /api/ask, GET /).
- Do not change the AnalyzeResponse or AskResponse shapes.
- Keep README accurate and professional.
- Write readable code.
- Add comments for non-obvious logic (anomaly detection rules, D3 rendering choices).

## API Contracts (do not change)

POST /api/analyze accepts:
- run_name
- metrics array with step, train_loss, val_loss, gpu_utilization_percent, memory_used_gb, memory_total_gb, gradient_norm, learning_rate, batch_size, throughput_samples_per_sec, timestamp

Returns: run_name, summary, anomalies[], diagnosis

POST /api/ask accepts:
- question (string)
- analysis (full AnalyzeResponse)

Returns: answer (string)
