import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import KPISection from "./components/KPISection";
import AnalyticsSection from "./components/AnalyticsSection";
import { useLang } from "../../contexts/LangContext";

// ─── Finance KPI mini-widget ──────────────────────────────────────────────────
function FinanceSummaryBar({ summary, vi }) {
  if (!summary) return null;

  const fmtVND = (n) =>
    Number(n || 0).toLocaleString("vi-VN") + " ₫";

  const items = [
    {
      icon: "receipt_long",
      label: vi ? "Tổng hóa đơn" : "Total Invoices",
      value: summary.totalInvoices ?? "—",
      color: "text-cyan-700 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/20",
    },
    {
      icon: "check_circle",
      label: vi ? "Đã thanh toán" : "Collected",
      value: fmtVND(summary.totalCollected),
      color: "text-green-700 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: "pending",
      label: vi ? "Chờ thu" : "Pending",
      value: fmtVND(summary.totalPending),
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      icon: "warning",
      label: vi ? "Quá hạn" : "Overdue",
      value: summary.overdueCount ?? 0,
      color: "text-error dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined text-cyan-700 dark:text-cyan-400"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          account_balance_wallet
        </span>
        <h3 className="text-sm font-extrabold text-cyan-900 dark:text-cyan-100 uppercase tracking-widest">
          {vi ? "Tài Chính Tháng Này" : "This Month's Finance"}
        </h3>
        <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
          {new Date().toLocaleDateString(vi ? "vi-VN" : "en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-2xl p-4 flex items-center gap-3`}
          >
            <span
              className={`material-symbols-outlined ${item.color} text-xl`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {item.label}
              </p>
              <p className={`text-base font-black ${item.color} truncate`}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-3xl h-36" />
        ))}
      </div>
      {/* Finance bar skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-100 rounded-2xl h-16" />
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-100 rounded-4xl h-72" />
        <div className="bg-slate-100 rounded-4xl h-72" />
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry, vi }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
      <span
        className="material-symbols-outlined text-5xl text-error"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        cloud_off
      </span>
      <p className="font-bold text-lg text-slate-700">
        {vi ? "Không thể tải dữ liệu" : "Failed to load data"}
      </p>
      <p className="text-sm text-center text-slate-400">
        {vi
          ? "Kiểm tra kết nối server hoặc thử lại."
          : "Check server connection or try again."}
      </p>
      <button
        onClick={onRetry}
        className="mt-2 px-6 py-2.5 bg-cyan-800 hover:bg-cyan-900 text-white font-bold rounded-2xl transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        {vi ? "Thử Lại" : "Retry"}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExecutiveDashboard() {
  const { lang } = useLang();
  const vi = lang === "vi";

  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [deficiencyDetails, setDeficiencyDetails] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [dashRes, assessmentsRes, deficiencyRes, financeRes] =
        await Promise.all([
          axiosClient.get("/admin/dashboard"),
          axiosClient.get("/academic/assessments"),
          axiosClient
            .get("/admin/deficiencies")
            .catch(() => ({ data: [] })),
          axiosClient
            .get(`/finance/summary?month=${currentMonth}`)
            .catch(() => ({ data: null })),
        ]);

      setStats(dashRes.data);
      setAssessments(assessmentsRes.data || []);
      setDeficiencyDetails(deficiencyRes.data || []);
      setFinanceSummary(financeRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={fetchData} vi={vi} />;

  return (
    <>
      <KPISection stats={stats} deficiencyDetails={deficiencyDetails} />
      <FinanceSummaryBar summary={financeSummary} vi={vi} />
      <AnalyticsSection stats={stats} assessments={assessments} />
    </>
  );
}
