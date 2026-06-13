"use client";

import { useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Globe,
  Mic,
  School,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { Card, ErrorBox, Spinner, StatCard } from "@/components/ui";

export default function OverviewPage() {
  const loadOverview = useCallback(() => api.overview(), []);
  const loadUsage = useCallback(() => api.usage(), []);

  const overview = useAuthedQuery(loadOverview, []);
  const usage = useAuthedQuery(loadUsage, []);

  // Top schools by recording count for the chart.
  const chartData = (usage.data ?? [])
    .filter((r) => r.school_name)
    .sort((a, b) => b.recording_count - a.recording_count)
    .slice(0, 8)
    .map((r) => ({
      school: r.school_name ?? "—",
      recordings: r.recording_count,
      teachers: r.teacher_count,
    }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">
          App adoption and usage at a glance.
        </p>
      </header>

      {overview.error ? <ErrorBox message={overview.error} /> : null}

      {overview.loading ? (
        <Spinner />
      ) : overview.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Teachers"
            value={overview.data.total_teachers}
            icon={Users}
            tint="teal"
          />
          <StatCard
            label="Schools"
            value={overview.data.total_schools}
            icon={School}
            tint="indigo"
          />
          <StatCard
            label="Countries"
            value={overview.data.total_countries}
            icon={Globe}
            tint="sky"
          />
          <StatCard
            label="Recordings"
            value={overview.data.total_recordings}
            icon={Mic}
            tint="violet"
          />
          <StatCard
            label="Lessons analyzed"
            value={overview.data.total_analyses}
            icon={BarChart3}
            tint="emerald"
          />
          <StatCard
            label="Active (7 days)"
            value={overview.data.active_teachers_7d}
            hint="Teachers who recorded in the last 7 days"
            icon={Activity}
            tint="amber"
          />
          <StatCard
            label="Active (30 days)"
            value={overview.data.active_teachers_30d}
            hint="Teachers who recorded in the last 30 days"
            icon={CalendarClock}
            tint="teal"
          />
        </div>
      ) : null}

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Top schools by recordings
        </h2>
        {usage.loading ? (
          <Spinner />
        ) : usage.error ? (
          <ErrorBox message={usage.error} />
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No recordings yet.
          </p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="school"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={70}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="recordings" fill="#14b8a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
