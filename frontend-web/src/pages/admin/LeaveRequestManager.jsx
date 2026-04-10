import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const STATUS_COLUMNS = {
  PENDING: "Mới tiếp nhận",
  APPROVED: "Đang duyệt",
  REJECTED: "Từ chối",
};

const STATUS_CONFIG = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  APPROVED: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

export default function LeaveRequestManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("PENDING");
  const [processing, setProcessing] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectId, setRejectId] = useState(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const statusParam = tab !== "ALL" ? `?status=${tab}` : "";
      const res = await axiosClient.get(`/admin/leave-requests${statusParam}`);
      setRequests(res.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await axiosClient.put(`/admin/leave-requests/${id}/approve`);
      await fetchRequests();
    } catch {
      alert("Phê duyệt thất bại.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setProcessing(rejectId);
    try {
      await axiosClient.put(`/admin/leave-requests/${rejectId}/reject`, { note: rejectNote });
      setRejectId(null);
      setRejectNote("");
      await fetchRequests();
    } catch {
      alert("Từ chối thất bại.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-headline">Duyệt Đơn Xin Nghỉ</h1>
        <p className="text-sm text-slate-500 mt-1">Phê duyệt đơn & tự động điều chỉnh hoàn tiền ăn</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px ${
              tab === s
                ? "border-cyan-600 text-cyan-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {s === "PENDING" ? "⏳ Chờ duyệt" : s === "APPROVED" ? "✅ Đã duyệt" : "❌ Từ chối"}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-4">Lý do từ chối</h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"
              placeholder="Nhập lý do từ chối (không bắt buộc)..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={processing === rejectId}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {processing === rejectId ? "..." : "Xác nhận từ chối"}
              </button>
              <button
                onClick={() => { setRejectId(null); setRejectNote(""); }}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">event_available</span>
            Không có đơn xin nghỉ
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Học sinh / Lớp", "Thời gian nghỉ", "Lý do", "Tiền ăn hoàn", "Gửi lúc", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{req.student?.full_name || "—"}</p>
                    <p className="text-xs text-slate-400">{req.student?.classroom?.name || req.student?.classroom?.class_name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">
                    {req.startDate} → {req.endDate}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    <p className="line-clamp-2 text-xs">{req.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    {req.isMealRefundEligible ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        ✅ Đủ điều kiện
                        {req.refundAmount > 0 && ` · ${Number(req.refundAmount).toLocaleString("vi-VN")}đ`}
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                        ⚠️ Xin muộn
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={processing === req.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === req.id ? "..." : "✓ Duyệt"}
                        </button>
                        <button
                          onClick={() => setRejectId(req.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100"
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                    )}
                    {req.status !== "PENDING" && req.reviewNote && (
                      <p className="text-xs text-slate-400 italic">"{req.reviewNote}"</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
