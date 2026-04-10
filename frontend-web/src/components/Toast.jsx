import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

// ─── Toast Context ─────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, type = "success", duration = 3500 }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl
              text-sm font-bold max-w-sm animate-slide-in-right border
              ${
                t.type === "success"
                  ? "bg-white border-secondary/30 text-on-surface"
                  : t.type === "error"
                    ? "bg-error-container border-error/30 text-error"
                    : t.type === "warning"
                      ? "bg-tertiary-fixed border-tertiary/30 text-tertiary"
                      : "bg-white border-slate-200 text-on-surface"
              }`}
          >
            <span
              className={`material-symbols-outlined text-xl shrink-0 ${
                t.type === "success"
                  ? "text-secondary"
                  : t.type === "error"
                    ? "text-error"
                    : t.type === "warning"
                      ? "text-tertiary"
                      : "text-primary"
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {t.type === "success"
                ? "check_circle"
                : t.type === "error"
                  ? "error"
                  : t.type === "warning"
                    ? "warning"
                    : "info"}
            </span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 opacity-40 hover:opacity-100 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
