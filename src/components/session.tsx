"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, UserRole } from "@/types";
import { USERS } from "@/lib/mock/data";
import {
  DEFAULT_WORKSPACE,
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_COOKIE,
  isWorkspace,
  type Workspace,
} from "@/lib/workspace";

// ─────────────────────────────────────────────────────────────
// Session context.
// Holds the demo role selector AND the active workspace (demo vs real).
//
// Workspace is the source of truth for whether the UI shows the Nova sample
// data (demo) or the user's own Supabase-backed data (real). It is persisted
// to localStorage and mirrored to a cookie so the server can read it too.
//
// `hydrated` guards against a real user briefly seeing demo figures before the
// persisted workspace is read on mount.
// ─────────────────────────────────────────────────────────────

interface SessionValue {
  user: AppUser;
  role: UserRole;
  setRole: (role: UserRole) => void;
  workspace: Workspace;
  setWorkspace: (w: Workspace) => void;
  isDemo: boolean;
  hydrated: boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

const userForRole = (role: UserRole): AppUser =>
  USERS.find((u) => u.role === role) ?? USERS[0];

function writeWorkspaceCookie(w: Workspace) {
  try {
    document.cookie = `${WORKSPACE_COOKIE}=${w}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Non-browser / blocked — ignore; localStorage still holds the value.
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("business");
  const [workspace, setWorkspaceState] = useState<Workspace>(DEFAULT_WORKSPACE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted role + workspace on mount.
  useEffect(() => {
    try {
      const savedRole = window.localStorage.getItem(
        "shftd:role",
      ) as UserRole | null;
      if (savedRole) setRoleState(savedRole);
      const savedWs = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (isWorkspace(savedWs)) setWorkspaceState(savedWs);
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    try {
      window.localStorage.setItem("shftd:role", r);
    } catch {
      /* ignore */
    }
  };

  const setWorkspace = (w: Workspace) => {
    setWorkspaceState(w);
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, w);
    } catch {
      /* ignore */
    }
    writeWorkspaceCookie(w);
  };

  return (
    <SessionContext.Provider
      value={{
        user: userForRole(role),
        role,
        setRole,
        workspace,
        setWorkspace,
        isDemo: workspace === "demo",
        hydrated,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
