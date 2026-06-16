import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

// Nhận 1 file (multipart) -> lưu qua Storage adapter -> trả về tham chiếu.
// Lưu ý local: file được đọc vào bộ nhớ trước khi ghi ổ đĩa. Khi chuyển sang
// cloud cho file rất lớn, đổi sang presigned upload (browser upload thẳng).
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await storage.save(file.name || "file", buf);
  return NextResponse.json({
    storageKey: saved.key,
    tenFile: saved.originalName,
    dungLuong: saved.size,
  });
}
