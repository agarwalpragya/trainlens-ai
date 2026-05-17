# TrainLens AI

TrainLens AI is an AI-powered ML training run failure diagnosis platform.

It parses ML training logs and metrics, detects failure patterns such as loss divergence, exploding gradients, vanishing gradients, GPU underutilization, and OOM risk, then generates explainable root-cause analysis and remediation guidance.

## MVP Goal

Build one working vertical slice:

Sample training log
→ anomaly detection
→ mocked AI diagnosis
→ React dashboard
→ D3 failure visualization

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

Future, not MVP:
- Claude/OpenAI API
- PostgreSQL
- Redis
- Celery
- Kafka
- Docker
- LangSmith

## Engineering Rules

- Use uv, not pip/requirements.txt.
- Keep v1 simple.
- Do not add database on Day 1.
- Do not add auth on Day 1.
- Do not add Kafka on Day 1.
- Do not add Kubernetes.
- Do not add Docker yet.
- Do not add real Claude API yet.
- Build one demo flow first.
- Write readable code.
- Add comments for anomaly logic.
- Do not hardcode API keys.
- Keep README accurate and professional.

## First Milestone

Backend:
- GET /
- POST /api/analyze

POST /api/analyze accepts:
- run_name
- metrics array with step, train_loss, val_loss, gpu_utilization_percent, memory_used_gb, memory_total_gb, gradient_norm, learning_rate, batch_size, throughput_samples_per_sec, timestamp

It should detect loss divergence if current train_loss increases more than 200% within 3 steps.

Frontend:
- Basic dashboard
- Button to analyze sample log
- Show anomaly result
- Show diagnosis
- D3 loss curve with anomaly marker