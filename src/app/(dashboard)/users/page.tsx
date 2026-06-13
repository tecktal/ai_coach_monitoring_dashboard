"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useAuthedQuery } from "@/components/useAuthedQuery";
import { Card, ErrorBox, RoleBadge, Spinner } from "@/components/ui";
import type { Role } from "@/lib/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "teacher", label: "Teacher (no access)" },
  { value: "viewer", label: "Viewer (read-only)" },
  { value: "admin", label: "Admin (full access)" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Guard: only admins manage users. Viewers are bounced to Overview rather
  // than hitting an admin-only endpoint (which would log them out).
  const isAdmin = user?.role === "admin";
  useEffect(() => {
    if (user && !isAdmin) router.replace("/overview");
  }, [user, isAdmin, router]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadUsers = useCallback(() => api.users(search || undefined), [search]);
  const users = useAuthedQuery(loadUsers, [search]);

  async function changeRole(id: string, role: Role) {
    setActionError(null);
    setBusyId(id);
    try {
      await api.updateUserRole(id, role);
      users.reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Failed to update role",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <p className="text-sm text-slate-500">
          Grant dashboard access by changing a user&apos;s role. Members create an
          account once in the app, then you promote them here.
        </p>
      </header>

      <Card>
        <div className="flex flex-wrap items-end gap-4 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Teacher</span> — app
            only, no dashboard.
          </p>
          <p>
            <span className="font-semibold text-sky-700">Viewer</span> — can view
            the dashboard.
          </p>
          <p>
            <span className="font-semibold text-teal-700">Admin</span> — view +
            manage users.
          </p>
        </div>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, username or email…"
          className="w-full max-w-sm rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Search
        </button>
      </form>

      {actionError ? <ErrorBox message={actionError} /> : null}

      <Card className="p-0">
        {users.loading ? (
          <div className="px-5">
            <Spinner />
          </div>
        ) : users.error ? (
          <div className="p-5">
            <ErrorBox message={users.error} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">School</th>
                  <th className="px-4 py-3 font-semibold">Country</th>
                  <th className="px-4 py-3 font-semibold">Current role</th>
                  <th className="px-4 py-3 font-semibold">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users.data ?? []).map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {`${u.first_name} ${u.last_name}`.trim() || u.username}
                        {isSelf ? (
                          <span className="ml-1 text-xs text-slate-400">(you)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.username}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{u.school_name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{u.country ?? "—"}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf || busyId === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          title={
                            isSelf
                              ? "You cannot change your own role"
                              : undefined
                          }
                          className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {(users.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        Joined dates and activity are available on the Teachers tab.
      </p>
    </div>
  );
}
