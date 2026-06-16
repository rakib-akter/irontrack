"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getTheme, toggleTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getTheme());
    setMounted(true);
  }, []);

  function onToggle() {
    setTheme(toggleTheme());
  }

  // Render a stable placeholder until mounted to avoid hydration mismatch.
  const isDark = mounted && theme === "dark";

  return (
    <button
      onClick={onToggle}
      aria-label="Toggle dark mode"
      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-sm"
      >
        {isDark ? "🌙" : "☀️"}
      </motion.span>
    </button>
  );
}
