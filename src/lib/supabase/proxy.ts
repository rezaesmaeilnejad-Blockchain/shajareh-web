import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // اگر publishable key داری بهتره از اون استفاده کنی، ولی anon هم در دوره گذار کار می‌کند
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // برای اینکه سرور و کلاینت هر دو کوکی جدید را بگیرند
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Supabase توصیه می‌کند برای SSR جریان refresh را اینجا انجام بدهی
  await supabase.auth.getClaims();

  return response;
}