"use client";
/**
 * Demo state: in-memory + localStorage. Replaced by the API in Wave 1+.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BASE_WEIGHTS, type Val, type Weights } from "./framework";
import { buildFaculty, ME_ID, type Faculty, type Status } from "./mock";
import { summarize, type CourseRow, type Level, type ScoreSummary } from "./scoring";

export type Role = "faculty" | "dydir" | "director" | "admin";

export const ROLE_META: Record<Role, { label: string; person: string; home: string; initials: string }> = {
  faculty: { label: "Faculty", person: "Dr. Anjali Menon", home: "/faculty", initials: "AM" },
  dydir: { label: "Deputy Director", person: "Deputy Director (Academics)", home: "/review", initials: "DD" },
  director: { label: "Director", person: "Director", home: "/director", initials: "DR" },
  admin: { label: "Admin / IQAC", person: "IQAC Coordinator", home: "/admin", initials: "IQ" },
};

/** which role owns a URL; used to keep the sidebar in step when a page is opened directly */
export function roleForPath(path: string, current: Role): Role {
  const allowed: Record<Role, string[]> = {
    faculty: ["/faculty", "/guide", "/soon"],
    dydir: ["/review", "/director", "/guide", "/soon"],
    director: ["/director", "/admin/framework", "/guide", "/soon"],
    admin: ["/admin", "/soon"],
  };
  const ok = (r: Role) => allowed[r].some((p) => path === p || path.startsWith(p + "/"));
  if (ok(current) && !(current === "dydir" && path.startsWith("/director/approvals"))) return current;
  if (path.startsWith("/faculty")) return "faculty";
  if (path.startsWith("/review")) return "dydir";
  if (path.startsWith("/director")) return "director";
  if (path.startsWith("/admin")) return "admin";
  return current;
}

const ACTOR: Record<Role, string> = { faculty: "", dydir: "Deputy Director", director: "Director", admin: "IQAC Admin" };

export interface FrameworkVersion {
  version: string;
  weights: Weights;
  publishedAt: string;
  by: string;
  note: string;
  appliesFrom: string;
}

interface FrameworkState {
  versions: FrameworkVersion[];
  /** unpublished edits by Admin / IQAC */
  draft: Weights | null;
}

interface State {
  role: Role;
  faculty: Faculty[];
  framework: FrameworkState;
}

interface Store extends State {
  setRole: (r: Role) => void;
  me: Faculty;
  get: (id: string) => Faculty | undefined;
  scores: (f: Faculty) => ScoreSummary;
  setValue: (id: string, node: string, level: Level, v: Val) => void;
  setApplicable: (id: string, node: string, on: boolean) => void;
  setCourse: (id: string, idx: number, patch: Partial<CourseRow>) => void;
  setRemark: (id: string, node: string, text: string) => void;
  setEvidence: (id: string, kpi: string, files: string[]) => void;
  transition: (id: string, to: Status, action: string, note?: string) => void;
  startDraft: () => void;
  setDraft: (w: Weights) => void;
  discardDraft: () => void;
  publishDraft: (note: string, appliesFrom: string) => void;
  reset: () => void;
  hydrated: boolean;
}

const KEY = "lead-appraisal-demo-v2";
const Ctx = createContext<Store | null>(null);

const initialFramework = (): FrameworkState => ({
  versions: [{ version: "1.0", weights: BASE_WEIGHTS, publishedAt: "2026-10-28T10:00", by: "IQAC Coordinator", note: "Initial KRA/KPI framework approved by the Director.", appliesFrom: "AY 2026-27 · Cycle 1" }],
  draft: null,
});
const initial = (role: Role = "faculty"): State => ({ role, faculty: buildFaculty(), framework: initialFramework() });
const clone = (w: Weights): Weights => ({ desig: Object.fromEntries(Object.entries(w.desig).map(([k, v]) => [k, [...v]])), kpi: { ...w.kpi } });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => initial());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setState(JSON.parse(s));
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const patchFaculty = useCallback((id: string, fn: (f: Faculty) => Faculty) => {
    setState((s) => ({ ...s, faculty: s.faculty.map((f) => (f.id === id ? fn(f) : f)) }));
  }, []);
  const patchFw = (fn: (fw: FrameworkState) => FrameworkState) => setState((s) => ({ ...s, framework: fn(s.framework) }));

  const cache = useMemo(() => new WeakMap<Faculty, ScoreSummary>(), []);
  const scores = useCallback(
    (f: Faculty) => {
      let s = cache.get(f);
      if (!s) {
        s = summarize(f.data, f.designation);
        cache.set(f, s);
      }
      return s;
    },
    [cache],
  );

  const store: Store = {
    ...state,
    hydrated,
    me: state.faculty.find((f) => f.id === ME_ID)!,
    get: (id) => state.faculty.find((f) => f.id === id),
    scores,
    setRole: (role) => setState((s) => (s.role === role ? s : { ...s, role })),
    setValue: (id, node, level, v) =>
      patchFaculty(id, (f) => {
        const cur = [...(f.data.values[node] ?? [null, null, null])];
        cur[level] = v;
        return { ...f, status: f.status === "not_started" ? "draft" : f.status, data: { ...f.data, values: { ...f.data.values, [node]: cur } } };
      }),
    setApplicable: (id, node, on) =>
      patchFaculty(id, (f) => ({ ...f, data: { ...f.data, applicable: { ...f.data.applicable, [node]: on } } })),
    setCourse: (id, idx, patch) =>
      patchFaculty(id, (f) => ({ ...f, data: { ...f.data, courses: f.data.courses.map((c, i) => (i === idx ? { ...c, ...patch } : c)) } })),
    setRemark: (id, node, text) => patchFaculty(id, (f) => ({ ...f, remarks: { ...f.remarks, [node]: text } })),
    setEvidence: (id, kpi, files) => patchFaculty(id, (f) => ({ ...f, evidence: { ...f.evidence, [kpi]: files } })),
    transition: (id, to, action, note) =>
      patchFaculty(id, (f) => ({
        ...f,
        status: to,
        events: [...f.events, { at: new Date().toISOString().slice(0, 16), by: ACTOR[state.role] || f.name, action, note }],
      })),
    startDraft: () => patchFw((fw) => (fw.draft ? fw : { ...fw, draft: clone(fw.versions[fw.versions.length - 1].weights) })),
    setDraft: (w) => patchFw((fw) => ({ ...fw, draft: w })),
    discardDraft: () => patchFw((fw) => ({ ...fw, draft: null })),
    publishDraft: (note, appliesFrom) =>
      patchFw((fw) => {
        if (!fw.draft) return fw;
        const last = fw.versions[fw.versions.length - 1].version;
        const [maj, min] = last.split(".").map(Number);
        return {
          draft: null,
          versions: [...fw.versions, { version: `${maj}.${min + 1}`, weights: fw.draft, publishedAt: new Date().toISOString().slice(0, 16), by: "IQAC Coordinator", note, appliesFrom }],
        };
      }),
    reset: () => {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      setState(initial(state.role));
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
