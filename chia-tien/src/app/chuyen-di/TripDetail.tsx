"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Trip,
  Member,
  loadTrips,
  saveTrips,
  uid,
  fmtVND,
  formatVND,
  formatDate,
  parseAmount,
  computeTrip,
} from "@/lib/store";
import { cls, Icon, StatusChip } from "@/lib/ui";

export default function TripDetail() {
  const tripId = useSearchParams().get("id") ?? "";
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips());

  const [newName, setNewName] = useState("");
  const [payerId, setPayerId] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  const trip = trips.find((t) => t.id === tripId);

  const memberById = useMemo(
    () => new Map((trip?.members ?? []).map((m) => [m.id, m])),
    [trip?.members],
  );

  const result = useMemo(() => (trip ? computeTrip(trip) : null), [trip]);

  function updateTrip(patch: (t: Trip) => Trip) {
    setTrips((prev) => prev.map((t) => (t.id === tripId ? patch(t) : t)));
  }

  if (!trip) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-md-on-surface">Không tìm thấy chuyến đi này.</p>
        <Link href="/" className={cls.btnPrimary}>
          <Icon name="arrow_back" size={18} />
          Về danh sách chuyến đi
        </Link>
      </main>
    );
  }

  const locked = trip.status === "closed";
  const { total, share, balances, paidBy, transfers } = result!;

  function addMember() {
    const name = newName.trim();
    if (!name || !trip) return;
    if (trip.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" đã có trong danh sách.`);
      return;
    }
    const m: Member = { id: uid(), name };
    updateTrip((t) => ({ ...t, members: [...t.members, m] }));
    if (!payerId) setPayerId(m.id);
    setNewName("");
    setError(null);
  }

  function removeMember(id: string) {
    if (!trip) return;
    if (trip.expenses.some((e) => e.payerId === id)) {
      setError(
        "Không thể xoá người đã có khoản chi. Hãy xoá các khoản chi của người này trước.",
      );
      return;
    }
    updateTrip((t) => ({ ...t, members: t.members.filter((m) => m.id !== id) }));
    if (payerId === id) setPayerId("");
    setError(null);
  }

  function addExpense() {
    const amount = parseAmount(amountRaw);
    if (!payerId) {
      setError("Hãy chọn người chi.");
      return;
    }
    if (amount <= 0) {
      setError("Số tiền phải lớn hơn 0.");
      return;
    }
    updateTrip((t) => ({
      ...t,
      expenses: [
        ...t.expenses,
        { id: uid(), payerId, amount, note: note.trim(), createdAt: Date.now() },
      ],
    }));
    setAmountRaw("");
    setNote("");
    setError(null);
  }

  function removeExpense(id: string) {
    updateTrip((t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== id) }));
  }

  function toggleStatus() {
    updateTrip((t) => ({ ...t, status: t.status === "open" ? "closed" : "open" }));
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-md-primary hover:underline"
        >
          <Icon name="arrow_back" size={16} />
          Danh sách chuyến đi
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-md-on-surface">{trip.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-md-on-surface-var">
              {formatDate(trip.createdAt)}
              <StatusChip status={trip.status} />
            </p>
          </div>
          <button className={cls.ghost} onClick={toggleStatus}>
            <Icon name={locked ? "replay" : "check_circle"} size={18} />
            {locked ? "Mở lại chuyến đi" : "Kết thúc chuyến đi"}
          </button>
        </div>
      </header>

      {locked && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--md-corner-md)] bg-md-surface-ctr-high px-4 py-3 text-sm text-md-on-surface-var">
          <Icon name="lock" size={18} />
          Chuyến đi đã kết thúc — dữ liệu bị khoá. Bấm &ldquo;Mở lại chuyến đi&rdquo; nếu
          muốn chỉnh sửa.
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--md-corner-md)] bg-md-error-ctr px-4 py-3 text-sm text-md-on-error-ctr">
          <Icon name="error" size={18} />
          {error}
        </div>
      )}

      {/* ── Thành viên ── */}
      <section className={`${cls.card} mb-6`}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-md-on-surface">
          <Icon name="group" className="text-md-primary" />
          Thành viên ({trip.members.length})
        </h2>
        {!locked && (
          <div className="flex gap-2">
            <input
              className={cls.input}
              placeholder="Tên thành viên (VD: Hoàng)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
            />
            <button className={cls.btnPrimary} onClick={addMember} disabled={!newName.trim()}>
              <Icon name="add" size={18} />
              Thêm
            </button>
          </div>
        )}
        {trip.members.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {trip.members.map((m) => (
              <li
                key={m.id}
                className="inline-flex items-center gap-1 rounded-full bg-md-secondary-ctr py-1 pl-3 pr-1 text-sm text-md-on-secondary-ctr"
              >
                {m.name}
                {!locked && (
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-md-error-ctr hover:text-md-on-error-ctr"
                    onClick={() => removeMember(m.id)}
                    aria-label={`Xoá ${m.name}`}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Lịch sử thanh toán ── */}
      <section className={`${cls.card} mb-6`}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-md-on-surface">
          <Icon name="receipt_long" className="text-md-primary" />
          Lịch sử thanh toán ({trip.expenses.length})
        </h2>

        {trip.members.length === 0 ? (
          <p className="text-sm text-md-on-surface-var">Hãy thêm thành viên trước.</p>
        ) : (
          !locked && (
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className={cls.label}>Người chi</label>
                <select
                  className={cls.input}
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                >
                  <option value="">— Chọn —</option>
                  {trip.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cls.label}>Số tiền (₫)</label>
                <input
                  className={cls.input}
                  inputMode="numeric"
                  placeholder="VD: 500.000"
                  value={amountRaw ? fmtVND.format(parseAmount(amountRaw)) : ""}
                  onChange={(e) => setAmountRaw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExpense()}
                />
              </div>
              <div className="sm:self-end">
                <label className={`${cls.label} sm:hidden`}>&nbsp;</label>
                <button
                  className={`${cls.btnPrimary} w-full sm:w-auto`}
                  onClick={addExpense}
                  disabled={!payerId || parseAmount(amountRaw) <= 0}
                >
                  <Icon name="add" size={18} />
                  Thêm
                </button>
              </div>
              <div className="sm:col-span-3">
                <label className={cls.label}>Ghi chú (tuỳ chọn)</label>
                <input
                  className={cls.input}
                  placeholder="VD: tiền khách sạn, ăn tối, xăng xe…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExpense()}
                />
              </div>
            </div>
          )
        )}

        {trip.expenses.length > 0 && (
          <ul className="mt-4 divide-y divide-md-outline-var">
            {trip.expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-md-on-surface">
                    {memberById.get(e.payerId)?.name ?? "?"}
                    {e.note && (
                      <span className="font-normal text-md-on-surface-var"> — {e.note}</span>
                    )}
                  </p>
                  <p className="text-xs text-md-on-surface-var">{formatDate(e.createdAt)}</p>
                </div>
                <span className="text-sm font-semibold text-md-on-surface">
                  {formatVND(e.amount)}
                </span>
                {!locked && (
                  <button
                    className={cls.iconBtn}
                    onClick={() => removeExpense(e.id)}
                    aria-label="Xoá khoản chi"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Kết quả ── */}
      {trip.members.length > 0 && trip.expenses.length > 0 && (
        <>
          <section className={`${cls.card} mb-6`}>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-md-on-surface">
              <Icon name="calculate" className="text-md-primary" />
              Kết quả
            </h2>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--md-corner-md)] bg-md-primary-ctr p-4">
                <p className="text-xs text-md-on-primary-ctr">Tổng chi</p>
                <p className="mt-1 text-lg font-bold text-md-on-primary-ctr">
                  {formatVND(total)}
                </p>
              </div>
              <div className="rounded-[var(--md-corner-md)] bg-md-secondary-ctr p-4">
                <p className="text-xs text-md-on-secondary-ctr">
                  Mỗi người góp ({trip.members.length} người)
                </p>
                <p className="mt-1 text-lg font-bold text-md-on-secondary-ctr">
                  {formatVND(share)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-md-outline-var text-left text-xs text-md-on-surface-var">
                    <th className="py-2 pr-3 font-medium">Thành viên</th>
                    <th className="py-2 pr-3 text-right font-medium">Đã chi</th>
                    <th className="py-2 text-right font-medium">Nhận lại / Trả thêm</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.members.map((m) => {
                    const bal = Math.round(balances.get(m.id) ?? 0);
                    return (
                      <tr key={m.id} className="border-b border-md-outline-var last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-md-on-surface">{m.name}</td>
                        <td className="py-2.5 pr-3 text-right text-md-on-surface">
                          {formatVND(paidBy.get(m.id) ?? 0)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-semibold ${
                            bal > 0
                              ? "text-green-700"
                              : bal < 0
                                ? "text-md-error"
                                : "text-md-on-surface-var"
                          }`}
                        >
                          {bal > 0
                            ? `Nhận lại ${formatVND(bal)}`
                            : bal < 0
                              ? `Trả thêm ${formatVND(-bal)}`
                              : "Vừa đủ"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${cls.card} mb-6`}>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-md-on-surface">
              <Icon name="swap_horiz" className="text-md-primary" />
              Cách thanh toán gọn nhất
            </h2>
            {transfers.length === 0 ? (
              <p className="text-sm text-md-on-surface-var">
                Mọi người đã chi bằng nhau — không ai cần chuyển tiền. 🎉
              </p>
            ) : (
              <ul className="space-y-2">
                {transfers.map((t, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-[var(--md-corner-md)] bg-md-surface-ctr-low px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-md-error">
                      {memberById.get(t.fromId)?.name ?? "?"}
                    </span>
                    <Icon name="arrow_forward" size={16} className="text-md-on-surface-var" />
                    <span className="font-semibold text-green-700">
                      {memberById.get(t.toId)?.name ?? "?"}
                    </span>
                    <span className="ml-auto font-bold text-md-on-surface">
                      {formatVND(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!locked && transfers.length === 0 && total > 0 && (
              <p className="mt-3 text-xs text-md-on-surface-var">
                Quỹ đã cân — bạn có thể bấm &ldquo;Kết thúc chuyến đi&rdquo; ở trên.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
