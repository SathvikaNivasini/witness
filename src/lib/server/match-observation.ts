import {
  scoreCandidates,
  scorePair,
  type Observation as ModelObservation,
} from "../../../matching/scoreCandidates.ts";
import model from "../../../matching/weights.json" with { type: "json" };
import { demoEvents } from "../demo-data.ts";
import { generalizeLocation } from "../matching.ts";
import type {
  Category,
  DemoEvent,
  MatchingInput,
  MatchingResponse,
  PossibleMatch,
} from "../types.ts";

const modelCategories: Record<Category, string> = {
  odor: "Odor",
  smoke: "Smoke/Haze",
  water: "Runoff/Water",
  dust: "Dust/Particles",
  noise: "Noise",
};

export const matchingModel = {
  algorithmVersion: model.algorithmVersion,
  dataNote: model.dataNote,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMatchingInput(value: unknown): MatchingInput {
  if (
    !isObject(value) ||
    typeof value.category !== "string" ||
    !Object.hasOwn(modelCategories, String(value.category))
  ) {
    throw new TypeError("Choose a supported observation category.");
  }
  if (
    typeof value.description !== "string" ||
    value.description.trim().length < 5 ||
    value.description.length > 1000
  ) {
    throw new TypeError("Describe the observation in 5 to 1000 characters.");
  }
  if (
    typeof value.occurredAt !== "string" ||
    !Number.isFinite(Date.parse(value.occurredAt)) ||
    !/(Z|[+-]\d{2}:\d{2})$/i.test(value.occurredAt)
  ) {
    throw new TypeError("Provide a valid observation time with a timezone.");
  }
  if (!isObject(value.location))
    throw new TypeError(
      "Provide an approximate location, or leave its coordinates empty.",
    );
  const { latitude, longitude } = value.location;
  const hasCoordinates = latitude !== undefined || longitude !== undefined;
  if (
    hasCoordinates &&
    (typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      Math.abs(latitude) > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      Math.abs(longitude) > 180)
  ) {
    throw new TypeError(
      "Provide both latitude and longitude within their valid ranges.",
    );
  }
  // Apply the same privacy grid even if a caller bypasses the observation form.
  const area = hasCoordinates
    ? generalizeLocation(latitude as number, longitude as number)
    : { latitude: undefined, longitude: undefined };
  return {
    category: value.category as Category,
    description: value.description.trim(),
    occurredAt: value.occurredAt,
    location: { latitude: area.latitude, longitude: area.longitude },
  };
}

export function compareObservation(
  value: unknown,
  events: DemoEvent[] = demoEvents,
): MatchingResponse {
  const input = parseMatchingInput(value);
  const response: MatchingResponse = {
    ...matchingModel,
    status: "location-required",
    matches: [],
  };
  if (
    input.location.latitude === undefined ||
    input.location.longitude === undefined
  )
    return response;

  const observation: ModelObservation = {
    id: "incoming-observation",
    category: modelCategories[input.category],
    text: input.description,
    lat: input.location.latitude,
    lng: input.location.longitude,
    reportedTime: input.occurredAt,
  };
  const candidates = events.flatMap((event) => {
    const area = generalizeLocation(event.latitude, event.longitude);
    return event.reports.map((report, index) => ({
      id: `${event.id}:${index}`,
      category: modelCategories[event.category],
      text: report.description,
      lat: area.latitude!,
      lng: area.longitude!,
      reportedTime: report.time,
      eventId: event.id,
    }));
  });
  const byId = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const byEvent = new Map<string, PossibleMatch>();
  for (const result of scoreCandidates(observation, candidates)) {
    // The model supports same categories and the Odor/Smoke relationship.
    if (result.componentScores.category === 0) continue;
    const candidate = byId.get(result.candidateId)!;
    if (byEvent.has(candidate.eventId)) continue;
    const details = scorePair(observation, candidate);
    byEvent.set(candidate.eventId, {
      eventId: candidate.eventId,
      probability: result.probability,
      distanceKm: details.miles * 1.609344,
      minutesApart: details.minutes,
      componentScores: result.componentScores,
      explanation: result.explanation,
      algorithmVersion: result.algorithmVersion,
    });
  }
  return { ...response, status: "compared", matches: [...byEvent.values()] };
}
