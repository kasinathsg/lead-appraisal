/**
 * Demo data — clearly illustrative faculty, generated deterministically so every reload looks the same.
 * The signed-in faculty ("me") carries the exact Excel blueprint sample, so the web scores match the workbook.
 */
import { COMPONENTS, FW, INPUT_NODES, NODE, evidenceRule, type FNode, type Val } from "./framework";
import { sampleAppraisal, type AppraisalData, type CourseRow } from "./scoring";

export type Status =
  | "not_started"
  | "draft"
  | "submitted"
  | "returned_faculty"
  | "validated"
  | "returned_dd"
  | "approved"
  | "acknowledged";

export const STATUS_META: Record<Status, { label: string; tone: "muted" | "brand" | "warn" | "violet" | "ok" | "danger"; step: number }> = {
  not_started: { label: "Not started", tone: "muted", step: 0 },
  draft: { label: "Draft", tone: "muted", step: 0 },
  submitted: { label: "With Dy Director", tone: "brand", step: 1 },
  returned_faculty: { label: "Returned to faculty", tone: "danger", step: 0 },
  validated: { label: "With Director", tone: "violet", step: 2 },
  returned_dd: { label: "Returned to Dy Director", tone: "danger", step: 1 },
  approved: { label: "Approved", tone: "ok", step: 3 },
  acknowledged: { label: "Acknowledged", tone: "ok", step: 4 },
};

export interface WfEvent {
  at: string;
  by: string;
  action: string;
  note?: string;
}

export interface Faculty {
  id: string;
  name: string;
  empId: string;
  email: string;
  designation: string;
  dept: string;
  doj: string;
  qualification: string;
  mentorGroup: string;
  status: Status;
  data: AppraisalData;
  events: WfEvent[];
  history: { cycle: string; fpi: number }[];
  remarks: Record<string, string>;
  /** KPI id -> attached file names */
  evidence: Record<string, string[]>;
}

