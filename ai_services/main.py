from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import uvicorn

# Import sub-services
from notes_service import generate_notes
from nlp_service import classify_intent, extract_keywords, calculate_similarity

app = FastAPI(title="IntelliCampus AI Intelligence Ecosystem", version="1.0.0")

class NoteRequest(BaseModel):
    topic: str
    detail_level: Optional[str] = "standard"

class ClassifyRequest(BaseModel):
    text: str

class KeywordsRequest(BaseModel):
    text: str

class SimilarityRequest(BaseModel):
    text1: str
    text2: str

class RiskRequest(BaseModel):
    avgMarks: float
    attendanceRate: float

@app.get("/health")
def health():
    return { "status": "INTELLIGENCE_LAYER_ONLINE", "version": "1.0.0" }

@app.post("/predict-risk")
async def predict_risk_api(req: RiskRequest):
    try:
        # Specialized ML-like logic for failure risk
        # This could be replaced with a loaded scikit-learn model
        risk_score = (100 - req.avgMarks) * 0.7 + (100 - req.attendanceRate) * 0.3
        
        status = "LOW"
        if risk_score > 60: status = "HIGH"
        elif risk_score > 30: status = "MEDIUM"
        
        return { 
            "success": True, 
            "risk": status, 
            "probability": round(risk_score / 100, 2),
            "engine": "DETERMINISTIC_VECTOR_MODEL"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notes")
async def notes_api(req: NoteRequest):
    try:
        notes = generate_notes(req.topic, req.detail_level)
        return { "success": True, "notes": notes }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify")
async def classify_api(req: ClassifyRequest):
    try:
        intent = classify_intent(req.text)
        return { "success": True, "intent": intent }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keywords")
async def keywords_api(req: KeywordsRequest):
    try:
        keywords = extract_keywords(req.text)
        return { "success": True, "keywords": keywords }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity")
async def similarity_api(req: SimilarityRequest):
    try:
        score = calculate_similarity(req.text1, req.text2)
        return { "success": True, "score": float(score) }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
