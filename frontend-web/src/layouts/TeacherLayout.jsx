import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import LangToggle from "../components/LangToggle";
import NotificationBell from "../components/NotificationBell";
import api from "../api/axiosClient";

export default function TeacherLayout() {
  // ─── Gatekeeper state ───────────────────────────────────────────────────────
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const vi = lang === "vi";

  const NAV_ITEMS = [
    { to: "/teacher/dashboard", icon: "dashboard", label: t("nav_dashboard") },
    { to: "/teacher/health", icon: "monitor_heart", label: t("nav_health") },
    {
      to: "/teacher/assessments",
      icon: "assignment",
      label: t("nav_assessments"),
    },
    {
      to: "/teacher/medications",
      icon: "medication",
      label: t("nav_medications") || "Quản Lý Thuốc",
    },
    { to: "/teacher/pickup-check", icon: "directions_car", label: "Đón Trẻ Cuối Ngày" },
    { to: "/teacher/incidents", icon: "add_alert", label: "Biên Bản Sự Cố" },
    { to: "/teacher/finance", icon: "payments", label: "Học Phí Lớp" },
    { to: "/teacher/e-learning", icon: "menu_book", label: "E-Learning" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/teacher/profile");
        if (res.data && !res.data.error) {
          setActiveTeacher(res.data);
        } else {
          console.error("No teacher profile associated with this account.");
          logout();
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Auto-fetching teacher profile failed:", err);
        logout();
        navigate("/login", { replace: true });
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };



  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-primary">
            progress_activity
          </span>
          <span className="font-semibold text-sm">
            {vi ? "Đang xác thực tài khoản..." : "Verifying session..."}
          </span>
        </div>
      </div>
    );
  }

  // If no active teacher after loading, return null (redirection handles this case)
  if (!activeTeacher) {
    return null;
  }

  const isMustChange = localStorage.getItem("mustChangePassword") === "true";

  if (isMustChange) {
    if (pathname !== "/teacher/change-password") {
      return <Navigate to="/teacher/change-password" replace />;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary font-headline">
              {vi ? "Đổi mật khẩu lần đầu" : "Change Password First Time"}
            </h2>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-error flex items-center gap-1 hover:bg-error-container/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              {t("logout")}
            </button>
          </div>
          <Outlet context={{ activeTeacher }} />
        </div>
      </div>
    );
  }

  // ─── Layout đầy đủ (sau khi đã xác nhận) ────────────────────────────────────

  const getLinkClass = (to) => {
    const isActive = pathname.startsWith(to);
    return isActive
      ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50 border-r-4 border-cyan-700 text-cyan-800 font-bold shadow-sm transition-all duration-200"
      : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary transition-all duration-200";
  };

  const currentLabel =
    NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label ||
    t("nav_dashboard");

  const teacherInitial = activeTeacher.full_name?.charAt(0)?.toUpperCase() || "T";

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      {/* ─── Sidebar ─── */}
      <aside className="w-64 shrink-0 fixed left-0 top-0 h-screen bg-slate-50 border-r border-slate-100 z-50 flex flex-col py-6">
        {/* Brand */}
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h1 className="text-base font-black text-cyan-900 leading-none font-headline">
              The Atelier
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {t("teacherPortal")}
            </p>
          </div>
        </div>

        {/* Teacher identity badge */}
        <div className="mx-4 mb-4 px-3 py-3 bg-primary/5 border border-primary/10 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm shrink-0">
              {teacherInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary truncate">
                {activeTeacher.full_name}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">
                {activeTeacher.specializations || (vi ? "Giáo Viên" : "Teacher")}
              </p>
            </div>
          </div>
          {activeTeacher.classroom?.name && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-secondary">
                forest
              </span>
              <p className="text-[11px] font-bold text-secondary truncate">
                {activeTeacher.classroom.name}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 px-4">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={getLinkClass(to)}>
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
              <span className="text-sm font-semibold font-headline">
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 mt-auto space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-error hover:bg-error-container/30 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-surface">
        {/* Top Bar */}
        <header className="h-16 fixed top-0 right-0 left-64 z-40 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-300 text-xl">
              navigate_next
            </span>
            <span className="text-sm font-bold text-on-surface-variant">
              {currentLabel}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LangToggle />
            <NotificationBell />
            <div className="h-7 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold leading-none text-on-surface">
                  {activeTeacher.full_name}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {activeTeacher.specializations || (vi ? "Giáo Viên" : "Teacher")}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold border-2 border-primary/20">
                {teacherInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — truyền activeTeacher qua Outlet context */}
        <main className="flex-1 mt-16 p-8 overflow-auto">
          <div className="max-w-[1400px] mx-auto">
            <Outlet context={{ activeTeacher }} />
          </div>
        </main>
      </div>
    </div>
  );
}
