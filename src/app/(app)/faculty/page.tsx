"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarClock, Check, CircleDashed, FileUp, Lightbulb, MessageSquareText, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { COMPONENTS, weightFor, SHORT_DESIG } from "@/lib/framework";
import { perfBand, BAND_COLOR } from "@/lib/scoring";
import { CURRENT_CYCLE, CYCLE_STAGES, STATUS_META, TODAY } from "@/lib/mock";
import { completion, componentCompletion, institutionAverage, kraLabel, opportunities } from "@/lib/insights";
import { Bar, BandPill, Button, Card, Chip, f1, fmtDateTime, StatusPill } from "@/components/ui";
import { Donut, Gauge, KraRadar, TrendArea } from "@/components/charts";

const STEPS = ["Draft", "Submitted", "Dy Dir", "Director", "Approved"];

export default function FacultyDashboard() {
  const { me, scores, faculty } = useStore();
  const s = scores(me);
  const self = s.fpi[0];
  const last = me.history[me.history.length - 1]?.fpi ?? self;
  const comp = completion(me);
  const pctDone = comp.total ? Math.round((comp.done / comp.total) * 100) : 0;
  const step = STATUS_META[me.status].step;
  const daysLeft = Math.max(0, Math.round((+new Date(CYCLE_STAGES[0].to) - +new Date(TODAY)) / 86400000));
  const inst = institutionAverage(faculty, scores);
  const ops = opportunities(me, 0, 5);
  const weighted = COMPONENTS.filter((c) => weightFor(c.id, me.designation) > 0);
  const firstName = me.name.replace(/^(Dr|Prof)\.\s*/, "").split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Good morning, {firstName}</h1>
          <p className="mt-1 text-sm text-muted">
            {me.designation} · {me.dept} · {CURRENT_CYCLE}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" href="/guide">
            How scoring works
          </Button>
          <Button variant="primary" href="/faculty/appraisal">
            Continue appraisal <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      {/* row 1 */}
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        <Card title="My appraisal" subtitle={CURRENT_CYCLE} action={<StatusPill status={me.status} />}>
          <ol className="mb-5 grid grid-cols-5">
            {STEPS.map((label, i) => {
              const done = i < step || (i === step && step === 4);
              const cur = i === step && step < 4;
              return (
                <li key={label} className="relative flex flex-col items-center gap-1.5">
                  {i > 0 && <span className={clsx("absolute right-1/2 top-[13px] h-[2px] w-[calc(100%-32px)] -translate-x-4 rounded", i <= step ? "bg-brand" : "bg-line")} />}
                  <span
                    className={clsx(
                      "relative grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold",
                      done ? "bg-brand text-white" : cur ? "bg-brand-soft text-brand ring-2 ring-brand" : "bg-line-2 text-muted",
                    )}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={clsx("max-w-full truncate text-center text-[10px] font-semibold leading-tight", cur ? "text-brand" : "text-muted")} title={label}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="flex items-end justify-between">
            <div>
              <div className="tnum text-[32px] font-extrabold leading-none text-ink">
                {pctDone}
                <span className="text-lg text-muted">%</span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {comp.done} of {comp.total} entries filled
              </div>
            </div>
            <Chip tone={daysLeft <= 5 ? "danger" : "sun"}>
              <CalendarClock size={12} /> {daysLeft} days left
            </Chip>
          </div>
          <div className="mt-3 flex gap-1">
            {weighted.map((c) => {
              const cc = componentCompletion(me, c.id);
              return (
                <div key={c.id} className="flex-1" title={`${c.short}: ${cc.done}/${cc.total}`}>
                  <Bar value={cc.total ? (cc.done / cc.total) * 100 : 100} color={c.color} h={6} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title="Performance index"
          subtitle="Live, from your self-entries"
          action={
            <Chip tone={self >= last ? "ok" : "danger"}>
              <ArrowUpRight size={12} className={self < last ? "rotate-90" : ""} />
              {self >= last ? "+" : ""}
              {f1(self - last)} vs last cycle
            </Chip>
          }
        >
          <Gauge value={self} size={230} sub="Self score" />
          <div className="mt-2 flex items-center justify-center gap-2">
            <BandPill score={self} />
          </div>
        </Card>

        <Card title="What counts for you" subtitle={`Weights for ${me.designation}`} className="md:col-span-2 2xl:col-span-1">
          <div className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-4">
            <Donut
              height={140}
              center="100%"
              centerSub={SHORT_DESIG[me.designation]}
              data={weighted.map((c) => ({ name: c.short, value: weightFor(c.id, me.designation), color: c.color }))}
            />
            <ul className="flex min-w-0 flex-col gap-1.5">
              {weighted.map((c) => (
                <li key={c.id} className="flex min-w-0 items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: c.color }} />
                  <span className="truncate text-ink-2">{c.short}</span>
                  <span className="tnum ml-auto font-bold text-ink">{weightFor(c.id, me.designation)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* row 2 */}
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card title="Score by KRA" subtitle="Score out of 100 and the FPI points each KRA contributes" action={<Chip tone="brand">Self</Chip>}>
          <ul className="flex flex-col gap-3.5">
            {weighted.map((c) => {
              const v = s.components[c.id][0];
              const w = weightFor(c.id, me.designation);
              return (
                <li key={c.id} className="grid grid-cols-[minmax(0,170px)_1fr_auto] items-center gap-3">
                  <Link href={`/faculty/appraisal?k=${c.id}`} className="min-w-0 hover:text-brand">
                    <div className="text-[11px] font-semibold text-muted">{kraLabel(c.id)}</div>
                    <div className="truncate text-[13px] font-semibold text-ink">{c.short}</div>
                  </Link>
                  <div className="relative h-7 rounded-full bg-line-2">
                    <div className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full pr-2.5 text-[11px] font-bold text-white transition-[width] duration-500" style={{ width: `${Math.max(v, 12)}%`, background: c.color }}>
                      {Math.round(v)}
                    </div>
                    <span className="absolute inset-y-0 w-[2px] bg-ink/25" style={{ left: `${inst.components[c.id]}%` }} title="Institution average" />
                  </div>
                  <div className="w-16 text-right">
                    <div className="tnum text-[13px] font-bold text-ink">+{f1((v * w) / 100)}</div>
                    <div className="text-[10px] text-muted">of {w} pts</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-[11px] text-muted">
            <span className="inline-block h-3 w-[2px] bg-ink/25" /> Institution average of approved appraisals ({inst.n} faculty)
          </p>
        </Card>

        <div className="grid gap-5">
          <Card title="My journey" subtitle="Final FPI by cycle, with this cycle's live self score">
            <TrendArea
              height={190}
              data={[...me.history.map((h) => ({ x: h.cycle, fpi: h.fpi })), { x: "Now (self)", fpi: Math.round(self * 10) / 10 }]}
              keys={[{ key: "fpi", color: "#1f5bd8", name: "FPI" }]}
            />
          </Card>
          <Card title="Me vs institution" subtitle="KRA scores against the approved-appraisal average">
            <KraRadar
              height={230}
              data={weighted.filter((c) => c.id !== "MOA").map((c) => ({ kra: kraLabel(c.id), self: Math.round(s.components[c.id][0]), final: Math.round(inst.components[c.id]) }))}
            />
            <div className="flex justify-center gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-violet" /> Me (self)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand/50" /> Institution</span>
            </div>
          </Card>
        </div>
      </div>

      {/* row 3 */}
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        <Card title="Biggest opportunities" subtitle="FPI points you'd gain if this KPI reached its target" action={<Lightbulb size={18} className="text-sun" />}>
          <ul className="flex flex-col gap-2.5">
            {ops.map((o) => (
              <li key={o.node.id}>
                <Link href={`/faculty/appraisal?k=${o.kra.id}#${o.node.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand/40 hover:bg-brand-soft/40">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: o.kra.color }}>
                    {o.node.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{o.node.name}</span>
                    <span className="text-[11px] text-muted">Now {Math.round(o.score)} / 100</span>
                  </span>
                  <span className="tnum text-sm font-extrabold text-ok">+{f1(o.gain)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Still to fill" subtitle={`${comp.missing.length} entries left before you can submit`} action={<CircleDashed size={18} className="text-muted" />}>
          {comp.missing.length === 0 ? (
            <div className="rounded-xl bg-ok-soft p-4 text-sm font-semibold text-ok">Everything is filled. Review and submit when ready.</div>
          ) : (
            <ul className="flex max-h-[290px] flex-col gap-1.5 overflow-y-auto pr-1 scroll-thin">
              {comp.missing.slice(0, 12).map((n) => (
                <li key={n.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-line-2">
                  <span className="tnum w-12 shrink-0 text-[11px] font-bold text-muted">{n.id}</span>
                  <span className="truncate text-ink-2">{n.name}</span>
                </li>
              ))}
              {comp.missing.length > 12 && <li className="px-2 text-xs text-muted">and {comp.missing.length - 12} more</li>}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="soft" size="sm" href="/faculty/appraisal">
              <FileUp size={14} /> Fill now
            </Button>
            <Button variant="ghost" size="sm" href="/faculty/submit">
              Review & submit
            </Button>
          </div>
        </Card>

        <Card title="Activity" subtitle="Your appraisal timeline" action={<MessageSquareText size={18} className="text-muted" />} className="md:col-span-2 2xl:col-span-1">
          <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-5">
            {[...me.events].reverse().map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand ring-2 ring-brand-soft" />
                <div className="text-[13px] font-semibold text-ink">{e.action}</div>
                <div className="text-[11px] text-muted">
                  {e.by} · {fmtDateTime(e.at)}
                </div>
                {e.note && <div className="mt-1.5 rounded-lg bg-line-2 p-2 text-xs text-ink-2">{e.note}</div>}
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl border border-line p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <TrendingUp size={14} className="text-brand" /> Last cycle: {f1(last)}{" "}
              <span className="font-bold" style={{ color: BAND_COLOR[perfBand(last).code] }}>
                {perfBand(last).code}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
