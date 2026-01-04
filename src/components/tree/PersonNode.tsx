"use client";

import React from "react";
import { Handle, Position } from "reactflow";

export default function PersonNode({ data }: any) {
  const person = data?.person;

  return (
    <div className="min-w-[210px] rounded-2xl border bg-white p-3 shadow-sm">
      {/* ورودی از بالا (برای پدر/مادر → فرزند یا هر اتصال ورودی) */}
      <Handle
        id="in"
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-gray-50 text-[10px] text-gray-400">
          {person?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            "بدون عکس"
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {person?.first_name} {person?.last_name}
          </div>
          <div className="truncate text-xs text-gray-600">
            {person?.ethnicity ?? "قومیت نامشخص"}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-xl border bg-white px-3 py-2 text-xs hover:bg-gray-50"
        onClick={() => data?.onOpen?.(person?.id)}
        disabled={!person?.id}
        title={person?.id ? "نمایش جزئیات" : "شناسه شخص موجود نیست"}
      >
        جزئیات
      </button>

      {/* خروجی به پایین (برای فرزندها) */}
      <Handle
        id="out"
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />
    </div>
  );
}