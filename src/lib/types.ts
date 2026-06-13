// TypeScript mirrors of the backend admin DTOs (see backend/internal/models/models.go).

export interface User {
  id: string;
  username: string;
  email?: string;
  first_name: string;
  last_name: string;
  role: string;
  school_name?: string;
  country?: string;
  language_preference: string;
  email_verified: boolean;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AdminOverview {
  total_teachers: number;
  total_schools: number;
  total_countries: number;
  total_recordings: number;
  total_analyses: number;
  active_teachers_7d: number;
  active_teachers_30d: number;
}

export interface LessonLogRow {
  recording_id: string;
  title?: string;
  subject?: string;
  grade_level?: string;
  language: string;
  status: string;
  duration_seconds?: number;
  created_at?: string;
  teacher_id: string;
  teacher_name: string;
  teacher_username: string;
  school_name?: string;
  country?: string;
  has_analysis: boolean;
  overall_score?: number;
}

export interface LessonLogResult {
  rows: LessonLogRow[];
  total: number;
  page: number;
  page_size: number;
}

export interface SchoolUsageRow {
  country?: string;
  school_name?: string;
  teacher_count: number;
  recording_count: number;
  last_recording?: string;
}

export interface TeacherRosterRow {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  school_name?: string;
  country?: string;
  recording_count: number;
  last_activity?: string;
  created_at: string;
}

export type Role = "teacher" | "viewer" | "admin";

export interface UserAdminRow {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  role: Role;
  school_name?: string;
  country?: string;
  recording_count: number;
  last_activity?: string;
  created_at: string;
}

export interface SchoolOption {
  country: string;
  school: string;
}

export interface AdminFilterOptions {
  countries: string[];
  schools: SchoolOption[];
  grades: string[];
  subjects: string[];
  statuses: string[];
}

// ---- Lesson detail (analysis + audio) ----

export interface BehaviorRating {
  rating: string; // High | Medium | Low | N/A | 0
  evidence: string;
  count?: number;
  instances_found?: string[];
  limitations?: string;
  sub_behaviors?: Record<string, string>;
}

export interface ElementAnalysis {
  score: number; // 0-5
  rationale: string;
  limitations_noted?: string;
  behaviors?: Record<string, BehaviorRating>;
}

export interface Recommendation {
  title: string;
  description: string;
  example?: string;
}

export interface ScienceOfLearningArea {
  pros?: string;
  cons?: string;
  feedback?: string;
}

export interface ScienceOfLearning {
  clarity_and_cognitive_load?: ScienceOfLearningArea;
  student_engagement_and_retrieval_practice?: ScienceOfLearningArea;
  feedback_and_metacognition?: ScienceOfLearningArea;
}

export interface ContentWarning {
  type?: string;
  message?: string;
}

export interface Analysis {
  id: string;
  recording_id: string;
  time_on_learning?: { content_warning?: ContentWarning } & Record<string, unknown>;
  overall_score?: number;
  summary?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  recommendations?: Recommendation[];
  science_of_learning?: ScienceOfLearning;
  created_at: string;

  // 9 element scores
  supportive_environment_score?: number;
  positive_expectations_score?: number;
  lesson_facilitation_score?: number;
  checks_understanding_score?: number;
  feedback_score?: number;
  critical_thinking_score?: number;
  autonomy_score?: number;
  perseverance_score?: number;
  social_collaborative_score?: number;

  // 9 element analysis objects
  supportive_environment_behaviors?: ElementAnalysis;
  positive_expectations_behaviors?: ElementAnalysis;
  lesson_facilitation_behaviors?: ElementAnalysis;
  checks_understanding_behaviors?: ElementAnalysis;
  feedback_behaviors?: ElementAnalysis;
  critical_thinking_behaviors?: ElementAnalysis;
  autonomy_behaviors?: ElementAnalysis;
  perseverance_behaviors?: ElementAnalysis;
  social_collaborative_behaviors?: ElementAnalysis;
}

export interface RecordingDetail {
  id: string;
  title?: string;
  subject?: string;
  grade_level?: string;
  language: string;
  status: string;
  duration_seconds?: number;
  created_at?: string;
}

export interface LessonTeacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  school_name?: string;
  country?: string;
}

export interface LessonDetail {
  recording: RecordingDetail;
  teacher?: LessonTeacher;
  analysis?: Analysis | null;
}

export interface LessonFilters {
  country?: string;
  school?: string;
  grade?: string;
  subject?: string;
  status?: string;
  teacher?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
}
