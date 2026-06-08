import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import BaseModal from "../../components/BaseModal";

const CATEGORY_LABEL = {
  BILLING: "Học phí", SAFETY: "An toàn", CURRICULUM: "Giảng dạy",
  TEACHER: "Giáo viên", MEAL: "Bữa ăn", OTHER: "Khác",
};

const STATUS_CONFIG = {
  OPEN: { label: "Mới tiếp nhận", bg: "bg-blue-100", text: "text-blue-700" },
  IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-100", text: "text-amber-700" },
  RESOLVED: { label: "Đã giải quyết", bg: "bg-green-100", text: "text-green-700" },
  CLOSED: { label: "Đã đóng", bg: "bg-slate-100", text: "text-slate-500" },
};

export default function TicketManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [processing, setProcessing] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("IN_PROGRESS");

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const param = filterStatus ? `?status=${filterStatus}` : "";
      const res = await axiosClient.get(`/admin/tickets${param}`);
      setTickets(res.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selectedTicket) return;
    setProcessing(selectedTicket.id);
    try {
      await axiosClient.put(`/admin/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
        resolutionNote: note,
      });
      setSelectedTicket(null);
      setNote("");
      await fetchTickets();
    } catch {
      alert("Cập nhật thất bại.");
    } finally {
      setProcessing(null);
    }
  };

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const avgRating = (() => {
    const rated = tickets.filter((t) => t.parentRating);
    if (!rated.length) return null;
    return (rated.reduce((s, t) => s + t.parentRating, 0) / rated.length).toFixed(1);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-headline">Quản Lý Phản Ánh</h1>
        <p className="text-sm text-slate-500 mt-1">Xử lý và phản hồi phản ánh từ phụ huynh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Mới", value: openCount, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Đang xử lý", value: inProgressCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Đã xử lý", value: resolvedCount, color: "text-green-600", bg: "bg-green-50" },
          { label: "Đánh giá TB", value: avgRating ? `${avgRating} ⭐` : "—", color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-4`}>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filterStatus === s
                ? "bg-slate-800 text-white border-slate-800"
                : "border-slate-200 text-slate-500 hover:border-slate-400"
            }`}
          >
            {s === "" ? "Tất cả" : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Ticket response modal */}
      <BaseModal
        isOpen={!!selectedTicket}
        onClose={() => { setSelectedTicket(null); setNote(""); }}
        title={selectedTicket ? `#${selectedTicket.id} — ${selectedTicket.subject}` : ""}
        subtitle={selectedTicket ? `Phụ huynh: ${selectedTicket.parentId}` : ""}
        maxWidth="max-w-lg"
        footer={
          <>
            <button
              onClick={() => { setSelectedTicket(null); setNote(""); }}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              disabled={selectedTicket && processing === selectedTicket.id}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {selectedTicket && processing === selectedTicket.id ? "Đang cập nhật..." : "💾 Lưu & thông báo PH"}
            </button>
          </>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700">
              {selectedTicket.content}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Cập nhật trạng thái
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50"
              >
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="CLOSED">Đóng ticket</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nội dung phản hồi cho phụ huynh
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none bg-slate-50"
                placeholder="Nhập phản hồi chi tiết để PH hiểu rõ cách xử lý..."
              />
            </div>
          </div>
        )}
      </BaseModal>

      {/* Ticket list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">forum</span>
            Không có phản ánh nào
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["#", "Danh mục", "Tiêu đề", "PH / Học sinh", "Gửi lúc", "Trạng thái", "Đánh giá", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tickets.map((t) => {
                const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.OPEN;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">#{t.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{CATEGORY_LABEL[t.category] || t.category}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-sm line-clamp-1">{t.subject}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{t.content}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>PH #{t.parentId}</p>
                      {t.student?.full_name && <p className="text-slate-400">{t.student.full_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.parentRating ? (
                        <span className="text-amber-500 font-bold">{"★".repeat(t.parentRating)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.status !== "CLOSED" && (
                        <button
                          onClick={() => { setSelectedTicket(t); setNote(t.resolutionNote || ""); setNewStatus(t.status === "OPEN" ? "IN_PROGRESS" : t.status); }}
                          className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-all whitespace-nowrap"
                        >
                          Phản hồi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
