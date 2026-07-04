// Token style MD3 + icon helper dùng chung cho các trang.

export const cls = {
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

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>
      {name}
    </span>
  );
}

export function StatusChip({ status }: { status: "open" | "closed" }) {
  return status === "open" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-md-primary-ctr px-2.5 py-0.5 text-xs font-medium text-md-on-primary-ctr">
      <span className="h-1.5 w-1.5 rounded-full bg-md-primary" />
      Đang mở
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-md-surface-ctr-high px-2.5 py-0.5 text-xs font-medium text-md-on-surface-var">
      <span className="h-1.5 w-1.5 rounded-full bg-md-outline" />
      Đã kết thúc
    </span>
  );
}
