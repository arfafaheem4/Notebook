"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={!isDark ? "font-bold" : "text-gray-400"}>Light</span>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`w-12 h-6 rounded-full flex items-center px-1 transition ${isDark ? "bg-gray-600 justify-end" : "bg-blue-400 justify-start"}`}
      >
        <div className="w-4 h-4 bg-white rounded-full" />
      </button>
      <span className={isDark ? "font-bold" : "text-gray-400"}>Dark</span>
    </div>
  );
}