import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";
import BaseModal from "../../components/BaseModal";

const SPECIALIZATIONS = [
  { value: "General", vi: "Giáo Dục Tổng Quát", en: "General Education" },
  { value: "Early Childhood", vi: "Giáo Dục Mầm Non", en: "Early Childhood" },
  { value: "Art & Music", vi: "Nghệ Thuật & Âm Nhạc", en: "Art & Music" },
  { value: "Physical Education", vi: "Thể Dục", en: "Physical Education" },
  {
    value: "Language Development",
    vi: "Phát Triển Ngôn Ngữ",
    en: "Language Development",
  },
  { value: "STEM", vi: "STEM", en: "STEM" },
];

export default function TeacherRegistry() {
  const { lang } = useLang();
  const toast = useToast();
  const vi = lang === "vi";

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal thêm mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    specializations: "General",
  });

  const [showSuccessCredentials, setShowSuccessCredentials] = useState(null);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(null);

  // Modal chỉnh sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    specializations: "General",
    is_active: true,
    email: "",
  });

  const fetchData = async () => {
    try {
      const [teacherRes, classRes] = await Promise.all([
        axiosClient.get("/academic/teachers"),
        axiosClient.get("/academic/classes"),
      ]);
      
      const sortedTeachers = (teacherRes.data || []).sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return 0;
      });

      setTeachers(sortedTeachers);
      setClasses(classRes.data || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast({
        message: vi ? "Không thể tải danh sách." : "Failed to load data.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Thêm giáo viên ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axiosClient.post("/academic/teachers", {
        full_name: createForm.full_name,
        email: createForm.email,
        phone_number: createForm.phone_number,
        specializations: createForm.specializations || "General",
      });
      setShowCreateModal(false);
      setCreateForm({ full_name: "", email: "", phone_number: "", specializations: "General" });
      
      if (res.data && res.data.success && res.data.tempPassword) {
        setShowSuccessCredentials({
          email: res.data.email,
          tempPassword: res.data.tempPassword,
        });
      } else {
        toast({ message: vi ? "Thêm giáo viên thành công!" : "Teacher added!" });
      }
      
      fetchData();
    } catch (err) {
      console.error("Lỗi khi thêm giáo viên:", err);
      toast({
        message: vi ? "Thêm giáo viên thất bại." : "Failed to add teacher.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Mở edit modal ---
  const openEdit = (teacher) => {
    setEditTarget(teacher);
    setEditForm({
      full_name: teacher.full_name || "",
      specializations: teacher.specializations || "General",
      is_active: teacher.is_active !== false,
      email: teacher.email || "",
    });
    setShowEditModal(true);
  };

  // --- Lưu chỉnh sửa giáo viên ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget || !editForm.full_name.trim()) return;
    try {
      setSaving(true);
      await axiosClient.put(`/academic/teachers/${editTarget.id}`, {
        full_name: editForm.full_name,
        specializations: editForm.specializations,
        is_active: editForm.is_active,
      });
      setShowEditModal(false);
      toast({
        message: vi ? "Cập nhật giáo viên thành công!" : "Teacher updated!",
      });
      fetchData();
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      toast({
        message: vi ? "Cập nhật thất bại." : "Update failed.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editTarget) return;
    const confirmMessage = vi
      ? `Bạn có chắc chắn muốn cấp lại mật khẩu cho giáo viên ${editForm.full_name || editTarget.full_name}?\nMật khẩu cũ sẽ không còn hiệu lực.`
      : `Are you sure you want to reset the password for teacher ${editForm.full_name || editTarget.full_name}?\nThe old password will be invalidated.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setSaving(true);
      const res = await axiosClient.post(`/academic/teachers/${editTarget.id}/reset-password`);
      if (res.data && res.data.success) {
        setShowEditModal(false);
        setShowResetSuccessModal({
          full_name: editForm.full_name || editTarget.full_name,
          email: editForm.email,
          newTempPassword: res.data.newTempPassword,
        });
      } else {
        toast({
          message: res.data?.error || (vi ? "Không thể cấp lại mật khẩu." : "Failed to reset password."),
          type: "error",
        });
      }
    } catch (err) {
      console.error("Lỗi khi cấp lại mật khẩu:", err);
      toast({
        message: vi ? "Lỗi hệ thống khi cấp lại mật khẩu." : "System error while resetting password.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (teacherId) => {
    if (!window.confirm(vi ? "Bạn có chắc chắn muốn vô hiệu hóa giáo viên này? (Hệ thống sẽ gỡ giáo viên khỏi lớp học hiện tại)" : "Are you sure you want to deactivate this teacher? (They will be unassigned from current classes)")) return;
    try {
      setSaving(true);
      const res = await axiosClient.put(`/academic/teachers/${teacherId}/deactivate`);
      
      if (res.data && res.data.error) {
        toast({ message: res.data.error, type: "error" });
        return;
      }

      toast({ message: vi ? "Đã vô hiệu hóa giáo viên." : "Teacher deactivated." });
      await fetchData();
    } catch (err) {
      toast({ message: vi ? "Lỗi vô hiệu hóa." : "Deactivation failed.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const totalTeachers = teachers.length;
  const activeCount = teachers.filter((tc) => tc.is_active).length;
  const unassignedCount = teachers.filter(
    (tc) => !classes.some((c) => c.teacher?.id === tc.id),
  ).length;

  const getTeacherClasses = (teacher) =>
    classes.filter((c) => c.teacherId === teacher.id);

  const specLabel = (spec) => {
    const found = SPECIALIZATIONS.find((s) => s.value === spec);
    if (!found) return spec || (vi ? "Tổng Quát" : "General");
    return vi ? found.vi : found.en;
  };

  const filtered = teachers
    .filter(
      (tc) =>
        tc.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        tc.specializations?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      // Đẩy người inactive xuống cuối danh sách
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return 0;
    });

  const InputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-1">
            {vi ? "Danh Sách Giáo Viên" : "Teacher Registry"}
          </h2>
          <p className="text-on-surface-variant text-sm font-medium">
            {vi ? "Quản lý đội ngũ giảng dạy" : "Manage teaching staff"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              className="bg-white border-none shadow-sm rounded-lg py-2.5 pl-10 pr-4 text-sm w-56 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={vi ? "Tìm kiếm..." : "Search..."}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">
              person_add
            </span>
            {vi ? "Onboard Giáo Viên" : "Onboard Teacher"}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-5xl">groups</span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
            {vi ? "Danh Sách Giáo Viên" : "Total Teachers"}
          </p>
          <h3 className="font-headline text-4xl font-extrabold text-primary">
            {totalTeachers}
          </h3>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-5xl">
              check_circle
            </span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
            {vi ? "Đang Hoạt Động" : "Active Teachers"}
          </p>
          <h3 className="font-headline text-4xl font-extrabold text-secondary">
            {activeCount}
          </h3>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm h-32">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
            {vi ? "Chưa Phân Lớp" : "Unassigned"}
          </p>
          <h3 className="font-headline text-4xl font-extrabold text-tertiary">
            {unassignedCount}
          </h3>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2">
            <div
              className="bg-tertiary h-1.5 rounded-full transition-all"
              style={{
                width:
                  totalTeachers > 0
                    ? `${Math.round((unassignedCount / totalTeachers) * 100)}%`
                    : "0%",
              }}
            />
          </div>
        </div>
        <div className="bg-primary text-white p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">
              {vi ? "Tổng Lớp Học" : "Total Classes"}
            </p>
            <h3 className="font-headline text-3xl font-extrabold">
              {classes.length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined">class</span>
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="space-y-4 mb-16">
        <h4 className="font-headline text-lg font-bold text-primary mb-2">
          {vi ? "Danh Sách Giáo Viên Hiện Tại" : "Current Faculty Roster"}
        </h4>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">
            {vi ? "Chưa có giáo viên nào." : "No teachers found."}
          </p>
        )}

        {filtered.map((teacher) => {
          const teacherClasses = getTeacherClasses(teacher);
          return (
            <div
              key={teacher.id}
              className={`p-5 rounded-xl flex flex-col md:flex-row md:items-center gap-6 shadow-sm transition-all border-l-4 ${
                teacher.is_active 
                  ? 'bg-surface-container-lowest hover:shadow-md border-primary' 
                  : 'bg-slate-100 opacity-60 grayscale border-slate-300'
              }`}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 flex-1 min-w-[250px]">
                <div className="h-14 w-14 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xl">
                  {teacher.full_name?.charAt(0)?.toUpperCase() || "T"}
                </div>
                <div>
                  <h5 className="font-headline text-base font-bold text-on-surface">
                    {teacher.full_name}
                  </h5>
                  <p className="text-xs font-medium text-on-surface-variant">
                    ID: FAC-{teacher.id}
                  </p>
                </div>
              </div>

              {/* Chuyên môn */}
              <div className="flex-1 min-w-[180px]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-outline mb-1.5">
                  {vi ? "Chuyên Môn" : "Specialization"}
                </p>
                <span className="px-3 py-1 bg-surface-container-low text-primary text-[11px] font-bold rounded-full">
                  {specLabel(teacher.specializations)}
                </span>
              </div>

              {/* Lớp phụ trách */}
              <div className="flex-1 min-w-[150px]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-outline mb-1.5">
                  {vi ? "Lớp Phụ Trách" : "Classes"}
                </p>
                {teacherClasses.length > 0 ? (
                  teacherClasses.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">
                        forest
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        {c.class_name || c.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">
                    {vi ? "— Chưa có lớp —" : "— No class —"}
                  </span>
                )}
              </div>

              {/* Trạng thái */}
              <div className="min-w-[120px]">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full ${teacher.is_active ? "bg-secondary-container text-secondary" : "bg-slate-100 text-slate-500"}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${teacher.is_active ? "bg-secondary animate-pulse" : "bg-slate-400"}`}
                  />
                  {teacher.is_active
                    ? vi
                      ? "Đang hoạt động"
                      : "Active"
                    : vi
                      ? "Không hoạt động"
                      : "Inactive"}
                </span>
              </div>

              {/* ✅ Nút thao tác */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(teacher)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  title={vi ? "Chỉnh sửa giáo viên" : "Edit teacher"}
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                {teacher.is_active && (
                  <button
                    onClick={() => handleDeactivate(teacher.id)}
                    className="p-2 text-slate-400 hover:text-error transition-colors rounded-lg hover:bg-error/5"
                    title={vi ? "Vô hiệu hóa" : "Deactivate"}
                  >
                    <span className="material-symbols-outlined">person_off</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Modal Thêm Giáo Viên ===== */}
      <BaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={vi ? "Thêm Giáo Viên Mới" : "Onboard New Teacher"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {vi ? "Huỷ" : "Cancel"}
            </button>
            <button
              type="submit"
              form="create-teacher-form"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving
                ? vi
                  ? "Đang thêm..."
                  : "Adding..."
                : vi
                  ? "Thêm Giáo Viên"
                  : "Add Teacher"}
            </button>
          </>
        }
      >
        <form id="create-teacher-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {vi ? "Họ Và Tên *" : "Full Name *"}
            </label>
            <input
              required
              value={createForm.full_name}
              onChange={(e) =>
                setCreateForm({ ...createForm, full_name: e.target.value })
              }
              className={InputCls}
              placeholder={vi ? "Nhập họ và tên..." : "Enter full name..."}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {vi ? "Email Đăng Nhập *" : "Login Email *"}
              </label>
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                className={InputCls}
                placeholder={vi ? "Nhập email đăng nhập..." : "Enter login email..."}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {vi ? "Số Điện Thoại *" : "Phone Number *"}
              </label>
              <input
                required
                value={createForm.phone_number}
                onChange={(e) =>
                  setCreateForm({ ...createForm, phone_number: e.target.value })
                }
                className={InputCls}
                placeholder={vi ? "Nhập số điện thoại..." : "Enter phone number..."}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {vi ? "Chuyên Môn" : "Specialization"}
            </label>
            <input
              list="spec-options"
              value={createForm.specializations}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  specializations: e.target.value,
                })
              }
              className={InputCls}
              placeholder={
                vi
                  ? "Ghi hoặc chọn chuyên môn..."
                  : "Type or select specialization..."
              }
            />
            <datalist id="spec-options">
              {SPECIALIZATIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {vi ? s.vi : s.en}
                </option>
              ))}
            </datalist>
          </div>
        </form>
      </BaseModal>

      {/* ===== Modal Chỉnh Sửa Giáo Viên ===== */}
      <BaseModal
        isOpen={showEditModal && !!editTarget}
        onClose={() => setShowEditModal(false)}
        title={vi ? "Chỉnh Sửa Giáo Viên" : "Edit Teacher"}
        subtitle={editTarget ? `ID: FAC-${editTarget.id}` : ""}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {vi ? "Huỷ" : "Cancel"}
            </button>
            <button
              type="submit"
              form="edit-teacher-form"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving
                ? vi
                  ? "Đang lưu..."
                  : "Saving..."
                : vi
                  ? "Lưu Thay Đổi"
                  : "Save Changes"}
            </button>
          </>
        }
      >
        {editTarget && (
          <>
            {/* Avatar preview */}
            <div className="flex items-center gap-4 mb-2 p-4 bg-slate-50 rounded-2xl">
              <div className="h-14 w-14 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xl shrink-0">
                {editForm.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-bold text-on-surface">
                  {editForm.full_name || editTarget.full_name}
                </p>
                <p className="text-xs text-slate-400">
                  {vi ? "Đang chỉnh sửa thông tin" : "Editing profile"}
                </p>
              </div>
            </div>

            <form id="edit-teacher-form" onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {vi ? "Họ Và Tên *" : "Full Name *"}
                </label>
                <input
                  required
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  className={InputCls}
                  placeholder={vi ? "Nhập họ và tên..." : "Enter full name..."}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {vi ? "Email / Tài Khoản" : "Email / Account"}
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    disabled
                    value={editForm.email}
                    className={`${InputCls} opacity-75 bg-slate-100 cursor-not-allowed flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    title={vi ? "Cấp lại mật khẩu" : "Reset password"}
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                    {vi ? "Cấp lại" : "Reset"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {vi ? "Chuyên Môn" : "Specialization"}
                  </label>
                  <input
                    list="spec-options-edit"
                    value={editForm.specializations}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        specializations: e.target.value,
                      })
                    }
                    className={InputCls}
                    placeholder={
                      vi
                        ? "Ghi hoặc chọn chuyên môn..."
                        : "Type or select specialization..."
                    }
                  />
                  <datalist id="spec-options-edit">
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {vi ? s.vi : s.en}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {vi ? "Trạng Thái" : "Status"}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm({ ...editForm, is_active: true })
                      }
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${editForm.is_active ? "border-secondary bg-secondary-container text-secondary" : "border-slate-200 text-slate-400 hover:border-secondary/50"}`}
                    >
                      {vi ? "Hoạt Động" : "Active"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm({ ...editForm, is_active: false })
                      }
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${!editForm.is_active ? "border-error bg-error-container text-error" : "border-slate-200 text-slate-400 hover:border-error/50"}`}
                    >
                      {vi ? "Ngừng" : "Inactive"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lớp phụ trách (chỉ xem — thay đổi qua Academic Setup) */}
              {getTeacherClasses(editTarget).length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-500 mb-1">
                    {vi ? "Lớp Đang Phụ Trách" : "Current Classes"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getTeacherClasses(editTarget).map((c) => (
                      <span
                        key={c.id}
                        className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full"
                      >
                        {c.class_name || c.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {vi
                      ? "(Thay đổi lớp qua Thiết Lập Chương Trình Học)"
                      : "(Change class assignment via Academic Setup)"}
                  </p>
                </div>
              )}
            </form>
          </>
        )}
      </BaseModal>

      {/* ===== Modal Hiển thị Mật khẩu Tạm thời ===== */}
      <BaseModal
        isOpen={!!showSuccessCredentials}
        onClose={() => setShowSuccessCredentials(null)}
        title={vi ? "Thêm Giáo Viên Thành Công!" : "Teacher Onboarded Successfully!"}
        footer={
          <button
            onClick={() => setShowSuccessCredentials(null)}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {vi ? "Đồng Ý" : "OK"}
          </button>
        }
      >
        {showSuccessCredentials && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 font-medium">
              {vi 
                ? "Vui lòng bàn giao tài khoản sau cho giáo viên:" 
                : "Please hand over the following account credentials to the teacher:"}
            </p>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 font-mono text-sm">
              <div>
                <span className="block text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span>
                <span className="text-base font-bold text-on-surface select-all">{showSuccessCredentials.email}</span>
              </div>
              <div>
                <span className="block text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {vi ? "Mật khẩu tạm thời" : "Temporary Password"}
                </span>
                <span className="text-base font-bold text-error select-all bg-error/5 px-2 py-1 rounded">
                  {showSuccessCredentials.tempPassword}
                </span>
              </div>
            </div>
          </div>
        )}
      </BaseModal>

      {/* ===== Modal Hiển thị Mật khẩu Tạm thời khi Reset ===== */}
      <BaseModal
        isOpen={!!showResetSuccessModal}
        onClose={() => setShowResetSuccessModal(null)}
        title={vi ? "Cấp Lại Mật Khẩu Thành Công" : "Password Reset Success"}
        footer={
          <button
            onClick={() => setShowResetSuccessModal(null)}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {vi ? "Đồng Ý" : "OK"}
          </button>
        }
      >
        {showResetSuccessModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 font-medium">
              {vi 
                ? `Đã cấp lại mật khẩu thành công cho giáo viên ${showResetSuccessModal.full_name}. Mật khẩu tạm thời mới là:` 
                : `Successfully reset password for teacher ${showResetSuccessModal.full_name}. The new temporary password is:`}
            </p>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 font-mono text-sm">
              <div>
                <span className="block text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span>
                <span className="text-base font-bold text-on-surface select-all">{showResetSuccessModal.email}</span>
              </div>
              <div>
                <span className="block text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {vi ? "Mật khẩu tạm thời mới" : "New Temporary Password"}
                </span>
                <span className="text-base font-bold text-error select-all bg-error/5 px-2 py-1 rounded">
                  {showResetSuccessModal.newTempPassword}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex gap-2">
              <span className="material-symbols-outlined text-amber-600">info</span>
              <p>
                {vi
                  ? "Giáo viên sẽ được yêu cầu đổi mật khẩu mới trong lần đăng nhập tiếp theo."
                  : "The teacher will be prompted to change their password on the next login."}
              </p>
            </div>
          </div>
        )}
      </BaseModal>
    </>
  );
}
