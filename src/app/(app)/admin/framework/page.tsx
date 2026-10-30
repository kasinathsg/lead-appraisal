"use client";
import clsx from "clsx";
import { useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { COMPONENTS, FW, type Component, type FNode, type Weights } from "@/lib/framework";
import { useStore } from "@/lib/store";
import { WeightEditor } from "@/components/admin/WeightEditor";
import { Card, Chip, PageHeader, Segmented, type Tone } from "@/components/ui";

const METHOD: Record<string, { label: string; tone: Tone }> = {
  band: { label: "Band", tone: "brand" },
  rating: { label: "Rubric", tone: "violet" },
  points: { label: "Points", tone: "sun" },
  wavg: { label: "Weighted", tone: "mint" },
  points_lookup: { label: "Key", tone: "warn" },
};

type Tab = "tree" | "weights" | "tables";

export default function FrameworkPage() {
  const [tab, setTab] = useState<Tab>("tree");
  const [sel, setSel] = useState(COMPONENTS[0].id);
  const comp = COMPONENTS.find((c) => c.id === sel)!;
  const { framework, role } = useStore();
  const live = framework.versions[framework.versions.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Framework Studio"
        title={
          <span className="flex flex-wrap items-center gap-3">
            KRA & KPI framework
            <Chip tone="ok" dot>
              v{live.version} · Live
            </Chip>
            {framework.draft && (
              <Chip tone="violet" dot>
                Draft in progress
              </Chip>
            )}
          </span>
        }
        subtitle={
          role === "admin"
            ? `${FW.meta.framework_ref}. Edit weights in a draft, check the impact, then publish a new version for the next cycle.`
            : `${FW.meta.framework_ref}. Admin / IQAC maintains the weights; every change is versioned.`
        }
        actions={
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "tree", label: "KRAs & KPIs" },
              { value: "weights", label: role === "admin" ? "Edit weights" : "Weights" },
              { value: "tables", label: "Scoring tables" },
            ]}
          />
        }
      />

      {tab === "tree" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <Card pad={false} className="h-fit p-2">
            <ul className="flex flex-col gap-0.5">
              {COMPONENTS.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSel(c.id)}
                    className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition", sel === c.id ? "bg-line-2" : "hover:bg-line-2/60")}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: c.color }}>
                      {c.id === "MOA" ? "M" : c.no}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{c.short}</span>
                      <span className="block text-[11px] text-muted">{c.kpis.length} KPIs</span>
                    </span>
                    {sel === c.id && <ChevronRight size={15} className="text-muted" />}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <ComponentPanel c={comp} w={live.weights} />
        </div>
      )}

      {tab === "weights" && <WeightEditor />}
      {tab === "tables" && <ScoringTables />}
    </div>
  );
}

function ComponentPanel({ c, w }: { c: Component; w: Weights }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="h-1.5" style={{ background: c.color }} />
        <div className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: c.color }}>
            {c.id === "MOA" ? "Management layer" : `KRA ${c.no}`}
          </div>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">{c.name}</h2>
          <p className="mt-2 text-sm text-ink-2">
            <b>Focus:</b> {c.focus}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-muted">{c.intent}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {FW.designations.map((d, i) => (
              <span key={d} className="rounded-xl bg-line-2 px-3 py-1.5 text-xs">
                <span className="text-muted">{d}: </span>
                <b className="tnum">{w.desig[c.id][i]}%</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>KPI</span>
          <span className="hidden sm:block">Method · Weight</span>
        </div>
        <ul>
          {c.kpis.map((k) => (
            <KpiRow key={k.id} n={k} depth={0} color={c.color} open={open} setOpen={setOpen} w={w} />
          ))}
        </ul>
        <div className="flex items-center gap-2 border-t border-line px-5 py-3 text-xs text-muted">
          <Lock size={12} /> KPI weights inside a KRA total {c.kpis.reduce((a, k) => a + (w.kpi[k.id] ?? 0), 0)}%.
        </div>
      </Card>
    </div>
  );
}

