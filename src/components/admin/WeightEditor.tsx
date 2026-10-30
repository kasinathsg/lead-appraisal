"use client";
/**
 * Framework Studio · weight editing.
 * Admin / IQAC edits a draft; every total must be 100%; the impact preview shows what the change would do;
 * publishing creates a new version that applies from the next cycle (the running cycle stays pinned).
 */
import clsx from "clsx";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, GitBranch, History, Pencil, RotateCcw, ShieldCheck, Upload, XCircle } from "lucide-react";
import { COMPONENTS, FW, SHORT_DESIG, desigIndex, type Component, type FNode, type Weights } from "@/lib/framework";
import { perfBand, summarize, BAND_COLOR, type Level } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import type { Status } from "@/lib/mock";
import { Avatar, Button, Card, Chip, f1, fmtDateTime } from "@/components/ui";
import { Check, inputCls, useToast } from "./overlay";

const NEXT_CYCLE = "AY 2026-27 · Cycle 2";
const RUNNING_CYCLE = "AY 2026-27 · Cycle 1";

const levelOf = (s: Status): Level | null =>
  s === "approved" || s === "acknowledged" ? 2 : s === "validated" || s === "returned_dd" ? 1 : s === "submitted" || s === "returned_faculty" ? 0 : null;

/** every rule a publishable version must satisfy */
export function validate(w: Weights) {
  const issues: string[] = [];
  FW.designations.forEach((d, i) => {
    const t = COMPONENTS.reduce((a, c) => a + (w.desig[c.id]?.[i] ?? 0), 0);
    if (t !== 100) issues.push(`${d}: component weights total ${t}%`);
  });
  for (const c of COMPONENTS) {
    const t = c.kpis.reduce((a, k) => a + (w.kpi[k.id] ?? 0), 0);
    if (t !== 100) issues.push(`${c.id === "MOA" ? "MOA" : `KRA ${c.no}`}: KPI weights total ${t}%`);
    for (const k of c.kpis)
      if (k.method === "wavg") {
        const s = k.children.reduce((a, x) => a + (w.kpi[x.id] ?? 0), 0);
        if (s !== 100) issues.push(`KPI ${k.id}: sub-KPI weights total ${s}%`);
      }
  }
  return issues;
}

function WeightInput({ value, base, onChange, disabled, color }: { value: number; base: number; onChange: (v: number) => void; disabled: boolean; color?: string }) {
  const changed = value !== base;
  if (disabled)
    return (
      <span className={clsx("tnum inline-block min-w-12 rounded-lg px-2 py-0.5 text-right font-bold", value === 0 && "text-muted")} style={value && color ? { background: color + "1a", color } : undefined}>
        {value}%
      </span>
    );
  return (
    <span className="inline-flex flex-col items-end">
      <span className={clsx("flex h-9 w-[76px] items-center rounded-lg border bg-white pr-2 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15", changed ? "border-violet bg-violet-soft/50" : "border-line")}>
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))))}
          className="tnum w-full min-w-0 bg-transparent pl-2 text-right text-[13px] font-bold text-ink outline-none"
        />
        <span className="text-[11px] font-semibold text-muted">%</span>
      </span>
      {changed && <span className="tnum mt-0.5 text-[10px] font-semibold text-violet">was {base}%</span>}
    </span>
  );
}

/** +1.2 / −0.4 / 0.0 (never "+0.0") */
const signed = (x: number) => (Math.abs(x) < 0.05 ? "0.0" : (x > 0 ? "+" : "−") + f1(Math.abs(x)));

