"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/coach", label: "Coach" },
  { href: "/log", label: "Log Lift" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/body", label: "Body" },
  { href: "/recovery", label: "Recovery" },
  { href: "/goals", label: "Goals" },
];

export default function NavBar({ name }: { name: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 font-bold text-accent"
        >
          STRATUM
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
                    ? "bg-surface-2 text-fg"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {name && (
            <span className="hidden text-sm text-fg-subtle md:inline">
              Hi, {name}
            </span>
          )}
          <ThemeToggle />
          <button
            onClick={logout}
            className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-fg-muted hover:text-fg sm:px-3"
          >
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
}
