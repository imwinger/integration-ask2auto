"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trip,
  loadTrips,
  saveTrips,
  uid,
  formatVND,
  formatDate,
  computeTrip,
} from "@/lib/store";
import { cls, Icon, StatusChip } from "@/lib/ui";

export default function TripList() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips());
  const [newName, setNewName] = useState("");

  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  const { open, closed } = useMemo(() => {
    const sorted = [...trips].sort((a, b) => b.createdAt - a.createdAt);
    return {
      open: sorted.filter((t) => t.status === "open"),
      closed: sorted.filter((t) => t.status === "closed"),
    };
  }, [trips]);

  function createTrip() {
    const name =
      newName.trim() || `Chuyến đi ${new Date().toLocaleDateString("vi-VN")}`;
    const trip: Trip = {
      id: uid(),
      name,
      createdAt: Date.now(),
      status: "open",
      members: [],
      expenses: [],
    };
    setTrips((prev) => [trip, ...prev]);
    setNewName("");
    router.push(`/chuyen-di?id=${trip.id}`);
  }

  function toggleStatus(id: string) {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "open" ? "closed" : "open" } : t,
      ),
    );
  }

  function deleteTrip(trip: Trip) {
    if (!confirm(`Xoá chuyến đi "${trip.name}"? Toàn bộ dữ liệu của chuyến này sẽ mất.`))
      return;
    setTrips((prev) => prev.filter((t) => t.id !== trip.id));
  }

  function TripCard({ trip }: { trip: Trip }) {
    const { total, transfers } = computeTrip(trip);
    return (
      <li className={`${cls.card} flex flex-col gap-3`}>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/chuyen-di?id=${trip.id}`}
            className="min-w-0 text-base font-semibold text-md-on-surface hover:text-md-primary hover:underline"
          >
            {trip.name}
          </Link>
          <StatusChip status={trip.status} />
        </div>
        <p className="text-sm text-md-on-surface-var">
          {formatDate(trip.createdAt)} · {trip.members.length} thành viên ·{" "}
          {trip.expenses.length} khoản chi · tổng{" "}
          <span className="font-semibold text-md-on-surface">{formatVND(total)}</span>
        </p>
        {trip.status === "open" && transfers.length > 0 && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-md-primary">
            <Icon name="swap_horiz" size={16} />
            Còn {transfers.length} khoản cần chuyển để cân quỹ
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2">
          <Link href={`/chuyen-di?id=${trip.id}`} className={cls.btnPrimary}>
            <Icon name="visibility" size={18} />
            Mở
          </Link>
          <button className={cls.ghost} onClick={() => toggleStatus(trip.id)}>
            <Icon name={trip.status === "open" ? "check_circle" : "replay"} size={18} />
            {trip.status === "open" ? "Kết thúc" : "Mở lại"}
          </button>
          <button
            className={`${cls.ghost} hover:!bg-md-error-ctr hover:!text-md-on-error-ctr`}
            onClick={() => deleteTrip(trip)}
          >
            <Icon name="delete" size={18} />
            Xoá
          </button>
        </div>
      </li>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-md-on-surface sm:text-3xl">
          Chia tiền du lịch
        </h1>
        <p className="mt-2 text-sm text-md-on-surface-var">
          Mỗi chuyến đi chơi là một quỹ riêng — tạo chuyến mới, nhập chi tiêu, xem ai
          nhận lại / trả thêm, kết thúc khi đã chia xong.
        </p>
      </header>

      {/* ── Tạo chuyến đi mới ── */}
      <section className={`${cls.card} mb-8`}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-md-on-surface">
          <Icon name="add_location_alt" className="text-md-primary" />
          Tạo chuyến đi mới
        </h2>
        <div className="flex gap-2">
          <input
            className={cls.input}
            placeholder="Tên chuyến đi (VD: Đà Lạt 30/4)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTrip()}
          />
          <button className={cls.btnPrimary} onClick={createTrip}>
            <Icon name="add" size={18} />
            Tạo
          </button>
        </div>
      </section>

      {/* ── Đang mở ── */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-md-on-surface-var">
          <Icon name="pending_actions" size={18} className="text-md-primary" />
          Đang mở — cần chia tiền ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="rounded-[var(--md-corner-md)] bg-md-surface-ctr-low px-4 py-6 text-center text-sm text-md-on-surface-var">
            Chưa có chuyến đi nào đang mở.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {open.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Đã kết thúc ── */}
      {closed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-md-on-surface-var">
            <Icon name="task_alt" size={18} />
            Đã kết thúc ({closed.length})
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {closed.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </ul>
          <p className="mt-3 text-xs text-md-on-surface-var">
            Mẹo: xoá các chuyến đi cũ không cần nữa để tiết kiệm dung lượng lưu trữ của
            trình duyệt.
          </p>
        </section>
      )}
    </main>
  );
}
