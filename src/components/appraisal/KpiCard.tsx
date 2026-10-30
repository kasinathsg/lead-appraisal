"use client";
import clsx from "clsx";
import { BadgeCheck, FileText, Info, Paperclip, Target, UploadCloud, X } from "lucide-react";
import { evidenceRule, type FNode, type Val } from "@/lib/framework";
import { effectiveValue, nodeScore } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import type { Faculty } from "@/lib/mock";
import { Bar, f1, pct } from "@/components/ui";
import { BandLadder, NumberField, RubricPicker, Stepper, YesNo } from "./inputs";

const METHOD_LABEL: Record<string, string> = {
  band: "Band",
  rating: "Rubric",
  points: "Points",
  points_lookup: "Scoring key",
  wavg: "Weighted",
};

function ScoreBadge({ v, color }: { v: number; color: string }) {
  return (
    <div className="flex shrink-0 flex-col items-end">
      <span className="tnum text-[22px] font-extrabold leading-none" style={{ color }}>
        {Math.round(v)}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">score</span>
    </div>
  );
}

export function KpiCard({ n, f, color, editable }: { n: FNode; f: Faculty; color: string; editable: boolean }) {
  const { setApplicable } = useStore();
  const on = f.data.applicable[n.id] !== false;
  const score = nodeScore(n, f.data, 0);
  return (
    <article id={n.id} className={clsx("card scroll-mt-[calc(var(--stick,180px)+16px)] overflow-hidden transition", !on && "opacity-60")}>
      <header className="flex items-start gap-4 p-5 pb-4">
        <span className="tnum grid h-10 min-w-10 shrink-0 place-items-center rounded-xl px-2 text-[12px] font-extrabold text-white" style={{ background: color }}>
          {n.id}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-ink">{n.name}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{n.definition}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 rounded-lg bg-line-2 px-2 py-1 text-ink-2">
              <Target size={12} /> {n.target}
            </span>
            <span className="rounded-lg bg-line-2 px-2 py-1 text-ink-2">{METHOD_LABEL[n.method ?? "band"]}</span>
            <span className="rounded-lg bg-line-2 px-2 py-1 text-ink-2">Weight {n.weight}%</span>
            {n.frequency && <span className="rounded-lg bg-line-2 px-2 py-1 text-ink-2">{n.frequency}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScoreBadge v={on ? score : 0} color={color} />
        </div>
      </header>
      <div className="border-t border-line-2 bg-[#fafbfd] px-5 py-4">
        {on ? <Body n={n} f={f} color={color} editable={editable} /> : <p className="text-sm text-muted">Marked not applicable. Its weight is shared across the other KPIs in this KRA.</p>}
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-line-2 px-5 py-3">
        <Evidence n={n} f={f} editable={editable && on} />
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-muted">
          <span>Applicable</span>
          <button
            type="button"
            disabled={!editable}
            onClick={() => setApplicable(f.id, n.id, !on)}
            className={clsx("relative h-5 w-9 rounded-full transition", on ? "bg-brand" : "bg-line")}
            aria-pressed={on}
          >
            <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
          </button>
        </label>
      </footer>
    </article>
  );
}

function Body({ n, f, color, editable }: { n: FNode; f: Faculty; color: string; editable: boolean }) {
  const { setValue } = useStore();
  const set = (id: string) => (v: Val) => setValue(f.id, id, 0, v);
  const val = (id: string) => f.data.values[id]?.[0] ?? null;

  if (n.course_feed) return <CourseFeed n={n} f={f} editable={editable} />;

  if (!n.children.length) {
    if (n.input === "rating") return <RubricPicker n={n} value={val(n.id)} onChange={set(n.id)} disabled={!editable} />;
    return (
      <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-center">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted">{n.measure}</div>
          <NumberField n={n} value={val(n.id)} onChange={set(n.id)} disabled={!editable} />
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-muted">How it scores</div>
          <BandLadder n={n} value={val(n.id)} />
        </div>
      </div>
    );
  }

  if (n.method === "wavg") {
    return (
      <div className="grid gap-3">
        {n.children.map((c) => (
          <SubBlock key={c.id} n={c} f={f} color={color} editable={editable} />
        ))}
      </div>
    );
  }
  return <PointsBlock n={n} f={f} color={color} editable={editable} />;
}

function SubBlock({ n, f, color, editable }: { n: FNode; f: Faculty; color: string; editable: boolean }) {
  const { setApplicable } = useStore();
  const on = f.data.applicable[n.id] !== false;
  const s = nodeScore(n, f.data, 0);
  return (
    <div id={n.id} className={clsx("scroll-mt-[calc(var(--stick,180px)+16px)] rounded-2xl border border-line bg-white p-4", !on && "opacity-60")}>
      <div className="mb-3 flex items-start gap-3">
        <span className="tnum mt-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold" style={{ background: color + "1f", color }}>
          {n.id}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold text-ink">{n.name}</div>
          <div className="text-[11.5px] text-muted">
            Target {n.target} · weight {n.weight}% of parent
          </div>
        </div>
        <button type="button" disabled={!editable} onClick={() => setApplicable(f.id, n.id, !on)} className="text-[11px] font-semibold text-muted hover:text-ink">
          {on ? "Mark N/A" : "Mark applicable"}
        </button>
        <span className="tnum text-lg font-extrabold" style={{ color }}>
          {on ? Math.round(s) : "–"}
        </span>
      </div>
      {on && <Body n={n} f={f} color={color} editable={editable} />}
    </div>
  );
}

function PointsBlock({ n, f, color, editable }: { n: FNode; f: Faculty; color: string; editable: boolean }) {
  const { setValue } = useStore();
  const pts = n.children.map((c) => nodeScore(c, f.data, 0));
  const total = pts.reduce((a, b) => a + b, 0);
  const isKey = n.method === "points_lookup";
  const goal = isKey ? 6 : n.p100 ?? 100;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-3 ring-1 ring-line">
        <div className="tnum text-[22px] font-extrabold text-ink">
          {f1(total)}
          <span className="text-sm font-semibold text-muted"> / {goal} pts</span>
        </div>
        <div className="min-w-[140px] flex-1">
          <Bar value={(total / goal) * 100} color={color} h={10} />
        </div>
        <span className="text-[11px] font-medium text-muted">{isKey ? "2 assignments rated EE (6 pts) = full score" : `${goal} points = full score of 100`}</span>
      </div>
      <ul className="divide-y divide-line-2">
        {n.children.map((c, i) => {
          const v = f.data.values[c.id]?.[0] ?? null;
          return (
            <li key={c.id} className="grid items-center gap-3 py-2.5 sm:grid-cols-[1fr_auto_88px]">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink">{c.name}</div>
                <div className="text-[11px] text-muted">
                  {c.lookup ? "Converted with the legacy table" : c.input === "yesno" ? `${c.factor} pts if Yes` : `${c.factor} pts each`}
                  {c.cap != null && ` · max ${c.cap}`}
                  {c.max_count != null && ` · up to ${c.max_count}`}
                </div>
              </div>
              <div>
                {c.input === "yesno" ? (
                  <YesNo value={v} onChange={(x) => setValue(f.id, c.id, 0, x)} disabled={!editable} />
                ) : c.input === "count" ? (
                  <Stepper value={v} onChange={(x) => setValue(f.id, c.id, 0, x)} disabled={!editable} max={c.max_count} />
                ) : (
                  <div className="w-40">
                    <NumberField n={c} value={v} onChange={(x) => setValue(f.id, c.id, 0, x)} disabled={!editable} />
                  </div>
                )}
              </div>
              <div className={clsx("tnum text-right text-sm font-bold", pts[i] ? "text-ink" : "text-muted")}>+{f1(pts[i])}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CourseFeed({ n, f, editable }: { n: FNode; f: Faculty; editable: boolean }) {
  const { setCourse } = useStore();
  const key = n.course_feed === "TEI" ? "teiF" : "passF";
  const v = effectiveValue(n, f.data, 0);
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Info size={14} /> Filled from your course register ({n.course_feed === "TEI" ? "student feedback system" : "exam cell"}). Average {pct(typeof v === "number" ? v : null)}.
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-line">
        <table className="w-full min-w-[460px] bg-white text-[13px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">Semester</th>
              <th className="px-3 py-2 text-right">{n.course_feed === "TEI" ? "TEI" : "Pass"} %</th>
            </tr>
          </thead>
          <tbody>
            {f.data.courses.map((c, i) => (
              <tr key={i} className="border-t border-line-2">
                <td className="px-3 py-2 font-semibold text-ink">{c.course}</td>
                <td className="px-3 py-2 text-ink-2">{c.batch}</td>
                <td className="px-3 py-2 text-ink-2">{c.semester}</td>
                <td className="px-3 py-1.5">
                  <div className="ml-auto w-28">
                    <NumberField n={{ ...n, input: "pct" }} value={c[key]} onChange={(x) => setCourse(f.id, i, { [key]: typeof x === "number" ? x : null })} disabled={!editable} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BandLadder n={n} value={v} />
    </div>
  );
}

function Evidence({ n, f, editable }: { n: FNode; f: Faculty; editable: boolean }) {
  const { setEvidence } = useStore();
  const rule = evidenceRule(n);
  const files = f.evidence?.[n.id] ?? [];
  if (rule === "none")
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-muted">
        <BadgeCheck size={14} className="text-ok" />
        {n.id === "8.1" || n.capture === "Director" ? "Management judgement, no upload needed" : `Verified from ${n.capture?.replace(/\s*\(auto\)/, "") ?? "source system"}, no upload needed`}
      </span>
    );
  const missing = rule === "required" && files.length === 0;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span
        className={clsx(
          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          rule === "optional" ? "bg-line-2 text-muted" : missing ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok",
        )}
      >
        {rule === "optional" ? "Optional" : missing ? "Evidence required" : "Required"}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted" title={n.evidence}>
        <FileText size={14} className="shrink-0" />
        <span className="max-w-[320px] truncate">{n.evidence}</span>
      </span>
      {files.map((x) => (
        <span key={x} className="inline-flex max-w-[220px] items-center gap-1 rounded-lg bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">
          <Paperclip size={11} className="shrink-0" /> <span className="truncate">{x}</span>
          {editable && (
            <button type="button" onClick={() => setEvidence(f.id, n.id, files.filter((y) => y !== x))} aria-label={`Remove ${x}`}>
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      {editable && (
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-brand/40 px-2.5 py-1 text-[11.5px] font-semibold text-brand hover:bg-brand-soft">
          <UploadCloud size={13} /> Attach
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const names = Array.from(e.target.files ?? []).map((x) => x.name);
              setEvidence(f.id, n.id, [...files, ...names.filter((x) => !files.includes(x))]);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
