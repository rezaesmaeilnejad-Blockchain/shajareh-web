import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/tree";

  // اگر Supabase خودش error داد (مثل otp_expired)، کاربر را برگردان به /auth با پیام
  const err = url.searchParams.get("error");
  const errCode = url.searchParams.get("error_code");
  const errDesc = url.searchParams.get("error_description");

  if (err || errCode) {
    const qp = new URLSearchParams();
    if (err) qp.set("error", err);
    if (errCode) qp.set("error_code", errCode);
    if (errDesc) qp.set("error_description", errDesc);
    qp.set("next", next);
    return NextResponse.redirect(`${url.origin}/auth?${qp.toString()}`);
  }

  // اگر code نداریم، مستقیم برگرد به auth
  if (!code) {
    return NextResponse.redirect(`${url.origin}/auth?next=${encodeURIComponent(next)}`);
  }

  // تبادل کد و ساخت session
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const qp = new URLSearchParams();
    qp.set("error", "callback_failed");
    qp.set("error_description", error.message);
    qp.set("next", next);
    return NextResponse.redirect(`${url.origin}/auth?${qp.toString()}`);
  }

  // موفق: برو به مقصد
  return NextResponse.redirect(`${url.origin}${next}`);
}