"use client";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { perfBand, BAND_COLOR } from "@/lib/scoring";
import { STATUS_META, type Status } from "@/lib/mock";
import type { FNode, Val } from "@/lib/framework";

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  pad = true,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={clsx("card min-w-0", pad && "p-5", className)}>
      {(title || action) && (
        <header className={clsx("mb-4 flex items-start justify-between gap-3", !pad && "px-5 pt-5")}>
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const TONES = {
  muted: "bg-line-2 text-ink-2 border-line",
  brand: "bg-brand-soft text-brand border-brand/20",
  violet: "bg-violet-soft text-violet border-violet/20",
  ok: "bg-ok-soft text-ok border-ok/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  danger: "bg-danger-soft text-danger border-danger/20",
  sun: "bg-sun-soft text-[#8a6a00] border-sun/40",
  mint: "bg-mint-soft text-[#0b7f5f] border-mint/30",
} as const;
export type Tone = keyof typeof TONES;

export function Chip({ tone = "muted", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <Chip tone={m.tone} dot>
      {m.label}
    </Chip>
  );
}

export function BandPill({ score, short }: { score: number; short?: boolean }) {
  const b = perfBand(score);
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: BAND_COLOR[b.code] + "1a", color: BAND_COLOR[b.code] }}
      title={b.band}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {short ? b.code : b.band}
    </span>
  );
}

const AV = ["#1f5bd8", "#7c5cfc", "#22c79a", "#ff7a59", "#e87ba4", "#eda100", "#2a78d6", "#4a3aa7"];
export function initials(name: string) {
  return name
    .replace(/^(Dr|Prof)\.\s*/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function Avatar({ name, size = 36, ring }: { name: string; size?: number; ring?: boolean }) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const c = AV[h % AV.length];
  return (
    <span
      className={clsx("inline-grid shrink-0 place-items-center rounded-full font-bold text-white", ring && "ring-2 ring-white")}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, ${c}, ${c}cc)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  return (
    <div className="flex items-center">
      {names.slice(0, max).map((n, i) => (
        <span key={n + i} className={clsx(i && "-ml-2.5")}>
          <Avatar name={n} size={30} ring />
        </span>
      ))}
      {names.length > max && (
        <span className="-ml-2.5 grid h-[30px] w-[30px] place-items-center rounded-full bg-ink text-[10px] font-bold text-white ring-2 ring-white">
          +{names.length - max}
        </span>
      )}
    </div>
  );
}

type BtnVariant = "primary" | "soft" | "ghost" | "danger" | "dark" | "ok";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand text-white hover:bg-[#1a4fc0] shadow-[0_6px_16px_-6px_rgba(31,91,216,.6)]",
  soft: "bg-brand-soft text-brand hover:bg-[#dde7fc]",
  ghost: "bg-white text-ink-2 border border-line hover:bg-line-2",
  danger: "bg-white text-danger border border-danger/30 hover:bg-danger-soft",
  dark: "bg-night text-white hover:bg-black",
  ok: "bg-ok text-white hover:bg-[#0e8c62] shadow-[0_6px_16px_-6px_rgba(18,161,113,.6)]",
};
export function Button({
  children,
  variant = "ghost",
  href,
  onClick,
  className,
  disabled,
  size = "md",
  type = "button",
}: {
  children: ReactNode;
  variant?: BtnVariant;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  type?: "button" | "submit";
}) {
  const cls = clsx(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    BTN[variant],
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-line-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-lg px-3 py-1 text-xs font-semibold transition",
            o.value === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Bar({ value, color = "var(--brand)", track = "var(--line-2)", h = 8 }: { value: number; color?: string; track?: string; h?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full" style={{ background: track, height: h }}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</div>}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">{children}</div>;
}

/* ---------- formatting ---------- */
export const f1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
export const pct = (x: number | null | undefined, d = 0) => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);
export function fmtVal(n: FNode, v: Val): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  switch (n.input) {
    case "pct":
      return pct(v);
    case "amount":
      return n.unit === "Rs." ? "₹" + v.toLocaleString("en-IN") : `${v} ${n.unit ?? ""}`.trim();
    case "level":
      return v.toFixed(1);
    default:
      return String(v);
  }
}
export function fmtDate(iso: string) {
  const d = new Date(iso.length <= 10 ? iso + "T00:00" : iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
