import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import LangToggle from "../components/LangToggle";
import NotificationBell from "../components/NotificationBell";
import DarkModeToggle from "../components/DarkModeToggle";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: "/admin/dashboard", icon: "dashboard", label: t("nav_dashboard") },
    { to: "/admin/students", icon: "face", label: t("nav_students") },
    { to: "/admin/teachers", icon: "group", label: t("nav_teachers") },
    { to: "/admin/data", icon: "school", label: t("nav_data") },
    {
      to: "/admin/academic-setup",
      icon: "menu_book",
      label: t("nav_academic"),
    },
    {
      to: "/admin/class-reports",
      icon: "assessment",
      label: t("nav_class_reports") || "Báo Cáo Lớp",
    },
    { to: "/admin/reports", icon: "bar_chart", label: t("nav_reports") },
    { to: "/admin/finance",       icon: "payments",        label: t("nav_finance") || "Học Phí" },
    { to: "/admin/menu",          icon: "restaurant_menu", label: "Thực Đơn" },
    { to: "/admin/incidents",     icon: "add_alert",       label: "Sự Cố" },
    { to: "/admin/leave-requests",icon: "event_busy",      label: "Đơn Xin Nghỉ" },
    { to: "/admin/tickets",       icon: "support_agent",   label: "Phản Ánh" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getLinkClass = (to) => {
    const isActive =
      to === "/admin/dashboard"
        ? pathname === "/admin" || pathname === "/admin/dashboard"
        : pathname.startsWith(to);

    return isActive
      ? "flex items-center gap-3 px-4 py-3 rounded-xl text-cyan-800 dark:text-cyan-400 font-bold border-r-4 border-cyan-700 bg-cyan-50 dark:bg-cyan-950/30 transition-all duration-200"
      : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-cyan-400 transition-all duration-200";
  };

  const currentLabel =
    NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label ||
    t("nav_dashboard");

  return (
    <div className="bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 font-body min-h-screen flex">
      {/* ─── Sidebar ─── */}
      <aside className="hidden md:flex flex-col h-screen w-64 shrink-0 fixed left-0 top-0 bg-slate-50 dark:bg-slate-900 border-r border-surface-container dark:border-slate-800 py-6 z-40">
        {/* Brand */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              diamond
            </span>
          </div>
          <div>
            <h2 className="text-base font-black text-cyan-900 leading-tight font-headline">
              {t("systemName")}
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
              {t("systemSub")}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={getLinkClass(to)}>
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
              <span className="font-headline text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {t("adminRole")}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {t("adminSub")}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-error hover:bg-error-container/30 transition-colors text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-surface dark:bg-slate-950">
        {/* Top Bar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 flex justify-between items-center px-8 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-surface-container dark:border-slate-850">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-xl">
              navigate_next
            </span>
            <span className="text-sm font-bold text-on-surface-variant">
              {currentLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* ─── Language Toggle ─── */}
            <LangToggle />
            <DarkModeToggle />

            <NotificationBell />
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-xs font-bold text-on-surface leading-none">
                {t("adminRole")}
              </p>
              <p className="text-[10px] text-slate-400">{t("adminSub")}</p>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="flex-1 pt-16">
          <div className="p-8 max-w-7xl mx-auto space-y-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
