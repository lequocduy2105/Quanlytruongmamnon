import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";

// ─── Custom Tooltips ────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 10,
        padding: "8px 12px",
        color: "#fff",
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#7dd3fc" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload, vi }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 10,
        padding: "8px 12px",
        color: "#fff",
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, color: item.payload.fill }}>{item.name}</p>
      <p>
        {vi ? "Số trẻ" : "Count"}: <strong>{item.value}</strong>
      </p>
      <p>
        {vi ? "Tỷ lệ" : "Ratio"}: <strong>{item.payload.pct}%</strong>
      </p>
    </div>
  );
};

// ─── Màu sắc sức khoẻ ───────────────────────────────────────────────────────
const HEALTH_COLORS = {
  normal: "#2da44e",
  under: "#f79518",
  over: "#e5534b",
};

// ─── Modal chi tiết "Thiếu sót cần xử lý" ───────────────────────────────────
function DeficiencyModal({ open, onClose, items, vi }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{
            background: "linear-gradient(135deg, #fff1f0 0%, #fff 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-error text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface font-headline text-lg">
                {vi ? "Học Sinh Cần Xử Lý" : "Students Needing Attention"}
              </h3>
              <p className="text-xs text-slate-500">
                {items.length}{" "}
                {vi
                  ? "trường hợp phát triển bất thường"
                  : "cases of abnormal development"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400 text-xl">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <span
                className="material-symbols-outlined text-5xl text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="font-semibold">
                {vi
                  ? "Không có trường hợp nào cần xử lý!"
                  : "No cases need attention!"}
              </p>
              <p className="text-xs text-center">
                {vi
                  ? "Tất cả học sinh đều phát triển bình thường."
                  : "All students are developing normally."}
              </p>
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-error-container/40 bg-error-container/10 p-4 flex gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-error flex-shrink-0 flex items-center justify-center font-black text-white text-sm font-headline">
                  {(item.studentName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Student + Class + Teacher */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-on-surface">
                      {item.studentName}
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      {vi ? "Lớp" : "Class"}: {item.className}
                    </span>
                    <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                      GV: {item.teacherName}
                    </span>
                  </div>
                  {/* Deficiency log */}
                  <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2 mt-2">
                    <p className="text-[11px] font-bold text-error uppercase tracking-wide mb-1">
                      {vi ? "Nội dung thiếu sót:" : "Deficiency noted:"}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {item.deficiencyLog}
                    </p>
                  </div>
                  {/* Scores row */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[
                      {
                        k: vi ? "Nhận thức" : "Cognitive",
                        v: item.cognitiveScore,
                      },
                      { k: vi ? "Xã hội" : "Social", v: item.socialScore },
                      { k: vi ? "Vận động" : "Motor", v: item.motorScore },
                      {
                        k: vi ? "Cảm xúc" : "Emotional",
                        v: item.emotionalScore,
                      },
                    ].map((s, j) => (
                      <div key={j} className="text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {s.k}
                        </p>
                        <p
                          className="text-base font-black font-headline"
                          style={{
                            color:
                              Number(s.v) < 5
                                ? "#e5534b"
                                : Number(s.v) < 7
                                  ? "#f79518"
                                  : "#2da44e",
                          }}
                        >
                          {Number(s.v).toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Date */}
                  <p className="text-[10px] text-slate-400 mt-2">
                    {vi ? "Ghi nhận:" : "Recorded:"}{" "}
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-bold text-slate-600 transition-colors"
          >
            {vi ? "Đóng" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component chính ─────────────────────────────────────────────────────────
export default function SystemReports() {
  const { lang } = useLang();
  const vi = lang === "vi";

  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [deficiencyDetails, setDeficiencyDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deficiencyModalOpen, setDeficiencyModalOpen] = useState(false);

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [dashRes, teachersRes, assessmentsRes, deficiencyRes] =
          await Promise.all([
            api.get("/admin/dashboard"),
            api.get("/academic/teachers"),
            api.get("/academic/assessments"),
            api.get("/admin/deficiencies").catch(() => ({ data: [] })), // graceful fallback
          ]);

        const dashData = dashRes.data || {};
        setStats(dashData);
        setAssessments(assessmentsRes.data || []);
        setDeficiencyDetails(deficiencyRes.data || []);

        // Teacher assessment counts
        const teacherCount = {};
        (assessmentsRes.data || []).forEach((a) => {
          const tid = a.teacher?.id || a.teacherId;
          if (tid) teacherCount[tid] = (teacherCount[tid] || 0) + 1;
        });
        const teacherData = (teachersRes.data || [])
          .map((t) => ({
            id: t.id,
            name: t.full_name,
            spec: t.specializations || "General",
            assessments: teacherCount[t.id] || 0,
          }))
          .sort((a, b) => b.assessments - a.assessments)
          .slice(0, 6);
        setTeachers(teacherData);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Failed to load report data", e);
        setError(
          vi
            ? "Không thể tải dữ liệu. Kiểm tra backend đang chạy."
            : "Failed to load data. Check backend services.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vi],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined text-5xl animate-pulse">
            analytics
          </span>
          <p className="font-semibold">
            {vi ? "Đang tải báo cáo..." : "Loading reports..."}
          </p>
        </div>
      </div>
    );

  // ─── Error state — hiển thị lỗi rõ ràng ──────────────────────────────
  if (error || !stats)
    return (
      <div className="p-8 bg-error-container/20 rounded-2xl border border-error-container text-error space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <p className="font-bold">
            {error || (vi ? "Không thể tải dữ liệu." : "Failed to load data.")}
          </p>
        </div>
        <div className="text-sm text-error/80 bg-white/50 rounded-xl p-4 font-mono space-y-1">
          <p>
            <strong>{vi ? "Nguyên nhân thường gặp:" : "Common causes:"}</strong>
          </p>
          <p>
            •{" "}
            {vi
              ? "api-gateway chưa chạy (port 3000)"
              : "api-gateway not running (port 3000)"}
          </p>
          <p>
            •{" "}
            {vi
              ? "health-service chưa chạy (port 3002)"
              : "health-service not running (port 3002)"}
          </p>
          <p>
            •{" "}
            {vi
              ? "academic-service chưa chạy (port 3001)"
              : "academic-service not running (port 3001)"}
          </p>
        </div>
        <button
          onClick={() => fetchAll()}
          className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-xl text-sm font-bold hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          {vi ? "Thử Lại" : "Retry"}
        </button>
      </div>
    );

  // ─── Tính toán health data ───────────────────────────────────────────────
  const healthStats = stats.healthStats || {};
  const normalCount = healthStats.normal || 0;
  const underCount = healthStats.under || 0;
  const overCount = healthStats.over || 0;
  const totalHealth = normalCount + underCount + overCount;
  const normalPct =
    totalHealth > 0 ? Math.round((normalCount / totalHealth) * 100) : 0;
  const underPct =
    totalHealth > 0 ? Math.round((underCount / totalHealth) * 100) : 0;
  const overPct =
    totalHealth > 0 ? Math.round((overCount / totalHealth) * 100) : 0;

  // PieChart data — luôn tạo array (kể cả khi 0)
  const healthPieData = [
    {
      name: vi ? "Bình Thường" : "Normal",
      value: normalCount,
      fill: HEALTH_COLORS.normal,
      pct: normalPct,
    },
    {
      name: vi ? "Thiếu Cân" : "Underweight",
      value: underCount,
      fill: HEALTH_COLORS.under,
      pct: underPct,
    },
    {
      name: vi ? "Thừa Cân" : "Overweight",
      value: overCount,
      fill: HEALTH_COLORS.over,
      pct: overPct,
    },
  ];
  const healthPieFiltered = healthPieData.filter((d) => d.value > 0);
  const healthPieDisplay =
    healthPieFiltered.length > 0
      ? healthPieFiltered
      : [
          {
            name: vi ? "Chưa có dữ liệu" : "No data",
            value: 1,
            fill: "#e2e8f0",
            pct: 0,
          },
        ];

  // ─── Trend chart (assessments theo tháng) — LUÔN HIỂN THỊ ───────────────
  const monthSlots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: vi ? `T${d.getMonth() + 1}` : `M${d.getMonth() + 1}`,
    };
  });
  const assessmentByMonth = {};
  assessments.forEach((a) => {
    const raw = a.created_at || a.createdAt || a.date || a.logged_at;
    if (!raw) return;
    const k =
      typeof raw === "string"
        ? raw.slice(0, 7)
        : new Date(raw).toISOString().slice(0, 7);
    assessmentByMonth[k] = (assessmentByMonth[k] || 0) + 1;
  });
  const trendData = monthSlots.map((m) => ({
    month: m.label,
    total: assessmentByMonth[m.key] || 0,
  }));
  const hasAnyTrendData = trendData.some((d) => d.total > 0);

  // ─── Teacher bar data ─────────────────────────────────────────────────────
  const teacherBarData = teachers.map((t) => ({
    name: t.name.split(" ").slice(-2).join(" "),
    fullName: t.name,
    total: t.assessments,
  }));

  // ─── KPI Cards ────────────────────────────────────────────────────────────
  const defCount = stats.deficiencies || 0;
  const CARDS = [
    {
      title: vi ? "Đánh Giá Phụ Huynh" : "Parent Rating",
      icon: "star",
      iconColor: "text-tertiary",
      color: "bg-tertiary-fixed/60 border-tertiary-fixed-dim/30",
      value: stats.rating > 0 ? `${stats.rating} ★` : "N/A",
      sub:
        stats.rating > 0
          ? vi
            ? `TB phụ huynh / 5 sao`
            : `Avg from parents / 5`
          : vi
            ? "Chưa có đánh giá"
            : "No ratings yet",
      badge: !stats.rating
        ? { l: vi ? "Chưa có" : "No data", c: "bg-slate-100 text-slate-500" }
        : stats.rating >= 4
          ? {
              l: vi ? "✓ Rất Tốt" : "✓ Excellent",
              c: "bg-secondary-container text-secondary",
            }
          : stats.rating >= 3
            ? {
                l: vi ? "~ Trung Bình" : "~ Average",
                c: "bg-tertiary-fixed text-tertiary",
              }
            : {
                l: vi ? "⚠ Cần Cải Thiện" : "⚠ Needs Work",
                c: "bg-error-container text-error",
              },
      progress: stats.rating > 0 ? Math.round((stats.rating / 5) * 100) : 0,
      progressColor: "bg-tertiary",
      detail: vi ? "Thang điểm: 1–5 ★" : "Scale: 1–5 ★",
      tooltip: vi
        ? "Điểm TB phụ huynh.\n≥4★ Tốt · ≥3★ TB · <3★ Kém"
        : "Avg parent rating.\n≥4★ Good · ≥3★ Avg · <3★ Poor",
      clickable: false,
    },
    {
      title: vi ? "Sức Khoẻ Toàn Trường" : "School Health",
      icon: "monitor_heart",
      iconColor: "text-secondary",
      color: "bg-secondary-container/20 border-secondary-container/50",
      value: totalHealth > 0 ? `${normalPct}%` : "N/A",
      sub:
        totalHealth > 0
          ? vi
            ? `${normalCount}/${totalHealth} trẻ cân nặng bình thường`
            : `${normalCount}/${totalHealth} normal weight`
          : vi
            ? "Chưa có bản ghi sức khoẻ"
            : "No health records yet",
      badge:
        totalHealth === 0
          ? {
              l: vi ? "Chưa có dữ liệu" : "No data",
              c: "bg-slate-100 text-slate-500",
            }
          : normalPct >= 80
            ? {
                l: vi ? "✓ Tốt" : "✓ Good",
                c: "bg-secondary-container text-secondary",
              }
            : normalPct >= 60
              ? {
                  l: vi ? "~ Chú Ý" : "~ Watch",
                  c: "bg-tertiary-fixed text-tertiary",
                }
              : {
                  l: vi ? "⚠ Hành Động" : "⚠ Act",
                  c: "bg-error-container text-error",
                },
      progress: normalPct,
      progressColor:
        normalPct >= 80
          ? "bg-secondary"
          : normalPct >= 60
            ? "bg-tertiary"
            : "bg-error",
      detail: vi
        ? `Thiếu cân: ${underCount} · Thừa cân: ${overCount}`
        : `Under: ${underCount} · Over: ${overCount}`,
      tooltip: vi
        ? "Tỷ lệ cân nặng bình thường.\n≥80% Tốt · 60–79% Chú ý · <60% Can thiệp"
        : "Normal weight ratio.\n≥80% Good · 60–79% Watch · <60% Act",
      clickable: false,
    },
    {
      title: vi ? "Đánh Giá Kỹ Năng" : "Skill Assessments",
      icon: "assignment",
      iconColor: "text-primary",
      color: "bg-primary/5 border-primary/20",
      value: `${stats.assessments || 0}`,
      sub: vi
        ? `Trên tổng ${stats.students || 0} học sinh`
        : `Out of ${stats.students || 0} students`,
      badge: {
        l: vi ? "ℹ Tổng Cộng" : "ℹ Total",
        c: "bg-primary/10 text-primary",
      },
      progress: Math.min(
        100,
        Math.round(
          ((stats.assessments || 0) / Math.max(1, stats.students || 1)) * 100,
        ),
      ),
      progressColor: "bg-primary",
      detail: vi
        ? "Nhận thức · Xã hội · Vận động"
        : "Cognitive · Social · Motor",
      tooltip: vi
        ? "Số đánh giá kỹ năng đã thực hiện.\nCàng nhiều = giám sát càng tốt."
        : "Total skill assessments.\nMore = better monitoring.",
      clickable: false,
    },
    {
      title: vi ? "Thiếu Sót Cần Xử Lý" : "Open Deficiencies",
      icon: "warning",
      iconColor: "text-error",
      color: "bg-error-container/30 border-error-container/50",
      value: `${defCount}`,
      sub: vi
        ? "Nhấn để xem danh sách học sinh cụ thể"
        : "Click to see specific students",
      badge: !defCount
        ? {
            l: vi ? "✓ Không Có" : "✓ Clear",
            c: "bg-secondary-container text-secondary",
          }
        : defCount <= 3
          ? {
              l: vi ? "~ Xem Xét" : "~ Review",
              c: "bg-tertiary-fixed text-tertiary",
            }
          : {
              l: vi ? "⚠ Nghiêm Trọng" : "⚠ Critical",
              c: "bg-error-container text-error",
            },
      progress: Math.min(
        100,
        Math.round((defCount / Math.max(1, stats.students || 1)) * 100),
      ),
      progressColor: "bg-error",
      detail: vi
        ? "Nhấn để xem chi tiết từng em"
        : "Click for per-student details",
      tooltip: vi
        ? "0 = Tốt · 1–3 = Xem xét · >3 = Nghiêm trọng\nNhấn để xem danh sách học sinh."
        : "0 = Clear · 1–3 = Review · >3 = Critical\nClick to view student list.",
      clickable: true,
      onClick: () => setDeficiencyModalOpen(true),
    },
  ];

  return (
    <>
      {/* Modal chi tiết thiếu sót */}
      <DeficiencyModal
        open={deficiencyModalOpen}
        onClose={() => setDeficiencyModalOpen(false)}
        items={deficiencyDetails}
        vi={vi}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <p className="text-secondary font-bold text-xs uppercase tracking-widest mb-1">
            {vi ? "Phân Tích & Giám Sát" : "Analytics & Monitoring"}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Báo Cáo Hệ Thống" : "System Reports"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? "KPI toàn trường — sức khoẻ, đào tạo và phản hồi phụ huynh."
              : "School-wide KPIs — health, education & parent feedback."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Realtime indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-full">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${refreshing ? "bg-tertiary animate-ping" : "bg-secondary animate-pulse"}`}
            />
            <span>
              {refreshing
                ? vi
                  ? "Đang cập nhật..."
                  : "Refreshing..."
                : lastUpdated
                  ? vi
                    ? `Cập nhật: ${lastUpdated.toLocaleTimeString("vi-VN")}`
                    : `Updated: ${lastUpdated.toLocaleTimeString()}`
                  : ""}
            </span>
            <button
              onClick={() => fetchAll(true)}
              className="text-primary hover:opacity-70 transition-opacity"
              title={vi ? "Làm mới ngay" : "Refresh now"}
            >
              <span className="material-symbols-outlined text-[15px]">
                refresh
              </span>
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">
              download
            </span>
            {vi ? "Xuất PDF" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${card.color} relative group ${card.clickable ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200" : ""}`}
            onClick={card.clickable ? card.onClick : undefined}
          >
            {/* Click hint badge for deficiency card */}
            {card.clickable && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[11px]">
                  open_in_new
                </span>
                {vi ? "Xem Chi Tiết" : "View Details"}
              </div>
            )}
            {/* Title row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined ${card.iconColor} text-[18px]`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {card.icon}
                </span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
              </div>
              {/* Tooltip */}
              {!card.clickable && (
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-300 hover:text-slate-500 cursor-help text-base transition-colors">
                    info
                  </span>
                  <div className="absolute right-0 top-6 z-30 hidden group-hover:block w-56 bg-slate-800 text-white text-[11px] leading-relaxed rounded-xl p-3 shadow-2xl whitespace-pre-line pointer-events-none">
                    {card.tooltip}
                    <div className="absolute -top-1.5 right-2 w-3 h-3 bg-slate-800 rotate-45" />
                  </div>
                </div>
              )}
            </div>
            {/* Badge */}
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${card.badge.c}`}
            >
              {card.badge.l}
            </span>
            {/* Value */}
            <p className="text-4xl font-black text-on-surface font-headline mb-1">
              {card.value}
            </p>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              {card.sub}
            </p>
            {/* Progress */}
            <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-700 ${card.progressColor}`}
                style={{ width: `${card.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-10 px-1">
        <p className="text-xs text-slate-400 font-semibold self-center">
          {vi ? "Chú thích:" : "Legend:"}
        </p>
        {[
          {
            c: "bg-secondary-container text-secondary",
            l: vi ? "✓ Tốt / Đạt" : "✓ Good",
          },
          {
            c: "bg-tertiary-fixed text-tertiary",
            l: vi ? "~ Cần Chú Ý" : "~ Watch",
          },
          {
            c: "bg-error-container text-error",
            l: vi ? "⚠ Cần Xử Lý" : "⚠ Action",
          },
        ].map((b, i) => (
          <span
            key={i}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.c}`}
          >
            {b.l}
          </span>
        ))}
        {/* Ghi chú card deficiency */}
        <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1 italic">
          <span className="material-symbols-outlined text-[13px]">
            touch_app
          </span>
          {vi
            ? 'Card "Thiếu Sót" có thể nhấn để xem chi tiết'
            : 'Click "Deficiencies" card for per-student details'}
        </span>
      </div>

      {/* ── Biểu đồ 2 cột ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 1. Xu hướng đánh giá theo tháng — LUÔN HIỆN BIỂU ĐỒ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="font-bold text-primary font-headline">
                {vi ? "Xu Hướng Đánh Giá KN" : "Assessment Trend"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {vi
                  ? "6 tháng gần nhất · tự cập nhật"
                  : "Last 6 months · auto-refresh"}
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              {vi ? "Thật Từ DB" : "Live DB"}
            </span>
          </div>

          {/* Luôn hiển thị chart — nếu chưa có data, cột cao 0 nhưng vẫn hiện trục */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={trendData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="total"
                  name={vi ? "Đánh Giá" : "Assessments"}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                >
                  {trendData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        idx === trendData.length - 1 ? "#1a7f64" : "#b7dfcf"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Overlay khi chưa có data — hiện nhẹ nhàng phía trên chart */}
            {!hasAnyTrendData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-white/90 rounded-xl px-4 py-2 text-center border border-slate-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-400">
                    {vi ? "Chưa có đánh giá nào" : "No assessments yet"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {vi
                      ? "Giáo viên thực hiện đánh giá → cột sẽ tự hiện"
                      : "Submit assessments → bars will appear"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Tình Trạng Sức Khoẻ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="font-bold text-primary font-headline">
              {vi ? "Tình Trạng Sức Khoẻ" : "Health Status"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {vi
                ? "Phân bố cân nặng: Bình thường · Thiếu cân · Thừa cân"
                : "Weight distribution: Normal · Under · Overweight"}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Donut Pie */}
            <div className="shrink-0 relative">
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie
                    data={healthPieDisplay}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={totalHealth > 0 ? 4 : 0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {healthPieDisplay.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip vi={vi} />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Label ở giữa */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-on-surface">
                  {totalHealth > 0 ? `${normalPct}%` : "—"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {vi ? "BT" : "Normal"}
                </span>
              </div>
            </div>

            {/* Chi tiết từng loại */}
            <div className="flex-1 space-y-2.5 w-full">
              {[
                {
                  label: vi ? "Bình Thường" : "Normal",
                  count: normalCount,
                  pct: normalPct,
                  color: HEALTH_COLORS.normal,
                  icon: "check_circle",
                  desc: vi
                    ? "BMI: 14–17.9 — Đạt chuẩn"
                    : "BMI: 14–17.9 — Within range",
                },
                {
                  label: vi ? "Thiếu Cân" : "Underweight",
                  count: underCount,
                  pct: underPct,
                  color: HEALTH_COLORS.under,
                  icon: "trending_down",
                  desc: vi
                    ? "BMI < 14 — Cần bổ sung dinh dưỡng"
                    : "BMI < 14 — Needs nutrition",
                },
                {
                  label: vi ? "Thừa Cân" : "Overweight",
                  count: overCount,
                  pct: overPct,
                  color: HEALTH_COLORS.over,
                  icon: "warning",
                  desc: vi
                    ? "BMI ≥ 18 — Cần điều chỉnh chế độ ăn"
                    : "BMI ≥ 18 — Diet adjustment",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: item.color + "18" }}
                >
                  <span
                    className="material-symbols-outlined text-[20px] flex-shrink-0"
                    style={{
                      color: item.color,
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm font-bold"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-xl font-black font-headline"
                        style={{ color: item.color }}
                      >
                        {item.count}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                    <div className="h-1 bg-slate-200/60 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                          transition: "width 0.7s ease",
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.pct}% {vi ? "tổng số" : "of total"}
                    </p>
                  </div>
                </div>
              ))}
              {totalHealth === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  {vi
                    ? "Chưa có bản ghi sức khoẻ. Giáo viên cần nhập cân nặng học sinh."
                    : "No health records yet. Teachers need to submit vitals."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Performance */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-bold text-primary font-headline">
              {vi ? "Hiệu Suất Giáo Viên" : "Teacher Performance"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {vi
                ? "Số đánh giá kỹ năng thực hiện bởi từng giáo viên"
                : "Skill assessments conducted per teacher"}
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            Top {teachers.length}
          </span>
        </div>
        {teachers.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            <span className="material-symbols-outlined text-4xl">
              assignment
            </span>
            <p className="font-semibold text-sm">
              {vi ? "Chưa có đánh giá nào" : "No assessments yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Bar chart ngang */}
            <div className="flex-1">
              <ResponsiveContainer
                width="100%"
                height={Math.max(160, teachers.length * 44)}
              >
                <BarChart
                  data={teacherBarData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="total"
                    name={vi ? "Đánh Giá KN" : "Assessments"}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  >
                    {teacherBarData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          [
                            "#1a7f64",
                            "#0969da",
                            "#9a6700",
                            "#8250df",
                            "#cf222e",
                          ][idx] || "#64748b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Danh sách chi tiết */}
            <div className="lg:w-72 space-y-2">
              {teachers.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}
                    style={{
                      background:
                        ["#1a7f64", "#0969da", "#9a6700", "#8250df", "#cf222e"][
                          i
                        ] || "#64748b",
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{t.spec}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary font-headline">
                      {t.assessments}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {vi ? "đánh giá" : "assess."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
