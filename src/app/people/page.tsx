"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  birth_city?: string | null;
  ethnicity?: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

export default function PeoplePage() {
  const router = useRouter();
  const [items, setItems] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Guard: اگر لاگین نیست → /auth
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace("/auth");
    })();
  }, [router]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/persons");
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}

      if (!res.ok) {
        setErr(json?.error ? JSON.stringify(json, null, 2) : text || "خطا در دریافت لیست افراد");
        return;
      }
      setItems(json?.persons ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(p => {
      const full = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
      return full.includes(s);
    });
  }, [items, q]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">افراد</h1>

        <div className="flex items-center gap-2">
          <a
            href="/person/new"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            افزودن شخص
          </a>
          <a
            href="/tree"
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            شجره‌نامه
          </a>
        </div>
      </div>

      <div className="mt-4">
        <input
          className="w-full rounded-lg border p-2 text-sm"
          placeholder="جستجو نام / نام خانوادگی…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && <div className="mt-4 text-sm text-gray-600">در حال بارگذاری…</div>}

      {err && (
        <pre className="mt-4 rounded-lg border bg-white p-3 text-xs text-red-700 overflow-auto">
          {err}
        </pre>
      )}

      {!loading && !err && (
        <div className="mt-4 rounded-xl border bg-white overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">موردی یافت نشد.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {p.birth_city ?? "شهر تولد نامشخص"} • {p.ethnicity ?? "قومیت نامشخص"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      href={`/person/${p.id}`}
                    >
                      جزئیات
                    </a>
                    <a
                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-50"
                      href={`/person/${p.id}/edit`}
                    >
                      ویرایش
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}