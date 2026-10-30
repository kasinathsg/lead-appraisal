"use client";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { FW, type FNode, type Val } from "@/lib/framework";

/** number input that stores % as a fraction */
export function NumberField({ n, value, onChange, disabled, placeholder }: { n: FNode; value: Val; onChange: (v: Val) => void; disabled?: boolean; placeholder?: string }) {
  const isPct = n.input === "pct";
  const shown = typeof value === "number" ? (isPct ? +(value * 100).toFixed(1) : value) : "";
  const suffix = isPct ? "%" : n.input === "amount" ? (n.unit === "Rs." ? "₹" : n.unit) : n.input === "level" ? "/ 3" : "";
  return (
    <div className={clsx("flex h-11 items-center rounded-xl border bg-white px-3 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10", disabled ? "border-line bg-line-2" : "border-line")}>
      {suffix === "₹" && <span className="mr-1 text-sm font-semibold text-muted">₹</span>}
      <input
        type="number"
        inputMode="decimal"
        disabled={disabled}
        value={shown}
        placeholder={placeholder ?? "—"}
        step={n.input === "level" ? 0.1 : isPct ? 1 : 1}
        min={0}
        max={isPct ? 100 : n.input === "level" ? 3 : n.max_count ?? undefined}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          let x = Number(raw);
          if (Number.isNaN(x)) return;
          if (isPct) x = Math.min(100, Math.max(0, x)) / 100;
          if (n.input === "level") x = Math.min(3, Math.max(0, x));
          if (n.max_count != null) x = Math.min(n.max_count, x);
          onChange(Math.max(0, x));
        }}
        className="tnum w-full min-w-0 bg-transparent text-[15px] font-bold text-ink outline-none placeholder:font-medium placeholder:text-muted disabled:text-ink-2"
      />
      {suffix && suffix !== "₹" && <span className="ml-1 shrink-0 text-xs font-semibold text-muted">{suffix}</span>}
    </div>
  );
}

export function Stepper({ value, onChange, disabled, max }: { value: Val; onChange: (v: Val) => void; disabled?: boolean; max?: number | null }) {
  const v = typeof value === "number" ? value : 0;
  const set = (x: number) => onChange(Math.max(0, max != null ? Math.min(max, x) : x));
  return (
    <div className={clsx("inline-flex h-9 items-center rounded-xl border border-line bg-white", disabled && "opacity-60")}>
      <button type="button" disabled={disabled || v <= 0} onClick={() => set(v - 1)} className="grid h-full w-9 place-items-center text-muted hover:text-ink disabled:opacity-40" aria-label="Decrease">
        <Minus size={14} />
      </button>
      <span className="tnum w-8 text-center text-sm font-bold text-ink">{value === null || value === undefined ? "–" : v}</span>
      <button type="button" disabled={disabled || (max != null && v >= max)} onClick={() => set(v + 1)} className="grid h-full w-9 place-items-center text-muted hover:text-ink disabled:opacity-40" aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  );
}

export function YesNo({ value, onChange, disabled }: { value: Val; onChange: (v: Val) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-line-2 p-1">
      {["Yes", "No"].map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o)}
          className={clsx("rounded-lg px-3.5 py-1 text-xs font-bold transition", value === o ? (o === "Yes" ? "bg-ok text-white" : "bg-white text-ink shadow-sm") : "text-muted")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const RATING_TONE = ["#0e9f6e", "#2a78d6", "#7c5cfc", "#f59e0b", "#e5484d"];
/** 5-level rubric picker: each level shows its written descriptor */
export function RubricPicker({ n, value, onChange, disabled, compact }: { n: FNode; value: Val; onChange: (v: Val) => void; disabled?: boolean; compact?: boolean }) {
  return (
    // sized by the panel it sits in (container query), not the screen: 5 across when roomy, 3 + 2 on small laptops, stacked on phones
    <div className="@container">
    <div className="grid grid-cols-1 gap-2 @md:grid-cols-3 @3xl:grid-cols-5">
      {FW.ratings.map((r, i) => {
        const on = value === r.label;
        return (
          <button
            key={r.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(on ? null : r.label)}
            className={clsx(
              "flex min-w-0 flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition disabled:cursor-default",
              on ? "border-transparent text-white shadow-lg" : "border-line bg-white hover:border-ink/20",
            )}
            style={on ? { background: RATING_TONE[i] } : undefined}
          >
            <span className={clsx("tnum rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", on ? "bg-white/20 text-white" : "text-white")} style={on ? undefined : { background: RATING_TONE[i] }}>
              {r.score} pts
            </span>
            <span className={clsx("text-[12.5px] font-bold leading-tight [overflow-wrap:anywhere]", on ? "text-white" : "text-ink")}>{r.label}</span>
            {!compact && n.rubric?.[i] && <span className={clsx("text-[11px] leading-snug", on ? "text-white/90" : "text-muted")}>{n.rubric[i]}</span>}
          </button>
        );
      })}
    </div>
    </div>
  );
}

/** the band table as a ladder, highlighting where the current value lands */
export function BandLadder({ n, value }: { n: FNode; value: Val }) {
  const t = n.table ? FW.bands[n.table] : undefined;
  if (!t) return null;
  const fmt = (x: number) => (t.kind === "pct" ? `${Math.round(x * 100)}%` : t.kind === "amount" ? `₹${x.toLocaleString("en-IN")}` : `${x}`);
  let hit = -1;
  if (typeof value === "number") t.rows.forEach(([th], i) => value >= th - 1e-9 && (hit = i));
  return (
    <div className="flex flex-wrap gap-1.5">
      {t.rows.map(([th, sc], i) => (
        <span
          key={i}
          className={clsx(
            "tnum inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition",
            i === hit ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2",
          )}
        >
          {i === 0 ? (t.rows[1] && t.rows[1][1] < sc ? fmt(th) : `< ${fmt(t.rows[1]?.[0] ?? th)}`) : `≥ ${fmt(th)}`}
          <span className={clsx("rounded px-1", i === hit ? "bg-white/20" : "bg-line-2 text-muted")}>{sc}</span>
        </span>
      ))}
    </div>
  );
}
