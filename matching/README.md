# Witness matching model

This folder preserves the existing synthetic-data model, dataset generator, training script, learned weights, and Python reference outputs from `SathvikaNivasini/witness`.

The Next.js backend calls `scoreCandidates.ts` directly through `src/lib/server/match-observation.ts`. Start the app with `npm run dev` from the repository root; no separate Python process or API credentials are needed at runtime.

`GET /api/matches` describes the loaded model. `POST /api/matches` accepts an observation's category, description, timestamp with timezone, and approximate coordinates. The backend validates and rounds the coordinates, translates the interface's category IDs to the model's category names, scores the demo events' constituent notes, and returns the strongest qualifying note per event. Only same or model-supported related categories are suggested.

The model's weights, scales, and cutoff are unchanged. The TypeScript model adds a JSON import attribute for Node.js compatibility. Its original 20-pair parity checks now run on the built-in Node test runner instead of requiring Vitest:

```sh
npm test
```

Scores are from `lr-v1-synthetic`, trained on synthetic pairs and not validated against real environmental reports. They do not verify a source or measure pollution or health risk. Rounded locations can reduce matching accuracy, especially near grid boundaries.

For optional retraining, use a Python environment with NumPy and scikit-learn, then run `make_dataset.py`, `train.py`, and `dump_reference.py` from this folder. Training is separate from serving the app; review model changes and reference checks before publishing new weights.
