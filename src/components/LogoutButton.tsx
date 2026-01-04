"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  className?: string;
  redirectTo?: string; // پیش‌فرض /auth
  label?: string;      // پیش‌فرض "خروج"
};

export default function LogoutButton({
  className = "",
  redirectTo = "/auth",
  label = "خروج",
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={logout}
      disabled={loading}
      className={
        "rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 " +
        className
      }
      type="button"
    >
      {loading ? "در حال خروج..." : label}
    </button>
  );
}