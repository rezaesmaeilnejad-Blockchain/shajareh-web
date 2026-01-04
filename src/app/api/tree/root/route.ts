import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Root = earliest person for this user (MVP shortcut)
  const { data: root, error: rootErr } = await supabase
    .from("persons")
    .select("*")
    .eq("owner_user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (rootErr || !root) {
    return NextResponse.json({ error: "no_root_person" }, { status: 404 });
  }

  // کل روابط کاربر (برای نمایش همه نسل‌ها)
  const { data: rels, error: relErr } = await supabase
    .from("relationships")
    .select("*")
    .eq("owner_user_id", auth.user.id);

  if (relErr) {
    return NextResponse.json({ error: relErr.message }, { status: 500 });
  }

  const relationships = rels ?? [];

  // همه person هایی که در گراف هستند
  const idsSet = new Set<string>();
  idsSet.add(root.id);
  for (const r of relationships) {
    if (r.from_person_id) idsSet.add(r.from_person_id);
    if (r.to_person_id) idsSet.add(r.to_person_id);
  }
  const ids = Array.from(idsSet);

  let relatedPersons: any[] = [];
  if (ids.length) {
    const { data: persons, error: pErr } = await supabase
      .from("persons")
      .select("*")
      .in("id", ids);

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    relatedPersons = (persons ?? []).filter((p) => p.id !== root.id);
  }

  return NextResponse.json({
    root,
    relationships,
    relatedPersons,
  });
}