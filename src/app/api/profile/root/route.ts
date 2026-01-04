import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const RootUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  father_name: z.string().nullable().optional(),
  birth_city: z.string().nullable().optional(),
  ethnicity: z.string().nullable().optional(),
  dialect: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

async function getRootPersonForUser(supabase: any, userId: string) {
  // Root را به‌صورت "اولین person" کاربر در نظر می‌گیریم (همسو با MVP)
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { error: error.message, data: null };
  }
  return { error: null, data };
}

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rootRes = await getRootPersonForUser(supabase, auth.user.id);

    if (rootRes.error) {
      return NextResponse.json({ error: rootRes.error }, { status: 500 });
    }

    if (!rootRes.data) {
      return NextResponse.json({ error: "no_root_person" }, { status: 404 });
    }

    return NextResponse.json({ root: rootRes.data }, { status: 200 });
  } catch (e: any) {
    console.error("GET /api/profile/root failed:", e);
    return NextResponse.json(
      { error: "internal_server_error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RootUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const rootRes = await getRootPersonForUser(supabase, auth.user.id);

    if (rootRes.error) {
      return NextResponse.json({ error: rootRes.error }, { status: 500 });
    }
    if (!rootRes.data) {
      return NextResponse.json({ error: "no_root_person" }, { status: 404 });
    }

    const rootId = rootRes.data.id;

    const { data: updated, error } = await supabase
      .from("persons")
      .update(parsed.data)
      .eq("id", rootId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ root: updated }, { status: 200 });
  } catch (e: any) {
    console.error("PUT /api/profile/root failed:", e);
    return NextResponse.json(
      { error: "internal_server_error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}