"use client";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { KRAS } from "@/lib/framework";
import type { Faculty } from "@/lib/mock";
import type { Level } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { Avatar, BandPill, f1 } from "@/components/ui";
import { Ring } from "@/components/charts";

export const submittedAt = (f: Faculty) => f.events.find((e) => e.action.startsWith("Submitted"))?.at;

/** reference-style list: one row per faculty; the open row turns into a dark card with a ring per KRA */
export function TeamPerformance({ list, level, hrefFor }: { list: Faculty[]; level: Level; hrefFor: (f: Faculty) => string }) {
  const { scores } = useStore();
  const [open, setOpen] = useState<string | null>(list[0]?.id ?? null);
  return (
    <ul className="flex flex-col gap-2">
      {list.map((f) => {
        const s = scores(f);
        const on = open === f.id;
        return (
          <li key={f.id} className={clsx("rounded-2xl transition", on ? "bg-night text-white shadow-xl" : "border border-line bg-white")}>
            <button type="button" onClick={() => setOpen(on ? null : f.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left" aria-expanded={on}>
              <Avatar name={f.name} size={38} />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13.5px] font-bold">{f.name}</span>
                <span className={clsx("flex items-center gap-1.5 text-[11.5px]", on ? "text-white/60" : "text-muted")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                  {f.designation} · {f.dept}
                </span>
              </span>
              <span className="tnum text-xl font-extrabold">{f1(s.fpi[level])}</span>
              {on ? <ChevronDown size={18} className="opacity-70" /> : <ChevronRight size={18} className="text-muted" />}
            </button>
            {on && (
              <div className="rise px-3.5 pb-4">
                <div className="flex flex-wrap justify-around gap-x-2 gap-y-4 rounded-xl bg-white/5 px-2 py-4">
                  {KRAS.map((k) => (
                    <Ring key={k.id} value={s.components[k.id][level]} color={k.color} size={64} stroke={7} label={k.short} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-white/60">Self {f1(s.fpi[0])}</span>
                  <span className="text-white/40">→</span>
                  <span className="font-semibold">Validated {f1(s.fpi[level])}</span>
                  <BandPill score={s.fpi[level]} short />
                  <Link href={hrefFor(f)} className="ml-auto rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-night hover:bg-white/90">
                    Open appraisal
                  </Link>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
