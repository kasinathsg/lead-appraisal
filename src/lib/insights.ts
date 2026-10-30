import { COMPONENTS, COMPONENT_OF, INPUT_NODES, KRAS, NODE, evidenceRule, weightFor, type FNode } from "./framework";
import { nodeScore, type Level, type ScoreSummary } from "./scoring";
import type { Faculty } from "./mock";

/** leaf inputs the faculty is expected to fill (course-feed KPIs come from the course register) */
export function expectedInputs(f: Faculty) {
  return INPUT_NODES.filter((n) => {
    if (n.course_feed) return false;
    const c = COMPONENT_OF[n.id];
    if (weightFor(c.id, f.designation) === 0) return false;
    return !ancestors(n.id).some((a) => f.data.applicable[a] === false);
  });
}

function ancestors(id: string) {
  const out: string[] = [];
  for (const k of Object.keys(NODE)) if (id !== k && id.startsWith(k) && NODE[k].children.length) out.push(k);
  return out;
}

export function completion(f: Faculty) {
  const exp = expectedInputs(f);
  const done = exp.filter((n) => {
    const v = f.data.values[n.id]?.[0];
    return v !== null && v !== undefined && v !== "";
  });
  return { done: done.length, total: exp.length, missing: exp.filter((n) => !done.includes(n)) };
}

export function componentCompletion(f: Faculty, cid: string) {
  const exp = expectedInputs(f).filter((n) => COMPONENT_OF[n.id].id === cid);
  const done = exp.filter((n) => {
    const v = f.data.values[n.id]?.[0];
    return v !== null && v !== undefined && v !== "";
  }).length;
  return { done, total: exp.length };
}

/** FPI points gained if this KPI reached 100 at the given level */
export function opportunities(f: Faculty, level: Level, top = 5) {
  const out: { node: FNode; kra: (typeof COMPONENTS)[number]; score: number; gain: number }[] = [];
  for (const c of COMPONENTS) {
    const dw = weightFor(c.id, f.designation) / 100;
    if (!dw) continue;
    const act = c.kpis.filter((k) => f.data.applicable[k.id] !== false);
    const sw = act.reduce((a, k) => a + (k.weight ?? 0), 0);
    for (const k of act) {
      const s = nodeScore(k, f.data, level);
      const gain = ((100 - s) * (k.weight ?? 0)) / sw * dw;
      if (gain > 0.05) out.push({ node: k, kra: c, score: s, gain });
    }
  }
  return out.sort((a, b) => b.gain - a.gain).slice(0, top);
}

/** average component score (final level) across faculty whose appraisal is approved */
export function institutionAverage(faculty: Faculty[], scores: (f: Faculty) => ScoreSummary) {
  const done = faculty.filter((f) => f.status === "approved" || f.status === "acknowledged");
  const avg: Record<string, number> = {};
  for (const c of COMPONENTS) {
    const xs = done.filter((f) => weightFor(c.id, f.designation) > 0).map((f) => scores(f).components[c.id][2]);
    avg[c.id] = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }
  const fpis = done.map((f) => scores(f).fpi[2]);
  return { components: avg, fpi: fpis.length ? fpis.reduce((a, b) => a + b, 0) / fpis.length : 0, n: done.length };
}

export const kraLabel = (id: string) => (id === "MOA" ? "MOA" : `KRA ${id.slice(3)}`);
export { KRAS };

/** applicable KPIs whose evidence is required but nothing is attached yet */
export function evidenceGaps(f: Faculty) {
  const need = COMPONENTS.filter((c) => weightFor(c.id, f.designation) > 0)
    .flatMap((c) => c.kpis)
    .filter((k) => evidenceRule(k) === "required" && f.data.applicable[k.id] !== false);
  return { required: need.length, missing: need.filter((k) => !(f.evidence?.[k.id]?.length)) };
}
