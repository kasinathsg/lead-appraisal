"use client";
import clsx from "clsx";
import { CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

/** lightweight toast: const { toast, node } = useToast(); toast("Saved"); render {node} */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);
  const toast = useCallback((m: string) => setMsg(m), []);
  const node = msg ? (
    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rise" role="status">
      <div className="flex items-center gap-2.5 rounded-2xl bg-night px-4 py-3 text-sm font-medium text-white shadow-2xl">
        <CheckCircle2 size={18} className="text-mint" />
        {msg}
      </div>
    </div>
  ) : null;
  return { toast, node };
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className={clsx("rise relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-line-2 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-line-2/50 px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-ink/30">
      <button aria-label="Close" className="flex-1 cursor-default" onClick={onClose} />
      <div className="rise flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-line-2 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={clsx("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition", checked ? "border-brand/40 bg-brand-soft text-brand" : "border-line bg-white text-ink-2 hover:bg-line-2")}>
      <input type="checkbox" className="accent-[var(--brand)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}