const KPIS = COMPONENTS.flatMap((c) => c.kpis);
/** a believable file name from the KPI's evidence description */
export function mockFileName(n: FNode, i = 0) {
  const base = (n.evidence ?? n.name).split(/[;(]/)[0].replace(/[^A-Za-z0-9 -]/g, "").trim().split(/\s+/).slice(0, 4).join("_");
  return `${base}${i ? "_" + (i + 1) : ""}.${i % 2 ? "xlsx" : "pdf"}`;
}
function genEvidence(step: number, draftShare: number, r: () => number) {
  const ev: Record<string, string[]> = {};
  if (step < 0) return ev;
  KPIS.forEach((n, i) => {
    const rule = evidenceRule(n);
    if (rule === "none") return;
    if (step === 0 && i / KPIS.length > draftShare) return;
    if (rule === "optional" && r() < 0.5) return;
    ev[n.id] = Array.from({ length: 1 + Math.floor(r() * 2) }, (_, j) => mockFileName(n, j));
  });
  return ev;
}

export const ME_ID = "F01";
export const CURRENT_CYCLE = "AY 2026-27 · Cycle 1";
export const PAST_CYCLES = ["2024-25 · C2", "2025-26 · C1", "2025-26 · C2"];

export const CYCLE_STAGES = [
  { key: "self", label: "Self-appraisal", from: "2026-10-20", to: "2026-11-10" },
  { key: "dd", label: "Dy Director review", from: "2026-11-11", to: "2026-11-20" },
  { key: "dir", label: "Director approval", from: "2026-11-21", to: "2026-11-30" },
  { key: "pub", label: "Results & acknowledgement", from: "2026-12-01", to: "2026-12-07" },
];
export const TODAY = "2026-10-31";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PEOPLE: [string, string, string, Status][] = [
  // name, designation, department, status
  ["Dr. Anjali Menon", "Assistant Professor", "Marketing", "draft"],
  ["Dr. Rahul Nair", "Associate Professor", "Finance", "approved"],
  ["Prof. Meera Krishnan", "Professor", "Strategy & General Management", "approved"],
  ["Arun Pillai", "Assistant Professor", "Operations & Business Analytics", "submitted"],
  ["Dr. Sneha Varma", "Assistant Professor", "Human Resources", "validated"],
  ["Vivek Iyer", "Visiting Faculty", "Finance", "approved"],
  ["Dr. Lakshmi Raghavan", "Associate Professor", "Economics", "validated"],
  ["Nikhil Thomas", "Assistant Professor", "Information Systems", "submitted"],
  ["Dr. Priya Suresh", "Assistant Professor", "Marketing", "approved"],
  ["Karthik Menon", "Assistant Professor", "Finance", "returned_faculty"],
  ["Dr. Divya Mohan", "Associate Professor", "Human Resources", "acknowledged"],
  ["Rohit Kurian", "Assistant Professor", "Operations & Business Analytics", "draft"],
  ["Dr. Aparna Das", "Professor", "Marketing", "validated"],
  ["Sanjay Warrier", "Visiting Faculty", "Strategy & General Management", "submitted"],
  ["Dr. Fathima Rasheed", "Assistant Professor", "Business Communication", "approved"],
  ["Joseph Mathew", "Assistant Professor", "Economics", "submitted"],
  ["Dr. Kavya Nambiar", "Associate Professor", "Marketing", "approved"],
  ["Hari Shankar", "Assistant Professor", "Information Systems", "not_started"],
  ["Dr. Neethu George", "Assistant Professor", "Finance", "validated"],
  ["Ajay Kumar", "Visiting Faculty", "Operations & Business Analytics", "draft"],
  ["Dr. Reshma Pillai", "Associate Professor", "Strategy & General Management", "submitted"],
  ["Vinod Chandran", "Assistant Professor", "Human Resources", "approved"],
  ["Dr. Swathi Rao", "Professor", "Finance", "acknowledged"],
  ["Abdul Rahman", "Assistant Professor", "Business Communication", "validated"],
];

const QUALS = ["PhD", "PhD (pursuing)", "MBA, UGC-NET", "MBA, UGC-NET (PhD pursuing)", "PhD", "M.Phil"];
const INVERSE = new Set(["Band_Pending", "Band_Incidents"]);
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function genValue(n: FNode, q: number, r: () => number): Val {
  const s = n.sample?.[0];
  const noise = r() - 0.5;
  switch (n.input) {
    case "pct": {
      const base = typeof s === "number" ? s : 0.85;
      return round(clamp(base + (q - 0.65) * 0.3 + noise * 0.08, 0.45, 1));
    }
    case "count": {
      if (n.table && INVERSE.has(n.table)) return r() < q ? 0 : 1 + Math.floor(r() * 2);
      const base = typeof s === "number" ? s : 0;
      const v = Math.round(Math.max(0, base * (0.3 + q * 1.3) + noise * 1.2 + (q > 0.8 && r() < 0.35 ? 1 : 0)));
      return n.max_count ? Math.min(n.max_count, v) : v;
    }
    case "level":
      return round(clamp(1.3 + q * 1.5 + noise * 0.4, 0.8, 3), 1);
    case "amount": {
      const base = typeof s === "number" ? s : 0;
      return Math.round((base * (0.2 + q * 1.6) * (0.8 + r() * 0.4)) / 1000) * 1000 || (n.lookup ? 0 : Math.round(base));
    }
    case "rating": {
      const idx = clamp(Math.round((1 - q) * 3.2 + noise * 1.4), 0, 4);
      return FW.ratings[idx].label;
    }
    case "yesno":
      return r() < q * 0.25 ? "Yes" : "No";
    default:
      return null;
  }
}

function trim(n: FNode, v: Val, r: () => number): Val {
  if (v === null) return null;
  if (n.input === "pct" && typeof v === "number") return round(clamp(v - 0.03 - r() * 0.06, 0.4, 1));
  if (n.input === "count" && typeof v === "number") return n.table && INVERSE.has(n.table) ? v + 1 : Math.max(0, v - 1);
  if (n.input === "rating") {
    const i = FW.ratings.findIndex((x) => x.label === v);
    return FW.ratings[Math.min(4, i + 1)].label;
  }
  if (n.input === "level" && typeof v === "number") return round(Math.max(0.8, v - 0.3), 1);
  return v;
}

function genCourses(q: number, r: () => number, dept: string): CourseRow[] {
  const pool: Record<string, string[]> = {
    Marketing: ["Marketing Management", "Consumer Behaviour", "Digital Marketing", "Brand Management"],
    Finance: ["Financial Management", "Corporate Finance", "Investment Analysis", "Financial Derivatives"],
    "Human Resources": ["Organisational Behaviour", "HR Management", "Talent Management", "Labour Laws"],
    "Operations & Business Analytics": ["Operations Management", "Business Analytics", "Supply Chain Mgmt", "Business Statistics"],
    "Strategy & General Management": ["Strategic Management", "Business Policy", "Entrepreneurship", "Corporate Governance"],
    Economics: ["Managerial Economics", "Macroeconomics", "Business Environment", "Indian Economy"],
    "Business Communication": ["Business Communication", "Managerial Writing", "Presentation Skills", "Negotiation"],
    "Information Systems": ["Management Info Systems", "Data Science for Managers", "ERP Systems", "Digital Business"],
  };
  const names = pool[dept] ?? pool.Marketing;
  const k = 2 + Math.floor(r() * 3);
  return names.slice(0, k).map((course, i) => ({
    course,
    batch: i % 2 ? "2025-27" : "2026-28",
    semester: ["Semester I", "Semester III", "Semester II", "Semester IV"][i],
    teiF: round(clamp(0.66 + q * 0.28 + (r() - 0.5) * 0.08, 0.55, 0.97)),
    teiDD: null,
    passF: round(clamp(0.8 + q * 0.17 + (r() - 0.5) * 0.06, 0.7, 1)),
    passDD: null,
  }));
}

const STEP_OF: Record<Status, number> = { not_started: -1, draft: 0, returned_faculty: 0, submitted: 1, returned_dd: 1, validated: 2, approved: 3, acknowledged: 3 };

export function buildFaculty(): Faculty[] {
  return PEOPLE.map(([name, designation, dept, status], i) => {
    const id = `F${String(i + 1).padStart(2, "0")}`;
    const r = rng(1009 * (i + 7));
    const q = i === 0 ? 0.75 : clamp(0.35 + r() * 0.65, 0.3, 1);
    const step = STEP_OF[status];
    let data: AppraisalData;
    if (id === ME_ID) {
      data = sampleAppraisal();
      // self-appraisal in progress: only the faculty column is filled
      for (const k of Object.keys(data.values)) data.values[k] = [data.values[k][0], null, null];
      data.courses = data.courses.map((c) => ({ ...c, teiDD: null, passDD: null }));
    } else {
      const values: Record<string, Val[]> = {};
      for (const n of INPUT_NODES) {
        if (n.course_feed) continue;
        const self = step < 0 ? null : genValue(n, q, r);
        const dd = step >= 2 && r() < 0.28 ? trim(n, self, r) : null;
        const dir = step >= 3 && r() < 0.06 ? trim(n, dd ?? self, r) : null;
        values[n.id] = [self, dd, dir];
      }
      // draft faculty have filled only part of the form
      if (status === "draft") INPUT_NODES.slice(Math.floor(INPUT_NODES.length * (0.35 + r() * 0.4))).forEach((n) => (values[n.id] = [null, null, null]));
      const moa = NODE["8.1"];
      if (moa && step >= 0) {
        const idx = clamp(Math.round((1 - q) * 3), 0, 4);
        values["8.1"] = [FW.ratings[Math.max(0, idx - 1)].label, step >= 2 ? FW.ratings[idx].label : null, step >= 3 ? FW.ratings[idx].label : null];
      }
      const courses = step < 0 ? [] : genCourses(q, r, dept);
      if (step >= 2) courses.forEach((c) => r() < 0.3 && c.teiF && (c.teiDD = round(c.teiF - 0.03)));
      const applicable: Record<string, boolean> = {};
      if (designation === "Visiting Faculty") ["4.5", "6.3"].forEach((k) => (applicable[k] = false));
      data = { values, applicable, courses };
    }
    const events: WfEvent[] = [{ at: "2026-10-20T09:00", by: "System", action: "Appraisal opened for " + CURRENT_CYCLE }];
    if (step >= 1 || status === "returned_faculty") events.push({ at: `2026-10-${22 + (i % 6)}T1${i % 9}:15`, by: name, action: "Submitted self-appraisal" });
    if (status === "returned_faculty")
      events.push({ at: "2026-10-29T11:40", by: "Deputy Director", action: "Returned to faculty", note: "Please attach evidence for KPI 5.1 publications and recheck the TEI for Corporate Finance." });
    if (step >= 2) events.push({ at: `2026-10-${27 + (i % 3)}T15:05`, by: "Deputy Director", action: "Validated and forwarded to Director" });
    if (step >= 3) events.push({ at: "2026-10-30T17:20", by: "Director", action: "Approved" });
    if (status === "acknowledged") events.push({ at: "2026-10-31T09:10", by: name, action: "Acknowledged final score" });
    const base = 56 + q * 34;
    return {
      id,
      name,
      empId: `LEAD-F-${String(101 + i * 7)}`,
      email: name.toLowerCase().replace(/^(dr|prof)\.\s*/, "").replace(/[^a-z]+/g, ".") + "@lead.ac.in",
      designation,
      dept,
      doj: `20${String(12 + (i % 12)).padStart(2, "0")}-0${1 + (i % 9)}-01`,
      qualification: i === 0 ? FW.sample.profile["Highest Qualification"] : QUALS[i % QUALS.length],
      mentorGroup: designation === "Visiting Faculty" ? "—" : `MBA 2025-27 · Group M${(i % 8) + 1}`,
      status,
      data,
      events,
      history: id === ME_ID
        ? [{ cycle: PAST_CYCLES[0], fpi: 68.9 }, { cycle: PAST_CYCLES[1], fpi: 71.6 }, { cycle: PAST_CYCLES[2], fpi: 74.3 }]
        : PAST_CYCLES.map((cycle, j) => ({ cycle, fpi: round(base - 6 + j * 2.4 + (r() - 0.5) * 6, 1) })),
      remarks: {},
      evidence: id === ME_ID ? genEvidence(0, 1, () => 0.9) : genEvidence(status === "returned_faculty" ? 1 : step, status === "draft" ? 0.5 : 1, r),
    };
  });
}

export const STAFF = [
  { id: "U-DD", name: "Deputy Director (Academics)", role: "Deputy Director", email: "dydirector@lead.ac.in" },
  { id: "U-DIR", name: "Director", role: "Director", email: "director@lead.ac.in" },
  { id: "U-IQAC", name: "IQAC Coordinator", role: "Admin", email: "iqac@lead.ac.in" },
];

export const CYCLES = [
  { id: "C-2627-1", ay: "2026-27", name: "Cycle 1", period: "Jun 2026 – Nov 2026", status: "Active" as const, framework: "v1.0" },
  { id: "C-2627-2", ay: "2026-27", name: "Cycle 2", period: "Dec 2026 – May 2027", status: "Scheduled" as const, framework: "v1.0" },
  { id: "C-2526-2", ay: "2025-26", name: "Cycle 2", period: "Dec 2025 – May 2026", status: "Closed" as const, framework: "Legacy 2023-R2" },
  { id: "C-2526-1", ay: "2025-26", name: "Cycle 1", period: "Jun 2025 – Nov 2025", status: "Archived" as const, framework: "Legacy 2023-R2" },
];
