import React, { createContext, useContext, useState, useCallback } from "react";
import translations from "../i18n/translations";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Lưu / đọc ngôn ngữ từ localStorage để giữ qua reload
    return localStorage.getItem("app_lang") || "vi";
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "vi" ? "en" : "vi";
      localStorage.setItem("app_lang", next);
      return next;
    });
  }, []);

  // t('key') trả về chuỗi dịch, fallback về key nếu thiếu
  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations["vi"]?.[key] ?? key,
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
