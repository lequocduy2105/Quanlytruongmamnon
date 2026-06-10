import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import useInvoices from "../../hooks/useInvoices";
import InvoiceList from "../../components/InvoiceList";

// Format helper
const fmtVND = (n) => {
  return Number(n || 0).toLocaleString("vi-VN") + " ₫";
};

// Skeleton Loader component for beautiful loading feedback
function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-slate-100 dark:border-gray-800 flex justify-between items-center gap-4"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 bg-slate-200 dark:bg-gray-850 rounded-2xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-gray-850 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 dark:bg-gray-850 rounded w-1/2"></div>
            </div>
          </div>
          <div className="w-24 h-6 bg-slate-200 dark:bg-gray-850 rounded-full"></div>
        </div>
      ))}
    </div>
  );
}

// Error state display component
function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 dark:border-rose-950/50 bg-rose-50/50 dark:bg-rose-950/10 p-8 flex flex-col items-center gap-4 text-center">
      <span className="material-symbols-outlined text-rose-500 text-5xl">
        error
      </span>
      <div>
        <h3 className="font-bold text-lg text-rose-800 dark:text-rose-400">
          Không thể tải thông tin học phí
        </h3>
        <p className="text-sm text-rose-600 dark:text-rose-350 mt-1 max-w-md">
          {message}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-sm font-semibold hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-500/20"
      >
        Thử lại
      </button>
    </div>
  );
}

export default function ParentInvoices() {
  const { activeStudent } = useOutletContext();
  const [selectedMonth, setSelectedMonth] = useState("");

  // Clean implementation consuming custom state hook
  const { invoices, loading, error, refetch } = useInvoices(activeStudent?.id);

  // Generate the last 6 months list dynamically for filter selectors
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  // Calculate unpaid balances (status pending/partial)
  const totalPending = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "partial")
    .reduce((sum, inv) => sum + Math.max(0, inv.totalAmount - inv.amountPaid), 0);

  // Apply monthly filter
  const filteredInvoices = selectedMonth
    ? invoices.filter((inv) => inv.month === selectedMonth)
    : invoices;

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1">
            Phụ Huynh Portal
          </p>
          <h1 className="text-3xl font-extrabold text-cyan-900 dark:text-cyan-100 font-headline tracking-tight">
            Học Phí & Hóa Đơn
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Xem và thanh toán học phí nhanh chóng của con em bạn.
          </p>
        </div>

        {/* Remaining Unpaid Total Balance indicator card */}
        {!loading && !error && totalPending > 0 && (
          <div
            className="rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm"
            style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
          >
            <span className="material-symbols-outlined text-amber-700 text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance_wallet
            </span>
            <div>
              <p className="text-xs font-bold text-amber-750 uppercase tracking-wider">
                Cần thanh toán
              </p>
              <p className="text-2xl font-black text-amber-950">{fmtVND(totalPending)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Month Filter Tab List ─── */}
      {!error && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedMonth("")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-250 ${
              !selectedMonth
                ? "bg-cyan-800 text-white shadow dark:bg-cyan-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Tất cả
          </button>
          {monthOptions.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-250 ${
                selectedMonth === m
                  ? "bg-cyan-800 text-white shadow dark:bg-cyan-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* ─── State Renderer (Loading, Error, Empty, and Mapped Data) ─── */}
      {loading ? (
        <SkeletonLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-855 py-20 flex flex-col items-center gap-3 text-slate-400 dark:text-gray-500">
          <span className="material-symbols-outlined text-6xl">receipt_long</span>
          <p className="font-bold text-lg text-slate-700 dark:text-gray-300">Không tìm thấy hóa đơn nào</p>
          <p className="text-sm">
            {selectedMonth
              ? `Không có hóa đơn phát sinh trong tháng ${selectedMonth}`
              : "Lịch sử hóa đơn học phí của con em sẽ hiển thị tại đây khi nhà trường cập nhật."}
          </p>
        </div>
      ) : (
        <InvoiceList invoices={filteredInvoices} />
      )}

      {/* ─── Payment Instructions Footer Banner ─── */}
      <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 p-5 flex gap-4">
        <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-2xl flex-shrink-0 mt-0.5">
          info
        </span>
        <div className="text-sm text-cyan-800 dark:text-cyan-300">
          <p className="font-bold mb-1">Hướng dẫn thanh toán trực tuyến</p>
          <p className="leading-relaxed">
            Bạn có thể dùng bất cứ ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay, ShopeePay) 
            để quét mã VietQR ở trên. Lưu ý giữ nguyên thông tin số tài khoản và nội dung chuyển khoản 
            đã được điền sẵn để hệ thống ghi nhận thanh toán tự động trong 5-10 phút.
          </p>
        </div>
      </div>
    </div>
  );
}
