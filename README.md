# TrainLens AI

AI-powered ML training run failure diagnosis platform.

TrainLens parses ML training logs and metrics, detects failure patterns such as loss divergence and exploding gradients, and returns structured root-cause analysis with remediation steps.

## Stack

- **Backend:** Python 3.12, FastAPI, Pydantic, uv
- **Frontend:** React, TypeScript, Vite, D3.js _(Week 2)_

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

## Try it with the sample log

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d @sample_logs/diverging_run.json
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [API Specification](docs/API_SPEC.md)
- [Data Model](docs/DATA_MODEL.md)
- [Decisions](docs/DECISIONS.md)
- [Roadmap](docs/ROADMAP.md)
