import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import LangToggle from "../components/LangToggle";
import NotificationBell from "../components/NotificationBell";
import api from "../api/axiosClient";

export default function ParentLayout() {
  const [children, setChildren] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const vi = lang === "vi";

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

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await api.get("/parent/my-children");
        if (res.data && Array.isArray(res.data)) {
          setChildren(res.data);
          if (res.data.length === 1) {
            setActiveStudent(res.data[0]);
          } else if (res.data.length > 1) {
            const savedId = localStorage.getItem("activeStudentId");
            if (savedId) {
              const found = res.data.find(s => String(s.id) === String(savedId));
              if (found) {
                setActiveStudent(found);
              }
            }
          }
        }
      } catch (err) {
        console.error("Auto-fetching children profiles failed:", err);
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();
  }, []);

  const handleSelectStudent = (student) => {
    setActiveStudent(student);
    localStorage.setItem("activeStudentId", student.id);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ─── GATEKEEPER 1: Forced Password Change ───
  const isMustChange = localStorage.getItem("mustChangePassword") === "true";

  if (isMustChange) {
    if (pathname !== "/parent/change-password") {
      return <Navigate to="/parent/change-password" replace />;
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
              {vi ? "Đăng xuất" : "Logout"}
            </button>
          </div>
          <Outlet context={{ activeStudent }} />
        </div>
      </div>
    );
  }

  // ─── GATEKEEPER 2: Loading State ───
  if (loadingChildren) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-primary">
            progress_activity
          </span>
          <span className="font-semibold text-sm">
            {vi ? "Đang tải thông tin học sinh..." : "Loading student profiles..."}
          </span>
        </div>
      </div>
    );
  }

  // ─── GATEKEEPER 3: No Children linked ───
  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative">
        <header className="h-16 px-8 flex justify-between items-center bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">child_care</span>
            <span className="font-extrabold text-cyan-900 font-headline">The Atelier</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-error flex items-center gap-1 hover:bg-error-container/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            {vi ? "Đăng xuất" : "Logout"}
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {vi ? "Không tìm thấy hồ sơ học sinh" : "No student profile found"}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {vi 
                ? "Tài khoản của bạn chưa được liên kết với học sinh nào. Vui lòng liên hệ với nhà trường để được hỗ trợ."
                : "Your account is not linked to any student. Please contact the school administration for support."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── GATEKEEPER 4: Multi-Child Chooser ───
  if (!activeStudent && children.length > 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative">
        <header className="h-16 px-8 flex justify-between items-center bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">child_care</span>
            <span className="font-extrabold text-cyan-900 font-headline">The Atelier</span>
          </div>
          <div className="flex items-center gap-4">
            <LangToggle />
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-error flex items-center gap-1 hover:bg-error-container/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              {vi ? "Đăng xuất" : "Logout"}
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-cyan-900 font-headline">
              {vi ? "Chào mừng Phụ Huynh!" : "Welcome Parent!"}
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-md">
              {vi 
                ? "Vui lòng chọn học sinh bên dưới để truy cập Cổng thông tin phụ huynh." 
                : "Please choose a student profile to enter the Parent Portal."}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            {children.map((student) => {
              const studentInitial = student.full_name?.charAt(0)?.toUpperCase() || "S";
              return (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group text-left w-full"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                    {studentInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-primary transition-colors truncate">
                      {student.full_name}
                    </h3>
                    {student.classroom?.name ? (
                      <div className="flex items-center gap-1 text-slate-400 mt-1">
                         <span className="material-symbols-outlined text-[16px] text-secondary">
                           forest
                         </span>
                         <span className="text-xs font-bold text-secondary truncate">
                           {student.classroom.name}
                         </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        {vi ? "Chưa phân lớp" : "No classroom assigned"}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all">
                    arrow_forward_ios
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Portal Layout ───
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
      <aside className="hidden md:flex flex-col h-screen w-64 shrink-0 fixed left-0 top-0 bg-slate-50 border-r border-surface-container py-6 z-40">
        {/* Brand */}
        <div className="px-6 mb-4 flex items-center gap-3">
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

        {/* Selected Child Profile */}
        {activeStudent && (
          <div className="mx-4 mb-4 px-3 py-3 bg-primary/5 border border-primary/10 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm shrink-0">
                {activeStudent.full_name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary truncate">
                  {activeStudent.full_name}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">
                  {activeStudent.classroom?.name || (vi ? "Chưa phân lớp" : "Unassigned")}
                </p>
              </div>
            </div>
          </div>
        )}

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
            {/* Switch Child Button */}
            {children.length > 1 && (
              <button
                onClick={() => {
                  setActiveStudent(null);
                  localStorage.removeItem("activeStudentId");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">sync</span>
                {vi ? "Chọn con khác" : "Switch Child"}
              </button>
            )}

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
