"use server";

import { revalidatePath } from "next/cache";
import { submitObservation } from "@/lib/server/submit-observation";

// Retains the existing backend's FormData entry point alongside the JSON API.
export async function createObservation(formData: FormData) {
  const numberField = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim()
      ? Number(value)
      : Number.NaN;
  };
  const result = await submitObservation({
    category: formData.get("category"),
    intensity: numberField("intensity"),
    notes: formData.get("notes"),
    latitude: numberField("latitude"),
    longitude: numberField("longitude"),
    occurredAt: formData.get("occurredAt") || new Date().toISOString(),
  });
  if (result.success) revalidatePath("/");
  return result;
}
