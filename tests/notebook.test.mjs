import { test } from "node:test";
import assert from "node:assert/strict";
import { generalizeLocation, manualLocation } from "../src/lib/matching.ts";
import {
  emptyData,
  readLocalData,
  STORAGE_KEY,
  writeLocalData,
} from "../src/lib/storage.ts";

const observation = {
  id: "test-note",
  category: "odor",
  description: "A sharp smell near the trail.",
  intensity: "noticeable",
  occurredAt: "2026-10-22T22:40:00Z",
  savedAt: "2026-10-22T23:00:00Z",
  location: manualLocation("Trinity corridor"),
  connections: {},
};

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

test("device locations discard precision before they can be persisted", () => {
  const location = generalizeLocation(32.781234567, -96.823456789);
  assert.equal(location.latitude, 32.78);
  assert.equal(location.longitude, -96.82);
  assert.ok(!JSON.stringify(location).includes("1234567"));
  assert.equal(location.method, "device");
});

test("manual locations without a known area never get an invented distance", () => {
  const location = manualLocation("A park near home");
  assert.equal(location.latitude, undefined);
  assert.equal(manualLocation("  TRINITY CORRIDOR ").latitude, 32.78);
});

test("observations, photos, settings, and decisions survive a storage round trip", () => {
  const storage = memoryStorage();
  const note = {
    ...observation,
    photo: "data:image/png;base64,aGVsbG8=",
    connections: { example: "accepted" },
  };
  writeLocalData(storage, {
    ...emptyData,
    observations: [note],
    settings: { name: "River", showDemo: false },
  });
  const restored = readLocalData(storage);
  assert.deepEqual(restored.observations, [note]);
  assert.equal(restored.settings.showDemo, false);
});

test("partial drafts can be restored while date fields are being edited", () => {
  const storage = memoryStorage();
  const draft = {
    category: "",
    description: "",
    intensity: "noticeable",
    occurredAt: "",
    location: manualLocation(""),
    step: 1,
  };
  writeLocalData(storage, { ...emptyData, draft });
  assert.deepEqual(readLocalData(storage).draft, draft);
});

test("broken or invalid local data is rejected and left untouched", () => {
  const storage = memoryStorage();
  for (const raw of [
    "{broken",
    JSON.stringify({
      ...emptyData,
      observations: [{ ...observation, category: "unknown" }],
    }),
  ]) {
    storage.setItem(STORAGE_KEY, raw);
    assert.throws(() => readLocalData(storage));
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test("storage quota failures propagate instead of reporting a successful save", () => {
  const storage = {
    setItem() {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    },
  };
  assert.throws(() => writeLocalData(storage, emptyData), {
    name: "QuotaExceededError",
  });
});
