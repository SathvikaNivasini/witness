import csv
import json
import math
import re
from datetime import datetime

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, confusion_matrix

ALGORITHM_VERSION = "lr-v1-synthetic"

# distance/time scales per category (miles, minutes) - starting guesses to tune
GEO_SCALE_MI = {"Odor": 0.5, "Smoke/Haze": 1.0, "Runoff/Water": 0.3,
                "Dust/Particles": 0.5, "Noise": 0.3}
TIME_SCALE_MIN = {"Odor": 30, "Smoke/Haze": 45, "Runoff/Water": 60,
                  "Dust/Particles": 30, "Noise": 15}

# how plausibly two categories can describe one occurrence (symmetric)
CATEGORY_COMPAT = {("Odor", "Smoke/Haze"): 0.5}

STOPWORDS = {"a", "an", "the", "of", "in", "on", "at", "to", "and", "is", "it", "my", "near",
             "from", "for", "that", "this", "with", "by", "like", "again", "over", "outside"}

FEATURES = ["geo", "time", "category", "text"]
TEXT_MISSING_VALUE = 0.5  # neutral value when either description is empty


def haversine_mi(lat1, lng1, lat2, lng2):
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def tokens(text):
    return {w for w in re.findall(r"[a-z]+", text.lower()) if w not in STOPWORDS and len(w) > 2}


def jaccard(a, b):
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return None
    return len(ta & tb) / len(ta | tb)


def category_score(ca, cb):
    if ca == cb:
        return 1.0
    return CATEGORY_COMPAT.get((ca, cb), CATEGORY_COMPAT.get((cb, ca), 0.0))


def features(a, b):
    """a, b: dicts with category, text, lat, lng, time. Returns [geo, time, category, text]."""
    dist = haversine_mi(a["lat"], a["lng"], b["lat"], b["lng"])
    gap = abs((a["time"] - b["time"]).total_seconds()) / 60.0
    gs = max(GEO_SCALE_MI[a["category"]], GEO_SCALE_MI[b["category"]])
    ts = max(TIME_SCALE_MIN[a["category"]], TIME_SCALE_MIN[b["category"]])
    text = jaccard(a["text"], b["text"])
    return [
        math.exp(-dist / gs),
        math.exp(-gap / ts),
        category_score(a["category"], b["category"]),
        TEXT_MISSING_VALUE if text is None else text,
    ]


def load(path="scenarios.csv"):
    rows = []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            def obs(p):
                return {"category": r[f"{p}_category"], "text": r[f"{p}_text"],
                        "lat": float(r[f"{p}_lat"]), "lng": float(r[f"{p}_lng"]),
                        "time": datetime.strptime(r[f"{p}_time"], "%Y-%m-%d %H:%M")}
            rows.append({"split": r["split"], "type": r["scenario_type"],
                         "x": features(obs("a"), obs("b")), "y": int(r["label"])})
    return rows


def metrics(y, pred):
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    return {
        "n": len(y), "accuracy": round(float((tp + tn) / len(y)), 3),
        "precision": round(float(precision_score(y, pred, zero_division=0)), 3),
        "recall": round(float(recall_score(y, pred, zero_division=0)), 3),
        "false_merges (FP)": int(fp), "missed_links (FN)": int(fn),
    }


def best_threshold(scores, y):
    """Pick the cutoff on TRAIN data only (maximize F1)."""
    best, best_f1 = 0.5, -1
    for t in np.arange(0.2, 0.95, 0.025):
        pred = (scores >= t).astype(int)
        p = precision_score(y, pred, zero_division=0)
        r = recall_score(y, pred, zero_division=0)
        f1 = 0 if p + r == 0 else 2 * p * r / (p + r)
        if f1 > best_f1:
            best, best_f1 = float(t), f1
    return best


def main():
    data = load()
    train = [d for d in data if d["split"] == "train"]
    test = [d for d in data if d["split"] == "test"]
    Xtr, ytr = np.array([d["x"] for d in train]), np.array([d["y"] for d in train])
    Xte, yte = np.array([d["x"] for d in test]), np.array([d["y"] for d in test])
    print(f"SYNTHETIC data | train pairs={len(train)} test pairs={len(test)} "
          f"(split by scenario) | test positives={int(yte.sum())}")

    # Baseline: the guide's hand-picked weights
    hand_w = np.array([0.35, 0.30, 0.15, 0.20])  # geo, time, category, text
    t_hand = best_threshold(Xtr @ hand_w, ytr)
    print(f"\nBaseline (hand weights {hand_w.tolist()}, cutoff {t_hand:.3f} tuned on train)")
    print("  test:", metrics(yte, (Xte @ hand_w >= t_hand).astype(int)))

    # Logistic regression
    model = LogisticRegression(max_iter=1000)
    model.fit(Xtr, ytr)
    w, b = model.coef_[0], float(model.intercept_[0])
    print("\nLogistic regression learned weights:",
          {f: round(float(v), 3) for f, v in zip(FEATURES, w)}, "bias", round(b, 3))
    p_tr = model.predict_proba(Xtr)[:, 1]
    cutoff = best_threshold(p_tr, ytr)
    p_te = model.predict_proba(Xte)[:, 1]
    print(f"  cutoff {cutoff:.3f} (tuned on train only)")
    print("  test:", metrics(yte, (p_te >= cutoff).astype(int)))

    # Error analysis: which scenario types does it get wrong on the test set?
    pred = (p_te >= cutoff).astype(int)
    wrong = {}
    for d, p in zip(test, pred):
        if p != d["y"]:
            wrong[d["type"]] = wrong.get(d["type"], 0) + 1
    print("  test errors by scenario type:", wrong or "none")

    # Ablation: drop one feature at a time
    print("\nAblation (test accuracy / false merges / missed links):")
    for i, name in enumerate(FEATURES):
        keep = [j for j in range(4) if j != i]
        m = LogisticRegression(max_iter=1000).fit(Xtr[:, keep], ytr)
        c = best_threshold(m.predict_proba(Xtr[:, keep])[:, 1], ytr)
        pr = (m.predict_proba(Xte[:, keep])[:, 1] >= c).astype(int)
        r = metrics(yte, pr)
        print(f"  without {name:9s}: acc={r['accuracy']} FP={r['false_merges (FP)']} FN={r['missed_links (FN)']}")

    out = {
        "algorithmVersion": ALGORITHM_VERSION,
        "dataNote": "Trained on SYNTHETIC labeled pairs only; not validated on real reports.",
        "featureOrder": FEATURES, "weights": [float(v) for v in w], "bias": b, "cutoff": cutoff,
        "geoScaleMiles": GEO_SCALE_MI, "timeScaleMinutes": TIME_SCALE_MIN,
        "categoryCompat": {"Odor|Smoke/Haze": 0.5}, "textMissingValue": TEXT_MISSING_VALUE,
        "stopwords": sorted(STOPWORDS),
    }
    with open("weights.json", "w") as f:
        json.dump(out, f, indent=2)
    print("\nWrote weights.json")


if __name__ == "__main__":
    main()
