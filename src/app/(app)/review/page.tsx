"use client";
import { useState } from "react";
import { CalendarDays, CheckCircle2, CornerUpLeft, Hourglass, Scale, Search } from "lucide-react";
import { FW, KRAS } from "@/lib/framework";
import { STATUS_META, type Status } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { Avatar, BandPill, Button, Card, Chip, PageHeader, Segmented, StatusPill, f1, fmtDate } from "@/components/ui";
import { ClaimVsValidated } from "@/components/charts";
import { TeamPerformance, submittedAt } from "@/components/review/TeamPerformance";

type Filter = "awaiting" | "returned" | "validated" | "all";
const FILTERS: Record<Filter, Status[] | null> = {
  awaiting: ["submitted", "returned_dd"],
  returned: ["returned_faculty"],
  validated: ["validated", "approved", "acknowledged"],
  all: null,
};

export default function ReviewQueue() {
  const { faculty, scores } = useStore();
  const [filter, setFilter] = useState<Filter>("awaiting");
  const [dept, setDept] = useState("All");
  const [q, setQ] = useState("");

  const inPlay = faculty.filter((f) => STATUS_META[f.status].step >= 1 || f.status === "returned_faculty");
  const awaiting = faculty.filter((f) => f.status === "submitted" || f.status === "returned_dd");
  const returned = faculty.filter((f) => f.status === "returned_faculty");
  const validated = faculty.filter((f) => STATUS_META[f.status].step >= 2);
  const gap = validated.length ? validated.reduce((a, f) => a + (scores(f).fpi[0] - scores(f).fpi[1]), 0) / validated.length : 0;

  const submittedList = inPlay.filter((f) => STATUS_META[f.status].step >= 1);
  const chart = KRAS.map((k) => {
    const avg = (l: number) => (submittedList.length ? submittedList.reduce((a, f) => a + scores(f).components[k.id][l], 0) / submittedList.length : 0);
    return { name: `KRA ${k.no}`, self: avg(0), final: avg(1), color: k.color };
  });

  const rows = faculty
    .filter((f) => !FILTERS[filter] || FILTERS[filter]!.includes(f.status))
    .filter((f) => dept === "All" || f.dept === dept)
    .filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.empId.toLowerCase().includes(q.toLowerCase()));

  const team = [...awaiting, ...validated].slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="Deputy Director"
        title="Good morning, Deputy Director"
        subtitle="Validate submitted appraisals KPI by KPI, then forward them to the Director."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-2">
            <CalendarDays size={15} /> Review window: 11 Nov – 20 Nov 2026
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Hourglass} tone="bg-brand text-white" label="Awaiting my review" value={awaiting.length} note="submitted or returned by Director" />
        <Stat icon={CornerUpLeft} tone="bg-coral-soft text-coral" label="Returned to faculty" value={returned.length} note="waiting for resubmission" />
        <Stat icon={CheckCircle2} tone="bg-ok-soft text-ok" label="Validated this cycle" value={validated.length} note={`of ${faculty.length} faculty`} />
        <Stat icon={Scale} tone="bg-violet-soft text-violet" label="Avg gap, self vs validated" value={f1(gap)} note="FPI points trimmed on review" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card title="Team performance" subtitle="Validated FPI · tap a name to see KRA scores">
          <TeamPerformance list={team} level={1} hrefFor={(f) => `/review/${f.id}`} />
        </Card>
        <Card
          title="Self claim vs validated, by KRA"
          subtitle="Team average across appraisals submitted this cycle"
          action={
            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <span className="hatch h-2.5 w-4 rounded-sm text-brand-2" /> Self claim
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm bg-brand" /> Validated
              </span>
            </div>
          }
        >
          <ClaimVsValidated data={chart} height={330} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
            {KRAS.map((k) => (
              <span key={k.id}>
                <b className="text-ink-2">KRA {k.no}</b> {k.short}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5" pad={false} title="Appraisals" subtitle={`${rows.length} shown`}>
        <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "awaiting", label: `Awaiting (${awaiting.length})` },
              { value: "returned", label: "Returned" },
              { value: "validated", label: "Validated" },
              { value: "all", label: "All" },
            ]}
          />
          <select
            aria-label="Department"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="h-9 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink-2 outline-none"
          >
            <option>All</option>
            {FW.lists.Department.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm text-muted sm:max-w-xs">
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or ID" className="w-full min-w-0 bg-transparent text-ink outline-none" />
          </label>
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-y border-line bg-line-2/60 text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-2.5 font-semibold">Faculty</th>
                <th className="px-3 py-2.5 font-semibold">Designation</th>
                <th className="px-3 py-2.5 font-semibold">Department</th>
                <th className="px-3 py-2.5 font-semibold">Submitted</th>
                <th className="px-3 py-2.5 text-right font-semibold">Self FPI</th>
                <th className="px-3 py-2.5 text-right font-semibold">Validated</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const s = scores(f);
                const sub = submittedAt(f);
                const act = f.status === "submitted" || f.status === "returned_dd";
                return (
                  <tr key={f.id} className="border-b border-line-2 hover:bg-line-2/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={f.name} size={32} />
                        <div className="leading-tight">
                          <div className="font-semibold text-ink">{f.name}</div>
                          <div className="text-[11px] text-muted">{f.empId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{f.designation}</td>
                    <td className="px-3 py-3">
                      <Chip>{f.dept}</Chip>
                    </td>
                    <td className="px-3 py-3 text-ink-2">{sub ? fmtDate(sub) : "—"}</td>
                    <td className="tnum px-3 py-3 text-right font-semibold">{STATUS_META[f.status].step >= 0 ? f1(s.fpi[0]) : "—"}</td>
                    <td className="px-3 py-3 text-right">
                      {STATUS_META[f.status].step >= 2 ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="tnum font-bold">{f1(s.fpi[1])}</span>
                          <BandPill score={s.fpi[1]} short />
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={f.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button href={`/review/${f.id}`} size="sm" variant={act ? "primary" : "ghost"}>
                        {act ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted">
                    Nothing matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, tone, label, value, note }: { icon: React.ElementType; tone: string; label: string; value: React.ReactNode; note: string }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="tnum text-[32px] font-extrabold leading-none tracking-tight">{value}</div>
      <div className="text-[11.5px] text-muted">{note}</div>
    </div>
  );
}
