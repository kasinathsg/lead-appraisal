"use client";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, KeyRound, MoreHorizontal, Pencil, Search, ShieldCheck, UserPlus, UserX, UserCheck, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { STAFF } from "@/lib/mock";
import { FW } from "@/lib/framework";
import { Avatar, Button, Card, Chip, PageHeader, type Tone } from "@/components/ui";
import { Drawer, Field, inputCls, useToast } from "@/components/admin/overlay";

interface UserRow {
  id: string;
  name: string;
  empId: string;
  email: string;
  designation: string;
  dept: string;
  roles: string[];
  active: boolean;
}

const ROLE_TONE: Record<string, Tone> = { Faculty: "brand", "Deputy Director": "violet", Director: "sun", Admin: "mint" };
const ROLES = ["Faculty", "Deputy Director", "Director", "Admin"];

export default function UsersPage() {
  const { faculty } = useStore();
  const { toast, node: toastNode } = useToast();
  const base = useMemo<UserRow[]>(
    () => [
      ...STAFF.map((s, i) => ({ id: s.id, name: s.name, empId: `LEAD-S-00${i + 1}`, email: s.email, designation: s.role === "Admin" ? "IQAC Coordinator" : s.role, dept: "Administration", roles: s.role === "Deputy Director" ? ["Deputy Director", "Faculty"] : [s.role], active: true })),
      ...faculty.map((f) => ({ id: f.id, name: f.name, empId: f.empId, email: f.email, designation: f.designation, dept: f.dept, roles: ["Faculty"], active: true })),
    ],
    [faculty],
  );
  const [added, setAdded] = useState<UserRow[]>([]);
  const [inactive, setInactive] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [dept, setDept] = useState("All");
  const [desig, setDesig] = useState("All");
  const [drawer, setDrawer] = useState<null | "add" | "import" | UserRow>(null);
  const [menu, setMenu] = useState<string | null>(null);

  const users = [...base, ...added].map((u) => ({ ...u, active: !inactive.includes(u.id) }));
  const rows = users.filter(
    (u) =>
      (role === "All" || u.roles.includes(role)) &&
      (dept === "All" || u.dept === dept) &&
      (desig === "All" || u.designation === desig) &&
      (!q || (u.name + u.email + u.empId).toLowerCase().includes(q.toLowerCase())),
  );
  const count = (r: string) => users.filter((u) => u.roles.includes(r)).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin · IQAC"
        title="Users & roles"
        subtitle="Everyone who takes part in appraisals, their roles and who reviews them."
        actions={
          <>
            <Button onClick={() => setDrawer("import")}>
              <FileUp size={16} /> Import CSV
            </Button>
            <Button variant="primary" onClick={() => setDrawer("add")}>
              <UserPlus size={16} /> Add user
            </Button>
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3 text-[13px] text-ink-2">
        <Info size={16} className="mt-0.5 shrink-0 text-brand" />
        Demo view. Sign-in, password reset emails and role permissions are built in Wave 1; changes here are kept only on this screen.
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {ROLES.map((r, i) => (
          <button key={r} onClick={() => setRole(role === r ? "All" : r)} className={clsx("card flex items-center justify-between p-5 text-left transition", role === r && "ring-2 ring-brand")}>
            <div>
              <div className="text-xs font-medium text-muted">{r}</div>
              <div className="tnum text-3xl font-extrabold tracking-tight">{count(r)}</div>
            </div>
            <span className={clsx("grid h-11 w-11 place-items-center rounded-2xl", ["bg-brand-soft text-brand", "bg-violet-soft text-violet", "bg-sun-soft text-[#8a6a00]", "bg-mint-soft text-[#0b7f5f]"][i])}>
              <ShieldCheck size={20} />
            </span>
          </button>
        ))}
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <h3 className="mr-auto text-[15px] font-bold">
            All users <span className="tnum font-medium text-muted">({rows.length})</span>
          </h3>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-line px-3 text-sm sm:w-56">
            <Search size={15} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="w-full bg-transparent outline-none" />
          </label>
          <Select value={role} onChange={setRole} options={["All", ...ROLES]} label="All roles" />
          <Select value={dept} onChange={setDept} options={["All", ...FW.lists.Department, "Administration"]} label="All departments" />
          <Select value={desig} onChange={setDesig} options={["All", ...FW.designations]} label="All designations" />
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead>
              <tr className="bg-line-2/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-3">User</th>
                <th className="px-3 py-3">Emp ID</th>
                <th className="px-3 py-3">Designation</th>
                <th className="px-3 py-3">Department</th>
                <th className="px-3 py-3">Roles</th>
                <th className="px-3 py-3">Reporting line</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className={clsx("border-t border-line-2 hover:bg-line-2/40", !u.active && "opacity-55")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size={34} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{u.name}</div>
                        <div className="truncate text-[11px] text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tnum px-3 py-3 text-ink-2">{u.empId}</td>
                  <td className="px-3 py-3 text-ink-2">{u.designation}</td>
                  <td className="px-3 py-3 text-ink-2">{u.dept}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Chip key={r} tone={ROLE_TONE[r]}>
                          {r}
                        </Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-muted">{u.roles.includes("Faculty") && !u.roles.includes("Deputy Director") ? "→ Deputy Director → Director" : u.roles.includes("Deputy Director") ? "→ Director" : "—"}</td>
                  <td className="px-3 py-3">
                    <Chip tone={u.active ? "ok" : "muted"} dot>
                      {u.active ? "Active" : "Inactive"}
                    </Chip>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RowMenu
                      open={menu === u.id}
                      setOpen={(o) => setMenu(o ? u.id : null)}
                      active={u.active}
                      onEdit={() => setDrawer(u)}
                      onReset={() => toast(`Reset link sent to ${u.email}`)}
                      onToggle={() => {
                        setInactive((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]));
                        toast(`${u.name} ${u.active ? "deactivated" : "reactivated"}`);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <UserDrawer
        state={drawer}
        onClose={() => setDrawer(null)}
        onSave={(u, isNew) => {
          if (isNew) setAdded((a) => [...a, u]);
          setDrawer(null);
          toast(isNew ? `${u.name} added · invite sent to ${u.email}` : `${u.name} updated`);
        }}
        onImport={() => {
          setDrawer(null);
          toast("Import preview: 0 errors · bulk import arrives in Wave 8");
        }}
      />
      {toastNode}
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink-2 outline-none">
      {options.map((o) => (
        <option key={o} value={o}>
          {o === "All" ? label : o}
        </option>
      ))}
    </select>
  );
}

function RowMenu({ open, setOpen, active, onEdit, onReset, onToggle }: { open: boolean; setOpen: (o: boolean) => void; active: boolean; onEdit: () => void; onReset: () => void; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen]);
  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-line-2";
  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(!open)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:bg-line-2 hover:text-ink" aria-label="Actions">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-line bg-white p-1 text-ink shadow-xl">
          <button className={item} onClick={() => (setOpen(false), onEdit())}>
            <Pencil size={14} /> Edit
          </button>
          <button className={item} onClick={() => (setOpen(false), onReset())}>
            <KeyRound size={14} /> Reset password
          </button>
          <button className={clsx(item, active ? "text-danger" : "text-ok")} onClick={() => (setOpen(false), onToggle())}>
            {active ? <UserX size={14} /> : <UserCheck size={14} />} {active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      )}
    </div>
  );
}

