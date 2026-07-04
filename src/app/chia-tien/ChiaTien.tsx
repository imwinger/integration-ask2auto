"use client";

import { useEffect, useMemo, useState } from "react";

type Member = {
  id: string;
  name: string;
};

type Expense = {
  id: string;
  payerId: string;
  amount: number;
  note: string;
};

type Transfer = {
  fromId: string;
  toId: string;
  amount: number;
};

let counter = 0;
const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

const STORAGE_KEY = "chia-tien-du-lich-v1";

const fmtVND = new Intl.NumberFormat("vi-VN");
const formatVND = (n: number) => `${fmtVND.format(Math.round(n))} ₫`;

/** Parse "1.000.000" / "1000000" / "1,000,000" thành số đồng. */
function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Tính phương án chuyển tiền tối giản: người âm (chi ít hơn mức bình quân)
 * chuyển cho người dương (chi nhiều hơn mức bình quân) theo kiểu greedy.
 */
function settle(balances: Map<string, number>): Transfer[] {
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];
  for (const [id, bal] of balances) {
    const rounded = Math.round(bal);
    if (rounded > 0) creditors.push({ id, amt: rounded });
    else if (rounded < 0) debtors.push({ id, amt: -rounded });
  }
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].amt, debtors[di].amt);
    if (pay > 0) {
      transfers.push({ fromId: debtors[di].id, toId: creditors[ci].id, amount: pay });
    }
    creditors[ci].amt -= pay;
    debtors[di].amt -= pay;
    if (creditors[ci].amt === 0) ci++;
    if (debtors[di].amt === 0) di++;
  }
  return transfers;
}

const cls = {
  input:
    "w-full rounded-[var(--md-corner-xs)] border border-md-outline bg-md-surface px-4 py-3 text-sm text-md-on-surface outline-none transition-all focus:border-md-primary focus:border-2 focus:px-[15px] focus:py-[11px] placeholder:text-md-on-surface-var",
  label: "block text-sm font-medium text-md-on-surface mb-1.5",
  card: "rounded-[var(--md-corner-lg)] border border-md-outline-var bg-md-surface-ctr-lowest p-5 sm:p-6 shadow-sm",
  ghost:
    "inline-flex items-center gap-1.5 rounded-full border border-md-outline bg-md-surface px-4 py-2 text-sm font-medium text-md-on-surface transition hover:bg-md-surface-ctr-high disabled:opacity-40",
  btnPrimary:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-md-primary px-6 py-3 text-sm font-medium text-md-on-primary transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40",
  iconBtn:
    "inline-flex h-8 w-8 items-center justify-center rounded-full text-md-on-surface-var transition hover:bg-md-error-ctr hover:text-md-on-error-ctr",
};

function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>
      {name}
    </span>
  );
}

function loadSaved(): { members: Member[]; expenses: Expense[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as { members?: Member[]; expenses?: Expense[] };
      return {
        members: Array.isArray(data.members) ? data.members : [],
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
      };
    }
  } catch {
    // dữ liệu hỏng thì bắt đầu lại từ đầu
  }
  return { members: [], expenses: [] };
}

