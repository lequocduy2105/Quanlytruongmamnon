import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

// ── Utility ────────────────────────────────────────────────
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmtVND = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";

// ── Badge helpers ──────────────────────────────────────────
function StatusBadge({ status, vi }) {
  const cfg = {
    paid: {
      bg: "bg-green-100 text-green-700",
      label: vi ? "Đã Thanh Toán" : "Paid",
    },
    pending: {
      bg: "bg-amber-100 text-amber-700",
      label: vi ? "Chờ Thanh Toán" : "Pending",
    },
    overdue: {
      bg: "bg-red-100 text-red-700",
      label: vi ? "Quá Hạn" : "Overdue",
    },
  }[status] || { bg: "bg-slate-100 text-slate-600", label: status };
  return (
    <span
      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg}`}
    >
      {cfg.label}
    </span>
  );
}

export default function FinanceManagement() {
  const { lang } = useLang();
  const vi = lang === "vi";
  const toast = useToast();

  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [feeConfigs, setFeeConfigs] = useState([]);
  const [tab, setTab] = useState("invoices"); // 'invoices' | 'configs' | 'summary'
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payModal, setPayModal] = useState(null); // invoice object for payment
  const [payAmount, setPayAmount] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, sumRes, cfgRes] = await Promise.all([
        axiosClient.get(`/finance/invoices?month=${month}`),
        axiosClient.get(`/finance/summary?month=${month}`),
        axiosClient.get("/finance/fee-configs"),
      ]);
      setInvoices(invRes.data || []);
      setSummary(sumRes.data || null);
      setFeeConfigs(cfgRes.data || []);
    } catch (err) {
      console.error("Finance fetch error", err);
      toast({
        message: vi
          ? "Lỗi tải dữ liệu tài chính"
          : "Failed to load finance data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleGenerate = async () => {
    if (
      !window.confirm(
        vi ? `Tạo hóa đơn tháng ${month}?` : `Generate invoices for ${month}?`,
      )
    )
      return;
    setGenerating(true);
    try {
      const res = await axiosClient.post("/finance/invoices/generate", {
        month,
      });
      toast({
        message: vi
          ? `Đã tạo ${res.data?.created || 0} hóa đơn!`
          : `Created ${res.data?.created || 0} invoices!`,
      });
      fetchAll();
    } catch (err) {
      toast({
        message: vi ? "Lỗi tạo hóa đơn!" : "Failed to generate!",
        type: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!payModal || !payAmount) return;
    try {
      await axiosClient.post("/finance/payments", {
        invoiceId: payModal.id,
        amountPaid: Number(payAmount),
        paymentMethod: "cash",
        paidAt: new Date().toISOString().slice(0, 10),
      });
      toast({
        message: vi ? "Ghi nhận thanh toán thành công!" : "Payment recorded!",
      });
      setPayModal(null);
      setPayAmount("");
      fetchAll();
    } catch {
      toast({
        message: vi ? "Ghi nhận thất bại!" : "Failed to record payment",
        type: "error",
      });
    }
  };

  const tabs = [
    { key: "invoices", label: vi ? "📋 Hóa Đơn" : "📋 Invoices" },
    { key: "summary", label: vi ? "📊 Tổng Hợp" : "📊 Summary" },
    { key: "configs", label: vi ? "⚙️ Cấu Hình Học Phí" : "⚙️ Fee Config" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
            {vi ? "Quản Lý Tài Chính" : "Finance Management"}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Học Phí & Hóa Đơn" : "Tuition & Invoices"}
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
            <span className="material-symbols-outlined text-[18px]">
              receipt_long
            </span>
            {generating
              ? vi
                ? "Đang tạo..."
                : "Generating..."
              : vi
                ? "Tạo Hóa Đơn Tháng Này"
                : "Generate Month"}
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: vi ? "Tổng Hóa Đơn" : "Total Invoiced",
              val: fmtVND(summary.totalInvoiced),
              icon: "receipt",
              color: "text-primary bg-primary/10",
            },
            {
              label: vi ? "Đã Thu" : "Collected",
              val: fmtVND(summary.totalCollected),
              icon: "payments",
              color: "text-green-700 bg-green-100",
            },
            {
              label: vi ? "Còn Nợ" : "Outstanding",
              val: fmtVND(summary.totalOutstanding),
              icon: "pending_actions",
              color: "text-amber-700 bg-amber-100",
            },
            {
              label: vi ? "Quá Hạn" : "Overdue",
              val: summary.overdueCount + (vi ? " hóa đơn" : " invoices"),
              icon: "warning",
              color: "text-red-700 bg-red-100",
            },
          ].map((k, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color.split(" ")[1]}`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${k.color.split(" ")[0]}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
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
      )}

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">
                      {vi ? "Học Sinh" : "Student"}
                    </th>
                    <th className="text-left py-3 px-4">
                      {vi ? "Tháng" : "Month"}
                    </th>
                    <th className="text-right py-3 px-4">
                      {vi ? "Số Tiền" : "Amount"}
                    </th>
                    <th className="text-right py-3 px-4">
                      {vi ? "Đã Trả" : "Paid"}
                    </th>
                    <th className="text-center py-3 px-4">
                      {vi ? "Trạng Thái" : "Status"}
                    </th>
                    <th className="text-center py-3 px-4">
                      {vi ? "Hành Động" : "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-slate-400"
                      >
                        {vi
                          ? "Chưa có hóa đơn nào cho tháng này."
                          : "No invoices for this month yet."}
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                          #{inv.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {inv.studentName || inv.student?.full_name || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {inv.month}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {fmtVND(inv.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-700 font-semibold">
                          {fmtVND(inv.amountPaid)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={inv.status} vi={vi} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          {inv.status !== "paid" && (
                            <button
                              onClick={() => {
                                setPayModal(inv);
                                setPayAmount(
                                  String(
                                    Number(inv.totalAmount) -
                                      Number(inv.amountPaid),
                                  ),
                                );
                              }}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              {vi ? "Ghi Thu" : "Record Payment"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : tab === "summary" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                {vi ? `Báo cáo tháng ${month}` : `Report for ${month}`}
              </p>
              {summary ? (
                <pre className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 overflow-auto">
                  {JSON.stringify(summary, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  {vi ? "Không có dữ liệu" : "No data"}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {feeConfigs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  {vi ? "Chưa cấu hình học phí." : "No fee configs yet."}
                </p>
              ) : (
                feeConfigs.map((cfg) => (
                  <div
                    key={cfg.id}
                    className="border border-slate-100 rounded-xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-700">
                        {cfg.name || cfg.feeType}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cfg.ageGroup
                          ? `${vi ? "Nhóm tuổi" : "Age group"}: ${cfg.ageGroup}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-black text-primary text-lg">
                      {fmtVND(cfg.baseAmount)}
                    </p>
                  </div>
                ))
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
              {vi ? "💳 Ghi Nhận Thanh Toán" : "💳 Record Payment"}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {vi
                ? `Hóa đơn #${payModal.id} · Cần đóng: ${fmtVND(Number(payModal.totalAmount) - Number(payModal.amountPaid))}`
                : `Invoice #${payModal.id} · Due: ${fmtVND(Number(payModal.totalAmount) - Number(payModal.amountPaid))}`}
            </p>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={
                vi ? "Số tiền thanh toán (VND)" : "Amount paid (VND)"
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setPayModal(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50"
              >
                {vi ? "Huỷ" : "Cancel"}
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-[2] py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90"
              >
                {vi ? "✓ Xác Nhận Thanh Toán" : "✓ Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
