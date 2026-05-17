# TrainLens AI Roadmap

## Backend v1 — Core Diagnosis Loop

Status: **complete**

Goal: prove that TrainLens can analyze a training log and return a useful diagnosis.

### Completed

- [x] Create project documentation
- [x] Create FastAPI backend
- [x] Use uv for backend dependency management
- [x] Add sample training logs for all anomaly scenarios
- [x] Implement loss divergence detection
- [x] Implement vanishing gradients detection
- [x] Implement GPU underutilization detection
- [x] Implement OOM risk detection
- [x] Implement training stall detection
- [x] Return mock diagnosis per anomaly type with remediation steps
- [x] Add API documentation and data model docs
- [x] 21 backend tests passing

### Definition of Done

- [x] `/api/analyze` accepts a JSON training log
- [x] Backend detects five anomaly types
- [x] Backend returns structured anomaly data with context window
- [x] Backend returns typed mock diagnosis per anomaly type
- [x] All documentation reflects the implemented API and data models
- [x] Code is pushed to GitHub

---

## Week 2 — Dashboard and Visualization

Goal: make the project visually demo-ready.

### Tasks

- [ ] Create React + TypeScript frontend using Vite
- [ ] Add API client for backend
- [ ] Add sample log analysis button
- [ ] Build D3 loss curve chart
- [ ] Add anomaly marker on failure step
- [ ] Build diagnosis panel
- [ ] Build remediation checklist
- [ ] Add loading and error states

### Definition of Done

- [ ] User can click a button to analyze a sample log
- [ ] Loss curve renders in the UI
- [ ] Failure point is marked visually
- [ ] Diagnosis appears in a panel
- [ ] Screenshot is ready for README and LinkedIn

---

## Week 3 — AI Layer, Polish, and Launch

Goal: turn the MVP into a public portfolio project.

### Tasks

- [ ] Replace mocked diagnosis with Claude/OpenAI diagnosis
- [ ] Add postmortem markdown export
- [ ] Improve README with screenshots
- [ ] Record demo GIF
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Add project to LinkedIn Featured
- [ ] Add project to resume

### Definition of Done

- [ ] Public GitHub repo is polished
- [ ] Live demo is available
- [ ] README explains setup and architecture
- [ ] Demo GIF shows the full workflow
- [ ] LinkedIn launch post is published
