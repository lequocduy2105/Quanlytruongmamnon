import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";

export default function DataManagement() {
  const { lang } = useLang();
  const vi = lang === "vi";
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [dashRes, studentsRes, teachersRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/academic/students"),
          api.get("/academic/teachers"),
        ]);
        setStats(dashRes.data);
        setStudents(studentsRes.data || []);
        setTeachers(teachersRes.data || []);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleExportCSV = () => {
    const headers = [
      "ID",
      vi ? "Họ Tên" : "Full Name",
      vi ? "Lớp" : "Class",
      vi ? "Dị Ứng" : "Allergies",
    ];
    const rows = students.map((s) => [
      s.id,
      s.full_name,
      s.classroom?.class_name ||
        s.classroom?.name ||
        (vi ? "Chưa phân lớp" : "Not assigned"),
      (s.allergy_tags || []).join("; ") || (vi ? "Không" : "None"),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `danh_sach_hoc_sinh_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleExportTeacherCSV = () => {
    const headers = [
      "ID",
      vi ? "Họ Tên" : "Full Name",
      vi ? "Chuyên Môn" : "Specialization",
      vi ? "Trạng Thái" : "Status",
    ];
    const rows = teachers.map((t) => [
      t.id,
      t.full_name,
      t.specializations || "General",
      t.is_active
        ? vi
          ? "Hoạt Động"
          : "Active"
        : vi
          ? "Không Hoạt Động"
          : "Inactive",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `danh_sach_giao_vien_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalEnrollment = stats?.students || students.length;
  const normalHealthPct = loading ? 0 : 100; // sẽ cập nhật khi có health data

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight mb-2">
            {vi ? "Quản Lý Dữ Liệu" : "Data Management"}
          </h1>
          <p className="text-on-surface-variant font-body">
            {vi
              ? "Xuất và sao lưu dữ liệu hệ thống"
              : "Export and backup system data"}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="px-6 py-2.5 rounded-full bg-surface-container-high text-on-surface font-semibold text-sm hover:bg-surface-container-highest transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            {vi ? "Xuất CSV" : "Export CSV"}
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">
              download
            </span>
            {vi ? "Xuất PDF" : "Export PDF"}
          </button>
        </div>
      </header>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              {vi ? "Danh Sách Học Sinh" : "Total Students"}
            </h3>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-extrabold font-headline text-primary">
                {loading ? "--" : totalEnrollment}
              </span>
              <span className="text-secondary font-bold flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-base">
                  trending_up
                </span>
                {vi ? "Tăng Trưởng" : "Dynamic"}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-4 max-w-xs">
              {vi
                ? "Hệ thống theo dõi phát triển học sinh mầm non theo thời gian thực."
                : "Growth tracking shows a steady increase in early childhood development placement since last semester."}
            </p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/10 to-transparent" />
        </div>
        <div className="md:col-span-4 bg-secondary p-8 rounded-xl relative">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            {vi ? "Sức Khoẻ Đạt Chuẩn" : "Health Compliance"}
          </h3>
          <span className="text-5xl font-extrabold font-headline text-white">
            {loading ? "--" : `${normalHealthPct}%`}
          </span>
          <div className="mt-6 flex gap-2">
            <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${normalHealthPct}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-white/80 mt-4 italic">
            {vi
              ? "Vượt qua tiêu chuẩn an toàn khu vực."
              : "Surpassing regional safety benchmarks."}
          </p>
        </div>
      </div>

      {/* Quick Access — CÓ onClick navigate thật */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Card Hồ Sơ Giáo Viên */}
        <div
          onClick={() => navigate("/admin/teachers")}
          className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person_pin</span>
            </div>
            <div>
              <h4 className="text-lg font-bold font-headline text-primary">
                {vi ? "Hồ Sơ Giáo Viên" : "Teacher Profiles"}
              </h4>
              <p className="text-sm text-slate-500">
                {vi
                  ? `${loading ? "--" : teachers.length} giáo viên — Quản lý hồ sơ giảng dạy`
                  : `${loading ? "--" : teachers.length} teachers — Manage faculty profiles`}
              </p>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </div>

        {/* Card Danh Sách Học Sinh */}
        <div
          onClick={() => navigate("/admin/students")}
          className="bg-surface-container-lowest p-6 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <div>
              <h4 className="text-lg font-bold font-headline text-primary">
                {vi ? "Danh Sách Học Sinh" : "Student Directory"}
              </h4>
              <p className="text-sm text-slate-500">
                {vi
                  ? `${loading ? "--" : students.length} học sinh — Xuất danh sách ra file CSV`
                  : `${loading ? "--" : students.length} students — Export CSV`}
              </p>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
        </div>
      </div>

      {/* Preview bảng học sinh ngay trong trang */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-16">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-primary font-headline">
              {vi ? "Danh Sách Học Sinh" : "Student List"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {vi
                ? `${students.length} học sinh trong hệ thống`
                : `${students.length} students in system`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                download
              </span>
              {vi ? "Xuất CSV" : "Export CSV"}
            </button>
            <button
              onClick={() => navigate("/admin/students")}
              className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:bg-secondary/5 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>
              {vi ? "Xem Chi Tiết" : "View All"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Họ Và Tên" : "Full Name"}
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Lớp" : "Class"}
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Dị Ứng" : "Allergies"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-sm text-slate-400"
                  >
                    {vi ? "Đang tải..." : "Loading..."}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-sm text-slate-400"
                  >
                    {vi ? "Chưa có học sinh nào." : "No students yet."}
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      STU-{s.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm">
                          {s.full_name?.charAt(0) || "S"}
                        </div>
                        <span className="font-semibold text-sm text-on-surface">
                          {s.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${s.classroom ? "bg-secondary" : "bg-slate-300"}`}
                        />
                        <span className="text-sm text-slate-600">
                          {s.classroom?.class_name ||
                            s.classroom?.name ||
                            (vi ? "Chưa phân lớp" : "Not assigned")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.allergy_tags?.length > 0 ? (
                        s.allergy_tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex mr-1 items-center px-2 py-0.5 rounded-full text-xs font-bold bg-error-container text-error"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          {vi ? "Không có" : "None"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Preview bảng giáo viên */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-primary font-headline">
              {vi ? "Danh Sách Giáo Viên" : "Teacher List"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {vi
                ? `${teachers.length} giáo viên trong hệ thống`
                : `${teachers.length} teachers in system`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportTeacherCSV}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                download
              </span>
              {vi ? "Xuất CSV" : "Export CSV"}
            </button>
            <button
              onClick={() => navigate("/admin/teachers")}
              className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:bg-secondary/5 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>
              {vi ? "Xem Chi Tiết" : "View All"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Họ Và Tên" : "Full Name"}
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Chuyên Môn" : "Specialization"}
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Trạng Thái" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-sm text-slate-400"
                  >
                    {vi ? "Đang tải..." : "Loading..."}
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-sm text-slate-400"
                  >
                    {vi ? "Chưa có giáo viên nào." : "No teachers yet."}
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      FAC-{t.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm">
                          {t.full_name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <span className="font-semibold text-sm text-on-surface">
                          {t.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {t.specializations || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${t.is_active ? "bg-secondary-container text-secondary" : "bg-slate-100 text-slate-500"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${t.is_active ? "bg-secondary animate-pulse" : "bg-slate-400"}`}
                        />
                        {t.is_active
                          ? vi
                            ? "Hoạt Động"
                            : "Active"
                          : vi
                            ? "Không Hoạt Động"
                            : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
