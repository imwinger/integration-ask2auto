"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>{name}</span>;
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  if (!text || text === "—") return null;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center rounded-full p-1 text-md-on-surface-var transition hover:bg-md-surface-ctr-high hover:text-md-primary"
      title="Sao chép"
    >
      <Icon name={copied ? "check" : "content_copy"} size={14} className={copied ? "text-[#386A4F]" : ""} />
    </button>
  );
}

export function StatusSelect({
  submissionId,
  initialStatus,
  statuses,
  labels,
}: {
  submissionId: string;
  initialStatus: string;
  statuses: readonly string[];
  labels: Record<string, string>;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const onChange = async (newStatus: string) => {
    setStatus(newStatus);
    setSaving(true);
    await fetch(`/api/admin/submissions/${submissionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-md-on-surface-var">Trạng thái:</label>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        className="rounded-[var(--md-corner-xs)] border border-md-outline bg-md-surface px-3 py-2 text-sm text-md-on-surface outline-none focus:border-md-primary disabled:opacity-50"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>{labels[s] || s}</option>
        ))}
      </select>
      {saving && (
        <Icon name="progress_activity" size={16} className="animate-spin text-md-on-surface-var" />
      )}
    </div>
  );
}

export function Collapsible({
  title,
  badge,
  count,
  children,
  defaultOpen = false,
  nested = false,
}: {
  title: string;
  badge?: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  nested?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={nested ? "" : "border-b border-md-outline-var last:border-b-0"}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 py-3 text-left text-sm font-medium text-md-on-surface transition hover:text-md-primary ${nested ? "px-1" : "px-1"}`}
      >
        <Icon
          name={open ? "expand_more" : "chevron_right"}
          size={20}
          className="flex-none text-md-on-surface-var"
        />
        {badge && (
          <span className="rounded-full bg-md-secondary-ctr px-2.5 py-0.5 text-xs font-medium text-md-on-secondary-ctr">
            {badge}
          </span>
        )}
        <span className="flex-1">{title}</span>
        {count !== undefined && (
          <span className="rounded-full bg-md-surface-ctr px-2 py-0.5 text-xs font-normal text-md-on-surface-var">
            {count}
          </span>
        )}
      </button>
      {open && <div className="pb-3 pl-7">{children}</div>}
    </div>
  );
}
