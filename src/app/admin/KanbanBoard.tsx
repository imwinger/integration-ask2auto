"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PicTag, SubmissionCard } from "@/lib/types";

const STATUSES = ["todo", "in_progress", "testing", "done"] as const;

const STATUS_META: Record<
  string,
  { label: string; color: string; border: string; bg: string; dragBg: string; badge: string }
> = {
  todo: {
    label: "To do",
    color: "text-[#9A4A1F]",
    border: "border-t-[#9A4A1F]",
    bg: "bg-md-surface-ctr-low",
    dragBg: "bg-md-primary-ctr/40",
    badge: "bg-[#FFDBC8] text-[#7A3411]",
  },
  in_progress: {
    label: "In progress",
    color: "text-[#3F5AA9]",
    border: "border-t-[#3F5AA9]",
    bg: "bg-md-surface-ctr-low",
    dragBg: "bg-[#D6E3FF]/50",
    badge: "bg-[#D6E3FF] text-[#1B3A75]",
  },
  testing: {
    label: "Testing",
    color: "text-[#6750A4]",
    border: "border-t-[#6750A4]",
    bg: "bg-md-surface-ctr-low",
    dragBg: "bg-[#EADDFF]/50",
    badge: "bg-[#EADDFF] text-[#4F378B]",
  },
  done: {
    label: "Done",
    color: "text-[#386A4F]",
    border: "border-t-[#386A4F]",
    bg: "bg-md-surface-ctr-low",
    dragBg: "bg-[#C8E6D2]/50",
    badge: "bg-[#C8E6D2] text-[#1B4332]",
  },
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(d));
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size }}>{name}</span>;
}

function PicChips({ pics, color }: { pics: PicTag[]; color: string }) {
  if (!pics.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {pics.map((p) => (
        <span key={p.id} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
          {p.name}
        </span>
      ))}
    </div>
  );
}

function Card({ sub, onDragStart }: { sub: SubmissionCard; onDragStart: (id: string) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", sub.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(sub.id);
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`group cursor-grab rounded-[var(--md-corner-md)] border border-md-outline-var bg-md-surface-ctr-lowest p-3.5 transition-all active:cursor-grabbing ${
        dragging ? "opacity-40 scale-95" : "hover:shadow-md hover:border-md-outline"
      }`}
    >
      <Link href={`/admin/${sub.id}`} className="block">
        <p className="text-sm font-medium text-md-on-surface group-hover:text-md-primary transition-colors">
          {sub.orgName}
        </p>
        <p className="mt-1 text-xs text-md-on-surface-var">{formatDate(sub.createdAt)}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-md-on-surface-var">
          <span className="flex items-center gap-1">
            <Icon name="description" size={14} />
            {sub.fileCount}
          </span>
        </div>
      </Link>
      {(sub.salePics.length > 0 || sub.productPics.length > 0) && (
        <div className="mt-2.5 space-y-1 border-t border-md-outline-var pt-2">
          <PicChips pics={sub.salePics} color="bg-[#D6E3FF] text-[#1B3A75]" />
          <PicChips pics={sub.productPics} color="bg-[#FFDBC8] text-[#7A3411]" />
        </div>
      )}
    </div>
  );
}

