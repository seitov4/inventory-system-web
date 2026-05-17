import numpy as np


class EnsembleModel:
    def __init__(self, models, weights=None):
        self.models = models
        if weights is None:
            weight = 1.0 / len(models)
            self.weights = {name: weight for name in models}
        else:
            total = sum(weights.values())
            self.weights = {name: value / total for name, value in weights.items()}

    def predict(self, x):
        predictions = []
        weights = []
        for name, model in self.models.items():
            weight = self.weights.get(name, 0)
            if weight <= 0:
                continue
            predictions.append(model.predict(x))
            weights.append(weight)

        if not predictions:
            raise ValueError("No models available for ensemble prediction")

        return np.average(np.array(predictions), axis=0, weights=np.array(weights))
