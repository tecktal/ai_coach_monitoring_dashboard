"use client";

import { useCallback, useId, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { usePageTitle } from "@/components/usePageTitle";
import { Card, ErrorBox, Spinner } from "@/components/ui";

function formatDate(s?: string): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UsagePage() {
  usePageTitle("Usage");
  const countryId = useId();
  const [country, setCountry] = useState("");

  const loadFilters = useCallback(() => api.filters(), []);
  const filterOpts = useAuthedQuery(loadFilters, []);

  const loadUsage = useCallback(() => api.usage(country || undefined), [country]);
  const usage = useAuthedQuery(loadUsage, [country]);

  const rows = usage.data ?? [];
  const chartData = rows
    .filter((r) => r.school_name)
    .sort((a, b) => b.teacher_count - a.teacher_count)
    .slice(0, 12)
    .map((r) => ({
      school: r.school_name ?? "—",
      teachers: r.teacher_count,
      recordings: r.recording_count,
    }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usage by school</h1>
          <p className="text-sm text-slate-500">
            How many teachers per school are using the app, and how often.
          </p>
        </div>
        <div>
          <label
            htmlFor={countryId}
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Country
          </label>
          <select
            id={countryId}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All countries</option>
            {(filterOpts.data?.countries ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </header>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Teachers per school
        </h2>
        {usage.loading ? (
          <Spinner />
        ) : usage.error ? (
          <ErrorBox message={usage.error} onRetry={usage.reload} />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>
        ) : (
          <div
            className="h-80 w-full"
            role="img"
            aria-label={`Bar chart: teachers per school. ${chartData
              .map((d) => `${d.school}: ${d.teachers}`)
              .join("; ")}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="school"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={80}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="teachers" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-0">
        {usage.loading ? (
          <div className="px-5">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Country</th>
                  <th scope="col" className="px-4 py-3 font-semibold">School</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Teachers</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Recordings</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Last recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={`${r.country}-${r.school_name}-${i}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{r.country ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {r.school_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.teacher_count}</td>
                    <td className="px-4 py-3 text-slate-600">{r.recording_count}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(r.last_recording)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      No data.
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
