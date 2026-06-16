import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { salePicIds, productPicIds } = (await req.json()) as {
    salePicIds?: string[];
    productPicIds?: string[];
  };

  const data: Record<string, unknown> = {};
  if (salePicIds) {
    data.salePics = { set: salePicIds.map((pid) => ({ id: pid })) };
  }
  if (productPicIds) {
    data.productPics = { set: productPicIds.map((pid) => ({ id: pid })) };
  }

  const sub = await prisma.submission.update({
    where: { id },
    data,
    include: { salePics: true, productPics: true },
  });
  return NextResponse.json({
    salePics: sub.salePics,
    productPics: sub.productPics,
  });
}