function UserDrawer({ state, onClose, onSave, onImport }: { state: null | "add" | "import" | UserRow; onClose: () => void; onSave: (u: UserRow, isNew: boolean) => void; onImport: () => void }) {
  const editing = state && typeof state === "object" ? state : null;
  const [form, setForm] = useState({ name: "", email: "", empId: "", designation: FW.designations[0], dept: FW.lists.Department[0], roles: ["Faculty"] });
  useEffect(() => {
    if (editing) setForm({ name: editing.name, email: editing.email, empId: editing.empId, designation: editing.designation, dept: editing.dept, roles: editing.roles });
    else setForm({ name: "", email: "", empId: "", designation: FW.designations[0], dept: FW.lists.Department[0], roles: ["Faculty"] });
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "import")
    return (
      <Drawer open onClose={onClose} title="Import users from CSV" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={onImport}>Validate file</Button></>}>
        <div className="flex flex-col gap-4">
          <div className="grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-10 text-center">
            <FileUp size={28} className="text-brand" />
            <div className="text-sm font-semibold">Drop a CSV file here</div>
            <div className="text-xs text-muted">Columns: name, email, emp_id, designation, department, role, reviewer_email</div>
          </div>
          <p className="text-xs text-muted">Each row is checked before anything is saved. You get a report of rows with problems, and new users receive an invite email to set their password.</p>
        </div>
      </Drawer>
    );

  const valid = form.name.trim() && /@/.test(form.email);
  return (
    <Drawer
      open={!!state}
      onClose={onClose}
      title={editing ? "Edit user" : "Add user"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => onSave({ id: editing?.id ?? "N" + Date.now(), name: form.name, email: form.email, empId: form.empId || "LEAD-F-NEW", designation: form.designation, dept: form.dept, roles: form.roles, active: true }, !editing)}
          >
            {editing ? "Save changes" : "Add and send invite"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Full name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Firstname Lastname" />
        </Field>
        <Field label="Email" hint="Invite and password-reset links go to this address.">
          <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@lead.ac.in" />
        </Field>
        <Field label="Employee ID">
          <input className={inputCls} value={form.empId} onChange={(e) => setForm({ ...form, empId: e.target.value })} placeholder="LEAD-F-000" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Designation">
            <select className={inputCls} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
              {FW.designations.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Department">
            <select className={inputCls} value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
              {[...FW.lists.Department, "Administration"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-ink-2">Roles</div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => {
              const on = form.roles.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => setForm({ ...form, roles: on ? form.roles.filter((x) => x !== r) : [...form.roles, r] })}
                  className={clsx("rounded-full border px-3 py-1.5 text-xs font-semibold", on ? "border-brand bg-brand text-white" : "border-line text-ink-2 hover:bg-line-2")}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl bg-line-2 p-4 text-xs text-ink-2">
          <div className="mb-1 font-semibold text-ink">Reporting line</div>
          Faculty → Deputy Director (Academics) → Director. Can be changed per cycle.
        </div>
      </div>
    </Drawer>
  );
}
