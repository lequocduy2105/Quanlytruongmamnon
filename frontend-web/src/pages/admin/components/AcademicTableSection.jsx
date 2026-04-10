import React from "react";
import { useLang } from "../../../contexts/LangContext";

export default function AcademicTableSection({ classes }) {
  const { t } = useLang();

  return (
    <section className="bg-surface-container-lowest rounded-[2rem] overflow-hidden">
      <div className="p-8 flex justify-between items-center bg-surface-container-low/30">
        <div>
          <h3 className="text-2xl font-black text-cyan-900 font-headline">
            {t("academic_title")}
          </h3>
          <p className="text-slate-500 text-sm">{t("academic_sub")}</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined material-symbols-filled text-base">
            add
          </span>
          {t("add")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t("academic_class")}
              </th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t("academic_teacher")}
              </th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t("academic_students")}
              </th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">
                {t("edit")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {classes?.map((cls, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                      <span className="material-symbols-outlined">palette</span>
                    </div>
                    <span className="font-bold text-cyan-900">{cls.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-surface-variant flex items-center justify-center font-bold text-xs">
                      {cls.teacher?.full_name?.charAt(0) || "T"}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {cls.teacher?.full_name || t("academic_noTeacher")}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-cyan-900">
                    {cls.studentsOnline || 0} {t("nav_students")}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-primary font-bold text-xs uppercase tracking-widest hover:underline">
                    {t("edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 text-center border-t border-slate-50">
        <button className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-cyan-900 transition-colors">
          {t("nav_academic")} — {classes?.length || 0} {t("academic_class")}
        </button>
      </div>
    </section>
  );
}
