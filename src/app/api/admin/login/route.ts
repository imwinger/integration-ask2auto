import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  sessionCookieValue,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { password } = await req
    .json()
    .catch(() => ({ password: "" }));

  if (!checkPassword(String(password || ""))) {
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 giờ
  });
  return res;
}
