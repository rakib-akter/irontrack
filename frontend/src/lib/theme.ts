// Lightweight class-based theme handling. The no-flash script in the root
// layout sets the initial class before paint; this module flips it at runtime.

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

// Inline script (stringified) injected into <head> to set the theme before the
// first paint, avoiding a flash of the wrong theme.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;if(t==='dark'){r.classList.add('dark');}r.style.colorScheme=t;}catch(e){}})();`;
