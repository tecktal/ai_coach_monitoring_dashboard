# AI Coach — Monitoring Dashboard

A web dashboard for the World Bank to monitor adoption and usage of the AI
Teaching Coach app: a consolidated log of every recorded lesson, filterable by
**country, school, grade, teacher, subject, status and date**, plus per-school
usage and a teacher roster. Built with **Next.js (App Router) + TypeScript +
Tailwind CSS + Recharts**.

It is a separate frontend that talks to the existing Go backend via new,
role-gated admin endpoints (`/api/v1/admin/*`). No direct database access.

## Pages

- **Overview** — headline counts (teachers, schools, countries, recordings,
  lessons analyzed, active teachers in last 7/30 days) + top schools chart.
- **Lessons** — the core consolidated log: filterable, paginated table with an
  **Export to Excel** button. Click any row to open the **lesson detail**: the
  full TEACH analysis (9 elements with rationale + evidence, Science of Learning,
  recommendations, strengths/areas) and an **audio player** for the recording.
- **Usage** — teachers-per-school chart and table (the "how many teachers per
  school and how often" question), filterable by country.
- **Teachers** — roster with recording counts and last-activity, filterable by
  country/school.
- **Users** *(admin only)* — manage who can access the dashboard by changing a
  user's role.

## Roles & access

Three roles, set on the user's account:

| Role | Access |
| --- | --- |
| `teacher` | App only — **no** dashboard access (default for app sign-ups). |
| `viewer` | Can view the dashboard (read-only). Cannot manage users. |
| `admin` | Full access — view the dashboard **and** manage users' roles. |

**Bootstrapping the first admin:** set `ADMIN_BOOTSTRAP_EMAIL` in the backend env
to an existing account's email and restart; it's promoted to `admin` on startup
(see `backend/.env.example`).

**Adding more people (e.g. World Bank team):** they create an account once in the
AI Coach app, then an admin opens the **Users** tab and sets their role to
`viewer` or `admin`. No env changes or redeploys needed. Guards prevent an admin
from removing their own access or demoting the last remaining admin.

## Requirements

- Node.js 20+
- The AI Coach Go backend running and reachable, with at least one **admin**
  account (see Bootstrapping above). The dashboard rejects `teacher` logins.

## Setup

```bash
npm install
cp .env.example .env.local   # then edit if your backend URL differs
npm run dev                  # http://localhost:3000
```

### Environment

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Go backend (no trailing slash, no `/api/v1`). Defaults to the production VM. |

## Auth

Admins sign in with their AI Coach username + password (`POST /api/v1/auth/login`).
The JWT is stored in `localStorage` and sent as a `Bearer` token. A login is
rejected client-side unless the returned user's `role` is `admin`, and the
backend independently enforces the admin role on every `/admin/*` request.

## Build & deploy

```bash
npm run build
npm start
```

Deploy as its own service (e.g. Vercel, or a container alongside the backend
behind the same reverse proxy). Set `NEXT_PUBLIC_API_BASE_URL` at build time.

> **Security note:** the backend is currently served over plain HTTP. Since this
> dashboard handles teacher PII, putting the backend behind HTTPS/TLS is strongly
> recommended before production use.
