"use client";

import dynamic from "next/dynamic";

// Đọc id từ query string + localStorage nên chỉ render phía client.
const TripDetail = dynamic(() => import("./TripDetail"), { ssr: false });

export default function TripPage() {
  return <TripDetail />;
}
