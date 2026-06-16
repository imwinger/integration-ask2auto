"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setErr("Sai mật khẩu, vui lòng thử lại.");
      }
    } catch {
      setErr("Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[var(--md-corner-xl)] border border-md-outline-var bg-md-surface-ctr-lowest p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--md-corner-md)] bg-md-brand">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>smart_toy</span>
          </span>
          <span className="font-brand text-lg text-md-on-surface tracking-tight">Ask2Auto</span>
        </div>
        <h1 className="font-brand text-xl text-md-on-surface">Trang nội bộ</h1>
        <p className="mt-1.5 text-sm text-md-on-surface-var">
          Dành cho nhân viên kỹ thuật. Nhập mật khẩu để xem các lượt gửi.
        </p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Mật khẩu"
          className="mt-5 w-full rounded-[var(--md-corner-xs)] border border-md-outline bg-md-surface px-4 py-3.5 text-sm text-md-on-surface outline-none transition-all focus:border-md-primary focus:border-2 focus:px-[15px] focus:py-[13px] placeholder:text-md-on-surface-var"
        />
        {err && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-md-error">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
            {err}
          </p>
        )}
        <button
          onClick={submit}
          disabled={loading}
          className="mt-5 w-full rounded-full bg-md-primary px-4 py-3 text-sm font-medium text-md-on-primary transition hover:shadow-md disabled:opacity-50"
        >
          {loading ? "Đang kiểm tra…" : "Đăng nhập"}
        </button>
      </div>
    </main>
  );
}
