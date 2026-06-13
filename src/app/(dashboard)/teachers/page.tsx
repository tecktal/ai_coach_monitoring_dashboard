"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { Card, ErrorBox, Spinner } from "@/components/ui";

function formatDate(s?: string): string {
  if (!s) return "Never";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeachersPage() {
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");

  const loadFilters = useCallback(() => api.filters(), []);
  const filterOpts = useAuthedQuery(loadFilters, []);

  const loadTeachers = useCallback(
    () => api.teachers(country || undefined, school || undefined),
    [country, school],
  );
  const teachers = useAuthedQuery(loadTeachers, [country, school]);

  const schoolOptions = useMemo(() => {
    const all = filterOpts.data?.schools ?? [];
    const list = country ? all.filter((s) => s.country === country) : all;
    return Array.from(new Set(list.map((s) => s.school))).sort();
  }, [filterOpts.data, country]);

  const rows = teachers.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
        <p className="text-sm text-slate-500">
          Registered teachers and their activity.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setSchool("");
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All countries</option>
              {(filterOpts.data?.countries ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              School
            </label>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All schools</option>
              {schoolOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        {teachers.loading ? (
          <div className="px-5">
            <Spinner />
          </div>
        ) : teachers.error ? (
          <div className="p-5">
            <ErrorBox message={teachers.error} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Teacher</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">School</th>
                  <th className="px-4 py-3 font-semibold">Country</th>
                  <th className="px-4 py-3 font-semibold">Recordings</th>
                  <th className="px-4 py-3 font-semibold">Last active</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {`${t.first_name} ${t.last_name}`.trim() || t.username}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.username}</td>
                    <td className="px-4 py-3 text-slate-600">{t.school_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{t.country ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{t.recording_count}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(t.last_activity)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No teachers match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
