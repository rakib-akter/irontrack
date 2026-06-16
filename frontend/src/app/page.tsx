import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
          STRATUM
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Train by the evidence.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-fg-muted">
          Get stronger, build muscle, and dial in your nutrition with an AI
          coach that explains every recommendation — and cites the research
          behind it.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className="btn-primary px-6 py-3 text-base">
          Get started
        </Link>
        <Link href="/login" className="btn-ghost px-6 py-3 text-base">
          Log in
        </Link>
      </div>
      <ul className="mt-6 grid gap-4 text-left sm:grid-cols-3">
        <li className="card">
          <h3 className="font-semibold">Strength intelligence</h3>
          <p className="mt-1 text-sm text-fg-muted">
            1RM, volume, fatigue, plateau detection, and projected PRs from
            every set.
          </p>
        </li>
        <li className="card">
          <h3 className="font-semibold">Nutrition OS</h3>
          <p className="mt-1 text-sm text-fg-muted">
            Macros, fiber, and a full micronutrient panel — with AI meal
            parsing.
          </p>
        </li>
        <li className="card">
          <h3 className="font-semibold">Evidence-based coaching</h3>
          <p className="mt-1 text-sm text-fg-muted">
            Weekly plans with confidence scores, reasoning, and real citations.
          </p>
        </li>
      </ul>
    </main>
  );
}
