import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Relationship = {
  id: string;
  from_person_id: string;
  to_person_id: string;
  relation_type: "FATHER" | "MOTHER" | "CHILD";
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await supabaseServer();

  // 1) Person
  const personRes = await supabase
    .from("persons")
    .select("*")
    .eq("id", id)
    .single();

  if (personRes.error) {
    return NextResponse.json(
      { error: personRes.error.message },
      { status: 404 }
    );
  }

  // 2) Relationships out/in
  const outRelsRes = await supabase
    .from("relationships")
    .select("*")
    .eq("from_person_id", id);

  if (outRelsRes.error) {
    return NextResponse.json(
      { error: outRelsRes.error.message },
      { status: 500 }
    );
  }

  const inRelsRes = await supabase
    .from("relationships")
    .select("*")
    .eq("to_person_id", id);

  if (inRelsRes.error) {
    return NextResponse.json(
      { error: inRelsRes.error.message },
      { status: 500 }
    );
  }

  const outRels = (outRelsRes.data ?? []) as Relationship[];
  const inRels = (inRelsRes.data ?? []) as Relationship[];

  // 3) Build parents/children ids (supports both patterns)
  const parentsIds = new Set<string>();
  const childrenIds = new Set<string>();

  // Outgoing: from=id
  for (const r of outRels) {
    if (r.relation_type === "FATHER" || r.relation_type === "MOTHER") {
      // id -> parent
      parentsIds.add(r.to_person_id);
    } else if (r.relation_type === "CHILD") {
      // id -> child
      childrenIds.add(r.to_person_id);
    }
  }

  // Incoming: to=id
  for (const r of inRels) {
    if (r.relation_type === "CHILD") {
      // parent -> id
      parentsIds.add(r.from_person_id);
    } else if (r.relation_type === "FATHER" || r.relation_type === "MOTHER") {
      // child -> id (id is parent)
      childrenIds.add(r.from_person_id);
    }
  }

  // Remove self if somehow exists
  parentsIds.delete(id);
  childrenIds.delete(id);

  const allIds = Array.from(new Set([...parentsIds, ...childrenIds]));
  let peopleMap: Record<string, any> = {};

  if (allIds.length > 0) {
    const peopleRes = await supabase
      .from("persons")
      .select("*")
      .in("id", allIds);

    if (peopleRes.error) {
      return NextResponse.json(
        { error: peopleRes.error.message },
        { status: 500 }
      );
    }

    for (const p of peopleRes.data ?? []) {
      peopleMap[p.id] = p;
    }
  }

  const parents = Array.from(parentsIds)
    .map((pid) => peopleMap[pid])
    .filter(Boolean);

  const children = Array.from(childrenIds)
    .map((cid) => peopleMap[cid])
    .filter(Boolean);

  return NextResponse.json({
    person: personRes.data,
    parents,
    children,
    relationships: [...outRels, ...inRels],
  });
}