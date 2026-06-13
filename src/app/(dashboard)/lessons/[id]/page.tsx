"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { usePageTitle } from "@/components/usePageTitle";
import { Card, ErrorBox, Spinner, StatusBadge } from "@/components/ui";
import type { Analysis, ElementAnalysis } from "@/lib/types";

// The 9 TEACH elements grouped into their domains, with the app's display
// labels and the backend JSON keys.
const TEACH_DOMAINS: {
  domain: string;
  elements: { label: string; scoreKey: keyof Analysis; behKey: keyof Analysis }[];
}[] = [
  {
    domain: "Classroom Culture",
    elements: [
      { label: "Supportive Learning Environment", scoreKey: "supportive_environment_score", behKey: "supportive_environment_behaviors" },
      { label: "Positive Behavioral Expectations", scoreKey: "positive_expectations_score", behKey: "positive_expectations_behaviors" },
    ],
  },
  {
    domain: "Instruction",
    elements: [
      { label: "Lesson Facilitation", scoreKey: "lesson_facilitation_score", behKey: "lesson_facilitation_behaviors" },
      { label: "Checks for Understanding", scoreKey: "checks_understanding_score", behKey: "checks_understanding_behaviors" },
      { label: "Feedback", scoreKey: "feedback_score", behKey: "feedback_behaviors" },
      { label: "Critical Thinking", scoreKey: "critical_thinking_score", behKey: "critical_thinking_behaviors" },
    ],
  },
  {
    domain: "Socioemotional Skills",
    elements: [
      { label: "Autonomy", scoreKey: "autonomy_score", behKey: "autonomy_behaviors" },
      { label: "Perseverance", scoreKey: "perseverance_score", behKey: "perseverance_behaviors" },
      { label: "Social & Collaborative Skills", scoreKey: "social_collaborative_score", behKey: "social_collaborative_behaviors" },
    ],
  },
];

const SOL_AREAS: { key: keyof NonNullable<Analysis["science_of_learning"]>; label: string }[] = [
  { key: "clarity_and_cognitive_load", label: "Clarity & Cognitive Load" },
  { key: "student_engagement_and_retrieval_practice", label: "Engagement & Retrieval" },
  { key: "feedback_and_metacognition", label: "Feedback & Metacognition" },
];

function formatDate(s?: string): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(seconds?: number): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// Mirrors the app: score 0/null = N/A; a score of 1 with no real behaviors is
// treated as N/A to avoid a false "Needs Focus".
function effectiveScore(score?: number, el?: ElementAnalysis): number | null {
  const s = el?.score ?? score;
  if (s == null || s <= 0) return null;
  if (s === 1 && el) {
    const behs = el.behaviors ? Object.values(el.behaviors) : [];
    const allNA =
      behs.length === 0 ||
      behs.every((b) => ["n/a", "0", ""].includes((b.rating || "").toLowerCase()));
    if (allNA) return null;
  }
  return s;
}

