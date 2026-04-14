import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

const DAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Util: lấy ngày đầu tuần (CN) của một ngày bất kỳ ────────────────────────
function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Modal Điểm Danh — hỗ trợ chọn ngày ─────────────────────────────────────
function AttendanceModal({
  isOpen,
  onClose,
  students,
  vi,
  onSaved,
  initialDate,
}) {
  const toast = useToast();
  const [status, setStatus] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      const init = {};
      students.forEach((s) => {
        init[s.id] = "present";
      });
      setStatus(init);
      // Mặc định ngày được truyền vào (ngày click trong lịch hoặc hôm nay)
      const d = initialDate || new Date();
      setSelectedDate(d.toISOString().split("T")[0]);
    }
  }, [isOpen, students, initialDate]);

  if (!isOpen) return null;

  const counts = {
    present: Object.values(status).filter((v) => v === "present").length,
    absent: Object.values(status).filter((v) => v === "absent").length,
    late: Object.values(status).filter((v) => v === "late").length,
  };

  const today = new Date().toISOString().split("T")[0];
  const isEditingPast = selectedDate && selectedDate < today;
  const isEditingFuture = selectedDate && selectedDate > today;

  const handleSave = async () => {
    if (isEditingFuture) {
      toast({
        message: vi
          ? "Không thể điểm danh cho ngày tương lai!"
          : "Cannot mark attendance for a future date!",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      // Map UI status → API enum
      // UI: 'present' | 'absent' | 'late'
      // API: 'present' | 'absent_unexcused' | 'late'
      const records = students.map((s) => ({
        studentId: s.id,
        status: (() => {
          const st = status[s.id] || "present";
          if (st === "absent") return "absent_unexcused";
          if (st === "late") return "late";
          return "present";
        })(),
      }));

      await axiosClient.post("/academic/attendance", {
        date: selectedDate,
        records,
      });

      const counts = {
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent_unexcused").length,
        late: records.filter((r) => r.status === "late").length,
      };

      toast({
        message: vi
          ? `Đã lưu điểm danh ngày ${selectedDate}!`
          : `Attendance saved for ${selectedDate}!`,
      });
      onSaved({
        present: counts.present,
        absent: counts.absent,
        late: counts.late,
      });
      onClose();
    } catch (e) {
      console.error("Save attendance error:", e?.response?.data || e);
      const msg =
        e?.response?.data?.message ||
        (vi
          ? "Lưu thất bại. Kiểm tra backend."
          : "Save failed. Check backend.");
      toast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-5 text-white flex justify-between items-center ${isEditingPast ? "bg-amber-600" : "bg-primary"}`}
        >
          <div>
            <h3 className="text-xl font-extrabold font-headline">
              {isEditingPast
                ? vi
                  ? "📅 Bổ Sung Điểm Danh"
                  : "📅 Backfill Attendance"
                : vi
                  ? "✏️ Điểm Danh"
                  : "✏️ Mark Attendance"}
            </h3>
            <p className="text-sm opacity-80 mt-0.5">
              {isEditingPast
                ? vi
                  ? "Đang ghi bù cho ngày đã qua"
                  : "Recording for a past date"
                : vi
                  ? "Ghi nhận cho ngày đã chọn"
                  : "Recording for selected date"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Date picker */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {vi ? "Ngày Điểm Danh" : "Attendance Date"}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            {isEditingPast && (
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  history
                </span>
                {vi ? "Ghi Bù" : "Retroactive"}
              </span>
            )}
            {!isEditingPast && selectedDate === today && (
              <span className="text-xs font-bold text-secondary bg-secondary-container/50 px-3 py-1.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  today
                </span>
                {vi ? "Hôm Nay" : "Today"}
              </span>
            )}
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex divide-x divide-slate-100 border-b border-slate-100">
          {[
            {
              label: vi ? "Có Mặt" : "Present",
              count: counts.present,
              color: "text-secondary",
            },
            {
              label: vi ? "Vắng" : "Absent",
              count: counts.absent,
              color: "text-error",
            },
            {
              label: vi ? "Trễ" : "Late",
              count: counts.late,
              color: "text-tertiary",
            },
          ].map((item, i) => (
            <div key={i} className="flex-1 py-3 flex flex-col items-center">
              <span
                className={`text-2xl font-black font-headline ${item.color}`}
              >
                {item.count}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Hướng dẫn nhanh */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            {vi
              ? "✅ Mặc định = Có mặt. Nhấn tên để đánh dấu Vắng hoặc Trễ."
              : "✅ Default = Present. Tap name to mark Absent or Late."}
          </p>
        </div>

        {/* Student list — 1-tap UX */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
          {students.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              {vi ? "Lớp chưa có học sinh." : "No students in class."}
            </p>
          ) : (
            students.map((s) => {
              const st = status[s.id] || "present";
              const cycleStatus = () => {
                // Vòng: present → absent → late → present
                const next =
                  st === "present"
                    ? "absent"
                    : st === "absent"
                      ? "late"
                      : "present";
                setStatus((p) => ({ ...p, [s.id]: next }));
              };
              const stateStyle = {
                present: {
                  row: "hover:bg-green-50",
                  badge: "bg-green-100 text-green-700 border-green-200",
                  icon: "check_circle",
                  label: vi ? "Có mặt" : "Present",
                },
                absent: {
                  row: "bg-red-50 hover:bg-red-100",
                  badge: "bg-red-100 text-red-700 border-red-200",
                  icon: "cancel",
                  label: vi ? "Vắng" : "Absent",
                },
                late: {
                  row: "bg-amber-50 hover:bg-amber-100",
                  badge: "bg-amber-100 text-amber-700 border-amber-200",
                  icon: "schedule",
                  label: vi ? "Đi trễ" : "Late",
                },
              }[st];

              return (
                <button
                  key={s.id}
                  onClick={cycleStatus}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all ${stateStyle.row}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 ${
                      st === "present"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : st === "absent"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-amber-100 text-amber-700 border-amber-300"
                    }`}
                  >
                    {s.full_name?.charAt(0)}
                  </div>

                  {/* Name + allergy */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm truncate ${
                        st === "present"
                          ? "text-slate-700"
                          : st === "absent"
                            ? "text-red-700"
                            : "text-amber-700"
                      }`}
                    >
                      {s.full_name}
                    </p>
                    {s.allergy_tags?.length > 0 && (
                      <p className="text-[10px] text-error font-bold">
                        ⚠ {s.allergy_tags.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${stateStyle.badge}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {stateStyle.icon}
                    </span>
                    {stateStyle.label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"
          >
            {vi ? "Huỷ" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isEditingFuture}
            className={`flex-[2] py-2.5 rounded-xl text-white font-bold text-sm shadow-md disabled:opacity-50 ${isEditingPast ? "bg-amber-600" : "bg-primary"}`}
          >
            {saving
              ? vi
                ? "Đang lưu..."
                : "Saving..."
              : isEditingPast
                ? vi
                  ? "📝 Lưu Bổ Sung"
                  : "📝 Save Retroactive"
                : vi
                  ? "✓ Lưu Điểm Danh"
                  : "✓ Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Ghi Nhật Ký Hoạt Động ────────────────────────────────────────────
function ActivityLogModal({ isOpen, onClose, students, vi }) {
  const toast = useToast();
  const [form, setForm] = useState({
    studentId: "",
    category: "Behavioral",
    title: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const categories = [
    { val: "Behavioral", label: vi ? "Hành Vi" : "Behavioral", icon: "mood" },
    { val: "Academic", label: vi ? "Học Tập" : "Academic", icon: "school" },
    { val: "Health", label: vi ? "Sức Khoẻ" : "Health", icon: "favorite" },
    { val: "Social", label: vi ? "Xã Hội" : "Social", icon: "group" },
  ];

  useEffect(() => {
    if (isOpen && students.length > 0) {
      setForm({
        studentId: String(students[0].id),
        category: "Behavioral",
        title: "",
        description: "",
      });
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Chỉ cần title là bắt buộc - description là tuỳ chọn
    if (!form.studentId || !form.title.trim()) {
      toast({
        message: vi
          ? "Vui lòng chọn học sinh và nhập tiêu đề!"
          : "Please select a student and enter a title!",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      await axiosClient.post("/academic/activity-logs", {
        studentId: Number(form.studentId),
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || form.title.trim(),
      });
      toast({
        message: vi ? "Đã ghi nhật ký thành công!" : "Activity log saved!",
      });
      setForm({
        studentId: String(students[0]?.id || ""),
        category: "Behavioral",
        title: "",
        description: "",
      });
      onClose();
    } catch {
      toast({
        message: vi ? "Lưu thất bại. Thử lại sau." : "Failed to save.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-secondary text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold font-headline flex items-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
              {vi ? "Ghi Nhật Ký Hoạt Động" : "Write Activity Log"}
            </h3>
            <p className="text-sm opacity-80 mt-0.5">
              {vi
                ? "Phụ huynh sẽ thấy ghi chú này"
                : "Parents will see this note"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Chọn học sinh */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              {vi ? "Học Sinh" : "Student"}
            </label>
            <select
              value={form.studentId}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentId: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Loại nhật ký */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              {vi ? "Loại Hoạt Động" : "Category"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.val}
                  onClick={() => setForm((f) => ({ ...f, category: cat.val }))}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border-2 transition-all ${
                    form.category === cat.val
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-slate-100 text-slate-400 hover:border-secondary/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              {vi ? "Tiêu Đề *" : "Title *"}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder={
                vi
                  ? "VD: Tích cực phát biểu trong giờ học..."
                  : "E.g. Actively participated in class..."
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>

          {/* Nội dung — không bắt buộc */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              {vi ? "Mô Tả Thêm" : "Additional Notes"}
              <span className="text-[10px] font-normal text-slate-400 normal-case tracking-normal">
                ({vi ? "không bắt buộc" : "optional"})
              </span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder={
                vi
                  ? "Mô tả thêm chi tiết (nếu có)..."
                  : "Additional details (optional)..."
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50"
          >
            {vi ? "Huỷ" : "Cancel"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-2.5 rounded-xl bg-secondary text-white font-bold text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving
              ? vi
                ? "Đang lưu..."
                : "Saving..."
              : vi
                ? "Lưu Nhật Ký"
                : "Save Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component chính ─────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { lang } = useLang();
  const vi = lang === "vi";
  const navigate = useNavigate();
  const toast = useToast();
  // Lấy activeTeacher từ TeacherLayout context
  const { activeTeacher } = useOutletContext();

  const [dashData, setDashData] = useState(null);
  const [students, setStudents] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [medicationsToday, setMedicationsToday] = useState([]);
  const [showWeek, setShowWeek] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    late: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── Điều hướng tuần ─────────────────────────────────────────────────────
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tuần này, -1 = tuần trước, v.v.
  const [selectedDay, setSelectedDay] = useState(null); // Date object ngày được click

  // Tính ngày đầu tuần dựa theo offset
  const baseWeekStart = getWeekStart(new Date());
  const currentWeekStart = new Date(baseWeekStart);
  currentWeekStart.setDate(baseWeekStart.getDate() + weekOffset * 7);

  // 7 ngày của tuần đang xem
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return {
      idx: i,
      label: vi ? DAYS_VI[i] : DAYS_EN[i],
      date: d.getDate(),
      month: d.getMonth() + 1,
      fullDate: new Date(d),
      isToday: d.toDateString() === todayDate.toDateString(),
      isFuture: d > todayDate,
      isWeekend: i === 0 || i === 6,
      isSelected: selectedDay?.toDateString() === d.toDateString(),
    };
  });

  const isTodayWeek = weekOffset === 0;
  const isNextWeekDisabled = weekOffset >= 0;

  // Nhãn tuần đang xem
  const weekLabel = (() => {
    const start = weekDays[0];
    const end = weekDays[6];
    if (weekOffset === 0) return vi ? "Tuần Này" : "This Week";
    if (weekOffset === -1) return vi ? "Tuần Trước" : "Last Week";
    return `${start.date}/${start.month} – ${end.date}/${end.month}`;
  })();

  const fetchAll = useCallback(async () => {
    if (!activeTeacher) return;
    try {
      const [dashRes, medRes] = await Promise.all([
        // Truyền teacherId để backend tìm đúng giáo viên (không phụ thuộc JWT userId)
        axiosClient.get(`/teacher/dashboard?teacherId=${activeTeacher.id}`),
        axiosClient.get(`/teacher/medications-today?teacherId=${activeTeacher.id}`).catch(() => ({ data: [] })),
      ]);


      // Điểm danh, thông báo & thuốc từ dashboard
      const dash = dashRes.data || {};
      setDashData(dash);
      setAttendance(dash.attendance || { present: 0, absent: 0, late: 0 });
      setMedicationsToday(medRes.data || []);

      // Fetch học sinh từ class của giáo viên này (truyền teacherId để backend tìm)
      const classRes = await axiosClient.get(`/teacher/my-class?teacherId=${activeTeacher.id}`);
      const myClassData = classRes.data || {};
      setMyClass(myClassData);
      setStudents(myClassData.students || []);

    } catch (err) {
      console.error("Teacher dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTeacher]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Khi click vào ngày trong lịch
  const handleDayClick = (day) => {
    if (day.isFuture) {
      toast({
        message: vi
          ? "Không thể điểm danh ngày tương lai"
          : "Cannot mark future dates",
        type: "error",
      });
      return;
    }
    setSelectedDay(day.fullDate);
    setShowAttModal(true);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
          school
        </span>
      </div>
    );

  const alerts = dashData?.alerts || [];
  const tasks = dashData?.tasks || [];
  const today = new Date().toLocaleDateString(vi ? "vi-VN" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
            {today}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Bảng Tổng Quan" : "Teacher Dashboard"}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {vi ? "Dữ liệu trực tiếp từ hệ thống" : "Live data from the system"}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowWeek((p) => !p)}
            className={`border px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${showWeek ? "bg-primary text-white border-primary shadow-md" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              calendar_today
            </span>
            {vi ? "Xem Lịch Tuần" : "Weekly Calendar"}
          </button>
          <button
            onClick={() => {
              setSelectedDay(new Date());
              setShowAttModal(true);
            }}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">
              edit_calendar
            </span>
            {vi ? "Ghi Nhanh Điểm Danh" : "Quick Attendance"}
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="bg-secondary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">
              auto_stories
            </span>
            {vi ? "Ghi Nhật Ký" : "Write Log"}
          </button>
        </div>
      </div>

      {/* ── Medication Banner ─────────────────────────────────────────── */}
      {medicationsToday.length > 0 && (
        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-pulse">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <span className="material-symbols-outlined text-2xl">medication</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-800">
              {vi ? "Cần cho uống thuốc hôm nay!" : "Medications to dispense today!"}
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              {vi ? (
                <>Bạn có <strong>{medicationsToday.length}</strong> học sinh cần được cho uống thuốc ngày hôm nay. Vui lòng kiểm tra màn hình Quản Lý Thuốc để không bỏ sót.</>
              ) : (
                <>You have <strong>{medicationsToday.length}</strong> students scheduled for medication today. Please check the Medication Manager.</>
              )}
            </p>
            <button 
              onClick={() => navigate('/teacher/medications')}
              className="mt-3 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition"
            >
              {vi ? "Kiểm tra ngay" : "Check now"}
            </button>
          </div>
        </div>
      )}

      {/* ── Week View Panel ─────────────────────────────────────────── */}
      {showWeek && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
          {/* Điều hướng tuần */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWeekOffset((p) => p - 1)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all"
                title={vi ? "Tuần trước" : "Previous week"}
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
              <div>
                <h3 className="font-bold text-primary font-headline text-sm">
                  {weekLabel}
                </h3>
                {!isTodayWeek && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-[10px] text-secondary font-bold hover:underline"
                  >
                    {vi ? "↩ Về tuần hiện tại" : "↩ Back to current week"}
                  </button>
                )}
              </div>
              <button
                onClick={() =>
                  !isNextWeekDisabled && setWeekOffset((p) => p + 1)
                }
                disabled={isNextWeekDisabled}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title={vi ? "Tuần sau" : "Next week"}
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {vi
                ? "Nhấn vào ngày để điểm danh"
                : "Click a day to mark attendance"}
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d) => (
              <button
                key={d.idx}
                onClick={() => handleDayClick(d)}
                disabled={d.isFuture}
                className={`rounded-xl p-3 text-center transition-all relative group ${
                  d.isSelected
                    ? "bg-amber-500 text-white shadow-lg ring-2 ring-amber-300"
                    : d.isToday
                      ? "bg-primary text-white shadow-md"
                      : d.isFuture
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                        : d.isWeekend
                          ? "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          : "bg-slate-50 hover:bg-primary/10 text-slate-600 cursor-pointer hover:shadow-sm"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1">
                  {d.label}
                </p>
                <p className={`text-xl font-black font-headline`}>{d.date}</p>
                {d.isToday && (
                  <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                {d.isSelected && (
                  <span className="inline-block mt-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                {!d.isToday && !d.isWeekend && !d.isFuture && !d.isSelected && (
                  <p className="text-[9px] mt-1 text-slate-400 group-hover:text-primary transition-colors font-bold uppercase">
                    {vi ? "Điểm Danh" : "Attend."}
                  </p>
                )}
                {d.isFuture && (
                  <p className="text-[9px] mt-1 text-slate-300 font-bold uppercase">
                    {vi ? "Sắp Tới" : "Future"}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Hướng dẫn */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary"></span>
              {vi ? "Hôm nay" : "Today"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
              {vi ? "Đang chọn" : "Selected"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-200"></span>
              {vi ? "Cuối tuần" : "Weekend"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200"></span>
              {vi ? "Ngày tương lai (không thể chọn)" : "Future (disabled)"}
            </span>
            <span className="ml-auto text-slate-300">
              <span className="text-amber-500">↩</span>{" "}
              {vi
                ? "Nhấn vào ngày bất kỳ để ghi/bổ sung điểm danh"
                : "Click any past day to record attendance"}
            </span>
          </div>

          {/* Info lớp */}
          {myClass && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
              <span className="material-symbols-outlined text-primary">
                class
              </span>
              <div>
                <p className="text-sm font-bold text-primary">
                  {myClass.class_name || myClass.name}
                </p>
                <p className="text-xs text-slate-500">
                  {vi
                    ? `${myClass.students?.length || 0} học sinh · Nhóm ${myClass.age_group || myClass.ageGroup || "?"}`
                    : `${myClass.students?.length || 0} students · Group ${myClass.age_group || myClass.ageGroup || "?"}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Card Điểm Danh */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-primary font-headline">
                {vi ? "Điểm Danh Hôm Nay" : "Today's Attendance"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {vi
                  ? "Dựa trên học sinh trong lớp bạn phụ trách"
                  : "Based on students in your class"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
          </div>

          {/* 3 số liệu chính */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: vi ? "Có Mặt" : "Present",
                count: attendance.present,
                color: "text-secondary",
                bg: "bg-secondary-container/30",
                icon: "check_circle",
              },
              {
                label: vi ? "Vắng Mặt" : "Absent",
                count: attendance.absent,
                color: "text-error",
                bg: "bg-error-container/30",
                icon: "cancel",
              },
              {
                label: vi ? "Đi Trễ" : "Late",
                count: attendance.late,
                color: "text-tertiary",
                bg: "bg-tertiary-fixed/60",
                icon: "schedule",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`${item.bg} rounded-xl p-4 flex flex-col items-center gap-2`}
              >
                <span
                  className={`material-symbols-outlined ${item.color} text-[22px]`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
                <p
                  className={`text-4xl font-black font-headline ${item.color}`}
                >
                  {String(item.count).padStart(2, "0")}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {attendance.present + attendance.absent + attendance.late > 0 && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1.5">
                <span>{vi ? "Tỷ lệ có mặt" : "Attendance rate"}</span>
                <span>
                  {Math.round(
                    (attendance.present /
                      (attendance.present +
                        attendance.absent +
                        attendance.late)) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((attendance.present / Math.max(1, attendance.present + attendance.absent + attendance.late)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setSelectedDay(new Date());
                setShowAttModal(true);
              }}
              className="flex-1 py-2.5 border-2 border-dashed border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit_calendar
              </span>
              {vi ? "Ghi / Cập Nhật Hôm Nay" : "Record / Update Today"}
            </button>
            <button
              onClick={() => setShowWeek(true)}
              className="px-4 py-2.5 border-2 border-dashed border-amber-300 text-amber-700 font-bold text-sm rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
              title={
                vi
                  ? "Xem và bổ sung điểm danh ngày trước"
                  : "View and backfill past attendance"
              }
            >
              <span className="material-symbols-outlined text-[18px]">
                history
              </span>
              {vi ? "Lịch Sử" : "History"}
            </button>
          </div>
        </div>

        {/* Card Cảnh Báo */}
        <div className="lg:col-span-5 rounded-2xl border shadow-sm p-6 bg-amber-50 border-amber-200">
          <h3 className="text-lg font-bold font-headline mb-1 flex items-center gap-2 text-amber-800">
            <span
              className="material-symbols-outlined text-amber-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            {vi ? "Cảnh Báo" : "Alerts"}
          </h3>
          <p className="text-xs text-amber-600 mb-4">
            {vi
              ? "Học sinh có dị ứng hoặc tình trạng đặc biệt cần chú ý hôm nay"
              : "Students with allergies or special conditions to watch today"}
          </p>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2 text-amber-400">
                <span className="material-symbols-outlined text-4xl">
                  check_circle
                </span>
                <p className="text-sm font-semibold text-amber-700">
                  {vi ? "Không có cảnh báo nào hôm nay" : "No alerts today"}
                </p>
                <p className="text-xs text-amber-500 text-center">
                  {vi
                    ? "Cảnh báo hiện khi học sinh có dị ứng, thiếu cân hoặc cần can thiệp y tế"
                    : "Alerts appear for students with allergies, underweight, or medical needs"}
                </p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3 flex items-start gap-3 border border-amber-100 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                    {alert.name?.charAt(0) || "!"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-amber-800">
                        {alert.name}
                      </p>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {vi ? "Ưu tiên" : "Priority"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      {alert.desc || (vi ? "Cần theo dõi" : "Needs monitoring")}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">
                    chevron_right
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Việc Cần Làm ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-extrabold text-primary font-headline">
              {vi ? "Việc Cần Làm" : "Tasks to Complete"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {vi
                ? "Học sinh có thiếu hụt phát triển cần đánh giá bổ sung"
                : "Students with developmental deficiencies needing follow-up assessment"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/teacher/assessments")}
              className="bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                assignment_add
              </span>
              {vi ? "Đánh Giá Kỹ Năng" : "Skill Assessment"}
            </button>
          </div>
        </div>
        <div className="p-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
              <span className="material-symbols-outlined text-5xl">
                task_alt
              </span>
              <p className="font-semibold text-sm">
                {vi
                  ? "Không có việc cần làm hôm nay!"
                  : "No pending tasks today!"}
              </p>
              <p className="text-xs text-center max-w-xs">
                {vi
                  ? "Các nhiệm vụ sẽ xuất hiện khi có học sinh thiếu đánh giá kỹ năng hoặc cần theo dõi sức khoẻ."
                  : "Tasks appear when students need skill assessments or health follow-up."}
              </p>
            </div>
          ) : (
            tasks.map((task, idx) => (
              <div
                key={idx}
                onClick={() => navigate("/teacher/assessments")}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 cursor-pointer group"
              >
                <div className="w-11 h-11 bg-error-container/30 text-error flex items-center justify-center rounded-full font-bold flex-shrink-0">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    person_alert
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{task.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {task.desc ||
                      (vi
                        ? "Cần đánh giá bổ sung"
                        : "Needs follow-up assessment")}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                  arrow_forward_ios
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Quick Links ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div
          onClick={() => navigate("/teacher/health")}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              monitor_heart
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">
              {vi ? "Theo Dõi Sức Khoẻ" : "Health Monitoring"}
            </h4>
            <p className="text-xs text-slate-500">
              {vi
                ? "Nhập cân nặng, chiều cao, mạch"
                : "Log weight, height, heart rate"}
            </p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
            arrow_forward_ios
          </span>
        </div>

        <div
          onClick={() => navigate("/teacher/assessments")}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assignment
            </span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface">
              {vi ? "Đánh Giá Kỹ Năng" : "Skill Assessment"}
            </h4>
            <p className="text-xs text-slate-500">
              {vi
                ? "Nhận thức, xã hội, vận động, cảm xúc"
                : "Cognitive, social, motor, emotional"}
            </p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
            arrow_forward_ios
          </span>
        </div>
      </div>

      {/* ── Modal Điểm Danh ────────────────────────────────────────────────── */}
      <AttendanceModal
        isOpen={showAttModal}
        onClose={() => {
          setShowAttModal(false);
          setSelectedDay(null);
        }}
        students={students}
        vi={vi}
        onSaved={(newAtt) => setAttendance(newAtt)}
        initialDate={selectedDay}
      />

      <ActivityLogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        students={students}
        vi={vi}
      />
    </>
  );
}
