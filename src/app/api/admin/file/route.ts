import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { storage, originalNameFromKey } from "@/lib/storage";

export const runtime = "nodejs";

// Tải về 1 file theo khóa — chỉ cho nhân viên đã đăng nhập.
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const key = req.nextUrl.searchParams.get("key") || "";
  if (!key || !(await storage.exists(key))) {
    return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });
  }
  const buf = await storage.readBuffer(key);
  const name = originalNameFromKey(key);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
