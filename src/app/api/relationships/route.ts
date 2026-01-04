import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const RelSchema = z.object({
  from_person_id: z.string().uuid(),
  to_person_id: z.string().uuid(),
  relation_type: z.enum(["FATHER", "MOTHER", "CHILD"]),
});

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = RelSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // NOTE: Cycle-check can be added here (next step). For MVP: rely on UI discipline.
  const { data, error } = await supabase
    .from("relationships")
    .insert({ ...parsed.data, owner_user_id: auth.user.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ relationship: data });
}