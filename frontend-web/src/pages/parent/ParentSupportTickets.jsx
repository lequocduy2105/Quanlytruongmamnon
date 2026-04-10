import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const CATEGORIES = [
  { value: "BILLING", label: "Học phí / Hóa đơn", icon: "receipt_long" },
  { value: "SAFETY", label: "An toàn / Cơ sở vật chất", icon: "security" },
  { value: "CURRICULUM", label: "Chương trình giảng dạy", icon: "school" },
  { value: "TEACHER", label: "Giáo viên", icon: "person" },
  { value: "MEAL", label: "Bữa ăn / Dinh dưỡng", icon: "restaurant" },
  { value: "OTHER", label: "Khác", icon: "help" },
];

const STATUS_CONFIG = {
  OPEN: { label: "Mới", bg: "bg-blue-100", text: "text-blue-700" },
  IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-100", text: "text-amber-700" },
  RESOLVED: { label: "Đã giải quyết ✅", bg: "bg-green-100", text: "text-green-700" },
  CLOSED: { label: "Đã đóng", bg: "bg-slate-100", text: "text-slate-500" },
};

const STAR_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc!"];

export default function ParentSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [rating, setRating] = useState({});
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({
    category: "OTHER",
    subject: "",
    content: "",
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/parent/tickets");
      setTickets(res.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.content.trim()) {
      return setError("Vui lòng điền tiêu đề và nội dung.");
    }
    setSubmitting(true);
    setError("");
    try {
      await axiosClient.post("/parent/tickets", form);
      setSuccessMsg("✅ Phản ánh đã được gửi! BGH sẽ phản hồi trong vòng 24h.");
      setForm({ category: "OTHER", subject: "", content: "" });
      setShowForm(false);
      await fetchTickets();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      setError("Gửi phản ánh thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = async (id, stars) => {
    setRating((prev) => ({ ...prev, [id]: stars }));
    try {
      await axiosClient.put(`/parent/tickets/${id}/rate`, { rating: stars });
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, parentRating: stars } : t))
      );
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headline">Phản Ánh & Hỗ Trợ</h1>
          <p className="text-sm text-slate-500 mt-1">Kênh liên hệ trực tiếp với Ban Giám Hiệu</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-violet-700 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_comment</span>
          Gửi phản ánh
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
          <h2 className="text-lg font-bold text-slate-700 mb-5">Nội dung phản ánh</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Danh mục */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Danh mục
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: c.value })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      form.category === c.value
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tiêu đề */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tiêu đề *
              </label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-400 outline-none bg-slate-50"
                placeholder="Tóm tắt ngắn gọn vấn đề cần phản ánh..."
                required
              />
            </div>

            {/* Nội dung */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nội dung chi tiết *
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-400 outline-none resize-none bg-slate-50"
                placeholder="Mô tả chi tiết sự việc, khi nào xảy ra, tác động như thế nào..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "📤 Gửi phản ánh"}
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

      {/* Danh sách tickets */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải...</div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl text-center py-12 shadow-sm">
            <span className="material-symbols-outlined text-4xl block mb-2 text-violet-300">forum</span>
            <p className="font-bold text-slate-600">Chưa có phản ánh nào</p>
            <p className="text-sm text-slate-400 mt-1">Hãy liên hệ BGH nếu có thắc mắc</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const st = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
            const cat = CATEGORIES.find((c) => c.value === ticket.category);
            const isExpanded = expanded === ticket.id;

            return (
              <div
                key={ticket.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : ticket.id)}
                >
                  <span className="material-symbols-outlined text-2xl text-violet-400">
                    {cat?.icon || "help"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{ticket.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-slate-400">#{ticket.id}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat?.label} · {new Date(ticket.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">
                    {isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                  </span>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.content}</p>

                    {ticket.resolutionNote && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-green-600 mb-1">💬 Phản hồi từ BGH:</p>
                        <p className="text-sm text-green-800">{ticket.resolutionNote}</p>
                      </div>
                    )}

                    {/* Star rating nếu đã resolved */}
                    {ticket.status === "RESOLVED" && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-2">Đánh giá chất lượng xử lý:</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const currentRating = ticket.parentRating ?? (rating[ticket.id] || 0);
                            return (
                              <button
                                key={star}
                                onClick={() => handleRate(ticket.id, star)}
                                className={`text-2xl transition-all ${
                                  star <= currentRating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"
                                }`}
                              >
                                ★
                              </button>
                            );
                          })}
                          {(ticket.parentRating || rating[ticket.id]) && (
                            <span className="ml-2 text-xs text-amber-600 font-semibold">
                              {STAR_LABELS[ticket.parentRating ?? rating[ticket.id]]}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
