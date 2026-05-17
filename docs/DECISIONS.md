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