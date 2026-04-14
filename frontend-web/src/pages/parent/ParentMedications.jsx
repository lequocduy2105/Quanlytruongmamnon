import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/axiosClient";

const FREQ_LABEL = {
  once_daily: "1 lần / ngày",
  twice_daily: "2 lần / ngày",
  three_times: "3 lần / ngày",
  as_needed: "Khi cần",
};

function fmtTime(t) {
  if (!t) return null;
  return t.slice(0, 5); // HH:mm
}

function fmtDate(d) {
  if (!d) return "Không có hạn";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default function ParentMedications() {
  const { activeStudent } = useOutletContext();
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    medicationName: "",
    dosage: "",
    frequency: "once_daily",
    timeMorning: "",
    timeNoon: "",
    timeAfternoon: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    prescriptionNote: "",
  });

  useEffect(() => {
    if (activeStudent) {
      fetchSchedules(activeStudent.id);
    }
  }, [activeStudent]);

  const fetchSchedules = async (studentId) => {
    setLoadingSchedules(true);
    try {
      const [schedRes, logRes] = await Promise.all([
        api.get(`/parent/student/${studentId}/medications`),
        api.get(`/parent/student/${studentId}/medication-logs`).catch(() => ({ data: [] })),
      ]);
      setSchedules(schedRes.data || []);
      setLogs(logRes.data || []);
    } catch {
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeStudent || !form.medicationName || !form.dosage) return;
    setSaving(true);
    try {
      await api.post("/parent/medications", {
        ...form,
        studentId: activeStudent.id,
      });
      setShowAddForm(false);
      setForm({
        medicationName: "",
        dosage: "",
        frequency: "once_daily",
        timeMorning: "",
        timeNoon: "",
        timeAfternoon: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        prescriptionNote: "",
      });
      fetchSchedules(activeStudent.id);
    } catch (err) {
      alert("Không thể gửi đơn thuốc. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-1">
            Phụ Huynh Portal
          </p>
          <h1 className="text-3xl font-extrabold text-cyan-900 font-headline tracking-tight">
            Đơn Thuốc & Lịch Uống Thuốc
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gửi đơn thuốc để giáo viên theo dõi và cho con uống đúng giờ
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={!activeStudent}
          className="flex items-center gap-2 bg-cyan-800 hover:bg-cyan-900 text-white font-bold px-5 py-2.5 rounded-2xl transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Gửi Đơn Thuốc Mới
        </button>
      </div>

      {/* Removed Child Selector Since Gatekeeper Handles It */}

      {/* ─── Add Form Modal ─── */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="font-black text-cyan-900 text-lg font-headline">Đơn Thuốc Mới</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Điền đầy đủ thông tin để giáo viên cho uống đúng liều
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tên thuốc *
                </label>
                <input
                  required
                  placeholder="VD: Amoxicillin 250mg"
                  value={form.medicationName}
                  onChange={(e) => setForm({ ...form, medicationName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Liều dùng *
                </label>
                <input
                  required
                  placeholder="VD: 1 gói pha với nước ấm"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tần suất uống
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="once_daily">1 lần / ngày (sáng)</option>
                  <option value="twice_daily">2 lần / ngày (sáng + trưa)</option>
                  <option value="three_times">3 lần / ngày (sáng + trưa + chiều)</option>
                  <option value="as_needed">Khi cần thiết</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["timeMorning", "timeNoon", "timeAfternoon"].map((field, i) => {
                  const showField =
                    (i === 0) ||
                    (i === 1 && (form.frequency === "twice_daily" || form.frequency === "three_times")) ||
                    (i === 2 && form.frequency === "three_times");
                  if (!showField) return null;
                  const labels = ["Giờ sáng", "Giờ trưa", "Giờ chiều"];
                  return (
                    <div key={field}>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{labels[i]}</label>
                      <input
                        type="time"
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Ngày bắt đầu *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Ghi chú từ bác sĩ
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú từ đơn bác sĩ hoặc dặn dò thêm..."
                  value={form.prescriptionNote}
                  onChange={(e) => setForm({ ...form, prescriptionNote: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-2xl bg-cyan-800 hover:bg-cyan-900 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  )}
                  {saving ? "Đang gửi..." : "Gửi Đơn Thuốc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Schedules List ─── */}
      {loadingSchedules ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin"
            style={{ animationDuration: "1.2s" }}>
            progress_activity
          </span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 py-20 flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined text-6xl">medication</span>
          <p className="font-bold text-lg">Chưa có đơn thuốc nào</p>
          <p className="text-sm">Nhấn "Gửi Đơn Thuốc Mới" để thêm lịch uống thuốc cho con</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-cyan-900 font-headline">
            Đơn Thuốc Đang Hoạt Động ({schedules.length})
          </h2>
          {schedules.map((s) => {
            const isActive = s.isActive && (!s.endDate || s.endDate >= today);
            const todayLogs = logs.filter((l) => l.scheduleId === s.id);
            return (
              <div
                key={s.id}
                className={`rounded-3xl border p-5 transition-all ${
                  isActive
                    ? "bg-white border-slate-100 shadow-sm"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, #0891b2, #164e63)"
                          : "#94a3b8",
                      }}
                    >
                      <span className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        medication
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-cyan-900 text-base">{s.medicationName}</p>
                      <p className="text-sm text-slate-500">{s.dosage}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full font-semibold border border-cyan-100">
                          {FREQ_LABEL[s.frequency] || s.frequency}
                        </span>
                        {fmtTime(s.timeMorning) && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold border border-amber-100">
                            🌅 {fmtTime(s.timeMorning)}
                          </span>
                        )}
                        {fmtTime(s.timeNoon) && (
                          <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                            ☀️ {fmtTime(s.timeNoon)}
                          </span>
                        )}
                        {fmtTime(s.timeAfternoon) && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-semibold border border-purple-100">
                            🌇 {fmtTime(s.timeAfternoon)}
                          </span>
                        )}
                      </div>
                      {s.prescriptionNote && (
                        <p className="text-xs text-slate-400 mt-2 italic">
                          📋 {s.prescriptionNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 flex-shrink-0">
                    <p>Từ: <strong>{fmtDate(s.startDate)}</strong></p>
                    <p className="mt-0.5">Đến: <strong>{fmtDate(s.endDate)}</strong></p>
                    {!isActive && (
                      <span className="mt-1 inline-block bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Đã kết thúc
                      </span>
                    )}
                  </div>
                </div>

                {/* Today's Log Status */}
                {todayLogs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Ghi nhận hôm nay
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {todayLogs.map((l) => (
                        <span
                          key={l.id}
                          className={`text-xs px-3 py-1 rounded-full font-bold ${
                            l.status === "given"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : l.status === "refused"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {l.status === "given" ? "✅ Đã uống" : l.status === "refused" ? "❌ Từ chối" : "⏸ Bỏ lỡ"}
                          {l.note && ` — ${l.note}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
