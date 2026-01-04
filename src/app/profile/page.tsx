"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type Relationship = {
  id: string;
  from_person_id: string;
  to_person_id: string;
  relation_type: "FATHER" | "MOTHER" | "CHILD";
};

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [root, setRoot] = useState<Person | null>(null);
  const [err, setErr] = useState<string>("");

  // ✅ روابط روت برای disable کردن دکمه‌ها
  const [rels, setRels] = useState<Relationship[]>([]);
  const [relsLoading, setRelsLoading] = useState(false);

  // فرم Root (برای ایجاد یا ویرایش)
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [father_name, setFatherName] = useState("");
  const [birth_city, setBirthCity] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [dialect, setDialect] = useState("");
  const [description, setDescription] = useState("");

  const hydrateForm = (p: Person) => {
    setFirstName(p.first_name ?? "");
    setLastName(p.last_name ?? "");
    setFatherName(p.father_name ?? "");
    setBirthCity(p.birth_city ?? "");
    setEthnicity(p.ethnicity ?? "");
    setDialect(p.dialect ?? "");
    setDescription(p.description ?? "");
  };

  // Auth guard
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/auth");
        return;
      }
      await loadRoot();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRoot = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile/root");
      const { json, text } = await safeJson(res);

      if (res.status === 401) {
        router.replace("/auth");
        return;
      }

      if (res.status === 404) {
        // Root ندارد → فرم ایجاد نمایش داده شود
        setRoot(null);
        setRels([]); // ✅
        return;
      }

      if (!res.ok) {
        setErr(json?.error ? JSON.stringify(json, null, 2) : text || "خطا");
        return;
      }

      const p = json?.root as Person;
      setRoot(p);
      hydrateForm(p);
    } finally {
      setLoading(false);
    }
  };

  // ✅ وقتی root داریم، روابط root را بگیر تا دکمه‌ها disable شوند
  useEffect(() => {
    if (!root?.id) return;

    (async () => {
      setRelsLoading(true);
      try {
        const res = await fetch("/api/tree/root", { cache: "no-store" });
        const { json, text } = await safeJson(res);

        if (!res.ok) {
          // اگر این endpoint هر دلیلی خطا داد، صرفاً دکمه‌ها همیشه فعال می‌مانند
          console.warn("Failed to load relationships for root:", text);
          setRels([]);
          return;
        }

        if (json?.error) {
          console.warn("API returned error:", json);
          setRels([]);
          return;
        }

        const relationships = (json?.relationships ?? []) as Relationship[];
        setRels(relationships);
      } finally {
        setRelsLoading(false);
      }
    })();
  }, [root?.id]);

  const createRoot = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          father_name: father_name.trim() || null,
          birth_city: birth_city.trim() || null,
          ethnicity: ethnicity.trim() || null,
          dialect: dialect.trim() || null,
          description: description.trim() || null,
        }),
      });

      const { json, text } = await safeJson(res);

      if (res.status === 401) {
        router.replace("/auth");
        return;
      }

      if (!res.ok) {
        setErr(
          json?.error
            ? JSON.stringify(json, null, 2)
            : text || "خطا در ایجاد پروفایل"
        );
        return;
      }

      // بعد از ساخت، Root را دوباره لود کن و برو /tree
      await loadRoot();
      router.push("/tree");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const updateRoot = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile/root", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          father_name: father_name.trim() || null,
          birth_city: birth_city.trim() || null,
          ethnicity: ethnicity.trim() || null,
          dialect: dialect.trim() || null,
          description: description.trim() || null,
        }),
      });

      const { json, text } = await safeJson(res);

      if (res.status === 401) {
        router.replace("/auth");
        return;
      }

      if (!res.ok) {
        setErr(json?.error ? JSON.stringify(json, null, 2) : text || "خطا در بروزرسانی");
        return;
      }

      const p = json?.root as Person;
      setRoot(p);
      hydrateForm(p);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    first_name.trim().length > 0 && last_name.trim().length > 0 && !loading;

  // ✅ وضعیت پدر/مادر برای روت (مطابق دیتامدل فعلی شما)
  const hasFather = useMemo(() => {
    if (!root?.id) return false;
    return rels.some(
      (r) => r.from_person_id === root.id && r.relation_type === "FATHER"
    );
  }, [rels, root?.id]);

  const hasMother = useMemo(() => {
    if (!root?.id) return false;
    return rels.some(
      (r) => r.from_person_id === root.id && r.relation_type === "MOTHER"
    );
  }, [rels, root?.id]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">در حال بارگذاری پروفایل…</div>;
  }

  // حالت ۱: Root وجود ندارد → فرم ایجاد
  if (!root) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">ایجاد پروفایل (شخص اصلی)</h1>
          <a className="text-sm text-blue-600 hover:underline" href="/tree">
            رفتن به شجره‌نامه
          </a>
        </div>

        <div className="mt-3 rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-700">
            برای شروع، مشخصات خودتان را ثبت کنید تا شجره‌نامه ساخته شود.
          </div>

          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-lg border p-2"
              placeholder="نام *"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border p-2"
              placeholder="نام خانوادگی *"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
            />

            <input
              className="w-full rounded-lg border p-2"
              placeholder="نام پدر"
              value={father_name}
              onChange={(e) => setFatherName(e.target.value)}
            />

            <input
              className="w-full rounded-lg border p-2"
              placeholder="شهر تولد"
              value={birth_city}
              onChange={(e) => setBirthCity(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border p-2"
                placeholder="قومیت"
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
              />
              <input
                className="w-full rounded-lg border p-2"
                placeholder="لهجه"
                value={dialect}
                onChange={(e) => setDialect(e.target.value)}
              />
            </div>

            <textarea
              className="w-full rounded-lg border p-2 min-h-[110px]"
              placeholder="توضیحات"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button
              className="w-full rounded-lg bg-blue-600 text-white py-2 disabled:opacity-50"
              disabled={!canSubmit}
              onClick={createRoot}
            >
              ایجاد پروفایل
            </button>

            {err && (
              <pre className="rounded-lg border bg-white p-3 text-xs text-red-700 overflow-auto">
                {err}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  // حالت ۲: Root وجود دارد → نمایش + ویرایش
  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">پروفایل من</h1>
        <a className="text-sm text-blue-600 hover:underline" href="/tree">
          رفتن به شجره‌نامه
        </a>
      </div>

      <div className="mt-3 rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-700">
          {root.first_name} {root.last_name}
        </div>
        <div className="mt-1 text-xs text-gray-500">شناسه: {root.id}</div>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg border p-2"
            placeholder="نام *"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border p-2"
            placeholder="نام خانوادگی *"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-2"
            placeholder="نام پدر"
            value={father_name}
            onChange={(e) => setFatherName(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-2"
            placeholder="شهر تولد"
            value={birth_city}
            onChange={(e) => setBirthCity(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-lg border p-2"
              placeholder="قومیت"
              value={ethnicity}
              onChange={(e) => setEthnicity(e.target.value)}
            />
            <input
              className="w-full rounded-lg border p-2"
              placeholder="لهجه"
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
            />
          </div>

          <textarea
            className="w-full rounded-lg border p-2 min-h-[110px]"
            placeholder="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            className="w-full rounded-lg bg-blue-600 text-white py-2 disabled:opacity-50"
            disabled={!canSubmit}
            onClick={updateRoot}
          >
            ذخیره تغییرات
          </button>

          {err && (
            <pre className="rounded-lg border bg-white p-3 text-xs text-red-700 overflow-auto">
              {err}
            </pre>
          )}
        </div>
      </div>

      {/* ✅ بخش جدید: دکمه‌های افزودن پدر/مادر/فرزند */}
      <div className="mt-4 rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              افزودن اعضای مرتبط
            </div>
            <div className="mt-1 text-xs text-gray-600">
              پدر/مادر فقط یکبار قابل ثبت است. فرزند می‌تواند چندتا باشد.
            </div>
          </div>

          {relsLoading && (
            <div className="text-xs text-gray-400">در حال بررسی…</div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
          <a
            className={[
              "rounded-lg py-2 text-center text-sm font-semibold",
              hasFather
                ? "cursor-not-allowed bg-gray-100 text-gray-400 border"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
            href={`/person/new?rel=father&target=${root.id}`}
            onClick={(e) => {
              if (hasFather) e.preventDefault();
            }}
            aria-disabled={hasFather}
          >
            {hasFather ? "پدر ثبت شده" : "افزودن پدر"}
          </a>

          <a
            className={[
              "rounded-lg py-2 text-center text-sm font-semibold",
              hasMother
                ? "cursor-not-allowed bg-gray-100 text-gray-400 border"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
            href={`/person/new?rel=mother&target=${root.id}`}
            onClick={(e) => {
              if (hasMother) e.preventDefault();
            }}
            aria-disabled={hasMother}
          >
            {hasMother ? "مادر ثبت شده" : "افزودن مادر"}
          </a>

          <a
            className="rounded-lg bg-white py-2 text-center text-sm font-semibold text-gray-900 border hover:bg-gray-50"
            href={`/person/new?rel=child&target=${root.id}`}
          >
            افزودن فرزند
          </a>
        </div>
      </div>
    </div>
  );
}