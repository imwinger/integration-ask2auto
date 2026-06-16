import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import type { SubmissionData, FileRef } from "@/lib/types";
import type { Archiver } from "archiver";
import { createRequire } from "node:module";
import { PassThrough, Readable } from "stream";

export const runtime = "nodejs";

// @types/archiver@8 không khai báo hàm callable mặc định; require trực tiếp.
const createArchiver = createRequire(import.meta.url)("archiver") as (
  format: string,
  options?: Record<string, unknown>
) => Archiver;

function slug(s: string, max = 40): string {
  return (s || "").replace(/[^\w.\- ]+/g, "_").trim().slice(0, max) || "muc";
}

// Tải về TẤT CẢ file/biểu mẫu của 1 lượt gửi, dưới dạng .zip có thư mục rõ ràng.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const sub = await prisma.submission.findUnique({ where: { id } });
  if (!sub) {
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  }
  const data = JSON.parse(sub.data) as SubmissionData;

  const files: { ref: FileRef; folder: string }[] = [];
  data.docFiles.forEach((f) => files.push({ ref: f, folder: "01-Van-ban" }));
  data.processes.forEach((p, i) => {
    const folder = `02-Quy-trinh/${String(i + 1).padStart(2, "0")}-${slug(p.tenQuyTrinh)}`;
    if (p.fileMoTaBuoc) files.push({ ref: p.fileMoTaBuoc, folder });
    (p.bieuMau || []).forEach((b) => files.push({ ref: b, folder }));
  });

  const archive = createArchiver("zip", { zlib: { level: 9 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  for (const { ref, folder } of files) {
    if (await storage.exists(ref.storageKey)) {
      const buf = await storage.readBuffer(ref.storageKey);
      archive.append(buf, { name: `${folder}/${ref.tenFile}` });
    }
  }
  // Kèm bản tóm tắt toàn bộ thông tin đã điền.
  archive.append(JSON.stringify(data, null, 2), { name: "thong-tin.json" });
  archive.finalize();

  const webStream = Readable.toWeb(pass) as unknown as ReadableStream;
  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(slug(sub.orgName))}.zip`,
    },
  });
}