function KpiRow({ n, depth, color, open, setOpen, w }: { n: FNode; depth: number; color: string; open: string | null; setOpen: (id: string | null) => void; w: Weights }) {
  const isOpen = open === n.id;
  const isComp = n.level === "COMP";
  const rubric = n.rubric ?? (n.table ? FW.bands[n.table]?.rubric : null) ?? null;
  const table = n.table ?? n.lookup;
  const m = n.method ? METHOD[n.method] : null;
  const pointsText = isComp ? (n.lookup ? "Table lookup" : n.input === "yesno" ? `Yes = ${n.factor} pts` : `${n.factor} pts each${n.cap != null ? ` · max ${n.cap}` : ""}`) : null;
  return (
    <li className="border-b border-line-2 last:border-0">
      <button
        onClick={() => setOpen(isOpen ? null : n.id)}
        className={clsx("flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-line-2/50", isOpen && "bg-line-2/50")}
        style={{ paddingLeft: 20 + depth * 22 }}
      >
        <span className={clsx("tnum mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold", isComp ? "text-muted" : "text-white")} style={isComp ? undefined : { background: depth ? color + "bb" : color }}>
          {n.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className={clsx("block text-[13px] leading-snug", isComp ? "text-ink-2" : "font-semibold")}>{n.name}</span>
          {!isComp && n.target && <span className="mt-0.5 block text-[11px] text-muted">Target: {n.target}</span>}
          {isComp && <span className="mt-0.5 block text-[11px] text-muted">{pointsText}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {m && <Chip tone={m.tone}>{m.label}</Chip>}
          {!isComp && <span className="tnum w-10 text-right text-[13px] font-bold">{w.kpi[n.id] ?? n.weight}%</span>}
        </span>
      </button>
      {isOpen && (
        <div className="grid gap-4 bg-line-2/40 px-5 pb-5 pt-1 md:grid-cols-2" style={{ paddingLeft: 20 + depth * 22 + 44 }}>
          <div className="flex flex-col gap-2 text-[12.5px]">
            {n.definition && <p className="text-ink-2">{n.definition}</p>}
            {n.measure && (
              <p>
                <b>Measure:</b> <span className="text-ink-2">{n.measure}</span>
              </p>
            )}
            {n.evidence && (
              <p>
                <b>Evidence:</b> <span className="text-ink-2">{n.evidence}</span>
              </p>
            )}
            {(n.entered_by || n.validated_by) && (
              <p className="text-muted">
                Entered by {n.entered_by} · validated by {n.validated_by}
                {n.frequency ? ` · ${n.frequency}` : ""}
              </p>
            )}
            {n.legacy && <p className="rounded-lg bg-white px-3 py-2 text-[11.5px] text-muted">Legacy: {n.legacy}</p>}
          </div>
          <div className="flex flex-col gap-3">
            {rubric && (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                {FW.ratings.map((r, i) => (
                  <div key={r.label} className="flex gap-3 border-b border-line-2 px-3 py-2 text-[12px] last:border-0">
                    <span className="tnum w-8 shrink-0 font-bold text-brand">{r.score}</span>
                    <span className="w-32 shrink-0 font-semibold">{r.label}</span>
                    <span className="text-ink-2">{rubric[i]}</span>
                  </div>
                ))}
              </div>
            )}
            {table && FW.bands[table] && <BandRows name={table} compact />}
            {n.p100 && <p className="text-[12px] text-muted">{n.p100} points = full score of 100 (capped).</p>}
          </div>
        </div>
      )}
      {n.children.length > 0 && (
        <ul>
          {n.children.map((c) => (
            <KpiRow key={c.id} n={c} depth={depth + 1} color={color} open={open} setOpen={setOpen} w={w} />
          ))}
        </ul>
      )}
    </li>
  );
}

function fmtThreshold(kind: string, v: number) {
  if (kind === "pct") return `${Math.round(v * 100)}%`;
  if (kind === "amount") return "₹" + v.toLocaleString("en-IN");
  return String(v);
}

function BandRows({ name, compact }: { name: string; compact?: boolean }) {
  const b = FW.bands[name];
  const max = Math.max(...b.rows.map((r) => r[1]), 1);
  return (
    <div className={clsx("overflow-hidden rounded-xl border border-line bg-white", compact && "text-[12px]")}>
      <div className="flex justify-between bg-line-2/70 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
        <span>From</span>
        <span>Score</span>
      </div>
      {b.rows.map(([t, s]) => (
        <div key={t} className="flex items-center gap-3 border-t border-line-2 px-3 py-1.5">
          <span className="tnum w-20 shrink-0 font-semibold">≥ {fmtThreshold(b.kind, t)}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(s / max) * 100}%` }} />
          </div>
          <span className="tnum w-8 text-right font-bold">{s}</span>
        </div>
      ))}
    </div>
  );
}

function ScoringTables() {
  const entries = Object.entries(FW.bands);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map(([name, b]) => (
        <Card
          key={name}
          title={b.title}
          subtitle={<code className="text-[11px]">{name}</code>}
          action={<Chip tone={b.source === "Legacy" ? "sun" : b.source === "Adapted" ? "violet" : "brand"}>{b.source}</Chip>}
        >
          <BandRows name={name} compact />
          <p className="mt-3 text-[12px] text-muted">{b.note}</p>
        </Card>
      ))}
    </div>
  );
}
