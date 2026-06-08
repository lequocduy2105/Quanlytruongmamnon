import React, { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";
import BaseModal from "../../components/BaseModal";

// ===== ClassFormFields ĐẶT NGOÀI COMPONENT =====
// Quan trọng: nếu đặt trong AcademicSetup React sẽ unmount input
// mỗi lần state thay đổi → mất focus sau mỗi ký tự gõ
const INPUT_CLS =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

function ClassFormFields({ form, setForm, teachers, vi }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          {vi ? "Tên Lớp *" : "Class Name *"}
        </label>
        <input
          required
          value={form.class_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, class_name: e.target.value }))
          }
          className={INPUT_CLS}
          placeholder={vi ? "Nhập tên lớp..." : "Enter class name..."}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          {vi ? "Khối Lớp (Grade Level) *" : "Grade Level *"}
        </label>
        <select
          required
          value={form.grade_level}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, grade_level: e.target.value }))
          }
          className={INPUT_CLS}
        >
          <option value="">
            {vi ? "Chọn khối lớp..." : "Select grade level..."}
          </option>
          <option value="mam">{vi ? "Lớp Mầm (3 tuổi)" : "Mầm — 3 years"}</option>
          <option value="choi">{vi ? "Lớp Chồi (4 tuổi)" : "Chồi — 4 years"}</option>
          <option value="la">{vi ? "Lớp Lá (5 tuổi)" : "Lá — 5 years"}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          {vi ? "Nhóm Tuổi (Mô tả)" : "Age Group (Description)"}
        </label>
        <select
          value={form.age_group}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, age_group: e.target.value }))
          }
          className={INPUT_CLS}
        >
          <option value="">
            {vi ? "Chọn nhóm tuổi..." : "Select age group..."}
          </option>
          <option value="3-4 tuổi">{vi ? "3-4 tuổi" : "3-4 years"}</option>
          <option value="4-5 tuổi">{vi ? "4-5 tuổi" : "4-5 years"}</option>
          <option value="5-6 tuổi">{vi ? "5-6 tuổi" : "5-6 years"}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          {vi ? "Sĩ Số Tối Đa" : "Max Capacity"}
        </label>
        <input
          type="number"
          min="5"
          max="50"
          value={form.capacity}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, capacity: e.target.value }))
          }
          className={INPUT_CLS}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">
          {vi
            ? "Giáo Viên Phụ Trách (tuỳ chọn)"
            : "Assigned Teacher (optional)"}
        </label>
        <select
          value={form.teacher_id}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, teacher_id: e.target.value }))
          }
          className={INPUT_CLS}
        >
          <option value="">
            {vi ? "— Chưa phân công —" : "— Not assigned —"}
          </option>
          {teachers.map((tc) => (
            <option key={tc.id} value={tc.id}>
              {tc.full_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AcademicSetup() {
  const { lang } = useLang();
  const toast = useToast();
  const vi = lang === "vi";

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal tạo lớp mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    class_name: "",
    grade_level: "",
    age_group: "",
    capacity: 25,
    teacher_id: "",
  });

  // Modal chỉnh sửa lớp
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    class_name: "",
    grade_level: "",
    age_group: "",
    capacity: 25,
    teacher_id: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes] = await Promise.all([
        api.get("/academic/classes"),
        api.get("/academic/teachers"),
      ]);
      setClasses(classRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Tạo lớp mới ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post("/academic/classes", {
        class_name: createForm.class_name,
        grade_level: createForm.grade_level || null,
        age_group: createForm.age_group,
        capacity: Number(createForm.capacity),
        teacher_id: createForm.teacher_id
          ? Number(createForm.teacher_id)
          : undefined,
      });
      setShowCreateModal(false);
      setCreateForm({
        class_name: "",
        grade_level: "",
        age_group: "",
        capacity: 25,
        teacher_id: "",
      });
      toast({ message: vi ? "Tạo lớp học thành công!" : "Class created!" });
      fetchData();
    } catch (err) {
      console.error("Lỗi khi tạo lớp:", err);
      toast({
        message: vi ? "Tạo lớp thất bại." : "Failed to create class.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Mở edit modal ---
  const openEdit = (cls) => {
    setEditTarget(cls);
    setEditForm({
      class_name: cls.class_name || cls.name || "",
      grade_level: cls.grade_level || "",
      age_group: cls.age_group || "",
      capacity: cls.capacity || cls.max_capacity || 25,
      teacher_id: cls.teacher?.id || "",
    });
    setShowEditModal(true);
  };

  // --- Lưu thay đổi lớp ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      setSaving(true);
      await api.put(`/academic/classes/${editTarget.id}`, {
        class_name: editForm.class_name,
        grade_level: editForm.grade_level || null,
        age_group: editForm.age_group,
        capacity: Number(editForm.capacity),
        teacher_id: editForm.teacher_id ? Number(editForm.teacher_id) : null,
      });
      setShowEditModal(false);
      toast({
        message: vi ? "Cập nhật lớp học thành công!" : "Class updated!",
      });
      fetchData();
    } catch (err) {
      console.error("Lỗi khi cập nhật lớp:", err);
      toast({
        message: vi ? "Cập nhật thất bại." : "Update failed.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async (cls) => {
    if (
      !window.confirm(
        vi
          ? `Bạn có chắc chắn muốn Lên Lớp cho học sinh lớp "${cls.name || cls.class_name}"?\n- Học sinh lớp Mầm/Chồi sẽ lên khối tiếp theo.\n- Học sinh lớp Lá sẽ Tốt nghiệp.\n- Lớp cũ sẽ được lưu trữ (Archived).`
          : `Are you sure you want to Promote students in "${cls.name || cls.class_name}"?\n- Mầm/Chồi students will move to the next grade.\n- Lá students will Graduate.\n- This class will be Archived.`
      )
    ) {
      return;
    }
    
    try {
      await api.post(`/academic/classes/${cls.id}/promote`);
      toast({ message: vi ? "Đã lên lớp thành công!" : "Promoted successfully!" });
      fetchData();
    } catch (err) {
      console.error("Lỗi khi lên lớp:", err);
      toast({
        message: vi ? "Lên lớp thất bại." : "Promotion failed.",
        type: "error",
      });
    }
  };

  const totalStudents = classes.reduce(
    (sum, cls) => sum + (cls.studentsCount || cls.studentsOnline || cls.students?.length || 0),
    0,
  );
  const totalClasses = classes.length;
  const totalTeachers = teachers.length;
  const unassignedClasses = classes.filter((c) => !c.teacher).length;

  // Tính học kỳ động
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let termName, termStart, termEnd;
  if (month >= 8 || month === 1) {
    const startYear = month >= 8 ? year : year - 1;
    const endYear = startYear + 1;
    termName = vi
      ? `Học Kỳ 1 — ${startYear}/${endYear}`
      : `Term 1 — ${startYear}/${endYear}`;
    termStart = vi ? `Tháng 8/${startYear}` : `Aug/${startYear}`;
    termEnd = vi ? `Tháng 1/${endYear}` : `Jan/${endYear}`;
  } else if (month >= 2 && month <= 6) {
    termName = vi
      ? `Học Kỳ 2 — ${year - 1}/${year}`
      : `Term 2 — ${year - 1}/${year}`;
    termStart = vi ? `Tháng 2/${year}` : `Feb/${year}`;
    termEnd = vi ? `Tháng 6/${year}` : `Jun/${year}`;
  } else {
    termName = vi ? `Hè ${year}` : `Summer ${year}`;
    termStart = vi ? `Tháng 7/${year}` : `Jul/${year}`;
    termEnd = vi ? `Tháng 8/${year}` : `Aug/${year}`;
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-secondary font-bold text-xs uppercase tracking-widest mb-1">
            {vi ? "Module Quản Lý" : "Management Module"}
          </p>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Thiết Lập Chương Trình Học" : "Academic Setup"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {vi
              ? "Cấu hình lớp học và phân công giáo viên"
              : "Configure classes and assign teachers"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-full font-bold text-sm font-headline shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          {vi ? "+ Tạo Lớp Học" : "+ Add Class"}
        </button>
      </div>

      {/* Banner học kỳ */}
      <div className="bg-primary text-white p-8 rounded-3xl mb-8 relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -right-5 bottom-5 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-cyan-200 text-xs font-bold uppercase tracking-widest mb-1">
              {vi ? "Học Kỳ Hiện Tại" : "Current Term"}
            </p>
            <h3 className="text-2xl font-extrabold font-headline">
              {termName}
            </h3>
            <p className="text-cyan-100/80 text-sm mt-2 font-medium">
              {termStart} → {termEnd}
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              {
                value: loading ? "--" : totalClasses,
                label: vi ? "Lớp Học" : "Classes",
              },
              {
                value: loading ? "--" : totalStudents,
                label: vi ? "Học Sinh" : "Students",
              },
              {
                value: loading ? "--" : totalTeachers,
                label: vi ? "Giáo Viên" : "Teachers",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center bg-white/10 px-6 py-4 rounded-2xl"
              >
                <p className="text-3xl font-black font-headline">
                  {item.value}
                </p>
                <p className="text-[11px] font-bold text-cyan-200 uppercase tracking-widest mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            icon: "class",
            color: "text-primary",
            bg: "bg-primary/10",
            value: totalClasses - unassignedClasses,
            label: vi ? "Lớp Có Giáo Viên" : "Classes with Teacher",
            sub: `/ ${totalClasses} ${vi ? "tổng số lớp" : "total"}`,
          },
          {
            icon: "warning",
            color: "text-tertiary",
            bg: "bg-tertiary/10",
            value: unassignedClasses,
            label: vi ? "Lớp Chưa Có Giáo Viên" : "Unassigned Classes",
            sub: vi ? "cần phân công giáo viên" : "need teacher assignment",
          },
          {
            icon: "person_check",
            color: "text-secondary",
            bg: "bg-secondary/10",
            value: teachers.filter((t) =>
              classes.some((c) => c.teacher?.id === t.id),
            ).length,
            label: vi ? "Giáo Viên Có Lớp" : "Teachers with Class",
            sub: `/ ${totalTeachers} ${vi ? "giáo viên" : "teachers"}`,
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}
              >
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {card.label}
              </p>
            </div>
            <p className={`text-3xl font-black font-headline ${card.color}`}>
              {card.value}
            </p>
            <p className="text-xs text-slate-400 mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Danh sách lớp học — với nút CHỈNH SỬA hoạt động */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-extrabold text-primary font-headline text-lg">
            {vi ? "Danh Sách Lớp Học" : "Class Roster"}
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {totalClasses} {vi ? "lớp" : "classes"}
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-6 text-center text-slate-500">
              {vi ? "Đang tải..." : "Loading..."}
            </div>
          ) : classes.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3 text-slate-400">
              <span className="material-symbols-outlined text-4xl">class</span>
              <p className="font-semibold">
                {vi ? "Chưa có lớp học nào." : "No classes yet."}
              </p>
            </div>
          ) : (
            classes.map((cls, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                    {(cls.class_name || cls.name || "C").charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">
                      {cls.class_name || cls.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {vi ? "Giáo viên" : "Teacher"}:{" "}
                      {cls.teacher?.full_name ||
                        (vi ? "— Chưa phân công —" : "— Not assigned —")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-on-surface">
                    {cls.studentsCount || cls.studentsOnline || cls.students?.length || 0}{" "}
                    {vi ? "HS" : "students"}
                    <span className="text-slate-400 font-normal">
                      {" "}
                      / {vi ? "Tối đa" : "Max"}{" "}
                      {cls.capacity || cls.max_capacity}
                    </span>
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary-container/50 text-secondary">
                    {cls.age_group || (vi ? "Chung" : "Mixed")}
                  </span>
                  {!cls.teacher && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary">
                      {vi ? "Cần giáo viên" : "Needs teacher"}
                    </span>
                  )}
                  {/* Nút Lên Lớp */}
                  {cls.status === "active" && (
                    <button
                      onClick={() => handlePromote(cls)}
                      className="text-xs font-bold text-secondary hover:underline hover:text-secondary/80 transition-colors ml-2 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        upgrade
                      </span>
                      {vi ? "Lên Lớp" : "Promote"}
                    </button>
                  )}
                  {/* Nút Chỉnh Sửa */}
                  <button
                    onClick={() => openEdit(cls)}
                    className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors ml-2 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      edit
                    </span>
                    {vi ? "Chỉnh Sửa" : "Edit"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== Modal Tạo Lớp Mới ===== */}
      <BaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={vi ? "Tạo Lớp Học Mới" : "Create New Class"}
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
              form="create-class-form"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {saving
                ? vi
                  ? "Đang tạo..."
                  : "Creating..."
                : vi
                  ? "Tạo Lớp"
                  : "Create Class"}
            </button>
          </>
        }
      >
        <form id="create-class-form" onSubmit={handleCreate}>
          <ClassFormFields
            form={createForm}
            setForm={setCreateForm}
            teachers={teachers}
            vi={vi}
          />
        </form>
      </BaseModal>

      {/* ===== Modal Chỉnh Sửa Lớp ===== */}
      <BaseModal
        isOpen={showEditModal && !!editTarget}
        onClose={() => setShowEditModal(false)}
        title={vi ? "Chỉnh Sửa Lớp Học" : "Edit Class"}
        subtitle={editTarget ? (vi ? `Đang chỉnh sửa: ${editTarget.class_name || editTarget.name}` : `Editing: ${editTarget.class_name || editTarget.name}`) : ""}
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
              form="edit-class-form"
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
        <form id="edit-class-form" onSubmit={handleSaveEdit}>
          <ClassFormFields
            form={editForm}
            setForm={setEditForm}
            teachers={teachers}
            vi={vi}
          />
        </form>
      </BaseModal>
    </>
  );
}
