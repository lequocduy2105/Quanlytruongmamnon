import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosClient from "../api/axiosClient";

/**
 * NotificationBell — Hiển thị số thông báo chưa đọc và dropdown popup.
 * Dùng trong mọi layout (Admin, Teacher, Parent).
 */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      // Silently fail — notification bell should never break the app
      console.warn("Notification fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await axiosClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  const typeIcon = {
    info: { icon: "info", color: "text-blue-500 bg-blue-50" },
    warning: { icon: "warning", color: "text-amber-500 bg-amber-50" },
    urgent: { icon: "priority_high", color: "text-red-500 bg-red-50" },
    success: { icon: "check_circle", color: "text-green-500 bg-green-50" },
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-full transition-all"
        aria-label="Thông báo"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-800">
              🔔 Thông Báo
              {unread > 0 && (
                <span className="ml-2 text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {unread} chưa đọc
                </span>
              )}
            </h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-primary hover:underline"
              >
                Đọc hết
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
                  notifications
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">
                  notifications_off
                </span>
                Không có thông báo
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const cfg = typeIcon[n.type] || typeIcon.info;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-blue-50/40" : ""}`}
                  >
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {cfg.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-tight ${!n.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}
                      >
                        {n.title || n.content}
                      </p>
                      {n.title && n.content && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {n.content}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-300 mt-1">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString("vi-VN")
                          : ""}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 20 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-center text-xs text-slate-400">
              Xem thêm...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
