import type {
  MatchingInput,
  MatchingResponse,
  Observation,
  SubmissionResult,
} from "./types";

export function matchingInput(observation: Observation): MatchingInput {
  return {
    category: observation.category,
    description: observation.description,
    occurredAt: observation.occurredAt,
    location: {
      latitude: observation.location.latitude,
      longitude: observation.location.longitude,
    },
  };
}

export async function requestSubmission(
  observation: Observation,
): Promise<SubmissionResult> {
  const categoryNames = {
    odor: "Odor",
    smoke: "Smoke/Haze",
    water: "Runoff/Water",
    dust: "Dust/Particles",
    noise: "Noise",
  };
  const intensities = { mild: 1, noticeable: 3, strong: 5 };
  const response = await fetch("/api/observations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      category: categoryNames[observation.category],
      intensity: intensities[observation.intensity],
      notes: observation.description,
      occurredAt: observation.occurredAt,
      latitude: observation.location.latitude,
      longitude: observation.location.longitude,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const result = await response.json();
  if (
    result.success === true &&
    response.ok &&
    typeof result.submittedAt === "string"
  )
    return result;
  if (
    result.success === false &&
    ["not-sent", "rejected", "unknown"].includes(result.outcome) &&
    typeof result.error === "string"
  )
    return result;
  throw new Error("The submission result couldn’t be confirmed.");
}

export async function requestMatches(
  input: MatchingInput,
  signal: AbortSignal,
): Promise<MatchingResponse> {
  const response = await fetch("/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal,
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : "Matching is unavailable. Please try again.",
    );
  if (
    !Array.isArray(body.matches) ||
    typeof body.algorithmVersion !== "string" ||
    !["compared", "location-required"].includes(body.status)
  ) {
    throw new Error(
      "The matching service returned an unexpected response. Please try again.",
    );
  }
  return body;
}
