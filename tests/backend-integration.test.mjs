import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareObservation,
  parseMatchingInput,
} from "../src/lib/server/match-observation.ts";
import { matchingInput, requestMatches } from "../src/lib/api-client.ts";

const note = {
  category: "odor",
  description: "A sharp smell near the trail.",
  occurredAt: "2026-10-22T22:50:00Z",
  location: { latitude: 32.78, longitude: -96.82 },
};
const event = {
  id: "example",
  category: "odor",
  latitude: 32.78,
  longitude: -96.82,
  reports: [
    {
      time: "2026-10-22T22:40:00Z",
      description: "A sharp unfamiliar smell by the trail.",
    },
  ],
};

test("the service uses the repository's trained model and its version", () => {
  const result = compareObservation(note, [event]);
  assert.equal(result.algorithmVersion, "lr-v1-synthetic");
  assert.match(result.dataNote, /SYNTHETIC/);
  assert.equal(result.matches[0].eventId, "example");
  assert.ok(result.matches[0].probability >= 0.55);
  assert.equal(result.matches[0].minutesApart, 10);
  assert.equal(result.matches[0].componentScores.category, 1);
});

test("stale or distant examples do not pass the model cutoff", () => {
  assert.equal(
    compareObservation(note, [{ ...event, latitude: 33.2 }]).matches.length,
    0,
  );
  assert.equal(
    compareObservation(note, [
      {
        ...event,
        reports: [{ ...event.reports[0], time: "2026-10-21T22:40:00Z" }],
      },
    ]).matches.length,
    0,
  );
});

test("related Odor/Smoke categories use the existing model compatibility", () => {
  const response = compareObservation(note, [
    {
      ...event,
      category: "smoke",
      reports: [{ time: note.occurredAt, description: "A sharp smoky smell." }],
    },
  ]);
  assert.equal(response.matches.length, 1);
  assert.equal(response.matches[0].componentScores.category, 0.5);
  assert.equal(
    compareObservation(note, [{ ...event, category: "noise" }]).matches.length,
    0,
  );
});

test("a multi-note event appears once, using the closest qualifying report", () => {
  const response = compareObservation(note, [
    {
      ...event,
      reports: [
        ...event.reports,
        { time: note.occurredAt, description: note.description },
      ],
    },
  ]);
  assert.equal(response.matches.length, 1);
  assert.equal(response.matches[0].minutesApart, 0);
});

test("API input is rounded again and does not retain names, photos, or private fields", () => {
  const input = parseMatchingInput({
    ...note,
    location: {
      latitude: 32.781234,
      longitude: -96.823456,
      address: "Private address",
    },
    photo: "private photo",
    displayName: "Private name",
  });
  assert.deepEqual(input.location, { latitude: 32.78, longitude: -96.82 });
  assert.equal(input.photo, undefined);
  assert.equal(input.displayName, undefined);
  const response = compareObservation(input, [event]);
  assert.equal(JSON.stringify(response).includes("Private"), false);
});

test("unknown manual areas return a location-needed result without invented coordinates", () => {
  const response = compareObservation({ ...note, location: {} }, [event]);
  assert.equal(response.status, "location-required");
  assert.deepEqual(response.matches, []);
});

test("unsupported categories, invalid times, text, and coordinates are rejected", () => {
  for (const input of [
    null,
    { ...note, category: "__proto__" },
    { ...note, category: "toString" },
    { ...note, category: ["odor"] },
    { ...note, description: "" },
    { ...note, description: "a".repeat(1001) },
    { ...note, occurredAt: "not-a-date" },
    { ...note, occurredAt: "2026-10-22T22:50" },
    { ...note, location: { latitude: 91, longitude: 0 } },
    { ...note, location: { latitude: 0, longitude: Infinity } },
    { ...note, location: { latitude: 32.78 } },
  ])
    assert.throws(() => compareObservation(input, [event]), TypeError);
});

test("the browser request excludes IDs, photos, exact place labels, and connection history", () => {
  const payload = matchingInput({
    ...note,
    id: "private-id",
    location: {
      ...note.location,
      label: "Private location label",
      method: "manual",
    },
    photo: "photo",
    connections: { example: "accepted" },
  });
  assert.deepEqual(Object.keys(payload).sort(), [
    "category",
    "description",
    "location",
    "occurredAt",
  ]);
  assert.deepEqual(Object.keys(payload.location).sort(), [
    "latitude",
    "longitude",
  ]);
});

test("backend failures reach the client without a fabricated fallback", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Matching is unavailable." }, { status: 503 }),
  );
  await assert.rejects(
    requestMatches(note, new AbortController().signal),
    /Matching is unavailable/,
  );
});

test("the API client posts only the matching payload to the same app", async (context) => {
  context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/matches");
    assert.equal(options.method, "POST");
    assert.equal(options.cache, "no-store");
    assert.deepEqual(JSON.parse(options.body), note);
    return Response.json(compareObservation(note, [event]));
  });
  const result = await requestMatches(note, new AbortController().signal);
  assert.equal(result.matches[0].eventId, "example");
});
