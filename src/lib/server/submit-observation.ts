import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase.ts";
import { generalizeLocation } from "../matching.ts";
import type { SubmissionResult } from "../types.ts";

export const observationSchema = z.object({
  category: z.enum([
    "Odor",
    "Smoke/Haze",
    "Runoff/Water",
    "Dust/Particles",
    "Noise",
  ]),
  intensity: z.number().int().min(1).max(5),
  notes: z.string().trim().min(5).max(500),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  occurredAt: z.string().datetime({ offset: true }),
});

export async function submitObservation(
  value: unknown,
  options: { client?: Pick<SupabaseClient, "from"> | null; now?: number } = {},
): Promise<SubmissionResult> {
  const parsed = observationSchema.safeParse(value);
  if (!parsed.success)
    return {
      success: false,
      outcome: "not-sent",
      error:
        "Use a supported category, an intensity from 1 to 5, notes of 5 to 500 characters, and a valid approximate area and time.",
    };
  const now = options.now ?? Date.now();
  const age = now - Date.parse(parsed.data.occurredAt);
  // The existing backend stores reported_timing='Now'; don't mislabel older notes.
  if (age < -60_000 || age > 15 * 60_000)
    return {
      success: false,
      outcome: "not-sent",
      error:
        "This backend currently accepts observations from the last 15 minutes. Older notes remain available in your local notebook.",
    };
  const client =
    options.client === undefined ? getSupabaseClient() : options.client;
  if (!client)
    return {
      success: false,
      outcome: "not-sent",
      error:
        "Cloud submissions aren’t configured for this installation. Your saved note remains in this browser.",
    };
  const { category, intensity, notes, latitude, longitude } = parsed.data;
  const area = generalizeLocation(latitude, longitude);
  try {
    const { error } = await client.from("observations").insert([
      {
        category,
        intensity,
        notes,
        reported_timing: "Now",
        private_latitude: area.latitude,
        private_longitude: area.longitude,
        owner_id: null,
      },
    ]);
    if (error)
      return {
        success: false,
        outcome: error.code ? "rejected" : "unknown",
        error:
          error.code === "42501"
            ? "The database didn’t allow this guest submission. Your local note is unchanged."
            : error.code
              ? "The database couldn’t accept this submission. Your local note is unchanged."
              : "Witness couldn’t confirm whether the submission arrived. Avoid submitting it again until its status is checked.",
      };
    return { success: true, submittedAt: new Date(now).toISOString() };
  } catch {
    return {
      success: false,
      outcome: "unknown",
      error:
        "Witness couldn’t confirm whether the submission arrived. Your local note is safe; avoid submitting it again until its status is checked.",
    };
  }
}