export default function ChiaTien() {
  // Component này chỉ render phía client (dynamic ssr:false ở page.tsx)
  // nên có thể đọc localStorage ngay khi khởi tạo state.
  const [members, setMembers] = useState<Member[]>(() => loadSaved().members);
  const [expenses, setExpenses] = useState<Expense[]>(() => loadSaved().expenses);

  const [newName, setNewName] = useState("");
  const [payerId, setPayerId] = useState(() => loadSaved().members[0]?.id ?? "");
  const [amountRaw, setAmountRaw] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ members, expenses }));
  }, [members, expenses]);

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const { total, share, balances, transfers } = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const share = members.length > 0 ? total / members.length : 0;
    const balances = new Map<string, number>();
    for (const m of members) balances.set(m.id, -share);
    for (const e of expenses) {
      if (balances.has(e.payerId)) {
        balances.set(e.payerId, (balances.get(e.payerId) ?? 0) + e.amount);
      }
    }
    return { total, share, balances, transfers: settle(balances) };
  }, [members, expenses]);

  function addMember() {
    const name = newName.trim();
    if (!name) return;
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" đã có trong danh sách.`);
      return;
    }
    const m: Member = { id: uid(), name };
    setMembers((prev) => [...prev, m]);
    if (!payerId) setPayerId(m.id);
    setNewName("");
    setError(null);
  }

  function removeMember(id: string) {
    if (expenses.some((e) => e.payerId === id)) {
      setError("Không thể xoá người đã có khoản chi. Hãy xoá các khoản chi của người này trước.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
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
    setExpenses((prev) => [...prev, { id: uid(), payerId, amount, note: note.trim() }]);
    setAmountRaw("");
    setNote("");
    setError(null);
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function resetAll() {
    if (!confirm("Xoá toàn bộ thành viên và khoản chi?")) return;
    setMembers([]);
    setExpenses([]);
    setPayerId("");
    setError(null);
  }

  const paidByMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.payerId, (map.get(e.payerId) ?? 0) + e.amount);
    return map;
  }, [expenses]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="font-brand text-2xl font-bold text-md-on-surface sm:text-3xl">
          Chia tiền du lịch
        </h1>
        <p className="mt-2 text-sm text-md-on-surface-var">
          Nhập các khoản mỗi người đã chi trong chuyến đi — trang sẽ tính ai nhận lại, ai
          trả thêm để mọi người góp bằng nhau.
        </p>
      </header>

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
          Thành viên ({members.length})
        </h2>
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
        {members.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="inline-flex items-center gap-1 rounded-full bg-md-secondary-ctr py-1 pl-3 pr-1 text-sm text-md-on-secondary-ctr"
              >
                {m.name}
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-md-error-ctr hover:text-md-on-error-ctr"
                  onClick={() => removeMember(m.id)}
                  aria-label={`Xoá ${m.name}`}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Khoản chi ── */}
      <section className={`${cls.card} mb-6`}>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-md-on-surface">
          <Icon name="receipt_long" className="text-md-primary" />
          Khoản chi ({expenses.length})
        </h2>

        {members.length === 0 ? (
          <p className="text-sm text-md-on-surface-var">Hãy thêm thành viên trước.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className={cls.label}>Người chi</label>
              <select
                className={cls.input}
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
              >
                <option value="">— Chọn —</option>
                {members.map((m) => (
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
        )}

        {expenses.length > 0 && (
          <ul className="mt-4 divide-y divide-md-outline-var">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-md-on-surface">
                    {memberById.get(e.payerId)?.name ?? "?"}
                    {e.note && (
                      <span className="font-normal text-md-on-surface-var"> — {e.note}</span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-semibold text-md-on-surface">
                  {formatVND(e.amount)}
                </span>
                <button
                  className={cls.iconBtn}
                  onClick={() => removeExpense(e.id)}
                  aria-label="Xoá khoản chi"
                >
                  <Icon name="delete" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Kết quả ── */}
      {members.length > 0 && expenses.length > 0 && (
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
                  Mỗi người góp ({members.length} người)
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
                  {members.map((m) => {
                    const bal = Math.round(balances.get(m.id) ?? 0);
                    return (
                      <tr key={m.id} className="border-b border-md-outline-var last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-md-on-surface">{m.name}</td>
                        <td className="py-2.5 pr-3 text-right text-md-on-surface">
                          {formatVND(paidByMember.get(m.id) ?? 0)}
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
          </section>
        </>
      )}

      {(members.length > 0 || expenses.length > 0) && (
        <div className="text-center">
          <button className={cls.ghost} onClick={resetAll}>
            <Icon name="restart_alt" size={18} />
            Làm lại từ đầu
          </button>
        </div>
      )}
    </main>
  );
}
