import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const personId = url.searchParams.get("personId");
  if (!personId) return NextResponse.json({ error: "personId_required" }, { status: 400 });

  const { data: rels, error: relErr } = await supabase
    .from("relationships")
    .select("*")
    .eq("owner_user_id", auth.user.id)
    .eq("from_person_id", personId);

  if (relErr) return NextResponse.json({ error: relErr.message }, { status: 500 });

  const ids = Array.from(new Set((rels ?? []).map(r => r.to_person_id)));
  let relatedPersons: any[] = [];
  if (ids.length) {
    const { data: persons, error: pErr } = await supabase
      .from("persons")
      .select("*")
      .in("id", ids);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    relatedPersons = persons ?? [];
  }

  return NextResponse.json({ relationships: rels ?? [], relatedPersons });
}