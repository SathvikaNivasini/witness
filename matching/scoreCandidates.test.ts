import { describe, expect, it } from "vitest";

import reference from "./reference.json";
import { scorePair, type Observation } from "./scoreCandidates";

interface ReferencePair {
  pairId: string;
  scenarioType: string;
  label: number;
  a: Observation;
  b: Observation;
  features: { geo: number; time: number; category: number; text: number };
  probability: number;
}

const pairs = reference as ReferencePair[];
const FEATURE_NAMES = ["geo", "time", "category", "text"] as const;

const DIGITS = 6;

describe("scoreCandidates matches train.py", () => {
  it("loaded the reference pairs", () => {
    expect(pairs.length).toBe(20);
  });

  it.each(pairs)("$pairId ($scenarioType, label $label)", (pair) => {
    const scored = scorePair(pair.a, pair.b);

    for (const name of FEATURE_NAMES) {
      expect(scored.modelFeatures[name]).toBeCloseTo(pair.features[name], DIGITS);
    }
    expect(scored.probability).toBeCloseTo(pair.probability, DIGITS);
  });
});
