import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";

// ─── Helpers ────────────────────────────────────────────────────────────────
const scoreColor = (v) => {
  const n = Number(v);
  if (!n) return "text-slate-300";
  if (n >= 8.5) return "text-emerald-600";
  if (n >= 7) return "text-blue-600";
  if (n >= 5) return "text-amber-600";
  return "text-red-500";
};

const avgOf = (arr, key) => {
  const vals = arr.map((a) => Number(a[key])).filter(Boolean);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};

// ─── Score Chip ──────────────────────────────────────────────────────────────
function ScoreChip({ value }) {
  const n = Number(value);
  const col = scoreColor(n);
  return (
    <span className={`text-sm font-black font-headline ${col}`}>
      {n ? n.toFixed(1) : "—"}
      <span className="text-[10px] font-normal text-slate-300">/10</span>
    </span>
  );
}

// ─── Skill Progress Bar ──────────────────────────────────────────────────────
function SkillBar({ label, value, max = 10 }) {
  const pct = Math.round((Number(value) / max) * 100);
  const barColor =
    pct >= 85
      ? "bg-emerald-500"
      : pct >= 70
        ? "bg-blue-500"
        : pct >= 50
          ? "bg-amber-500"
          : "bg-red-500";
  const textColor =
    pct >= 85
      ? "text-emerald-600"
      : pct >= 70
        ? "text-blue-600"
        : pct >= 50
          ? "text-amber-600"
          : "text-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-slate-500 font-semibold">
        {label}
      </span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-10 text-right text-sm font-black ${textColor}`}>
        {value ? Number(value).toFixed(1) : "—"}
      </span>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ avg }) {
  if (!avg)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400">
        Chưa đánh giá
      </span>
    );
  if (avg >= 8.0)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
        ✓ Xuất Sắc
      </span>
    );
  if (avg >= 7.0)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
        ✓ Tốt
      </span>
    );
  if (avg >= 5.0)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
        ⚠ Cần Chú Ý
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
      ⚠ Cần Hỗ Trợ
    </span>
  );
}

// ─── Component chính ─────────────────────────────────────────────────────────
export default function ClassReports() {
  const { lang } = useLang();
  const vi = lang === "vi";

  // state
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState({
    assessments: [],
    vitals: [],
    activityLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'assessments' | 'health' | 'logs'

  // Tải toàn bộ dữ liệu
  useEffect(() => {
    const load = async () => {
      try {
        const [studRes, classRes] = await Promise.all([
          api.get("/academic/students"),
          api.get("/academic/classes"),
        ]);
        const classList = classRes.data || [];
        const studentList = studRes.data || [];
        setClasses(classList);
        setStudents(studentList);
        // Chọn lớp đầu tiên tự động
        if (classList.length > 0) {
          setSelectedClass(classList[0]);
        }
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load hồ sơ học sinh (dùng API admin, không cần guardianUserId)
  const loadStudentDetails = useCallback(async (student) => {
    setSelected(student);
    setActiveTab("overview");
    setDetailLoading(true);
    try {
      const [recRes, vitalsRes] = await Promise.all([
        api.get(`/admin/student/${student.id}/records`),
        api.get(`/health/vitals?studentId=${student.id}`),
      ]);
      setRecords({
        assessments: recRes.data?.assessments || [],
        activityLogs: recRes.data?.activityLogs || [],
        vitals: vitalsRes.data || [],
        classTeacher: recRes.data?.classTeacher || null,
      });
    } catch (e) {
      console.error("Load student records error:", e);
      setRecords({ assessments: [], activityLogs: [], vitals: [] });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Filter học sinh theo lớp đang chọn + search
  const classStudents = students.filter((s) => {
    if (!selectedClass) return true;
    const matchClass =
      s.classroom_id === selectedClass.id ||
      s.classroom?.id === selectedClass.id ||
      s.classroom?.class_name === selectedClass.class_name ||
      s.classroom?.name === selectedClass.class_name;
    const matchSearch = s.full_name
      ?.toLowerCase()
      .includes(searchQ.toLowerCase());
    return matchClass && matchSearch;
  });

  // Tính thống kê lớp
  const classStats = (() => {
    return {
      total: classStudents.length,
      withAllergy: classStudents.filter((s) => s.allergy_tags?.length > 0)
        .length,
    };
  })();

  // Tính số liệu hồ sơ học sinh hiện tại
  const latestVital = records.vitals[records.vitals.length - 1];
  const deficiencyNotes = records.assessments.filter((a) => a.deficiency_log);

  const avgCognitive = avgOf(records.assessments, "cognitive_score");
  const avgSocial = avgOf(records.assessments, "social_score");
  const avgMotor = avgOf(records.assessments, "motor_score");
  const avgEmotional = avgOf(records.assessments, "emotional_score");
  const overallAvg =
    records.assessments.length > 0
      ? ((avgCognitive + avgSocial + avgMotor + avgEmotional) / 4).toFixed(1)
      : null;

  const TAB_ITEMS = [
    { id: "overview", icon: "person", label: vi ? "Tổng Quan" : "Overview" },
    {
      id: "assessments",
      icon: "assignment",
      label: vi ? "Đánh Giá KN" : "Assessments",
    },
    { id: "health", icon: "favorite", label: vi ? "Sức Khoẻ" : "Health" },
    { id: "logs", icon: "notes", label: vi ? "Nhật Ký HĐ" : "Activity" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <p className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-1">
            {vi
              ? "Ban Giám Hiệu · Quản Lý Chất Lượng"
              : "Principal · Quality Management"}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Báo Cáo Lớp Học" : "Class Reports"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? "Xem chi tiết đánh giá kỹ năng, sức khoẻ và nhật ký hoạt động từng học sinh."
              : "Review skill assessments, health records, and activity logs per student."}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm self-start"
        >
          <span className="material-symbols-outlined text-base">print</span>
          {vi ? "In Báo Cáo" : "Print Report"}
        </button>
      </div>

      {/* ── Class Tabs ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
            {vi ? "Lớp:" : "Class:"}
          </span>
          {loading ? (
            <div className="h-8 w-48 bg-slate-100 rounded-full animate-pulse" />
          ) : classes.length === 0 ? (
            <span className="text-sm text-slate-400">
              {vi ? "Chưa có lớp nào" : "No classes yet"}
            </span>
          ) : (
            classes.map((cls) => {
              const isActive = selectedClass?.id === cls.id;
              const studentCount = students.filter(
                (s) =>
                  s.classroom_id === cls.id ||
                  s.classroom?.id === cls.id ||
                  s.classroom?.name === cls.class_name,
              ).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls);
                    setSelected(null);
                    setSearchQ("");
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    class
                  </span>
                  {cls.class_name || cls.name}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {studentCount}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* ── Cột trái: Danh sách học sinh ── */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header lớp */}
            <div
              className="p-5 border-b border-slate-100"
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  class
                </span>
                <h3 className="font-extrabold text-primary font-headline">
                  {selectedClass
                    ? selectedClass.class_name || selectedClass.name
                    : vi
                      ? "Tất Cả"
                      : "All"}
                </h3>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>
                  <strong className="text-primary font-black">
                    {classStats.total}
                  </strong>{" "}
                  {vi ? "học sinh" : "students"}
                </span>
                {classStats.withAllergy > 0 && (
                  <span className="text-error font-semibold">
                    ⚠ {classStats.withAllergy} {vi ? "dị ứng" : "allergies"}
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder={vi ? "Tìm học sinh..." : "Search student..."}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Student list */}
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-50">
              {loading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-2xl">
                    progress_activity
                  </span>
                  <span className="text-sm">
                    {vi ? "Đang tải..." : "Loading..."}
                  </span>
                </div>
              ) : classStudents.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl mb-2 block">
                    person_off
                  </span>
                  {vi ? "Không tìm thấy học sinh" : "No students found"}
                </div>
              ) : (
                classStudents.map((s) => {
                  const isSelected = selected?.id === s.id;
                  const hasAllergy = s.allergy_tags?.length > 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadStudentDetails(s)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                        isSelected
                          ? "bg-primary/5 border-l-4 border-l-primary"
                          : "hover:bg-slate-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-sm truncate ${isSelected ? "text-primary" : "text-on-surface"}`}
                        >
                          {s.full_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {s.date_of_birth && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(s.date_of_birth).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          )}
                          {hasAllergy && (
                            <span className="text-[10px] text-error font-bold">
                              ⚠ {vi ? "Dị ứng" : "Allergy"}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          chevron_right
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Cột phải: Chi tiết học sinh ── */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            /* Empty state */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  person_search
                </span>
              </div>
              <p className="font-bold text-base text-slate-500">
                {vi
                  ? "Chọn học sinh để xem báo cáo"
                  : "Select a student to view report"}
              </p>
              <p className="text-xs text-center max-w-xs leading-relaxed">
                {vi
                  ? "Báo cáo bao gồm đánh giá kỹ năng, lịch sử sức khoẻ, và nhật ký hoạt động hàng ngày."
                  : "Reports include skill assessments, health history, and daily activity logs."}
              </p>
              <div className="flex gap-3 mt-2">
                {[
                  {
                    icon: "assignment",
                    label: vi ? "Kỹ Năng" : "Skills",
                    color: "text-blue-500 bg-blue-50",
                  },
                  {
                    icon: "favorite",
                    label: vi ? "Sức Khoẻ" : "Health",
                    color: "text-red-500 bg-red-50",
                  },
                  {
                    icon: "notes",
                    label: vi ? "Nhật Ký" : "Logs",
                    color: "text-green-500 bg-green-50",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl ${item.color}`}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-bold">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : detailLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center py-24 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-pulse text-primary">
                assignment
              </span>
              <span className="font-semibold">
                {vi ? "Đang tải hồ sơ..." : "Loading records..."}
              </span>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ── Student Card Header ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-start gap-5">
                  {/* Avatar lớn */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-sm">
                    {selected.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-2xl font-extrabold text-primary font-headline">
                          {selected.full_name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              class
                            </span>
                            {selected.classroom?.class_name ||
                              selected.classroom?.name ||
                              (vi ? "Chưa phân lớp" : "Unassigned")}
                          </span>
                          {selected.date_of_birth && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">
                                cake
                              </span>
                              {new Date(
                                selected.date_of_birth,
                              ).toLocaleDateString(vi ? "vi-VN" : "en-US")}
                            </span>
                          )}
                          {records.classTeacher && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">
                                person
                              </span>
                              GV: {records.classTeacher.full_name}
                            </span>
                          )}
                        </div>
                        {selected.allergy_tags?.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-error text-[16px]">
                              warning
                            </span>
                            <span className="text-sm font-bold text-error">
                              {vi ? "Dị ứng" : "Allergies"}:{" "}
                              {selected.allergy_tags.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Summary badges */}
                      <div className="flex gap-3 shrink-0">
                        <div className="text-center px-3 py-2 bg-blue-50 rounded-xl">
                          <p className="text-2xl font-black text-blue-600 font-headline">
                            {records.assessments.length}
                          </p>
                          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                            {vi ? "Đánh Giá" : "Assess."}
                          </p>
                        </div>
                        <div className="text-center px-3 py-2 bg-red-50 rounded-xl">
                          <p className="text-2xl font-black text-red-500 font-headline">
                            {deficiencyNotes.length}
                          </p>
                          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">
                            {vi ? "Ghi Chú" : "Notes"}
                          </p>
                        </div>
                        <div className="text-center px-3 py-2 bg-emerald-50 rounded-xl">
                          <p className="text-2xl font-black text-emerald-600 font-headline">
                            {records.vitals.length}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                            {vi ? "Sức Khoẻ" : "Vitals"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tab Navigation ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex border-b border-slate-100 px-4">
                  {TAB_ITEMS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all -mb-px ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {tab.icon}
                      </span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* ─── Tab: Tổng Quan ─── */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {records.assessments.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-3 text-slate-400 bg-slate-50 rounded-xl">
                          <span className="material-symbols-outlined text-5xl">
                            assignment
                          </span>
                          <p className="font-semibold">
                            {vi
                              ? "Chưa có đánh giá kỹ năng nào"
                              : "No skill assessments yet"}
                          </p>
                          <p className="text-xs">
                            {vi
                              ? "Giáo viên cần thực hiện đánh giá kỹ năng cho học sinh này."
                              : "Teacher needs to submit skill assessments for this student."}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Overall score */}
                          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                              <span className="text-2xl font-black text-white font-headline">
                                {overallAvg}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-primary font-headline text-lg">
                                {vi
                                  ? "Điểm Trung Bình Chung"
                                  : "Overall Average"}
                              </p>
                              <StatusBadge avg={Number(overallAvg)} />
                              <p className="text-xs text-slate-400 mt-1">
                                {vi
                                  ? `Dựa trên ${records.assessments.length} lần đánh giá`
                                  : `Based on ${records.assessments.length} assessment(s)`}
                              </p>
                            </div>
                            {deficiencyNotes.length > 0 && (
                              <div className="ml-auto px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                <p className="text-2xl font-black text-amber-600 font-headline">
                                  {deficiencyNotes.length}
                                </p>
                                <p className="text-[10px] text-amber-500 font-bold">
                                  {vi ? "Ghi Chú Cần Xem" : "Notes to Review"}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Skill bars */}
                          <div>
                            <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                              {vi
                                ? "Phân Tích Kỹ Năng (Trung Bình)"
                                : "Skill Analysis (Average)"}
                            </h4>
                            <div className="space-y-3">
                              <SkillBar
                                label={vi ? "Nhận Thức" : "Cognitive"}
                                value={avgCognitive.toFixed(1)}
                              />
                              <SkillBar
                                label={vi ? "Xã Hội" : "Social"}
                                value={avgSocial.toFixed(1)}
                              />
                              <SkillBar
                                label={vi ? "Vận Động" : "Motor"}
                                value={avgMotor.toFixed(1)}
                              />
                              <SkillBar
                                label={vi ? "Cảm Xúc" : "Emotional"}
                                value={avgEmotional.toFixed(1)}
                              />
                            </div>
                          </div>

                          {/* Ghi chú gần nhất nếu có */}
                          {deficiencyNotes.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                              <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                <span
                                  className="material-symbols-outlined text-amber-600 text-[18px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  warning
                                </span>
                                {vi
                                  ? "Ghi Chú Quan Sát Gần Nhất"
                                  : "Latest Observation Note"}
                              </h4>
                              <p className="text-sm text-amber-700 leading-relaxed">
                                {deficiencyNotes[0].deficiency_log}
                              </p>
                              <p className="text-[10px] text-amber-500 mt-2">
                                {new Date(
                                  deficiencyNotes[0].created_at,
                                ).toLocaleDateString(vi ? "vi-VN" : "en-US", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          )}

                          {/* Sức khoẻ snapshot */}
                          {latestVital && (
                            <div>
                              <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">
                                {vi ? "Sức Khoẻ Gần Nhất" : "Latest Health"}
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  {
                                    icon: "monitor_weight",
                                    label: vi ? "Cân Nặng" : "Weight",
                                    value: `${latestVital.weight || "—"} kg`,
                                    color: "text-cyan-700 bg-cyan-50",
                                  },
                                  {
                                    icon: "straighten",
                                    label: vi ? "Chiều Cao" : "Height",
                                    value: `${latestVital.height || "—"} cm`,
                                    color: "text-green-700 bg-green-50",
                                  },
                                  {
                                    icon: "favorite",
                                    label: vi ? "Nhịp Tim" : "Heart",
                                    value: `${latestVital.heart_rate || "—"} bpm`,
                                    color: "text-purple-700 bg-purple-50",
                                  },
                                ].map((item, i) => (
                                  <div
                                    key={i}
                                    className={`rounded-xl p-3 flex items-center gap-2 ${item.color}`}
                                  >
                                    <span
                                      className="material-symbols-outlined text-[20px]"
                                      style={{
                                        fontVariationSettings: "'FILL' 1",
                                      }}
                                    >
                                      {item.icon}
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase opacity-60">
                                        {item.label}
                                      </p>
                                      <p className="text-sm font-extrabold">
                                        {item.value}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── Tab: Lịch Sử Đánh Giá ─── */}
                  {activeTab === "assessments" && (
                    <div>
                      {records.assessments.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                          <span className="material-symbols-outlined text-5xl">
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
                                <th className="px-4 py-3 text-left">
                                  {vi ? "Ngày" : "Date"}
                                </th>
                                <th className="px-3 py-3 text-center">
                                  {vi ? "Nhận Thức" : "Cognitive"}
                                </th>
                                <th className="px-3 py-3 text-center">
                                  {vi ? "Xã Hội" : "Social"}
                                </th>
                                <th className="px-3 py-3 text-center">
                                  {vi ? "Vận Động" : "Motor"}
                                </th>
                                <th className="px-3 py-3 text-center">
                                  {vi ? "Cảm Xúc" : "Emotional"}
                                </th>
                                <th className="px-4 py-3 text-left">
                                  {vi ? "Ghi Chú GV" : "Teacher Notes"}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {records.assessments.map((row, i) => {
                                const hasNote = !!row.deficiency_log;
                                return (
                                  <tr
                                    key={i}
                                    className={`hover:bg-slate-50 transition-colors ${hasNote ? "border-l-4 border-l-amber-400" : ""}`}
                                  >
                                    <td className="px-4 py-3 font-bold text-on-surface text-sm whitespace-nowrap">
                                      {new Date(
                                        row.created_at,
                                      ).toLocaleDateString(
                                        vi ? "vi-VN" : "en-US",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                      <ScoreChip value={row.cognitive_score} />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                      <ScoreChip value={row.social_score} />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                      <ScoreChip value={row.motor_score} />
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                      <ScoreChip value={row.emotional_score} />
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                                      {hasNote ? (
                                        <div className="flex items-start gap-1.5">
                                          <span
                                            className="material-symbols-outlined text-amber-500 text-[14px] mt-0.5 shrink-0"
                                            style={{
                                              fontVariationSettings: "'FILL' 1",
                                            }}
                                          >
                                            warning
                                          </span>
                                          <p className="text-xs text-amber-700 leading-relaxed line-clamp-2">
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
                  )}

                  {/* ─── Tab: Sức Khoẻ ─── */}
                  {activeTab === "health" && (
                    <div>
                      {records.vitals.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                          <span className="material-symbols-outlined text-5xl">
                            favorite
                          </span>
                          <p className="font-semibold">
                            {vi
                              ? "Chưa có bản ghi sức khoẻ"
                              : "No health records"}
                          </p>
                          <p className="text-xs">
                            {vi
                              ? "Giáo viên cần nhập cân nặng/chiều cao."
                              : "Teacher needs to submit vitals."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[...records.vitals].reverse().map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span
                                  className="material-symbols-outlined text-primary text-[18px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  favorite
                                </span>
                              </div>
                              <div className="text-sm font-bold text-slate-500">
                                {new Date(
                                  v.measured_at || v.created_at || Date.now(),
                                ).toLocaleDateString(vi ? "vi-VN" : "en-US", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="flex gap-6 ml-4">
                                {[
                                  {
                                    label: "kg",
                                    value: v.weight,
                                    icon: "monitor_weight",
                                    color: "text-cyan-600",
                                  },
                                  {
                                    label: "cm",
                                    value: v.height,
                                    icon: "straighten",
                                    color: "text-green-600",
                                  },
                                  {
                                    label: "bpm",
                                    value: v.heart_rate,
                                    icon: "favorite",
                                    color: "text-purple-600",
                                  },
                                ].map((item, j) =>
                                  item.value ? (
                                    <div
                                      key={j}
                                      className="flex items-center gap-1"
                                    >
                                      <span
                                        className={`material-symbols-outlined text-[16px] ${item.color}`}
                                        style={{
                                          fontVariationSettings: "'FILL' 1",
                                        }}
                                      >
                                        {item.icon}
                                      </span>
                                      <span
                                        className={`text-sm font-black ${item.color}`}
                                      >
                                        {item.value}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {item.label}
                                      </span>
                                    </div>
                                  ) : null,
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── Tab: Nhật Ký Hoạt Động ─── */}
                  {activeTab === "logs" && (
                    <div>
                      {!records.activityLogs ||
                      records.activityLogs.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
                          <span className="material-symbols-outlined text-5xl">
                            notes
                          </span>
                          <p className="font-semibold">
                            {vi
                              ? "Chưa có nhật ký hoạt động"
                              : "No activity logs"}
                          </p>
                          <p className="text-xs">
                            {vi
                              ? "Giáo viên chưa ghi nhật ký cho học sinh này."
                              : "No logs recorded by teachers for this student."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {records.activityLogs.map((log, i) => (
                            <div
                              key={i}
                              className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
                            >
                              <div className="w-1 shrink-0 rounded-full bg-primary/30 self-stretch" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                                    {log.category || vi
                                      ? "Hoạt Động"
                                      : "Activity"}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(
                                      log.created_at,
                                    ).toLocaleDateString(
                                      vi ? "vi-VN" : "en-US",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                </div>
                                <p className="font-bold text-sm text-on-surface">
                                  {log.title}
                                </p>
                                <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                                  {log.description}
                                </p>
                                {log.teacher && (
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    {vi ? "GV:" : "By:"} {log.teacher.full_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