function PicManager({ pics, onClose, onRefresh }: { pics: PicTag[]; onClose: () => void; onRefresh: () => void }) {
  const [saleName, setSaleName] = useState("");
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const salePics = pics.filter((p) => p.type === "sale");
  const productPics = pics.filter((p) => p.type === "product");

  const addPic = async (name: string, type: "sale" | "product") => {
    if (!name.trim() || busyRef.current) return;
    busyRef.current = true;
    if (type === "sale") setSaleName("");
    else setProductName("");
    setLoading(true);
    await fetch("/api/admin/pics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });
    setLoading(false);
    busyRef.current = false;
    onRefresh();
  };

  const deletePic = async (id: string) => {
    setLoading(true);
    await fetch(`/api/admin/pics/${id}`, { method: "DELETE" });
    setLoading(false);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--md-on-surface)]/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--md-corner-xl)] border border-md-outline-var bg-md-surface-ctr-lowest p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-brand text-xl text-md-on-surface">Quản lý PIC</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-md-on-surface-var hover:bg-md-surface-ctr-high">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-md-on-surface">
              Sale PIC <span className="font-normal text-md-on-surface-var">({salePics.length})</span>
            </p>
            <div className="flex gap-2">
              <input
                value={saleName}
                onChange={(e) => setSaleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPic(saleName, "sale")}
                placeholder="Nhập tên…"
                className="flex-1 rounded-[var(--md-corner-xs)] border border-md-outline bg-md-surface px-3 py-2.5 text-sm text-md-on-surface outline-none focus:border-md-primary focus:border-2 placeholder:text-md-on-surface-var"
              />
              <button
                onClick={() => addPic(saleName, "sale")}
                disabled={loading || !saleName.trim()}
                className="rounded-full bg-[#3F5AA9] px-4 py-2.5 text-sm font-medium text-white hover:shadow-md disabled:opacity-40"
              >
                Thêm
              </button>
            </div>
            {salePics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {salePics.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 rounded-full bg-[#D6E3FF] px-2.5 py-1 text-xs font-medium text-[#1B3A75]">
                    {p.name}
                    <button onClick={() => deletePic(p.id)} className="ml-0.5 rounded-full p-0.5 hover:bg-[#A8C4FF]">
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-md-on-surface">
              Product PIC <span className="font-normal text-md-on-surface-var">({productPics.length})</span>
            </p>
            <div className="flex gap-2">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPic(productName, "product")}
                placeholder="Nhập tên…"
                className="flex-1 rounded-[var(--md-corner-xs)] border border-md-outline bg-md-surface px-3 py-2.5 text-sm text-md-on-surface outline-none focus:border-md-primary focus:border-2 placeholder:text-md-on-surface-var"
              />
              <button
                onClick={() => addPic(productName, "product")}
                disabled={loading || !productName.trim()}
                className="rounded-full bg-md-primary px-4 py-2.5 text-sm font-medium text-md-on-primary hover:shadow-md disabled:opacity-40"
              >
                Thêm
              </button>
            </div>
            {productPics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {productPics.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 rounded-full bg-[#FFDBC8] px-2.5 py-1 text-xs font-medium text-[#7A3411]">
                    {p.name}
                    <button onClick={() => deletePic(p.id)} className="ml-0.5 rounded-full p-0.5 hover:bg-[#FFD0B0]">
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({
  initialSubmissions,
  initialPics,
}: {
  initialSubmissions: SubmissionCard[];
  initialPics: PicTag[];
}) {
  const router = useRouter();
  const [subs, setSubs] = useState(initialSubmissions);
  const [pics, setPics] = useState(initialPics);
  const [showPicManager, setShowPicManager] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);

  const refreshPics = useCallback(async () => {
    const r = await fetch("/api/admin/pics");
    if (r.ok) setPics(await r.json());
  }, []);

  const moveCard = useCallback(
    async (subId: string, newStatus: string) => {
      const prev = subs.find((s) => s.id === subId);
      if (!prev || prev.status === newStatus) return;
      setSubs((curr) => curr.map((s) => (s.id === subId ? { ...s, status: newStatus } : s)));
      const r = await fetch(`/api/admin/submissions/${subId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) {
        setSubs((curr) => curr.map((s) => (s.id === subId ? { ...s, status: prev.status } : s)));
      }
    },
    [subs]
  );

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-md-outline-var bg-md-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--md-corner-md)] bg-md-brand">
              <Icon name="smart_toy" size={22} />
            </span>
            <div>
              <h1 className="font-brand text-lg text-md-on-surface">Ask2Auto — Tiến độ khởi tạo</h1>
              <p className="text-xs text-md-on-surface-var">
                {subs.length} lượt gửi · Kéo thả để đổi trạng thái
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPicManager(true)} className="inline-flex items-center gap-1.5 rounded-full border border-md-outline bg-md-surface px-4 py-2 text-sm font-medium text-md-on-surface hover:bg-md-surface-ctr-high">
              <Icon name="group" size={18} /> Quản lý PIC
            </button>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full border border-md-outline bg-md-surface px-4 py-2 text-sm text-md-on-surface-var hover:bg-md-surface-ctr-high">
              <Icon name="logout" size={18} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="grid grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const meta = STATUS_META[status];
            const cards = subs.filter((s) => s.status === status);
            const isDragOver = dragOverCol === status;

            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
                onDrop={(e) => { e.preventDefault(); setDragOverCol(null); const id = e.dataTransfer.getData("text/plain"); if (id) moveCard(id, status); }}
                className={`flex min-h-[60vh] flex-col rounded-[var(--md-corner-lg)] border border-t-4 transition-colors ${meta.border} ${isDragOver ? meta.dragBg : "border-md-outline-var " + meta.bg}`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>{cards.length}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 px-3 pb-3">
                  {cards.map((sub) => (
                    <Card key={sub.id} sub={sub} onDragStart={(id) => { dragItemId.current = id; }} />
                  ))}
                  {cards.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-[var(--md-corner-md)] border-2 border-dashed border-md-outline-var text-xs text-md-on-surface-var">
                      Kéo thả vào đây
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showPicManager && <PicManager pics={pics} onClose={() => setShowPicManager(false)} onRefresh={refreshPics} />}
    </div>
  );
}
