"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { usePageTitle } from "@/components/usePageTitle";
import {
  Card,
  ErrorBox,
  ScoreBadge,
  Spinner,
  StatusBadge,
  SubjectChip,
} from "@/components/ui";
import type { LessonFilters } from "@/lib/types";

const PAGE_SIZE = 25;

const EMPTY_FILTERS: LessonFilters = {};

function formatDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds?: number): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function LessonsPage() {
  usePageTitle("Lessons");
  const router = useRouter();
  const [filters, setFilters] = useState<LessonFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [teacherName, setTeacherName] = useState<string | null>(null);

  // Seed the teacher filter from ?teacher=<id>&tname=<name> (set when arriving
  // from the Teachers page). Reading window.location avoids the useSearchParams
  // Suspense requirement in this fully client-rendered app.
  useEffect(() => {
    const applyTeacherParam = () => {
      const params = new URLSearchParams(window.location.search);
      const teacher = params.get("teacher");
      if (!teacher) return;
      setFilters((prev) => ({ ...prev, teacher }));
      setTeacherName(params.get("tname"));
    };
    applyTeacherParam();
  }, []);

  function clearTeacher() {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev };
      delete next.teacher;
      return next;
    });
    setTeacherName(null);
    router.replace("/lessons");
  }

  const loadFilters = useCallback(() => api.filters(), []);
  const filterOpts = useAuthedQuery(loadFilters, []);

  const loadLessons = useCallback(
    () => api.lessons(filters, page, PAGE_SIZE),
    [filters, page],
  );
  const lessons = useAuthedQuery(loadLessons, [filters, page]);

  // Schools available for the currently selected country (cascading filter).
  const schoolOptions = useMemo(() => {
    const all = filterOpts.data?.schools ?? [];
    const list = filters.country
      ? all.filter((s) => s.country === filters.country)
      : all;
    return Array.from(new Set(list.map((s) => s.school))).sort();
  }, [filterOpts.data, filters.country]);

  function updateFilter(key: keyof LessonFilters, value: string) {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined };
      // Reset school when country changes.
      if (key === "country") next.school = undefined;
      return next;
    });
  }

  function clearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  const total = lessons.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Lessons</h1>
          <p className="text-sm text-slate-500">
            Consolidated log of every recorded lesson.
          </p>
        </div>
        <a
          href={api.exportUrl(filters)}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Export to Excel
        </a>
      </header>

      {filters.teacher ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">
          <span>
            Showing lessons for{" "}
            <strong>{teacherName || "the selected teacher"}</strong>
          </span>
          <button
            onClick={clearTeacher}
            className="rounded-lg border border-teal-300 bg-white px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100"
          >
            Clear
          </button>
        </div>
      ) : null}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <FilterSelect
            label="Country"
            value={filters.country ?? ""}
            options={filterOpts.data?.countries ?? []}
            onChange={(v) => updateFilter("country", v)}
          />
          <FilterSelect
            label="School"
            value={filters.school ?? ""}
            options={schoolOptions}
            onChange={(v) => updateFilter("school", v)}
          />
          <FilterSelect
            label="Grade"
            value={filters.grade ?? ""}
            options={filterOpts.data?.grades ?? []}
            onChange={(v) => updateFilter("grade", v)}
          />
          <FilterSelect
            label="Subject"
            value={filters.subject ?? ""}
            options={filterOpts.data?.subjects ?? []}
            onChange={(v) => updateFilter("subject", v)}
          />
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            options={filterOpts.data?.statuses ?? []}
            onChange={(v) => updateFilter("status", v)}
          />
          <DateInput
            label="From"
            value={filters.start_date ?? ""}
            onChange={(v) => updateFilter("start_date", v)}
          />
          <DateInput
            label="To"
            value={filters.end_date ?? ""}
            onChange={(v) => updateFilter("end_date", v)}
          />
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Clear filters
            </button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0">
        {lessons.loading ? (
          <div className="px-5">
            <Spinner />
          </div>
        ) : lessons.error ? (
          <div className="p-5">
            <ErrorBox message={lessons.error} onRetry={lessons.reload} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>Date</Th>
                    <Th>Teacher</Th>
                    <Th>School</Th>
                    <Th>Country</Th>
                    <Th>Subject</Th>
                    <Th>Grade</Th>
                    <Th>Duration</Th>
                    <Th>Status</Th>
                    <Th>Score</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(lessons.data?.rows ?? []).map((row) => {
                    const open = () =>
                      router.push(`/lessons/${row.recording_id}`);
                    const who = row.teacher_name || row.teacher_username;
                    return (
                    <tr
                      key={row.recording_id}
                      onClick={open}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          open();
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`View lesson by ${who}${row.subject ? `, ${row.subject}` : ""}, ${formatDate(row.created_at)}`}
                      className="cursor-pointer hover:bg-slate-50 focus-visible:bg-teal-50"
                    >
                      <Td>{formatDate(row.created_at)}</Td>
                      <Td className="font-medium text-slate-900">{who}</Td>
                      <Td>{row.school_name ?? "—"}</Td>
                      <Td>{row.country ?? "—"}</Td>
                      <Td>
                        <SubjectChip subject={row.subject} />
                      </Td>
                      <Td>{row.grade_level ?? "—"}</Td>
                      <Td>{formatDuration(row.duration_seconds)}</Td>
                      <Td>
                        <StatusBadge status={row.status} />
                      </Td>
                      <Td>
                        <ScoreBadge score={row.overall_score} />
                      </Td>
                    </tr>
                    );
                  })}
                  {(lessons.data?.rows ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No lessons match these filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
              <span>
                {total > 0
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                      page * PAGE_SIZE,
                      total,
                    )} of ${total}`
                  : "0 results"}
              </span>
              <div className="flex items-center gap-2">
                <PageButton
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </PageButton>
                <span className="px-1">
                  Page {page} / {totalPages}
                </span>
                <PageButton
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </PageButton>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 font-semibold">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-slate-600 ${className}`}>{children}</td>;
}

function PageButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
