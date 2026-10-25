import csv
import json
from collections import defaultdict
from datetime import datetime

import numpy as np
from sklearn.linear_model import LogisticRegression

import train

N_PAIRS = 20


def observation(row, side):
    """The dict shape train.features expects."""
    return {"category": row[f"{side}_category"], "text": row[f"{side}_text"],
            "lat": float(row[f"{side}_lat"]), "lng": float(row[f"{side}_lng"]),
            "time": datetime.strptime(row[f"{side}_time"], "%Y-%m-%d %H:%M")}


def observation_json(row, side):
    """The dict shape the TypeScript Observation expects."""
    return {"id": row[f"{side}_id"], "category": row[f"{side}_category"],
            "text": row[f"{side}_text"], "lat": float(row[f"{side}_lat"]),
            "lng": float(row[f"{side}_lng"]), "reportedTime": row[f"{side}_time"]}


def pick_pairs(rows):
    """Round-robin over (scenario type, label) so the sample covers both, not just the common cases."""
    groups = defaultdict(list)
    for row in rows:
        groups[(row["scenario_type"], row["label"])].append(row)
    keys = sorted(groups)
    picked, i = [], 0
    while len(picked) < N_PAIRS and any(groups[k] for k in keys):
        bucket = groups[keys[i % len(keys)]]
        if bucket:
            picked.append(bucket.pop(0))
        i += 1
    return picked


def main():
    data = train.load()
    Xtr = np.array([d["x"] for d in data if d["split"] == "train"])
    ytr = np.array([d["y"] for d in data if d["split"] == "train"])
    model = LogisticRegression(max_iter=1000).fit(Xtr, ytr)

    with open("scenarios.csv", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    picked = pick_pairs(rows)

    X = np.array([train.features(observation(r, "a"), observation(r, "b")) for r in picked])
    probs = model.predict_proba(X)[:, 1]

    out = [
        {"pairId": row["pair_id"], "scenarioType": row["scenario_type"], "label": int(row["label"]),
         "a": observation_json(row, "a"), "b": observation_json(row, "b"),
         "features": {name: float(v) for name, v in zip(train.FEATURES, x)},
         "probability": float(p)}
        for row, x, p in zip(picked, X, probs)
    ]
    with open("reference.json", "w") as f:
        json.dump(out, f, indent=2)

    # A refit that drifted from weights.json would make a TS mismatch look like a port bug,
    # so print both and let the mismatch show itself here instead.
    with open("weights.json") as f:
        exported = json.load(f)
    print("refit weights:", [round(float(v), 9) for v in model.coef_[0]],
          "bias", round(float(model.intercept_[0]), 9))
    print("weights.json :", [round(v, 9) for v in exported["weights"]],
          "bias", round(exported["bias"], 9))
    print(f"Wrote reference.json ({len(out)} pairs, "
          f"{sum(p['label'] for p in out)} positive, "
          f"{len(set(p['scenarioType'] for p in out))} scenario types)")


if __name__ == "__main__":
    main()
