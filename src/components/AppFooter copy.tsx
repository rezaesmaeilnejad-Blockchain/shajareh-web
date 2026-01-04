"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold",
        active ? "bg-primary text-primary-foreground" : "text-gray-600 hover:bg-white/60",
      ].join(" ")}
    >
      <span>{label}</span>
    </Link>
  );
}

export default function AppFooter() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/auth");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const isTree = pathname?.startsWith("/tree");
  const isProfile = pathname?.startsWith("/profile") || pathname?.startsWith("/person");
  const isSettings = pathname?.startsWith("/settings");

  return (
    <>
      {/* Desktop Footer */}
      <footer className="hidden border-t bg-white/70 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-gray-500">
          <div>© {new Date().getFullYear()} شجره‌نامه — همه حقوق محفوظ است.</div>

          <div className="flex items-center gap-4">
            <Link className="hover:text-gray-900" href="/tree">
              شجره‌نامه
            </Link>
            <Link className="hover:text-gray-900" href="/profile">
              پروفایل
            </Link>
            <Link className="hover:text-gray-900" href="/settings">
              تنظیمات
            </Link>

            <button
              onClick={onLogout}
              disabled={loggingOut}
              className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loggingOut ? "در حال خروج..." : "خروج"}
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/80 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2">
          <NavItem href="/tree" label="شجره‌نامه" active={!!isTree} />
          <NavItem href="/profile" label="پروفایل" active={!!isProfile} />
          <NavItem href="/settings" label="تنظیمات" active={!!isSettings} />

          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white/60 disabled:opacity-60"
          >
            <span>{loggingOut ? "..." : "خروج"}</span>
          </button>
        </div>
      </div>
    </>
  );
}