"use client";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ClipboardCheck,
  Database,
  FileBarChart,
  FolderLock,
  GraduationCap,
  History,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button, Chip } from "@/components/ui";

type Info = { title: string; wave: string; icon: React.ElementType; description: string; bullets: string[] };

const SOON: Record<string, Info> = {
  courses: {
    title: "My Courses",
    wave: "Wave 4",
    icon: GraduationCap,
    description: "Every course you teach this cycle, with the student feedback (TEI) and pass % that feed KPIs 1.3 and 2.3.2.",
    bullets: ["Course register filled from the timetable", "TEI and pass % imported from the feedback system and exam cell", "Deputy Director override per course, with the reason recorded", "Averages flow straight into your scorecard"],
  },
  evidence: {
    title: "Evidence Locker",
    wave: "Wave 4",
    icon: FolderLock,
    description: "One place for every certificate, letter and report you attach to a KPI, reusable across cycles.",
    bullets: ["Upload once, link to any KPI", "Reviewer marks each file as verified", "File type and size checks", "Secure links that expire"],
  },
  history: {
    title: "History",
    wave: "Wave 7",
    icon: History,
    description: "Your past cycles, final scores and downloadable scorecards.",
    bullets: ["FPI trend across cycles", "PDF scorecard for every closed cycle", "KRA-by-KRA comparison year on year", "Annual score combining both cycles"],
  },
  appeals: {
    title: "Appeals",
    wave: "Wave 5",
    icon: MessageSquareWarning,
    description: "Raise a formal appeal on a final score within the acknowledgement window.",
    bullets: ["Appeal on specific KPIs with a written reason", "Routed back to the Deputy Director for re-review", "Director gives the final decision", "Full history kept in the audit trail"],
  },
  "my-appraisal": {
    title: "My Appraisal",
    wave: "Wave 5",
    icon: ClipboardCheck,
    description: "Reviewers who also teach complete their own appraisal, reviewed directly by the Director.",
    bullets: ["Same KRA form as faculty", "Reviewed one level up", "Kept separate from the review queue"],
  },
  reports: {
    title: "Reports",
    wave: "Wave 7",
    icon: FileBarChart,
    description: "Ready-made reports for the Director, IQAC and accreditation teams.",
    bullets: ["Individual scorecard PDFs", "Department and institution summaries", "KPI analytics and completion tracker", "NAAC / NBA / NIRF evidence exports", "Excel export of all entries"],
  },
  imports: {
    title: "Data Imports",
    wave: "Wave 8",
    icon: Database,
    description: "Bring in system data so faculty do not have to type it.",
    bullets: ["Bulk user import from CSV", "TEI, pass %, attendance and LMS compliance imports", "Validation report before anything is saved", "Re-run imports safely"],
  },
  workflow: {
    title: "Workflow & Alerts",
    wave: "Wave 6",
    icon: Workflow,
    description: "Control the approval stages, deadlines and the messages people receive.",
    bullets: ["Stage order and optional HoD review", "Deadline reminders 3 days and 1 day before", "Escalation when a stage is overdue", "Editable email templates"],
  },
  settings: {
    title: "Settings",
    wave: "Wave 1",
    icon: Settings,
    description: "Institution-wide preferences.",
    bullets: ["Institution profile and branding", "Password policy and session timeout", "Upload limits and allowed file types", "Email server and optional Google / Microsoft sign-in", "Data retention"],
  },
  audit: {
    title: "Audit Log",
    wave: "Wave 1",
    icon: ShieldCheck,
    description: "Every change, who made it and when, with before and after values.",
    bullets: ["Search by user, faculty or KPI", "Workflow events and reopen reasons", "Export for audits", "Read-only and tamper-evident"],
  },
};

export default function SoonPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const info: Info = SOON[slug] ?? { title: "Coming soon", wave: "Later wave", icon: Sparkles, description: "This part of the product is planned in the development roadmap.", bullets: [] };
  const Icon = info.icon;
  return (
    <div className="grid min-h-[70dvh] place-items-center">
      <div className="card rise w-full max-w-xl overflow-hidden text-center">
        <div className="relative bg-gradient-to-br from-brand-soft via-white to-violet-soft px-6 pb-8 pt-10">
          <div className="relative mx-auto h-28 w-40">
            <span className="absolute left-0 top-6 grid h-12 w-12 -rotate-12 place-items-center rounded-2xl bg-sun text-ink shadow-lg">
              <Bell size={20} />
            </span>
            <span className="absolute right-0 top-4 grid h-12 w-12 rotate-12 place-items-center rounded-2xl bg-mint text-white shadow-lg">
              <Sparkles size={20} />
            </span>
            <span className="absolute left-1/2 top-0 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-3xl bg-brand text-white shadow-[0_14px_30px_-10px_rgba(31,91,216,.7)]">
              <Icon size={34} />
            </span>
          </div>
          <Chip tone="brand" className="mt-2">
            Arrives in {info.wave}
          </Chip>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{info.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{info.description}</p>
        </div>
        {info.bullets.length > 0 && (
          <ul className="flex flex-col gap-2.5 px-8 py-6 text-left text-[13.5px]">
            {info.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <span className="text-ink-2">{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-line px-6 py-4">
          <Button onClick={() => router.back()}>
            <ArrowLeft size={16} /> Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
