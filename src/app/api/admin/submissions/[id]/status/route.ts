import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID = ["todo", "in_progress", "testing", "done"];

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { status } = await req.json();
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }
  const sub = await prisma.submission.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ id: sub.id, status: sub.status });
}
