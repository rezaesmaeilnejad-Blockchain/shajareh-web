"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "magic" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [mode, setMode] = useState<Mode>("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("test@demo.com");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

  // اگر لاگین است، مستقیم برو tree
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/tree");
    })();
  }, [router, supabase]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  async function ensureProfile() {
    // این بخش اختیاری است: اگر جدول profiles داشتی، یک ردیف اولیه می‌سازد/آپدیت می‌کند.
    // اگر جدول profiles نداری، خطا را می‌گیرد و ادامه می‌دهد.
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName?.trim() || user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            email: user.email || null,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "id" }
        );
    } catch {
      // اگر profiles موجود نبود یا RLS اجازه نداد، بی‌خیال
    }
  }

  const loginWithPassword = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      await ensureProfile();
      router.replace("/tree");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || null,
          },
          // اگر ایمیل کانفرم فعال باشد، کاربر باید ایمیل را تایید کند
          emailRedirectTo: `${origin}/auth/callback?next=/tree`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // اگر session بلافاصله ایجاد شد -> برو tree
      if (data.session) {
        await ensureProfile();
        router.replace("/tree");
        router.refresh();
        return;
      }

      // اگر تایید ایمیل لازم است:
      setMsg("ثبت‌نام انجام شد. لطفاً ایمیل خود را برای تایید و ورود بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/tree`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMsg("لینک ورود برای شما ایمیل شد. لطفاً Inbox/Spam را چک کنید.");
    } finally {
      setLoading(false);
    }
  };

  const sendResetPassword = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/auth/reset`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMsg("لینک تغییر رمز برای شما ایمیل شد. لطفاً Inbox/Spam را چک کنید.");
    } finally {
      setLoading(false);
    }
  };

  const disableEmail = !email.trim() || loading;
  const disableLogin = disableEmail || !password;
  const disableSignup = disableEmail || !password;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header ساده برای Auth */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="لوگو"
              className="h-10 w-10 rounded-2xl border bg-white object-contain shadow-sm"
            />
            <div className="leading-tight">
              <div className="text-sm font-bold text-gray-900">شجره‌نامه</div>
              <div className="text-xs text-gray-500">سامانه مدیریت نسل‌ها</div>
            </div>
          </Link>

          <div className="text-xs text-gray-500">
            <Link className="hover:text-gray-900" href="/tree">
              مشاهده شجره‌نامه
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-2 md:py-12">
        {/* Left: توضیح */}
        <section className="order-2 md:order-1">
          <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              شجره‌نامه‌ی خانوادگی شما، حرفه‌ای و مرتب
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              اعضای خانواده را اضافه کنید، رابطه‌ها را بسازید و همه نسل‌ها را به شکل گراف ببینید.
              امکان خروجی PDF و JPG هم دارید.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">نمایش گراف نسل‌ها</div>
                <div className="mt-1 text-xs leading-6 text-gray-600">Fit، زوم و جابجایی روان.</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">اطلاعات کامل</div>
                <div className="mt-1 text-xs leading-6 text-gray-600">قومیت، لهجه، شهر تولد و…</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">خروجی گرفتن</div>
                <div className="mt-1 text-xs leading-6 text-gray-600">دانلود PDF و JPG از نمودار.</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">امن و ساده</div>
                <div className="mt-1 text-xs leading-6 text-gray-600">ورود با رمز یا لینک ایمیل.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: کارت ورود/ثبت‌نام */}
        <section className="order-1 md:order-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {mode === "login"
                    ? "ورود"
                    : mode === "signup"
                    ? "ثبت‌نام"
                    : mode === "magic"
                    ? "ورود با لینک ایمیل"
                    : "فراموشی رمز عبور"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {mode === "login"
                    ? "با ایمیل و رمز عبور وارد شوید."
                    : mode === "signup"
                    ? "یک حساب جدید بسازید."
                    : mode === "magic"
                    ? "بدون رمز عبور، لینک ورود دریافت کنید."
                    : "لینک تغییر رمز را دریافت کنید."}
                </p>
              </div>

              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                MVP
              </span>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                className={`rounded-xl border px-3 py-2 ${
                  mode === "login" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMsg("");
                }}
              >
                ورود با رمز
              </button>

              <button
                className={`rounded-xl border px-3 py-2 ${
                  mode === "magic" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => {
                  setMode("magic");
                  setError("");
                  setMsg("");
                }}
              >
                لینک ایمیل
              </button>

              <button
                className={`rounded-xl border px-3 py-2 ${
                  mode === "signup" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMsg("");
                }}
              >
                ثبت‌نام
              </button>

              <button
                className={`rounded-xl border px-3 py-2 ${
                  mode === "forgot" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setMsg("");
                }}
              >
                فراموشی رمز
              </button>
            </div>

            {/* Form */}
            <div className="mt-5 space-y-3">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-600">نام و نام خانوادگی</span>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="مثلاً: علی رضایی"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs text-gray-600">ایمیل</span>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </label>

              {(mode === "login" || mode === "signup") && (
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-600">رمز عبور</span>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </label>
              )}

              {/* Actions */}
              {mode === "login" && (
                <button
                  className="mt-2 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={loginWithPassword}
                  disabled={disableLogin}
                >
                  {loading ? "در حال ورود..." : "ورود"}
                </button>
              )}

              {mode === "signup" && (
                <button
                  className="mt-2 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={signUp}
                  disabled={disableSignup}
                >
                  {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
                </button>
              )}

              {mode === "magic" && (
                <button
                  className="mt-2 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={sendMagicLink}
                  disabled={disableEmail}
                >
                  {loading ? "در حال ارسال..." : "ارسال لینک ورود"}
                </button>
              )}

              {mode === "forgot" && (
                <button
                  className="mt-2 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={sendResetPassword}
                  disabled={disableEmail}
                >
                  {loading ? "در حال ارسال..." : "ارسال لینک تغییر رمز"}
                </button>
              )}

              {/* Messages */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {error}
                </div>
              )}
              {msg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {msg}
                </div>
              )}

              <div className="mt-3 text-center text-xs text-gray-500">
                با ورود/ثبت‌نام، قوانین و حریم خصوصی را می‌پذیرید.
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link className="text-gray-600 hover:text-gray-900" href="/profile">
              تکمیل پروفایل
            </Link>
            <span className="text-gray-300">|</span>
            <Link className="text-gray-600 hover:text-gray-900" href="/tree">
              رفتن به شجره‌نامه
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-center text-xs text-gray-500 md:flex-row md:items-center md:justify-between md:text-right">
          <div>© {new Date().getFullYear()} شجره‌نامه — همه حقوق محفوظ است.</div>
          <div className="flex items-center justify-center gap-4">
            <a className="hover:text-gray-900" href="#">
              حریم خصوصی
            </a>
            <a className="hover:text-gray-900" href="#">
              قوانین
            </a>
            <a className="hover:text-gray-900" href="#">
              پشتیبانی
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}