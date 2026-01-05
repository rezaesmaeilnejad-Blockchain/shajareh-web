// src/lib/site-url.ts
export function getSiteURL() {
  // Client-side (browser)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side (Vercel/Node)
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "";

  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}