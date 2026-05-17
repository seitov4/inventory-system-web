from io import BytesIO

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model_loader import ModelLoader
from predictor import SalesPredictor


app = FastAPI(title="Inventory Sales Forecast ML Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

loader = ModelLoader()
predictor = SalesPredictor(loader)


@app.on_event("startup")
def load_models():
    loader.load()


@app.get("/health")
def health():
    return {"status": "ok", **loader.status()}


@app.get("/models/status")
def models_status():
    return loader.status()


@app.get("/models/metrics")
def models_metrics():
    return {
        "message": "Training metrics are produced by the Airflow/MLflow pipeline. Mount or expose reports to return them here.",
        "loaded_models": sorted(loader.models.keys()),
    }


@app.get("/visualizations")
def visualizations():
    return {
        "message": "Visualization files can be served by mounting the MLflow visualizations directory or copying it into ml-service/static.",
        "available": [],
    }


@app.post("/forecast")
async def forecast(
    file: UploadFile = File(...),
    model: str = Form("ensemble"),
    horizon: int = Form(30),
    compare: bool = Form(False),
):
    try:
        content = await file.read()
        df = pd.read_csv(BytesIO(content))
        if compare:
            results = predictor.compare_models(df, horizon=horizon)
            first_result = next(iter(results.values()), None)
            return {
                "mode": "comparison",
                "history": first_result.history if first_result else [],
                "results": {name: result.__dict__ for name, result in results.items()},
            }
        result = predictor.forecast(df, model_name=model, horizon=horizon)
        return {"mode": "single", **result.__dict__}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {exc}")
