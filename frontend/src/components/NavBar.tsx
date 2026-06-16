"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log", label: "Log Lift" },
  { href: "/bodyweight", label: "Body Weight" },
  { href: "/goals", label: "Goals" },
];

export default function NavBar({ name }: { name: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 font-bold text-emerald-400"
        >
          IronTrack
        </Link>
        {/* Links scroll horizontally on narrow screens instead of overflowing. */}
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${
                  active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {name && (
            <span className="hidden text-sm text-zinc-500 md:inline">
              Hi, {name}
            </span>
          )}
          <button
            onClick={logout}
            className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 sm:px-3"
          >
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
}
