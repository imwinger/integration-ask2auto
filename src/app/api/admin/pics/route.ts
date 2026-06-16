import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const pics = await prisma.pic.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(pics);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const { name, type } = await req.json();
  if (!name?.trim() || !["sale", "product"].includes(type)) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });
  }
  const pic = await prisma.pic.create({
    data: { name: name.trim(), type },
  });
  return NextResponse.json(pic, { status: 201 });
}
