"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import type { UserRole } from "@/types";
import { cn, titleCase } from "@/lib/utils";

// Auth form for both login and signup. Uses Supabase Auth when configured;
// in demo mode it simply routes into the dashboard so the product is fully
// explorable with zero setup.
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // ── Demo mode: no real auth, persist chosen role and enter app. ──
    if (!supabase) {
      window.localStorage.setItem("shftd:role", role);
      router.push("/dashboard");
      return;
    }

    // ── Live Supabase auth. ──
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          // TODO: store full_name + role in the `users` table via a trigger
          // or a follow-up insert keyed on the new auth user id.
          options: { data: { full_name: fullName, role } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {isSignup ? "Create your account" : "Welcome back"}
        </CardTitle>
        <p className="text-sm text-slate-500">
          {isSignup
            ? "Start setting trends instead of chasing them."
            : "Sign in to your Marketing OS."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {isSignup && (
            <Field
              label="Full name"
              value={fullName}
              onChange={setFullName}
              placeholder="Maya Okafor"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {isSignup && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                I am a…
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["business", "creator", "admin"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      role === r
                        ? "border-electric-400/60 bg-electric-500/15 text-slate-900"
                        : "border-slate-200 text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {titleCase(r)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-signal-red/10 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </Button>

          {config.demoMode && (
            <p className="text-center text-xs text-slate-500">
              Demo mode — any details work, or just continue to explore.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 placeholder:text-slate-500 ring-focus"
      />
    </div>
  );
}
