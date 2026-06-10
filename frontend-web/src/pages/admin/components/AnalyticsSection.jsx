import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useLang } from "../../../contexts/LangContext";

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, vi }) => {
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
      <p style={{ fontWeight: 700, marginBottom: 2 }}>{label}</p>
      <p style={{ color: "#7dd3fc" }}>
        {payload[0].value} {vi ? "đánh giá" : "assessments"}
      </p>
    </div>
  );
};

export default function AnalyticsSection({ stats, assessments = [] }) {
  const { t, lang } = useLang();
  const vi = lang === "vi";

  // Toggle: 'month' | 'day'
  const [viewMode, setViewMode] = useState("month");

  // ── Sức khoẻ ──────────────────────────────────────────────────────────────
  const rawHealth = stats?.healthStats || {
    normal: 0,
    under: 0,
    over: 0,
    normalPercentage: 0,
  };
  const totalH =
    (rawHealth.normal || 0) + (rawHealth.under || 0) + (rawHealth.over || 0);
  const normalPct =
    totalH > 0
      ? Math.round((rawHealth.normal / totalH) * 100)
      : rawHealth.normalPercentage || 0;
  const health = { ...rawHealth, normalPercentage: normalPct };
  const totalSafe = Math.max(totalH, 1);

  // ── Helper: parse ngày từ assessment ─────────────────────────────────────
  const parseDate = (a) => {
    const raw = a.created_at || a.createdAt || a.date || a.logged_at;
    if (!raw) return null;
    return new Date(raw);
  };

  // ── Dữ liệu THEO THÁNG (6 tháng gần nhất) ────────────────────────────────
  const monthSlots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: vi ? `T${d.getMonth() + 1}` : `M${d.getMonth() + 1}`,
    };
  });
  const byMonth = {};
  assessments.forEach((a) => {
    const d = parseDate(a);
    if (!d) return;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[k] = (byMonth[k] || 0) + 1;
  });
  const trendMonth = monthSlots.map((m) => ({
    label: m.label,
    total: byMonth[m.key] || 0,
  }));

  // ── Dữ liệu THEO NGÀY (30 ngày gần nhất) ─────────────────────────────────
  const daySlots = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      key: d.toISOString().slice(0, 10), // YYYY-MM-DD
      label: `${d.getDate()}/${d.getMonth() + 1}`, // DD/MM
      isToday: i === 29,
    };
  });
  const byDay = {};
  assessments.forEach((a) => {
    const d = parseDate(a);
    if (!d) return;
    const k = d.toISOString().slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  });
  // Chỉ hiện các ngày có data + 7 ngày gần nhất để không quá dày
  const recentDaySlots = daySlots.slice(-14); // 14 ngày gần nhất
  const trendDay = recentDaySlots.map((d) => ({
    label: d.label,
    total: byDay[d.key] || 0,
    isToday: d.isToday,
  }));

  const trendData = viewMode === "month" ? trendMonth : trendDay;
  const hasAnyData = trendData.some((d) => d.total > 0);
  const totalVisible = trendData.reduce((s, d) => s + d.total, 0);

  const PERIOD_OPTS = [
    { id: "month", label: vi ? "6 Tháng" : "6 Months" },
    { id: "day", label: vi ? "14 Ngày" : "14 Days" },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      {/* ── Biểu đồ xu hướng đánh giá KỸ NĂNG ─────────────────────────────── */}
      <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-slate-900 border border-transparent dark:border-slate-800/50 p-8 rounded-4xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-3 flex-wrap">
          <div>
            <h3 className="text-xl font-bold text-cyan-900 dark:text-cyan-100 font-headline">
              {vi ? "Xu Hướng Đánh Giá Kỹ Năng" : "Skill Assessment Trend"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {hasAnyData
                ? `${vi ? "Tổng" : "Total"}: ${totalVisible} ${vi ? "đánh giá" : "assessments"}`
                : vi
                  ? "Chưa có đánh giá nào — giáo viên hãy thực hiện đánh giá kỹ năng"
                  : "No assessments yet"}
            </p>
          </div>

          {/* Toggle Tháng / Ngày */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {PERIOD_OPTS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === opt.id
                    ? "bg-white dark:bg-slate-900 text-cyan-800 dark:text-cyan-400 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart — Recharts BarChart */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={trendData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/80"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{
                  fontSize: viewMode === "day" ? 10 : 11,
                  fill: "#94a3b8",
                  fontWeight: 600,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip vi={vi} />}
                cursor={{ fill: "currentColor", className: "text-slate-100/50 dark:text-slate-800/30" }}
              />
              <Bar
                dataKey="total"
                name={vi ? "Đánh Giá" : "Assessments"}
                radius={[6, 6, 0, 0]}
                maxBarSize={viewMode === "day" ? 28 : 44}
              >
                {trendData.map((entry, idx) => {
                  const isLast = idx === trendData.length - 1;
                  const hasVal = entry.total > 0;
                  return (
                    <Cell
                      key={idx}
                      fill={
                        hasVal
                          ? isLast || entry.isToday
                            ? "#0e7490"
                            : "#67c2d5"
                          : "#e2e8f0"
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Overlay khi chưa có data */}
          {!hasAnyData && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-400">
                  {vi
                    ? "📋 Chưa có đánh giá kỹ năng nào"
                    : "📋 No skill assessments yet"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {vi
                    ? 'Giáo viên vào "Học Thuật" → thực hiện đánh giá → cột sẽ tự hiện'
                    : 'Teachers go to "Assessments" → submit → bars will appear'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chú thích */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-cyan-600" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {vi
              ? `Số đánh giá kỹ năng ${viewMode === "month" ? "mỗi tháng" : "theo từng ngày"}`
              : `Skill assessments ${viewMode === "month" ? "per month" : "per day"}`}
          </span>
          {hasAnyData && (
            <span className="ml-auto text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-full border border-transparent dark:border-cyan-800/30">
              {vi ? "Dữ liệu thật" : "Live data"}
            </span>
          )}
        </div>
      </div>

      {/* ── Biểu đồ tình trạng sức khoẻ ────────────────────────────────────── */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-transparent dark:border-slate-800/50 p-8 rounded-4xl flex flex-col">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-cyan-900 dark:text-cyan-100 font-headline">
            {t("dash_healthStatus")}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t("dash_bmi")}</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="relative w-48 h-48">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
            >
              <circle
                cx="18"
                cy="18"
                fill="transparent"
                r="16"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3"
              ></circle>
              <circle
                cx="18"
                cy="18"
                fill="transparent"
                r="16"
                stroke="#186d2d"
                strokeDasharray={`${health.normalPercentage}, 100`}
                strokeWidth="3"
              ></circle>
              <circle
                cx="18"
                cy="18"
                fill="transparent"
                r="16"
                stroke="#ffdcc5"
                strokeDasharray={`${Math.round((health.under / totalSafe) * 100)}, 100`}
                strokeDashoffset={`-${health.normalPercentage}`}
                strokeWidth="3"
              ></circle>
              <circle
                cx="18"
                cy="18"
                fill="transparent"
                r="16"
                stroke="#ba1a1a"
                strokeDasharray={`${Math.round((health.over / totalSafe) * 100)}, 100`}
                strokeDashoffset={`-${Math.min(health.normalPercentage + Math.round((health.under / totalSafe) * 100), 100)}`}
                strokeWidth="3"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-cyan-900 dark:text-cyan-100">
                {health.normalPercentage}%
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                {t("dash_normal")}
              </span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 w-full">
            <div className="text-center">
              <div className="w-2 h-2 rounded-full bg-secondary mx-auto mb-2"></div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                {t("dash_normal")}
              </p>
              <p className="text-sm font-bold text-cyan-900 dark:text-cyan-100">{health.normal}</p>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim mx-auto mb-2"></div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                {t("dash_under")}
              </p>
              <p className="text-sm font-bold text-cyan-900 dark:text-cyan-100">{health.under}</p>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 rounded-full bg-error mx-auto mb-2"></div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                {t("dash_over")}
              </p>
              <p className="text-sm font-bold text-cyan-900 dark:text-cyan-100">{health.over}</p>
            </div>
          </div>

          {totalH === 0 && (
            <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
              {vi
                ? "Chưa có bản ghi sức khoẻ.\nGiáo viên cần nhập cân nặng học sinh."
                : "No health records yet.\nTeachers need to submit vitals."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