function Md({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <div className="text-sm leading-relaxed text-slate-600 [&_a]:text-teal-700 [&_em]:italic [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

function ElementScore({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
        N/A
      </span>
    );
  }
  const style =
    value >= 4
      ? "bg-emerald-50 text-emerald-700"
      : value >= 3
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${style}`}>
      {value}
    </span>
  );
}

const RATING_STYLES: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-red-50 text-red-700",
};

function RatingBadge({ rating }: { rating: string }) {
  const style = RATING_STYLES[(rating || "").toLowerCase()] || "bg-slate-100 text-slate-500";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {rating || "N/A"}
    </span>
  );
}

function titleize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LessonDetailPage() {
  usePageTitle("Lesson");
  const params = useParams();
  const id = String(params.id);

  const load = useCallback(() => api.lessonDetail(id), [id]);
  const detail = useAuthedQuery(load, [id]);

  if (detail.loading) {
    return <Spinner />;
  }
  if (detail.error || !detail.data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorBox
          message={detail.error ?? "Lesson not found"}
          onRetry={detail.reload}
        />
      </div>
    );
  }

  const { recording, teacher, analysis } = detail.data;
  const warning = analysis?.time_on_learning?.content_warning;
  const teacherName = teacher
    ? `${teacher.first_name} ${teacher.last_name}`.trim() || teacher.username
    : "Unknown teacher";

  const metaParts = [
    recording.subject,
    recording.grade_level,
    formatDuration(recording.duration_seconds),
    formatDate(recording.created_at),
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
            {recording.title?.trim() || "Untitled lesson"}
          </h1>
          <StatusBadge status={recording.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {teacherName}
          {teacher?.school_name ? ` · ${teacher.school_name}` : ""}
          {teacher?.country ? ` · ${teacher.country}` : ""}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{metaParts.join(" · ")}</p>
      </div>

      {/* Audio player */}
      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-700">Lesson audio</p>
        <audio
          controls
          preload="none"
          src={api.lessonAudioUrl(id)}
          aria-label="Lesson audio player"
          className="w-full"
        >
          Your browser does not support audio playback.
        </audio>
      </Card>

      {warning?.message ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Note:</span> {warning.message}
        </div>
      ) : null}

      {!analysis ? (
        <Card>
          <p className="text-sm text-slate-500">
            This lesson has not been analyzed yet.
          </p>
        </Card>
      ) : (
        <>
          {/* Summary */}
          {analysis.summary ? (
            <Card>
              <h2 className="mb-2 text-lg font-semibold text-slate-800">Summary</h2>
              <Md>{analysis.summary}</Md>
            </Card>
          ) : null}

          {/* Strengths / Areas */}
          <div className="grid gap-4 md:grid-cols-2">
            <ListCard
              title="Strengths"
              accent="text-emerald-700"
              items={analysis.strengths}
            />
            <ListCard
              title="Areas for improvement"
              accent="text-amber-700"
              items={analysis.areas_for_improvement}
            />
          </div>

          {/* TEACH framework */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              TEACH framework
            </h2>
            <div className="space-y-6">
              {TEACH_DOMAINS.map((domain) => (
                <div key={domain.domain}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {domain.domain}
                  </p>
                  <div className="space-y-3">
                    {domain.elements.map((el) => {
                      const elem = analysis[el.behKey] as ElementAnalysis | undefined;
                      const rawScore = analysis[el.scoreKey] as number | undefined;
                      const score = effectiveScore(rawScore, elem);
                      return (
                        <ElementRow
                          key={el.label}
                          label={el.label}
                          score={score}
                          elem={elem}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Science of Learning */}
          {analysis.science_of_learning ? (
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Science of Learning
              </h2>
              <div className="space-y-4">
                {SOL_AREAS.map(({ key, label }) => {
                  const area = analysis.science_of_learning?.[key];
                  if (!area) return null;
                  return (
                    <div key={key} className="rounded-xl border border-slate-200 p-4">
                      <p className="mb-2 font-semibold text-slate-800">{label}</p>
                      {area.pros ? (
                        <div className="mb-2">
                          <p className="text-xs font-semibold uppercase text-emerald-600">Strengths</p>
                          <Md>{area.pros}</Md>
                        </div>
                      ) : null}
                      {area.cons ? (
                        <div className="mb-2">
                          <p className="text-xs font-semibold uppercase text-amber-600">Watch-outs</p>
                          <Md>{area.cons}</Md>
                        </div>
                      ) : null}
                      {area.feedback ? (
                        <div className="rounded-lg bg-teal-50 p-3">
                          <p className="text-xs font-semibold uppercase text-teal-700">Coach feedback</p>
                          <Md>{area.feedback}</Md>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Recommendations
              </h2>
              <div className="space-y-4">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{rec.title}</p>
                      <Md>{rec.description}</Md>
                      {rec.example ? (
                        <div className="mt-1 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">Example</p>
                          <Md>{rec.example}</Md>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/lessons"
      className="inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
    >
      ← Back to lessons
    </Link>
  );
}

function ListCard({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items?: string[];
}) {
  return (
    <Card>
      <h2 className={`mb-2 text-base font-semibold ${accent}`}>{title}</h2>
      {items && items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600">
              <span className={accent}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">None identified.</p>
      )}
    </Card>
  );
}

function ElementRow({
  label,
  score,
  elem,
}: {
  label: string;
  score: number | null;
  elem?: ElementAnalysis;
}) {
  const behaviors = elem?.behaviors ? Object.entries(elem.behaviors) : [];
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <ElementScore value={score} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{label}</p>
          {elem?.rationale ? <Md>{elem.rationale}</Md> : null}
        </div>
      </div>

      {behaviors.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-teal-700">
            Evidence &amp; behaviors ({behaviors.length})
          </summary>
          <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
            {behaviors.map(([key, b]) => (
              <div key={key}>
                <div className="flex items-center gap-2">
                  <RatingBadge rating={b.rating} />
                  <span className="text-sm font-medium text-slate-700">
                    {titleize(key)}
                  </span>
                </div>
                {b.instances_found && b.instances_found.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {b.instances_found.map((q, i) => (
                      <li
                        key={i}
                        className="border-l-2 border-slate-200 pl-3 text-sm italic text-slate-500"
                      >
                        “{q}”
                      </li>
                    ))}
                  </ul>
                ) : b.evidence ? (
                  <p className="mt-1 text-sm text-slate-500">{b.evidence}</p>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
