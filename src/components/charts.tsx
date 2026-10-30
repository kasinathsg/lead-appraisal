"use client";
import {
  Area,
  AreaChart,
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BAND_COLOR, perfBand } from "@/lib/scoring";
import { FW } from "@/lib/framework";

const AXIS = { fontSize: 11, fill: "#7a8499" };

/** semi-circular gauge with the five performance bands as the track */
export function Gauge({ value, size = 220, label = "FPI", sub }: { value: number; size?: number; label?: string; sub?: string }) {
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const pt = (v: number) => {
    const a = Math.PI * (1 - v / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const segs = FW.perfBands.map((b, i) => [b.min, FW.perfBands[i + 1]?.min ?? 100, BAND_COLOR[b.code]] as const);
  const band = perfBand(value);
  const [mx, my] = pt(Math.max(0.5, Math.min(99.5, value)));
  return (
    <div className="relative mx-auto" style={{ width: size, height: size / 2 + 34 }}>
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
        {segs.map(([a, b, c]) => (
          <path key={a} d={arc(a + 0.8, b - 0.8)} stroke={c} strokeOpacity={0.18} strokeWidth={16} fill="none" strokeLinecap="round" />
        ))}
        <path d={arc(0.5, Math.max(1, value))} stroke={BAND_COLOR[band.code]} strokeWidth={16} fill="none" strokeLinecap="round" />
        <circle cx={mx} cy={my} r={9} fill="#fff" stroke={BAND_COLOR[band.code]} strokeWidth={4} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="tnum text-[34px] font-extrabold leading-none tracking-tight text-ink">{value.toFixed(1)}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{sub ?? label}</div>
      </div>
    </div>
  );
}

/** ring progress with centred value */
export function Ring({ value, size = 76, stroke = 8, color = "var(--brand)", track = "rgba(255,255,255,.12)", label, text = "#fff" }: { value: number; size?: number; stroke?: number; color?: string; track?: string; label?: string; text?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
        <div className="tnum absolute inset-0 grid place-items-center text-sm font-bold" style={{ color: text }}>
          {Math.round(value)}
        </div>
      </div>
      {label && <div className="max-w-[90px] text-center text-[11px] font-medium leading-tight opacity-80">{label}</div>}
    </div>
  );
}

export function KraRadar({ data, height = 260 }: { data: { kra: string; self: number; final: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e6e9f1" />
        <PolarAngleAxis dataKey="kra" tick={{ fontSize: 11, fill: "#3b4660", fontWeight: 600 }} />
        <Radar name="Self" isAnimationActive={false} dataKey="self" stroke="#7c5cfc" fill="#7c5cfc" fillOpacity={0.12} strokeDasharray="4 3" strokeWidth={2} />
        <Radar name="Validated" isAnimationActive={false} dataKey="final" stroke="#1f5bd8" fill="#1f5bd8" fillOpacity={0.22} strokeWidth={2} />
        <Tooltip content={<Tip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** reference-style rounded columns: hatched = self claim, solid = validated, faint full-height track */
export function ClaimVsValidated({ data, height = 280 }: { data: { name: string; self: number; final: number; color?: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={-28} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#c9d6fb" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#4b7cf0" strokeWidth="3.4" />
          </pattern>
        </defs>
        <CartesianGrid vertical={false} stroke="#eef1f7" />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
        <YAxis domain={[0, 100]} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(31,91,216,.05)" }} />
        <RBar dataKey="self" isAnimationActive={false} name="Self claim" fill="url(#hatch)" radius={[10, 10, 10, 10]} barSize={28} background={{ fill: "#f3f5fa", radius: 10 }} />
        <RBar dataKey="final" isAnimationActive={false} name="Validated" radius={[10, 10, 10, 10]} barSize={28}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? "#1f5bd8"} />
          ))}
        </RBar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 200, center, centerSub }: { data: { name: string; value: number; color: string }[]; height?: number; center?: string; centerSub?: string }) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} isAnimationActive={false} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} cornerRadius={8} stroke="none" startAngle={90} endAngle={-270}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="tnum text-2xl font-extrabold text-ink">{center}</div>
            {centerSub && <div className="text-[11px] font-medium text-muted">{centerSub}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function TrendArea({ data, keys, height = 220, domain = [40, 100] }: { data: Record<string, string | number>[]; keys: { key: string; color: string; name: string; dashed?: boolean }[]; height?: number; domain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={k.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#eef1f7" />
        <XAxis dataKey="x" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis domain={domain} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} />
        {keys.map((k) => (
          <Area
            key={k.key}
            isAnimationActive={false}
            type="monotone"
            dataKey={k.key}
            name={k.name}
            stroke={k.color}
            strokeWidth={2.5}
            strokeDasharray={k.dashed ? "5 4" : undefined}
            fill={k.dashed ? "transparent" : `url(#g-${k.key})`}
            dot={{ r: 3.5, fill: "#fff", stroke: k.color, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-night px-3 py-2 text-xs text-white shadow-xl">
      {label != null && <div className="mb-1 font-semibold">{label}</div>}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color?.startsWith?.("url") ? "#4b7cf0" : p.payload?.color ?? p.color }} />
          <span className="opacity-75">{p.name}</span>
          <span className="tnum ml-auto pl-3 font-bold">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/** tiny inline sparkline (no axes) */
export function Spark({ values, color = "#1f5bd8", w = 90, h = 28 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 3 - ((v - min) / (max - min)) * (h - 6)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} aria-hidden>
      <path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  );
}
