import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  STATUSES,
  statusLabel,
  formatDate,
  formatBytes,
} from "@/lib/display";
import type { FileRef, PicTag, SubmissionData } from "@/lib/types";
import PicAssigner from "./PicAssigner";
import { CopyButton, Collapsible, StatusSelect } from "./DetailWidgets";

export const dynamic = "force-dynamic";

function FileLink({ f }: { f: FileRef }) {
  return (
    <a
      href={`/api/admin/file?key=${encodeURIComponent(f.storageKey)}`}
      className="flex items-center justify-between gap-2 rounded-[var(--md-corner-sm)] border border-md-outline-var bg-md-surface-ctr-lowest px-3 py-2.5 text-sm transition hover:border-md-primary hover:bg-md-primary-ctr/20"
    >
      <span className="flex items-center gap-2 truncate text-md-on-surface">
        <span className="material-symbols-outlined text-md-on-surface-var" style={{ fontSize: 18 }}>description</span>
        <span className="truncate">{f.tenFile}</span>
      </span>
      <span className="flex flex-none items-center gap-2 text-xs text-md-on-surface-var">
        {formatBytes(f.dungLuong)}
        <span className="material-symbols-outlined text-md-primary" style={{ fontSize: 18 }}>download</span>
      </span>
    </a>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--md-corner-lg)] border border-md-outline-var bg-md-surface-ctr-lowest p-5">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-md-on-surface-var">{title}</h2>
      {children}
    </section>
  );
}


