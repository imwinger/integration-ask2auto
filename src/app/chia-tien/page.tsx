"use client";

import dynamic from "next/dynamic";

// Trang đọc/ghi localStorage nên chỉ render phía client để tránh lệch hydration.
const ChiaTien = dynamic(() => import("./ChiaTien"), { ssr: false });

export default function ChiaTienPage() {
  return <ChiaTien />;
}
