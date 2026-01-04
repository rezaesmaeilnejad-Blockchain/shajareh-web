"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type Profile = {
  full_name?: string | null;
  avatar_url?: string | null;
};

export default function AppHeader() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [displayName, setDisplayName] = useState<string>("مهمان");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadUser = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        setIsAuthed(false);
        setDisplayName("مهمان");
        setAvatarUrl(null);
        return;
      }

      setIsAuthed(true);
      setDisplayName(user.user_metadata?.full_name || user.email || "کاربر");

      // اگر جدول profiles موجود باشد، از آن هم می‌خوانیم (اختیاری)
      try {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        const prof = p as Profile | null;
        if (prof?.full_name) setDisplayName(prof.full_name);
        if (prof?.avatar_url) setAvatarUrl(prof.avatar_url);
      } catch {
        // نداشتن profiles مشکلی نیست
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* 
          RTL نکته مهم:
          برای اینکه "کاربر سمت راست" و "لوگو سمت چپ" باشد،
          کاربر را اول رندر می‌کنیم و برند را آخر.
        */}

        {/* Right: User */}
        <div className="flex items-center gap-3">
          {!loading && isAuthed ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                <div className="text-xs text-gray-500">حساب کاربری</div>
              </div>

              <div className="h-10 w-10 overflow-hidden rounded-2xl border bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl || "/avatar-placeholder.png"}
                  alt="آواتار"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/avatar-placeholder.png";
                  }}
                />
              </div>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
            >
              ورود / ثبت‌نام
            </Link>
          )}
        </div>

        {/* Left: Logo + Brand */}
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
      </div>
    </header>
  );
}