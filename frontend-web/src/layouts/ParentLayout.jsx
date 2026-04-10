import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import LangToggle from "../components/LangToggle";
import ChildSearchScreen from "../pages/parent/components/ChildSearchScreen";
import NotificationBell from "../components/NotificationBell";

export default function ParentLayout() {
  const [activeStudent, setActiveStudent] = useState(null);

  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const NAV_LINKS = [
    { to: "/parent/dashboard",   label: t("nav_parentDashboard"),  icon: "home" },
    { to: "/parent/health",      label: t("nav_healthRecord"),     icon: "monitor_heart" },
    { to: "/parent/record",      label: t("nav_fullRecord"),       icon: "menu_book" },
    { to: "/parent/feedback",    label: t("nav_teacherFeedback"),  icon: "star" },
    { to: "/parent/invoices",    label: t("nav_invoices"),         icon: "receipt_long" },
    { to: "/parent/medications", label: t("nav_myMedications"),    icon: "medication" },
    { to: "/parent/pickups",     label: t("nav_pickups"),          icon: "directions_walk" },
    { to: "/parent/incidents",        label: "Sự Cố Của Con",       icon: "add_alert" },
    { to: "/parent/leave-requests",   label: "Xin Nghỉ Phép",       icon: "event_busy" },
    { to: "/parent/tickets",          label: "Phản Ánh & Hỗ Trợ",  icon: "support_agent" },
  ];

  // Khi chưa có activeStudent, chúng ta hiển thị màn hình ChildLookupModal ở chế độ toàn phần
  const handleLinked = (student) => {
    setActiveStudent(student);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ─── GATEKEEPER ───
  // Nếu chưa chọn/tìm được học sinh, không hiển thị layout, chỉ hiện màn hình tìm kiếm.
  if (!activeStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative">
        {/* Header nhẹ cho màn hình xác thực */}
        <header className="h-16 px-8 flex justify-between items-center bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">child_care</span>
            <span className="font-extrabold text-cyan-900 font-headline">The Atelier</span>
          </div>
          <div className="flex items-center gap-4">
            <LangToggle />
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-error flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </header>
        <div className="flex-1 w-full bg-slate-50 relative z-10 overflow-y-auto">
          <ChildSearchScreen onFound={handleLinked} vi={t("logout") === "Đăng xuất"} />
        </div>
      </div>
    );
  }

  const getLinkClass = (to) => {
    const isActive =
      pathname === to ||
      (to !== "/parent/dashboard" && pathname.startsWith(to));
    return isActive
      ? "flex items-center gap-3 px-4 py-3 rounded-xl text-cyan-800 font-bold border-r-4 border-cyan-700 bg-cyan-50 transition-all duration-200"
      : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary transition-all duration-200";
  };

  const currentLabel =
    NAV_LINKS.find((n) => pathname.startsWith(n.to))?.label ||
    "Dashboard";

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex relative">
      {/* ─── Sidebar ─── */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-surface-container py-6 z-40">
        {/* Brand */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              child_care
            </span>
          </div>
          <div>
            <h2 className="text-base font-black text-cyan-900 leading-tight font-headline">
              The Atelier
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
              Parent Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
          {NAV_LINKS.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={getLinkClass(to)}>
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
              <span className="font-headline text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-4 pt-4 border-t border-slate-200 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              P
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                Phụ Huynh
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
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 flex justify-between items-center px-8 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-xl">
              navigate_next
            </span>
            <span className="text-sm font-bold text-on-surface-variant">
              {currentLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            <NotificationBell />
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-xs font-bold text-on-surface leading-none">
                Phụ Huynh
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-16">
          <div className="p-8 max-w-7xl mx-auto space-y-10">
            <Outlet context={{ activeStudent }} />
          </div>
        </main>
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-linear-to-tr from-primary-container to-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <span className="material-symbols-outlined">chat_bubble</span>
      </button>
    </div>
  );
}
