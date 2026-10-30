"use client";
import { ArrowRight, CornerDownRight } from "lucide-react";
import { COMPONENTS, FW, NODE } from "@/lib/framework";
import { BAND_COLOR, bandLookup, perfBand, ratingScore, sampleAppraisal, summarize } from "@/lib/scoring";
import { Card, Chip, PageHeader, f1 } from "@/components/ui";

const kpiCount = (id: string) => COMPONENTS.find((c) => c.id === id)!.kpis.length;

export default function GuidePage() {
  // live worked examples, computed by the same engine the scorecard uses
  const tei = bandLookup("Band_TEI", 0.82);
  const rating = ratingScore("Exceeds Expectations");
  const pts = 40 + 25;
  const ptsScore = Math.min(100, (pts / (NODE["5.1"].p100 ?? 80)) * 100);
  const co = bandLookup("Band_COLevel", 2.2);
  const pass = bandLookup("Band_Pass", 0.93);
  const wavg = (co * 60 + pass * 40) / 100;
  const key = bandLookup("Legacy_SpecialKey", 3 + 2);

  const sample = summarize(sampleAppraisal(), "Assistant Professor");
  const desig = "Assistant Professor";

  const methods = [
    {
      name: "Band lookup",
      tone: "brand" as const,
      what: "A measured value (a percentage, a count, a level) falls into a band, and each band has a fixed score.",
      example: (
        <>
          Student feedback (TEI) of <b>82%</b> sits in the 80–89% band → <b>{tei}</b> points.
        </>
      ),
    },
    {
      name: "Rubric rating",
      tone: "violet" as const,
      what: "The reviewer picks one of five written levels. Each level describes what the performance looks like.",
      example: (
        <>
          Class decorum rated <b>Exceeds Expectations</b> → <b>{rating}</b>. The levels score 100 / 80 / 60 / 40 / 0.
        </>
      ),
    },
    {
      name: "Points, capped at 100",
      tone: "sun" as const,
      what: "Each achievement earns points (a Scopus paper 40, UGC-CARE 25 …). The total is compared with a full-marks target.",
      example: (
        <>
          1 Scopus + 1 UGC-CARE paper = <b>{pts} pts</b>. Full marks for KPI 5.1 is 80 pts → {pts} ÷ 80 × 100 = <b>{f1(ptsScore)}</b>.
        </>
      ),
    },
    {
      name: "Weighted average",
      tone: "mint" as const,
      what: "A KPI made of sub-KPIs takes their weighted average. A sub-KPI marked Not applicable drops out and the rest are re-weighted.",
      example: (
        <>
          KPI 2.3: CO attainment 2.2 → {co} (weight 60%) and pass 93% → {pass} (weight 40%) = <b>{f1(wavg)}</b>.
        </>
      ),
    },
    {
      name: "Scoring key",
      tone: "warn" as const,
      what: "Kept from the old form for special assignments: each assignment rated EE = 3, SME = 2, PME = 1, then the total is looked up.",
      example: (
        <>
          One EE and one SME assignment = 5 key points → <b>{key}</b>.
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Help"
        title="How scoring works"
        subtitle="The plain-language version of the appraisal framework: what is measured, how each score is worked out, and who checks it."
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold tracking-tight">1. Seven KRAs and the management assessment</h2>
        <p className="max-w-3xl text-sm text-ink-2">
          Your work is grouped into seven Key Result Areas (KRAs). Each KRA has several Key Performance Indicators (KPIs). The Director adds one holistic rating, the
          Management Overall Assessment (MOA).
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COMPONENTS.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: c.color }}>
                    {c.id === "MOA" ? "MOA" : `KRA ${c.no}`}
                  </span>
                  <span className="text-[11px] text-muted">{kpiCount(c.id)} KPI{kpiCount(c.id) > 1 ? "s" : ""}</span>
                </div>
                <h3 className="mt-1 text-[14px] font-bold leading-snug">{c.name}</h3>
                <p className="mt-2 text-[12.5px] text-muted">{c.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold tracking-tight">2. How much each KRA counts</h2>
        <p className="max-w-3xl text-sm text-ink-2">
          The weight of each KRA depends on your designation. Senior faculty carry more research and institution-building; visiting faculty are assessed mostly on teaching.
        </p>
        <Card pad={false}>
          <div className="scroll-thin overflow-x-auto p-5">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 text-left">Component</th>
                  {FW.designations.map((d) => (
                    <th key={d} className="px-3 py-2 text-right">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map((c) => (
                  <tr key={c.id} className="border-t border-line-2">
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                        <b>{c.id === "MOA" ? "MOA" : `KRA ${c.no}`}</b> <span className="text-muted">{c.short}</span>
                      </span>
                    </td>
                    {FW.designationWeights[c.id].map((w, i) => (
                      <td key={i} className="tnum px-3 py-2 text-right font-semibold">
                        {w ? `${w}%` : <span className="text-muted">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-line font-extrabold">
                  <td className="py-2 pr-3">Total</td>
                  {FW.designations.map((d, i) => {
                    const t = COMPONENTS.reduce((a, c) => a + FW.designationWeights[c.id][i], 0);
                    return (
                      <td key={d} className={`tnum px-3 py-2 text-right ${t === 100 ? "text-ok" : "text-danger"}`}>
                        {t}%
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold tracking-tight">3. Five ways a KPI is scored</h2>
        <p className="max-w-3xl text-sm text-ink-2">Every KPI ends up as a score from 0 to 100. The examples below are calculated live by the same engine as your scorecard.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {methods.map((m) => (
            <Card key={m.name}>
              <Chip tone={m.tone}>{m.name}</Chip>
              <p className="mt-3 text-[13px] text-ink-2">{m.what}</p>
              <div className="mt-3 flex gap-2 rounded-xl bg-line-2 p-3 text-[13px]">
                <CornerDownRight size={15} className="mt-0.5 shrink-0 text-muted" />
                <span>{m.example}</span>
              </div>
            </Card>
          ))}
          <Card className="bg-night text-white" title={<span className="text-white">From KPIs to your FPI</span>}>
            <p className="text-[13px] text-white/75">
              KRA score = weighted average of its KPIs. Faculty Performance Index (FPI) = each KRA score × its designation weight, added up.
            </p>
            <div className="mt-3 space-y-1 text-[12.5px]">
              {COMPONENTS.slice(0, 3).map((c) => (
                <div key={c.id} className="tnum flex justify-between text-white/80">
                  <span>
                    {c.id} {f1(sample.components[c.id][2])} × {FW.designationWeights[c.id][0]}%
                  </span>
                  <span>{f1((sample.components[c.id][2] * FW.designationWeights[c.id][0]) / 100)}</span>
                </div>
              ))}
              <div className="text-white/50">… and so on for every component</div>
              <div className="tnum flex justify-between border-t border-white/15 pt-1.5 text-[14px] font-extrabold">
                <span>Sample FPI ({desig})</span>
                <span>{f1(sample.fpi[2])}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold tracking-tight">4. Performance bands</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[...FW.perfBands].reverse().map((b, i, arr) => {
            const hi = i === 0 ? 100 : arr[i - 1].min - 1;
            return (
              <div key={b.code} className="card p-4" style={{ borderTop: `4px solid ${BAND_COLOR[b.code]}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold" style={{ color: BAND_COLOR[b.code] }}>
                    {b.code}
                  </span>
                  <span className="tnum text-xs font-semibold text-muted">
                    {b.min}–{hi}
                  </span>
                </div>
                <div className="mt-1 text-[13px] font-bold leading-snug">{b.band}</div>
                <p className="mt-2 text-[12px] text-muted">{b.meaning}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          Example: the sample faculty scores {f1(sample.fpi[0])} on self-assessment ({perfBand(sample.fpi[0]).code}) and {f1(sample.fpi[2])} after review ({perfBand(sample.fpi[2]).code}).
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold tracking-tight">5. Who checks what</h2>
        <div className="card flex flex-col items-stretch gap-3 p-5 md:flex-row md:items-center">
          {[
            { who: "Faculty", what: "Fills the self-appraisal, attaches evidence, submits.", c: "#7c5cfc" },
            { who: "Deputy Director", what: "Checks each KPI, corrects values where needed, adds remarks, forwards or sends back.", c: "#1f5bd8" },
            { who: "Director", what: "Sets final values, gives the MOA rating, approves.", c: "#22c79a" },
          ].map((s, i) => (
            <div key={s.who} className="contents">
              {i > 0 && <ArrowRight className="mx-auto shrink-0 rotate-90 text-muted md:rotate-0" size={20} />}
              <div className="flex-1 rounded-2xl p-4" style={{ background: s.c + "14" }}>
                <div className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: s.c }}>
                  Step {i + 1}
                </div>
                <div className="text-[15px] font-extrabold">{s.who}</div>
                <p className="mt-1 text-[12.5px] text-ink-2">{s.what}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand-soft px-5 py-4 text-[13px] text-ink-2">
          <b className="text-ink">The inheritance rule.</b> A blank reviewer value accepts the previous level. The Deputy Director only types a value where the faculty claim
          differs from the record; the Director only types where they disagree with the Deputy Director. Every change is kept with who made it and why.
        </div>
      </section>
    </div>
  );
}
