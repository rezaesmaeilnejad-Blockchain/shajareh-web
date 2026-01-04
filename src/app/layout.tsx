import "./globals.css";
import { Vazirmatn } from "next/font/google";
import AppShell from "@/components/AppShell";
import ThemeInit from "@/components/ThemeInit"; // اگر داری

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vazir",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-sans">
        <ThemeInit />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}