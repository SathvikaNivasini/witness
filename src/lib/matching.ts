import type { ApproximateLocation } from "./types";

export function generalizeLocation(
  latitude: number,
  longitude: number,
): ApproximateLocation {
  const lat = Math.round(latitude / 0.02) * 0.02;
  const lon = Math.round(longitude / 0.02) * 0.02;
  return {
    label: `Area near ${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`,
    latitude: Number(lat.toFixed(2)),
    longitude: Number(lon.toFixed(2)),
    method: "device",
  };
}

export const manualAreas: Record<
  string,
  { latitude: number; longitude: number }
> = {
  "trinity corridor": { latitude: 32.78, longitude: -96.82 },
  "west dallas": { latitude: 32.78, longitude: -96.86 },
  "east dallas": { latitude: 32.8, longitude: -96.76 },
  "white rock": { latitude: 32.82, longitude: -96.74 },
  "south dallas": { latitude: 32.74, longitude: -96.78 },
};

export function manualLocation(label: string): ApproximateLocation {
  return {
    label,
    method: "manual",
    ...manualAreas[label.trim().toLowerCase()],
  };
}
