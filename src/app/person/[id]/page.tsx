"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  father_name?: string | null;
  birth_city?: string | null;
  ethnicity?: string | null;
  dialect?: string | null;
  description?: string | null;
  avatar_url?: string | null;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function PersonDetailsPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ Safe normalize: string | string[] | undefined
  const id = useMemo(() => {
    const raw = (params as any)?.id as string | string[] | undefined;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [person, setPerson] = useState<Person | null>(null);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Guard: اگر لاگین نیست → /auth
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace("/auth");
    })();
  }, [router]);

  useEffect(() => {
    // ✅ مهم: تا id معتبر نشده، هیچ fetch نزن
    if (!id) {
      setLoading(true);
      return;
    }

    if (!isUuid(id)) {
      setLoading(false);
      setPerson(null);
      setErr("آدرس پروفایل معتبر نیست (شناسه صحیح نیست).");
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      setPerson(null);

      try {
        const res = await fetch(`/api/persons/${id}`, { cache: "no-store" });
        const text = await res.text();

        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {}

        if (!res.ok) {
          setErr(
            json?.error ? JSON.stringify(json, null, 2) : text || "خطا در دریافت اطلاعات"
          );
          return;
        }

        setPerson(json.person);
      } catch (e: any) {
        setErr(e?.message || "خطای شبکه/کلاینت");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-gray-600">در حال بارگذاری…</div>;

  // ✅ خطای تمیز به جای UUID undefined
  if (err && !person) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-semibold text-red-700">خطا</div>
          <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">{err}</pre>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => router.back()}
            >
              بازگشت
            </button>
            <a
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
              href="/tree"
            >
              رفتن به شجره‌نامه
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!person) return <div className="p-6 text-sm text-gray-600">یافت نشد.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {person.first_name} {person.last_name}
        </h1>
        <button className="text-sm text-blue-600 hover:underline" onClick={() => router.back()}>
          بازگشت
        </button>
      </div>

      <div className="mt-4 rounded-xl border bg-white p-4 space-y-2">
        <div className="text-sm">
          <span className="text-gray-500">نام پدر:</span> {person.father_name ?? "—"}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">شهر تولد:</span> {person.birth_city ?? "—"}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">قومیت:</span> {person.ethnicity ?? "—"}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">لهجه:</span> {person.dialect ?? "—"}
        </div>

        {person.description ? (
          <div className="pt-2 text-sm text-gray-700 whitespace-pre-wrap">{person.description}</div>
        ) : (
          <div className="pt-2 text-sm text-gray-400">توضیحات ندارد</div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <a
          className="rounded-lg bg-blue-600 text-white py-2 text-center text-sm"
          href={`/person/new?rel=father&target=${person.id}`}
        >
          افزودن پدر
        </a>
        <a
          className="rounded-lg bg-blue-600 text-white py-2 text-center text-sm"
          href={`/person/new?rel=mother&target=${person.id}`}
        >
          افزودن مادر
        </a>
        <a
          className="rounded-lg bg-blue-600 text-white py-2 text-center text-sm"
          href={`/person/new?rel=child&target=${person.id}`}
        >
          افزودن فرزند
        </a>
      </div>

      <div className="mt-6">
        <a className="text-sm text-blue-600 hover:underline" href="/tree">
          رفتن به شجره‌نامه
        </a>
      </div>
    </div>
  );
}