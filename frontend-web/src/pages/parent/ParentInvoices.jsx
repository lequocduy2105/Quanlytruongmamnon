import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/axiosClient";

const STATUS_BADGE = {
  paid: {
    label: "Đã thanh toán",
    labelEn: "Paid",
    color: "#16a34a",
    bg: "#dcfce7",
    icon: "check_circle",
  },
  partial: {
    label: "Thanh toán một phần",
    labelEn: "Partial",
    color: "#d97706",
    bg: "#fef9c3",
    icon: "schedule",
  },
  pending: {
    label: "Chờ thanh toán",
    labelEn: "Pending",
    color: "#2563eb",
    bg: "#dbeafe",
    icon: "pending",
  },
  overdue: {
    label: "Quá hạn",
    labelEn: "Overdue",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "warning",
  },
  cancelled: {
    label: "Đã huỷ",
    labelEn: "Cancelled",
    color: "#64748b",
    bg: "#f1f5f9",
    icon: "cancel",
  },
};

function fmtVND(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " ₫";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default function ParentInvoices() {
  const { activeStudent } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Lấy danh sách 6 tháng gần nhất để lọc
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  useEffect(() => {
    if (activeStudent) {
      fetchInvoices(activeStudent.id);
    }
  }, [activeStudent]);

  const fetchInvoices = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get("/parent/my-invoices");
      const data = Array.isArray(res.data) ? res.data : [];
      // Lọc hóa đơn theo học sinh hiện tại
      const studentInvoices = data.filter(inv => inv.studentId === studentId);
      setInvoices(studentInvoices);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = selectedMonth
    ? invoices.filter((inv) => inv.month === selectedMonth)
    : invoices;

  const totalPending = invoices
    .filter((i) => i.status === "pending" || i.status === "partial")
    .reduce((s, i) => s + Number(i.totalAmount || 0) - Number(i.amountPaid || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined text-5xl animate-spin" style={{ animationDuration: "1.2s" }}>
            progress_activity
          </span>
          <p className="font-semibold">Đang tải danh sách hóa đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-1">
            Phụ Huynh Portal
          </p>
          <h1 className="text-3xl font-extrabold text-cyan-900 font-headline tracking-tight">
            Học Phí & Hóa Đơn
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem và theo dõi tình trạng thanh toán học phí của con
          </p>
        </div>

        {/* Số tiền cần thanh toán */}
        {totalPending > 0 && (
          <div
            className="rounded-2xl px-6 py-4 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
          >
            <span className="material-symbols-outlined text-amber-700 text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance_wallet
            </span>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Cần thanh toán
              </p>
              <p className="text-2xl font-black text-amber-900">{fmtVND(totalPending)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Lọc tháng ─── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMonth("")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
            !selectedMonth
              ? "bg-cyan-800 text-white shadow"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tất cả
        </button>
        {monthOptions.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              selectedMonth === m
                ? "bg-cyan-800 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ─── Danh sách hóa đơn ─── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-20 flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined text-6xl">receipt_long</span>
          <p className="font-bold text-lg">Chưa có hóa đơn nào</p>
          <p className="text-sm">
            {selectedMonth
              ? `Không có hóa đơn cho tháng ${selectedMonth}`
              : "Hóa đơn sẽ xuất hiện khi được tạo bởi nhà trường"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv) => {
            const st = STATUS_BADGE[inv.status] || STATUS_BADGE.pending;
            const isExpanded = expandedId === inv.id;
            const remaining = Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0);

            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                  className="w-full flex items-center gap-4 p-6 text-left"
                >
                  {/* Month Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-cyan-600 uppercase">
                      {inv.month?.slice(0, 4)}
                    </span>
                    <span className="text-lg font-black text-cyan-900">
                      T{parseInt(inv.month?.slice(5, 7))}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-cyan-900 text-base">
                        Hóa đơn tháng {inv.month}
                      </span>
                      {inv.studentName && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {inv.studentName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className="text-sm text-slate-500">
                        Tổng: <strong className="text-slate-800">{fmtVND(inv.totalAmount)}</strong>
                      </span>
                      <span className="text-sm text-slate-500">
                        Đã trả: <strong className="text-green-700">{fmtVND(inv.amountPaid)}</strong>
                      </span>
                      {remaining > 0 && (
                        <span className="text-sm text-slate-500">
                          Còn lại: <strong className="text-red-600">{fmtVND(remaining)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
                      style={{ color: st.color, background: st.bg }}
                    >
                      <span className="material-symbols-outlined text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {st.icon}
                      </span>
                      {st.label}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 transition-transform"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}>
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 pb-6">
                    <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Học phí", value: fmtVND(inv.tuitionAmount) },
                        { label: "Ngày ăn", value: `${inv.mealDays} ngày × ${fmtVND(inv.mealDailyRate)}` },
                        { label: "Phí khác", value: fmtVND(inv.otherFees) },
                        { label: "Giảm giá", value: `- ${fmtVND(inv.discount)}` },
                      ].map((r) => (
                        <div key={r.label} className="bg-slate-50 rounded-2xl px-4 py-3">
                          <p className="text-xs text-slate-500 font-semibold mb-1">{r.label}</p>
                          <p className="text-sm font-bold text-slate-800">{r.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Dates & Note */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      {inv.dueDate && (
                        <span>
                          Hạn thanh toán:{" "}
                          <strong className="text-slate-700">{fmtDate(inv.dueDate)}</strong>
                        </span>
                      )}
                      {inv.paidAt && (
                        <span>
                          Ngày thanh toán:{" "}
                          <strong className="text-green-700">{fmtDate(inv.paidAt)}</strong>
                        </span>
                      )}
                      {inv.note && (
                        <span className="text-slate-500 italic">Ghi chú: {inv.note}</span>
                      )}
                    </div>

                    {/* VietQR Dynamic Code for Tuition Payment */}
                    {remaining > 0 && (
                      <div
                        className="mt-6 border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center gap-6 bg-cyan-50/50 rounded-2xl p-6 border border-cyan-100/50"
                      >
                        <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                          <img
                            src={`https://img.vietqr.io/image/vietinbank-102888888888-compact.png?amount=${remaining}&addInfo=INV${inv.month.replace('-', '')}STU${inv.studentId}&accountName=TRUONG%20MAM%20NON`}
                            alt="Mã QR thanh toán học phí"
                            className="w-40 h-40 object-contain"
                          />
                        </div>
                        <div className="flex-1 space-y-2 text-sm text-slate-600">
                          <h4 className="font-bold text-cyan-900 text-base flex items-center gap-1.5 font-headline">
                            <span className="material-symbols-outlined text-cyan-600" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                            Thanh toán tự động qua VietQR
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán nhanh 24/7. 
                            Thông tin thanh toán sẽ được đối soát tự động ngay lập tức sau khi giao dịch thành công.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div>Ngân hàng: <strong className="text-slate-700">VietinBank</strong></div>
                            <div>Số tài khoản: <strong className="text-slate-700">102888888888</strong></div>
                            <div>Số tiền: <strong className="text-cyan-800 font-bold">{fmtVND(remaining)}</strong></div>
                            <div>Nội dung CK: <strong className="font-mono text-cyan-800 bg-cyan-100/50 px-1.5 py-0.5 rounded">INV{inv.month.replace('-', '')}STU{inv.studentId}</strong></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment progress bar */}
                    {inv.totalAmount > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Tiến độ thanh toán</span>
                          <span>
                            {Math.min(
                              100,
                              Math.round((Number(inv.amountPaid) / Number(inv.totalAmount)) * 100)
                            )}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (Number(inv.amountPaid) / Number(inv.totalAmount)) * 100)}%`,
                              background:
                                inv.status === "paid"
                                  ? "linear-gradient(90deg, #16a34a, #4ade80)"
                                  : "linear-gradient(90deg, #2563eb, #60a5fa)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Info Banner ─── */}
      <div className="rounded-2xl bg-cyan-50 border border-cyan-100 p-5 flex gap-4">
        <span className="material-symbols-outlined text-cyan-600 text-2xl flex-shrink-0 mt-0.5">
          info
        </span>
        <div className="text-sm text-cyan-800">
          <p className="font-bold mb-1">Hướng dẫn thanh toán</p>
          <p>
            Vui lòng thanh toán tại văn phòng nhà trường hoặc chuyển khoản theo thông tin được
            cung cấp. Nếu có thắc mắc, hãy liên hệ phòng kế toán.
          </p>
        </div>
      </div>
    </div>
  );
}
