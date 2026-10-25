import { describe, it } from "node:test";
import assert from "node:assert/strict";
import reference from "./reference.json" with { type: "json" };
import { scorePair } from "./scoreCandidates.ts";

const featureNames = ["geo", "time", "category", "text"] as const;

describe("scoreCandidates matches train.py", () => {
  it("loads all 20 reference pairs", () => {
    assert.equal(reference.length, 20);
  });
  for (const pair of reference) {
    it(`${pair.pairId} (${pair.scenarioType}, label ${pair.label})`, () => {
      const scored = scorePair(pair.a, pair.b);
      for (const name of featureNames) {
        assert.ok(
          Math.abs(scored.modelFeatures[name] - pair.features[name]) < 1e-6,
          `${name} differs from Python reference`,
        );
      }
      assert.ok(
        Math.abs(scored.probability - pair.probability) < 1e-6,
        "Probability differs from Python reference",
      );
    });
  }
});
