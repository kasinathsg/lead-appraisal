import raw from "@/data/framework.json";

export type Method = "band" | "rating" | "points" | "points_lookup" | "wavg";
export type InputKind = "pct" | "count" | "level" | "amount" | "rating" | "yesno" | "none";
export type NodeLevel = "KPI" | "SUB" | "COMP";
export type Val = number | string | null;

export interface FNode {
  id: string;
  name: string;
  level: NodeLevel;
  children: FNode[];
  doc?: string;
  definition?: string;
  measure?: string;
  unit?: string;
  input?: InputKind;
  target?: string;
  method?: Method;
  table?: string;
  lookup?: string;
  weight?: number;
  p100?: number;
  factor?: number | null;
  cap?: number | null;
  max_count?: number | null;
  rubric?: string[];
  evidence?: string;
  capture?: string;
  frequency?: string;
  entered_by?: string;
  validated_by?: string;
  legacy?: string;
  legacy_value?: string;
  course_feed?: "TEI" | "PASS";
  sample?: Val[];
}

export interface Component {
  id: string;
  no: number;
  short: string;
  name: string;
  focus: string;
  intent: string;
  sources: string;
  color: string;
  kpis: FNode[];
}

export interface BandTable {
  title: string;
  kind: "pct" | "count" | "level" | "amount";
  source: string;
  rows: [number, number][];
  note: string;
  rubric: string[] | null;
}

export interface Framework {
  meta: Record<string, string>;
  designations: string[];
  ratings: { label: string; score: number }[];
  perfBands: { min: number; band: string; code: string; meaning: string }[];
  bands: Record<string, BandTable>;
  components: Component[];
  designationWeights: Record<string, number[]>;
  weightRationale: string[];
  sample: {
    profile: Record<string, string>;
    courses: { course: string; batch: string; semester: string; teiF: number | null; teiDD: number | null; passF: number | null; passDD: number | null }[];
    workflow: { stage: string; status: string; date: string; by: string }[];
  };
  lists: Record<string, string[]>;
}

export const FW = raw as unknown as Framework;
export const COMPONENTS = FW.components;
export const KRAS = COMPONENTS.filter((c) => c.id !== "MOA");
export const MOA = COMPONENTS.find((c) => c.id === "MOA")!;

export function* walk(n: FNode): Generator<FNode> {
  yield n;
  for (const c of n.children) yield* walk(c);
}

/** every node of a component, depth-first */
export const nodesOf = (c: Component) => c.kpis.flatMap((k) => [...walk(k)]);
export const ALL_NODES = COMPONENTS.flatMap(nodesOf);
export const NODE = Object.fromEntries(ALL_NODES.map((n) => [n.id, n])) as Record<string, FNode>;
export const COMPONENT_OF = Object.fromEntries(
  COMPONENTS.flatMap((c) => nodesOf(c).map((n) => [n.id, c] as const)),
) as Record<string, Component>;

/** leaf nodes that take a value (not parents) */
export const isLeaf = (n: FNode) => n.children.length === 0;
export const INPUT_NODES = ALL_NODES.filter(isLeaf);

export const desigIndex = (d: string) => Math.max(0, FW.designations.indexOf(d));
export const weightFor = (componentId: string, designation: string) =>
  FW.designationWeights[componentId]?.[desigIndex(designation)] ?? 0;

export const SHORT_DESIG: Record<string, string> = {
  "Assistant Professor": "Asst. Prof.",
  "Associate Professor": "Assoc. Prof.",
  Professor: "Professor",
  "Visiting Faculty": "Visiting",
};

/** Editable weights: designation weight per component, and KPI / sub-KPI weight inside its parent. */
export interface Weights {
  desig: Record<string, number[]>;
  kpi: Record<string, number>;
}
export const BASE_WEIGHTS: Weights = {
  desig: Object.fromEntries(Object.entries(FW.designationWeights).map(([k, v]) => [k, [...v]])),
  kpi: Object.fromEntries(ALL_NODES.filter((n) => n.level !== "COMP").map((n) => [n.id, n.weight ?? 0])),
};

/**
 * Evidence rule per KPI, derived from who supplies the data:
 *  - required: claims the faculty member reports (publications, mentoring, events …)
 *  - optional: course-register figures that also come from the feedback system / exam cell
 *  - none: fed automatically by LMS / biometric / exam cell, or a management judgement (MOA)
 */
export type EvidenceRule = "required" | "optional" | "none";
export function evidenceRule(n: FNode): EvidenceRule {
  if (COMPONENT_OF[n.id]?.id === "MOA") return "none";
  if (n.entered_by === "System") return "none";
  if (n.entered_by?.startsWith("System")) return "optional";
  return "required";
}
