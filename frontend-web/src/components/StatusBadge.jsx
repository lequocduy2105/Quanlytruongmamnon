import React from "react";

const STATUS_MAP = {
  paid: {
    label: "Đã thanh toán",
    icon: "check_circle",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
  },
  partial: {
    label: "Thanh toán một phần",
    icon: "schedule",
    classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
  },
  pending: {
    label: "Chờ thanh toán",
    icon: "pending",
    // Standard Pending (Orange) color matching thesis
    classes: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50",
  },
  overdue: {
    label: "Quá hạn",
    icon: "warning",
    // Standard Overdue (Red) color matching thesis
    classes: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
  },
  cancelled: {
    label: "Đã hủy",
    icon: "cancel",
    classes: "bg-slate-150 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
};

export default function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const config = STATUS_MAP[normalized] || STATUS_MAP.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.classes} transition-colors duration-200`}
    >
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
