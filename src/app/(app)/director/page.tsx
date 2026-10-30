"use client";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarDays, Download, Eye, Search, Stamp, Undo2, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { COMPONENTS, FW, KRAS, SHORT_DESIG, weightFor } from "@/lib/framework";
import { BAND_COLOR, perfBand, type Level } from "@/lib/scoring";
import { CURRENT_CYCLE, PAST_CYCLES, STATUS_META, type Faculty, type Status } from "@/lib/mock";
import { kraLabel } from "@/lib/insights";
import { Avatar, BandPill, Button, Card, Chip, f1, StatusPill } from "@/components/ui";
import { ClaimVsValidated, Donut, Gauge, Spark, TrendArea } from "@/components/charts";

/** the most-validated level available for an appraisal */
const levelOf = (s: Status): Level | null =>
  s === "approved" || s === "acknowledged" ? 2 : s === "validated" || s === "returned_dd" ? 1 : s === "submitted" || s === "returned_faculty" ? 0 : null;

const STATUS_GROUPS: { key: string; label: string; color: string; match: Status[] }[] = [
  { key: "draft", label: "Not submitted", color: "#c4cad8", match: ["not_started", "draft", "returned_faculty"] },
  { key: "dd", label: "With Dy Director", color: "#4b7cf0", match: ["submitted", "returned_dd"] },
  { key: "dir", label: "With Director", color: "#7c5cfc", match: ["validated"] },
  { key: "done", label: "Approved", color: "#22c79a", match: ["approved", "acknowledged"] },
];

