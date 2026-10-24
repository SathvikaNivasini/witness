import model from "./weights.json";

export interface Observation {
  id: string;
  category: string;
  text: string;
  lat: number;
  lng: number;
  reportedTime: string;
}

export interface ComponentScores {
  geo: number;
  time: number;
  category: number;
  text: number | null;
}

export interface MatchResult {
  candidateId: string;
  probability: number;
  componentScores: ComponentScores;
  explanation: string;
  algorithmVersion: string;
}

export interface ModelFeatures {
  geo: number;
  time: number;
  category: number;
  text: number;
}

export interface PairScore {
  distanceMiles: number;
  gapMinutes: number;
  componentScores: ComponentScores;
  modelFeatures: ModelFeatures;
  probability: number;
}

const EARTH_RADIUS_MILES = 3958.8;

const geoScaleMiles: Record<string, number> = model.geoScaleMiles;
const timeScaleMinutes: Record<string, number> = model.timeScaleMinutes;
const categoryCompat: Record<string, number> = model.categoryCompat;
const stopwords = new Set<string>(model.stopwords);

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const p1 = toRadians(aLat);
  const p2 = toRadians(bLat);
  const dp = p2 - p1;
  const dl = toRadians(bLng - aLng);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

function parseTimeMs(value: string): number {
  const normalized = value.trim().replace(" ", "T");
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized);
  const ms = Date.parse(hasZone ? normalized : `${normalized}Z`);
  if (Number.isNaN(ms)) {
    throw new Error(`Unparseable reportedTime: ${value}`);
  }
  return ms;
}

function scaleFor(scales: Record<string, number>, a: string, b: string, label: string): number {
  const scaleA = scales[a];
  const scaleB = scales[b];
  if (scaleA === undefined || scaleB === undefined) {
    throw new Error(`No ${label} scale for category ${scaleA === undefined ? a : b}`);
  }
  return Math.max(scaleA, scaleB);
}

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return new Set(words.filter((word) => word.length > 2 && !stopwords.has(word)));
}

function jaccard(a: Set<string>, b: Set<string>): number | null {
  if (a.size === 0 || b.size === 0) {
    return null;
  }
  let shared = 0;
  for (const word of a) {
    if (b.has(word)) {
      shared += 1;
    }
  }
  return shared / (a.size + b.size - shared);
}

function categoryScore(a: string, b: string): number {
  if (a === b) {
    return 1;
  }
  return categoryCompat[`${a}|${b}`] ?? categoryCompat[`${b}|${a}`] ?? 0;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function probabilityOf(features: ModelFeatures): number {
  let z = model.bias;
  model.featureOrder.forEach((name, index) => {
    const value = features[name as keyof ModelFeatures];
    if (value === undefined) {
      throw new Error(`weights.json featureOrder names an unknown feature: ${name}`);
    }
    z += model.weights[index] * value;
  });
  return sigmoid(z);
}

function describe(score: PairScore): string {
  const minutes = Math.round(score.gapMinutes);
  const { category, text } = score.componentScores;

  const categoryPhrase =
    category === 1 ? "same category" : category > 0 ? "different but related category" : "different category";
  const textPhrase =
    text === null ? "descriptions not compared" : text > 0 ? "similar descriptions" : "no shared wording";

  return (
    [
      `Reported ${minutes} ${minutes === 1 ? "minute" : "minutes"} apart`,
      `about ${score.distanceMiles.toFixed(2)} miles apart`,
      categoryPhrase,
      textPhrase,
    ].join(", ") + "."
  );
}

export function scorePair(a: Observation, b: Observation): PairScore {
  const distanceMiles = haversineMiles(a.lat, a.lng, b.lat, b.lng);
  const gapMinutes = Math.abs(parseTimeMs(a.reportedTime) - parseTimeMs(b.reportedTime)) / 60000;

  const geoScale = scaleFor(geoScaleMiles, a.category, b.category, "distance");
  const timeScale = scaleFor(timeScaleMinutes, a.category, b.category, "time");
  const text = jaccard(tokenize(a.text), tokenize(b.text));

  const componentScores: ComponentScores = {
    geo: Math.exp(-distanceMiles / geoScale),
    time: Math.exp(-gapMinutes / timeScale),
    category: categoryScore(a.category, b.category),
    text,
  };
  const modelFeatures: ModelFeatures = {
    ...componentScores,
    text: text ?? model.textMissingValue,
  };

  return {
    distanceMiles,
    gapMinutes,
    componentScores,
    modelFeatures,
    probability: probabilityOf(modelFeatures),
  };
}

export function scoreCandidates(newObs: Observation, candidates: Observation[]): MatchResult[] {
  return candidates
    .map((candidate) => {
      const score = scorePair(newObs, candidate);
      return {
        candidateId: candidate.id,
        probability: score.probability,
        componentScores: score.componentScores,
        explanation: describe(score),
        algorithmVersion: model.algorithmVersion,
      };
    })
    .filter((result) => result.probability >= model.cutoff)
    .sort((a, b) => b.probability - a.probability);
}
