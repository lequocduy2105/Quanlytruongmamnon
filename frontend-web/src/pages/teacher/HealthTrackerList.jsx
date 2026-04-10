import React, { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import api from "../../api/axiosClient";
import { useToast } from "../../components/Toast";
import { useLang } from "../../contexts/LangContext";

export default function HealthTrackerList() {
  const toast = useToast();
  const { lang } = useLang();
  const vi = lang === "vi";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [vitalsData, setVitalsData] = useState([]);
  const [pickups, setPickups] = useState([]); // ← Người ủy quyền
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [vitalForm, setVitalForm] = useState({
    weight: "",
    height: "",
    heart_rate: "",
    doctor_note: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  /** Mỗi khi học sinh thay đổi → tải lại danh sách ủy quyền */
  useEffect(() => {
    if (!selectedStudent) {
      setPickups([]);
      return;
    }
    api
      .get(`/academic/pickups/student/${selectedStudent.id}`)
      .then((r) => setPickups(r.data || []))
      .catch(() => setPickups([]));
  }, [selectedStudent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, vitalsRes] = await Promise.all([
        api.get("/academic/students"),
        api.get("/health/vitals"),
      ]);
      setStudents(studentsRes.data || []);
      setVitalsData(vitalsRes.data || []);
      if (studentsRes.data && studentsRes.data.length > 0) {
        setSelectedStudent(studentsRes.data[0]);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sức khoẻ:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVitalChange = (e) => {
    setVitalForm({ ...vitalForm, [e.target.name]: e.target.value });
  };

  const submitVitals = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setSaving(true);
      const hMeters = Number(vitalForm.height) / 100;
      const calcBmi = Number(vitalForm.weight) / (hMeters * hMeters);

      const payload = {
        studentId: selectedStudent.id,
        weight: Number(vitalForm.weight),
        height: Number(vitalForm.height),
        heartRate: Number(vitalForm.heart_rate),
        bmi: calcBmi,
        note: vitalForm.doctor_note || "",
      };

      await api.post("/health/vitals", payload);
      toast({
        message: vi
          ? "Ghi nhận sức khoẻ thành công!"
          : "Vitals logged successfully!",
      });
      setShowModal(false);
      setVitalForm({ weight: "", height: "", heart_rate: "", doctor_note: "" });
      fetchData();
    } catch (error) {
      console.error("Lỗi khi ghi nhận sức khoẻ:", error);
      toast({
        message: vi
          ? "Lỗi khi ghi dữ liệu. Vui lòng thử lại."
          : "Error logging vitals. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-slate-400">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
        {vi ? "Đang tải trung tâm sức khoẻ..." : "Loading health center..."}
      </div>
    );
  }

  const studentVitals = vitalsData
    .filter((v) => v.studentId === selectedStudent?.id)
    .reverse();
  const latestVital =
    studentVitals.length > 0 ? studentVitals[studentVitals.length - 1] : null;

  // Format ngày theo locale
  const formatDate = (dateStr) => {
    if (!dateStr) return vi ? "Chưa có" : "Never";
    return new Date(dateStr).toLocaleDateString(vi ? "vi-VN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const chartData = studentVitals.map((v) => ({
    name: new Date(v.logged_at).toLocaleDateString(vi ? "vi-VN" : "en-US", {
      month: "short",
    }),
    value: Number(v.bmi_value),
  }));
  const finalChartData =
    chartData.length > 0
      ? chartData
      : [{ name: vi ? "Chưa có" : "No Data", value: 0 }];

  /** Kiểm tra hiệu lực của ủy quyền */
  const today = new Date().toISOString().slice(0, 10);
  const isActive = (p) =>
    (p.validFrom === null || p.validFrom <= today) &&
    (p.validUntil === null || p.validUntil >= today);

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
            {vi ? "Trung Tâm Theo Dõi Sức Khoẻ" : "Health Tracking Center"}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {vi
              ? "Theo dõi và ghi nhận chỉ số sức khoẻ cho tất cả học sinh."
              : "Monitor and log health metrics for all students at The Atelier."}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-bold border border-secondary-container">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span>
            {latestVital
              ? vi
                ? "Dữ Liệu Trực Tiếp"
                : "Live Data Connected"
              : vi
                ? "Chưa có lịch sử"
                : "No recent logs"}
          </span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start h-[calc(100vh-250px)]">
        {/* Left Panel: Danh sách học sinh */}
        <div className="w-full xl:w-96 flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 h-full">
          <div className="p-5 bg-slate-50 border-b border-slate-100">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-widest font-headline">
              <span className="material-symbols-outlined text-sm">groups</span>
              {vi ? "Tất Cả Học Sinh" : "All Students"}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto hidden-scrollbar">
            {students.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              const shortName = student.full_name?.charAt(0) || "?";
              const hasVitals = vitalsData.some(
                (v) => v.studentId === student.id,
              );
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 flex items-center gap-4 border-l-4 cursor-pointer transition-all ${isSelected ? "bg-primary-container/5 border-primary" : "border-transparent hover:bg-slate-50 border-b border-slate-50"}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${isSelected ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    {shortName}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate font-headline pb-0.5">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {vi ? "Lớp" : "Class"}:{" "}
                      {student.classroom?.class_name || "N/A"}
                    </p>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shadow-sm ${hasVitals ? "bg-secondary" : "bg-tertiary"}`}
                    title={
                      hasVitals
                        ? vi
                          ? "Đã ghi nhận"
                          : "Logged"
                        : vi
                          ? "Chờ ghi nhận"
                          : "Pending"
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Chi tiết học sinh được chọn */}
        {selectedStudent && (
          <div className="flex-1 w-full flex flex-col gap-6 h-full overflow-y-auto hidden-scrollbar">
            {/* Header ID Card */}
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center text-4xl font-extrabold ring-4 ring-slate-50">
                    {selectedStudent.full_name?.charAt(0)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-md border border-slate-50">
                    <span
                      className="material-symbols-outlined text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-primary font-headline leading-tight">
                    {selectedStudent.full_name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {selectedStudent.classroom && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold leading-none bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        <span className="material-symbols-outlined text-[16px]">
                          domain
                        </span>
                        {selectedStudent.classroom.class_name}
                      </div>
                    )}
                    {(selectedStudent.allergy_tags || []).map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1.5 text-tertiary text-xs font-bold leading-none bg-tertiary-container/30 rounded-lg px-3 py-2 border border-tertiary-container/50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          warning
                        </span>
                        {vi ? "Dị ứng" : "Allergy"}: {tag}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {vi ? "Lần Khám Gần Nhất" : "Last Health Check"}
                </p>
                <p className="text-lg font-bold text-on-surface font-headline">
                  {formatDate(latestVital?.logged_at)}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-1 text-primary text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {vi ? "Khám Mới" : "New Checkup"}{" "}
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_right_alt
                  </span>
                </button>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              {[
                {
                  icon: "scale",
                  color: "bg-cyan-50 text-primary",
                  label: vi ? "Cân Nặng" : "Weight",
                  value: latestVital?.weight,
                  unit: "kg",
                },
                {
                  icon: "straighten",
                  color: "bg-green-50 text-secondary",
                  label: vi ? "Chiều Cao" : "Height",
                  value: latestVital?.height,
                  unit: "cm",
                },
                {
                  icon: "favorite",
                  color: "bg-orange-50 text-tertiary",
                  label: vi ? "Nhịp Tim" : "Pulse",
                  value: latestVital?.heart_rate,
                  unit: "bpm",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group cursor-default hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center transition-transform group-hover:scale-110`}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {card.icon}
                      </span>
                    </div>
                  </div>
                  <div className="mt-8">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {card.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold text-primary font-headline tracking-tighter">
                        {card.value || "--"}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        {card.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BMI Chart */}
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-slate-100 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-xl font-bold text-primary font-headline mb-1">
                    {vi ? "Biểu Đồ BMI" : "BMI Growth Curve"}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {vi
                      ? "Sự phát triển BMI của học sinh"
                      : "Child's BMI development"}
                    {latestVital &&
                      ` — ${vi ? "Mới nhất" : "Latest"}: ${latestVital.bmi_value}`}
                  </p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={finalChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#004e63"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#004e63"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#004e63"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ─── Người được ủy quyền đón ─────────────────────── */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-slate-100 shadow-sm shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-amber-600 text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      badge
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface font-headline text-base">
                      {vi ? "Người Được Ủy Quyền Đón" : "Authorized Pickups"}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {vi
                        ? "Giáo viên đối chiếu trước khi giao trẻ"
                        : "Teacher must verify before releasing child"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    pickups.length > 0
                      ? "bg-secondary/10 text-secondary"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {pickups.length} {vi ? "người" : "registered"}
                </span>
              </div>

              {/* Empty state */}
              {pickups.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2 text-slate-300">
                  <span className="material-symbols-outlined text-4xl">
                    person_off
                  </span>
                  <p className="text-sm font-semibold text-slate-400">
                    {vi
                      ? "Chưa có ai được ủy quyền"
                      : "No authorized pickups registered"}
                  </p>
                  <p className="text-[11px] text-slate-400 text-center max-w-xs">
                    {vi
                      ? "Phụ huynh cần đăng ký người được ủy quyền đón qua ứng dụng phụ huynh"
                      : "Parents register authorized persons via the parent portal"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pickups.map((p) => {
                    const active = isActive(p);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          active
                            ? "bg-emerald-50/50 border-emerald-100"
                            : "bg-slate-50 border-slate-100 opacity-60"
                        }`}
                      >
                        {/* Avatar hoặc ảnh CMND */}
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                              active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-400"
                            }`}
                          >
                            {p.name?.charAt(0) || "?"}
                          </div>
                        )}

                        {/* Thông tin */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-on-surface truncate">
                              {p.name}
                            </p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {active
                                ? vi
                                  ? "✓ Hiệu Lực"
                                  : "✓ Active"
                                : vi
                                  ? "⚠ Hết Hạn"
                                  : "⚠ Expired"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold">
                              {p.relationship}
                            </span>
                            {p.phone && (
                              <>
                                {" "}
                                &nbsp;·&nbsp;
                                <a
                                  href={`tel:${p.phone}`}
                                  className="text-primary hover:underline font-mono"
                                >
                                  {p.phone}
                                </a>
                              </>
                            )}
                          </p>
                          {(p.validFrom || p.validUntil) && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.validFrom &&
                                `${vi ? "Từ" : "From"}: ${formatDate(p.validFrom)}`}
                              {p.validFrom && p.validUntil && "  →  "}
                              {p.validUntil &&
                                `${vi ? "Đến" : "Until"}: ${formatDate(p.validUntil)}`}
                            </p>
                          )}
                          {p.note && (
                            <p className="text-[10px] text-amber-600 mt-0.5 italic">
                              📝 {p.note}
                            </p>
                          )}
                        </div>

                        {/* Icon xác minh */}
                        <span
                          className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-emerald-500" : "text-slate-300"}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {active ? "verified" : "cancel"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cảnh báo cho giáo viên */}
              {pickups.some((p) => isActive(p)) && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <span
                    className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    info
                  </span>
                  <p className="text-[11px] text-amber-700 font-medium">
                    {vi
                      ? "Yêu cầu xuất trình CMND/hộ chiếu trước khi giao trẻ cho người trong danh sách"
                      : "Require government-issued ID before releasing child to any listed person"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal ghi nhận sức khoẻ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-primary font-headline mb-6">
              {vi ? "Ghi Nhận Sức Khoẻ" : "Log Health Check"}
            </h3>
            <form onSubmit={submitVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {vi ? "Cân Nặng (kg)" : "Weight (kg)"}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="weight"
                    value={vitalForm.weight}
                    onChange={handleVitalChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {vi ? "Chiều Cao (cm)" : "Height (cm)"}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="height"
                    value={vitalForm.height}
                    onChange={handleVitalChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {vi ? "Nhịp Tim (bpm)" : "Heart Rate (bpm)"}
                </label>
                <input
                  required
                  type="number"
                  name="heart_rate"
                  value={vitalForm.heart_rate}
                  onChange={handleVitalChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {vi ? "Ghi Chú Bác Sĩ (tuỳ chọn)" : "Doctor Note (Optional)"}
                </label>
                <textarea
                  name="doctor_note"
                  value={vitalForm.doctor_note}
                  onChange={handleVitalChange}
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {vi ? "Huỷ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving
                    ? vi
                      ? "Đang lưu..."
                      : "Saving..."
                    : vi
                      ? "Lưu"
                      : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
