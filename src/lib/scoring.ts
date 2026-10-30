/**
 * Scoring engine — a faithful port of the Excel blueprint's Scorecard formulas.
 *
 *  - Every KPI / sub-KPI resolves to 0–100 (band lookup, 5-level rating, capped points, points-key, weighted average).
 *  - Three levels: 0 = Faculty self, 1 = Deputy Director, 2 = Director.
 *    A blank value at a higher level inherits the level below (Excel: IF(G="",F,G)).
 *  - KRA score = weighted average of applicable KPIs. FPI = Σ KRA score × designation weight.
 */
import {
  COMPONENTS,
  FW,
  type Component,
  type FNode,
  type Val,
  type Weights,
  desigIndex,
  weightFor,
} from "./framework";

export type Level = 0 | 1 | 2;
export const LEVELS: Level[] = [0, 1, 2];
export const LEVEL_LABEL = ["Self", "Dy Director", "Final"] as const;

export interface CourseRow {
  course: string;
  batch: string;
  semester: string;
  teiF: number | null;
  teiDD: number | null;
  passF: number | null;
  passDD: number | null;
}

export interface AppraisalData {
  /** leaf node id -> [self, dyDir, director] raw values */
  values: Record<string, Val[]>;
  /** KPI / SUB id -> applicable (default true) */
  applicable: Record<string, boolean>;
  courses: CourseRow[];
}

const blank = (v: Val | undefined) => v === null || v === undefined || v === "";

/** Excel VLOOKUP(v, table, 2, TRUE) wrapped in IFERROR(...,0) */
export function bandLookup(table: string, v: number): number {
  const rows = FW.bands[table]?.rows ?? [];
  let score: number | null = null;
  for (const [t, s] of rows) if (v >= t - 1e-9) score = s;
  return score ?? 0;
}

export const ratingScore = (label: Val) => FW.ratings.find((r) => r.label === label)?.score ?? 0;

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

/** value actually used at a level, after inheritance and course-register feeds */
export function effectiveValue(n: FNode, d: AppraisalData, level: Level): Val {
  if (n.course_feed) {
    const f = n.course_feed === "TEI" ? "tei" : "pass";
    const selfAvg = avg(d.courses.map((c) => c[`${f}F` as const]));
    const ddAvg = avg(d.courses.map((c) => c[`${f}DD` as const] ?? c[`${f}F` as const]));
    if (level === 0) return selfAvg;
    if (level === 1) return ddAvg ?? selfAvg;
    const o = d.values[n.id]?.[2];
    return blank(o) ? (ddAvg ?? selfAvg) : o!;
  }
  const v = d.values[n.id] ?? [];
  if (level === 0) return v[0] ?? null;
  if (level === 1) return blank(v[1]) ? (v[0] ?? null) : v[1];
  return blank(v[2]) ? (blank(v[1]) ? (v[0] ?? null) : v[1]) : v[2];
}

const num = (v: Val) => (typeof v === "number" ? v : Number(v) || 0);

/** score of any node at a level (KPI/SUB: 0–100; COMP: points) */
export function nodeScore(n: FNode, d: AppraisalData, level: Level, w?: Weights): number {
  if (n.children.length) {
    const kids = n.children.map((c) => nodeScore(c, d, level, w));
    if (n.method === "points") return Math.min(100, (kids.reduce((a, b) => a + b, 0) / (n.p100 || 100)) * 100);
    if (n.method === "points_lookup") return bandLookup(n.table!, kids.reduce((a, b) => a + b, 0));
    // wavg over applicable SUB children
    let sw = 0;
    let s = 0;
    n.children.forEach((c, i) => {
      if (d.applicable[c.id] === false) return;
      sw += kw(c, w);
      s += kids[i] * kw(c, w);
    });
    return sw ? s / sw : 0;
  }
  const v = effectiveValue(n, d, level);
  if (n.level === "COMP") {
    if (n.lookup) return blank(v) ? 0 : bandLookup(n.lookup, num(v));
    if (n.input === "yesno") return v === "Yes" ? (n.factor ?? 0) : 0;
    const p = num(v) * (n.factor ?? 0);
    return n.cap == null ? p : Math.min(n.cap, p);
  }
  if (n.method === "band") return blank(v) ? 0 : bandLookup(n.table!, num(v));
  return ratingScore(v);
}

const kw = (n: FNode, w?: Weights) => w?.kpi[n.id] ?? n.weight ?? 0;

export function componentScore(c: Component, d: AppraisalData, level: Level, w?: Weights): number {
  let sw = 0;
  let s = 0;
  for (const k of c.kpis) {
    if (d.applicable[k.id] === false) continue;
    sw += kw(k, w);
    s += nodeScore(k, d, level, w) * kw(k, w);
  }
  return sw ? s / sw : 0;
}

export interface ScoreSummary {
  /** component id -> [self, dd, final] */
  components: Record<string, number[]>;
  /** FPI per level */
  fpi: number[];
}

/** w = optional draft weights (Framework Studio preview); default = the published framework */
export function summarize(d: AppraisalData, designation: string, wts?: Weights): ScoreSummary {
  const components: Record<string, number[]> = {};
  const fpi = [0, 0, 0];
  for (const c of COMPONENTS) {
    const w = (wts ? wts.desig[c.id]?.[desigIndex(designation)] ?? 0 : weightFor(c.id, designation)) / 100;
    components[c.id] = LEVELS.map((l) => componentScore(c, d, l, wts));
    LEVELS.forEach((l) => (fpi[l] += components[c.id][l] * w));
  }
  return { components, fpi };
}

export function perfBand(score: number) {
  let b = FW.perfBands[0];
  for (const x of FW.perfBands) if (score >= x.min - 1e-9) b = x;
  return b;
}

export const BAND_COLOR: Record<string, string> = {
  OS: "#0E9F6E",
  EE: "#2A78D6",
  SME: "#7C5CFC",
  PME: "#F59E0B",
  DME: "#E5484D",
};

/** the illustrative faculty from the Excel blueprint (Self 80.5 / Dy Dir 74.3 / Final 74.3) */
export function sampleAppraisal(): AppraisalData {
  const values: Record<string, Val[]> = {};
  for (const c of COMPONENTS)
    for (const k of c.kpis)
      for (const n of walkLeaves(k)) if (n.sample && !n.course_feed) values[n.id] = [...n.sample];
  return { values, applicable: {}, courses: FW.sample.courses.map((c) => ({ ...c })) };
}

function* walkLeaves(n: FNode): Generator<FNode> {
  if (!n.children.length) yield n;
  for (const c of n.children) yield* walkLeaves(c);
}
