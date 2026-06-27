"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, UserRole } from "@/types";
import { USERS } from "@/lib/mock/data";

// ─────────────────────────────────────────────────────────────
// Demo session context.
// In DEMO MODE there is no real auth, so we let the viewer pick which role
// they're experiencing (Business / Creator / Admin). The active user is
// persisted to localStorage. When Supabase auth is wired up, replace the
// resolver below with the authenticated user + their stored role.
// ─────────────────────────────────────────────────────────────

interface SessionValue {
  user: AppUser;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const userForRole = (role: UserRole): AppUser =>
  USERS.find((u) => u.role === role) ?? USERS[0];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("business");

  // Hydrate persisted role on mount.
  useEffect(() => {
    const saved = window.localStorage.getItem("shftd:role") as UserRole | null;
    if (saved) setRoleState(saved);
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    window.localStorage.setItem("shftd:role", r);
  };

  return (
    <SessionContext.Provider value={{ user: userForRole(role), role, setRole }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
