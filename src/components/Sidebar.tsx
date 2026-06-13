"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const NAV = [
  { href: "/overview", label: "Overview", adminOnly: false },
  { href: "/lessons", label: "Lessons", adminOnly: false },
  { href: "/usage", label: "Usage", adminOnly: false },
  { href: "/teachers", label: "Teachers", adminOnly: false },
  { href: "/users", label: "Users", adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <p className="text-brand-gradient text-2xl font-extrabold leading-tight tracking-tight">
          AI Coach
        </p>
        <p className="text-brand-gradient -mt-1 text-2xl font-extrabold leading-tight tracking-tight">
          Dashboard
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        {user ? (
          <p className="mb-2 truncate text-xs text-slate-500">
            {user.first_name} {user.last_name}
          </p>
        ) : null}
        <button
          onClick={logout}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
