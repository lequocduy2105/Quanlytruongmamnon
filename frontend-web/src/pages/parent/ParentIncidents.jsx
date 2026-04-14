import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const SEVERITY_CONFIG = {
  LOW: { label: "Nhẹ", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  MEDIUM: { label: "Trung bình", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  HIGH: { label: "Nghiêm trọng", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  EMERGENCY: { label: "⚠️ Khẩn cấp", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-600 animate-pulse" },
};

const TYPE_LABEL = {
  INJURY: "Chấn thương",
  ILLNESS: "Ốm / Sốt",
  BEHAVIOR: "Hành vi",
  OTHER: "Khác",
};

export default function ParentIncidents() {
  const { activeStudent: selectedChild } = useOutletContext();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState(null);
  const [error, setError] = useState("");

  const fetchIncidents = async () => {
    if (!selectedChild?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get(`/parent/student/${selectedChild.id}/incidents`);
      setIncidents(res.data || []);
    } catch {
      setError("Không thể tải dữ liệu sự cố.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild?.id]);

  const handleAcknowledge = async (id) => {
    setAcknowledging(id);
    try {
      await axiosClient.put(`/parent/incidents/${id}/acknowledge`);
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, parentAcknowledgedAt: new Date().toISOString() } : inc
        )
      );
    } catch {
      alert("Xác nhận thất bại, vui lòng thử lại.");
    } finally {
      setAcknowledging(null);
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
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-headline">Sự Cố Của Con</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi các sự cố y tế & an toàn của <strong>{selectedChild.full_name}</strong>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-4xl block mb-2 animate-spin opacity-40">refresh</span>
          Đang tải...
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center py-16 shadow-sm">
          <span className="material-symbols-outlined text-5xl block mb-3 text-green-400">verified_user</span>
          <p className="font-bold text-slate-600">Không có sự cố nào!</p>
          <p className="text-sm text-slate-400 mt-1">Con bạn đang bình an tại trường 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Alert: incident chưa đọc */}
          {incidents.some((i) => !i.parentAcknowledgedAt) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">notifications_active</span>
              Có {incidents.filter((i) => !i.parentAcknowledgedAt).length} sự cố chưa được xác nhận
            </div>
          )}

          {incidents.map((inc) => {
            const sev = SEVERITY_CONFIG[inc.severity] ?? SEVERITY_CONFIG.LOW;
            const unread = !inc.parentAcknowledgedAt;

            return (
              <div
                key={inc.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                  unread ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Severity dot */}
                    <div className="mt-1.5">
                      <div className={`w-3 h-3 rounded-full ${sev.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{TYPE_LABEL[inc.incidentType] || inc.incidentType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.bg} ${sev.text}`}>
                          {sev.label}
                        </span>
                        {!unread && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                            ✓ Đã xác nhận
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{inc.description}</p>
                      {inc.firstAidTaken && (
                        <p className="text-xs text-slate-500 mt-1">
                          🩹 <span className="font-semibold">Sơ cứu:</span> {inc.firstAidTaken}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>
                          👩‍🏫 {inc.teacher?.full_name || "Giáo viên"}
                        </span>
                        <span>•</span>
                        <span>{new Date(inc.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút xác nhận */}
                  {unread && (
                    <button
                      onClick={() => handleAcknowledge(inc.id)}
                      disabled={acknowledging === inc.id}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {acknowledging === inc.id ? "refresh" : "check_circle"}
                      </span>
                      {acknowledging === inc.id ? "..." : "Đã đọc"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
