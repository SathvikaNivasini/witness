import type { DemoEvent } from "./types";

// Illustrative records only. No live reports or measured environmental data.
export const demoEvents: DemoEvent[] = [
  {
    id: "trinity-odor",
    title: "An unfamiliar odor along the trail",
    category: "odor",
    area: "Trinity corridor",
    latitude: 32.78,
    longitude: -96.82,
    occurredAt: "2026-10-22T17:40:00-05:00",
    position: { x: 39, y: 58 },
    description:
      "A few example observations describe a sharp smell outdoors around the same time. The source is unknown.",
    reports: [
      {
        time: "2026-10-22T17:40:00-05:00",
        description: "A sharp, unfamiliar smell while walking near the trail.",
        intensity: "noticeable",
      },
      {
        time: "2026-10-22T18:05:00-05:00",
        description:
          "An intermittent chemical-like smell outdoors. Less noticeable further along the path.",
        intensity: "mild",
      },
      {
        time: "2026-10-22T18:20:00-05:00",
        description:
          "Noticed a similar smell near the river corridor before heading home.",
        intensity: "noticeable",
      },
    ],
  },
  {
    id: "east-haze",
    title: "Light haze in the evening",
    category: "smoke",
    area: "East Dallas area",
    latitude: 32.8,
    longitude: -96.76,
    occurredAt: "2026-10-23T18:15:00-05:00",
    position: { x: 72, y: 35 },
    description:
      "Example records describe a light haze and a faint smoky smell. These descriptions do not establish air quality or a source.",
    reports: [
      {
        time: "2026-10-23T18:15:00-05:00",
        description: "A light haze visible against the evening sky.",
        intensity: "mild",
      },
      {
        time: "2026-10-23T18:35:00-05:00",
        description:
          "Faint smoky smell outdoors, with a little haze in the distance.",
        intensity: "mild",
      },
    ],
  },
  {
    id: "creek-water",
    title: "Cloudy water after the rain",
    category: "water",
    area: "White Rock area",
    latitude: 32.82,
    longitude: -96.74,
    occurredAt: "2026-10-24T09:10:00-05:00",
    position: { x: 81, y: 20 },
    description:
      "An illustrative observation of cloudy water near a drainage channel after rainfall. No water testing has been performed.",
    reports: [
      {
        time: "2026-10-24T09:10:00-05:00",
        description:
          "Water looked cloudier than usual near the drainage channel after last night's rain.",
        intensity: "noticeable",
      },
    ],
  },
  {
    id: "west-dust",
    title: "Dust drifting across a footpath",
    category: "dust",
    area: "West Dallas area",
    latitude: 32.78,
    longitude: -96.86,
    occurredAt: "2026-10-21T14:30:00-05:00",
    position: { x: 20, y: 41 },
    description:
      "A simulated record describing visible dust on a windy afternoon. Its origin and composition are unknown.",
    reports: [
      {
        time: "2026-10-21T14:30:00-05:00",
        description:
          "A light cloud of dust blowing over the footpath. Fine residue on the bench.",
        intensity: "noticeable",
      },
    ],
  },
  {
    id: "south-noise",
    title: "A low hum after sunset",
    category: "noise",
    area: "South Dallas area",
    latitude: 32.74,
    longitude: -96.78,
    occurredAt: "2026-10-23T20:00:00-05:00",
    position: { x: 58, y: 77 },
    description:
      "An example record of an intermittent low sound outdoors. No sound levels were measured.",
    reports: [
      {
        time: "2026-10-23T20:00:00-05:00",
        description:
          "A steady low hum that came and went for about twenty minutes.",
        intensity: "mild",
      },
    ],
  },
];

export const demoPattern = {
  id: "trinity-evenings",
  title: "A familiar note on evening walks",
  area: "Trinity corridor",
  summary:
    "Similar odor descriptions, on three separate evenings. A possible connection worth a closer look.",
  entries: [
    {
      date: "2026-10-08T18:10:00-05:00",
      title: "A brief, sharp smell",
      description:
        "Two simulated observations describe an intermittent sharp smell near the trail between 6 and 7 pm. Both describe a mild intensity.",
      reason: "Same category and generalized area; similar evening timing.",
    },
    {
      date: "2026-10-15T17:55:00-05:00",
      title: "A similar description, a week later",
      description:
        "An example observation describes a chemical-like smell while walking through the same general corridor.",
      reason:
        "Similar wording and time of day, seven days after the first example.",
    },
    {
      date: "2026-10-22T17:40:00-05:00",
      title: "Noticed again along the trail",
      description:
        "Three illustrative observations mention a sharp outdoor smell over forty minutes. The generalized locations overlap with the earlier examples.",
      reason: "Overlapping area, odor category, and late-afternoon timing.",
      eventId: "trinity-odor",
    },
  ],
};
