export type Category = "odor" | "smoke" | "water" | "dust" | "noise";
export type Intensity = "mild" | "noticeable" | "strong";

export type ApproximateLocation = {
  label: string;
  method: "manual" | "device";
  latitude?: number;
  longitude?: number;
};

export type Observation = {
  id: string;
  category: Category;
  description: string;
  intensity: Intensity;
  occurredAt: string;
  savedAt: string;
  location: ApproximateLocation;
  photo?: string;
  connections: Record<string, "accepted" | "declined">;
  submission?: {
    status: "pending" | "submitted";
    attemptedAt: string;
    submittedAt?: string;
  };
};

export type ObservationDraft = {
  category: Category | "";
  description: string;
  intensity: Intensity;
  occurredAt: string;
  location: ApproximateLocation;
  photo?: string;
  step: number;
};

export type DemoEvent = {
  id: string;
  title: string;
  category: Category;
  area: string;
  latitude: number;
  longitude: number;
  occurredAt: string;
  description: string;
  position: { x: number; y: number };
  reports: { time: string; description: string; intensity: Intensity }[];
};

export type LocalSettings = { name: string; showDemo: boolean };

export type MatchingInput = {
  category: Category;
  description: string;
  occurredAt: string;
  location: { latitude?: number; longitude?: number };
};

export type PossibleMatch = {
  eventId: string;
  probability: number;
  distanceKm: number;
  minutesApart: number;
  componentScores: {
    geo: number;
    time: number;
    category: number;
    text: number | null;
  };
  explanation: string;
  algorithmVersion: string;
};

export type MatchingResponse = {
  status: "compared" | "location-required";
  matches: PossibleMatch[];
  algorithmVersion: string;
  dataNote: string;
};

export type SubmissionResult =
  | { success: true; submittedAt: string }
  | {
      success: false;
      outcome: "not-sent" | "rejected" | "unknown";
      error: string;
    };
