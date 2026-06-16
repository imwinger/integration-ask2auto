import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubmissionData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Partial<SubmissionData>;
  try {
    body = (await req.json()) as Partial<SubmissionData>;
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const orgName = (body.orgName || "").trim();
  if (!orgName) {
    return NextResponse.json({ error: "Vui lòng nhập tên tổ chức" }, { status: 400 });
  }

  const admins = (body.admins || []).filter(
    (a) => a && (a.hoTen?.trim() || a.email?.trim() || a.sdt?.trim())
  );
  if (admins.length === 0) {
    return NextResponse.json(
      { error: "Cần ít nhất 1 quản trị viên" },
      { status: 400 }
    );
  }

  const needsIntegration = !!body.needsIntegration;

  const data: SubmissionData = {
    orgName,
    admins,
    docFiles: (body.docFiles || []).filter((f) => f && f.storageKey),
    onlineSources: (body.onlineSources || []).filter(
      (s) => s && (s.url?.trim() || s.huongDanLayND?.trim() || s.tanSuatCapNhat?.trim())
    ),
    processes: (body.processes || []).filter(
      (p) => p && (p.tenQuyTrinh?.trim() || p.fileMoTaBuoc || (p.bieuMau && p.bieuMau.length > 0))
    ),
    needsIntegration,
    useCases: needsIntegration
      ? (body.useCases || []).filter(
          (u) => u && (u.moTa?.trim() || u.heThongDich?.trim() || u.dauMoiTen?.trim())
        )
      : [],
  };

  const fileCount =
    data.docFiles.length +
    data.processes.reduce(
      (n, p) => n + (p.fileMoTaBuoc ? 1 : 0) + (p.bieuMau?.length || 0),
      0
    );

  const created = await prisma.submission.create({
    data: {
      orgName,
      needsIntegration,
      fileCount,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ id: created.id });
}
