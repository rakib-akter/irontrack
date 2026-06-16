import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          IronTrack
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">
          Get stronger, with proof.
        </h1>
        <p className="mx-auto max-w-xl text-lg text-zinc-400">
          Log every lift, watch your estimated 1-rep max climb on a graph, and
          let an AI coach prescribe exactly what to do next session to hit your
          goal — like that 315&nbsp;lb bench.
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
          <h3 className="font-semibold text-emerald-400">📈 Track progress</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Every set you log feeds a strength-over-time graph.
          </p>
        </li>
        <li className="card">
          <h3 className="font-semibold text-emerald-400">🎯 Set goals</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Name a target weight and see how close you are.
          </p>
        </li>
        <li className="card">
          <h3 className="font-semibold text-emerald-400">🤖 AI coaching</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Get feedback and next-session rep goals to close the gap.
          </p>
        </li>
      </ul>
    </main>
  );
}
