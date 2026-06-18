"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        // If email confirmation is required, there's no session yet.
        if (!data.session) {
          setNotice(
            "Account created. Check your email to confirm, then log in.",
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-fg-muted">
            {isSignup
              ? "Start tracking your lifts in seconds."
              : "Log in to see your progress."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="label">Name (optional)</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-accent-weak px-3 py-2 text-sm text-accent">
              {notice}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-fg-muted">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/signup" className="text-accent hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
