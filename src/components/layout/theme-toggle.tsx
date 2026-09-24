"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

function readStoredTheme(): boolean {
  try {
    const stored = localStorage.getItem("theme");
    if (stored) {
      return stored === "dark";
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // Re-applies the class on mount (source of truth: localStorage, same as
  // the blocking script in the root layout). This also guards against dev
  // Strict Mode remounts clearing the class React doesn't manage via JSX —
  // see node_modules/next/dist/docs/.../preventing-flash-before-hydration.md.
  useLayoutEffect(() => {
    const dark = readStoredTheme();
    document.documentElement.classList.toggle("dark", dark);
    // One-time sync from an external system (localStorage/DOM) on mount,
    // not a derived-state loop — the case the lint rule's own guidance
    // calls out as legitimate ("calling setState... when external state
    // changes"). Matches Next.js's own recommended pattern for this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable — the toggle still works for this tab.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={isDark === null ? "invisible" : undefined}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
