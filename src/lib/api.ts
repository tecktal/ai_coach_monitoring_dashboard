import type {
  AdminFilterOptions,
  AdminOverview,
  LessonDetail,
  LessonFilters,
  LessonLogResult,
  LoginResponse,
  ManualScore,
  ManualScoreInput,
  Role,
  SchoolUsageRow,
  TeacherRosterRow,
  UserAdminRow,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://34.10.248.60:8080";

const API_PREFIX = "/api/v1";
const TOKEN_KEY = "ai_coach_admin_token";
const USER_KEY = "ai_coach_admin_user";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// Builds a query string from defined, non-empty filter values.
function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  async login(username: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  overview(): Promise<AdminOverview> {
    return request<AdminOverview>("/admin/overview");
  },

  filters(): Promise<AdminFilterOptions> {
    return request<AdminFilterOptions>("/admin/filters");
  },

  lessons(
    filters: LessonFilters,
    page: number,
    pageSize: number,
  ): Promise<LessonLogResult> {
    return request<LessonLogResult>(
      `/admin/lessons${toQuery({ ...filters, page, page_size: pageSize })}`,
    );
  },

  lessonDetail(id: string): Promise<LessonDetail> {
    return request<LessonDetail>(`/admin/lessons/${id}`);
  },

  // Audio uses the `token` query param so a native <audio> tag can stream it.
  lessonAudioUrl(id: string): string {
    const token = getToken() || "";
    return `${API_BASE}${API_PREFIX}/admin/lessons/${id}/audio${toQuery({ token })}`;
  },

  // The signed-in coach's manual score for a lesson (null if not scored yet).
  manualScore(id: string): Promise<ManualScore | null> {
    return request<ManualScore | null>(`/admin/lessons/${id}/manual-score`);
  },

  saveManualScore(id: string, body: ManualScoreInput): Promise<ManualScore> {
    return request<ManualScore>(`/admin/lessons/${id}/manual-score`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  // Per-lesson Excel (AI + the coach's manual scores + comparison). Uses the
  // `token` query param so a plain <a> download works.
  lessonExportUrl(id: string): string {
    const token = getToken() || "";
    return `${API_BASE}${API_PREFIX}/admin/lessons/${id}/export${toQuery({ token })}`;
  },

  usage(country?: string): Promise<SchoolUsageRow[]> {
    return request<SchoolUsageRow[]>(`/admin/usage${toQuery({ country })}`);
  },

  teachers(country?: string, school?: string): Promise<TeacherRosterRow[]> {
    return request<TeacherRosterRow[]>(
      `/admin/teachers${toQuery({ country, school })}`,
    );
  },

  users(q?: string): Promise<UserAdminRow[]> {
    return request<UserAdminRow[]>(`/admin/users${toQuery({ q })}`);
  },

  updateUserRole(id: string, role: Role): Promise<{ id: string; role: Role }> {
    return request<{ id: string; role: Role }>(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  // Export uses the `token` query param so the browser can download directly.
  exportUrl(filters: LessonFilters): string {
    const token = getToken() || "";
    return `${API_BASE}${API_PREFIX}/admin/export${toQuery({ ...filters, token })}`;
  },
};
