# Architecture Decisions

This document records major technical decisions and the reasoning behind them.

---

## ADR-001: Use FastAPI for backend

### Decision

Use FastAPI for the MVP backend.

### Reason

FastAPI is lightweight, typed, easy to document, and well-suited for JSON API development.

### Alternatives Considered

- Django REST Framework
- Flask

### Consequences

Fast MVP velocity, clean API contracts, and simple local development.

---

## ADR-002: Use uv for Python dependency management

### Decision

Use uv with `pyproject.toml` and `uv.lock`.

### Reason

uv provides fast dependency installation and modern Python project management.

### Alternatives Considered

- pip + requirements.txt
- Poetry

### Consequences

Cleaner dependency management and a more modern repo structure.

---

## ADR-003: Start with rule-based anomaly detection before LLM diagnosis

### Decision

Run rule-based detectors over the metric history before sending any context to an LLM. The detectors produce structured `Anomaly` objects, each with a `context_window` of surrounding steps. The diagnosis layer receives this structured output, not raw logs.

### Reason

LLMs produce better diagnoses when given focused evidence rather than raw logs. Pre-processing provides three specific benefits:

1. **Accuracy** — a detector that checks `gradient_norm < 0.001 for 5+ consecutive steps` is deterministic. An LLM inspecting a raw 10,000-step log may miss it or hallucinate a different failure.
2. **Explainability** — each `Anomaly` has a typed `detected_at_step`, `severity`, `confidence`, and `relevant_metrics`. These fields can be displayed in the UI without parsing free-form text.
3. **Token efficiency** — only the `context_window` (up to ±10 surrounding steps) is sent to the LLM, not the full run.

### Alternatives Considered

- Send raw logs directly to Claude/OpenAI
- Use only statistical rules with no natural-language explanation

### Consequences

The system is more reliable, easier to test, and cheaper to operate. The rule layer and the LLM layer can be developed and evaluated independently.

---

## ADR-004: Delay database until after the core loop works

### Decision

Do not add PostgreSQL on Day 1.

### Reason

The first milestone is to prove the core flow:

training log → anomaly detection → diagnosis response.

Adding persistence too early increases complexity without improving the first demo.

### Alternatives Considered

- Add PostgreSQL immediately
- Store all analysis runs from the beginning

### Consequences

Faster Day 1 implementation. Persistence can be added in Week 2 or Week 3.

---

## ADR-005: Use mocked diagnosis before real AI API

### Decision

Start with a mocked diagnosis response.

### Reason

The anomaly detector should work independently before integrating Claude/OpenAI.

### Alternatives Considered

- Integrate Claude API immediately

### Consequences

Lower setup friction, no API key needed on Day 1, and easier backend testing.

### Status

Decision implemented as planned. Claude diagnosis (via `app/diagnosis.py`) was added in Week 3, with the deterministic fallback remaining active when `ANTHROPIC_API_KEY` is absent or the API call fails.

---

## ADR-006: Pass full AnalyzeResponse as context for Ask TrainLens Q&A

### Decision

The `POST /api/ask` endpoint accepts the full `AnalyzeResponse` alongside the user's question, rather than storing analysis results server-side and referencing them by ID.

### Reason

This approach avoids introducing a persistence layer (database or cache) at the MVP stage. The client already holds the `AnalyzeResponse` from the prior `/api/analyze` call, so passing it back is stateless and straightforward.

The prompt sent to Claude is constructed from the structured anomaly and diagnosis fields, not free-form text, ensuring focused and evidence-grounded answers.

### Alternatives Considered

- Store analysis results in PostgreSQL and reference by run ID
- Cache results in Redis with a TTL

### Consequences

Simple stateless implementation with no storage dependency. The tradeoff is larger request payloads when the context window is long, and no ability to retrieve or share past analyses. Persistence can be added later without changing the Q&A contract.

---

## ADR-007: Unified data source card over two separate components

### Decision

Replace the separate `SampleRunSelector` and `JsonUploadCard` components with a single `DataSourceCard` that uses a tab toggle to switch between sample run and upload modes.

### Reason

The original two-card layout allowed a user to have both a sample run selected and an uploaded file present simultaneously. The active payload was resolved silently with `uploadedPayload ?? samplePayload`, giving no visible indication of which source would be analyzed. This caused confusion: the Analyze button was inside the sample selector card, making it look unrelated to uploaded files.

The unified card makes the two modes explicitly mutually exclusive. Switching tabs clears the inactive source and resets the analysis. The standalone Analyze button below the card carries a context label ("Analyze · Loss Divergence" or "Analyze · my_run.json") so the user always knows what will be submitted.

### Alternatives Considered

- Keep two separate cards but add visible precedence indicators
- Add a separate "active source" label above the Analyze button

### Consequences

Cleaner mental model: one card = one data source. The Analyze button's label is the single source of truth for what will be analyzed. Slight increase in component complexity (one component owns both the select and the FileReader logic).

---

## ADR-008: Railway for backend, Vercel for frontend

### Decision

Deploy the FastAPI backend to Railway and the React frontend to Vercel.

### Reason

Both platforms offer zero-config deployments from a GitHub repo and free tiers suitable for a portfolio project.

- **Vercel** is purpose-built for static/SPA frontends. The Vite build output deploys with a single config file and handles CDN distribution automatically.
- **Railway** runs arbitrary Dockerless server processes. It detects the Python/FastAPI project, runs `uv sync` and starts `uvicorn`, and provides persistent env vars for `ANTHROPIC_API_KEY`.

Keeping the two layers on separate platforms makes them independently scalable and avoids bundling a Python server into a Vercel serverless function (which has cold-start and timeout constraints that would affect long diagnosis requests).

### Alternatives Considered

- Render (supports both static sites and Python services, slightly more configuration)
- Fly.io (more control, more ops overhead)
- Single platform for both (would require a monorepo adapter or server-side rendering)

### Consequences

Frontend and backend have independent deployment pipelines. CORS must be explicitly configured on the FastAPI backend to allow the Vercel origin. `VITE_API_BASE_URL` must be set in the Vercel project env vars to point to the Railway backend URL.