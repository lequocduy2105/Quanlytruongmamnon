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

// Custom Tooltips
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
        {vi ? "So tre" : "Count"}: <strong>{item.value}</strong>
      </p>
      <p>
        {vi ? "Ty le" : "Ratio"}: <strong>{item.payload.pct}%</strong>
      </p>
    </div>
  );
};

const HEALTH_COLORS = {
  normal: "#2da44e",
  under: "#f79518",
  over: "#e5534b",
};

function Stars({ rating, max = 5 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[16px]"
          style={{
            color: i < Math.round(rating) ? "#f59e0b" : "#e2e8f0",
            fontVariationSettings: "'FILL' 1",
          }}
        >
          star
        </span>
      ))}
    </span>
  );
}

// Modal: Thieu sot can xu ly
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
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{ background: "linear-gradient(135deg, #fff1f0 0%, #fff 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface font-headline text-lg">
                {vi ? "Hoc Sinh Can Xu Ly" : "Students Needing Attention"}
              </h3>
              <p className="text-xs text-slate-500">
                {items.length} {vi ? "truong hop phat trien bat thuong" : "cases of abnormal development"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-xl">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-5xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="font-semibold">{vi ? "Khong co truong hop nao can xu ly!" : "No cases need attention!"}</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="rounded-xl border border-error-container/40 bg-error-container/10 p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-error shrink-0 flex items-center justify-center font-black text-white text-sm font-headline">
                  {(item.studentName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-on-surface">{item.studentName}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{vi ? "Lop" : "Class"}: {item.className}</span>
                    <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">GV: {item.teacherName}</span>
                  </div>
                  <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2 mt-2">
                    <p className="text-[11px] font-bold text-error uppercase tracking-wide mb-1">{vi ? "Noi dung thieu sot:" : "Deficiency noted:"}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.deficiencyLog}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[
                      { k: vi ? "Nhan thuc" : "Cognitive", v: item.cognitiveScore },
                      { k: vi ? "Xa hoi" : "Social", v: item.socialScore },
                      { k: vi ? "Van dong" : "Motor", v: item.motorScore },
                      { k: vi ? "Cam xuc" : "Emotional", v: item.emotionalScore },
                    ].map((s, j) => (
                      <div key={j} className="text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.k}</p>
                        <p className="text-base font-black font-headline" style={{ color: Number(s.v) < 5 ? "#e5534b" : Number(s.v) < 7 ? "#f79518" : "#2da44e" }}>
                          {Number(s.v).toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">{vi ? "Ghi nhan:" : "Recorded:"} {new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-bold text-slate-600 transition-colors">
            {vi ? "Dong" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Danh gia phu huynh
function FeedbackModal({ open, onClose, feedbacks, vi }) {
  if (!open) return null;
  const avg =
    feedbacks.length > 0
      ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

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
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
          style={{ background: "linear-gradient(135deg, #fefce8 0%, #fff 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface font-headline text-lg">
                {vi ? "Danh Gia Phu Huynh" : "Parent Ratings"}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars rating={Number(avg)} />
                <span className="text-sm font-bold text-amber-600">{avg} / 5</span>
                <span className="text-xs text-slate-400">({feedbacks.length} {vi ? "danh gia" : "reviews"})</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-xl">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {feedbacks.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>star_border</span>
              <p className="font-semibold">{vi ? "Chua co danh gia nao" : "No ratings yet"}</p>
              <p className="text-xs text-center">{vi ? "Phu huynh danh gia giao vien qua trang Phu Huynh Portal." : "Parents rate teachers via the Parent Portal."}</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {fb.teacherName && (
                          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            GV: {fb.teacherName}
                          </span>
                        )}
                        {fb.studentName && (
                          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            HS: {fb.studentName}
                          </span>
                        )}
                      </div>
                      <Stars rating={fb.rating} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-amber-500 font-headline">{fb.rating.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">{new Date(fb.submittedAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                {fb.comment && (
                  <p className="mt-3 text-sm text-slate-600 italic bg-slate-50 rounded-lg px-3 py-2 border-l-2 border-amber-300">
                    &ldquo;{fb.comment}&rdquo;
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-bold text-slate-600 transition-colors">
            {vi ? "Dong" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function SystemReports() {
  const { lang } = useLang();
  const vi = lang === "vi";

  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [deficiencyDetails, setDeficiencyDetails] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deficiencyModalOpen, setDeficiencyModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [trendMode, setTrendMode] = useState("month");

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [dashRes, teachersRes, assessmentsRes, deficiencyRes, feedbacksRes] =
          await Promise.all([
            api.get("/admin/dashboard"),
            api.get("/academic/teachers"),
            api.get("/academic/assessments"),
            api.get("/admin/deficiencies").catch(() => ({ data: [] })),
            api.get("/admin/feedbacks").catch(() => ({ data: [] })),
          ]);

        const dashData = dashRes.data || {};
        setStats(dashData);
        setAssessments(assessmentsRes.data || []);
        setDeficiencyDetails(deficiencyRes.data || []);
        setFeedbacks(feedbacksRes.data || []);

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
            ? "Khong the tai du lieu. Kiem tra backend dang chay."
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

  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined text-5xl animate-pulse">analytics</span>
          <p className="font-semibold">{vi ? "Dang tai bao cao..." : "Loading reports..."}</p>
        </div>
      </div>
    );

  if (error || !stats)
    return (
      <div className="p-8 bg-error-container/20 rounded-2xl border border-error-container text-error space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <p className="font-bold">{error || (vi ? "Khong the tai du lieu." : "Failed to load data.")}</p>
        </div>
        <div className="text-sm text-error/80 bg-white/50 rounded-xl p-4 font-mono space-y-1">
          <p><strong>{vi ? "Nguyen nhan thuong gap:" : "Common causes:"}</strong></p>
          <p>&bull; {vi ? "api-gateway chua chay (port 3000)" : "api-gateway not running (port 3000)"}</p>
          <p>&bull; {vi ? "health-service chua chay (port 3002)" : "health-service not running (port 3002)"}</p>
          <p>&bull; {vi ? "academic-service chua chay (port 3001)" : "academic-service not running (port 3001)"}</p>
        </div>
        <button onClick={() => fetchAll()} className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-xl text-sm font-bold hover:opacity-90">
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          {vi ? "Thu Lai" : "Retry"}
        </button>
      </div>
    );

  // Health data
  const healthStats = stats.healthStats || {};
  const normalCount = healthStats.normal || 0;
  const underCount = healthStats.under || 0;
  const overCount = healthStats.over || 0;
  const totalHealth = healthStats.total || (normalCount + underCount + overCount);
  const normalPct = totalHealth > 0 ? Math.round((normalCount / totalHealth) * 100) : 0;
  const underPct = totalHealth > 0 ? Math.round((underCount / totalHealth) * 100) : 0;
  const overPct = totalHealth > 0 ? Math.round((overCount / totalHealth) * 100) : 0;

  const healthPieData = [
    { name: vi ? "Binh Thuong" : "Normal", value: normalCount, fill: HEALTH_COLORS.normal, pct: normalPct },
    { name: vi ? "Thieu Can" : "Underweight", value: underCount, fill: HEALTH_COLORS.under, pct: underPct },
    { name: vi ? "Thua Can" : "Overweight", value: overCount, fill: HEALTH_COLORS.over, pct: overPct },
  ];
  const healthPieFiltered = healthPieData.filter((d) => d.value > 0);
  const healthPieDisplay =
    healthPieFiltered.length > 0
      ? healthPieFiltered
      : [{ name: vi ? "Chua co du lieu" : "No data", value: 1, fill: "#e2e8f0", pct: 0 }];

  // Trend chart
  let trendData = [];
  if (trendMode === "month") {
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
      const raw = a.created_at || a.createdAt || a.date || a.logged_at;
      if (!raw) return;
      const k = typeof raw === "string" ? raw.slice(0, 7) : new Date(raw).toISOString().slice(0, 7);
      byMonth[k] = (byMonth[k] || 0) + 1;
    });
    trendData = monthSlots.map((m) => ({ label: m.label, total: byMonth[m.key] || 0 }));
  } else {
    const daySlots = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return { key, label: `${d.getDate()}/${d.getMonth() + 1}` };
    });
    const byDay = {};
    assessments.forEach((a) => {
      const raw = a.created_at || a.createdAt || a.date || a.logged_at;
      if (!raw) return;
      const k = typeof raw === "string" ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
      byDay[k] = (byDay[k] || 0) + 1;
    });
    trendData = daySlots.map((d) => ({ label: d.label, total: byDay[d.key] || 0 }));
  }
  const hasAnyTrendData = trendData.some((d) => d.total > 0);

  const teacherBarData = teachers.map((t) => ({
    name: t.name.split(" ").slice(-2).join(" "),
    fullName: t.name,
    total: t.assessments,
  }));

  const ratingAvg =
    feedbacks.length > 0
      ? Math.round((feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length) * 10) / 10
      : stats.rating || 0;
  const ratingCount = feedbacks.length || stats.ratingCount || 0;

  const defCount = stats.deficiencies || 0;

  const CARDS = [
    {
      title: vi ? "Danh Gia Phu Huynh" : "Parent Rating",
      icon: "star",
      iconColor: "text-tertiary",
      color: "bg-tertiary-fixed/60 border-tertiary-fixed-dim/30",
      value: ratingAvg > 0 ? `${ratingAvg} \u2605` : "N/A",
      sub:
        ratingAvg > 0
          ? vi
            ? `Trung binh tu ${ratingCount} danh gia`
            : `Avg from ${ratingCount} reviews`
          : vi
          ? "Chua co danh gia"
          : "No ratings yet",
      badge: !ratingAvg
        ? { l: vi ? "Chua co" : "No data", c: "bg-slate-100 text-slate-500" }
        : ratingAvg >= 4
        ? { l: vi ? "\u2713 Rat Tot" : "\u2713 Excellent", c: "bg-secondary-container text-secondary" }
        : ratingAvg >= 3
        ? { l: vi ? "~ Trung Binh" : "~ Average", c: "bg-tertiary-fixed text-tertiary" }
        : { l: vi ? "\u26a0 Can Cai Thien" : "\u26a0 Needs Work", c: "bg-error-container text-error" },
      progress: ratingAvg > 0 ? Math.round((ratingAvg / 5) * 100) : 0,
      progressColor: "bg-tertiary",
      detail: vi ? "Thang diem: 1-5 sao" : "Scale: 1-5 stars",
      tooltip: vi ? "Nhan de xem chi tiet danh gia phu huynh." : "Click to view parent feedback details.",
      clickable: true,
      onClick: () => setFeedbackModalOpen(true),
    },
    {
      title: vi ? "Suc Khoe Toan Truong" : "School Health",
      icon: "monitor_heart",
      iconColor: "text-secondary",
      color: "bg-secondary-container/20 border-secondary-container/50",
      value: totalHealth > 0 ? `${normalPct}%` : "N/A",
      sub:
        totalHealth > 0
          ? vi
            ? `${normalCount}/${totalHealth} tre can nang binh thuong`
            : `${normalCount}/${totalHealth} normal weight`
          : vi
          ? "Chua co ban ghi suc khoe"
          : "No health records yet",
      badge:
        totalHealth === 0
          ? { l: vi ? "Chua co du lieu" : "No data", c: "bg-slate-100 text-slate-500" }
          : normalPct >= 80
          ? { l: vi ? "\u2713 Tot" : "\u2713 Good", c: "bg-secondary-container text-secondary" }
          : normalPct >= 60
          ? { l: vi ? "~ Chu Y" : "~ Watch", c: "bg-tertiary-fixed text-tertiary" }
          : { l: vi ? "\u26a0 Hanh Dong" : "\u26a0 Act", c: "bg-error-container text-error" },
      progress: normalPct,
      progressColor: normalPct >= 80 ? "bg-secondary" : normalPct >= 60 ? "bg-tertiary" : "bg-error",
      detail: vi
        ? `Thieu can: ${underCount} \u00b7 Thua can: ${overCount}`
        : `Under: ${underCount} \u00b7 Over: ${overCount}`,
      tooltip: vi
        ? "Ty le can nang binh thuong. >=80% Tot - 60-79% Chu y - <60% Can thiep"
        : "Normal weight ratio. >=80% Good - 60-79% Watch - <60% Act",
      clickable: false,
    },
    {
      title: vi ? "Danh Gia Ky Nang" : "Skill Assessments",
      icon: "assignment",
      iconColor: "text-primary",
      color: "bg-primary/5 border-primary/20",
      value: `${stats.assessments || 0}`,
      sub: vi
        ? `Tren tong ${stats.students || 0} hoc sinh`
        : `Out of ${stats.students || 0} students`,
      badge: { l: vi ? "i Tong Cong" : "i Total", c: "bg-primary/10 text-primary" },
      progress: Math.min(
        100,
        Math.round(
          ((stats.assessments || 0) / Math.max(1, stats.students || 1)) * 100
        )
      ),
      progressColor: "bg-primary",
      detail: vi ? "Nhan thuc - Xa hoi - Van dong" : "Cognitive - Social - Motor",
      tooltip: vi ? "So danh gia ky nang da thuc hien." : "Total skill assessments.",
      clickable: false,
    },
    {
      title: vi ? "Thieu Sot Can Xu Ly" : "Open Deficiencies",
      icon: "warning",
      iconColor: "text-error",
      color: "bg-error-container/30 border-error-container/50",
      value: `${defCount}`,
      sub: vi ? "Nhan de xem danh sach hoc sinh cu the" : "Click to see specific students",
      badge: !defCount
        ? { l: vi ? "\u2713 Khong Co" : "\u2713 Clear", c: "bg-secondary-container text-secondary" }
        : defCount <= 3
        ? { l: vi ? "~ Xem Xet" : "~ Review", c: "bg-tertiary-fixed text-tertiary" }
        : { l: vi ? "\u26a0 Nghiem Trong" : "\u26a0 Critical", c: "bg-error-container text-error" },
      progress: Math.min(
        100,
        Math.round((defCount / Math.max(1, stats.students || 1)) * 100)
      ),
      progressColor: "bg-error",
      detail: vi ? "Nhan de xem chi tiet tung em" : "Click for per-student details",
      tooltip: vi
        ? "0 = Tot - 1-3 = Xem xet - >3 = Nghiem trong. Nhan de xem danh sach."
        : "0 = Clear - 1-3 = Review - >3 = Critical. Click to view student list.",
      clickable: true,
      onClick: () => setDeficiencyModalOpen(true),
    },
  ];

  return (
    <>
      <DeficiencyModal
        open={deficiencyModalOpen}
        onClose={() => setDeficiencyModalOpen(false)}
        items={deficiencyDetails}
        vi={vi}
      />
      <FeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        feedbacks={feedbacks}
        vi={vi}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <p className="text-secondary font-bold text-xs uppercase tracking-widest mb-1">
            {vi ? "Phan Tich & Giam Sat" : "Analytics & Monitoring"}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Bao Cao He Thong" : "System Reports"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? "KPI toan truong - suc khoe, dao tao va phan hoi phu huynh."
              : "School-wide KPIs - health, education & parent feedback."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-full">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                refreshing ? "bg-tertiary animate-ping" : "bg-secondary animate-pulse"
              }`}
            />
            <span>
              {refreshing
                ? vi
                  ? "Dang cap nhat..."
                  : "Refreshing..."
                : lastUpdated
                ? vi
                  ? `Cap nhat: ${lastUpdated.toLocaleTimeString("vi-VN")}`
                  : `Updated: ${lastUpdated.toLocaleTimeString()}`
                : ""}
            </span>
            <button
              onClick={() => fetchAll(true)}
              className="text-primary hover:opacity-70 transition-opacity"
              title={vi ? "Lam moi ngay" : "Refresh now"}
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">download</span>
            {vi ? "Xuat PDF" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${card.color} relative group ${
              card.clickable
                ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                : ""
            }`}
            onClick={card.clickable ? card.onClick : undefined}
          >
            {card.clickable && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                {vi ? "Xem Chi Tiet" : "View Details"}
              </div>
            )}
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
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${card.badge.c}`}>
              {card.badge.l}
            </span>
            <p className="text-4xl font-black text-on-surface font-headline mb-1">{card.value}</p>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">{card.sub}</p>
            <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-700 ${card.progressColor}`}
                style={{ width: `${card.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-10 px-1">
        <p className="text-xs text-slate-400 font-semibold self-center">
          {vi ? "Chu thich:" : "Legend:"}
        </p>
        {[
          { c: "bg-secondary-container text-secondary", l: vi ? "\u2713 Tot / Dat" : "\u2713 Good" },
          { c: "bg-tertiary-fixed text-tertiary", l: vi ? "~ Can Chu Y" : "~ Watch" },
          { c: "bg-error-container text-error", l: vi ? "\u26a0 Can Xu Ly" : "\u26a0 Action" },
        ].map((b, i) => (
          <span key={i} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.c}`}>
            {b.l}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1 italic">
          <span className="material-symbols-outlined text-[13px]">touch_app</span>
          {vi
            ? 'Card "Danh Gia PH" & "Thieu Sot" co the nhan de xem chi tiet'
            : 'Click "Parent Rating" & "Deficiencies" cards for details'}
        </span>
      </div>

      {/* Charts 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 1. Assessment Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-primary font-headline">
                {vi ? "Xu Huong Danh Gia KN" : "Assessment Trend"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {trendMode === "month"
                  ? vi
                    ? "6 thang gan nhat - tu cap nhat"
                    : "Last 6 months - auto-refresh"
                  : vi
                  ? "14 ngay gan nhat - tu cap nhat"
                  : "Last 14 days - auto-refresh"}
              </p>
            </div>
            {/* Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
              {["month", "day"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTrendMode(mode)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    trendMode === mode
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode === "month"
                    ? vi
                      ? "Thang"
                      : "Month"
                    : vi
                    ? "Ngay"
                    : "Day"}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
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
                  name={vi ? "Danh Gia" : "Assessments"}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                >
                  {trendData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={idx === trendData.length - 1 ? "#1a7f64" : "#b7dfcf"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {!hasAnyTrendData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-white/90 rounded-xl px-4 py-2 text-center border border-slate-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-400">
                    {vi ? "Chua co danh gia nao" : "No assessments yet"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {vi
                      ? "Giao vien thuc hien danh gia - cot se tu hien"
                      : "Submit assessments - bars will appear"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Health status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="font-bold text-primary font-headline">
              {vi ? "Tinh Trang Suc Khoe" : "Health Status"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {vi
                ? "Phan bo can nang: Binh thuong - Thieu can - Thua can"
                : "Weight distribution: Normal - Under - Overweight"}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-on-surface">
                  {totalHealth > 0 ? `${normalPct}%` : "\u2014"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {vi ? "BT" : "Normal"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 w-full">
              {[
                {
                  label: vi ? "Binh Thuong" : "Normal",
                  count: normalCount,
                  pct: normalPct,
                  color: HEALTH_COLORS.normal,
                  icon: "check_circle",
                  desc: vi ? "BMI: 14.5-17.4 - Dat chuan" : "BMI: 14.5-17.4 - Within range",
                },
                {
                  label: vi ? "Thieu Can" : "Underweight",
                  count: underCount,
                  pct: underPct,
                  color: HEALTH_COLORS.under,
                  icon: "trending_down",
                  desc: vi ? "BMI < 14.5 - Can bo sung dinh duong" : "BMI < 14.5 - Needs nutrition",
                },
                {
                  label: vi ? "Thua Can" : "Overweight",
                  count: overCount,
                  pct: overPct,
                  color: HEALTH_COLORS.over,
                  icon: "warning",
                  desc: vi ? "BMI >= 17.5 - Can dieu chinh che do an" : "BMI >= 17.5 - Diet adjustment",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: item.color + "18" }}
                >
                  <span
                    className="material-symbols-outlined text-[20px] shrink-0"
                    style={{ color: item.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold" style={{ color: item.color }}>
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
                      {item.pct}% {vi ? "tong so" : "of total"}
                    </p>
                  </div>
                </div>
              ))}
              {totalHealth === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  {vi
                    ? "Chua co ban ghi suc khoe. Giao vien can nhap can nang hoc sinh."
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
              {vi ? "Hieu Suat Giao Vien" : "Teacher Performance"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {vi
                ? "So danh gia ky nang thuc hien boi tung giao vien"
                : "Skill assessments conducted per teacher"}
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            Top {teachers.length}
          </span>
        </div>
        {teachers.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            <span className="material-symbols-outlined text-4xl">assignment</span>
            <p className="font-semibold text-sm">{vi ? "Chua co danh gia nao" : "No assessments yet"}</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={Math.max(160, teachers.length * 44)}>
                <BarChart
                  data={teacherBarData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
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
                    name={vi ? "Danh Gia KN" : "Assessments"}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  >
                    {teacherBarData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          ["#1a7f64", "#0969da", "#9a6700", "#8250df", "#cf222e"][idx] || "#64748b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:w-72 space-y-2">
              {teachers.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                    style={{
                      background:
                        ["#1a7f64", "#0969da", "#9a6700", "#8250df", "#cf222e"][i] || "#64748b",
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.spec}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary font-headline">{t.assessments}</p>
                    <p className="text-[10px] text-slate-400">{vi ? "danh gia" : "assess."}</p>
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
