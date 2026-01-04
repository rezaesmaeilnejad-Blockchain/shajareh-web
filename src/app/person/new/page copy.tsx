"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Rel = "father" | "mother" | "child";

type Relationship = {
  id: string;
  from_person_id: string;
  to_person_id: string;
  relation_type: "FATHER" | "MOTHER" | "CHILD";
};

function relToType(rel: Rel) {
  if (rel === "father") return "FATHER";
  if (rel === "mother") return "MOTHER";
  return "CHILD";
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

export default function NewPersonPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const rel = (sp.get("rel") as Rel | null) ?? null;
  const target = sp.get("target"); // from_person_id

  const title = useMemo(() => {
    if (!rel) return "ایجاد شخص جدید";
    if (rel === "father") return "افزودن پدر";
    if (rel === "mother") return "افزودن مادر";
    return "افزودن فرزند";
  }, [rel]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // ✅ وضعیت بررسی رابطه
  const [relCheckLoading, setRelCheckLoading] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [relCheckMsg, setRelCheckMsg] = useState<string>("");

  // فرم ساده MVP
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [father_name, setFatherName] = useState("");
  const [birth_city, setBirthCity] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [dialect, setDialect] = useState("");
  const [description, setDescription] = useState("");

  // Guard: اگر لاگین نیست → /auth
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.replace("/auth");
    })();
  }, [router]);

  // ✅ چک کن اگر rel=father/mother و target داریم، قبلاً ثبت شده یا نه
  useEffect(() => {
    if (!rel || !target) return;
    if (rel !== "father" && rel !== "mother") return;

    (async () => {
      setRelCheckLoading(true);
      setRelCheckMsg("");
      setAlreadyExists(false);

      try {
        const res = await fetch("/api/tree/root", { cache: "no-store" });
        const { json, text } = await safeJson(res);

        if (!res.ok) {
          // اگر چک شکست خورد، جلوی کاربر را نمی‌گیریم (MVP-friendly)
          console.warn("Rel check failed:", text);
          return;
        }

        const relationships = (json?.relationships ?? []) as Relationship[];

        const hasFather = relationships.some(
          (r) => r.from_person_id === target && r.relation_type === "FATHER"
        );
        const hasMother = relationships.some(
          (r) => r.from_person_id === target && r.relation_type === "MOTHER"
        );

        if (rel === "father" && hasFather) {
          setAlreadyExists(true);
          setRelCheckMsg("برای این شخص، پدر قبلاً ثبت شده است.");
        }

        if (rel === "mother" && hasMother) {
          setAlreadyExists(true);
          setRelCheckMsg("برای این شخص، مادر قبلاً ثبت شده است.");
        }
      } finally {
        setRelCheckLoading(false);
      }
    })();
  }, [rel, target]);

  const submit = async () => {
    setErr("");

    // ✅ اگر پدر/مادر قبلاً ثبت شده، اجازه نده submit شود
    if (alreadyExists) {
      setErr(relCheckMsg || "این رابطه قبلاً ثبت شده است.");
      return;
    }

    setLoading(true);
    try {
      // 1) ساخت person
      const res = await fetch("/api/persons", {
        method: "POST",
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

      const { json, text } = await safeJson(res);

      if (!res.ok) {
        setErr(json?.error ? JSON.stringify(json, null, 2) : text || "خطای ناشناخته");
        return;
      }

      const newPersonId = json?.person?.id as string | undefined;
      if (!newPersonId) {
        setErr("person.id دریافت نشد.");
        return;
      }

      // 2) اگر rel و target داریم، رابطه را هم بساز
      if (rel && target) {
        const relRes = await fetch("/api/relationships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_person_id: target,
            to_person_id: newPersonId,
            relation_type: relToType(rel),
          }),
        });

        const { json: relJson, text: relText } = await safeJson(relRes);

        if (!relRes.ok) {
          setErr(
            relJson?.error
              ? JSON.stringify(relJson, null, 2)
              : relText || "خطا در ایجاد رابطه"
          );
          return;
        }
      }

      // 3) برگشت به tree
      router.push("/tree");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const disable =
    !first_name.trim() ||
    !last_name.trim() ||
    loading ||
    relCheckLoading ||
    alreadyExists;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => router.back()}
        >
          بازگشت
        </button>
      </div>

      {rel && !target && (
        <div className="mt-3 rounded-lg border bg-amber-50 p-3 text-sm text-amber-800">
          شما پارامتر target نفرستاده‌اید؛ شخص ساخته می‌شود ولی رابطه‌ای ثبت نمی‌شود.
        </div>
      )}

      {/* ✅ پیام وضعیت چک پدر/مادر */}
      {(rel === "father" || rel === "mother") && target && (
        <div className="mt-3 rounded-lg border bg-white p-3 text-xs text-gray-700">
          {relCheckLoading ? (
            <span className="text-gray-500">در حال بررسی وضعیت {rel === "father" ? "پدر" : "مادر"}…</span>
          ) : alreadyExists ? (
            <span className="text-rose-700">{relCheckMsg}</span>
          ) : (
            <span className="text-emerald-700">
              {rel === "father" ? "پدر" : "مادر"} هنوز ثبت نشده و می‌توانید اضافه کنید.
            </span>
          )}
        </div>
      )}

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
          onClick={submit}
          disabled={disable}
          title={
            alreadyExists
              ? relCheckMsg
              : relCheckLoading
              ? "در حال بررسی…"
              : ""
          }
        >
          {loading ? "در حال ذخیره..." : alreadyExists ? "این مورد قبلاً ثبت شده" : "ذخیره"}
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