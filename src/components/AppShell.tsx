import React from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />

      {/* 
        چون فوتر موبایل fixed است، برای اینکه روی محتوا نیفتد:
        pb-24 روی موبایل، و روی دسکتاپ کمتر
      */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>

      <AppFooter />
    </div>
  );
}