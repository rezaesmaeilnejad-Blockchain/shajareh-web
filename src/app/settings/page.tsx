"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  const setDark = (on: boolean) => {
    if (on) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  if (mode === "light") return setDark(false);
  if (mode === "dark") return setDark(true);

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  setDark(mq.matches);
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/auth");
        return;
      }

      const saved = (localStorage.getItem("theme_mode") as ThemeMode | null) ?? "light";
      setTheme(saved);
      applyTheme(saved);

      setLoading(false);
    })();
  }, [router, supabase]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("theme_mode") as ThemeMode | null) ?? "light";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const setThemeAndApply = (mode: ThemeMode) => {
    setMsg("");
    setTheme(mode);
    localStorage.setItem("theme_mode", mode);
    applyTheme(mode);
  };

  const logout = async () => {
    setMsg("");
    const { error } = await supabase.auth.signOut();
    if (error) return setMsg(error.message);
    router.replace("/auth");
    router.refresh();
  };

  if (loading) {
    return <div className="text-sm text-gray-600 dark:text-slate-300">در حال بارگذاری تنظیمات…</div>;
  }

  const Btn = ({ v, label }: { v: ThemeMode; label: string }) => {
    const active = theme === v;
    return (
      <button
        type="button"
        onClick={() => setThemeAndApply(v)}
        className={[
          "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
          "bg-white hover:bg-gray-50 text-gray-900",
          "dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100",
          active ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-400/20" : "border-gray-200 dark:border-slate-700",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-slate-100">تنظیمات</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">تم و حساب کاربری.</p>
      </div>

      <div className="rounded-3xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <div className="text-sm font-bold text-gray-900 dark:text-slate-100">ظاهر</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Btn v="light" label="روشن" />
          <Btn v="dark" label="تیره" />
          <Btn v="system" label="سیستم" />
        </div>
      </div>

      <div className="rounded-3xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100">حساب کاربری</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">خروج از حساب.</div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            خروج
          </button>
        </div>

        {msg && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}