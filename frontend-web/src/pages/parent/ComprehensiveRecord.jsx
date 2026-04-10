import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";

export default function ComprehensiveRecord() {
  const { lang } = useLang();
  const vi = lang === "vi";

  const [data, setData] = useState({
    student: null,
    assessments: [],
    vitals: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedNote, setExpandedNote] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const childrenRes = await api.get("/parent/my-children");
        const children = childrenRes.data || [];
        if (children.length === 0) {
          setLoading(false);
          return;
        }
        const studentId = children[0].id;
        const [recordsRes, vitalsRes] = await Promise.all([
          api.get(`/parent/student/${studentId}/records`),
          api.get(`/health/vitals?studentId=${studentId}`),
        ]);
        setData({
          student: recordsRes.data?.student || null,
          assessments: recordsRes.data?.assessments || [],
          vitals: vitalsRes.data || [],
        });
      } catch (e) {
        console.error("Failed to load record", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
        <span className="material-symbols-outlined animate-pulse text-4xl">
          person
        </span>
        <p>{vi ? "Đang tải hồ sơ..." : "Loading record..."}</p>
      </div>
    );

  const { student, assessments, vitals } = data;
  if (!student)
    return (
      <div className="p-8 text-slate-500 text-center">
        {vi
          ? "Không tìm thấy dữ liệu học sinh."
          : "Student data not found or unauthorized."}
      </div>
    );

  const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : null;

  const chartData = vitals.map((v) => ({
    name: new Date(v.logged_at).toLocaleDateString(vi ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
    }),
    bmi: Number(v.bmi_value),
    baseline: 15.0,
  }));
  const finalChartData =
    chartData.length > 0 ? chartData : [{ name: "—", bmi: 0, baseline: 15.0 }];

  // Phân loại BMI
  const bmi = Number(latestVital?.bmi_value);
  const bmiStatus = !bmi
    ? null
    : bmi < 14
      ? {
          label: vi ? "Thiếu Cân" : "Underweight",
          color: "text-[#f79518]",
          bg: "bg-[#f79518]/10",
        }
      : bmi >= 18
        ? {
            label: vi ? "Thừa Cân" : "Overweight",
            color: "text-[#e5534b]",
            bg: "bg-[#e5534b]/10",
          }
        : {
            label: vi ? "Bình Thường" : "Normal",
            color: "text-[#2da44e]",
            bg: "bg-[#2da44e]/10",
          };

  const deficiencyList = assessments.filter((a) => a.deficiency_log);

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/parent/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-primary mb-4"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {vi ? "Quay Lại Dashboard" : "Back to Dashboard"}
        </Link>
        <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
          {vi ? "Hồ Sơ Toàn Diện" : "Comprehensive Record"} —{" "}
          {student.full_name}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {vi ? "Lớp" : "Class"}:{" "}
          {student.classroom?.class_name ||
            (vi ? "Chưa phân lớp" : "Unassigned")}
          {student.allergy_tags?.length > 0 && (
            <span className="ml-2 text-error font-bold">
              ⚠ {vi ? "Dị ứng" : "Allergies"}: {student.allergy_tags.join(", ")}
            </span>
          )}
        </p>
      </div>

      {/* ── Chỉ Số Sức Khoẻ (3 cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          {
            icon: "monitor_weight",
            label: vi ? "Cân Nặng" : "Weight",
            value: latestVital?.weight || "--",
            unit: "kg",
            bg: "bg-cyan-50 text-primary",
          },
          {
            icon: "straighten",
            label: vi ? "Chiều Cao" : "Height",
            value: latestVital?.height || "--",
            unit: "cm",
            bg: "bg-green-50 text-secondary",
          },
          {
            icon: "favorite",
            label: vi ? "Nhịp Tim" : "Heart Rate",
            value: latestVital?.heart_rate || "--",
            unit: "bpm",
            bg: "bg-purple-50 text-tertiary",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {item.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-primary font-headline">
                {item.value}
              </span>
              <span className="text-base font-bold text-slate-400">
                {item.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* BMI status badge */}
      {bmiStatus && (
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${bmiStatus.bg} ${bmiStatus.color}`}
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            monitor_heart
          </span>
          {vi ? "Tình Trạng BMI:" : "BMI Status:"} {bmiStatus.label} (
          {bmi.toFixed(1)})
        </div>
      )}

      {/* ── BMI Chart ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-extrabold text-primary font-headline">
              {vi ? "Biểu Đồ BMI" : "BMI Development Chart"}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {vi
                ? "Phát triển theo thời gian · So sánh chuẩn WHO"
                : "Development over time · WHO standard comparison"}
            </p>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-1.5 bg-primary rounded-sm inline-block" />
              {vi ? "BMI Trẻ" : "Child's BMI"}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-1.5 bg-slate-300 rounded-sm inline-block border-dashed" />
              {vi ? "Chuẩn WHO" : "WHO Baseline"}
            </span>
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={finalChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004e63" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#004e63" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
                name={vi ? "Chuẩn WHO" : "WHO"}
              />
              <Area
                type="monotone"
                dataKey="bmi"
                stroke="#004e63"
                strokeWidth={3}
                fill="url(#bmiGrad)"
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="BMI"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Cảnh Báo / Ghi Chú Từ Giáo Viên ── */}
      {deficiencyList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-amber-800 font-headline flex items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined text-amber-600 text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            {vi ? "Ghi Chú Quan Sát Từ Giáo Viên" : "Teacher Observation Notes"}
          </h3>
          <p className="text-xs text-amber-600 mb-4">
            {vi
              ? "Giáo viên đã ghi lại những điểm cần chú ý trong quá trình đánh giá kỹ năng"
              : "Teacher recorded points of attention during skill assessments"}
          </p>
          <div className="space-y-3">
            {deficiencyList.map((a, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                        {vi ? "Quan Sát" : "Note"} #{deficiencyList.length - i}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.created_at).toLocaleDateString(
                          vi ? "vi-VN" : "en-US",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </span>
                      {a.teacher && (
                        <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 ml-auto">
                          <span className="material-symbols-outlined text-[11px]">
                            person
                          </span>
                          {a.teacher.full_name}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm text-slate-700 leading-relaxed ${expandedNote === i ? "" : "line-clamp-2"}`}
                    >
                      {a.deficiency_log}
                    </p>
                    {a.deficiency_log?.length > 100 && (
                      <button
                        onClick={() =>
                          setExpandedNote(expandedNote === i ? null : i)
                        }
                        className="text-xs text-primary font-bold mt-1 hover:underline"
                      >
                        {expandedNote === i
                          ? vi
                            ? "▲ Thu gọn"
                            : "▲ Collapse"
                          : vi
                            ? "▼ Xem đầy đủ"
                            : "▼ Read more"}
                      </button>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-xs text-slate-400">
                    <p>
                      {vi ? "Nhận thức" : "Cognitive"}:{" "}
                      <strong className="text-primary">
                        {a.cognitive_score}/10
                      </strong>
                    </p>
                    <p>
                      {vi ? "Xã hội" : "Social"}:{" "}
                      <strong className="text-primary">
                        {a.social_score}/10
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lịch Sử Đánh Giá Kỹ Năng ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-primary font-headline">
              {vi ? "Lịch Sử Đánh Giá Kỹ Năng" : "Skill Assessment History"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {vi
                ? "Tất cả đánh giá từ giáo viên — nhận thức, xã hội, vận động, cảm xúc"
                : "All teacher assessments — cognitive, social, motor, emotional"}
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            {assessments.length} {vi ? "lần" : "records"}
          </span>
        </div>
        {assessments.length === 0 ? (
          <div className="p-10 text-slate-400 text-center">
            <span className="material-symbols-outlined text-4xl mb-2">
              assignment
            </span>
            <p className="font-semibold">
              {vi ? "Chưa có đánh giá nào" : "No assessments yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4 text-left">
                    {vi ? "Ngày" : "Date"}
                  </th>
                  <th className="px-4 py-4 text-left">
                    {vi ? "Giáo Viên" : "Teacher"}
                  </th>
                  <th className="px-4 py-4 text-center">
                    {vi ? "Nhận Thức" : "Cognitive"}
                  </th>
                  <th className="px-4 py-4 text-center">
                    {vi ? "Xã Hội" : "Social"}
                  </th>
                  <th className="px-4 py-4 text-center">
                    {vi ? "Vận Động" : "Motor"}
                  </th>
                  <th className="px-4 py-4 text-center">
                    {vi ? "Cảm Xúc" : "Emotional"}
                  </th>
                  <th className="px-4 py-4 text-left">
                    {vi ? "Ghi Chú Quan Sát" : "Observation Notes"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assessments.map((row, i) => {
                  const hasNote = !!row.deficiency_log;
                  return (
                    <tr
                      key={i}
                      className={`hover:bg-slate-50 transition-colors ${hasNote ? "border-l-4 border-l-amber-400" : ""}`}
                    >
                      <td className="px-6 py-4 font-bold text-on-surface text-sm">
                        {new Date(row.created_at).toLocaleDateString(
                          vi ? "vi-VN" : "en-US",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {row.teacher ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {row.teacher.full_name?.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold text-slate-600">
                              {row.teacher.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">
                            {vi ? "Không rõ" : "Unknown"}
                          </span>
                        )}
                      </td>
                      {[
                        row.cognitive_score,
                        row.social_score,
                        row.motor_score,
                        row.emotional_score,
                      ].map((score, j) => (
                        <td key={j} className="px-4 py-4 text-center">
                          <span
                            className={`text-sm font-extrabold ${
                              Number(score) >= 8.5
                                ? "text-secondary"
                                : Number(score) >= 7
                                  ? "text-primary"
                                  : "text-error"
                            }`}
                          >
                            {Number(score).toFixed(1)}
                            <span className="text-[10px] font-normal text-slate-400">
                              /10
                            </span>
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-4 max-w-xs">
                        {hasNote ? (
                          <div className="flex items-start gap-2">
                            <span
                              className="material-symbols-outlined text-amber-500 text-[14px] mt-0.5 shrink-0"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              warning
                            </span>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                              {row.deficiency_log}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">
                            {vi ? "Không có ghi chú" : "No notes"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
