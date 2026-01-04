"use client";

import { useEffect, useState } from "react";
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

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [person, setPerson] = useState<Person | null>(null);

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [father_name, setFatherName] = useState("");
  const [birth_city, setBirthCity] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [dialect, setDialect] = useState("");
  const [description, setDescription] = useState("");

  // Guard
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace("/auth");
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`/api/persons/${id}`);
        const text = await res.text();
        let json: any = null;
        try { json = JSON.parse(text); } catch {}

        if (!res.ok) {
          setErr(json?.error ? JSON.stringify(json, null, 2) : text || "خطا در دریافت اطلاعات");
          return;
        }

        const p = json?.person as Person;
        setPerson(p);

        setFirstName(p.first_name ?? "");
        setLastName(p.last_name ?? "");
        setFatherName(p.father_name ?? "");
        setBirthCity(p.birth_city ?? "");
        setEthnicity(p.ethnicity ?? "");
        setDialect(p.dialect ?? "");
        setDescription(p.description ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submit = async () => {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/persons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
          father_name: father_name || null,
          birth_city: birth_city || null,
          ethnicity: ethnicity || null,
          dialect: dialect || null,
          description: description || null,
        }),
      });

      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}

      if (!res.ok) {
        setErr(json?.error ? JSON.stringify(json, null, 2) : text || "خطا در ذخیره تغییرات");
        return;
      }

      router.push(`/person/${id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-600">در حال بارگذاری…</div>;
  if (err) return <div className="p-6"><pre className="text-xs text-red-700">{err}</pre></div>;
  if (!person) return <div className="p-6 text-sm text-gray-600">یافت نشد.</div>;

  const disable = !first_name.trim() || !last_name.trim() || saving;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">ویرایش شخص</h1>
        <button className="text-sm text-blue-600 hover:underline" onClick={() => router.back()}>
          بازگشت
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <input className="w-full rounded-lg border p-2" placeholder="نام *"
          value={first_name} onChange={(e) => setFirstName(e.target.value)} />
        <input className="w-full rounded-lg border p-2" placeholder="نام خانوادگی *"
          value={last_name} onChange={(e) => setLastName(e.target.value)} />

        <input className="w-full rounded-lg border p-2" placeholder="نام پدر"
          value={father_name} onChange={(e) => setFatherName(e.target.value)} />

        <input className="w-full rounded-lg border p-2" placeholder="شهر تولد"
          value={birth_city} onChange={(e) => setBirthCity(e.target.value)} />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="w-full rounded-lg border p-2" placeholder="قومیت"
            value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} />
          <input className="w-full rounded-lg border p-2" placeholder="لهجه"
            value={dialect} onChange={(e) => setDialect(e.target.value)} />
        </div>

        <textarea className="w-full rounded-lg border p-2 min-h-[110px]" placeholder="توضیحات"
          value={description} onChange={(e) => setDescription(e.target.value)} />

        <button
          className="w-full rounded-lg bg-blue-600 text-white py-2 disabled:opacity-50"
          onClick={submit}
          disabled={disable}
        >
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>

        {err && (
          <pre className="rounded-lg border bg-white p-3 text-xs text-red-700 overflow-auto">
            {err}
          </pre>
        )}
      </div>
    </div>
  );
}