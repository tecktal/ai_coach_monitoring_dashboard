"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, clearSession, getToken, setSession } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  ready: boolean; // true once we've hydrated from localStorage
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = "ai_coach_admin_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate session from localStorage on first mount.
    const hydrate = () => {
      const token = getToken();
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
      if (token && raw) {
        try {
          setUser(JSON.parse(raw) as User);
        } catch {
          clearSession();
        }
      }
      setReady(true);
    };
    hydrate();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    // Dashboard access is granted to admins and viewers; plain teachers can't.
    if (res.user.role !== "admin" && res.user.role !== "viewer") {
      throw new Error(
        "This account does not have monitoring access. Please contact an administrator.",
      );
    }
    setSession(res.token, res.user);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
