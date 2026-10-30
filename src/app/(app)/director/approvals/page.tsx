"use client";
import clsx from "clsx";
import { useState } from "react";
import { CheckCircle2, CornerUpLeft, Search, Stamp, X } from "lucide-react";
import { STATUS_META, type Status } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { Avatar, BandPill, Button, Card, Chip, PageHeader, Segmented, StatusPill, f1 } from "@/components/ui";
import { TeamPerformance } from "@/components/review/TeamPerformance";

type Filter = "mine" | "approved" | "returned" | "all";
const FILTERS: Record<Filter, Status[] | null> = {
  mine: ["validated"],
  approved: ["approved", "acknowledged"],
  returned: ["returned_dd", "returned_faculty"],
  all: null,
};

export default function Approvals() {
  const { faculty, scores, transition } = useStore();
  const [filter, setFilter] = useState<Filter>("mine");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const withMe = faculty.filter((f) => f.status === "validated");
  const approved = faculty.filter((f) => f.status === "approved" || f.status === "acknowledged");
  const returned = faculty.filter((f) => f.status === "returned_dd" || f.status === "returned_faculty");

  const rows = faculty
    .filter((f) => !FILTERS[filter] || FILTERS[filter]!.includes(f.status))
    .filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.dept.toLowerCase().includes(q.toLowerCase()));
  const selectable = rows.filter((f) => f.status === "validated").map((f) => f.id);
  const chosen = sel.filter((id) => selectable.includes(id));
  const allOn = selectable.length > 0 && selectable.every((id) => chosen.includes(id));

  const bulk = () => {
    chosen.forEach((id) => transition(id, "approved", "Approved (bulk)"));
    setToast(`${chosen.length} appraisal${chosen.length === 1 ? "" : "s"} approved. Faculty can now see their final scores.`);
    setSel([]);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Director"
        title="Approvals"
        subtitle="Appraisals validated by the Deputy Director wait here for your final decision."
        actions={
          <div className="flex flex-wrap gap-2">
            <Pill className="bg-sun" label="With me" value={withMe.length} />
            <Pill className="bg-mint" label="Approved" value={approved.length} />
            <Pill className="bg-coral-soft" label="Returned" value={returned.length} />
          </div>
        }
      />

      {toast && (
        <div className="rise mb-5 flex items-center gap-3 rounded-2xl border border-ok/30 bg-ok-soft px-5 py-3.5">
          <CheckCircle2 size={20} className="text-ok" />
          <p className="flex-1 text-sm font-semibold text-ink">{toast}</p>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card pad={false} title="Approval queue" subtitle={`${rows.length} shown`}>
          <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
            <Segmented<Filter>
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setSel([]);
              }}
              options={[
                { value: "mine", label: `With me (${withMe.length})` },
                { value: "approved", label: "Approved" },
                { value: "returned", label: "Returned" },
                { value: "all", label: "All" },
              ]}
            />
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm text-muted sm:max-w-xs">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or department" className="w-full min-w-0 bg-transparent text-ink outline-none" />
            </label>
            <Button variant="ok" size="sm" className="ml-auto" disabled={!chosen.length} onClick={bulk}>
              <Stamp size={14} /> Bulk approve{chosen.length ? ` (${chosen.length})` : ""}
            </Button>
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-y border-line bg-line-2/60 text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="w-10 px-5 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all validated"
                      checked={allOn}
                      disabled={!selectable.length}
                      onChange={() => setSel(allOn ? [] : selectable)}
                      className="h-4 w-4 accent-[var(--brand)]"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Faculty</th>
                  <th className="px-3 py-2.5 font-semibold">Department</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Self</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Dy Dir</th>
                  <th className="px-3 py-2.5 font-semibold">Band</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const s = scores(f);
                  const can = f.status === "validated";
                  const on = chosen.includes(f.id);
                  const reviewed = STATUS_META[f.status].step >= 2;
                  return (
                    <tr key={f.id} className={clsx("border-b border-line-2", on ? "bg-brand-soft/50" : "hover:bg-line-2/40")}>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${f.name}`}
                          disabled={!can}
                          checked={on}
                          onChange={() => setSel((x) => (on ? x.filter((i) => i !== f.id) : [...x, f.id]))}
                          className="h-4 w-4 accent-[var(--brand)] disabled:opacity-30"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={f.name} size={32} />
                          <div className="leading-tight">
                            <div className="font-semibold text-ink">{f.name}</div>
                            <div className="text-[11px] text-muted">{f.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Chip>{f.dept}</Chip>
                      </td>
                      <td className="tnum px-3 py-3 text-right text-ink-2">{STATUS_META[f.status].step >= 1 ? f1(s.fpi[0]) : "—"}</td>
                      <td className="tnum px-3 py-3 text-right font-bold">{reviewed ? f1(s.fpi[1]) : "—"}</td>
                      <td className="px-3 py-3">{reviewed ? <BandPill score={s.fpi[f.status === "validated" ? 1 : 2]} /> : <span className="text-muted">—</span>}</td>
                      <td className="px-3 py-3">
                        <StatusPill status={f.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button href={`/director/approvals/${f.id}`} size="sm" variant={can ? "primary" : "ghost"}>
                          {can ? "Open" : "View"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted">
                      {filter === "mine" ? "Nothing waiting for you. Every validated appraisal has been decided." : "Nothing matches these filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Ready for you" subtitle="Validated FPI · tap to see KRA rings">
            {withMe.length ? (
              <TeamPerformance list={withMe} level={1} hrefFor={(f) => `/director/approvals/${f.id}`} />
            ) : (
              <p className="text-sm text-muted">The queue is clear.</p>
            )}
          </Card>
          {returned.length > 0 && (
            <Card title="Sent back" subtitle="Waiting on the Deputy Director or faculty">
              <ul className="flex flex-col gap-3">
                {returned.map((f) => {
                  const last = [...f.events].reverse().find((e) => e.action.startsWith("Returned"));
                  return (
                    <li key={f.id} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-coral-soft text-coral">
                        <CornerUpLeft size={15} />
                      </span>
                      <div className="min-w-0 text-sm">
                        <div className="font-semibold text-ink">{f.name}</div>
                        {last?.note && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{last.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({ className, label, value }: { className: string; label: string; value: number }) {
  return (
    <span className={clsx("inline-flex items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-sm font-semibold text-ink", className)}>
      {label}
      <span className="tnum grid h-8 min-w-8 place-items-center rounded-full bg-white px-2 text-base font-extrabold">{value}</span>
    </span>
  );
}
