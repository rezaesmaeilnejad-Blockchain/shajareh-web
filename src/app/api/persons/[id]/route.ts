import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type Ctx =
  | { params: { id?: string } }
  | { params: Promise<{ id?: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    // ✅ سازگار با هر دو حالت params (Object یا Promise)
    const p = await Promise.resolve((ctx as any).params);
    const id = p?.id;

    // ✅ هیچوقت اجازه نده undefined برود سمت DB
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing route param: id" },
        { status: 400 }
      );
    }

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: "Invalid id (must be uuid)", id },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    const { data: person, error } = await supabase
      .from("persons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ person }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}