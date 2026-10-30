"use client";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarRange,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileStack,
  FolderLock,
  GraduationCap,
  History,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquareWarning,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  Users,
  Workflow,
  X,
  Megaphone,
} from "lucide-react";
import { ROLE_META, roleForPath, useStore, type Role } from "@/lib/store";
import { CURRENT_CYCLE, CYCLE_STAGES, TODAY } from "@/lib/mock";
import { Avatar } from "./ui";

type Item = { label: string; href: string; icon: React.ElementType; badge?: string };
type Group = { title?: string; items: Item[] };

function nav(role: Role, counts: { dd: number; dir: number }): Group[] {
  switch (role) {
    case "faculty":
      return [
        { items: [
          { label: "Dashboard", href: "/faculty", icon: LayoutDashboard },
          { label: "My Appraisal", href: "/faculty/appraisal", icon: ClipboardCheck },
          { label: "Review & Submit", href: "/faculty/submit", icon: Send },
        ] },
        { title: "My records", items: [
          { label: "My Courses", href: "/soon/courses", icon: GraduationCap },
          { label: "Evidence Locker", href: "/soon/evidence", icon: FolderLock },
          { label: "History", href: "/soon/history", icon: History },
          { label: "Appeals", href: "/soon/appeals", icon: MessageSquareWarning },
        ] },
        { title: "Help", items: [{ label: "How scoring works", href: "/guide", icon: BookOpen }] },
      ];
    case "dydir":
      return [
        { items: [{ label: "Review Queue", href: "/review", icon: ListChecks, badge: counts.dd ? String(counts.dd) : undefined }] },
        { title: "Team", items: [
          { label: "Team Analytics", href: "/director", icon: FileBarChart },
          { label: "My Appraisal", href: "/soon/my-appraisal", icon: ClipboardCheck },
        ] },
        { title: "Help", items: [{ label: "How scoring works", href: "/guide", icon: BookOpen }] },
      ];
    case "director":
      return [
        { items: [
          { label: "Institution Dashboard", href: "/director", icon: LayoutDashboard },
          { label: "Approvals", href: "/director/approvals", icon: Stamp, badge: counts.dir ? String(counts.dir) : undefined },
        ] },
        { title: "Insights", items: [
          { label: "Reports", href: "/soon/reports", icon: FileBarChart },
          { label: "Framework", href: "/admin/framework", icon: SlidersHorizontal },
        ] },
        { title: "Help", items: [{ label: "How scoring works", href: "/guide", icon: BookOpen }] },
      ];
    case "admin":
      return [
        { items: [{ label: "Cycles", href: "/admin", icon: CalendarRange }] },
        { title: "Organisation", items: [
          { label: "Users & Roles", href: "/admin/users", icon: Users },
          { label: "Framework Studio", href: "/admin/framework", icon: SlidersHorizontal },
          { label: "Data Imports", href: "/soon/imports", icon: Database },
        ] },
        { title: "System", items: [
          { label: "Workflow & Alerts", href: "/soon/workflow", icon: Workflow },
          { label: "Settings", href: "/soon/settings", icon: Settings },
          { label: "Audit Log", href: "/soon/audit", icon: ShieldCheck },
        ] },
      ];
  }
}

const daysLeft = (to: string) => Math.max(0, Math.round((new Date(to).getTime() - new Date(TODAY).getTime()) / 86400000));

