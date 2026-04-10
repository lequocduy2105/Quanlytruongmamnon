import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const SEVERITY_BADGE = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  EMERGENCY: "bg-red-100 text-red-700 font-black animate-pulse",
};
const SEVERITY_LABEL = { LOW: "Nhẹ", MEDIUM: "TB", HIGH: "Nghiêm trọng", EMERGENCY: "⚠️ Khẩn cấp" };
const TYPE_LABEL = { INJURY: "Chấn thương", ILLNESS: "Ốm/Sốt", BEHAVIOR: "Hành vi", OTHER: "Khác" };

export default function IncidentDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSeverity]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = filterSeverity ? `?severity=${filterSeverity}` : "";
      const res = await axiosClient.get(`/admin/incidents${params}`);
      setIncidents(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id) => {
    setReviewing(id);
    try {
      await axiosClient.put(`/admin/incidents/${id}/review`);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, principalReviewedAt: new Date().toISOString() } : i
        )
      );
    } catch {
      alert("Cập nhật thất bại.");
    } finally {
      setReviewing(null);
    }
  };

  const unreviewedCount = incidents.filter((i) => !i.principalReviewedAt).length;
  const unackCount = incidents.filter((i) => !i.parentAcknowledgedAt).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-headline">Quản Lý Sự Cố</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi & duyệt các biên bản sự cố toàn trường</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng sự cố", value: incidents.length, icon: "report_problem", color: "text-slate-600", bg: "bg-slate-50" },
          { label: "PH chưa đọc", value: unackCount, icon: "notifications_active", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "BGH chưa duyệt", value: unreviewedCount, icon: "pending_actions", color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-4`}>
            <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-500">Lọc theo mức độ:</span>
        {["", "LOW", "MEDIUM", "HIGH", "EMERGENCY"].map((sv) => (
          <button
            key={sv}
            onClick={() => setFilterSeverity(sv)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filterSeverity === sv
                ? "bg-slate-800 text-white border-slate-800"
                : "border-slate-200 text-slate-500 hover:border-slate-400"
            }`}
          >
            {sv === "" ? "Tất cả" : SEVERITY_LABEL[sv]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải...</div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">check_circle</span>
            Không có sự cố nào
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Học sinh / Lớp", "Loại", "Mức độ", "Mô tả", "Thời gian", "Trạng thái", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{inc.student?.full_name || "—"}</p>
                    <p className="text-xs text-slate-400">{inc.student?.classroom?.name || inc.student?.classroom?.class_name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{TYPE_LABEL[inc.incidentType]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_BADGE[inc.severity]}`}>
                      {SEVERITY_LABEL[inc.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-slate-600 line-clamp-2 text-xs">{inc.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(inc.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${inc.parentAcknowledgedAt ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                        {inc.parentAcknowledgedAt ? "✓ PH đã đọc" : "PH chưa đọc"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${inc.principalReviewedAt ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-500"}`}>
                        {inc.principalReviewedAt ? "✓ BGH đã xem" : "Chờ BGH"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!inc.principalReviewedAt && (
                      <button
                        onClick={() => handleReview(inc.id)}
                        disabled={reviewing === inc.id}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {reviewing === inc.id ? "..." : "BGH đã xem"}
                      </button>
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
