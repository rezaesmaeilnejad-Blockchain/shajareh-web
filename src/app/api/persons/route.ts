import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: persons, error } = await supabase
    .from("persons")
    .select("*")
    .eq("owner_user_id", auth.user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ persons: persons ?? [] });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data: person, error } = await supabase
    .from("persons")
    .insert({
      owner_user_id: auth.user.id,
      first_name: body.first_name,
      last_name: body.last_name,
      father_name: body.father_name ?? null,
      birth_city: body.birth_city ?? null,
      ethnicity: body.ethnicity ?? null,
      dialect: body.dialect ?? null,
      description: body.description ?? null,
      avatar_url: body.avatar_url ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ person });
}