import React, { useState } from "react";
import { useLang } from "../../../contexts/LangContext";

// ─── Modal chi tiết học sinh có thiếu sót ────────────────────────────────────
function DeficiencyModal({ open, onClose, items, vi }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b border-slate-100"
          style={{
            background: "linear-gradient(135deg, #fff1f0 0%, #fff 80%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-error-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-error text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
            <div>
              <h3 className="font-black text-cyan-900 font-headline text-lg">
                {vi ? "Học Sinh Cần Xử Lý" : "Students Needing Attention"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {items.length > 0
                  ? `${items.length} ${vi ? "trường hợp phát triển bất thường" : "cases of abnormal development"}`
                  : vi
                    ? "Không có trường hợp nào"
                    : "No cases found"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400 text-xl">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <span
                className="material-symbols-outlined text-5xl text-green-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="font-bold text-lg">
                {vi ? "Tuyệt vời!" : "All Clear!"}
              </p>
              <p className="text-sm text-center">
                {vi
                  ? "Tất cả học sinh đang phát triển bình thường."
                  : "All students are developing normally."}
              </p>
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-red-100 bg-red-50/60 p-4 flex gap-4"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-error flex-shrink-0 flex items-center justify-center font-black text-white font-headline text-base">
                  {(item.studentName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Thông tin cơ bản */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-cyan-900 text-base">
                      {item.studentName}
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      {vi ? "Lớp" : "Class"}: {item.className}
                    </span>
                    <span className="text-[11px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-semibold border border-cyan-100">
                      GV: {item.teacherName}
                    </span>
                  </div>

                  {/* Nội dung thiếu sót */}
                  <div className="bg-red-100/70 border border-red-200 rounded-xl px-3 py-2 mt-1">
                    <p className="text-[10px] font-bold text-error uppercase tracking-wider mb-1">
                      {vi ? "⚠ Thiếu sót ghi nhận:" : "⚠ Deficiency noted:"}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {item.deficiencyLog}
                    </p>
                  </div>

                  {/* Điểm kỹ năng */}
                  <div className="flex gap-4 mt-3">
                    {[
                      {
                        k: vi ? "Nhận thức" : "Cognitive",
                        v: item.cognitiveScore,
                      },
                      { k: vi ? "Xã hội" : "Social", v: item.socialScore },
                      { k: vi ? "Vận động" : "Motor", v: item.motorScore },
                      {
                        k: vi ? "Cảm xúc" : "Emotional",
                        v: item.emotionalScore,
                      },
                    ].map((s, j) => {
                      const val = Number(s.v);
                      const color =
                        val < 5 ? "#e5534b" : val < 7 ? "#f79518" : "#2da44e";
                      return (
                        <div key={j} className="text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            {s.k}
                          </p>
                          <p
                            className="text-base font-black font-headline"
                            style={{ color }}
                          >
                            {val.toFixed(1)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    {vi ? "Ngày ghi nhận:" : "Recorded:"}{" "}
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <p className="text-xs text-slate-400">
            {vi ? "* Nhấn bên ngoài để đóng" : "* Click outside to close"}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-800 hover:bg-cyan-900 text-white rounded-full text-sm font-bold transition-colors"
          >
            {vi ? "Đóng" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPISection ───────────────────────────────────────────────────────────────
export default function KPISection({ stats, deficiencyDetails = [] }) {
  const { t, lang } = useLang();
  const vi = lang === "vi";
  const [defModalOpen, setDefModalOpen] = useState(false);

  if (!stats) return null;

  const timeStr = new Date().toLocaleTimeString(
    lang === "vi" ? "vi-VN" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <>
      <DeficiencyModal
        open={defModalOpen}
        onClose={() => setDefModalOpen(false)}
        items={deficiencyDetails}
        vi={vi}
      />

      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-secondary font-bold text-xs uppercase tracking-widest mb-1">
              {t("dash_morning")}
            </p>
            <h2 className="text-3xl font-extrabold text-cyan-900 font-headline tracking-tight">
              {t("dash_vitality")}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              {t("dash_lastUpdated")}: {timeStr}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tổng Học Sinh */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl group hover:bg-cyan-50 transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <span className="material-symbols-outlined material-symbols-filled">
                  face
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
              {t("dash_totalStudents")}
            </p>
            <p className="text-4xl font-black text-cyan-900 font-headline">
              {stats.students}
            </p>
          </div>

          {/* Giáo Viên */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl group hover:bg-cyan-50 transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <span className="material-symbols-outlined material-symbols-filled">
                  group
                </span>
              </div>
              <span className="text-slate-400 text-xs font-bold bg-surface-container px-2 py-0.5 rounded-full">
                {t("dash_stable")}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
              {t("dash_activeTeachers")}
            </p>
            <p className="text-4xl font-black text-cyan-900 font-headline">
              {stats.teachers}
            </p>
          </div>

          {/* Đánh Giá Phụ Huynh */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl group hover:bg-cyan-50 transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined material-symbols-filled">
                  star
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
              {t("dash_parentRating")}
            </p>
            <p className="text-4xl font-black text-cyan-900 font-headline">
              {stats.rating > 0 ? (
                stats.rating
              ) : (
                <span className="text-base text-slate-400">
                  {t("dash_noRating")}
                </span>
              )}
              {stats.rating > 0 && (
                <span className="text-xl text-slate-300">/5</span>
              )}
            </p>
          </div>

          {/* Vấn Đề Cần Xử Lý — CÓ THỂ NHẤN */}
          <div
            className="bg-surface-container-lowest p-6 rounded-3xl group hover:bg-error-container/20 transition-all duration-300 border border-error-container/0 hover:border-error-container/30 cursor-pointer hover:shadow-md hover:scale-[1.02]"
            onClick={() => setDefModalOpen(true)}
            title={
              vi
                ? "Nhấn để xem danh sách học sinh cần xử lý"
                : "Click to view students needing attention"
            }
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined material-symbols-filled">
                  warning
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {t("dash_actionRequired")}
                </span>
                {/* hint nhấn được */}
                <span className="text-[10px] text-error/70 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[11px]">
                    touch_app
                  </span>
                  {vi ? "Xem chi tiết" : "View details"}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
              {t("dash_deficiencies")}
            </p>
            <p className="text-4xl font-black text-error font-headline">
              {stats.deficiencies}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {vi ? "Nhấn để xem từng học sinh" : "Click to view per student"}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