export function Shell({ children }: { children: React.ReactNode }) {
  const { role, faculty, setRole, reset, hydrated } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // opening a page directly (or a bookmark) switches to the role that owns it
  const synced = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || synced.current === path) return; // react to page changes only, never undo a role switch
    synced.current = path;
    const r = roleForPath(path, role);
    if (r !== role) setRole(r);
  }, [path, role, hydrated, setRole]);
  const counts = {
    dd: faculty.filter((f) => f.status === "submitted" || f.status === "returned_dd").length,
    dir: faculty.filter((f) => f.status === "validated").length,
  };
  const groups = nav(role, counts);
  const all = groups.flatMap((g) => g.items);
  const active = all.filter((i) => path === i.href || path.startsWith(i.href + "/")).sort((a, b) => b.href.length - a.href.length)[0];
  useEffect(() => setOpen(false), [path]);
  const self = CYCLE_STAGES[0];

  const sidebar = (
    <aside className="flex h-full w-[248px] flex-col gap-5 overflow-y-auto border-r border-line bg-white px-4 py-5">
      <Link href={ROLE_META[role].home} className="flex items-center gap-3 px-2">
        <Image src="/logolead.png" alt="LEAD" width={74} height={30} priority />
        <span className="border-l border-line pl-3 text-[11px] font-semibold leading-tight text-muted">
          Faculty
          <br />
          Appraisal
        </span>
      </Link>
      <nav className="flex flex-col gap-5">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title && <div className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{g.title}</div>}
            <ul className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const on = active?.href === it.href;
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition",
                        on ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-line-2",
                      )}
                    >
                      <Icon size={18} strokeWidth={on ? 2.3 : 1.8} />
                      <span className="flex-1">{it.label}</span>
                      {it.badge && <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-white">{it.badge}</span>}
                      {it.href.startsWith("/soon") && <span className="text-[9.5px] font-semibold uppercase tracking-wide text-muted/80">soon</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-soft to-white p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
              <Megaphone size={14} />
            </span>
            {self.label} open
          </div>
          <p className="mt-2 text-xs text-ink-2">
            Closes in <b className="text-ink">{daysLeft(self.to)} days</b> · {CURRENT_CYCLE}
          </p>
        </div>
        <button onClick={reset} className="flex items-center gap-2 px-3 text-xs font-medium text-muted hover:text-ink">
          <RotateCcw size={13} /> Reset demo data
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-dvh">
      <div className="sticky top-0 hidden h-dvh lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full">{sidebar}</div>
          <button aria-label="Close menu" className="flex-1 bg-ink/30" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="rounded-lg p-2 hover:bg-line-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-ok" />
            {CURRENT_CYCLE}
            <span className="rounded-md bg-ok-soft px-1.5 py-px text-[10px] font-bold text-ok">ACTIVE</span>
          </div>
          <label className="ml-auto hidden w-72 items-center gap-2 rounded-xl border border-line bg-line-2/60 px-3 py-2 text-sm text-muted sm:flex">
            <Search size={16} />
            <input placeholder="Search faculty, KPIs…" className="w-full bg-transparent text-ink outline-none placeholder:text-muted" />
          </label>
          <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-2 hover:bg-line-2 sm:ml-0 ml-auto" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-coral ring-2 ring-white" />
          </button>
          <RoleSwitcher role={role} setRole={setRole} />
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function RoleSwitcher({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const m = ROLE_META[role];
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-white pl-1.5 pr-3 hover:bg-line-2">
        <Avatar name={m.person} size={30} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-ink">{m.person}</span>
          <span className="block text-[11px] text-muted">{m.label}</span>
        </span>
        <ChevronDown size={15} className="text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-line bg-white p-2 shadow-2xl">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Demo · switch role</span>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-ink" aria-label="Close">
              <X size={14} />
            </button>
          </div>
          {(Object.keys(ROLE_META) as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setOpen(false);
                router.push(ROLE_META[r].home);
              }}
              className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-line-2", r === role && "bg-brand-soft")}
            >
              <Avatar name={ROLE_META[r].person} size={30} />
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold">{ROLE_META[r].label}</span>
                <span className="block text-[11px] text-muted">{ROLE_META[r].person}</span>
              </span>
            </button>
          ))}
          <div className="mt-1 border-t border-line px-3 pt-2 text-[11px] text-muted">
            <FileStack size={11} className="mr-1 inline" /> Sign-in and permissions arrive in Wave 1.
          </div>
        </div>
      )}
    </div>
  );
}
