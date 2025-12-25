import type { PropsWithChildren, SelectHTMLAttributes } from "react";

const baseInputClasses =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30";

export const Card = ({ children }: PropsWithChildren) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/40">
    {children}
  </div>
);

export const Badge = ({ children }: PropsWithChildren) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
    {children}
  </span>
);

export const Button = ({
  children,
  onClick,
  type = "button",
}: PropsWithChildren<{ onClick?: () => void; type?: "button" | "submit" }>) => (
  <button
    type={type}
    onClick={onClick}
    className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
  >
    {children}
  </button>
);

export const Select = ({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`${baseInputClasses} ${className ?? ""}`.trim()} {...props}>
    {children}
  </select>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={baseInputClasses} {...props} />
);

export const Label = ({ children }: PropsWithChildren) => (
  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </label>
);

export const Switch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`h-7 w-14 rounded-full border border-slate-700 p-1 transition ${
      checked ? "bg-emerald-500" : "bg-slate-800"
    }`}
  >
    <span
      className={`block h-5 w-5 rounded-full bg-white shadow transition ${
        checked ? "translate-x-7" : "translate-x-0"
      }`}
    />
  </button>
);

export const Alert = ({ children }: PropsWithChildren) => (
  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
    {children}
  </div>
);
