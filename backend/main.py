from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from pathlib import Path

app = FastAPI(title="DropGame Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "storage.json"
if not DATA_FILE.exists():
    DATA_FILE.write_text(json.dumps({"best_score": 0}, ensure_ascii=False, indent=2))

class Score(BaseModel):
    score: int

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/highscore")
def get_highscore():
    try:
        data = json.loads(DATA_FILE.read_text())
        return {"best_score": data.get("best_score", 0)}
    except Exception:
        return {"best_score": 0}

@app.post("/highscore")
def set_highscore(payload: Score):
    try:
        data = json.loads(DATA_FILE.read_text())
    except Exception:
        data = {"best_score": 0}
    if payload.score > data.get("best_score", 0):
        data["best_score"] = payload.score
        DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    return {"best_score": data.get("best_score", 0)}
