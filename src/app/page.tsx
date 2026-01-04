"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SplashPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [dest, setDest] = useState<"/auth" | "/tree">("/auth");

  useEffect(() => {
    let t: any;

    (async () => {
      // اگر قبلاً لاگین بوده، بعد از اسپلش مستقیم بره tree
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) setDest("/tree");
        else setDest("/auth");
      } catch {
        setDest("/auth");
      } finally {
        t = setTimeout(() => {
          router.replace(dest);
          router.refresh();
        }, 5000);
      }
    })();

    return () => {
      if (t) clearTimeout(t);
    };
    // نکته: dest را intentionally اینجا نمی‌گذاریم که تایمر دوباره reset نشود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* افکت پس‌زمینه‌ی خیلی ملایم */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-indigo-200 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-200 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* لوگو */}
        <div className="splashLogoWrap rounded-[28px] border bg-white/80 p-6 shadow-sm backdrop-blur">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="لوگوی شجره‌نامه"
            className="h-28 w-28 object-contain md:h-32 md:w-32"
            draggable={false}
          />
        </div>

        <h1 className="mt-5 text-xl font-bold text-gray-900 md:text-2xl">
          به اپلیکیشن شجره‌نامه خوش آمدید
        </h1>

        <p className="mt-2 text-sm leading-7 text-gray-600">
          در حال آماده‌سازی محیط… لطفاً چند ثانیه صبر کنید.
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
          انتقال خودکار تا چند لحظه دیگر…
        </div>
      </div>

      {/* Keyframes بدون دست زدن به globals.css */}
      <style jsx global>{`
        .splashLogoWrap {
          animation: splashPop 1.4s ease-in-out infinite;
        }
        @keyframes splashPop {
          0% {
            transform: scale(1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 14px 50px rgba(79, 70, 229, 0.12);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          }
        }
      `}</style>
    </div>
  );
}