import React, { useState, useEffect, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

/**
 * MedicationManager — Giáo viên xác nhận cho thuốc / Phụ huynh gửi đơn thuốc
 * Route: /teacher/medications hoặc /admin/medications
 */
export default function MedicationManager() {
  const { lang } = useLang();
  const vi = lang === "vi";
  const toast = useToast();

  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(null); // scheduleId being confirmed
  const [notes, setNotes] = useState({});

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/medications/today");
      setToday(res.data || []);
    } catch (err) {
      console.error("Medication fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const confirmGiven = async (schedule) => {
    setLogging(schedule.id);
    try {
      await axiosClient.post(`/medications/${schedule.id}/log`, {
        administerNote: notes[schedule.id] || "",
        administeredAt: new Date().toISOString(),
      });
      toast({
        message: vi
          ? `✅ Đã ghi nhận cho ${schedule.studentName} uống thuốc`
          : `✅ Medication logged for ${schedule.studentName}`,
      });
      fetchToday();
    } catch {
      toast({
        message: vi ? "Ghi nhận thất bại!" : "Log failed",
        type: "error",
      });
    } finally {
      setLogging(null);
    }
  };

  const statusCfg = {
    pending: {
      badge: "bg-amber-100 text-amber-700",
      label: vi ? "Chờ Cho Uống" : "Pending",
    },
    given: {
      badge: "bg-green-100 text-green-700",
      label: vi ? "Đã Cho Uống" : "Given",
    },
    skipped: {
      badge: "bg-red-100 text-red-700",
      label: vi ? "Bỏ Qua" : "Skipped",
    },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
            {vi ? "Y Tế" : "Health"}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Quản Lý Thuốc" : "Medication Manager"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {vi
              ? "Theo dõi lịch uống thuốc của học sinh hôm nay"
              : "Track today's student medication schedules"}
          </p>
        </div>
        <button
          onClick={fetchToday}
          className="bg-primary/10 text-primary rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {vi ? "Làm Mới" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse">
            medication
          </span>
        </div>
      ) : today.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <span
            className="material-symbols-outlined text-5xl text-green-400 mb-3"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            medication_liquid
          </span>
          <p className="text-lg font-bold text-slate-700">
            {vi
              ? "Không có lịch thuốc hôm nay"
              : "No medications scheduled today"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {vi ? "Tất cả học sinh đều ổn!" : "All students are doing well!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {today.map((schedule) => {
            const cfg =
              statusCfg[schedule.status || "pending"] || statusCfg.pending;
            return (
              <div
                key={schedule.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    face
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-slate-800 text-base">
                      {schedule.studentName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-semibold">
                    💊 {schedule.medicationName}
                    {schedule.dosage ? ` · ${schedule.dosage}` : ""}
                  </p>
                  {schedule.instructions && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">
                      {schedule.instructions}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    🕐{" "}
                    {schedule.timeSlots?.join(", ") ||
                      schedule.scheduledTime ||
                      (vi ? "Theo chỉ định" : "As prescribed")}
                  </p>
                </div>

                {/* Note + Action */}
                {(!schedule.status || schedule.status === "pending") && (
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full md:w-auto">
                    <input
                      type="text"
                      value={notes[schedule.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [schedule.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        vi ? "Ghi chú (tuỳ chọn)" : "Note (optional)"
                      }
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]"
                    />
                    <button
                      onClick={() => confirmGiven(schedule)}
                      disabled={logging === schedule.id}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      {logging === schedule.id
                        ? vi
                          ? "Đang ghi..."
                          : "Logging..."
                        : vi
                          ? "Đã Cho Uống"
                          : "Confirm Given"}
                    </button>
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