const Total = ({ t }: { t: number }) => (
  <span className={clsx("tnum inline-flex items-center gap-1 font-extrabold", t === 100 ? "text-ok" : "text-danger")}>
    {t === 100 ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
    {t}%
  </span>
);

export function WeightEditor() {
  const { role, framework, faculty, startDraft, setDraft, discardDraft, publishDraft } = useStore();
  const { toast, node: toastNode } = useToast();
  const live = framework.versions[framework.versions.length - 1];
  const draft = framework.draft;
  const canEdit = role === "admin";
  const editing = canEdit && !!draft;
  const w = draft ?? live.weights;
  const issues = useMemo(() => validate(w), [w]);
  const [kraSel, setKraSel] = useState(COMPONENTS[0].id);
  const [publishing, setPublishing] = useState(false);
  const [note, setNote] = useState("");
  const [approved, setApproved] = useState(false);
  const nextVersion = (() => {
    const [a, b] = live.version.split(".").map(Number);
    return `${a}.${b + 1}`;
  })();

  const setDesig = (cid: string, i: number, v: number) => draft && setDraft({ ...draft, desig: { ...draft.desig, [cid]: draft.desig[cid].map((x, j) => (j === i ? v : x)) } });
  const setKpi = (id: string, v: number) => draft && setDraft({ ...draft, kpi: { ...draft.kpi, [id]: v } });

  return (
    <div className="flex flex-col gap-5">
      {toastNode}
      {/* version bar */}
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ok-soft text-ok">
            <ShieldCheck size={19} />
          </span>
          <div className="leading-tight">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Live version</div>
            <div className="text-[15px] font-extrabold">
              v{live.version} <span className="font-medium text-muted">· from {live.appliesFrom}</span>
            </div>
          </div>
        </div>
        {draft && (
          <div className="flex items-center gap-3">
            <ArrowRight size={16} className="text-muted" />
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-soft text-violet">
              <GitBranch size={19} />
            </span>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Draft · not live</div>
              <div className="text-[15px] font-extrabold">
                v{nextVersion}{" "}
                <span className={clsx("text-xs font-semibold", issues.length ? "text-danger" : "text-ok")}>{issues.length ? `${issues.length} totals to fix` : "ready to publish"}</span>
              </div>
            </div>
          </div>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {!canEdit && <Chip tone="muted">View only · Admin / IQAC can edit</Chip>}
          {canEdit && !draft && (
            <Button variant="primary" onClick={startDraft}>
              <Pencil size={15} /> Edit weights
            </Button>
          )}
          {editing && (
            <>
              <Button variant="ghost" onClick={() => { discardDraft(); setPublishing(false); toast("Draft discarded. The live version is unchanged."); }}>
                <RotateCcw size={15} /> Discard draft
              </Button>
              <Button variant="primary" disabled={issues.length > 0} onClick={() => setPublishing(true)}>
                <Upload size={15} /> Publish v{nextVersion}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && publishing && (
        <Card className="border-violet/40 ring-4 ring-violet/10" title={`Publish framework v${nextVersion}`} subtitle="Publishing makes these weights the official framework for future cycles.">
          <div className="grid gap-4 md:grid-cols-2">
            <ul className="flex flex-col gap-2 text-[13px] text-ink-2">
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> Applies from <b className="text-ink">{NEXT_CYCLE}</b> onwards.</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> <span><b className="text-ink">{RUNNING_CYCLE}</b> stays on v{live.version}, so scores already entered or approved do not change.</span></li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> v{live.version} is kept in the version history for audit.</li>
            </ul>
            <div className="flex flex-col gap-3">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Reason for the change (shown in the version history)" className={clsx(inputCls, "h-auto py-2")} />
              <Check checked={approved} onChange={setApproved}>The Director has approved these weights</Check>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPublishing(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!approved || !note.trim()}
                  onClick={() => {
                    publishDraft(note.trim(), NEXT_CYCLE);
                    setPublishing(false);
                    setNote("");
                    setApproved(false);
                    toast(`Framework v${nextVersion} published. It applies from ${NEXT_CYCLE}.`);
                  }}
                >
                  Publish now
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Weight by designation" subtitle="Share of the Faculty Performance Index each component carries. Every column must total 100%.">
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 text-left">Component</th>
                    {FW.designations.map((d) => (
                      <th key={d} className="px-2 py-2 text-right">{SHORT_DESIG[d]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPONENTS.map((c) => (
                    <tr key={c.id} className="border-t border-line-2">
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                          <span className="font-semibold">{c.id === "MOA" ? "MOA" : `KRA ${c.no}`}</span>
                          <span className="truncate text-muted">{c.short}</span>
                        </span>
                      </td>
                      {FW.designations.map((_, i) => (
                        <td key={i} className="px-2 py-2 text-right">
                          <WeightInput value={w.desig[c.id][i]} base={live.weights.desig[c.id][i]} onChange={(v) => setDesig(c.id, i, v)} disabled={!editing} color={c.color} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-line">
                    <td className="py-3 pr-3 font-bold">Total</td>
                    {FW.designations.map((_, i) => (
                      <td key={i} className="px-2 py-3 text-right">
                        <Total t={COMPONENTS.reduce((a, c) => a + w.desig[c.id][i], 0)} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <KpiWeights w={w} base={live.weights} editing={editing} sel={kraSel} setSel={setKraSel} setKpi={setKpi} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {draft ? <Impact draft={draft} faculty={faculty} /> : <Rationale />}
          <Card title="Version history" action={<History size={17} className="text-muted" />}>
            <ol className="flex flex-col gap-3">
              {[...framework.versions].reverse().map((v, i) => (
                <li key={v.version} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-extrabold">v{v.version}</span>
                    <Chip tone={i === 0 ? "ok" : "muted"} dot>{i === 0 ? "Live" : "Superseded"}</Chip>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-2">{v.note}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {v.by} · {fmtDateTime(v.publishedAt)} · applies from {v.appliesFrom}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiWeights({ w, base, editing, sel, setSel, setKpi }: { w: Weights; base: Weights; editing: boolean; sel: string; setSel: (s: string) => void; setKpi: (id: string, v: number) => void }) {
  const c = COMPONENTS.find((x) => x.id === sel)!;
  const total = c.kpis.reduce((a, k) => a + w.kpi[k.id], 0);
  return (
    <Card title="KPI weights inside each KRA" subtitle="How a KRA's score is built from its KPIs. Each KRA, and each group of sub-KPIs, must total 100%.">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {COMPONENTS.map((x) => {
          const t = x.kpis.reduce((a, k) => a + w.kpi[k.id], 0);
          const bad = t !== 100 || x.kpis.some((k) => k.method === "wavg" && k.children.reduce((a, s) => a + w.kpi[s.id], 0) !== 100);
          return (
            <button
              key={x.id}
              onClick={() => setSel(x.id)}
              className={clsx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition", sel === x.id ? "border-transparent bg-night text-white" : "border-line bg-white text-ink-2 hover:bg-line-2")}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: x.color }} />
              {x.id === "MOA" ? "MOA" : `KRA ${x.no}`}
              {bad && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
            </button>
          );
        })}
      </div>
      <ul className="divide-y divide-line-2">
        {c.kpis.map((k) => (
          <KpiRow key={k.id} k={k} c={c} w={w} base={base} editing={editing} setKpi={setKpi} />
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t-2 border-line pt-3 text-[13px]">
        <span className="font-bold">{c.name}</span>
        <Total t={total} />
      </div>
    </Card>
  );
}

function KpiRow({ k, c, w, base, editing, setKpi }: { k: FNode; c: Component; w: Weights; base: Weights; editing: boolean; setKpi: (id: string, v: number) => void }) {
  const subs = k.method === "wavg" ? k.children : [];
  const subTotal = subs.reduce((a, s) => a + w.kpi[s.id], 0);
  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <span className="tnum rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: c.color }}>{k.id}</span>
        <span className="min-w-0 flex-1 text-[13px] font-semibold">{k.name}</span>
        <WeightInput value={w.kpi[k.id]} base={base.kpi[k.id]} onChange={(v) => setKpi(k.id, v)} disabled={!editing} color={c.color} />
      </div>
      {subs.length > 0 && (
        <div className="ml-10 mt-2 rounded-xl bg-line-2/60 p-2">
          {subs.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-2 py-1.5">
              <span className="tnum text-[11px] font-bold text-muted">{s.id}</span>
              <span className="min-w-0 flex-1 text-[12.5px] text-ink-2">{s.name}</span>
              <WeightInput value={w.kpi[s.id]} base={base.kpi[s.id]} onChange={(v) => setKpi(s.id, v)} disabled={!editing} color={c.color} />
            </div>
          ))}
          <div className="flex justify-end px-2 pt-1 text-[12px]">
            <span className="mr-2 text-muted">Sub-KPIs total</span>
            <Total t={subTotal} />
          </div>
        </div>
      )}
    </li>
  );
}

function Impact({ draft, faculty }: { draft: Weights; faculty: ReturnType<typeof useStore>["faculty"] }) {
  const { scores } = useStore();
  const rows = faculty
    .map((f) => {
      const lv = levelOf(f.status);
      if (lv == null) return null;
      const now = scores(f).fpi[lv];
      const next = summarize(f.data, f.designation, draft).fpi[lv];
      return { f, now, next, d: next - now };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const bandMoves = rows.filter((r) => perfBand(r.now).code !== perfBand(r.next).code);
  const movers = [...rows].sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5);
  const byDesig = FW.designations.map((d) => ({ d, xs: rows.filter((r) => desigIndex(r.f.designation) === desigIndex(d)) })).filter((x) => x.xs.length);
  return (
    <Card title="Impact preview" subtitle={`If this draft were applied to the ${rows.length} scored appraisals in ${RUNNING_CYCLE}`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-violet-soft p-3">
          <div className="text-[11px] font-semibold text-violet">Average FPI change</div>
          <div className="tnum text-2xl font-extrabold text-ink">{signed(avg(rows.map((r) => r.d)))}</div>
        </div>
        <div className="rounded-2xl bg-sun-soft p-3">
          <div className="text-[11px] font-semibold text-[#8a6a00]">Change band</div>
          <div className="tnum text-2xl font-extrabold text-ink">
            {bandMoves.length}
            <span className="text-sm font-semibold text-muted"> faculty</span>
          </div>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-1.5">
        {byDesig.map(({ d, xs }) => {
          const delta = avg(xs.map((r) => r.d));
          return (
            <li key={d} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-2">{d} <span className="text-muted">({xs.length})</span></span>
              <span className={clsx("tnum font-bold", delta > 0.05 ? "text-ok" : delta < -0.05 ? "text-danger" : "text-muted")}>
                {signed(delta)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Biggest movers</div>
      <ul className="mt-2 flex flex-col gap-2">
        {movers.map((r) => (
          <li key={r.f.id} className="flex items-center gap-2.5">
            <Avatar name={r.f.name} size={28} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{r.f.name}</span>
            <span className="tnum text-[12px] text-muted">{f1(r.now)}</span>
            <ArrowRight size={12} className="text-muted" />
            <span className="tnum text-[12px] font-bold" style={{ color: BAND_COLOR[perfBand(r.next).code] }}>{f1(r.next)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-muted">Preview only. Scores in {RUNNING_CYCLE} are not changed by publishing.</p>
    </Card>
  );
}

function Rationale() {
  return (
    <Card title="Why these weights">
      <ul className="flex flex-col gap-3 text-[13px] text-ink-2">
        {FW.weightRationale.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="tnum mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">{i + 1}</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
