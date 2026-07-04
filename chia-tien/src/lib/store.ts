// Kiểu dữ liệu + lưu trữ localStorage + thuật toán chia tiền.

export type Member = { id: string; name: string };

export type Expense = {
  id: string;
  payerId: string;
  amount: number;
  note: string;
  createdAt: number;
};

export type TripStatus = "open" | "closed";

export type Trip = {
  id: string;
  name: string;
  createdAt: number;
  status: TripStatus;
  members: Member[];
  expenses: Expense[];
};

export type Transfer = { fromId: string; toId: string; amount: number };

let counter = 0;
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

const STORAGE_KEY = "chia-tien-trips-v1";

export function loadTrips(): Trip[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as Trip[];
      if (Array.isArray(data)) return data;
    }
  } catch {
    // dữ liệu hỏng thì bắt đầu lại từ đầu
  }
  return [];
}

export function saveTrips(trips: Trip[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export const fmtVND = new Intl.NumberFormat("vi-VN");
export const formatVND = (n: number) => `${fmtVND.format(Math.round(n))} ₫`;
export const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Parse "1.000.000" / "1000000" / "1,000,000" thành số đồng. */
export function parseAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Phương án chuyển tiền tối giản: người âm (chi ít hơn mức bình quân)
 * chuyển cho người dương (chi nhiều hơn mức bình quân) theo kiểu greedy.
 */
export function settle(balances: Map<string, number>): Transfer[] {
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

export function computeTrip(trip: Trip) {
  const total = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const share = trip.members.length > 0 ? total / trip.members.length : 0;
  const balances = new Map<string, number>();
  const paidBy = new Map<string, number>();
  for (const m of trip.members) balances.set(m.id, -share);
  for (const e of trip.expenses) {
    paidBy.set(e.payerId, (paidBy.get(e.payerId) ?? 0) + e.amount);
    if (balances.has(e.payerId)) {
      balances.set(e.payerId, (balances.get(e.payerId) ?? 0) + e.amount);
    }
  }
  return { total, share, balances, paidBy, transfers: settle(balances) };
}
