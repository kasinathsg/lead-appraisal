"use client";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CornerUpLeft,
  FileText,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Stamp,
  TriangleAlert,
} from "lucide-react";
import { COMPONENTS, FW, MOA, evidenceRule, type Component, type FNode, type Val } from "@/lib/framework";
import { CURRENT_CYCLE, STATUS_META, type Faculty } from "@/lib/mock";
import { effectiveValue, nodeScore, LEVEL_LABEL, type Level } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { Avatar, BandPill, Bar, Button, Card, Chip, StatusPill, f1, fmtDateTime, pct } from "@/components/ui";
import { PctInput, Toggle, ValueInput } from "./inputs";

type RLevel = 1 | 2;

const ACTIONABLE: Record<RLevel, Faculty["status"][]> = {
  1: ["submitted", "returned_dd"],
  2: ["validated"],
};

export function AppraisalReview({ id, level }: { id: string; level: RLevel }) {
  const store = useStore();
  const f = store.get(id);
  const [tab, setTab] = useState<string>(COMPONENTS[0].id);
  const [done, setDone] = useState<null | { kind: "ok" | "back"; text: string }>(null);
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");

  const queue = level === 1 ? "/review" : "/director/approvals";

  if (!f) {
    return (
      <Card>
        <p className="text-sm text-muted">No appraisal found for this faculty member.</p>
        <Button href={queue} className="mt-4">
          <ArrowLeft size={16} /> Back to queue
        </Button>
      </Card>
    );
  }

  const s = store.scores(f);
  const editable = ACTIONABLE[level].includes(f.status) && !done;
  const levels: Level[] = level === 1 ? [0, 1] : [0, 1, 2];
  const comp = COMPONENTS.find((c) => c.id === tab)!;

  const act = (to: Faculty["status"], action: string, text: string, kind: "ok" | "back", n?: string) => {
    store.transition(f.id, to, action, n);
    setDone({ kind, text });
    setReturning(false);
    setNote("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href={queue} className="inline-flex items-center gap-1.5 font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} /> {level === 1 ? "Review queue" : "Approvals"}
        </Link>
        <span className="text-muted">/</span>
        <span className="font-semibold text-ink">{f.name}</span>
      </div>

      {done && (
        <div
          className={clsx(
            "rise flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4",
            done.kind === "ok" ? "border-ok/30 bg-ok-soft" : "border-warn/30 bg-warn-soft",
          )}
        >
          {done.kind === "ok" ? <CheckCircle2 className="text-ok" size={22} /> : <CornerUpLeft className="text-warn" size={22} />}
          <p className="flex-1 text-sm font-semibold text-ink">{done.text}</p>
          <Button href={queue} variant={done.kind === "ok" ? "ok" : "ghost"} size="sm">
            Back to {level === 1 ? "review queue" : "approvals"}
          </Button>
        </div>
      )}

      {/* header */}
      <Card className="overflow-hidden" pad={false}>
        <div className="flex flex-wrap items-center gap-4 p-5">
          <Avatar name={f.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-ink">{f.name}</h1>
              <StatusPill status={f.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {f.designation} · {f.dept} · {f.empId}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Chip tone="brand">{CURRENT_CYCLE}</Chip>
            <Chip>{f.qualification}</Chip>
            {f.mentorGroup !== "—" && <Chip>{f.mentorGroup}</Chip>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-3">
          {([0, 1, 2] as Level[]).map((l) => {
            const v = s.fpi[l];
            const mine = l === level;
            const pending = l > level;
            return (
              <div key={l} className={clsx("bg-white p-5", mine && "bg-brand-soft/50")}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {l === 0 ? "Faculty self" : l === 1 ? "Dy Director validated" : "Director final"}
                  </span>
                  {mine && <Chip tone="brand">You</Chip>}
                  {pending && <span className="text-[11px] text-muted">inherits until set</span>}
                </div>
                <div className="mt-2 flex items-end gap-3">
                  <span className="tnum text-[34px] font-extrabold leading-none tracking-tight text-ink">{f1(v)}</span>
                  {l > 0 && Math.abs(v - s.fpi[0]) >= 0.05 && (
                    <span className={clsx("tnum mb-1 text-xs font-bold", v < s.fpi[0] ? "text-danger" : "text-ok")}>
                      {v < s.fpi[0] ? "▼" : "▲"} {f1(Math.abs(v - s.fpi[0]))}
                    </span>
                  )}
                  <span className="mb-1 ml-auto">
                    <BandPill score={v} />
                  </span>
                </div>
                <div className="mt-3">
                  <Bar value={v} color={l === 0 ? "var(--violet)" : l === 1 ? "var(--brand)" : "var(--night)"} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {!editable && !done && (
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-sm">
          <ShieldCheck size={18} className="mt-0.5 text-muted" />
          <p className="text-ink-2">
            This appraisal is <b>{STATUS_META[f.status].label.toLowerCase()}</b>, so it is read-only for the {level === 1 ? "Deputy Director" : "Director"} right now.
            {level === 1 ? " You can act on appraisals that faculty have submitted or the Director has returned." : " You can act once the Deputy Director has validated it."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {level === 2 && <MoaCard f={f} editable={editable} />}

          {/* KRA tabs */}
          <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {COMPONENTS.map((c) => {
              const on = c.id === tab;
              const sc = s.components[c.id][level];
              return (
                <button
                  key={c.id}
                  onClick={() => setTab(c.id)}
                  className={clsx(
                    "flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition",
                    on ? "border-transparent bg-night text-white shadow-lg" : "border-line bg-white text-ink hover:border-ink/20",
                  )}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="leading-tight">
                    <span className={clsx("block text-[10.5px] font-semibold uppercase tracking-wider", on ? "text-white/60" : "text-muted")}>
                      {c.id === "MOA" ? "MOA" : `KRA ${c.no}`}
                    </span>
                    <span className="block text-[13px] font-semibold">{c.short}</span>
                  </span>
                  <span className={clsx("tnum ml-1 rounded-lg px-2 py-0.5 text-xs font-bold", on ? "bg-white/15" : "bg-line-2")}>{Math.round(sc)}</span>
                </button>
              );
            })}
          </div>

          <ComponentPanel c={comp} f={f} level={level} levels={levels} editable={editable} />
        </div>

        {/* side column */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-24 xl:self-start">
          <Card title={level === 1 ? "Your decision" : "Final decision"} subtitle={editable ? "Values you leave blank inherit the level below." : undefined}>
            {editable ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-line-2 p-3 text-xs text-ink-2">
                  {level === 1
                    ? "Validate the faculty's claims KPI by KPI. Lower a value only where the evidence does not support it."
                    : "Set the Management Overall Assessment, adjust any value if needed, then approve."}
                </div>
                {returning ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="ret-note" className="text-xs font-semibold text-ink">
                      Reason for returning (required)
                    </label>
                    <textarea
                      id="ret-note"
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={level === 1 ? "Tell the faculty member what to fix, e.g. attach proof for KPI 5.1." : "Tell the Deputy Director what to recheck."}
                      className="w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setReturning(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!note.trim()}
                        onClick={() =>
                          level === 1
                            ? act("returned_faculty", "Returned to faculty", `Returned to ${f.name} with your remark.`, "back", note.trim())
                            : act("returned_dd", "Returned to Dy Director", "Returned to the Deputy Director with your remark.", "back", note.trim())
                        }
                      >
                        <CornerUpLeft size={14} /> Send back
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {level === 1 ? (
                      <Button
                        variant="primary"
                        onClick={() =>
                          act("validated", "Validated and forwarded to Director", `Validated at FPI ${f1(s.fpi[1])} and forwarded to the Director.`, "ok")
                        }
                      >
                        <CheckCircle2 size={16} /> Validate &amp; forward
                      </Button>
                    ) : (
                      <Button variant="ok" onClick={() => act("approved", "Approved", `Approved. Final FPI ${f1(s.fpi[2])}, shared with ${f.name}.`, "ok")}>
                        <Stamp size={16} /> Approve
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => setReturning(true)}>
                      <CornerUpLeft size={16} /> {level === 1 ? "Return to faculty" : "Return to Dy Director"}
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
                  <span className="text-muted">{level === 1 ? "Validated FPI" : "Final FPI"}</span>
                  <span className="flex items-center gap-2">
                    <span className="tnum text-base font-extrabold">{f1(s.fpi[level])}</span>
                    <BandPill score={s.fpi[level]} short />
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No action needed from you on this appraisal.</p>
            )}
          </Card>

          <Card title="Workflow" subtitle={`${f.events.length} events`}>
            <ol className="relative flex flex-col gap-4 pl-5">
              <span className="absolute bottom-1 left-[5px] top-1 w-px bg-line" aria-hidden />
              {[...f.events].reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span
                    className={clsx("absolute -left-5 top-1 h-[11px] w-[11px] rounded-full border-2 border-white", i === 0 ? "bg-brand" : "bg-line")}
                    style={{ boxShadow: "0 0 0 1px var(--line)" }}
                  />
                  <div className="text-[13px] font-semibold text-ink">{e.action}</div>
                  <div className="text-[11px] text-muted">
                    {e.by} · {fmtDateTime(e.at)}
                  </div>
                  {e.note && <p className="mt-1.5 rounded-lg bg-line-2 px-2.5 py-1.5 text-xs text-ink-2">“{e.note}”</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- MOA ---------------- */
function MoaCard({ f, editable }: { f: Faculty; editable: boolean }) {
  const store = useStore();
  const n = MOA.kpis[0];
  const v = f.data.values[n.id] ?? [null, null, null];
  const eff = effectiveValue(n, f.data, 2);
  return (
    <Card
      title="Management Overall Assessment"
      subtitle="Your holistic rating of professionalism, values, teamwork and initiative."
      action={
        <div className="flex flex-wrap justify-end gap-1.5">
          <Chip tone="violet">Self: {v[0] ?? "—"}</Chip>
          <Chip tone="brand">Dy Dir: {v[1] ?? "—"}</Chip>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {FW.ratings.map((r, i) => {
          const on = eff === r.label;
          return (
            <button
              key={r.label}
              type="button"
              disabled={!editable}
              onClick={() => store.setValue(f.id, n.id, 2, r.label)}
              className={clsx(
                "flex min-w-0 flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition disabled:cursor-default",
                on ? "border-night bg-night text-white shadow-lg" : "border-line bg-white hover:border-ink/25",
              )}
            >
              <span className={clsx("tnum rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", on ? "bg-white/15 text-white" : "bg-line-2 text-muted")}>{r.score} pts</span>
              <span className="text-[12.5px] font-bold leading-tight [overflow-wrap:anywhere]">{r.label}</span>
              <span className={clsx("text-[11px] leading-snug", on ? "text-white/75" : "text-muted")}>{n.rubric?.[i]}</span>
            </button>
          );
        })}
      </div>
      {blank(v[2]) && <p className="mt-3 text-xs text-muted">Not set yet. The Deputy Director&apos;s recommendation is used until you choose.</p>}
    </Card>
  );
}

const blank = (v: Val | undefined) => v === null || v === undefined || v === "";

/* ---------------- KRA panel ---------------- */
function ComponentPanel({ c, f, level, levels, editable }: { c: Component; f: Faculty; level: RLevel; levels: Level[]; editable: boolean }) {
  const store = useStore();
  const s = store.scores(f);
  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-wrap items-center gap-4 p-5" style={{ borderTop: `4px solid ${c.color}` }}>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: c.color }}>
            {c.id === "MOA" ? "Management" : `KRA ${c.no}`}
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">{c.name}</h2>
          <p className="mt-0.5 text-xs text-muted">{c.focus}</p>
        </div>
        <div className="flex gap-5">
          {levels.map((l) => (
            <div key={l} className="text-right">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">{LEVEL_LABEL[l]}</div>
              <div className={clsx("tnum text-2xl font-extrabold", l === level ? "text-ink" : "text-muted")}>{f1(s.components[c.id][l])}</div>
            </div>
          ))}
        </div>
      </div>
      {c.kpis.map((k) => (
        <KpiCard key={k.id} k={k} c={c} f={f} level={level} levels={levels} editable={editable} />
      ))}
    </div>
  );
}

function KpiCard({ k, c, f, level, levels, editable }: { k: FNode; c: Component; f: Faculty; level: RLevel; levels: Level[]; editable: boolean }) {
  const store = useStore();
  const [showNote, setShowNote] = useState(!!f.remarks[k.id]);
  const applicable = f.data.applicable[k.id] !== false;
  const scores = levels.map((l) => nodeScore(k, f.data, l));
  const delta = scores[scores.length - 1] - scores[0];
  const rows = k.children.length ? flatten(k) : [{ n: k, depth: 0 }];
  const cols = level === 1 ? "minmax(220px,1fr) 120px 170px 110px" : "minmax(220px,1fr) 110px 130px 160px 110px";
  const isMoa = c.id === "MOA";

  return (
    <div className={clsx("card overflow-hidden", !applicable && "opacity-60")}>
      <div className="flex flex-wrap items-start gap-3 p-5 pb-4">
        <span className="tnum mt-0.5 rounded-lg px-2 py-1 text-[11px] font-bold text-white" style={{ background: c.color }}>
          {k.id}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-bold leading-snug text-ink">{k.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {k.target && <Chip>Target: {k.target}</Chip>}
            <Chip tone="muted">Weight {k.weight}%</Chip>
            {evidenceRule(k) === "none" ? (
              !isMoa && <Chip tone="ok">Auto-verified</Chip>
            ) : (f.evidence?.[k.id]?.length ?? 0) > 0 ? (
              <span title={f.evidence[k.id].join(", ")}>
                <Chip tone="brand">
                  <Paperclip size={11} /> {f.evidence[k.id].length} {f.evidence[k.id].length === 1 ? "file" : "files"}
                </Chip>
              </span>
            ) : (
              <Chip tone={evidenceRule(k) === "required" ? "warn" : "muted"}>{evidenceRule(k) === "required" ? "No evidence" : "No files (optional)"}</Chip>
            )}
          </div>
        </div>
        <div className="flex items-start gap-4">
          {levels.map((l, i) => (
            <div key={l} className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{LEVEL_LABEL[l]}</div>
              <div className={clsx("tnum text-xl font-extrabold leading-tight", l === level ? "text-ink" : "text-muted")}>{Math.round(scores[i])}</div>
            </div>
          ))}
          {delta <= -0.5 && (
            <span className="tnum mt-3 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">−{f1(-delta)}</span>
          )}
        </div>
      </div>

      <div className="scroll-thin overflow-x-auto border-t border-line-2">
        <div className="min-w-[640px]">
          <div className="grid items-center gap-3 bg-line-2/60 px-5 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted" style={{ gridTemplateColumns: cols }}>
            <span>Measure</span>
            <span>Faculty self</span>
            <span className={clsx(level === 1 && "text-brand")}>Dy Director</span>
            {level === 2 && <span className="text-brand">Director</span>}
            <span className="text-right">Score</span>
          </div>
          {rows.map(({ n, depth }) => (
            <MeasureRow key={n.id} n={n} depth={depth} f={f} level={level} levels={levels} editable={editable && applicable} cols={cols} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line-2 px-5 py-3">
        {!isMoa && <Toggle on={applicable} label={`Applicable: ${k.name}`} onChange={(v) => editable && store.setApplicable(f.id, k.id, v)} />}
        <span className="hidden text-[11px] text-muted md:inline">
          <FileText size={11} className="mr-1 inline" />
          {k.evidence}
        </span>
        <button
          type="button"
          onClick={() => setShowNote((x) => !x)}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          <MessageSquare size={13} /> {f.remarks[k.id] ? "Comment" : "Add comment"}
        </button>
      </div>
      {showNote && (
        <div className="px-5 pb-4">
          <textarea
            rows={2}
            aria-label={`Comment on ${k.id}`}
            value={f.remarks[k.id] ?? ""}
            onChange={(e) => store.setRemark(f.id, k.id, e.target.value)}
            readOnly={!editable}
            placeholder="Comment visible to the faculty member and the next reviewer"
            className="w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
      )}
    </div>
  );
}

function flatten(k: FNode) {
  const out: { n: FNode; depth: number }[] = [];
  const go = (n: FNode, d: number) => {
    for (const c of n.children) {
      out.push({ n: c, depth: d });
      go(c, d + 1);
    }
  };
  go(k, 0);
  return out;
}

function MeasureRow({ n, depth, f, level, levels, editable, cols }: { n: FNode; depth: number; f: Faculty; level: RLevel; levels: Level[]; editable: boolean; cols: string }) {
  const store = useStore();
  const leaf = n.children.length === 0;
  const v = f.data.values[n.id] ?? [null, null, null];
  const subApplicable = f.data.applicable[n.id] !== false;
  const isComp = n.level === "COMP";
  const sc = levels.map((l) => nodeScore(n, f.data, l));
  const effMine = leaf ? effectiveValue(n, f.data, level) : null;
  const ri = typeof effMine === "string" ? FW.ratings.findIndex((r) => r.label === effMine) : -1;

  const cell = (l: Level) => {
    if (!leaf) return <span className="text-[11px] italic text-muted">sum of items below</span>;
    if (n.course_feed && l < 2)
      return <span className="tnum text-[13px] font-semibold text-ink">{pct(effectiveValue(n, f.data, l) as number | null, 1)}</span>;
    if (l === 0) return <ValueInput n={n} value={v[0] ?? null} inherited={null} editable={false} onChange={() => {}} />;
    return (
      <ValueInput
        n={n}
        value={v[l] ?? null}
        inherited={effectiveValue(n, f.data, (l - 1) as Level)}
        editable={editable && l === level}
        onChange={(x) => store.setValue(f.id, n.id, l, x)}
      />
    );
  };

  return (
    <div className={clsx("border-t border-line-2", !subApplicable && "opacity-50")}>
      <div className="grid items-center gap-3 px-5 py-3" style={{ gridTemplateColumns: cols }}>
        <div className="min-w-0" style={{ paddingLeft: depth * 16 }}>
          <div className="flex items-start gap-2">
            <span className={clsx("tnum shrink-0 pt-px text-[11px] font-bold", isComp ? "text-muted" : "text-ink-2")}>{n.id}</span>
            <span className={clsx("text-[13px] leading-snug", isComp ? "text-ink-2" : "font-semibold text-ink")}>{n.name}</span>
          </div>
          {n.level === "SUB" && (
            <div className="mt-1 flex items-center gap-2 pl-8">
              {n.target && <span className="text-[11px] text-muted">Target {n.target}</span>}
              {editable && (
                <button
                  type="button"
                  className="text-[11px] font-semibold text-brand hover:underline"
                  onClick={() => store.setApplicable(f.id, n.id, !subApplicable)}
                >
                  {subApplicable ? "Mark N/A" : "Mark applicable"}
                </button>
              )}
            </div>
          )}
          {isComp && n.factor != null && !n.lookup && (
            <div className="mt-0.5 pl-8 text-[11px] text-muted">
              {n.input === "yesno" ? `${n.factor} pts if yes` : `${n.factor} pts each`}
              {n.cap != null && ` · max ${n.cap}`}
            </div>
          )}
          {isComp && n.lookup && <div className="mt-0.5 pl-8 text-[11px] text-muted">Points from the legacy table</div>}
        </div>
        {levels.map((l) => (
          <div key={l} className="min-w-0">
            {cell(l)}
          </div>
        ))}
        <div className="text-right">
          <span className="tnum text-[13px] font-bold text-ink">
            {isComp ? `${f1(sc[sc.length - 1])} pts` : Math.round(sc[sc.length - 1])}
          </span>
          {Math.abs(sc[sc.length - 1] - sc[0]) >= 0.5 && (
            <div className="tnum text-[10.5px] text-muted">
              self {isComp ? f1(sc[0]) : Math.round(sc[0])}
            </div>
          )}
        </div>
      </div>
      {leaf && n.input === "rating" && ri >= 0 && n.rubric?.[ri] && (
        <p className="mx-5 -mt-1 mb-3 rounded-lg bg-line-2 px-3 py-1.5 text-[11.5px] text-ink-2">
          <b>{effMine}:</b> {n.rubric[ri]}
        </p>
      )}
      {n.course_feed && <CourseTable n={n} f={f} level={level} editable={editable} />}
    </div>
  );
}

function CourseTable({ n, f, level, editable }: { n: FNode; f: Faculty; level: RLevel; editable: boolean }) {
  const store = useStore();
  const key = n.course_feed === "TEI" ? "tei" : "pass";
  const v = f.data.values[n.id] ?? [null, null, null];
  return (
    <div className="mx-5 mb-4 overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between bg-line-2/60 px-3 py-2 text-[11px] font-semibold text-muted">
        <span>Course register · {n.course_feed === "TEI" ? "student feedback (TEI)" : "pass %"}</span>
        <span>Average feeds this KPI</span>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted">
            <th className="px-3 py-2 font-semibold">Course</th>
            <th className="px-3 py-2 font-semibold">Self</th>
            <th className="px-3 py-2 font-semibold">Dy Director</th>
          </tr>
        </thead>
        <tbody>
          {f.data.courses.map((c, i) => {
            const self = c[`${key}F` as const];
            const dd = c[`${key}DD` as const];
            return (
              <tr key={i} className="border-t border-line-2">
                <td className="px-3 py-2">
                  <div className="font-semibold text-ink">{c.course}</div>
                  <div className="text-[11px] text-muted">
                    {c.batch} · {c.semester}
                  </div>
                </td>
                <td className="tnum px-3 py-2 font-semibold">{pct(self, 0)}</td>
                <td className="w-36 px-3 py-2">
                  {level === 1 && editable ? (
                    <PctInput value={dd} inherited={self} onChange={(x) => store.setCourse(f.id, i, { [`${key}DD`]: x })} />
                  ) : (
                    <span className={clsx("tnum font-semibold", dd == null && "text-muted")}>{pct(dd ?? self, 0)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {level === 2 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line-2 px-3 py-2.5">
          <span className="text-xs font-semibold text-ink">Director override of the average</span>
          <div className="w-32">
            <PctInput
              value={typeof v[2] === "number" ? v[2] : null}
              inherited={effectiveValue(n, f.data, 1) as number | null}
              onChange={(x) => editable && store.setValue(f.id, n.id, 2, x)}
            />
          </div>
          <span className="text-[11px] text-muted">Leave blank to accept the Dy Director&apos;s average.</span>
        </div>
      )}
      {f.data.courses.length === 0 && (
        <p className="flex items-center gap-2 px-3 py-3 text-xs text-muted">
          <TriangleAlert size={13} /> No courses registered for this cycle.
        </p>
      )}
    </div>
  );
}

