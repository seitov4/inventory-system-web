from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd


LAG_FEATURES = [1, 2, 3, 7, 14, 21, 30]
ROLLING_WINDOWS = [3, 6, 14, 21, 30]
ROLLING_FUNCTIONS = ["mean", "std", "min", "max", "median"]


@dataclass
class ForecastResult:
    model: str
    horizon: int
    history: List[Dict[str, object]]
    predictions: List[Dict[str, object]]
    summary: Dict[str, float]


class SalesPredictor:
    """Inference flow adapted from airscholar/astro-salesforecast ui SimplePredictor.

    The reference UI builds future rows, copies lag/rolling statistics from the
    uploaded historical data, selects the trained feature columns, then predicts.
    This implementation keeps the same idea while using our local artifacts.
    """

    def __init__(self, loader):
        self.loader = loader

    def forecast(self, raw_df: pd.DataFrame, model_name: str = "ensemble", horizon: int = 30) -> ForecastResult:
        if horizon < 1 or horizon > 365:
            raise ValueError("horizon must be between 1 and 365")

        history = self._prepare_history(raw_df)
        model = self.loader.get_model(model_name)
        future = self._build_future_features(history, horizon)
        raw_predictions = np.maximum(0, np.asarray(model.predict(self._preprocess(future)), dtype=float))
        scale_factor = self._estimate_output_scale(history, model)

        prediction_rows = []
        for row, raw_prediction in zip(future.to_dict("records"), raw_predictions):
            forecast_date = pd.to_datetime(row["date"])
            store_id = str(row["store_id"])
            step = max(
                1,
                int((forecast_date - history[history["store_id"].astype(str) == store_id]["date"].max()).days),
            )
            calibrated_prediction = float(raw_prediction * scale_factor)
            seasonal_prediction = self._seasonal_trend_prediction(history, store_id, forecast_date, step)
            prediction = self._blend_predictions(calibrated_prediction, seasonal_prediction)
            prediction_rows.append(
                {
                    "date": forecast_date.strftime("%Y-%m-%d"),
                    "store_id": store_id,
                    "prediction": round(float(prediction), 2),
                    "raw_prediction": round(float(raw_prediction), 2),
                    "calibrated_prediction": round(float(calibrated_prediction), 2),
                    "seasonal_prediction": round(float(seasonal_prediction), 2),
                    "scale_factor": round(float(scale_factor), 6),
                    "lower_bound": round(float(prediction * 0.9), 2),
                    "upper_bound": round(float(prediction * 1.1), 2),
                }
            )

        values = [item["prediction"] for item in prediction_rows]
        summary = {
            "total_prediction": round(float(np.sum(values)), 2),
            "average_prediction": round(float(np.mean(values)), 2) if values else 0,
            "min_prediction": round(float(np.min(values)), 2) if values else 0,
            "max_prediction": round(float(np.max(values)), 2) if values else 0,
        }

        return ForecastResult(
            model=model_name,
            horizon=horizon,
            history=self._history_points(history),
            predictions=prediction_rows,
            summary=summary,
        )

    def compare_models(self, raw_df: pd.DataFrame, horizon: int = 30) -> Dict[str, ForecastResult]:
        return {
            model_name: self.forecast(raw_df.copy(), model_name=model_name, horizon=horizon)
            for model_name in sorted(self.loader.models)
        }

    def _blend_predictions(self, calibrated_prediction: float, seasonal_prediction: float) -> float:
        if not np.isfinite(calibrated_prediction) or calibrated_prediction <= 0:
            return max(0, seasonal_prediction)
        if not np.isfinite(seasonal_prediction) or seasonal_prediction <= 0:
            return max(0, calibrated_prediction)

        # The trained model contributes level, the uploaded CSV contributes local seasonality.
        return max(0, 0.35 * calibrated_prediction + 0.65 * seasonal_prediction)

    def _prepare_history(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df.columns = [str(col).strip() for col in df.columns]

        if "date" not in df.columns:
            raise ValueError("CSV must include a 'date' column")
        if "sales" not in df.columns:
            if "revenue" in df.columns:
                df["sales"] = df["revenue"]
            elif "total" in df.columns:
                df["sales"] = df["total"]
            else:
                raise ValueError("CSV must include 'sales', 'revenue', or 'total'")

        if "store_id" not in df.columns:
            df["store_id"] = "store_001"

        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df["sales"] = pd.to_numeric(df["sales"], errors="coerce")
        df = df.dropna(subset=["date", "sales"])
        if df.empty:
            raise ValueError("CSV does not contain valid dated sales rows")

        defaults = {
            "has_promotion": 0,
            "quantity_sold": 100,
            "profit": 1000,
            "customer_traffic": 500,
            "is_holiday": 0,
        }
        for col, value in defaults.items():
            if col not in df.columns:
                df[col] = value
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        grouped = (
            df.groupby(["date", "store_id"], as_index=False)
            .agg(
                sales=("sales", "sum"),
                has_promotion=("has_promotion", "mean"),
                quantity_sold=("quantity_sold", "sum"),
                profit=("profit", "sum"),
                customer_traffic=("customer_traffic", "mean"),
                is_holiday=("is_holiday", "max"),
            )
            .sort_values(["store_id", "date"])
        )
        return grouped

    def _build_future_features(self, history: pd.DataFrame, horizon: int) -> pd.DataFrame:
        frames = []
        for store_id, store_history in history.groupby("store_id"):
            store_history = store_history.sort_values("date")
            last_date = store_history["date"].max()
            future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=horizon, freq="D")
            future = pd.DataFrame({"date": future_dates, "store_id": store_id})

            future = self._prepare_reference_features(future)
            future = self._copy_history_features(future, store_history)
            frames.append(future)

        return pd.concat(frames, ignore_index=True)

    def _prepare_reference_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"])
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month
        df["day"] = df["date"].dt.day
        df["dayofweek"] = df["date"].dt.dayofweek
        df["quarter"] = df["date"].dt.quarter
        df["weekofyear"] = df["date"].dt.isocalendar().week.astype(int)
        df["is_weekend"] = df["dayofweek"].isin([5, 6]).astype(int)

        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        df["day_sin"] = np.sin(2 * np.pi * df["day"] / 31)
        df["day_cos"] = np.cos(2 * np.pi * df["day"] / 31)
        df["dayofweek_sin"] = np.sin(2 * np.pi * df["dayofweek"] / 7)
        df["dayofweek_cos"] = np.cos(2 * np.pi * df["dayofweek"] / 7)
        return df

    def _copy_history_features(self, future: pd.DataFrame, history: pd.DataFrame) -> pd.DataFrame:
        future = future.copy()
        recent_sales = history["sales"].tail(30).to_numpy(dtype=float)
        sales_mean = float(history["sales"].mean())

        for lag in LAG_FEATURES:
            future[f"sales_lag_{lag}"] = recent_sales[-lag] if len(recent_sales) >= lag else sales_mean

        for window in ROLLING_WINDOWS:
            if len(recent_sales) >= window:
                window_values = recent_sales[-window:]
            else:
                window_values = recent_sales if len(recent_sales) else np.array([sales_mean])

            stats = {
                "mean": np.mean(window_values),
                "std": np.std(window_values),
                "min": np.min(window_values),
                "max": np.max(window_values),
                "median": np.median(window_values),
            }
            for func in ROLLING_FUNCTIONS:
                future[f"sales_rolling_{window}_{func}"] = float(stats[func])

        recent = history.tail(min(30, len(history)))
        future["has_promotion"] = 0
        future["quantity_sold"] = float(recent["quantity_sold"].mean()) if "quantity_sold" in recent else 100
        future["profit"] = float(recent["profit"].mean()) if "profit" in recent else 1000
        future["customer_traffic"] = float(recent["customer_traffic"].mean()) if "customer_traffic" in recent else 500
        future["is_holiday"] = 0
        return future

    def _build_historical_features(self, history: pd.DataFrame) -> pd.DataFrame:
        frames = []
        for _, store_history in history.groupby("store_id"):
            store_history = store_history.sort_values("date").copy()
            featured = self._prepare_reference_features(store_history)

            for lag in LAG_FEATURES:
                featured[f"sales_lag_{lag}"] = featured["sales"].shift(lag)

            for window in ROLLING_WINDOWS:
                rolling = featured["sales"].rolling(window, min_periods=1)
                featured[f"sales_rolling_{window}_mean"] = rolling.mean()
                featured[f"sales_rolling_{window}_std"] = rolling.std().fillna(0)
                featured[f"sales_rolling_{window}_min"] = rolling.min()
                featured[f"sales_rolling_{window}_max"] = rolling.max()
                featured[f"sales_rolling_{window}_median"] = rolling.median()

            sales_mean = float(featured["sales"].mean())
            for col in featured.columns:
                if "sales_lag" in col or "sales_rolling" in col:
                    featured[col] = featured[col].fillna(sales_mean)

            frames.append(featured)

        return pd.concat(frames, ignore_index=True)

    def _estimate_output_scale(self, history: pd.DataFrame, model) -> float:
        if len(history) < 14:
            return 1.0

        featured = self._build_historical_features(history).tail(min(30, len(history)))
        raw_predictions = np.maximum(0, np.asarray(model.predict(self._preprocess(featured)), dtype=float))
        actual = featured["sales"].to_numpy(dtype=float)
        valid = (raw_predictions > 1e-6) & (actual > 0) & np.isfinite(raw_predictions) & np.isfinite(actual)
        if not valid.any():
            return 1.0

        ratios = actual[valid] / raw_predictions[valid]
        ratios = ratios[np.isfinite(ratios)]
        if len(ratios) == 0:
            return 1.0

        return float(np.clip(np.median(ratios), 0.01, 100000.0))

    def _seasonal_trend_prediction(
        self,
        history: pd.DataFrame,
        store_id: str,
        forecast_date: pd.Timestamp,
        step: int,
    ) -> float:
        store_history = history[history["store_id"].astype(str) == str(store_id)].sort_values("date")
        if store_history.empty:
            return 0.0

        recent = store_history.tail(min(56, len(store_history))).copy()
        sales = recent["sales"].astype(float)
        baseline = float(sales.ewm(span=min(14, len(sales)), adjust=False).mean().iloc[-1])

        trend = 0.0
        if len(recent) >= 14:
            y = sales.tail(min(35, len(sales))).to_numpy(dtype=float)
            x = np.arange(len(y), dtype=float)
            slope = float(np.polyfit(x, y, 1)[0])
            max_daily_move = max(float(np.std(y)) * 0.08, baseline * 0.012)
            trend = float(np.clip(slope, -max_daily_move, max_daily_move)) * step

        trend_level = max(0, baseline + trend)

        target_weekday = forecast_date.dayofweek
        overall_median = float(sales.median())
        weekday_values = recent[recent["date"].dt.dayofweek == target_weekday]["sales"].astype(float)
        weekday_factor = 1.0
        if overall_median > 0 and not weekday_values.empty:
            weekday_factor = float(np.clip(weekday_values.median() / overall_median, 0.78, 1.25))

        # Farther forecasts should rely less on repeating the exact weekday shape.
        weekly_strength = float(np.clip(1 - (step - 1) / 75, 0.35, 1.0))
        seasonal_level = trend_level * (1 + (weekday_factor - 1) * weekly_strength)

        residual_adjustment = 0.0
        if len(recent) >= 14:
            rolling_baseline = sales.rolling(7, min_periods=3).mean().bfill()
            residuals = (sales - rolling_baseline).tail(min(28, len(sales))).to_numpy(dtype=float)
            if len(residuals) > 0:
                # Walk through the last residual pattern with a non-weekly stride
                # and quickly damp it so it adds texture without replaying history.
                residual_index = ((step - 1) * 5) % len(residuals)
                residual_damping = float(np.exp(-(step - 1) / 35))
                residual_adjustment = float(residuals[residual_index] * 0.28 * residual_damping)

        return max(0, seasonal_level + residual_adjustment)

    def _preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        feature_cols = list(self.loader.feature_cols)
        if not feature_cols:
            feature_cols = [col for col in df.columns if col != "date"]

        x = df.copy()
        for col in feature_cols:
            if col not in x.columns:
                x[col] = 0

        x = x[feature_cols].copy()

        for col, encoder in self.loader.encoders.items():
            if col not in x.columns:
                continue
            values = x[col].astype(str)
            known = set(encoder.classes_)
            fallback = encoder.classes_[0] if len(encoder.classes_) else ""
            values = [value if value in known else fallback for value in values]
            x[col] = encoder.transform(values)

        for col in x.select_dtypes(include=["object"]).columns:
            x[col] = pd.factorize(x[col].astype(str))[0]

        x = x.apply(pd.to_numeric, errors="coerce").fillna(0)

        scaler = (
            self.loader.scalers.get("standart")
            or self.loader.scalers.get("standard")
            or self.loader.scalers.get("features")
        )
        if scaler is not None:
            x = pd.DataFrame(scaler.transform(x), columns=feature_cols, index=df.index)
        return x

    def _history_points(self, history: pd.DataFrame) -> List[Dict[str, object]]:
        return [
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "store_id": str(row["store_id"]),
                "actual": round(float(row["sales"]), 2),
            }
            for _, row in history.sort_values(["store_id", "date"]).iterrows()
        ]
