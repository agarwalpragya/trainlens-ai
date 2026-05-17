# TrainLens AI

AI-powered ML training run failure diagnosis platform.

TrainLens parses ML training logs and metrics, detects failure patterns including loss divergence, vanishing gradients, GPU underutilization, OOM risk, and training stalls, and returns structured root-cause analysis with remediation steps.

## Stack

- **Backend:** Python 3.12, FastAPI, Pydantic, uv
- **Frontend:** React, TypeScript, Vite, D3.js _(Week 2)_

## Detected anomaly types

| Anomaly | Severity |
|---|---|
| Loss divergence | critical |
| Vanishing gradients | warning |
| GPU underutilization | warning |
| OOM risk | critical |
| Training stall | warning |

## Run the backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

API available at `http://localhost:8000`.  
Interactive docs at `http://localhost:8000/docs`.

## Run tests

```bash
cd backend
uv run pytest
```

## Try it with a sample log

Run from the repo root (not from inside `backend/`):

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d @sample_logs/diverging_run.json
```

Other sample logs available in `sample_logs/`:

| File | Anomaly triggered |
|---|---|
| `diverging_run.json` | loss_divergence |
| `vanishing_gradients.json` | vanishing_gradients |
| `gpu_underutilized.json` | gpu_underutilization |
| `oom_risk.json` | oom_risk |
| `training_stall.json` | training_stall |
| `normal_run.json` | none |

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API Specification](docs/API_SPEC.md)
- [Data Model](docs/DATA_MODEL.md)
- [Decisions](docs/DECISIONS.md)
- [Roadmap](docs/ROADMAP.md)
