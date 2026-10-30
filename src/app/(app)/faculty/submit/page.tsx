"use client";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleCheck, PartyPopper, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { COMPONENTS, COMPONENT_OF, weightFor } from "@/lib/framework";
import { completion, evidenceGaps, kraLabel } from "@/lib/insights";
import { BandPill, Button, Card, Chip, f1, PageHeader, StatusPill } from "@/components/ui";
import { Gauge } from "@/components/charts";

export default function SubmitPage() {
  const { me, scores, transition, setRole } = useStore();
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const s = scores(me);
  const comp = completion(me);
  const editable = me.status === "draft" || me.status === "returned_faculty" || me.status === "not_started";
  const comps = COMPONENTS.filter((c) => weightFor(c.id, me.designation) > 0);
  const ev = evidenceGaps(me);
  const ready = comp.missing.length === 0 && ev.missing.length === 0 && agree;
  const checks = [
    { ok: comp.missing.length === 0, label: comp.missing.length ? `${comp.missing.length} entries still blank` : "Every applicable entry is filled" },
    { ok: me.data.courses.length > 0, label: `${me.data.courses.length} courses in the course register (TEI and pass %)` },
    {
      ok: ev.missing.length === 0,
      label: ev.missing.length ? `Evidence missing for ${ev.missing.length} of ${ev.required} KPIs that require it` : `Evidence attached for all ${ev.required} KPIs that require it`,
      hint: "System-fed KPIs (LMS, biometric, exam cell) need no upload",
    },
    { ok: agree, label: "Declaration accepted" },
  ];

  if (!editable) {
    const sent = me.status === "submitted";
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-ok">
          {sent ? <PartyPopper size={30} /> : <CircleCheck size={30} />}
        </span>
        <h1 className="text-[26px] font-extrabold tracking-tight">{sent ? "Submitted. Nice work." : "Your appraisal is in review"}</h1>
        <p className="max-w-[52ch] text-sm text-muted">
          Your self-score of <b className="text-ink">{f1(s.fpi[0])}</b> is now with the Deputy Director for validation. You will be notified
          if anything is returned, and when the Director approves the final score.
        </p>
        <StatusPill status={me.status} />
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button variant="ghost" href="/faculty">
            Back to dashboard
          </Button>
          {sent && (
            <Button
              variant="primary"
              onClick={() => {
                setRole("dydir");
                router.push(`/review/${me.id}`);
              }}
            >
              Continue demo as Deputy Director <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Step 2 of 2" title="Review & submit" subtitle="Check your self-assessment before it goes to the Deputy Director. You can't edit after submitting unless it is returned." />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card title="Your scorecard" subtitle={`${me.designation} weights · self level`} pad={false}>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="py-2">Key result area</th>
                  <th className="py-2 text-right">Weight</th>
                  <th className="py-2 text-right">Score</th>
                  <th className="py-2 text-right">FPI points</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {comps.map((c) => {
                  const v = s.components[c.id][0];
                  const w = weightFor(c.id, me.designation);
                  return (
                    <tr key={c.id} className="border-t border-line-2">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-1.5 rounded-full" style={{ background: c.color }} />
                          <div>
                            <div className="text-[11px] font-semibold text-muted">{kraLabel(c.id)}</div>
                            <div className="font-semibold text-ink">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="tnum py-3 text-right text-ink-2">{w}%</td>
                      <td className="tnum py-3 text-right font-bold text-ink">{f1(v)}</td>
                      <td className="tnum py-3 text-right font-bold text-ink">{f1((v * w) / 100)}</td>
                      <td className="py-3 pl-3 text-right">
                        <Link href={`/faculty/appraisal?k=${c.id}`} className="text-xs font-semibold text-brand hover:underline">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-ink/10">
                  <td className="py-3 font-extrabold text-ink">Faculty Performance Index</td>
                  <td className="tnum py-3 text-right font-semibold text-ink-2">100%</td>
                  <td />
                  <td className="tnum py-3 text-right text-lg font-extrabold text-brand">{f1(s.fpi[0])}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <Gauge value={s.fpi[0]} size={240} sub="Self FPI" />
            <div className="mt-2 flex justify-center">
              <BandPill score={s.fpi[0]} />
            </div>
          </Card>
          <Card title="Before you submit">
            <ul className="flex flex-col gap-2.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2.5 text-[13px]">
                  {c.ok ? <CheckCircle2 size={18} className="mt-px shrink-0 text-ok" /> : <AlertTriangle size={18} className="mt-px shrink-0 text-warn" />}
                  <span>
                    <span className={clsx("font-semibold", c.ok ? "text-ink" : "text-warn")}>{c.label}</span>
                    {c.hint && <span className="block text-[11px] text-muted">{c.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {(comp.missing.length > 0 || ev.missing.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...comp.missing, ...ev.missing].slice(0, 10).map((n) => (
                  <Link key={n.id} href={`/faculty/appraisal?k=${COMPONENT_OF[n.id].id}#${n.id}`}>
                    <Chip tone="warn">{n.id}</Chip>
                  </Link>
                ))}
              </div>
            )}
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-line-2 p-3 text-[12.5px] text-ink-2">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
              I confirm that the information and evidence I have provided are accurate and complete to the best of my knowledge.
            </label>
            <Button
              variant="primary"
              className="mt-4 w-full"
              disabled={!ready}
              onClick={() => transition(me.id, "submitted", "Submitted self-appraisal")}
            >
              <Send size={16} /> Submit to Deputy Director
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
