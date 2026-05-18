from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import AnalyzeRequest, AnalyzeResponse, RunSummary, AskRequest, AskResponse
from app.anomaly_detector import detect_anomalies
from app.diagnosis import generate_diagnosis
from app.ask import answer_question

load_dotenv()

app = FastAPI(
    title="TrainLens AI API",
    description="AI-powered ML training run failure diagnosis API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "TrainLens AI API",
        "version": "0.1.0",
    }


@app.post("/api/ask", response_model=AskResponse)
def ask_trainlens(payload: AskRequest) -> AskResponse:
    return AskResponse(answer=answer_question(payload.question, payload.analysis))


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_training_run(payload: AnalyzeRequest) -> AnalyzeResponse:
    anomalies = detect_anomalies(payload.metrics)
    diagnosis = generate_diagnosis(anomalies)

    return AnalyzeResponse(
        run_name=payload.run_name,
        summary=RunSummary(
            total_steps=len(payload.metrics),
            anomalies_detected=len(anomalies),
        ),
        anomalies=anomalies,
        diagnosis=diagnosis,
    )