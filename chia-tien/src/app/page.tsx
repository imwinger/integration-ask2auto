"use client";

import dynamic from "next/dynamic";

// Toàn bộ dữ liệu nằm trong localStorage nên chỉ render phía client
// để tránh lệch hydration.
const TripList = dynamic(() => import("./TripList"), { ssr: false });

export default function HomePage() {
  return <TripList />;
}
