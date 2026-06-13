"use client";

import type { ReactNode } from "react";
import {
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// Tints for the StatCard icon chip, matching the app's tinted icon tiles.
const CHIP_TINTS: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600",
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tint = "teal",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tint?: keyof typeof CHIP_TINTS;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CHIP_TINTS[tint]}`}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 py-10 text-slate-500"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600"
      />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-teal-50 text-teal-700",
  processing: "bg-sky-50 text-sky-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  insufficient_audio: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      {status.replace(/_/g, " ")}
    </span>
  );
}

// Score color mirrors AppTheme.getScoreColor: >=4 green, >=3 amber, else red.
export function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-slate-400">—</span>;
  const style =
    score >= 4
      ? "bg-emerald-50 text-emerald-700"
      : score >= 3
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${style}`}
    >
      {score.toFixed(2)}
    </span>
  );
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-teal-50 text-teal-700",
  viewer: "bg-sky-50 text-sky-700",
  teacher: "bg-slate-100 text-slate-600",
};

export function RoleBadge({ role }: { role: string }) {
  const style = ROLE_STYLES[role] || "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {role}
    </span>
  );
}

// Subject color-coding, echoing the app's colored subject tiles. Falls back to
// a neutral slate chip for unknown subjects.
const SUBJECT_TINTS: { match: RegExp; style: string }[] = [
  { match: /math/i, style: "bg-indigo-50 text-indigo-700" },
  { match: /scien/i, style: "bg-emerald-50 text-emerald-700" },
  { match: /(read|literac|english|langue|français|french)/i, style: "bg-amber-50 text-amber-700" },
  { match: /(history|geograph|social)/i, style: "bg-sky-50 text-sky-700" },
  { match: /(art|music)/i, style: "bg-violet-50 text-violet-700" },
];

export function SubjectChip({ subject }: { subject?: string }) {
  if (!subject) return <span className="text-slate-400">—</span>;
  const found = SUBJECT_TINTS.find((s) => s.match.test(subject));
  const style = found?.style ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {subject}
    </span>
  );
}
