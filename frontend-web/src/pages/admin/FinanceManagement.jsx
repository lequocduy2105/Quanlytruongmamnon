import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../components/Toast";

// ── Utility ────────────────────────────────────────────────
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmtVND = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";

// ── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    paid: { bg: "#dcfce7", color: "#15803d", label: "Đã Thanh Toán" },
    partial: { bg: "#fef9c3", color: "#854d0e", label: "Đã Đóng Một Phần" },
    pending: { bg: "#fef3c7", color: "#b45309", label: "Chờ Thanh Toán" },
    overdue: { bg: "#fee2e2", color: "#991b1b", label: "Quá Hạn" },
    cancelled: { bg: "#f1f5f9", color: "#64748b", label: "Đã Huỷ" },
  }[status] || { bg: "#f1f5f9", color: "#64748b", label: status };

  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontWeight: 700,
        fontSize: 11,
        display: "inline-block",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ── Fee Type Badge ──────────────────────────────────────────
function FeeTypeBadge({ type }) {
  const cfg = {
    tuition: { bg: "#eff6ff", color: "#1d4ed8", label: "Học Phí" },
    meal: { bg: "#f0fdf4", color: "#166534", label: "Tiền Ăn" },
    other: { bg: "#faf5ff", color: "#7e22ce", label: "Khác" },
  }[type] || { bg: "#f1f5f9", color: "#64748b", label: type };

  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "2px 8px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 11,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ── Progress Bar ────────────────────────────────────────────
function ProgressBar({ value, max, color = "#14b8a6" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 8,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

export default function FinanceManagement() {
  const toast = useToast();

  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [feeConfigs, setFeeConfigs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [tab, setTab] = useState("invoices");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  // Fee config form
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [feeForm, setFeeForm] = useState({
    feeType: "tuition",
    name: "",
    amount: "",
    billingCycle: "monthly",
    effectiveFrom: currentMonth() + "-01",
    note: "",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, sumRes, cfgRes, clsRes] = await Promise.all([
        axiosClient.get(`/finance/invoices?month=${month}`),
        axiosClient.get(`/finance/summary?month=${month}`),
        axiosClient.get("/finance/fee-configs"),
        axiosClient.get("/academic/classes"),
      ]);
      setInvoices(invRes.data || []);
      setSummary(sumRes.data || null);
      setFeeConfigs(cfgRes.data || []);
      setClasses(clsRes.data || []);
    } catch (err) {
      console.error("Finance fetch error", err);
      toast({ message: "Lỗi tải dữ liệu tài chính", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [month, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Generate invoices ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!window.confirm(`Tạo hóa đơn tháng ${month}?\n(Sẽ dùng Cấu Hình Học Phí hiện tại trong DB)`))
      return;
    setGenerating(true);
    try {
      const res = await axiosClient.post("/finance/invoices/generate", { month });
      toast({
        message: `✅ Đã tạo ${res.data?.created || 0} hóa đơn! (Học phí: ${fmtVND(res.data?.tuitionAmount)})`,
      });
      fetchAll();
    } catch {
      toast({ message: "Lỗi tạo hóa đơn!", type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  // ── Record Payment ─────────────────────────────────────────
  const handleRecordPayment = async () => {
    if (!payModal || !payAmount) return;
    try {
      // Backend recordPayment nhận field "amount" (không phải "amountPaid")
      await axiosClient.post("/finance/payments", {
        invoiceId: payModal.id,
        amount: Number(payAmount),        // ← đúng field name
        paymentMethod: "cash",
        note: payNote || null,
      });
      toast({ message: "✅ Ghi nhận thanh toán thành công!" });
      setPayModal(null);
      setPayAmount("");
      setPayNote("");
      fetchAll();
    } catch {
      toast({ message: "Ghi nhận thất bại!", type: "error" });
    }
  };

  // ── Fee Config CRUD ────────────────────────────────────────
  const resetFeeForm = () => {
    setFeeForm({
      feeType: "tuition",
      name: "",
      amount: "",
      billingCycle: "monthly",
      effectiveFrom: currentMonth() + "-01",
      note: "",
    });
    setEditingFee(null);
    setShowFeeForm(false);
  };

  const handleEditFee = (cfg) => {
    setEditingFee(cfg);
    setFeeForm({
      feeType: cfg.feeType,
      name: cfg.name,
      amount: String(cfg.amount),
      billingCycle: cfg.billingCycle,
      effectiveFrom: cfg.effectiveFrom,
      note: cfg.note || "",
    });
    setShowFeeForm(true);
  };

  const handleSaveFee = async () => {
    if (!feeForm.name || !feeForm.amount) {
      toast({ message: "Vui lòng điền tên và số tiền", type: "error" });
      return;
    }
    try {
      if (editingFee) {
        await axiosClient.put(`/finance/fee-configs/${editingFee.id}`, {
          name: feeForm.name,
          amount: Number(feeForm.amount),
          billingCycle: feeForm.billingCycle,
          effectiveFrom: feeForm.effectiveFrom,
          note: feeForm.note || null,
        });
        toast({ message: "✅ Đã cập nhật cấu hình học phí!" });
      } else {
        await axiosClient.post("/finance/fee-configs", {
          feeType: feeForm.feeType,
          name: feeForm.name,
          amount: Number(feeForm.amount),
          billingCycle: feeForm.billingCycle,
          effectiveFrom: feeForm.effectiveFrom,
          note: feeForm.note || null,
          createdBy: null,
        });
        toast({ message: "✅ Đã tạo cấu hình học phí mới!" });
      }
      resetFeeForm();
      fetchAll();
    } catch {
      toast({ message: "Lỗi lưu cấu hình!", type: "error" });
    }
  };

  const handleDeleteFee = async (id, name) => {
    if (!window.confirm(`Xoá cấu hình "${name}"?`)) return;
    try {
      await axiosClient.delete(`/finance/fee-configs/${id}`);
      toast({ message: "Đã xoá cấu hình học phí" });
      fetchAll();
    } catch {
      toast({ message: "Lỗi xoá cấu hình!", type: "error" });
    }
  };

  // ── Filter invoices by class ───────────────────────────────
  const filteredInvoices = filterClass
    ? invoices.filter((inv) => {
        const cls = classes.find(
          (c) => c.students?.some((s) => s.id === inv.studentId)
        );
        return cls?.id === Number(filterClass);
      })
    : invoices;

  const tabs = [
    { key: "invoices", label: "📋 Hóa Đơn" },
    { key: "summary", label: "📊 Tổng Hợp" },
    { key: "configs", label: "⚙️ Cấu Hình Học Phí" },
  ];

  // ── KPI values (fix field mapping) ────────────────────────
  const totalBilled = summary?.totalBilled ?? summary?.totalInvoiced ?? 0;
  const totalCollected = summary?.totalCollected ?? 0;
  const totalRemaining = summary?.totalRemaining ?? summary?.totalOutstanding ?? 0;
  const overdueCount =
    summary?.statusBreakdown?.overdue ?? summary?.overdueCount ?? 0;

  // ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
            Quản Lý Tài Chính
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            Học Phí &amp; Hóa Đơn
          </h2>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            {generating ? "Đang tạo..." : "Tạo Hóa Đơn Tháng Này"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Tổng Hóa Đơn",
            val: fmtVND(totalBilled),
            icon: "receipt",
            color: "#1d4ed8",
            bg: "#eff6ff",
          },
          {
            label: "Đã Thu",
            val: fmtVND(totalCollected),
            icon: "payments",
            color: "#15803d",
            bg: "#dcfce7",
          },
          {
            label: "Còn Nợ",
            val: fmtVND(totalRemaining),
            icon: "pending_actions",
            color: "#b45309",
            bg: "#fef3c7",
          },
          {
            label: "Quá Hạn",
            val: `${overdueCount} hóa đơn`,
            icon: "warning",
            color: "#991b1b",
            bg: "#fee2e2",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: k.bg }}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ color: k.color, fontVariationSettings: "'FILL' 1" }}
              >
                {k.icon}
              </span>
            </div>
            <p className="text-xl font-black text-slate-800">{k.val}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">
              {k.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3.5 text-sm font-bold transition-all ${
                tab === t.key
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
                payments
              </span>
            </div>
          ) : tab === "invoices" ? (
            // ══ TAB: HÓA ĐƠN ══════════════════════════════════
            <div>
              {/* Filter by class */}
              <div className="flex gap-3 mb-4 flex-wrap items-center">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Tất Cả Lớp</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.class_name}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-400">
                  {filteredInvoices.length} hóa đơn
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                      <th className="text-left py-3 px-4 rounded-l-xl">ID</th>
                      <th className="text-left py-3 px-4">Học Sinh</th>
                      <th className="text-left py-3 px-4">Tháng</th>
                      <th className="text-right py-3 px-4">Tổng Tiền</th>
                      <th className="text-right py-3 px-4">Đã Trả</th>
                      <th className="text-right py-3 px-4">Còn Lại</th>
                      <th className="text-center py-3 px-4">Trạng Thái</th>
                      <th className="text-center py-3 px-4 rounded-r-xl">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">
                            receipt_long
                          </span>
                          Chưa có hóa đơn nào cho tháng này.
                          <br />
                          <span className="text-xs">Nhấn "Tạo Hóa Đơn Tháng Này" để tạo.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const remaining = Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                              #{inv.id}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {inv.studentName || inv.student?.full_name || "—"}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{inv.month}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">
                              {fmtVND(inv.totalAmount)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-green-700">
                              {fmtVND(inv.amountPaid)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-amber-700">
                              {fmtVND(remaining)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              {inv.status !== "paid" && inv.status !== "cancelled" && (
                                <button
                                  onClick={() => {
                                    setPayModal(inv);
                                    setPayAmount(String(Math.max(0, remaining)));
                                    setPayNote("");
                                  }}
                                  className="text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg"
                                >
                                  💳 Ghi Thu
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : tab === "summary" ? (
            // ══ TAB: TỔNG HỢP ══════════════════════════════════
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-600">
                  📊 Báo cáo tháng {month}
                </p>
                {summary?.collectionRate !== undefined && (
                  <span
                    className="text-2xl font-black"
                    style={{
                      color:
                        summary.collectionRate >= 80
                          ? "#15803d"
                          : summary.collectionRate >= 50
                          ? "#b45309"
                          : "#991b1b",
                    }}
                  >
                    {summary.collectionRate}%
                  </span>
                )}
              </div>

              {/* Progress */}
              {summary && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Tỷ lệ thu học phí</span>
                      <span className="font-bold text-green-700">
                        {fmtVND(totalCollected)} / {fmtVND(totalBilled)}
                      </span>
                    </div>
                    <ProgressBar
                      value={totalCollected}
                      max={totalBilled}
                      color="#22c55e"
                    />
                  </div>

                  {/* Status breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        key: "paid",
                        label: "Đã Thanh Toán",
                        color: "#15803d",
                        bg: "#dcfce7",
                        icon: "check_circle",
                      },
                      {
                        key: "partial",
                        label: "Một Phần",
                        color: "#854d0e",
                        bg: "#fef9c3",
                        icon: "pending",
                      },
                      {
                        key: "pending",
                        label: "Chờ Thu",
                        color: "#b45309",
                        bg: "#fef3c7",
                        icon: "schedule",
                      },
                      {
                        key: "overdue",
                        label: "Quá Hạn",
                        color: "#991b1b",
                        bg: "#fee2e2",
                        icon: "warning",
                      },
                    ].map((s) => (
                      <div
                        key={s.key}
                        className="rounded-xl p-4 flex flex-col gap-1"
                        style={{ background: s.bg }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[16px]"
                            style={{
                              color: s.color,
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            {s.icon}
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: s.color }}
                          >
                            {s.label}
                          </span>
                        </div>
                        <p
                          className="text-2xl font-black"
                          style={{ color: s.color }}
                        >
                          {summary.statusBreakdown?.[s.key] ?? 0}
                        </p>
                        <p className="text-xs" style={{ color: s.color, opacity: 0.7 }}>
                          học sinh
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Amount summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        label: "Tổng Phải Thu",
                        val: fmtVND(totalBilled),
                        icon: "account_balance_wallet",
                        color: "#1d4ed8",
                      },
                      {
                        label: "Đã Thu Được",
                        val: fmtVND(totalCollected),
                        icon: "payments",
                        color: "#15803d",
                      },
                      {
                        label: "Còn Lại",
                        val: fmtVND(totalRemaining),
                        icon: "money_off",
                        color: "#b45309",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="border border-slate-100 rounded-xl p-4 flex items-center gap-3"
                      >
                        <span
                          className="material-symbols-outlined text-[24px]"
                          style={{
                            color: item.color,
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-xs text-slate-400 font-medium">
                            {item.label}
                          </p>
                          <p
                            className="text-lg font-black"
                            style={{ color: item.color }}
                          >
                            {item.val}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400">
                    Tổng {summary.totalStudents || 0} học sinh có hóa đơn tháng {month}
                  </p>
                </>
              )}
            </div>
          ) : (
            // ══ TAB: CẤU HÌNH HỌC PHÍ ═════════════════════════
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500 font-medium">
                  Danh sách cấu hình học phí ({feeConfigs.length})
                </p>
                <button
                  onClick={() => {
                    resetFeeForm();
                    setShowFeeForm(true);
                  }}
                  className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Thêm Mức Phí
                </button>
              </div>

              {/* Fee Config Form */}
              {showFeeForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4">
                  <h4 className="font-bold text-slate-700 mb-4 text-base">
                    {editingFee ? "✏️ Cập Nhật Cấu Hình" : "➕ Thêm Cấu Hình Mới"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!editingFee && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                          Loại Phí
                        </label>
                        <select
                          value={feeForm.feeType}
                          onChange={(e) => {
                            const t = e.target.value;
                            setFeeForm((f) => ({
                              ...f,
                              feeType: t,
                              billingCycle: t === "meal" ? "daily" : "monthly",
                            }));
                          }}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="tuition">Học Phí</option>
                          <option value="meal">Tiền Ăn</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Tên Khoản Phí *
                      </label>
                      <input
                        type="text"
                        value={feeForm.name}
                        onChange={(e) => setFeeForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="VD: Học phí tháng 4/2026"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Số Tiền (VND) *
                      </label>
                      <input
                        type="number"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="VD: 1500000"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Chu Kỳ Tính
                      </label>
                      <select
                        value={feeForm.billingCycle}
                        onChange={(e) => setFeeForm((f) => ({ ...f, billingCycle: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="monthly">Hàng Tháng (cố định)</option>
                        <option value="daily">Hàng Ngày (nhân số ngày đi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Hiệu Lực Từ Ngày *
                      </label>
                      <input
                        type="date"
                        value={feeForm.effectiveFrom}
                        onChange={(e) => setFeeForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Ghi Chú
                      </label>
                      <input
                        type="text"
                        value={feeForm.note}
                        onChange={(e) => setFeeForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="Tuỳ chọn"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={resetFeeForm}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleSaveFee}
                      className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow hover:opacity-90"
                    >
                      {editingFee ? "✓ Lưu Thay Đổi" : "✓ Tạo Cấu Hình"}
                    </button>
                  </div>
                </div>
              )}

              {/* Fee Configs List */}
              {feeConfigs.length === 0 && !showFeeForm ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">
                    settings
                  </span>
                  Chưa có cấu hình học phí nào.
                  <br />
                  <span className="text-xs">
                    Thêm cấu hình trước khi "Tạo Hóa Đơn Tháng Này".
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {feeConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      className="border border-slate-100 rounded-xl p-4 flex items-center justify-between bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-700 text-sm">
                              {cfg.name}
                            </span>
                            <FeeTypeBadge type={cfg.feeType} />
                          </div>
                          <div className="text-xs text-slate-400 flex gap-3">
                            <span>
                              {cfg.billingCycle === "daily"
                                ? "💡 Tính/Ngày đi học"
                                : "📅 Hàng tháng (cố định)"}
                            </span>
                            <span>Từ {cfg.effectiveFrom}</span>
                            {cfg.note && <span>• {cfg.note}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-black text-primary text-lg">
                          {fmtVND(cfg.amount)}
                          {cfg.billingCycle === "daily" && (
                            <span className="text-xs font-normal text-slate-400 ml-1">/ngày</span>
                          )}
                        </p>
                        <button
                          onClick={() => handleEditFee(cfg)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFee(cfg.id, cfg.name)}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                          title="Xoá"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-extrabold text-primary font-headline mb-1">
              💳 Ghi Nhận Thanh Toán
            </h3>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-bold">
                  {payModal.studentName || payModal.student?.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hóa đơn #</span>
                <span className="font-mono font-bold">{payModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng tiền:</span>
                <span className="font-bold">{fmtVND(payModal.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã đóng:</span>
                <span className="font-bold text-green-700">
                  {fmtVND(payModal.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="font-bold text-slate-700">Cần đóng thêm:</span>
                <span className="font-black text-amber-700">
                  {fmtVND(
                    Number(payModal.totalAmount) - Number(payModal.amountPaid)
                  )}
                </span>
              </div>
            </div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Số Tiền Thanh Toán Lần Này (VND) *
            </label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Nhập số tiền"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              Ghi Chú (Tuỳ Chọn)
            </label>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="VD: Phụ huynh đóng tiền mặt tại văn phòng"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setPayModal(null); setPayAmount(""); setPayNote(""); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-2 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90"
              >
                ✓ Xác Nhận Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
