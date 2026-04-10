import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

export default function StudentRegistry() {
  const { lang } = useLang();
  const toast = useToast();
  const vi = lang === "vi";

  const [students, setStudents] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");

  // Modal thêm học sinh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    full_name: "",
    class_id: "",
    allergy_tags: "",
    date_of_birth: "",
  });

  // Modal chỉnh sửa học sinh
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    class_id: "",
    allergy_tags: "",
    date_of_birth: "",
    allergy_severity: "NONE",
    blood_type: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    emergency_action: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    try {
      const [studRes, classRes] = await Promise.all([
        axiosClient.get("/academic/students"),
        axiosClient.get("/academic/classes"),
      ]);
      setStudents(studRes.data || []);
      setClasses(classRes.data || []);
    } catch (err) {
      console.error("Error fetching students:", err);
      toast({
        message: vi
          ? "Không thể tải danh sách học sinh."
          : "Failed to load students.",
        type: "error",
      });
    }
  };

  const fetchPendingAssessments = async () => {
    try {
      const res = await axiosClient.get("/academic/assessments");
      return new Set((res.data || []).map((a) => a.student?.id || a.studentId));
    } catch {
      return new Set();
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length === 0) return;
    const calcPending = async () => {
      const assessedIds = await fetchPendingAssessments();
      setPendingCount(students.filter((s) => !assessedIds.has(s.id)).length);
    };
    calcPending();
  }, [students]);

  // --- Thêm học sinh ---
  const handleAddStudent = async () => {
    if (!newForm.full_name.trim()) return;
    const allergies = newForm.allergy_tags
      ? newForm.allergy_tags
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a)
      : [];
    try {
      setSaving(true);
      await axiosClient.post("/academic/students", {
        full_name: newForm.full_name,
        class_id: newForm.class_id ? Number(newForm.class_id) : undefined,
        allergy_tags: allergies,
        date_of_birth: newForm.date_of_birth || undefined,
      });
      setIsModalOpen(false);
      setNewForm({
        full_name: "",
        class_id: "",
        allergy_tags: "",
        date_of_birth: "",
      });
      toast({ message: vi ? "Thêm học sinh thành công!" : "Student added!" });
      fetchStudents();
    } catch (err) {
      console.error("Failed to add student", err);
      toast({
        message: vi ? "Thêm học sinh thất bại." : "Failed to add student.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Mở edit modal ---
  const openEdit = (student) => {
    setEditTarget(student);
    setEditForm({
      full_name: student.full_name || "",
      class_id: student.classroom?.id || "",
      allergy_tags: (student.allergy_tags || []).join(", "),
      date_of_birth: student.date_of_birth
        ? new Date(student.date_of_birth).toISOString().slice(0, 10)
        : "",
      allergy_severity: student.allergy_severity || "NONE",
      blood_type: student.blood_type || "",
      emergency_contact_name: student.emergency_contact_name || "",
      emergency_contact_phone: student.emergency_contact_phone || "",
      emergency_contact_relation: student.emergency_contact_relation || "",
      emergency_action: student.emergency_action || "",
    });
    setIsEditOpen(true);
  };

  // --- Lưu chỉnh sửa ---
  const handleSaveEdit = async () => {
    if (!editTarget || !editForm.full_name.trim()) return;
    const allergies = editForm.allergy_tags
      ? editForm.allergy_tags
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a)
      : [];
    try {
      setSaving(true);
      await axiosClient.put(`/academic/students/${editTarget.id}`, {
        full_name: editForm.full_name,
        class_id: editForm.class_id ? Number(editForm.class_id) : null,
        allergy_tags: allergies,
        date_of_birth: editForm.date_of_birth || null,
      });
      
      // Update safety info via new admin endpoint
      await axiosClient.put(`/admin/students/${editTarget.id}/emergency-info`, {
        allergy_severity: editForm.allergy_severity,
        blood_type: editForm.blood_type,
        emergency_contact_name: editForm.emergency_contact_name,
        emergency_contact_phone: editForm.emergency_contact_phone,
        emergency_contact_relation: editForm.emergency_contact_relation,
        emergency_action: editForm.emergency_action,
      });

      setIsEditOpen(false);
      toast({
        message: vi ? "Cập nhật học sinh thành công!" : "Student updated!",
      });
      fetchStudents();
    } catch (err) {
      console.error("Failed to update student", err);
      toast({
        message: vi ? "Cập nhật thất bại." : "Update failed.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const totalEnrollment = students.length;
  const criticalAlerts = students.filter(
    (s) => s.allergy_tags?.length > 0,
  ).length;
  const filtered = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.classroom?.class_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const InputCls =
    "w-full bg-surface-container-lowest border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all";

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            {vi ? "Danh Sách Học Sinh" : "Student Registry"}
          </h2>
          <p className="text-on-surface-variant mt-1">
            {vi
              ? "Quản lý toàn bộ hồ sơ học sinh"
              : "Manage all student profiles"}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm"
              placeholder={vi ? "Tìm kiếm..." : "Search..."}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-lg px-6 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            {vi ? "+ Thêm Học Sinh" : "+ Add Student"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            icon: "groups",
            color: "text-primary",
            bg: "bg-surface-container-low",
            value: totalEnrollment,
            label: vi ? "Danh Sách Học Sinh" : "Total Students",
          },
          {
            icon: "emergency",
            color: "text-error",
            bg: "bg-error-container/40",
            value: criticalAlerts,
            label: vi ? "Dị Ứng" : "Allergies",
          },
          {
            icon: "class",
            color: "text-secondary",
            bg: "bg-surface-container-low",
            value: students.filter((s) => s.classroom).length,
            label: vi ? "Đã Phân Lớp" : "Assigned to Class",
          },
          {
            icon: "assignment_late",
            color: "text-tertiary",
            bg: "bg-surface-container-low",
            value: pendingCount,
            label: vi ? "Chưa Được Đánh Giá" : "Pending Assessments",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`${card.bg} p-6 rounded-xl relative overflow-hidden`}
          >
            <div className="bg-white p-3 rounded-lg shadow-sm inline-block mb-4">
              <span className={`material-symbols-outlined ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <h3 className={`text-3xl font-black font-headline ${card.color}`}>
              {card.value}
            </h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-b border-slate-100">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Họ Và Tên" : "Name"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Lớp" : "Class"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Ngày Sinh" : "Date of Birth"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Dị Ứng" : "Allergy"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  {vi ? "Chỉnh Sửa" : "Edit"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center font-bold text-cyan-700">
                        {student.full_name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {student.full_name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          ID: STU-{student.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${student.classroom ? "bg-secondary" : "bg-slate-300"}`}
                      />
                      <span className="text-sm text-on-surface">
                        {student.classroom?.class_name ||
                          student.classroom?.name ||
                          (vi ? "— Chưa phân công —" : "— Not assigned —")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {student.date_of_birth ? (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[16px]">
                          cake
                        </span>
                        <span className="text-sm text-on-surface font-medium">
                          {new Date(student.date_of_birth).toLocaleDateString(
                            vi ? "vi-VN" : "en-US",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">
                        {vi ? "Chưa có" : "Not set"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {student.allergy_tags?.length > 0 ? (
                      student.allergy_tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex mr-1 items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-error"
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
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => openEdit(student)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                      title={vi ? "Chỉnh sửa" : "Edit"}
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    {search
                      ? `${vi ? "Không tìm thấy" : "No results for"} "${search}"`
                      : vi
                        ? "Chưa có học sinh nào."
                        : "No students yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Modal Thêm Học Sinh ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-low flex justify-between items-center">
              <h3 className="font-headline font-bold text-xl text-primary">
                {vi ? "Thêm Học Sinh Mới" : "Add New Student"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Họ Và Tên *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  value={newForm.full_name}
                  onChange={(e) =>
                    setNewForm({ ...newForm, full_name: e.target.value })
                  }
                  className={InputCls}
                  placeholder={vi ? "Nhập họ và tên..." : "Enter full name..."}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Lớp Học (tuỳ chọn)" : "Classroom (optional)"}
                </label>
                <select
                  value={newForm.class_id}
                  onChange={(e) =>
                    setNewForm({ ...newForm, class_id: e.target.value })
                  }
                  className={InputCls}
                >
                  <option value="">
                    {vi ? "Chưa phân lớp" : "Not assigned"}
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name || c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Ngày Tháng Năm Sinh" : "Date of Birth"}
                </label>
                <input
                  type="date"
                  value={newForm.date_of_birth}
                  onChange={(e) =>
                    setNewForm({ ...newForm, date_of_birth: e.target.value })
                  }
                  className={InputCls}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi
                    ? "Dị Ứng (cách nhau bằng dấu phẩy)"
                    : "Allergies (comma-separated)"}
                </label>
                <input
                  type="text"
                  value={newForm.allergy_tags}
                  onChange={(e) =>
                    setNewForm({ ...newForm, allergy_tags: e.target.value })
                  }
                  className={InputCls}
                  placeholder={
                    vi
                      ? "VD: Hải sản, Đậu phộng..."
                      : "E.g. Seafood, Peanuts..."
                  }
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container-low flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                {vi ? "Huỷ" : "Cancel"}
              </button>
              <button
                onClick={handleAddStudent}
                disabled={saving}
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {saving
                  ? vi
                    ? "Đang lưu..."
                    : "Saving..."
                  : vi
                    ? "Thêm Mới"
                    : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Chỉnh Sửa Học Sinh ===== */}
      {isEditOpen && editTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-container-low flex justify-between items-center">
              <div>
                <h3 className="font-headline font-bold text-xl text-primary">
                  {vi ? "Chỉnh Sửa Học Sinh" : "Edit Student"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: STU-{editTarget.id}
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar preview */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center text-2xl font-bold text-cyan-700">
                  {editForm.full_name?.charAt(0) || "?"}
                </div>
                <div className="text-sm text-slate-500">
                  {vi ? "Chỉnh sửa thông tin bên dưới" : "Edit details below"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Họ Và Tên *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  className={InputCls}
                  placeholder={vi ? "Nhập họ và tên..." : "Enter full name..."}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Phân Lớp" : "Assign Class"}
                </label>
                <select
                  value={editForm.class_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, class_id: e.target.value })
                  }
                  className={InputCls}
                >
                  <option value="">
                    {vi ? "Chưa phân lớp (bỏ lớp)" : "No class (unassign)"}
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name || c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {vi ? "Hiện tại: " : "Current: "}
                  <span className="font-semibold">
                    {editTarget.classroom?.class_name ||
                      editTarget.classroom?.name ||
                      (vi ? "Chưa phân lớp" : "Not assigned")}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Ngày Tháng Năm Sinh" : "Date of Birth"}
                </label>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) =>
                    setEditForm({ ...editForm, date_of_birth: e.target.value })
                  }
                  className={InputCls}
                  max={new Date().toISOString().slice(0, 10)}
                />
                {editTarget?.date_of_birth && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {vi ? "Hiện tại: " : "Current: "}
                    <span className="font-semibold">
                      {new Date(editTarget.date_of_birth).toLocaleDateString(
                        vi ? "vi-VN" : "en-US",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi
                    ? "Dị Ứng (cách nhau bằng dấu phẩy)"
                    : "Allergies (comma-separated)"}
                </label>
                <input
                  type="text"
                  value={editForm.allergy_tags}
                  onChange={(e) =>
                    setEditForm({ ...editForm, allergy_tags: e.target.value })
                  }
                  className={InputCls}
                  placeholder={
                    vi
                      ? "VD: Hải sản, Đậu phộng..."
                      : "E.g. Seafood, Peanuts..."
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {vi ? "Mức Dị Ứng" : "Severity"}
                  </label>
                  <select
                    value={editForm.allergy_severity}
                    onChange={(e) => setEditForm({ ...editForm, allergy_severity: e.target.value })}
                    className={InputCls}
                  >
                    <option value="NONE">Không có</option>
                    <option value="MILD">Nhẹ (Mild)</option>
                    <option value="SEVERE">Nặng (Severe)</option>
                    <option value="ANAPHYLACTIC">Sốc phản vệ (Anaphylactic)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {vi ? "Nhóm Máu" : "Blood Type"}
                  </label>
                  <input
                    type="text"
                    value={editForm.blood_type}
                    onChange={(e) => setEditForm({ ...editForm, blood_type: e.target.value })}
                    className={InputCls}
                    placeholder="O+, A-..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {vi ? "Người Liên Hệ Khẩn" : "Emergency Contact"}
                  </label>
                  <input
                    type="text"
                    value={editForm.emergency_contact_name}
                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                    className={InputCls}
                    placeholder={vi ? "VD: Mẹ Nguyễn Thị A" : "E.g. Jane Doe"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {vi ? "SĐT Khẩn Cấp" : "Emergency Phone"}
                  </label>
                  <input
                    type="tel"
                    value={editForm.emergency_contact_phone}
                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                    className={InputCls}
                    placeholder="0912 345 678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Mối Quan Hệ" : "Relationship"}
                </label>
                <input
                  type="text"
                  value={editForm.emergency_contact_relation}
                  onChange={(e) => setEditForm({ ...editForm, emergency_contact_relation: e.target.value })}
                  className={InputCls}
                  placeholder={vi ? "VD: Mẹ, Ba, Ông, Bà..." : "E.g. Mother, Father..."}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {vi ? "Hướng Dẫn Xử Lý Khẩn/Dị Ứng" : "Emergency Action Plan"}
                </label>
                <textarea
                  rows={2}
                  value={editForm.emergency_action}
                  onChange={(e) => setEditForm({ ...editForm, emergency_action: e.target.value })}
                  className={`${InputCls} resize-none`}
                  placeholder="Nếu sốc phản vệ, tiêm Epipen và gọi cấp cứu ngay."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container-low flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors"
              >
                {vi ? "Huỷ" : "Cancel"}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
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
          </div>
        </div>
      )}
    </>
  );
}