export default async function SubmissionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [sub, allPics] = await Promise.all([
    prisma.submission.findUnique({
      where: { id },
      include: { salePics: true, productPics: true },
    }),
    prisma.pic.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!sub) notFound();

  const data = JSON.parse(sub.data) as SubmissionData;
  const picTags: PicTag[] = allPics.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as "sale" | "product",
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-md-on-surface-var hover:text-md-on-surface">
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        Về danh sách
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-brand text-xl text-md-on-surface">{data.orgName}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-md-on-surface-var">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
              Khởi tạo: {formatDate(sub.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit_calendar</span>
              Cập nhật: {formatDate(sub.updatedAt)}
            </span>
          </div>
        </div>
        <a
          href={`/api/admin/submissions/${sub.id}/zip`}
          className="inline-flex items-center gap-1.5 rounded-full bg-md-primary px-4 py-2 text-sm font-medium text-md-on-primary hover:shadow-md"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>folder_zip</span>
          Tải tất cả (.zip)
        </a>
      </div>

      <div className="mt-4">
        <StatusSelect
          submissionId={sub.id}
          initialStatus={sub.status}
          statuses={STATUSES}
          labels={Object.fromEntries(STATUSES.map((s) => [s, statusLabel(s)]))}
        />
      </div>

      <div className="mt-4 rounded-[var(--md-corner-lg)] border border-md-outline-var bg-md-surface-ctr-lowest p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-md-on-surface-var">Phân công PIC</h2>
        <PicAssigner
          submissionId={sub.id}
          allPics={picTags}
          initialSalePicIds={sub.salePics.map((p) => p.id)}
          initialProductPicIds={sub.productPics.map((p) => p.id)}
        />
      </div>

      <div className="mt-6 space-y-4">
        <Block title="1 · Tổ chức & người phụ trách">
          <p className="text-sm"><span className="text-md-on-surface-var">Tổ chức: </span><span className="font-medium text-md-on-surface">{data.orgName}</span></p>
          <p className="mt-3 mb-1.5 text-sm text-md-on-surface-var">Quản trị viên ({data.admins.length})</p>
          <div className="space-y-2">
            {data.admins.map((a, i) => (
              <div key={i} className="rounded-[var(--md-corner-sm)] bg-md-surface-ctr-low px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-md-on-surface-var" style={{ fontSize: 16 }}>person</span>
                    <span className="font-medium text-md-on-surface">{a.hoTen || "(chưa có tên)"}</span>
                    <CopyButton text={a.hoTen} />
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-md-on-surface-var" style={{ fontSize: 16 }}>mail</span>
                    <span className="text-md-on-surface-var">{a.email || "—"}</span>
                    <CopyButton text={a.email} />
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-md-on-surface-var" style={{ fontSize: 16 }}>phone</span>
                    <span className="text-md-on-surface-var">{a.sdt || "—"}</span>
                    <CopyButton text={a.sdt} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="2 · Kiến thức">
          <Collapsible title="Nhóm A — Văn bản" badge="A" count={data.docFiles.length}>
            {data.docFiles.length > 0 ? (
              <div className="space-y-1.5">{data.docFiles.map((f, i) => <FileLink key={i} f={f} />)}</div>
            ) : (
              <p className="text-sm text-md-on-surface-var">Không có file.</p>
            )}
            {data.onlineSources.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-md-on-surface-var">Nguồn online ({data.onlineSources.length})</p>
                <div className="space-y-2">
                  {data.onlineSources.map((s, i) => (
                    <div key={i} className="rounded-[var(--md-corner-sm)] bg-md-surface-ctr-low px-3 py-2.5 text-sm">
                      {s.url && <a href={s.url} className="break-all font-medium text-md-primary hover:underline">{s.url}</a>}
                      {s.huongDanLayND && <p className="mt-1 text-md-on-surface-var">{s.huongDanLayND}</p>}
                      {s.tanSuatCapNhat && <p className="mt-1 text-xs text-md-on-surface-var">Tần suất: {s.tanSuatCapNhat}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Collapsible>

          <Collapsible title="Nhóm B — Quy trình" badge="B" count={data.processes.length}>
            {data.processes.length > 0 ? (
              <div className="space-y-1">
                {data.processes.map((p, i) => (
                  <Collapsible key={i} title={p.tenQuyTrinh || `Quy trình ${i + 1}`} nested>
                    {p.fileMoTaBuoc && (
                      <div className="mb-2">
                        <p className="mb-1 text-xs text-md-on-surface-var">File mô tả các bước</p>
                        <FileLink f={p.fileMoTaBuoc} />
                      </div>
                    )}
                    {p.bieuMau.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-md-on-surface-var">Biểu mẫu ({p.bieuMau.length})</p>
                        <div className="space-y-1.5">{p.bieuMau.map((b, j) => <FileLink key={j} f={b} />)}</div>
                      </div>
                    )}
                    {!p.fileMoTaBuoc && p.bieuMau.length === 0 && (
                      <p className="text-sm text-md-on-surface-var">Chưa có file nào.</p>
                    )}
                  </Collapsible>
                ))}
              </div>
            ) : (
              <p className="text-sm text-md-on-surface-var">Không có quy trình.</p>
            )}
          </Collapsible>
        </Block>

        <Block title="3 · Kết nối hệ thống">
          <p className="text-sm">
            <span className="text-md-on-surface-var">Nhu cầu tích hợp: </span>
            <span className="font-medium text-md-on-surface">{data.needsIntegration ? "Có" : "Không có nhu cầu tích hợp"}</span>
          </p>
          {data.needsIntegration && data.useCases.length > 0 && (
            <div className="mt-3">
              {data.useCases.map((u, i) => (
                <Collapsible key={i} title={u.moTa || `Use case ${i + 1}`} nested>
                  <div className="space-y-2.5 rounded-[var(--md-corner-sm)] bg-md-surface-ctr-low px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-md-on-surface-var">Mô tả</p>
                      <p className="mt-0.5 text-sm text-md-on-surface">{u.moTa || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-md-on-surface-var">Hệ thống đích</p>
                        <p className="mt-0.5 text-sm text-md-on-surface">{u.heThongDich || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-md-on-surface-var">Đã có API?</p>
                        <p className="mt-0.5 text-sm text-md-on-surface">{u.daCoApi || "—"}</p>
                      </div>
                    </div>
                    {(u.dauMoiTen || u.dauMoiEmail) && (
                      <div className="border-t border-md-outline-var pt-2.5">
                        <p className="text-xs font-medium text-md-on-surface-var">Đầu mối kỹ thuật</p>
                        <p className="mt-0.5 text-sm text-md-on-surface">
                          {u.dauMoiTen || "—"}
                          {u.dauMoiEmail && <span className="text-md-on-surface-var"> · {u.dauMoiEmail}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </Block>
      </div>
    </main>
  );
}