export default function DirectorDashboard() {
  const { faculty, scores, role } = useStore();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [fDept, setFDept] = useState("all");

  const rows = useMemo(
    () =>
      faculty.map((f) => {
        const sc = scores(f);
        const lv = levelOf(f.status);
        return { f, sc, lv, fpi: lv == null ? null : sc.fpi[lv] };
      }),
    [faculty, scores],
  );
  const scored = rows.filter((r) => r.fpi != null) as (typeof rows[number] & { fpi: number; lv: Level })[];
  const validated = rows.filter((r) => r.lv != null && r.lv >= 1);
  const instFpi = scored.reduce((a, r) => a + r.fpi, 0) / Math.max(1, scored.length);
  const lastInst = faculty.reduce((a, f) => a + (f.history[f.history.length - 1]?.fpi ?? 0), 0) / faculty.length;
  const groups = STATUS_GROUPS.map((g) => ({ ...g, n: faculty.filter((f) => g.match.includes(f.status)).length }));
  const withMe = faculty.filter((f) => f.status === "validated").length;
  const returned = faculty.filter((f) => f.status === "returned_faculty" || f.status === "returned_dd").length;
  const byDesig = FW.designations.map((d) => ({ d, n: faculty.filter((f) => f.designation === d).length }));

  const claim = KRAS.map((c) => {
    const xs = validated.filter((r) => weightFor(c.id, r.f.designation) > 0);
    const av = (l: Level) => xs.reduce((a, r) => a + r.sc.components[c.id][l], 0) / Math.max(1, xs.length);
    return { name: kraLabel(c.id), self: +av(0).toFixed(1), final: +av(r2(xs)).toFixed(1), color: c.color };
  });
  function r2(xs: typeof validated): Level {
    return xs.every((r) => r.lv === 2) ? 2 : 1;
  }

  const bandCounts = FW.perfBands.map((b) => ({ name: b.band, code: b.code, value: scored.filter((r) => perfBand(r.fpi).code === b.code).length, color: BAND_COLOR[b.code] })).reverse();

  const depts = FW.lists.Department.filter((d) => scored.some((r) => r.f.dept === d));
  const heat = depts.map((d) => ({
    d,
    n: scored.filter((r) => r.f.dept === d).length,
    cells: COMPONENTS.map((c) => {
      const xs = scored.filter((r) => r.f.dept === d && weightFor(c.id, r.f.designation) > 0);
      return xs.length ? xs.reduce((a, r) => a + r.sc.components[c.id][r.lv], 0) / xs.length : null;
    }),
  }));

  const trend = [
    ...PAST_CYCLES.map((cyc, i) => ({ x: cyc, inst: +(faculty.reduce((a, f) => a + f.history[i].fpi, 0) / faculty.length).toFixed(1) })),
    { x: "Now", inst: +instFpi.toFixed(1) },
  ];
  const top = [...scored].sort((a, b) => b.fpi - a.fpi).slice(0, 5);

  const list = rows.filter(
    (r) =>
      (fStatus === "all" || STATUS_GROUPS.find((g) => g.key === fStatus)?.match.includes(r.f.status)) &&
      (fDept === "all" || r.f.dept === fDept) &&
      (!q || r.f.name.toLowerCase().includes(q.toLowerCase())),
  );
  const isDir = role === "director";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">{isDir ? "Good morning, Director" : "Team analytics"}</h1>
          <p className="mt-1 text-sm text-muted">Institution-wide view of {CURRENT_CYCLE} · live as appraisals move</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-2">
            <CalendarDays size={16} /> 01 Jun – 30 Nov 2026
          </span>
          <Button variant="primary">
            <Download size={16} /> Export report
          </Button>
        </div>
      </div>

      {/* row 1 */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Faculty in this cycle" action={<Users size={18} className="text-muted" />}>
          <div className="tnum text-[40px] font-extrabold leading-none text-ink">{faculty.length}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {byDesig.map(({ d, n }, i) => (
              <div key={d} className={clsx("rounded-xl px-3 py-2", ["bg-brand-soft", "bg-violet-soft", "bg-mint-soft", "bg-sun-soft"][i])}>
                <div className="tnum text-lg font-extrabold text-ink">{n}</div>
                <div className="text-[11px] font-semibold text-ink-2">{SHORT_DESIG[d]}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Completion overview" subtitle="Where every appraisal stands">
          <div className="flex items-end gap-2">
            <span className="tnum text-[40px] font-extrabold leading-none text-ink">{Math.round((groups[3].n / faculty.length) * 100)}%</span>
            <span className="mb-1 text-xs font-semibold text-muted">approved</span>
          </div>
          <div className="mt-4 flex h-3 gap-1">
            {groups.map((g) => (
              <div key={g.key} className="h-full rounded-full" style={{ flex: g.n || 0.0001, background: g.color }} title={`${g.label}: ${g.n}`} />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {groups.map((g) => (
              <li key={g.key} className="flex items-center gap-2 text-[11.5px] text-ink-2">
                <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                {g.label}
                <b className="tnum ml-auto text-ink">{g.n}</b>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Institution FPI"
          subtitle="Average of the latest validated scores"
          action={
            <Chip tone={instFpi >= lastInst ? "ok" : "danger"}>
              <ArrowUpRight size={12} />
              {instFpi >= lastInst ? "+" : ""}
              {f1(instFpi - lastInst)}
            </Chip>
          }
        >
          <Gauge value={instFpi} size={200} sub={perfBand(instFpi).band} />
        </Card>

        <div className="grid gap-5">
          <Link href="/director/approvals" className="group flex items-center gap-4 rounded-[20px] bg-mint p-5 text-night shadow-[0_10px_30px_-14px_rgba(34,199,154,.9)] transition hover:-translate-y-0.5">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/50">
              <Stamp size={22} />
            </span>
            <span className="flex-1 text-[14px] font-bold leading-tight">
              Awaiting your
              <br />
              approval
            </span>
            <span className="tnum text-[38px] font-extrabold leading-none">{String(withMe).padStart(2, "0")}</span>
          </Link>
          <div className="flex items-center gap-4 rounded-[20px] bg-sun p-5 text-night shadow-[0_10px_30px_-14px_rgba(255,213,74,.9)]">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/50">
              <Undo2 size={22} />
            </span>
            <span className="flex-1 text-[14px] font-bold leading-tight">
              Returned for
              <br />
              correction
            </span>
            <span className="tnum text-[38px] font-extrabold leading-none">{String(returned).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* row 2 */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Self-claim vs validated, by KRA"
          subtitle={`Average across ${validated.length} validated appraisals. The striped part is what reviewers did not accept.`}
          action={
            <div className="flex gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <span className="hatch h-3 w-3 rounded-sm text-brand-2" /> Self claim
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-brand" /> Validated
              </span>
            </div>
          }
        >
          <ClaimVsValidated data={claim} height={290} />
        </Card>
        <Card title="Performance bands" subtitle={`${scored.length} scored appraisals`}>
          <Donut height={210} data={bandCounts.filter((b) => b.value)} center={String(scored.length)} centerSub="faculty" />
          <ul className="mt-3 flex flex-col gap-2">
            {bandCounts.map((b) => (
              <li key={b.code} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                <span className="text-ink-2">{b.name}</span>
                <span className="tnum ml-auto rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: b.color + "1a", color: b.color }}>
                  {b.value} · {Math.round((b.value / Math.max(1, scored.length)) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* row 3 */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Department × KRA heatmap" subtitle="Average score per department, latest validated level">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[640px] border-separate border-spacing-1 text-[12px]">
              <thead>
                <tr>
                  <th className="w-[200px] text-left text-[11px] font-semibold text-muted">Department</th>
                  {COMPONENTS.map((c) => (
                    <th key={c.id} className="text-center text-[11px] font-bold" style={{ color: c.color }} title={c.name}>
                      {kraLabel(c.id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heat.map((h) => (
                  <tr key={h.d}>
                    <td className="pr-2 font-semibold text-ink">
                      {h.d}
                      <span className="ml-1 text-[11px] font-medium text-muted">({h.n})</span>
                    </td>
                    {h.cells.map((v, i) => {
                      const b = v == null ? null : perfBand(v);
                      return (
                        <td
                          key={i}
                          className="tnum h-10 rounded-lg text-center font-bold"
                          style={b ? { background: BAND_COLOR[b.code] + (v! >= 75 ? "33" : "22"), color: BAND_COLOR[b.code] } : { background: "#f3f5fa", color: "#b6bdcc" }}
                        >
                          {v == null ? "–" : Math.round(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">
            {FW.perfBands
              .slice()
              .reverse()
              .map((b) => (
                <span key={b.code} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAND_COLOR[b.code] }} /> {b.code} {b.min}+
                </span>
              ))}
          </div>
        </Card>
        <div className="grid gap-5">
          <Card title="Institution trend" subtitle="Average final FPI by cycle">
            <TrendArea height={170} data={trend} keys={[{ key: "inst", color: "#7c5cfc", name: "Institution FPI" }]} domain={[50, 90]} />
          </Card>
          <Card title="Top performers" subtitle="Latest validated FPI">
            <ul className="flex flex-col gap-2.5">
              {top.map((r, i) => (
                <li key={r.f.id} className="flex items-center gap-3">
                  <span className="tnum w-4 text-xs font-bold text-muted">{i + 1}</span>
                  <Avatar name={r.f.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{r.f.name}</div>
                    <div className="text-[11px] text-muted">{r.f.dept}</div>
                  </div>
                  <Spark values={[...r.f.history.map((h) => h.fpi), r.fpi]} color={BAND_COLOR[perfBand(r.fpi).code]} w={64} />
                  <span className="tnum w-10 text-right text-sm font-extrabold text-ink">{f1(r.fpi)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* table */}
      <Card
        pad={false}
        title="All faculty"
        subtitle="Every appraisal in this cycle"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search faculty" className="w-36 bg-transparent text-ink outline-none" />
            </label>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-9 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-2">
              <option value="all">All status</option>
              {STATUS_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
            <select value={fDept} onChange={(e) => setFDept(e.target.value)} className="h-9 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink-2">
              <option value="all">All departments</option>
              {FW.lists.Department.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto px-5 pb-5 scroll-thin">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead>
              <tr className="rounded-xl bg-line-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="rounded-l-xl px-3 py-2.5">Faculty</th>
                <th className="px-3 py-2.5">Emp ID</th>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5 text-right">Self</th>
                <th className="px-3 py-2.5 text-right">Dy Dir</th>
                <th className="px-3 py-2.5 text-right">Final</th>
                <th className="px-3 py-2.5">Band</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="rounded-r-xl px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {list.map(({ f, sc, lv, fpi }) => (
                <FacultyRow key={f.id} f={f} fpi={sc.fpi} lv={lv} cur={fpi} base={isDir ? "/director/approvals" : "/review"} />
              ))}
            </tbody>
          </table>
          {!list.length && <div className="py-10 text-center text-sm text-muted">No faculty match these filters.</div>}
        </div>
      </Card>
    </div>
  );
}

function FacultyRow({ f, fpi, lv, cur, base }: { f: Faculty; fpi: number[]; lv: Level | null; cur: number | null; base: string }) {
  const cell = (l: Level) => (lv != null && l <= lv ? f1(fpi[l]) : "–");
  return (
    <tr className="border-b border-line-2 last:border-0">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Avatar name={f.name} size={32} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink">{f.name}</div>
            <div className="text-[11px] text-muted">{SHORT_DESIG[f.designation]}</div>
          </div>
        </div>
      </td>
      <td className="tnum px-3 py-2.5 text-ink-2">{f.empId}</td>
      <td className="px-3 py-2.5">
        <span className="rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold text-ink-2">{f.dept}</span>
      </td>
      <td className="tnum px-3 py-2.5 text-right text-ink-2">{cell(0)}</td>
      <td className="tnum px-3 py-2.5 text-right text-ink-2">{cell(1)}</td>
      <td className="tnum px-3 py-2.5 text-right font-bold text-ink">{cell(2)}</td>
      <td className="px-3 py-2.5">{cur != null ? <BandPill score={cur} short /> : <span className="text-muted">–</span>}</td>
      <td className="px-3 py-2.5">
        <StatusPill status={f.status} />
      </td>
      <td className="px-3 py-2.5 text-right">
        {STATUS_META[f.status].step >= 1 ? (
          <Link href={`${base}/${f.id}`} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-brand" aria-label={`Open ${f.name}`}>
            {f.status === "validated" ? <ArrowRight size={15} /> : <Eye size={15} />}
          </Link>
        ) : null}
      </td>
    </tr>
  );
}
