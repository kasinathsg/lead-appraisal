"use client";
import clsx from "clsx";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CloudCheck, Lock, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { COMPONENTS, weightFor } from "@/lib/framework";
import { completion, componentCompletion, kraLabel } from "@/lib/insights";
import { BandPill, Button, Chip, f1, StatusPill } from "@/components/ui";
import { Ring } from "@/components/charts";
import { KpiCard } from "@/components/appraisal/KpiCard";

const EDITABLE = new Set(["not_started", "draft", "returned_faculty"]);

function AppraisalForm() {
  const { me, scores } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const comps = COMPONENTS.filter((c) => weightFor(c.id, me.designation) > 0);
  const kId = params.get("k") && comps.some((c) => c.id === params.get("k")) ? params.get("k")! : comps[0].id;
  const idx = comps.findIndex((c) => c.id === kId);
  const k = comps[idx];
  const s = scores(me);
  const editable = EDITABLE.has(me.status);
  const comp = completion(me);
  const go = (id: string) => router.push(`/faculty/appraisal?k=${id}`, { scroll: false });
  // the banner is locked under the top bar from the start; measure it so the KRA list locks right below it
  const bannerRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(180);
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStick(64 + el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    else window.scrollTo({ top: 0 });
  }, [kId]);

  return (
    <div className="flex flex-col gap-5" style={{ "--stick": `${stick}px` } as React.CSSProperties}>
      {/* live score bar */}
      <div ref={bannerRef} className="sticky top-16 z-20 -mx-4 -mt-6 bg-canvas px-4 pb-2 pt-6 md:-mx-8 md:-mt-8 md:px-8 md:pt-8">
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">My appraisal</div>
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-extrabold text-ink">Self-assessment</span>
            <StatusPill status={me.status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="tnum text-[30px] font-extrabold leading-none tracking-tight text-ink">{f1(s.fpi[0])}</div>
          <div className="leading-tight">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Live FPI</div>
            <BandPill score={s.fpi[0]} short />
          </div>
        </div>
        <div className="hidden min-w-[160px] flex-1 md:block">
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-muted">
            <span>Completion</span>
            <span className="tnum">
              {comp.done}/{comp.total}
            </span>
          </div>
          <div className="flex gap-1">
            {comps.map((c) => {
              const cc = componentCompletion(me, c.id);
              return (
                <button key={c.id} onClick={() => go(c.id)} className="h-2 flex-1 overflow-hidden rounded-full bg-line-2" title={c.short}>
                  <div className="h-full rounded-full" style={{ width: `${cc.total ? (cc.done / cc.total) * 100 : 100}%`, background: c.color }} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editable ? (
            <span className="hidden items-center gap-1.5 text-xs font-medium text-ok sm:flex">
              <CloudCheck size={15} /> Saved automatically
            </span>
          ) : (
            <Chip tone="muted">
              <Lock size={12} /> Read-only
            </Chip>
          )}
          <Button variant="primary" href="/faculty/submit">
            <Send size={15} /> Review & submit
          </Button>
        </div>
      </div>
      </div>

      {me.status === "returned_faculty" && (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          <b>Returned by the Deputy Director:</b> {me.events.filter((e) => e.action.startsWith("Returned")).pop()?.note}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* KRA navigator */}
        <nav className="flex gap-2 overflow-x-auto pb-1 scroll-thin lg:sticky lg:top-[calc(var(--stick)+12px)] lg:max-h-[calc(100dvh-var(--stick)-24px)] lg:flex-col lg:self-start lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
          {comps.map((c) => {
            const cc = componentCompletion(me, c.id);
            const on = c.id === kId;
            return (
              <button
                key={c.id}
                onClick={() => go(c.id)}
                className={clsx(
                  "flex min-w-[220px] items-center gap-3 rounded-2xl border p-3 text-left transition lg:min-w-0",
                  on ? "border-transparent bg-night text-white shadow-xl" : "border-line bg-white hover:border-ink/15",
                )}
              >
                <Ring value={s.components[c.id][0]} size={44} stroke={5} color={c.color} track={on ? "rgba(255,255,255,.14)" : "#eef1f7"} text={on ? "#fff" : "#111a2e"} />
                <span className="min-w-0 flex-1">
                  <span className={clsx("block text-[10.5px] font-semibold", on ? "text-white/60" : "text-muted")}>
                    {kraLabel(c.id)} · {weightFor(c.id, me.designation)}%
                  </span>
                  <span className="block truncate text-[13px] font-bold">{c.short}</span>
                  <span className={clsx("tnum block text-[10.5px]", on ? "text-white/60" : "text-muted")}>
                    {cc.done}/{cc.total} filled
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="relative overflow-hidden rounded-[20px] p-6 text-white" style={{ background: `linear-gradient(120deg, ${k.color}, ${k.color}d0)` }}>
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden />
            <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" aria-hidden />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-[62ch]">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
                  {kraLabel(k.id)} · {weightFor(k.id, me.designation)}% of your FPI
                </div>
                <h2 className="mt-1 text-[22px] font-extrabold leading-tight">{k.name}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-white/85">{k.intent}</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
                <div className="tnum text-[34px] font-extrabold leading-none">{Math.round(s.components[k.id][0])}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/75">KRA score</div>
              </div>
            </div>
          </section>

          {k.kpis.map((n) => (
            <KpiCard key={n.id} n={n} f={me} color={k.color} editable={editable} />
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" disabled={idx === 0} onClick={() => go(comps[idx - 1].id)}>
              <ArrowLeft size={16} /> {idx > 0 ? comps[idx - 1].short : "Previous"}
            </Button>
            {idx < comps.length - 1 ? (
              <Button variant="dark" onClick={() => go(comps[idx + 1].id)}>
                {comps[idx + 1].short} <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="primary" href="/faculty/submit">
                Review & submit <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AppraisalForm />
    </Suspense>
  );
}
