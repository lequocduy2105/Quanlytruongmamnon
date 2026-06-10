import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import VietQRContainer from "./VietQRContainer";

export default function InvoiceList({ invoices }) {
  const [expandedId, setExpandedId] = useState(null);

  const fmtVND = (n) => {
    return Number(n || 0).toLocaleString("vi-VN") + " ₫";
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const parseMonthYear = (monthStr) => {
    // Expecting "YYYY-MM" format, e.g., "2026-06"
    if (!monthStr || monthStr.length < 7) return { month: "—", year: "—" };
    const parts = monthStr.split("-");
    return {
      year: parts[0],
      month: parseInt(parts[1], 10),
    };
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {invoices.map((inv) => {
        const isExpanded = expandedId === inv.id;
        const remaining = Math.max(0, inv.totalAmount - inv.amountPaid);
        const { month, year } = parseMonthYear(inv.month);

        return (
          <div
            key={inv.id}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-black/20 transition-all duration-300"
          >
            {/* Header section (Click to toggle) */}
            <button
              onClick={() => toggleExpand(inv.id)}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <div className="flex items-center gap-4">
                {/* Month Block */}
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                    {year}
                  </span>
                  <span className="text-lg font-black text-cyan-900 dark:text-cyan-200">
                    T{month}
                  </span>
                </div>

                {/* Info Text */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-cyan-900 dark:text-cyan-100 text-base">
                      Hóa đơn tháng {inv.month}
                    </span>
                    {inv.studentName && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full font-medium">
                        {inv.studentName}
                      </span>
                    )}
                  </div>
                  
                  {/* Financial Summary */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                    <span>
                      Tổng: <strong className="text-slate-800 dark:text-gray-200">{fmtVND(inv.totalAmount)}</strong>
                    </span>
                    <span>
                      Đã trả: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{fmtVND(inv.amountPaid)}</strong>
                    </span>
                    {remaining > 0 && (
                      <span>
                        Còn lại: <strong className="text-rose-600 dark:text-rose-450 font-bold">{fmtVND(remaining)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Expand Trigger */}
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-gray-800">
                <StatusBadge status={inv.status} />
                <span
                  className="material-symbols-outlined text-slate-400 dark:text-gray-500 transition-transform duration-300"
                  style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                >
                  expand_more
                </span>
              </div>
            </button>

            {/* Expandable Panel */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-gray-800 px-6 pb-6 bg-slate-50/30 dark:bg-gray-900/30">
                
                {/* Fee Breakdown Cards */}
                <div className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <div className="bg-slate-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-100/50 dark:border-gray-800">
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-semibold mb-1">Học phí</p>
                    <p className="text-sm font-extrabold text-slate-850 dark:text-gray-200">{fmtVND(inv.tuitionAmount)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-100/50 dark:border-gray-800">
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-semibold mb-1">Tiền ăn</p>
                    <p className="text-sm font-extrabold text-slate-850 dark:text-gray-200">
                      {inv.mealDays} ngày × {fmtVND(inv.mealDailyRate)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-100/50 dark:border-gray-800">
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-semibold mb-1">Phí dịch vụ khác</p>
                    <p className="text-sm font-extrabold text-slate-850 dark:text-gray-200">{fmtVND(inv.otherFees)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-slate-100/50 dark:border-gray-800">
                    <p className="text-xs text-slate-400 dark:text-gray-500 font-semibold mb-1">Miễn giảm</p>
                    <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">-{fmtVND(inv.discount)}</p>
                  </div>
                </div>

                {/* Deadlines and Notes */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-5">
                  {inv.dueDate && (
                    <span>
                      Hạn đóng: <strong className="text-slate-700 dark:text-gray-300 font-semibold">{fmtDate(inv.dueDate)}</strong>
                    </span>
                  )}
                  {inv.paidAt && (
                    <span>
                      Ngày đóng: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{fmtDate(inv.paidAt)}</strong>
                    </span>
                  )}
                  {inv.note && (
                    <span className="italic">Ghi chú: {inv.note}</span>
                  )}
                </div>

                {/* Progress bar */}
                {inv.totalAmount > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-slate-400 dark:text-gray-500 mb-1 font-semibold">
                      <span>Tiến độ thanh toán</span>
                      <span>
                        {Math.min(100, Math.round((inv.amountPaid / inv.totalAmount) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (inv.amountPaid / inv.totalAmount) * 100)}%`,
                          background:
                            inv.status === "paid"
                              ? "linear-gradient(90deg, #10b981, #34d399)"
                              : "linear-gradient(90deg, #f97316, #fb923c)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* VietQR dynamic block inside expanded view if remaining balance exists */}
                {remaining > 0 && (
                  <div className="mt-5">
                    <VietQRContainer
                      amount={remaining}
                      description={`INV${inv.month.replace("-", "")}STU${inv.studentId}`}
                      accountName="TRUONG MAM NON"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
