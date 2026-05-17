# TrainLens AI Roadmap

## Week 1 — Core Diagnosis Loop

Goal: prove that TrainLens can analyze a training log and return a useful diagnosis.

### Tasks

- Create project documentation
- Create FastAPI backend
- Use uv for backend dependency management
- Add sample training logs
- Implement loss divergence detection
- Return mocked diagnosis
- Add API documentation
- Add basic backend tests

### Week 1 Definition of Done

- `/api/analyze` accepts a JSON training log
- Backend detects loss divergence
- Backend returns structured anomaly data
- Backend returns mocked diagnosis
- Code is pushed to GitHub

---

## Week 2 — Dashboard and Visualization

Goal: make the project visually impressive and demo-ready.

### Tasks

- Create React + TypeScript frontend using Vite
- Add API client for backend
- Add sample log analysis button
- Build D3 loss curve chart
- Add anomaly marker on failure step
- Build diagnosis panel
- Build remediation checklist
- Add loading and error states

### Week 2 Definition of Done

- User can click a button to analyze sample log
- Loss curve renders in UI
- Failure point is marked visually
- Diagnosis appears in panel
- Screenshot is ready for README and LinkedIn

---

## Week 3 — AI Layer, Polish, and Launch

Goal: turn the MVP into a public portfolio project.

### Tasks

- Replace mocked diagnosis with Claude/OpenAI diagnosis
- Add postmortem markdown export
- Improve README
- Add screenshots
- Record demo GIF
- Deploy frontend
- Deploy backend
- Add project to LinkedIn Featured
- Add project to resume

### Week 3 Definition of Done

- Public GitHub repo is polished
- Live demo is available
- README explains setup and architecture
- Demo GIF shows the full workflow
- LinkedIn launch post is published