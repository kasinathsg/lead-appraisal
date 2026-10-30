"use client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CalendarRange, CheckCircle2, Copy, Hourglass, Lock, Pencil, Play, Plus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { CURRENT_CYCLE, CYCLES, CYCLE_STAGES, STATUS_META, TODAY, type Status } from "@/lib/mock";
import { FW, SHORT_DESIG } from "@/lib/framework";
import { Avatar, Button, Card, Chip, PageHeader, fmtDate, type Tone } from "@/components/ui";
import { Check, Field, Modal, inputCls, useToast } from "@/components/admin/overlay";

type CycleStatus = "Active" | "Scheduled" | "Closed" | "Archived";
interface Cycle {
  id: string;
  ay: string;
  name: string;
  period: string;
  status: CycleStatus;
  framework: string;
}

const CYCLE_TONE: Record<CycleStatus, Tone> = { Active: "ok", Scheduled: "brand", Closed: "muted", Archived: "muted" };
const DAY = 86400000;
const days = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);

const STATUS_COLORS: Record<string, string> = {
  "Not started": "#d5dae6",
  Draft: "#9aa5bd",
  "With Dy Director": "#1f5bd8",
  "With Director": "#7c5cfc",
  Approved: "#22c79a",
  Returned: "#e5484d",
};
function bucket(s: Status) {
  if (s === "not_started") return "Not started";
  if (s === "draft") return "Draft";
  if (s === "returned_faculty" || s === "returned_dd") return "Returned";
  if (s === "submitted") return "With Dy Director";
  if (s === "validated") return "With Director";
  return "Approved";
}

