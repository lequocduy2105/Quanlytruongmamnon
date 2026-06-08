import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const INCIDENT_TYPES = [
  { value: "INJURY", label: "Chấn thương", icon: "personal_injury", color: "text-red-500" },
  { value: "ILLNESS", label: "Ốm / Sốt", icon: "sick", color: "text-orange-500" },
  { value: "BEHAVIOR", label: "Hành vi", icon: "psychology", color: "text-yellow-600" },
  { value: "OTHER", label: "Khác", icon: "report_problem", color: "text-slate-500" },
];

const SEVERITY_LEVELS = [
  { value: "LOW", label: "Nhẹ", bg: "bg-green-100 text-green-700 border-green-300" },
  { value: "MEDIUM", label: "Trung bình", bg: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "HIGH", label: "Nghiêm trọng", bg: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "EMERGENCY", label: "Khẩn cấp", bg: "bg-red-100 text-red-700 border-red-300" },
];

const SEVERITY_BADGE = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  EMERGENCY: "bg-red-100 text-red-700",
};

const TYPE_ICON = { INJURY: "personal_injury", ILLNESS: "sick", BEHAVIOR: "psychology", OTHER: "report_problem" };

export default function IncidentReporter() {
  const { activeTeacher } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    studentId: "",
    incidentType: "INJURY",
    severity: "LOW",
    description: "",
    firstAidTaken: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Zero-Trust: CHỈ lấy học sinh từ lớp giáo viên phụ trách
        // TUYỆT ĐỐI không gọi /academic/students (endpoint Admin — trả về toàn bộ DB)
        const [classRes, incRes] = await Promise.all([
          axiosClient.get('/teacher/my-roster'),
          axiosClient.get('/teacher/incidents'),
        ]);
        // Nếu GV chưa có lớp → empty state, không rò rỉ dữ liệu
        const classStudents = classRes.data?.error
          ? []
          : (classRes.data?.students || []);
        setStudents(classStudents);
        setIncidents(incRes.data || []);
      } catch {
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.description.trim()) {
      setError("Vui lòng chọn học sinh và mô tả sự cố.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await axiosClient.post('/teacher/incidents', {
        studentId: Number(form.studentId),
        incidentType: form.incidentType,
        severity: form.severity,
        description: form.description,
        firstAidTaken: form.firstAidTaken || null,
      });
      setSuccessMsg("✅ Biên bản sự cố đã được gửi. Phụ huynh và BGH đã được thông báo.");
      setForm({ studentId: "", incidentType: "INJURY", severity: "LOW", description: "", firstAidTaken: "" });
      setShowForm(false);
      const res = await axiosClient.get('/teacher/incidents');
      setIncidents(res.data || []);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setError("Gửi biên bản thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headline">Biên Bản Sự Cố</h1>
          <p className="text-sm text-slate-500 mt-1">Ghi nhận và thông báo sự cố cho phụ huynh & BGH</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-red-700 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_alert</span>
          Tạo biên bản
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Form tạo sự cố */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-700 mb-5">Thông tin sự cố</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Chọn học sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Học sinh gặp sự cố *
              </label>
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 outline-none bg-slate-50"
                required
              >
                <option value="">-- Chọn học sinh --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} {s.classroom?.class_name ? `(${s.classroom.class_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Loại sự cố */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Loại sự cố *
              </label>
              <div className="grid grid-cols-4 gap-3">
                {INCIDENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, incidentType: t.value })}
                    className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all text-xs font-bold ${
                      form.incidentType === t.value
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${t.color}`}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mức độ */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mức độ nghiêm trọng *
              </label>
              <div className="flex gap-3">
                {SEVERITY_LEVELS.map((sv) => (
                  <button
                    key={sv.value}
                    type="button"
                    onClick={() => setForm({ ...form, severity: sv.value })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${sv.bg} ${
                      form.severity === sv.value ? "ring-2 ring-offset-1 ring-slate-400 border-current" : "border-transparent opacity-60"
                    }`}
                  >
                    {sv.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mô tả sự cố *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none bg-slate-50"
                placeholder="Mô tả chi tiết diễn biến sự cố..."
                required
              />
            </div>

            {/* Sơ cứu */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sơ cứu đã thực hiện
              </label>
              <input
                value={form.firstAidTaken}
                onChange={(e) => setForm({ ...form, firstAidTaken: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-400 outline-none bg-slate-50"
                placeholder="VD: Băng vết thương, đưa đến phòng y tế..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "📤 Gửi biên bản & thông báo PH"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách biên bản */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-700">Biên bản đã tạo ({incidents.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải...</div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">check_circle</span>
            Chưa có sự cố nào được ghi nhận
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {incidents.map((inc) => (
              <div key={inc.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <span className={`material-symbols-outlined text-2xl mt-0.5 ${INCIDENT_TYPES.find(t => t.value === inc.incidentType)?.color}`}>
                  {TYPE_ICON[inc.incidentType] || "report_problem"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">
                      {inc.student?.full_name || `Học sinh #${inc.studentId}`}
                    </span>
                    <span className="text-xs text-slate-400">
                      {inc.student?.classroom?.class_name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_BADGE[inc.severity]}`}>
                      {SEVERITY_LEVELS.find(s => s.value === inc.severity)?.label}
                    </span>
                    {inc.parentAcknowledgedAt && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                        ✓ PH đã xác nhận
                      </span>
                    )}
                    {inc.principalReviewedAt && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold">
                        ✓ BGH đã duyệt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{inc.description}</p>
                  {inc.firstAidTaken && (
                    <p className="text-xs text-slate-400 mt-0.5">🩹 Sơ cứu: {inc.firstAidTaken}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(inc.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
