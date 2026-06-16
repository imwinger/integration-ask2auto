"use client";

import { useRef, useState } from "react";
import { SAMPLE_USE_CASES } from "@/lib/sampleData";
import type {
  Admin,
  FileRef,
  OnlineSource,
  Process,
  UseCase,
} from "@/lib/types";

type UploadItem = FileRef & {
  localId: string;
  status: "uploading" | "done" | "error";
};

type ProcState = {
  localId: string;
  tenQuyTrinh: string;
  fileMoTaBuoc: UploadItem | null;
  bieuMau: UploadItem[];
};

let counter = 0;
const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function uploadOne(file: File): Promise<FileRef> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  if (!r.ok) throw new Error("Tải file thất bại");
  return (await r.json()) as FileRef;
}

// ── Validation helpers ──
const VALID_NAME = /^[a-zA-Z\s]+$/;
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_PHONE_VN = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;

function validateAdmin(a: Admin): string | null {
  if (a.hoTen.trim() && !VALID_NAME.test(a.hoTen.trim()))
    return "Họ tên chỉ được chứa ký tự a-z, A-Z và khoảng trắng.";
  if (a.email.trim() && !VALID_EMAIL.test(a.email.trim()))
    return "Email không đúng định dạng.";
  if (a.sdt.trim() && !VALID_PHONE_VN.test(a.sdt.trim()))
    return "Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số (VD: 0912345678).";
  return null;
}

// ── MD3 style tokens ──
const cls = {
  input:
    "w-full rounded-[var(--md-corner-xs)] border border-md-outline bg-md-surface px-4 py-3.5 text-sm font-[var(--md-font-plain)] text-md-on-surface outline-none transition-all focus:border-md-primary focus:border-2 focus:px-[15px] focus:py-[13px] focus:ring-0 placeholder:text-md-on-surface-var",
  label: "block text-sm font-medium text-md-on-surface mb-1.5",
  card: "rounded-[var(--md-corner-lg)] border border-md-outline-var bg-md-surface-ctr-lowest p-5 sm:p-6 shadow-sm",
  sub: "rounded-[var(--md-corner-md)] border border-md-outline-var bg-md-surface-ctr-low p-4",
  ghost:
    "inline-flex items-center gap-1.5 rounded-full border border-md-outline bg-md-surface px-4 py-2 text-sm font-medium text-md-on-surface transition hover:bg-md-surface-ctr-high disabled:opacity-40",
  btnPrimary:
    "w-full rounded-full bg-md-primary px-6 py-3.5 text-sm font-medium text-md-on-primary transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40",
  fieldErr: "mt-1 text-xs text-md-error",
};

function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}

function SectionHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-md-primary-ctr text-sm font-medium text-md-on-primary-ctr">
          {n}
        </span>
        <h2 className="font-brand text-lg font-normal text-md-on-surface">{title}</h2>
      </div>
    </div>
  );
}

