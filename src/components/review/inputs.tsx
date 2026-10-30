"use client";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { FW, type FNode, type Val } from "@/lib/framework";
import { fmtVal } from "@/components/ui";

const blank = (v: Val | undefined) => v === null || v === undefined || v === "";

const BOX =
  "h-9 w-full rounded-xl border border-line bg-white px-2.5 text-[13px] font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-muted/80 focus:border-brand focus:ring-2 focus:ring-brand/15";

export function PctInput({ value, inherited, onChange }: { value: number | null; inherited?: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        inputMode="decimal"
        className={clsx(BOX, "tnum pr-7")}
        value={value == null ? "" : Math.round(value * 1000) / 10}
        placeholder={inherited == null ? "—" : String(Math.round(inherited * 1000) / 10)}
        onChange={(e) => {
          const t = e.target.value;
          if (t === "") return onChange(null);
          const n = Math.max(0, Math.min(100, Number(t)));
          onChange(Math.round(n * 10) / 1000);
        }}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">%</span>
    </div>
  );
}

/** raw-value editor for one level; blank = inherits the level below (shown as placeholder) */
export function ValueInput({
  n,
  value,
  inherited,
  editable,
  onChange,
}: {
  n: FNode;
  value: Val;
  inherited: Val;
  editable: boolean;
  onChange: (v: Val) => void;
}) {
  const isBlank = blank(value);
  if (!editable) {
    return (
      <div className="flex min-h-9 flex-col justify-center">
        <span className={clsx("tnum text-[13px] font-semibold", isBlank ? "text-muted" : "text-ink")}>{fmtVal(n, isBlank ? inherited : value)}</span>
        {isBlank && !blank(inherited) && <span className="text-[10px] font-medium text-muted">inherits</span>}
      </div>
    );
  }
  const hint = isBlank && !blank(inherited) ? <span className="mt-0.5 block text-[10px] font-medium text-muted">inherits {fmtVal(n, inherited)}</span> : null;

  switch (n.input) {
    case "pct":
      return (
        <div>
          <PctInput value={typeof value === "number" ? value : null} inherited={typeof inherited === "number" ? inherited : null} onChange={onChange} />
          {hint}
        </div>
      );
    case "count": {
      const cur = typeof value === "number" ? value : typeof inherited === "number" ? inherited : 0;
      const max = n.max_count ?? undefined;
      return (
        <div>
          <div className="flex h-9 items-center rounded-xl border border-line bg-white">
            <button type="button" aria-label="Decrease" className="grid h-full w-8 place-items-center text-muted hover:text-ink" onClick={() => onChange(Math.max(0, cur - 1))}>
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={0}
              max={max}
              className="tnum h-full w-full min-w-0 bg-transparent text-center text-[13px] font-semibold outline-none placeholder:text-muted/80"
              value={typeof value === "number" ? value : ""}
              placeholder={typeof inherited === "number" ? String(inherited) : "—"}
              onChange={(e) => {
                const t = e.target.value;
                if (t === "") return onChange(null);
                let v = Math.max(0, Math.round(Number(t)));
                if (max != null) v = Math.min(max, v);
                onChange(v);
              }}
            />
            <button
              type="button"
              aria-label="Increase"
              className="grid h-full w-8 place-items-center text-muted hover:text-ink"
              onClick={() => onChange(max != null ? Math.min(max, cur + 1) : cur + 1)}
            >
              <Plus size={14} />
            </button>
          </div>
          {hint}
        </div>
      );
    }
    case "level":
    case "amount":
      return (
        <div>
          <input
            type="number"
            min={0}
            max={n.input === "level" ? 3 : undefined}
            step={n.input === "level" ? 0.1 : 1000}
            className={clsx(BOX, "tnum")}
            value={typeof value === "number" ? value : ""}
            placeholder={typeof inherited === "number" ? String(inherited) : "—"}
            onChange={(e) => {
              const t = e.target.value;
              if (t === "") return onChange(null);
              let v = Math.max(0, Number(t));
              if (n.input === "level") v = Math.min(3, v);
              onChange(v);
            }}
          />
          {hint}
        </div>
      );
    case "rating":
      return (
        <div>
          <select className={clsx(BOX, "pr-6")} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">{blank(inherited) ? "Select rating" : `Inherit: ${inherited}`}</option>
            {FW.ratings.map((r) => (
              <option key={r.label} value={r.label}>
                {r.label} ({r.score})
              </option>
            ))}
          </select>
          {hint}
        </div>
      );
    case "yesno": {
      const eff = isBlank ? inherited : value;
      return (
        <div>
          <div className="inline-flex rounded-xl border border-line bg-line-2 p-1">
            {["Yes", "No"].map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => onChange(value === o ? null : o)}
                className={clsx(
                  "rounded-lg px-3 py-1 text-xs font-semibold transition",
                  eff === o ? (isBlank ? "bg-white/70 text-muted" : "bg-white text-ink shadow-sm") : "text-muted hover:text-ink",
                )}
              >
                {o}
              </button>
            ))}
          </div>
          {hint}
        </div>
      );
    }
    default:
      return <span className="text-muted">—</span>;
  }
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted"
    >
      <span className={clsx("relative h-5 w-9 rounded-full transition", on ? "bg-ok" : "bg-line")}>
        <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
      {on ? "Applicable" : "Not applicable"}
    </button>
  );
}
