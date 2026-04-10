import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

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
    specializations: "General",
  });

  // Modal chỉnh sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    specializations: "General",
    is_active: true,
  });

  const fetchData = async () => {
    try {
      const [teacherRes, classRes] = await Promise.all([
        axiosClient.get("/academic/teachers"),
        axiosClient.get("/academic/classes"),
      ]);
      setTeachers(teacherRes.data || []);
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
      await axiosClient.post("/academic/teachers", {
        full_name: createForm.full_name,
        specializations: createForm.specializations || "General",
      });
      setShowCreateModal(false);
      setCreateForm({ full_name: "", specializations: "General" });
      toast({ message: vi ? "Thêm giáo viên thành công!" : "Teacher added!" });
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

  const totalTeachers = teachers.length;
  const activeCount = teachers.filter((tc) => tc.is_active).length;
  const unassignedCount = teachers.filter(
    (tc) => !classes.some((c) => c.teacher?.id === tc.id),
  ).length;

  const getTeacherClasses = (teacher) =>
    classes.filter((c) => c.teacher?.id === teacher.id);

  const specLabel = (spec) => {
    const found = SPECIALIZATIONS.find((s) => s.value === spec);
    if (!found) return spec || (vi ? "Tổng Quát" : "General");
    return vi ? found.vi : found.en;
  };

  const filtered = teachers.filter(
    (tc) =>
      tc.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      tc.specializations?.toLowerCase().includes(search.toLowerCase()),
  );

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
              className="bg-surface-container-lowest p-5 rounded-xl flex flex-col md:flex-row md:items-center gap-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary"
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

              {/* ✅ Nút chỉnh sửa thật */}
              <button
                onClick={() => openEdit(teacher)}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                title={vi ? "Chỉnh sửa giáo viên" : "Edit teacher"}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== Modal Thêm Giáo Viên ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-primary font-headline">
                {vi ? "Thêm Giáo Viên Mới" : "Onboard New Teacher"}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-error"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
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
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {vi ? "Huỷ" : "Cancel"}
                </button>
                <button
                  type="submit"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Chỉnh Sửa Giáo Viên ===== */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-primary font-headline">
                  {vi ? "Chỉnh Sửa Giáo Viên" : "Edit Teacher"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: FAC-{editTarget.id}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-error"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Avatar preview */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
              <div className="h-14 w-14 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-xl">
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

            <form onSubmit={handleSaveEdit} className="space-y-4">
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
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  {vi ? "Trạng Thái" : "Status"}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({ ...editForm, is_active: true })
                    }
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${editForm.is_active ? "border-secondary bg-secondary-container text-secondary" : "border-slate-200 text-slate-400 hover:border-secondary/50"}`}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1 align-middle">
                      check_circle
                    </span>
                    {vi ? "Đang Hoạt Động" : "Active"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({ ...editForm, is_active: false })
                    }
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${!editForm.is_active ? "border-error bg-error-container text-error" : "border-slate-200 text-slate-400 hover:border-error/50"}`}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1 align-middle">
                      cancel
                    </span>
                    {vi ? "Ngừng Hoạt Động" : "Inactive"}
                  </button>
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

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {vi ? "Huỷ" : "Cancel"}
                </button>
                <button
                  type="submit"
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
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