function FileChip({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-[var(--md-corner-sm)] border border-md-outline-var bg-md-surface-ctr-lowest px-3 py-2.5 text-sm">
      <Icon name="description" size={18} className="text-md-on-surface-var" />
      <span className="flex-1 truncate text-md-on-surface">{item.tenFile}</span>
      {item.status === "uploading" && (
        <span className="flex items-center gap-1 text-xs text-md-on-surface-var">
          <Icon name="progress_activity" size={14} className="animate-spin" /> đang tải…
        </span>
      )}
      {item.status === "done" && (
        <>
          <span className="text-xs text-md-on-surface-var">{formatBytes(item.dungLuong)}</span>
          <Icon name="check_circle" size={18} className="text-[#386A4F]" />
        </>
      )}
      {item.status === "error" && <span className="text-xs text-md-error">lỗi</span>}
      <button type="button" onClick={onRemove} aria-label="Xóa file" className="rounded-full p-1 text-md-on-surface-var transition hover:bg-md-error-ctr hover:text-md-error">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export default function FormPage() {
  const [orgName, setOrgName] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([{ hoTen: "", email: "", sdt: "" }]);
  const [adminErrors, setAdminErrors] = useState<(string | null)[]>([null]);
  const [docFiles, setDocFiles] = useState<UploadItem[]>([]);
  const [sources, setSources] = useState<OnlineSource[]>([]);
  const [procs, setProcs] = useState<ProcState[]>([]);
  const [integ, setInteg] = useState<"" | "yes" | "no">("");
  const [useCases, setUseCases] = useState<UseCase[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);

  // ── Phần 1: admins ──
  const setAdmin = (i: number, key: keyof Admin, v: string) => {
    setAdmins((a) => a.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));
    setAdminErrors((e) => {
      const next = [...e];
      const updated = { ...admins[i], [key]: v };
      next[i] = validateAdmin(updated);
      return next;
    });
  };
  const addAdmin = () => {
    setAdmins((a) => [...a, { hoTen: "", email: "", sdt: "" }]);
    setAdminErrors((e) => [...e, null]);
  };
  const removeAdmin = (i: number) => {
    setAdmins((a) => a.filter((_, idx) => idx !== i));
    setAdminErrors((e) => e.filter((_, idx) => idx !== i));
  };

  // ── Phần 2A: doc files (kiểm tra trùng tên) ──
  const addDocFiles = async (files: FileList | null) => {
    if (!files) return;
    const existingNames = new Set(docFiles.map((d) => d.tenFile));
    const filtered = Array.from(files).filter((f) => {
      if (existingNames.has(f.name)) {
        setError(`File "${f.name}" đã tồn tại, không tải lên lại.`);
        return false;
      }
      existingNames.add(f.name);
      return true;
    });
    if (!filtered.length) return;

    const items: UploadItem[] = filtered.map((f) => ({
      localId: uid(),
      tenFile: f.name,
      dungLuong: f.size,
      storageKey: "",
      status: "uploading",
    }));
    setDocFiles((d) => [...d, ...items]);
    await Promise.all(
      items.map(async (it, idx) => {
        try {
          const ref = await uploadOne(filtered[idx]);
          setDocFiles((d) =>
            d.map((x) => (x.localId === it.localId ? { ...x, ...ref, status: "done" } : x))
          );
        } catch {
          setDocFiles((d) =>
            d.map((x) => (x.localId === it.localId ? { ...x, status: "error" } : x))
          );
        }
      })
    );
    if (docInputRef.current) docInputRef.current.value = "";
  };
  const removeDoc = (id: string) => {
    setDocFiles((d) => d.filter((x) => x.localId !== id));
    setError("");
  };

  // ── Phần 2A: online sources ──
  const addSource = () => setSources((s) => [...s, { url: "", huongDanLayND: "", tanSuatCapNhat: "" }]);
  const setSource = (i: number, key: keyof OnlineSource, v: string) =>
    setSources((s) => s.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));
  const removeSource = (i: number) => setSources((s) => s.filter((_, idx) => idx !== i));

  // ── Phần 2B: processes ──
  const addProc = () =>
    setProcs((p) => [...p, { localId: uid(), tenQuyTrinh: "", fileMoTaBuoc: null, bieuMau: [] }]);
  const removeProc = (id: string) => setProcs((p) => p.filter((x) => x.localId !== id));
  const setProcName = (id: string, v: string) =>
    setProcs((p) => p.map((x) => (x.localId === id ? { ...x, tenQuyTrinh: v } : x)));

  const uploadProcSteps = async (id: string, file: File | undefined) => {
    if (!file) return;
    const it: UploadItem = { localId: uid(), tenFile: file.name, dungLuong: file.size, storageKey: "", status: "uploading" };
    setProcs((p) => p.map((x) => (x.localId === id ? { ...x, fileMoTaBuoc: it } : x)));
    try {
      const ref = await uploadOne(file);
      setProcs((p) => p.map((x) => (x.localId === id ? { ...x, fileMoTaBuoc: { ...it, ...ref, status: "done" } } : x)));
    } catch {
      setProcs((p) => p.map((x) => (x.localId === id ? { ...x, fileMoTaBuoc: { ...it, status: "error" } } : x)));
    }
  };

  const uploadProcForms = async (id: string, files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const items: UploadItem[] = arr.map((f) => ({ localId: uid(), tenFile: f.name, dungLuong: f.size, storageKey: "", status: "uploading" }));
    setProcs((p) => p.map((x) => (x.localId === id ? { ...x, bieuMau: [...x.bieuMau, ...items] } : x)));
    await Promise.all(
      items.map(async (it, idx) => {
        try {
          const ref = await uploadOne(arr[idx]);
          setProcs((p) => p.map((x) => x.localId === id ? { ...x, bieuMau: x.bieuMau.map((b) => (b.localId === it.localId ? { ...b, ...ref, status: "done" } : b)) } : x));
        } catch {
          setProcs((p) => p.map((x) => x.localId === id ? { ...x, bieuMau: x.bieuMau.map((b) => (b.localId === it.localId ? { ...b, status: "error" } : b)) } : x));
        }
      })
    );
  };
  const removeProcForm = (id: string, bid: string) =>
    setProcs((p) => p.map((x) => (x.localId === id ? { ...x, bieuMau: x.bieuMau.filter((b) => b.localId !== bid) } : x)));

  // ── Phần 3: use cases ──
  const chooseInteg = (v: "yes" | "no") => {
    setInteg(v);
    if (v === "yes" && useCases.length === 0)
      setUseCases([{ moTa: "", heThongDich: "", daCoApi: "", dauMoiTen: "", dauMoiEmail: "" }]);
  };
  const fillSample = () => {
    setInteg("yes");
    setUseCases(SAMPLE_USE_CASES.map((u) => ({ ...u })));
  };
  const clearSample = () => setUseCases([{ moTa: "", heThongDich: "", daCoApi: "", dauMoiTen: "", dauMoiEmail: "" }]);
  const addUseCase = () => setUseCases((u) => [...u, { moTa: "", heThongDich: "", daCoApi: "", dauMoiTen: "", dauMoiEmail: "" }]);
  const setUseCase = (i: number, key: keyof UseCase, v: string) =>
    setUseCases((u) => u.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));
  const removeUseCase = (i: number) => setUseCases((u) => u.filter((_, idx) => idx !== i));

  // ── submit ──
  const anyUploading =
    docFiles.some((d) => d.status === "uploading") ||
    procs.some((p) => p.fileMoTaBuoc?.status === "uploading" || p.bieuMau.some((b) => b.status === "uploading"));

  const submit = async () => {
    setError("");
    if (!orgName.trim()) return setError("Vui lòng nhập tên tổ chức / đơn vị.");
    if (!admins.some((a) => a.hoTen.trim()))
      return setError("Vui lòng nhập ít nhất 1 quản trị viên (họ tên).");

    const errs = admins.map(validateAdmin);
    setAdminErrors(errs);
    const firstErr = errs.find((e) => e !== null);
    if (firstErr) return setError(firstErr);

    if (anyUploading) return setError("Vui lòng đợi các file tải lên xong.");

    const stripFile = (u: UploadItem): FileRef => ({ tenFile: u.tenFile, dungLuong: u.dungLuong, storageKey: u.storageKey });
    const payload = {
      orgName: orgName.trim(),
      admins,
      docFiles: docFiles.filter((d) => d.status === "done").map(stripFile),
      onlineSources: sources,
      processes: procs.map<Process>((p) => ({
        tenQuyTrinh: p.tenQuyTrinh,
        fileMoTaBuoc: p.fileMoTaBuoc && p.fileMoTaBuoc.status === "done" ? stripFile(p.fileMoTaBuoc) : null,
        bieuMau: p.bieuMau.filter((b) => b.status === "done").map(stripFile),
      })),
      needsIntegration: integ === "yes",
      useCases,
    };

    setSubmitting(true);
    try {
      const r = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gửi thất bại");
      setDoneId(j.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──
  if (doneId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className={cls.card + " text-center"}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#386A4F]/10">
            <Icon name="check_circle" size={36} className="text-[#386A4F]" />
          </div>
          <h1 className="font-brand text-xl text-md-on-surface">Đã gửi thông tin thành công!</h1>
          <p className="mt-2 text-sm text-md-on-surface-var">
            Cảm ơn bạn. Đội kỹ thuật đã nhận được thông tin và sẽ liên hệ để khởi tạo chatbot.
          </p>
          <p className="mt-4 inline-block rounded-full bg-md-surface-ctr px-4 py-2 text-sm text-md-on-surface-var">
            Mã lượt gửi: <span className="font-medium text-md-on-surface">{doneId}</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--md-corner-md)] bg-md-brand">
            <Icon name="smart_toy" size={22} className="text-white" />
          </span>
          <span className="font-brand text-lg text-md-on-surface tracking-tight">Ask2Auto</span>
        </div>
        <h1 className="font-brand text-2xl text-md-on-surface">
          Đăng ký thông tin khởi tạo chatbot
        </h1>
        <p className="mt-2 text-sm text-md-on-surface-var leading-relaxed">
          Vui lòng cung cấp thông tin bên dưới để đội kỹ thuật cấu hình chatbot đúng nhu cầu của bạn.
          Trường có dấu <span className="text-md-error">*</span> là bắt buộc.
        </p>
      </header>

      <div className="space-y-6">
        {/* ──── PHẦN 1 ──── */}
        <section className={cls.card}>
          <SectionHead n={1} title="Tổ chức & người phụ trách" />
          <label className={cls.label}>
            Tên tổ chức / đơn vị <span className="text-md-error">*</span>
          </label>
          <input className={cls.input} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="VD: Công ty TNHH ABC" />

          <div className="mt-5 mb-2 flex items-center justify-between">
            <label className={cls.label + " mb-0"}>
              Quản trị viên chatbot <span className="text-md-error">*</span>
            </label>
            <span className="text-xs text-md-on-surface-var">có thể thêm nhiều người</span>
          </div>
          <div className="space-y-3">
            {admins.map((a, i) => (
              <div key={i} className={cls.sub}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <input className={cls.input} placeholder="Họ tên (a-z, A-Z)" value={a.hoTen} onChange={(e) => setAdmin(i, "hoTen", e.target.value)} />
                  </div>
                  <div>
                    <input className={cls.input} placeholder="Số điện thoại (VD: 0912345678)" value={a.sdt} onChange={(e) => setAdmin(i, "sdt", e.target.value)} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <input className={cls.input} placeholder="Email" type="email" value={a.email} onChange={(e) => setAdmin(i, "email", e.target.value)} />
                  </div>
                  {admins.length > 1 && (
                    <button type="button" onClick={() => removeAdmin(i)} aria-label="Xóa quản trị viên" className="flex-none rounded-full p-2 text-md-on-surface-var transition hover:bg-md-error-ctr hover:text-md-error">
                      <Icon name="close" size={18} />
                    </button>
                  )}
                </div>
                {adminErrors[i] && <p className={cls.fieldErr}>{adminErrors[i]}</p>}
              </div>
            ))}
          </div>
          <button type="button" onClick={addAdmin} className={cls.ghost + " mt-3"}>
            <Icon name="add" size={18} /> Thêm quản trị viên
          </button>
        </section>

        {/* ──── PHẦN 2 ──── */}
        <section className={cls.card}>
          <SectionHead n={2} title="Kiến thức cho chatbot" />

          {/* Nhóm A */}
          <div className={cls.sub + " mb-4"}>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-md-secondary-ctr px-2.5 py-0.5 text-xs font-medium text-md-on-secondary-ctr">Nhóm A</span>
              <span className="text-sm font-medium text-md-on-surface">Kiến thức dạng văn bản</span>
            </div>

            <button type="button" onClick={() => docInputRef.current?.click()} className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-[var(--md-corner-md)] border-2 border-dashed border-md-outline-var bg-md-surface px-4 py-7 text-center text-md-on-surface-var transition hover:border-md-primary hover:bg-md-primary-ctr/30">
              <Icon name="cloud_upload" size={28} className="text-md-on-surface-var" />
              <span className="text-sm">Kéo thả hoặc <span className="font-medium text-md-primary">chọn file</span> (PDF, Word, Excel…)</span>
              <span className="text-xs text-md-on-surface-var">Không giới hạn số lượng &amp; dung lượng mỗi file</span>
            </button>
            <input ref={docInputRef} type="file" multiple className="hidden" onChange={(e) => addDocFiles(e.target.files)} />

            {docFiles.length > 0 && (
              <div className="mt-2">
                {docFiles.map((f) => (
                  <FileChip key={f.localId} item={f} onRemove={() => removeDoc(f.localId)} />
                ))}
                <p className="mt-2 text-xs text-md-on-surface-var">
                  {docFiles.filter((d) => d.status === "done").length} file đã tải lên thành công
                </p>
              </div>
            )}

            <div className="mt-4 border-t border-md-outline-var pt-3">
              <p className={cls.label}>Hoặc nội dung đã có sẵn trên website / cổng thông tin</p>
              {sources.map((s, i) => (
                <div key={i} className="mb-2 rounded-[var(--md-corner-sm)] border border-md-outline-var bg-md-surface-ctr-lowest p-3">
                  <input className={cls.input + " mb-2"} placeholder="Link nguồn (URL)" value={s.url} onChange={(e) => setSource(i, "url", e.target.value)} />
                  <textarea className={cls.input + " mb-2 min-h-[60px]"} placeholder="Hướng dẫn cách lấy nội dung: vào mục nào, phần nào lấy / bỏ qua…" value={s.huongDanLayND} onChange={(e) => setSource(i, "huongDanLayND", e.target.value)} />
                  <div className="flex items-center gap-2">
                    <input className={cls.input} placeholder="Tần suất cập nhật (VD: hằng tuần)" value={s.tanSuatCapNhat} onChange={(e) => setSource(i, "tanSuatCapNhat", e.target.value)} />
                    <button type="button" onClick={() => removeSource(i)} aria-label="Xóa nguồn" className="flex-none rounded-full p-2 text-md-on-surface-var transition hover:bg-md-error-ctr hover:text-md-error">
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addSource} className={cls.ghost}>
                <Icon name="add" size={18} /> Thêm nguồn online
              </button>
            </div>
          </div>

          {/* Nhóm B */}
          <div className={cls.sub}>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-md-secondary-ctr px-2.5 py-0.5 text-xs font-medium text-md-on-secondary-ctr">Nhóm B</span>
              <span className="text-sm font-medium text-md-on-surface">Quy trình có biểu mẫu</span>
            </div>

            <div className="mt-3">
              {procs.map((p) => (
                <div key={p.localId} className="mb-3 rounded-[var(--md-corner-sm)] border border-md-outline-var bg-md-surface-ctr-lowest p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input className={cls.input} placeholder="Tên quy trình" value={p.tenQuyTrinh} onChange={(e) => setProcName(p.localId, e.target.value)} />
                    <button type="button" onClick={() => removeProc(p.localId)} aria-label="Xóa quy trình" className="flex-none rounded-full p-2 text-md-on-surface-var transition hover:bg-md-error-ctr hover:text-md-error">
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-medium text-md-on-surface-var">File mô tả các bước</p>
                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[var(--md-corner-sm)] border border-dashed border-md-outline-var px-3 py-3 text-xs text-md-on-surface-var hover:border-md-primary">
                        <Icon name="description" size={16} /> Chọn 1 file
                        <input type="file" className="hidden" onChange={(e) => uploadProcSteps(p.localId, e.target.files?.[0])} />
                      </label>
                      {p.fileMoTaBuoc && <FileChip item={p.fileMoTaBuoc} onRemove={() => setProcs((ps) => ps.map((x) => (x.localId === p.localId ? { ...x, fileMoTaBuoc: null } : x)))} />}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-md-on-surface-var">Biểu mẫu đi kèm</p>
                      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[var(--md-corner-sm)] border border-dashed border-md-outline-var px-3 py-3 text-xs text-md-on-surface-var hover:border-md-primary">
                        <Icon name="cloud_upload" size={16} /> Chọn nhiều file
                        <input type="file" multiple className="hidden" onChange={(e) => uploadProcForms(p.localId, e.target.files)} />
                      </label>
                      {p.bieuMau.map((b) => (
                        <FileChip key={b.localId} item={b} onRemove={() => removeProcForm(p.localId, b.localId)} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addProc} className={cls.ghost}>
                <Icon name="add" size={18} /> Thêm quy trình
              </button>
            </div>
          </div>
        </section>

        {/* ──── PHẦN 3 ──── */}
        <section className={cls.card}>
          <SectionHead n={3} title="Kết nối hệ thống (tùy chọn)" />
          <p className="text-sm font-medium text-md-on-surface">
            Chatbot có cần kết nối tới hệ thống / phần mềm khác của bạn không?
          </p>
          <p className="mt-1 text-sm text-md-on-surface-var">VD: tra cứu đơn hàng, trạng thái hồ sơ, tồn kho, đặt lịch…</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-md-on-surface">
              <input type="radio" name="integ" checked={integ === "yes"} onChange={() => chooseInteg("yes")} className="accent-[var(--md-primary)]" /> Có
            </label>
            <label className="flex items-center gap-2 text-sm text-md-on-surface">
              <input type="radio" name="integ" checked={integ === "no"} onChange={() => chooseInteg("no")} className="accent-[var(--md-primary)]" /> Không / chưa rõ
            </label>
            <button type="button" onClick={fillSample} className={cls.ghost + " ml-auto"}>
              <Icon name="visibility" size={18} />
              Điền dữ liệu mẫu
            </button>
          </div>

          {integ === "yes" && (
            <div className="mt-4 space-y-3">
              {useCases.map((u, i) => (
                <div key={i} className={cls.sub}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-md-on-surface-var">Use case {i + 1}</span>
                    <button type="button" onClick={() => removeUseCase(i)} aria-label="Xóa use case" className="rounded-full p-1 text-md-on-surface-var transition hover:bg-md-error-ctr hover:text-md-error">
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <input className={cls.input + " mb-2"} placeholder="Cần bot làm gì? (VD: tra cứu trạng thái hồ sơ)" value={u.moTa} onChange={(e) => setUseCase(i, "moTa", e.target.value)} />
                  <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input className={cls.input} placeholder="Hệ thống đích (VD: phần mềm một cửa)" value={u.heThongDich} onChange={(e) => setUseCase(i, "heThongDich", e.target.value)} />
                    <select className={cls.input} value={u.daCoApi} onChange={(e) => setUseCase(i, "daCoApi", e.target.value)}>
                      <option value="">Đã có API?</option>
                      <option>Có</option>
                      <option>Chưa</option>
                      <option>Không rõ</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input className={cls.input} placeholder="Đầu mối kỹ thuật — họ tên" value={u.dauMoiTen} onChange={(e) => setUseCase(i, "dauMoiTen", e.target.value)} />
                    <input className={cls.input} placeholder="Email kỹ thuật" type="email" value={u.dauMoiEmail} onChange={(e) => setUseCase(i, "dauMoiEmail", e.target.value)} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <button type="button" onClick={addUseCase} className={cls.ghost}>
                  <Icon name="add" size={18} /> Thêm use case
                </button>
                <button type="button" onClick={clearSample} className="text-xs text-md-on-surface-var hover:text-md-on-surface">Xóa dữ liệu mẫu</button>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-[var(--md-corner-sm)] border border-md-error/30 bg-md-error-ctr px-4 py-3 text-sm text-md-on-error-ctr">
            <Icon name="error" size={18} />
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitting || anyUploading}
          className={cls.btnPrimary}
        >
          {submitting ? "Đang gửi…" : "Gửi thông tin cho đội kỹ thuật"}
        </button>
        <p className="pb-8 text-center text-xs text-md-on-surface-var">
          Ask2Auto · Thông tin của bạn chỉ được dùng để khởi tạo chatbot.
        </p>
      </div>
    </main>
  );
}
