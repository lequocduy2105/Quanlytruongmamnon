import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const STATUS_CONFIG = {
  PENDING: { label: "Đang chờ", bg: "bg-amber-100", text: "text-amber-700", icon: "pending" },
  APPROVED: { label: "Đã duyệt ✅", bg: "bg-green-100", text: "text-green-700", icon: "check_circle" },
  REJECTED: { label: "Từ chối ❌", bg: "bg-red-100", text: "text-red-700", icon: "cancel" },
};

export default function ParentLeaveRequests() {
  const { activeStudent: selectedChild } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchRequests = async () => {
    if (!selectedChild?.id) return;
    setLoading(true);
    try {
      const res = await axiosClient.get(`/parent/student/${selectedChild.id}/leave-requests`);
      setRequests(res.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [selectedChild?.id]);

  // Tính toán khả năng hoàn tiền ăn realtime
  const checkEligibility = () => {
    if (!form.startDate) return null;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    const startIsAfterToday = form.startDate > today;
    const startIsTodayAndEarly = form.startDate === today && hour < 17;
    return startIsAfterToday || startIsTodayAndEarly;
  };

  const eligibility = checkEligibility();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChild?.id) return setError("Chưa chọn trẻ.");
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      return setError("Vui lòng điền đầy đủ thông tin.");
    }
    if (form.endDate < form.startDate) {
      return setError("Ngày kết thúc phải sau ngày bắt đầu.");
    }
    setSubmitting(true);
    setError("");
    try {
      await axiosClient.post("/parent/leave-requests", {
        studentId: selectedChild.id,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      setSuccessMsg("✅ Đơn xin nghỉ đã được gửi! BGH sẽ phê duyệt sớm.");
      setForm({ startDate: "", endDate: "", reason: "" });
      setShowForm(false);
      await fetchRequests();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setError("Gửi đơn thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedChild) {
    return (
      <div className="text-center py-20 text-slate-400">
        <span className="material-symbols-outlined text-5xl block mb-3 opacity-40">child_care</span>
        <p className="font-semibold">Vui lòng chọn hoặc liên kết trẻ để xem thông tin</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Removed Child Selector Since Gatekeeper Handles It */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headline">Đơn Xin Nghỉ</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đơn xin nghỉ cho <strong>{selectedChild.full_name}</strong></p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-cyan-700 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">event_busy</span>
          Nộp đơn mới
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

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-700 mb-5">Thông tin nghỉ phép</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ngày bắt đầu nghỉ *
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-400 outline-none bg-slate-50"
                  required
                />
              </div>
            </div>

            {/* Eligibility indicator */}
            {form.startDate && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                eligibility ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                <span className="material-symbols-outlined text-[20px]">
                  {eligibility ? "payments" : "warning"}
                </span>
                {eligibility
                  ? "✅ Đủ điều kiện hoàn tiền ăn (nộp đúng hạn trước 17:00)"
                  : "⚠️ Không đủ điều kiện hoàn tiền ăn (xin muộn sau 17:00 ngày nghỉ)"}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Lý do xin nghỉ *
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-400 outline-none resize-none bg-slate-50"
                placeholder="VD: Bé bị sốt, đi khám bệnh, du lịch gia đình..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "📤 Gửi đơn xin nghỉ"}
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

      {/* Lịch sử đơn */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-700">Lịch sử đơn xin nghỉ ({requests.length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Đang tải...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">event_available</span>
            Chưa có đơn xin nghỉ nào
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map((req) => {
              const st = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
              return (
                <div key={req.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800 text-sm">
                          {req.startDate} → {req.endDate}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        {req.isMealRefundEligible && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                            💰 Hoàn tiền ăn
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">📋 {req.reason}</p>
                      {req.status === "APPROVED" && req.refundAmount > 0 && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          Hoàn: {Number(req.refundAmount).toLocaleString("vi-VN")}đ ({req.mealsToDeduct} ngày ăn)
                        </p>
                      )}
                      {req.status === "REJECTED" && req.reviewNote && (
                        <p className="text-xs text-red-500 mt-1">Lý do từ chối: {req.reviewNote}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        Gửi lúc {new Date(req.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
