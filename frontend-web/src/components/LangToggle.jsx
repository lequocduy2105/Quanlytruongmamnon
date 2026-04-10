import React from "react";
import { useLang } from "../contexts/LangContext";

/**
 * Nút chuyển đổi ngôn ngữ VI / EN
 * Hiển thị gọn gàng như một badge pill có animation
 */
export default function LangToggle({ className = "" }) {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      title={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
        border border-slate-200 bg-white hover:bg-slate-50
        text-xs font-bold text-slate-600 hover:text-primary
        transition-all duration-200 hover:border-primary/30 hover:shadow-sm
        select-none cursor-pointer
        ${className}
      `}
    >
      {/* Globe icon */}
      <span className="material-symbols-outlined text-[14px]">language</span>

      {/* Track */}
      <span className="relative inline-flex h-4 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
        <span
          className={`
            absolute top-0.5 h-3 w-3 rounded-full shadow-sm transition-all duration-300
            ${lang === "en" ? "left-[18px] bg-primary" : "left-0.5 bg-slate-400"}
          `}
        />
      </span>

      {/* Text label */}
      <span
        className={`transition-colors ${lang === "en" ? "text-primary font-extrabold" : "text-slate-500"}`}
      >
        {lang === "vi" ? "VI" : "EN"}
      </span>
    </button>
  );
}
