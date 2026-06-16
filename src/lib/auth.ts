import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Đăng nhập trang nội bộ bằng MẬT KHẨU CHUNG (giai đoạn đầu).
// Cookie phiên được ký HMAC để không thể giả mạo.
// Khi cần nâng cấp lên tài khoản riêng từng người, thay phần này bằng một
// thư viện auth (vd Auth.js) mà không đụng tới form khách hàng.

export const SESSION_COOKIE_NAME = "admin_session";
const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const PAYLOAD = "admin-ok";

function hmac(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function sessionCookieValue(): string {
  return `${PAYLOAD}.${hmac(PAYLOAD)}`;
}

function verify(signed: string | undefined): boolean {
  if (!signed) return false;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return false;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = hmac(value);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b) && value === PAYLOAD;
}

export function checkPassword(pw: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !pw) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verify(store.get(SESSION_COOKIE_NAME)?.value);
}

/** Dùng trong server component của /admin/*: chặn nếu chưa đăng nhập. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/admin/login");
}
