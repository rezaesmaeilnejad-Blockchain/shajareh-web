import { Suspense } from "react";
import NewPersonClient from "./NewPersonClient";

export default function NewPersonPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">در حال بارگذاری…</div>}>
      <NewPersonClient />
    </Suspense>
  );
}