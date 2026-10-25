"use client";

import { useSyncExternalStore } from "react";
import {
  emptyData,
  readLocalData,
  STORAGE_KEY,
  writeLocalData,
  type LocalData,
} from "./storage";
import type { LocalSettings, Observation, ObservationDraft } from "./types";

type Snapshot = LocalData & { ready: boolean; error: string | null };
const initial: Snapshot = { ...emptyData, ready: false, error: null };
let snapshot = initial;
const listeners = new Set<() => void>();
let initialized = false;
const emit = () => listeners.forEach((listener) => listener());

function load() {
  try {
    snapshot = {
      ...readLocalData(window.localStorage),
      ready: true,
      error: null,
    };
  } catch (error) {
    snapshot = {
      ...snapshot,
      ready: true,
      error:
        error instanceof SyntaxError
          ? "Your saved browser data could not be read. It has been left untouched. You can reset local data in Profile."
          : error instanceof Error && error.message.startsWith("Your saved")
            ? error.message
            : "Browser storage is unavailable. Allow local storage in your browser to save observations.",
    };
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!initialized) {
    initialized = true;
    load();
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY || event.key === null) load();
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

function persist(data: LocalData) {
  if (!snapshot.ready || snapshot.error)
    throw new Error(
      snapshot.error ??
        "Your local notebook is still loading. Please try again.",
    );
  try {
    writeLocalData(window.localStorage, data);
  } catch {
    throw new Error(
      "This couldn't be saved in your browser. Storage may be full or disabled. Try removing the photo, or freeing browser storage.",
    );
  }
  snapshot = { ...data, ready: true, error: null };
  emit();
}

function currentData(): LocalData {
  // Merge edits with the latest stored notebook, including other tabs' changes.
  try {
    return readLocalData(window.localStorage);
  } catch {
    throw new Error(
      "Your local notebook couldn't be read. Your existing records have been left untouched.",
    );
  }
}

export function useLocalData() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
}

export function saveDraft(draft: ObservationDraft) {
  persist({ ...currentData(), draft });
}
export function clearDraft() {
  persist({ ...currentData(), draft: null });
}
export function saveObservation(observation: Observation) {
  const data = currentData();
  persist({
    ...data,
    observations: [observation, ...data.observations],
    draft: null,
  });
}
export function updateConnection(
  id: string,
  eventId: string,
  decision: "accepted" | "declined",
) {
  const data = currentData();
  persist({
    ...data,
    observations: data.observations.map((item) =>
      item.id === id
        ? { ...item, connections: { ...item.connections, [eventId]: decision } }
        : item,
    ),
  });
}
export function deleteObservation(id: string) {
  const data = currentData();
  persist({
    ...data,
    observations: data.observations.filter((item) => item.id !== id),
  });
}
export function updateSubmission(
  id: string,
  submission: Observation["submission"],
) {
  const data = currentData();
  const existing = data.observations.find(
    (observation) => observation.id === id,
  );
  if (!existing)
    throw new Error(
      "This note is no longer in your local notebook. Nothing was sent.",
    );
  if (submission?.status === "pending" && existing.submission)
    throw new Error(
      "This note already has a submission attempt. Check its status before sending it again.",
    );
  persist({
    ...data,
    observations: data.observations.map((observation) =>
      observation.id === id ? { ...observation, submission } : observation,
    ),
  });
}
export function updateSettings(settings: Partial<LocalSettings>) {
  const data = currentData();
  persist({ ...data, settings: { ...data.settings, ...settings } });
}
export function resetLocalData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    throw new Error(
      "Local data couldn't be removed. Check your browser storage settings.",
    );
  }
  snapshot = { ...emptyData, ready: true, error: null };
  emit();
}
