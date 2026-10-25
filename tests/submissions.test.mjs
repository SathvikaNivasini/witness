import { test } from "node:test";
import assert from "node:assert/strict";
import { getSupabaseConfiguration } from "../src/lib/server/supabase.ts";
import { submitObservation } from "../src/lib/server/submit-observation.ts";
import { requestSubmission } from "../src/lib/api-client.ts";
import {
  emptyData,
  readLocalData,
  writeLocalData,
} from "../src/lib/storage.ts";

const now = Date.parse("2026-10-24T18:00:00Z");
const input = {
  category: "Odor",
  intensity: 3,
  notes: "A sharp smell near the trail.",
  latitude: 32.781234,
  longitude: -96.823456,
  occurredAt: new Date(now).toISOString(),
};
const note = {
  id: "local-only-id",
  category: "odor",
  description: input.notes,
  intensity: "noticeable",
  occurredAt: input.occurredAt,
  savedAt: input.occurredAt,
  location: {
    latitude: 32.78,
    longitude: -96.82,
    label: "Private place label",
    method: "manual",
  },
  photo: "data:image/png;base64,aGVsbG8=",
  connections: {},
};

function database(error = null, throws = false) {
  const rows = [];
  return {
    rows,
    client: {
      from(table) {
        assert.equal(table, "observations");
        return {
          async insert(values) {
            rows.push(...values);
            if (throws) throw new Error("Network unavailable");
            return { error };
          },
        };
      },
    },
  };
}

test("cloud configuration requires both a valid project URL and a public key", () => {
  for (const env of [
    {},
    { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" },
    {
      NEXT_PUBLIC_SUPABASE_URL: "invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
    },
  ])
    assert.equal(getSupabaseConfiguration(env), null);
  assert.deepEqual(
    getSupabaseConfiguration({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
    }),
    { url: "https://example.supabase.co", key: "public-key" },
  );
});

test("unconfigured installations return a clear not-sent result", async () => {
  const result = await submitObservation(input, { client: null, now });
  assert.equal(result.success, false);
  assert.equal(result.outcome, "not-sent");
  assert.match(result.error, /configured/);
});

test("the existing Supabase row contract is preserved with rounded coordinates and no private notebook fields", async () => {
  const db = database();
  const result = await submitObservation(
    { ...input, photo: "private-photo", name: "Private name" },
    { client: db.client, now },
  );
  assert.equal(result.success, true);
  assert.deepEqual(db.rows, [
    {
      category: "Odor",
      intensity: 3,
      notes: input.notes,
      reported_timing: "Now",
      private_latitude: 32.78,
      private_longitude: -96.82,
      owner_id: null,
    },
  ]);
  assert.equal(result.submittedAt, new Date(now).toISOString());
});

test("missing coordinates, malformed values, and over-limit notes never reach the database", async () => {
  const db = database();
  for (const value of [
    null,
    {},
    { ...input, latitude: undefined },
    { ...input, longitude: 181 },
    { ...input, latitude: "" },
    { ...input, latitude: Infinity },
    { ...input, category: "__proto__" },
    { ...input, intensity: 9 },
    { ...input, notes: "a".repeat(501) },
    { ...input, occurredAt: "2026-10-24T18:00" },
  ]) {
    const result = await submitObservation(value, { client: db.client, now });
    assert.equal(result.success, false);
    assert.equal(result.outcome, "not-sent");
  }
  assert.equal(db.rows.length, 0);
});

test("older notes are not mislabeled as Now by the existing backend", async () => {
  const db = database();
  for (const occurredAt of [
    new Date(now - 16 * 60_000).toISOString(),
    new Date(now + 2 * 60_000).toISOString(),
  ]) {
    const result = await submitObservation(
      { ...input, occurredAt },
      { client: db.client, now },
    );
    assert.equal(result.outcome, "not-sent");
  }
  assert.equal(db.rows.length, 0);
});

test("database policy rejection is surfaced without exposing raw database errors", async () => {
  const db = database({ code: "42501", message: "PRIVATE SQL DETAIL" });
  const result = await submitObservation(input, { client: db.client, now });
  assert.equal(result.outcome, "rejected");
  assert.match(result.error, /guest submission/);
  assert.equal(result.error.includes("PRIVATE"), false);
});

test("network failures produce an unconfirmed result rather than claiming a safe retry", async () => {
  for (const db of [
    database({ message: "Failed to fetch" }),
    database(null, true),
  ]) {
    const result = await submitObservation(input, { client: db.client, now });
    assert.equal(result.success, false);
    assert.equal(result.outcome, "unknown");
  }
});

test("the browser submission maps UI choices and excludes photos, names, labels, and local IDs", async (context) => {
  context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/observations");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      ...input,
      latitude: 32.78,
      longitude: -96.82,
    });
    return Response.json(
      { success: true, submittedAt: input.occurredAt },
      { status: 201 },
    );
  });
  assert.equal((await requestSubmission(note)).success, true);
});

test("invalid or interrupted HTTP acknowledgments never claim submission success", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: true }, { status: 503 }),
  );
  await assert.rejects(requestSubmission(note), /confirmed/);
});

test("pending and confirmed submission statuses survive reload; malformed status is rejected", () => {
  let stored;
  const storage = {
    setItem: (_key, value) => {
      stored = value;
    },
    getItem: () => stored,
  };
  for (const submission of [
    { status: "pending", attemptedAt: input.occurredAt },
    {
      status: "submitted",
      attemptedAt: input.occurredAt,
      submittedAt: input.occurredAt,
    },
  ]) {
    writeLocalData(storage, {
      ...emptyData,
      observations: [{ ...note, submission }],
    });
    assert.deepEqual(
      readLocalData(storage).observations[0].submission,
      submission,
    );
  }
  writeLocalData(storage, {
    ...emptyData,
    observations: [
      { ...note, submission: { status: "submitted", attemptedAt: "invalid" } },
    ],
  });
  assert.throws(() => readLocalData(storage));
});