export default function CyclesPage() {
  const { faculty, framework } = useStore();
  const liveVersion = "v" + framework.versions[framework.versions.length - 1].version;
  const { toast, node: toastNode } = useToast();
  const [cycles, setCycles] = useState<Cycle[]>(CYCLES.map((c) => ({ ...c })));
  const [confirm, setConfirm] = useState<{ id: string; action: string } | null>(null);
  const [wizard, setWizard] = useState(false);

  const done = faculty.filter((f) => f.status === "approved" || f.status === "acknowledged").length;
  const submitted = faculty.filter((f) => STATUS_META[f.status].step >= 1).length;
  const selfLeft = Math.max(0, days(TODAY, CYCLE_STAGES[0].to));

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    faculty.forEach((f) => (m[bucket(f.status)] = (m[bucket(f.status)] ?? 0) + 1));
    return m;
  }, [faculty]);

  const years = [...new Set(cycles.map((c) => c.ay))].sort().reverse();

  const act = (id: string, action: string) => {
    setCycles((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        if (action === "Activate") return { ...c, status: "Active" };
        if (action === "Close") return { ...c, status: "Closed" };
        if (action === "Archive") return { ...c, status: "Archived" };
        return c;
      }),
    );
    if (action === "Clone") {
      const src = cycles.find((c) => c.id === id)!;
      setCycles((cs) => [...cs, { ...src, id: src.id + "-copy" + cs.length, name: src.name + " (copy)", status: "Scheduled" }]);
    }
    setConfirm(null);
    toast(`${action} done for ${cycles.find((c) => c.id === id)?.name ?? "cycle"}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin · IQAC"
        title="Appraisal cycles"
        subtitle="Two cycles per academic year. Each cycle is pinned to one framework version, so past scores never change."
        actions={
          <Button variant="primary" onClick={() => setWizard(true)}>
            <Plus size={16} /> New cycle
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<CalendarRange size={18} />} tone="bg-brand text-white" label="Active cycle" value={CURRENT_CYCLE.replace("AY ", "")} note="Framework v1.0" />
        <Stat icon={<Users size={18} />} tone="bg-violet text-white" label="Participants" value={String(faculty.length)} note={`${faculty.filter((f) => f.designation === "Visiting Faculty").length} visiting faculty`} />
        <Stat icon={<CheckCircle2 size={18} />} tone="bg-mint text-white" label="Submitted" value={`${Math.round((submitted / faculty.length) * 100)}%`} note={`${done} fully approved`} />
        <Stat icon={<Hourglass size={18} />} tone="bg-sun text-ink" label="Self-appraisal window" value={`${selfLeft} days`} note={`Closes ${fmtDate(CYCLE_STAGES[0].to)}`} />
      </div>

      {years.map((ay) => (
        <div key={ay} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-muted">Academic year {ay}</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {cycles
              .filter((c) => c.ay === ay)
              .map((c) => (
                <Card key={c.id} className={clsx(c.status === "Active" && "xl:col-span-2")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold tracking-tight">
                          AY {c.ay} · {c.name}
                        </h3>
                        <Chip tone={CYCLE_TONE[c.status]} dot>
                          {c.status}
                        </Chip>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {c.period} · Framework {c.status === "Scheduled" ? liveVersion : c.framework}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {confirm?.id === c.id ? (
                        <div className="flex items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-3 py-1.5 text-xs font-semibold text-ink">
                          {confirm.action} this cycle?
                          <Button size="sm" variant="dark" onClick={() => act(c.id, confirm.action)}>
                            Yes
                          </Button>
                          <Button size="sm" onClick={() => setConfirm(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          {c.status === "Scheduled" && (
                            <Button size="sm" variant="soft" onClick={() => setConfirm({ id: c.id, action: "Activate" })}>
                              <Play size={13} /> Activate
                            </Button>
                          )}
                          {c.status === "Active" && (
                            <Button size="sm" variant="danger" onClick={() => setConfirm({ id: c.id, action: "Close" })}>
                              <Lock size={13} /> Close cycle
                            </Button>
                          )}
                          {c.status === "Closed" && (
                            <Button size="sm" onClick={() => setConfirm({ id: c.id, action: "Archive" })}>
                              Archive
                            </Button>
                          )}
                          <Button size="sm" onClick={() => act(c.id, "Clone")}>
                            <Copy size={13} /> Clone
                          </Button>
                          {c.status !== "Archived" && (
                            <Button size="sm" onClick={() => toast("Editing cycles arrives in Wave 3")}>
                              <Pencil size={13} /> Edit
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {c.status === "Active" ? (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
                      <Timeline />
                      <div className="flex flex-col gap-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-semibold text-ink-2">Appraisal progress</span>
                          <span className="tnum text-xs text-muted">{faculty.length} faculty</span>
                        </div>
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-line-2">
                          {Object.keys(STATUS_COLORS).map((k) =>
                            counts[k] ? <div key={k} style={{ width: `${(counts[k] / faculty.length) * 100}%`, background: STATUS_COLORS[k] }} title={`${k}: ${counts[k]}`} /> : null,
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                          {Object.entries(STATUS_COLORS).map(([k, col]) => (
                            <div key={k} className="flex items-center gap-2 text-xs text-ink-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: col }} />
                              <span className="flex-1 truncate">{k}</span>
                              <b className="tnum text-ink">{counts[k] ?? 0}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
                      {c.status === "Scheduled" ? (
                        <>
                          <span>Opens automatically on the first stage date</span>
                          <span>Participants assigned by rule at activation</span>
                        </>
                      ) : (
                        <>
                          <span>Read-only · scores locked</span>
                          <span>Scorecards and reports available in History</span>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </div>
      ))}

      <NewCycleWizard
        open={wizard}
        onClose={() => setWizard(false)}
        onCreate={(c) => {
          setCycles((cs) => [...cs, c]);
          setWizard(false);
          toast(`AY ${c.ay} · ${c.name} created as Scheduled`);
        }}
      />
      {toastNode}
    </div>
  );
}

function Stat({ icon, tone, label, value, note }: { icon: React.ReactNode; tone: string; label: string; value: string; note: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", tone)}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted">{label}</div>
        <div className="tnum truncate text-xl font-extrabold tracking-tight">{value}</div>
        <div className="truncate text-[11px] text-muted">{note}</div>
      </div>
    </div>
  );
}

function Timeline() {
  const start = CYCLE_STAGES[0].from;
  const end = CYCLE_STAGES[CYCLE_STAGES.length - 1].to;
  const total = days(start, end);
  const pos = (d: string) => Math.max(0, Math.min(100, (days(start, d) / total) * 100));
  const COLORS = ["#1f5bd8", "#7c5cfc", "#22c79a", "#eda100"];
  return (
    <div>
      <div className="mb-3 text-xs font-semibold text-ink-2">Stage windows</div>
      <div className="relative pt-6">
        <div className="relative h-3 w-full rounded-full bg-line-2">
          {CYCLE_STAGES.map((s, i) => (
            <div
              key={s.key}
              className="absolute top-0 h-3 rounded-full"
              style={{ left: `${pos(s.from)}%`, width: `${pos(s.to) - pos(s.from)}%`, background: COLORS[i], opacity: TODAY > s.to ? 0.45 : 1 }}
            />
          ))}
        </div>
        <div className="absolute top-0 -translate-x-1/2" style={{ left: `${pos(TODAY)}%` }}>
          <span className="whitespace-nowrap rounded-md bg-night px-1.5 py-0.5 text-[10px] font-bold text-white">Today</span>
          <div className="mx-auto h-7 w-0.5 bg-night" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {CYCLE_STAGES.map((s, i) => {
          const live = TODAY >= s.from && TODAY <= s.to;
          return (
            <div key={s.key} className={clsx("rounded-xl border p-3", live ? "border-brand/40 bg-brand-soft" : "border-line")}>
              <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: COLORS[i] }}>
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                {live ? "Open now" : TODAY > s.to ? "Done" : "Upcoming"}
              </div>
              <div className="mt-1 text-[13px] font-semibold leading-tight">{s.label}</div>
              <div className="tnum mt-0.5 text-[11px] text-muted">
                {fmtDate(s.from).replace(/ \d{4}$/, "")} – {fmtDate(s.to).replace(/ \d{4}$/, "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STEPS = ["Basics", "Stage windows", "Participants", "Review"];

function NewCycleWizard({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (c: Cycle) => void }) {
  const { faculty } = useStore();
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState({ ay: "2026-27", name: "Cycle 2", from: "2026-12-01", to: "2027-05-31", framework: "v1.0" });
  const [stages, setStages] = useState([
    { label: "Self-appraisal", from: "2027-04-20", to: "2027-05-10" },
    { label: "Dy Director review", from: "2027-05-11", to: "2027-05-20" },
    { label: "Director approval", from: "2027-05-21", to: "2027-05-30" },
    { label: "Results & acknowledgement", from: "2027-06-01", to: "2027-06-07" },
  ]);
  const [desig, setDesig] = useState<string[]>([...FW.designations]);
  const [depts, setDepts] = useState<string[]>([...FW.lists.Department]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [dojCutoff, setDojCutoff] = useState("2026-11-30");
  const [excluded, setExcluded] = useState<string[]>([]);

  const matching = faculty.filter((f) => desig.includes(f.designation) && depts.includes(f.dept) && f.doj <= dojCutoff);
  const included = matching.filter((f) => !excluded.includes(f.id));
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title="New appraisal cycle"
      footer={
        <>
          <span className="mr-auto text-xs text-muted">
            Step {step + 1} of {STEPS.length}
          </span>
          {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                onCreate({
                  id: "C-new-" + Date.now(),
                  ay: basics.ay,
                  name: basics.name,
                  period: `${fmtDate(basics.from).replace(/^\d+ /, "")} – ${fmtDate(basics.to).replace(/^\d+ /, "")}`,
                  status: "Scheduled",
                  framework: basics.framework,
                });
                setStep(0);
              }}
            >
              <CheckCircle2 size={16} /> Create cycle
            </Button>
          )}
        </>
      }
    >
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <div className={clsx("h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-line-2")} />
            <span className={clsx("text-[11px] font-semibold", i === step ? "text-brand" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Academic year">
            <select className={inputCls} value={basics.ay} onChange={(e) => setBasics({ ...basics, ay: e.target.value })}>
              {FW.lists.AcademicYear.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Cycle name">
            <select className={inputCls} value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })}>
              <option>Cycle 1</option>
              <option>Cycle 2</option>
            </select>
          </Field>
          <Field label="Review period from">
            <input type="date" className={inputCls} value={basics.from} onChange={(e) => setBasics({ ...basics, from: e.target.value })} />
          </Field>
          <Field label="Review period to">
            <input type="date" className={inputCls} value={basics.to} onChange={(e) => setBasics({ ...basics, to: e.target.value })} />
          </Field>
          <Field label="Framework version" hint="The cycle keeps this version even if the framework is edited later.">
            <select className={inputCls} value={basics.framework} onChange={(e) => setBasics({ ...basics, framework: e.target.value })}>
              <option value="v1.0">v1.0 · Published 28 Oct 2026</option>
            </select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          {stages.map((s, i) => (
            <div key={s.label} className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[1fr_160px_160px]">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Stage {i + 1}</div>
                <div className="text-sm font-bold">{s.label}</div>
              </div>
              <Field label="Opens">
                <input type="date" className={inputCls} value={s.from} onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))} />
              </Field>
              <Field label="Closes">
                <input type="date" className={inputCls} value={s.to} onChange={(e) => setStages(stages.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} />
              </Field>
            </div>
          ))}
          <p className="text-xs text-muted">Reminders go out 3 days and 1 day before each stage closes; overdue items escalate to the next level.</p>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-2 text-xs font-semibold text-ink-2">Designations</div>
            <div className="flex flex-wrap gap-2">
              {FW.designations.map((d) => (
                <Check key={d} checked={desig.includes(d)} onChange={() => toggle(desig, setDesig, d)}>
                  {d}
                </Check>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-ink-2">Departments</div>
            <div className="flex flex-wrap gap-2">
              {FW.lists.Department.map((d) => (
                <Check key={d} checked={depts.includes(d)} onChange={() => toggle(depts, setDepts, d)}>
                  {d}
                </Check>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Check checked={activeOnly} onChange={setActiveOnly}>
              Active staff only
            </Check>
            <Field label="Joined on or before">
              <input type="date" className={inputCls} value={dojCutoff} onChange={(e) => setDojCutoff(e.target.value)} />
            </Field>
          </div>
          <div className="rounded-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-bold">
                <span className="tnum text-brand">{included.length}</span> faculty will get an appraisal
              </span>
              <span className="text-xs text-muted">{matching.length - included.length} excluded by hand</span>
            </div>
            <ul className="scroll-thin max-h-56 overflow-y-auto">
              {matching.map((f) => {
                const out = excluded.includes(f.id);
                return (
                  <li key={f.id} className={clsx("flex items-center gap-3 border-b border-line-2 px-4 py-2 last:border-0", out && "opacity-50")}>
                    <Avatar name={f.name} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold">{f.name}</div>
                      <div className="truncate text-[11px] text-muted">
                        {SHORT_DESIG[f.designation]} · {f.dept}
                      </div>
                    </div>
                    <button onClick={() => toggle(excluded, setExcluded, f.id)} className={clsx("rounded-lg px-2 py-1 text-[11px] font-semibold", out ? "bg-brand-soft text-brand" : "text-danger hover:bg-danger-soft")}>
                      {out ? "Include" : "Exclude"}
                    </button>
                  </li>
                );
              })}
              {!matching.length && <li className="px-4 py-6 text-center text-sm text-muted">No faculty match these rules.</li>}
            </ul>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Summary label="Cycle" value={`AY ${basics.ay} · ${basics.name}`} />
          <Summary label="Review period" value={`${fmtDate(basics.from)} – ${fmtDate(basics.to)}`} />
          <Summary label="Framework" value={basics.framework} />
          <Summary label="Participants" value={`${included.length} faculty`} />
          <div className="sm:col-span-2 rounded-2xl border border-line p-4">
            <div className="mb-2 text-xs font-semibold text-ink-2">Stage windows</div>
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {stages.map((s) => (
                <li key={s.label} className="flex justify-between gap-3">
                  <span>{s.label}</span>
                  <span className="tnum text-muted">
                    {fmtDate(s.from)} – {fmtDate(s.to)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="sm:col-span-2 text-xs text-muted">The cycle is created as Scheduled. Activate it when you are ready; only one cycle accepts self-appraisals at a time.</p>
        </div>
      )}
    </Modal>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-line-2 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}
