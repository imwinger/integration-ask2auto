export const STATUSES = ["todo", "in_progress", "testing", "done"] as const;

export function statusLabel(s: string): string {
  return {
    todo: "To do",
    in_progress: "In progress",
    testing: "Testing",
    done: "Done",
  }[s] || s;
}

export function statusClasses(s: string): string {
  return (
    {
      todo: "bg-amber-50 text-amber-700",
      in_progress: "bg-blue-50 text-blue-700",
      testing: "bg-purple-50 text-purple-700",
      done: "bg-emerald-50 text-emerald-700",
    }[s] || "bg-gray-100 text-gray-600"
  );
}

export function statusColumnClasses(s: string): string {
  return (
    {
      todo: "border-t-amber-400",
      in_progress: "border-t-blue-400",
      testing: "border-t-purple-400",
      done: "border-t-emerald-400",
    }[s] || "border-t-gray-300"
  );
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
