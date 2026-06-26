// Single source of truth for the 9 TEACH elements, shared by the AI analysis,
// manual scoring, and comparison views. `scoreKey` is the score column name used
// on BOTH the AI `Analysis` and the coach's `ManualScore`; `rationaleKey` is the
// base key used in `ManualScore.element_rationales` and matches the backend.

import type { Analysis } from "./types";

export type ScoreKey =
  | "supportive_environment_score"
  | "positive_expectations_score"
  | "lesson_facilitation_score"
  | "checks_understanding_score"
  | "feedback_score"
  | "critical_thinking_score"
  | "autonomy_score"
  | "perseverance_score"
  | "social_collaborative_score";

export interface TeachElement {
  rationaleKey: string; // e.g. "feedback"
  label: string;
  scoreKey: ScoreKey; // e.g. "feedback_score"
  behKey: keyof Analysis; // AI behaviors object, e.g. "feedback_behaviors"
}

export interface TeachDomain {
  domain: string;
  elements: TeachElement[];
}

export const TEACH_DOMAINS: TeachDomain[] = [
  {
    domain: "Classroom Culture",
    elements: [
      { rationaleKey: "supportive_environment", label: "Supportive Learning Environment", scoreKey: "supportive_environment_score", behKey: "supportive_environment_behaviors" },
      { rationaleKey: "positive_expectations", label: "Positive Behavioral Expectations", scoreKey: "positive_expectations_score", behKey: "positive_expectations_behaviors" },
    ],
  },
  {
    domain: "Instruction",
    elements: [
      { rationaleKey: "lesson_facilitation", label: "Lesson Facilitation", scoreKey: "lesson_facilitation_score", behKey: "lesson_facilitation_behaviors" },
      { rationaleKey: "checks_understanding", label: "Checks for Understanding", scoreKey: "checks_understanding_score", behKey: "checks_understanding_behaviors" },
      { rationaleKey: "feedback", label: "Feedback", scoreKey: "feedback_score", behKey: "feedback_behaviors" },
      { rationaleKey: "critical_thinking", label: "Critical Thinking", scoreKey: "critical_thinking_score", behKey: "critical_thinking_behaviors" },
    ],
  },
  {
    domain: "Socioemotional Skills",
    elements: [
      { rationaleKey: "autonomy", label: "Autonomy", scoreKey: "autonomy_score", behKey: "autonomy_behaviors" },
      { rationaleKey: "perseverance", label: "Perseverance", scoreKey: "perseverance_score", behKey: "perseverance_behaviors" },
      { rationaleKey: "social_collaborative", label: "Social & Collaborative Skills", scoreKey: "social_collaborative_score", behKey: "social_collaborative_behaviors" },
    ],
  },
];

// Flat list of all 9 elements, in display order.
export const TEACH_ELEMENTS: TeachElement[] = TEACH_DOMAINS.flatMap((d) => d.elements);

// Tailwind classes for a 1-5 score, mirroring the app: >=4 green, >=3 amber, else red.
export function scoreColor(value: number | null | undefined): string {
  if (value == null) return "bg-slate-100 text-slate-500";
  if (value >= 4) return "bg-emerald-50 text-emerald-700";
  if (value >= 3) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}
