import os
from pathlib import Path
from typing import Dict, Optional

import boto3
import joblib
from botocore.client import Config


MODEL_FILES = {
    "xgboost": ["xgboost/xgboost_model.pkl", "models/xgboost/xgboost_model.pkl"],
    "lightgbm": ["lightgbm/lightgbm_model.pkl", "models/lightgbm/lightgbm_model.pkl"],
    "ensemble": ["ensemble/ensemble_model.pkl", "models/ensemble/ensemble_model.pkl"],
}

ARTIFACT_FILES = {
    "scalers": "scalers.pkl",
    "encoders": "encoders.pkl",
    "feature_cols": "feature_cols.pkl",
}


class ModelLoader:
    def __init__(self, model_dir: Optional[str] = None):
        default_model_dir = Path(__file__).resolve().parent / "models"
        self.model_dir = Path(model_dir or os.getenv("MODEL_DIR", default_model_dir))
        self.models: Dict[str, object] = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_cols = []

    def load(self) -> None:
        self._download_from_s3_if_configured()
        self.models = {}
        for name, relative_paths in MODEL_FILES.items():
            model_path = self._first_existing(relative_paths)
            if model_path:
                self.models[name] = joblib.load(model_path)

        scalers_path = self.model_dir / ARTIFACT_FILES["scalers"]
        encoders_path = self.model_dir / ARTIFACT_FILES["encoders"]
        feature_cols_path = self.model_dir / ARTIFACT_FILES["feature_cols"]

        if scalers_path.exists():
            self.scalers = joblib.load(scalers_path)
        if encoders_path.exists():
            self.encoders = joblib.load(encoders_path)
        if feature_cols_path.exists():
            self.feature_cols = joblib.load(feature_cols_path)

    def _first_existing(self, relative_paths):
        for relative_path in relative_paths:
            candidate = self.model_dir / relative_path
            if candidate.exists():
                return candidate
        return None

    def status(self) -> Dict[str, object]:
        return {
            "model_dir": str(self.model_dir),
            "loaded_models": sorted(self.models.keys()),
            "missing_models": sorted(set(MODEL_FILES) - set(self.models)),
            "has_scaler": bool(self.scalers),
            "has_encoders": bool(self.encoders),
            "feature_count": len(self.feature_cols),
        }

    def get_model(self, model_name: str):
        if model_name not in self.models:
            available = ", ".join(sorted(self.models)) or "none"
            raise ValueError(f"Model '{model_name}' is not loaded. Available: {available}")
        return self.models[model_name]

    def _download_from_s3_if_configured(self) -> None:
        bucket = os.getenv("MODEL_S3_BUCKET")
        prefix = os.getenv("MODEL_S3_PREFIX", "").strip("/")
        endpoint_url = os.getenv("MLFLOW_S3_ENDPOINT_URL")
        if not bucket:
            return

        self.model_dir.mkdir(parents=True, exist_ok=True)
        client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            config=Config(signature_version="s3v4"),
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        )

        model_download_paths = [paths[0] for paths in MODEL_FILES.values()]
        for relative_path in [*model_download_paths, *ARTIFACT_FILES.values()]:
            key = f"{prefix}/{relative_path}" if prefix else relative_path
            target = self.model_dir / relative_path
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists():
                continue
            client.download_file(bucket, key, str(target))
