"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ChevronDown, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { usePageTitle } from "@/components/usePageTitle";
import { Card, ErrorBox, Spinner, StatusBadge } from "@/components/ui";
import {
  TEACH_DOMAINS,
  TEACH_ELEMENTS,
  scoreColor,
  type ScoreKey,
} from "@/lib/teach";
import type {
  Analysis,
  ElementAnalysis,
  ManualScore,
  ManualScoreInput,
} from "@/lib/types";

const SOL_AREAS: { key: keyof NonNullable<Analysis["science_of_learning"]>; label: string }[] = [
  { key: "clarity_and_cognitive_load", label: "Clarity & Cognitive Load" },
  { key: "student_engagement_and_retrieval_practice", label: "Engagement & Retrieval" },
  { key: "feedback_and_metacognition", label: "Feedback & Metacognition" },
];

type TabKey = "ai" | "manual" | "compare";

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
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${scoreColor(value)}`}>
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
  const [tab, setTab] = useState<TabKey>("ai");

  const loadDetail = useCallback(() => api.lessonDetail(id), [id]);
  const detail = useAuthedQuery(loadDetail, [id]);

  const loadManual = useCallback(() => api.manualScore(id), [id]);
  const manualQuery = useAuthedQuery(loadManual, [id]);

  // A saved score overrides the loaded query result so the hero, manual tab and
  // comparison reflect a fresh save without a refetch — and without syncing
  // query data into state inside an effect.
  const [savedOverride, setSavedOverride] = useState<ManualScore | null>(null);
  const manual = savedOverride ?? manualQuery.data ?? null;

  if (detail.loading || manualQuery.loading) {
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

      {/* Sticky header: identity, audio, overall scores */}
      <div className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-slate-200 bg-slate-50/95 px-4 pb-4 pt-1 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
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
          {analysis ? (
            <a
              href={api.lessonExportUrl(id)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download Excel
            </a>
          ) : null}
        </div>

        <audio
          controls
          preload="none"
          src={api.lessonAudioUrl(id)}
          aria-label="Lesson audio player"
          className="w-full"
        >
          Your browser does not support audio playback.
        </audio>

        <OverallHero ai={analysis?.overall_score} you={manual?.overall_score} />

        <Tabs active={tab} onChange={setTab} />
      </div>

      {warning?.message ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Note:</span> {warning.message}
        </div>
      ) : null}

      {/* Panels stay mounted (toggled with `hidden`) so unsaved manual edits
          survive tab switches. */}
      <div>
        <div className={tab === "ai" ? "" : "hidden"}>
          <AiAnalysisTab analysis={analysis} />
        </div>
        <div className={tab === "manual" ? "" : "hidden"}>
          <ManualScoringTab
            recordingId={id}
            initial={manual}
            onSaved={(m) => setSavedOverride(m)}
          />
        </div>
        <div className={tab === "compare" ? "" : "hidden"}>
          <ComparisonTab
            analysis={analysis}
            manual={manual}
            onScore={() => setTab("manual")}
          />
        </div>
      </div>
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

function OverallHero({ ai, you }: { ai?: number; you?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:max-w-md">
      <ScoreTile label="AI overall" value={ai} />
      <ScoreTile label="Your overall" value={you} />
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800">
        {value == null ? "—" : value.toFixed(2)}
        <span className="ml-1 text-sm font-medium text-slate-400">/ 5.0</span>
      </p>
    </div>
  );
}

function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "ai", label: "AI Analysis" },
    { key: "manual", label: "Manual Scoring" },
    { key: "compare", label: "Comparison" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Lesson analysis views"
      className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1"
    >
      {tabs.map((t) => {
        const selected = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              selected
                ? "bg-teal-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// A short guidance banner telling the coach what a tab is for.
function TabIntro({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
      {children}
    </div>
  );
}

// A collapsible titled section. Header is always visible (so the page can be
// scanned by heading); the body toggles open/closed. `right` renders a badge or
// status at the right of the header.
function Section({
  title,
  description,
  defaultOpen = true,
  right,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </button>
      {open ? (
        <div className="border-t border-slate-100 px-5 py-4">{children}</div>
      ) : null}
    </Card>
  );
}

// Bulleted list without its own Card (used inside a Section).
function MiniList({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items?: string[];
}) {
  return (
    <div>
      <h3 className={`mb-2 text-sm font-semibold ${accent}`}>{title}</h3>
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Analysis tab
// ─────────────────────────────────────────────────────────────────────────────

function AiAnalysisTab({ analysis }: { analysis?: Analysis | null }) {
  if (!analysis) {
    return (
      <Card>
        <p className="text-sm text-slate-500">
          This lesson has not been analyzed yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <TabIntro>
        <span className="font-semibold">What the AI found.</span> Read this analysis,
        then open the <span className="font-semibold">Manual Scoring</span> tab to record
        your own assessment. Use <span className="font-semibold">Comparison</span> to see
        where you and the AI differ.
      </TabIntro>

      {analysis.summary ? (
        <Section title="Summary">
          <Md>{analysis.summary}</Md>
        </Section>
      ) : null}

      <Section title="Strengths & areas for improvement">
        <div className="grid gap-6 md:grid-cols-2">
          <MiniList title="Strengths" accent="text-emerald-700" items={analysis.strengths} />
          <MiniList
            title="Areas for improvement"
            accent="text-amber-700"
            items={analysis.areas_for_improvement}
          />
        </div>
      </Section>

      <div>
        <p className="mb-2 mt-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          TEACH framework — AI scores by domain
        </p>
        <div className="space-y-4">
          {TEACH_DOMAINS.map((domain) => (
            <Section
              key={domain.domain}
              title={domain.domain}
              description={`${domain.elements.length} element${domain.elements.length > 1 ? "s" : ""}`}
            >
              <div className="space-y-3">
                {domain.elements.map((el) => {
                  const elem = analysis[el.behKey] as ElementAnalysis | undefined;
                  const rawScore = analysis[el.scoreKey] as number | undefined;
                  const score = effectiveScore(rawScore, elem);
                  return (
                    <ElementRow key={el.label} label={el.label} score={score} elem={elem} />
                  );
                })}
              </div>
            </Section>
          ))}
        </div>
      </div>

      {analysis.science_of_learning ? (
        <Section
          title="Science of Learning"
          description="Evidence-based teaching practices"
          defaultOpen={false}
        >
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
        </Section>
      ) : null}

      {analysis.recommendations && analysis.recommendations.length > 0 ? (
        <Section
          title="Recommendations"
          description={`${analysis.recommendations.length} suggested next step${analysis.recommendations.length > 1 ? "s" : ""}`}
        >
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
        </Section>
      ) : null}
    </div>
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
                  <span className="text-sm font-medium text-slate-700">{titleize(key)}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Manual Scoring tab
// ─────────────────────────────────────────────────────────────────────────────

function ManualScoringTab({
  recordingId,
  initial,
  onSaved,
}: {
  recordingId: string;
  initial: ManualScore | null;
  onSaved: (m: ManualScore) => void;
}) {
  // The form is initialized once from the loaded score (the parent only renders
  // this after the score query has settled). State then persists across tab
  // switches; a save reflects straight back through `onSaved`.
  const [scores, setScores] = useState<Record<ScoreKey, number | null>>(
    () => scoresFrom(initial),
  );
  const [rationales, setRationales] = useState<Record<string, string>>(
    () => ({ ...(initial?.element_rationales ?? {}) }),
  );
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [strengths, setStrengths] = useState(initial?.strengths ?? "");
  const [areas, setAreas] = useState(initial?.areas_for_improvement ?? "");
  const [recommendations, setRecommendations] = useState(
    initial?.recommendations ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const overall = useMemo(() => {
    const vals = Object.values(scores).filter((v): v is number => v != null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [scores]);

  function setScore(key: ScoreKey, value: number | null) {
    setSaved(false);
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function setRationale(key: string, value: string) {
    setSaved(false);
    setRationales((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const trimmedRationales: Record<string, string> = {};
      for (const [k, v] of Object.entries(rationales)) {
        if (v.trim()) trimmedRationales[k] = v.trim();
      }
      const body: ManualScoreInput = {
        ...scores,
        element_rationales: trimmedRationales,
        summary: summary.trim() || undefined,
        strengths: strengths.trim() || undefined,
        areas_for_improvement: areas.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
      };
      const result = await api.saveManualScore(recordingId, body);
      onSaved(result);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save manual score");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <TabIntro>
        <span className="font-semibold">Your scoring.</span> For each TEACH element,
        tap a score <span className="font-semibold">1–5</span> (or leave{" "}
        <span className="font-semibold">N/A</span>) and add an optional rationale.
        The overall is averaged automatically. Add qualitative notes below, then{" "}
        <span className="font-semibold">Save scoring</span>.
      </TabIntro>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">Your overall score</p>
        <p className="text-sm text-slate-500">
          <span className="text-xl font-bold text-slate-800">
            {overall == null ? "—" : overall.toFixed(2)}
          </span>{" "}
          / 5.0
        </p>
      </div>

      {TEACH_DOMAINS.map((domain) => {
        const scored = domain.elements.filter(
          (el) => scores[el.scoreKey] != null,
        ).length;
        const total = domain.elements.length;
        return (
          <Section
            key={domain.domain}
            title={domain.domain}
            right={<ScoredBadge scored={scored} total={total} />}
          >
            <div className="space-y-3">
              {domain.elements.map((el) => (
                <div key={el.scoreKey} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-800">{el.label}</p>
                    <ScorePicker
                      value={scores[el.scoreKey]}
                      onChange={(v) => setScore(el.scoreKey, v)}
                    />
                  </div>
                  <textarea
                    value={rationales[el.rationaleKey] ?? ""}
                    onChange={(e) => setRationale(el.rationaleKey, e.target.value)}
                    placeholder="Why this score? (optional)"
                    rows={2}
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>
          </Section>
        );
      })}

      <Section
        title="Qualitative feedback"
        description="Optional written notes for the teacher"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <Field label="Summary" value={summary} onChange={(v) => { setSaved(false); setSummary(v); }} />
          <Field label="Strengths" value={strengths} onChange={(v) => { setSaved(false); setStrengths(v); }} />
          <Field label="Areas for improvement" value={areas} onChange={(v) => { setSaved(false); setAreas(v); }} />
          <Field
            label="Recommendations"
            value={recommendations}
            onChange={(v) => { setSaved(false); setRecommendations(v); }}
          />
        </div>
      </Section>

      {error ? <ErrorBox message={error} /> : null}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save scoring"}
        </button>
        {saved ? (
          <span className="text-sm font-medium text-emerald-600">Saved ✓</span>
        ) : null}
      </div>
    </div>
  );
}

// A small progress badge: how many elements in a domain have been scored.
function ScoredBadge({ scored, total }: { scored: number; total: number }) {
  const done = scored === total;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {scored}/{total} scored
    </span>
  );
}

function emptyScores(): Record<ScoreKey, number | null> {
  const out = {} as Record<ScoreKey, number | null>;
  for (const el of TEACH_ELEMENTS) out[el.scoreKey] = null;
  return out;
}

function scoresFrom(initial: ManualScore | null): Record<ScoreKey, number | null> {
  const out = emptyScores();
  if (initial) {
    for (const el of TEACH_ELEMENTS) {
      const v = initial[el.scoreKey];
      out[el.scoreKey] = typeof v === "number" ? v : null;
    }
  }
  return out;
}

function ScorePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-lg text-sm font-bold transition ${
              selected
                ? scoreColor(n)
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={value == null}
        onClick={() => onChange(null)}
        className={`h-8 rounded-lg px-2 text-xs font-semibold transition ${
          value == null
            ? "bg-slate-200 text-slate-600"
            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
        }`}
      >
        N/A
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison tab
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonTab({
  analysis,
  manual,
  onScore,
}: {
  analysis?: Analysis | null;
  manual: ManualScore | null;
  onScore: () => void;
}) {
  if (!analysis) {
    return (
      <Card>
        <p className="text-sm text-slate-500">
          AI analysis is not available, so there is nothing to compare against yet.
        </p>
      </Card>
    );
  }

  const rows = TEACH_ELEMENTS.map((el) => {
    const elem = analysis[el.behKey] as ElementAnalysis | undefined;
    const ai = effectiveScore(analysis[el.scoreKey] as number | undefined, elem);
    const youRaw = manual?.[el.scoreKey];
    const you = typeof youRaw === "number" ? youRaw : null;
    const diff = ai != null && you != null ? you - ai : null;
    return { label: el.label, ai, you, diff };
  });

  return (
    <div className="space-y-4">
      <TabIntro>
        <span className="font-semibold">You vs the AI.</span> Each row shows the AI
        score, your score, and the difference. A{" "}
        <span className="font-semibold">positive</span> difference means you scored
        higher than the AI.
      </TabIntro>

      {!manual ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>You haven&apos;t scored this lesson yet — add your scores to compare.</span>
          <button
            onClick={onScore}
            className="rounded-lg border border-teal-300 bg-white px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
          >
            Score now
          </button>
        </div>
      ) : null}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Element</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">AI</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">You</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="px-4 py-3 font-medium text-slate-700">{r.label}</td>
                  <td className="px-4 py-3 text-center"><Cell value={r.ai} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={r.you} /></td>
                  <td className="px-4 py-3 text-center"><DiffCell diff={r.diff} /></td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-3 text-slate-800">Overall</td>
                <td className="px-4 py-3 text-center text-slate-800">
                  {analysis.overall_score != null ? analysis.overall_score.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-center text-slate-800">
                  {manual?.overall_score != null ? manual.overall_score.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <DiffCell
                    diff={
                      analysis.overall_score != null && manual?.overall_score != null
                        ? manual.overall_score - analysis.overall_score
                        : null
                    }
                    decimals={2}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Cell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">N/A</span>;
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${scoreColor(value)}`}>
      {value}
    </span>
  );
}

function DiffCell({ diff, decimals = 0 }: { diff: number | null; decimals?: number }) {
  if (diff == null) return <span className="text-slate-400">—</span>;
  const rounded = Number(diff.toFixed(decimals));
  if (rounded === 0) return <span className="font-medium text-slate-500">0</span>;
  const style = rounded > 0 ? "text-emerald-700" : "text-red-700";
  const sign = rounded > 0 ? "+" : "";
  return <span className={`font-semibold ${style}`}>{sign}{rounded}</span>;
}
