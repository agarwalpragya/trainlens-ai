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
- [x] Return deterministic diagnosis per anomaly type with remediation steps
- [x] Add API documentation and data model docs
- [x] 34 backend tests passing

### Definition of Done

- [x] `/api/analyze` accepts a JSON training log
- [x] Backend detects five anomaly types
- [x] Backend returns structured anomaly data with context window
- [x] Backend returns typed diagnosis per anomaly type
- [x] All documentation reflects the implemented API and data models
- [x] Code is pushed to GitHub

---

## Week 2 — Dashboard and Visualization

Status: **complete**

Goal: make the project visually demo-ready.

### Completed

- [x] Create React + TypeScript frontend using Vite
- [x] Add API client for backend
- [x] Add sample log analysis button
- [x] Build D3 loss curve chart
- [x] Add anomaly marker on failure step
- [x] Build diagnosis panel
- [x] Build remediation checklist
- [x] Add loading and error states

### Definition of Done

- [x] User can click a button to analyze a sample log
- [x] Loss curve renders in the UI
- [x] Failure point is marked visually
- [x] Diagnosis appears in a panel
- [x] Screenshot is ready for README and LinkedIn

---

## Week 3 — AI Layer, Polish, and Launch

Status: **complete**

Goal: turn the MVP into a public portfolio project.

### Completed

- [x] Replace deterministic diagnosis with Claude-powered diagnosis and deterministic fallback
- [x] Add Ask TrainLens follow-up Q&A (POST /api/ask) with Claude and fallback
- [x] Add postmortem Markdown export
- [x] UI polish and responsive cleanup — premium dark theme, sticky header
- [x] Mentor-style loading card with animated signal bars and rotating messages
- [x] Two-column layout with sticky Ask TrainLens sidebar on wide screens
- [x] Cross-highlighting between anomaly cards and D3 chart markers
- [x] Screenshots in README
- [x] Demo GIF in README

### Remaining

- [ ] Frontend file upload for real training logs
- [ ] Frontend unit tests
- [ ] Deployed demo
- [ ] Add project to LinkedIn Featured
- [ ] Add project to resume

### Definition of Done

- [x] Public GitHub repo is polished
- [x] README explains setup and architecture
- [x] Demo GIF shows the full workflow
- [ ] Live demo is available
- [ ] LinkedIn launch post is published
