import type { Observation, ObservationDraft, LocalSettings } from "./types";

export const STORAGE_KEY = "witness.local.v1";
export type LocalData = {
  observations: Observation[];
  draft: ObservationDraft | null;
  settings: LocalSettings;
};
export const emptyData: LocalData = {
  observations: [],
  draft: null,
  settings: { name: "", showDemo: true },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const categoryIds = ["odor", "smoke", "water", "dust", "noise"];
const intensities = ["mild", "noticeable", "strong"];
const validPhoto = (value: unknown) =>
  value === undefined ||
  (typeof value === "string" &&
    /^data:image\/(jpeg|png|webp|avif);base64,/.test(value) &&
    value.length < 1_500_000);
function validLocation(value: unknown) {
  return (
    isObject(value) &&
    typeof value.label === "string" &&
    ["manual", "device"].includes(String(value.method)) &&
    (value.latitude === undefined ||
      (typeof value.latitude === "number" && Math.abs(value.latitude) <= 90)) &&
    (value.longitude === undefined ||
      (typeof value.longitude === "number" && Math.abs(value.longitude) <= 180))
  );
}
function validDetails(value: unknown, draft = false) {
  return (
    isObject(value) &&
    typeof value.description === "string" &&
    intensities.includes(String(value.intensity)) &&
    typeof value.occurredAt === "string" &&
    (draft || Number.isFinite(Date.parse(value.occurredAt))) &&
    validLocation(value.location) &&
    validPhoto(value.photo)
  );
}

function validSubmission(value: unknown) {
  return (
    value === undefined ||
    (isObject(value) &&
      ["pending", "submitted"].includes(String(value.status)) &&
      typeof value.attemptedAt === "string" &&
      Number.isFinite(Date.parse(value.attemptedAt)) &&
      (value.status === "pending"
        ? value.submittedAt === undefined
        : typeof value.submittedAt === "string" &&
          Number.isFinite(Date.parse(value.submittedAt))))
  );
}

export function readLocalData(storage: Pick<Storage, "getItem">): LocalData {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw)
    return {
      ...emptyData,
      observations: [],
      settings: { ...emptyData.settings },
    };
  const data: unknown = JSON.parse(raw);
  if (
    !isObject(data) ||
    !Array.isArray(data.observations) ||
    !isObject(data.settings) ||
    typeof data.settings.name !== "string" ||
    typeof data.settings.showDemo !== "boolean" ||
    !data.observations.every(
      (observation) =>
        isObject(observation) &&
        validDetails(observation) &&
        categoryIds.includes(String(observation.category)) &&
        typeof observation.id === "string" &&
        typeof observation.savedAt === "string" &&
        Number.isFinite(Date.parse(observation.savedAt)) &&
        validSubmission(observation.submission) &&
        isObject(observation.connections) &&
        Object.values(observation.connections).every(
          (value) => value === "accepted" || value === "declined",
        ),
    ) ||
    (data.draft !== null &&
      !(
        isObject(data.draft) &&
        validDetails(data.draft, true) &&
        ["", ...categoryIds].includes(String(data.draft.category)) &&
        Number.isInteger(data.draft.step) &&
        Number(data.draft.step) >= 0 &&
        Number(data.draft.step) <= 2
      ))
  ) {
    throw new Error(
      "Your saved browser data could not be read. It has been left untouched. You can reset local data in Profile.",
    );
  }
  return data as LocalData;
}

export function writeLocalData(
  storage: Pick<Storage, "setItem">,
  data: LocalData,
) {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
