import model from "./weights.json" with { type: "json" };

export interface Observation {
  id: string;
  category: string;
  text: string;
  lat: number;
  lng: number;
  reportedTime: string;
}

export interface MatchResult {
  candidateId: string;
  probability: number;
  componentScores: {
    geo: number;
    time: number;
    category: number;
    text: number | null;
  };
  explanation: string;
  algorithmVersion: string;
}

const EARTH_RADIUS_MILES = 3958.8;
const stopwords = new Set(model.stopwords);

function milesApart(a: Observation, b: Observation) {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

// Timestamps don't always carry a timezone. Read bare ones as UTC so both sides
// of a pair get the same treatment - only the gap between them matters.
function parseTime(stamp: string) {
  const s = stamp.trim().replace(" ", "T");
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
  const ms = Date.parse(hasZone ? s : s + "Z");
  if (Number.isNaN(ms)) throw new Error(`Bad reportedTime: ${stamp}`);
  return ms;
}

function minutesApart(a: Observation, b: Observation) {
  return Math.abs(parseTime(a.reportedTime) - parseTime(b.reportedTime)) / 60000;
}

function scaleFor(table: Record<string, number>, a: string, b: string) {
  const first = table[a];
  const second = table[b];
  if (first === undefined) throw new Error(`Unknown category: ${a}`);
  if (second === undefined) throw new Error(`Unknown category: ${b}`);
  return Math.max(first, second);
}

function words(text: string) {
  const found = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return new Set(found.filter((w) => w.length > 2 && !stopwords.has(w)));
}

function textOverlap(a: string, b: string) {
  const first = words(a);
  const second = words(b);
  if (first.size === 0 || second.size === 0) return null;

  let shared = 0;
  for (const word of first) {
    if (second.has(word)) shared++;
  }
  return shared / (first.size + second.size - shared);
}

function categoryMatch(a: string, b: string) {
  if (a === b) return 1;
  const compat: Record<string, number> = model.categoryCompat;
  return compat[`${a}|${b}`] ?? compat[`${b}|${a}`] ?? 0;
}

function explain(minutes: number, miles: number, category: number, text: number | null) {
  const mins = Math.round(minutes);
  const unit = mins === 1 ? "minute" : "minutes";

  let sameness = "different category";
  if (category === 1) sameness = "same category";
  else if (category > 0) sameness = "different but related category";

  let wording = "no shared wording";
  if (text === null) wording = "descriptions not compared";
  else if (text > 0) wording = "similar descriptions";

  return `Reported ${mins} ${unit} apart, about ${miles.toFixed(2)} miles apart, ${sameness}, ${wording}.`;
}

// Exported so the parity test can reach pairs that scoreCandidates filters out.
export function scorePair(a: Observation, b: Observation) {
  const miles = milesApart(a, b);
  const minutes = minutesApart(a, b);
  const overlap = textOverlap(a.text, b.text);

  const geo = Math.exp(-miles / scaleFor(model.geoScaleMiles, a.category, b.category));
  const time = Math.exp(-minutes / scaleFor(model.timeScaleMinutes, a.category, b.category));
  const category = categoryMatch(a.category, b.category);
  const text = overlap ?? model.textMissingValue;

  const modelFeatures: Record<string, number> = { geo, time, category, text };
  let sum = model.bias;
  model.featureOrder.forEach((name, i) => {
    sum += model.weights[i] * modelFeatures[name];
  });

  return {
    miles,
    minutes,
    modelFeatures,
    componentScores: { geo, time, category, text: overlap },
    probability: 1 / (1 + Math.exp(-sum)),
  };
}

export function scoreCandidates(newObs: Observation, candidates: Observation[]): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const candidate of candidates) {
    const score = scorePair(newObs, candidate);
    if (score.probability < model.cutoff) continue;

    matches.push({
      candidateId: candidate.id,
      probability: score.probability,
      componentScores: score.componentScores,
      explanation: explain(score.minutes, score.miles, score.componentScores.category, score.componentScores.text),
      algorithmVersion: model.algorithmVersion,
    });
  }

  return matches.sort((a, b) => b.probability - a.probability);
}
