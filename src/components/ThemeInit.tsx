"use client";

import { useEffect } from "react";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  const setDark = (on: boolean) => {
    if (on) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  if (mode === "light") return setDark(false);
  if (mode === "dark") return setDark(true);

  // system
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  setDark(mq.matches);
}

export default function ThemeInit() {
  useEffect(() => {
    // ✅ پیش‌فرض را روشن کن تا اپ خودکار تیره نشود
    const saved = (localStorage.getItem("theme_mode") as ThemeMode | null) ?? "light";
    applyTheme(saved);

    // اگر system بود، تغییرات سیستم را هم گوش بده
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("theme_mode") as ThemeMode | null) ?? "light";
      if (current === "system") applyTheme("system");
    };

    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return null;
}