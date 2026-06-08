import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";
import BaseModal from "../../components/BaseModal";

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
    is_special_needs: false,
    isAdminOverride: false,
    override_grade_level: "mam",
    parent_name: "",
    parent_email: "",
  });

  const [provisionedParent, setProvisionedParent] = useState(null);

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
    parent_email: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [resetParentPassResult, setResetParentPassResult] = useState(null);
  const [resettingParentPass, setResettingParentPass] = useState(false);

  const fetchStudents = async () => {
    try {
      const [studRes, classRes] = await Promise.all([
        axiosClient.get("/academic/students"),
        axiosClient.get("/academic/classes"),
      ]);
      
      // Sort data ngay khi nhận về (đẩy inactive xuống cuối)
      const sortedStudents = (studRes.data || []).sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
      });

      setStudents(sortedStudents);
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
  const handleAddStudent = async (e) => {
    if (!newForm.full_name.trim()) return;
    if (!newForm.parent_name.trim() || !newForm.parent_email.trim()) {
      toast({
        message: vi ? "Vui lòng nhập đầy đủ thông tin phụ huynh." : "Please enter parent details.",
        type: "error",
      });
      return;
    }
    const allergies = newForm.allergy_tags
      ? newForm.allergy_tags
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a)
      : [];
    try {
      setSaving(true);
      const res = await axiosClient.post("/academic/students/enroll", {
        student_name: newForm.full_name,
        dob: newForm.date_of_birth,
        parent_name: newForm.parent_name,
        parent_email: newForm.parent_email,
        class_id: newForm.class_id ? Number(newForm.class_id) : undefined,
        allergy_tags: allergies,
        is_special_needs: newForm.is_special_needs,
        isAdminOverride: newForm.isAdminOverride,
        override_grade_level: newForm.override_grade_level,
      });

      if (res.data?.tempPassword) {
        setProvisionedParent({
          email: res.data.parent?.email || newForm.parent_email,
          tempPassword: res.data.tempPassword,
        });
      }

      setIsModalOpen(false);
      setNewForm({
        full_name: "",
        class_id: "",
        allergy_tags: "",
        date_of_birth: "",
        is_special_needs: false,
        isAdminOverride: false,
        override_grade_level: "mam",
        parent_name: "",
        parent_email: "",
      });
      toast({ message: vi ? "Đăng ký học sinh thành công!" : "Student enrolled!" });
      fetchStudents();
    } catch (err) {
      console.error("Failed to add student", err);
      let msg = vi ? "Thêm học sinh thất bại." : "Failed to add student.";
      if (err.response?.data?.message) {
        msg = Array.isArray(err.response.data.message) ? err.response.data.message[0] : err.response.data.message;
      }
      toast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // --- Deactivate & Restore ---
  const handleDeactivate = async (studentId) => {
    // Yêu cầu nhập lý do vì backend NestJS bắt buộc
    const reason = window.prompt(
      vi ? "Vui lòng nhập lý do vô hiệu hóa (Bắt buộc):" : "Please enter reason (Required):",
      vi ? "Chuyển trường" : "Transferred"
    );
    
    if (!reason || !reason.trim()) {
      toast({ message: vi ? "Đã hủy thao tác (Cần nhập lý do)." : "Cancelled (Reason required).", type: "error" });
      return;
    }

    try {
      // Đợi API update xong 100%
      const res = await axiosClient.put(`/academic/students/${studentId}/deactivate`, { reason: reason.trim() });
      
      // Check lỗi ngầm từ API (trả về 200 nhưng có message lỗi)
      if (res.data && res.data.error) {
        toast({ message: res.data.error, type: "error" });
        return;
      }

      toast({ message: vi ? "Đã vô hiệu hóa học sinh." : "Student deactivated." });
      
      // Sau đó mới fetch lại data (đã chứa sẵn logic sort bên trong fetchStudents)
      await fetchStudents();
    } catch (err) {
      toast({ message: vi ? "Lỗi vô hiệu hóa." : "Deactivation failed.", type: "error" });
    }
  };

  const handleRestore = async (studentId) => {
    if (!window.confirm(vi ? "Khôi phục học sinh này?" : "Restore this student?")) return;
    try {
      const res = await axiosClient.put(`/academic/students/${studentId}/restore`);
      if (res.data && res.data.error) {
        toast({ message: res.data.error, type: "error" });
        return;
      }
      toast({ message: vi ? "Đã khôi phục học sinh." : "Student restored." });
      await fetchStudents();
    } catch (err) {
      toast({ message: vi ? "Lỗi khôi phục." : "Restore failed.", type: "error" });
    }
  };

  // --- Mở edit modal ---
  const openEdit = async (student) => {
    setEditTarget(student);
    setResetParentPassResult(null);
    setEditForm({
      full_name: student.full_name || "",
      class_id: student.classId || "",
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
      parent_email: "",
    });
    setIsEditOpen(true);
    // Load parent_email từ API
    try {
      setLoadingDetails(true);
      const res = await axiosClient.get(`/academic/students/${student.id}`);
      if (res.data?.parent_email) {
        setEditForm((prev) => ({ ...prev, parent_email: res.data.parent_email }));
      }
    } catch (err) {
      console.warn("Could not load parent email:", err);
    } finally {
      setLoadingDetails(false);
    }
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
        allergy_severity: editForm.allergy_severity,
        blood_type: editForm.blood_type,
        emergency_contact_name: editForm.emergency_contact_name,
        emergency_contact_phone: editForm.emergency_contact_phone,
        emergency_contact_relation: editForm.emergency_contact_relation,
        emergency_action: editForm.emergency_action,
        parent_email: editForm.parent_email || undefined,
      });

      setIsEditOpen(false);
      toast({
        message: vi ? "Cập nhật học sinh thành công!" : "Student updated!",
      });
      fetchStudents();
    } catch (err) {
      console.error("Failed to update student", err);
      let msg = vi ? "Cập nhật thất bại." : "Update failed.";
      if (err.response?.data?.message) {
        msg = Array.isArray(err.response.data.message)
          ? err.response.data.message[0]
          : err.response.data.message;
      }
      toast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // --- Cấp lại mật khẩu phụ huynh ---
  const handleResetParentPass = async () => {
    if (!editTarget) return;
    if (!window.confirm(vi ? "Cấp lại mật khẩu phụ huynh? Họ sẽ phải đổi mật khẩu sau khi đăng nhập lại." : "Reset parent password? They will be forced to change it on next login.")) return;
    try {
      setResettingParentPass(true);
      const res = await axiosClient.post(`/academic/students/${editTarget.id}/reset-parent-password`);
      setResetParentPassResult({
        email: editForm.parent_email,
        newTempPassword: res.data.newTempPassword,
      });
    } catch (err) {
      let msg = vi ? "Cấp lại thất bại." : "Reset failed.";
      if (err.response?.data?.message) msg = err.response.data.message;
      toast({ message: msg, type: "error" });
    } finally {
      setResettingParentPass(false);
    }
  };

  const totalEnrollment = students.length;
  const criticalAlerts = students.filter(
    (s) => s.allergy_tags?.length > 0,
  ).length;
  const filtered = students
    .filter(
      (s) =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.className?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      // Đẩy những người inactive xuống cuối danh sách
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });

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
            value: students.filter((s) => s.classId).length,
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {vi ? "Trạng thái" : "Status"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  {vi ? "Chỉnh Sửa" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className={`transition-colors ${
                    student.status === 'active' 
                      ? 'hover:bg-slate-50/50' 
                      : 'bg-slate-100 opacity-60 grayscale'
                  }`}
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
                        className={`w-2 h-2 rounded-full ${student.classId ? "bg-secondary" : "bg-slate-300"}`}
                      />
                      <span className="text-sm text-on-surface">
                        {student.className === 'Chưa có lớp' ? (vi ? "— Chưa phân công —" : "— Not assigned —") : student.className}
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
                  <td className="px-6 py-5">
                    {student.status === 'active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {student.status === 'graduated' ? 'Tốt nghiệp' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(student)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                      title={vi ? "Chỉnh sửa" : "Edit"}
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    {student.status === 'active' ? (
                      <button
                        onClick={() => handleDeactivate(student.id)}
                        className="p-2 text-slate-400 hover:text-error transition-colors rounded-lg hover:bg-error/5"
                        title={vi ? "Vô hiệu hóa" : "Deactivate"}
                      >
                        <span className="material-symbols-outlined">person_off</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(student.id)}
                        className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                        title={vi ? "Khôi phục" : "Restore"}
                      >
                        <span className="material-symbols-outlined">settings_backup_restore</span>
                      </button>
                    )}
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
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={vi ? "Thêm Học Sinh Mới" : "Add New Student"}
        footer={
          <>
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
          </>
        }
      >
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
            {vi ? "Họ Và Tên Phụ Huynh *" : "Parent Full Name *"}
          </label>
          <input
            type="text"
            value={newForm.parent_name}
            onChange={(e) =>
              setNewForm({ ...newForm, parent_name: e.target.value })
            }
            className={InputCls}
            placeholder={vi ? "Nhập họ tên phụ huynh..." : "Enter parent name..."}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            {vi ? "Email Phụ Huynh (Tài khoản) *" : "Parent Email (Account) *"}
          </label>
          <input
            type="email"
            value={newForm.parent_email}
            onChange={(e) =>
              setNewForm({ ...newForm, parent_email: e.target.value })
            }
            className={InputCls}
            placeholder={vi ? "Nhập email phụ huynh..." : "Enter parent email..."}
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

        <div className="flex gap-4 p-4 rounded-lg bg-surface-container-lowest border border-slate-100">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={newForm.is_special_needs}
              onChange={(e) => setNewForm({ ...newForm, is_special_needs: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            {vi ? "Học sinh đặc biệt" : "Special Needs"}
          </label>
          <label className="flex items-center gap-2 text-sm text-error cursor-pointer">
            <input
              type="checkbox"
              checked={newForm.isAdminOverride}
              onChange={(e) => setNewForm({ ...newForm, isAdminOverride: e.target.checked })}
              className="w-4 h-4 rounded text-error focus:ring-error border-error/50"
            />
            <span className="font-bold">{vi ? "Bỏ qua kiểm tra tuổi" : "Admin Override"}</span>
          </label>
        </div>

        {newForm.isAdminOverride && (
          <div className="p-4 rounded-lg bg-error-container/30 border border-error/20">
            <label className="block text-xs font-bold text-error uppercase tracking-widest mb-1.5">
              {vi ? "Nhóm Lớp Override (Tuổi)" : "Override Grade"}
            </label>
            <select
              value={newForm.override_grade_level}
              onChange={(e) => setNewForm({ ...newForm, override_grade_level: e.target.value })}
              className={InputCls + " border-error/30 focus:border-error focus:ring-error/20 bg-white"}
            >
              <option value="mam">Mầm (3 tuổi)</option>
              <option value="choi">Chồi (4 tuổi)</option>
              <option value="la">Lá (5 tuổi)</option>
            </select>
          </div>
        )}
      </BaseModal>

      {/* ===== Modal Chỉnh Sửa Học Sinh ===== */}
      <BaseModal
        isOpen={isEditOpen && !!editTarget}
        onClose={() => setIsEditOpen(false)}
        title={vi ? "Chỉnh Sửa Học Sinh" : "Edit Student"}
        subtitle={`ID: STU-${editTarget?.id || ""}`}
        footer={
          <>
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
          </>
        }
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center text-2xl font-bold text-cyan-700 shrink-0">
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
              {(editTarget?.className && editTarget.className !== 'Chưa có lớp' && editTarget.className !== 'Chưa phân lớp') ? editTarget.className : (vi ? "Chưa phân lớp" : "Not assigned")}
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {vi ? "Mối Quan Hê" : "Relationship"}
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

        {/* === Tài khoản Phụ Huynh === */}
        <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            {vi ? "Tài khoản Phụ Huynh" : "Parent Account"}
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              {vi ? "Email Đăng Nhập Phụ Huynh" : "Parent Login Email"}
            </label>
            <input
              type="email"
              value={editForm.parent_email}
              onChange={(e) =>
                setEditForm({ ...editForm, parent_email: e.target.value })
              }
              className={InputCls}
              placeholder={
                loadingDetails
                  ? vi ? "Đang tải..." : "Loading..."
                  : vi ? "Email phụ huynh..." : "Parent email..."
              }
              disabled={loadingDetails}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {vi
                ? "Đổi email sẽ cập nhật tài khoản đăng nhập của phụ huynh."
                : "Changing email updates the parent login credential."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetParentPass}
            disabled={resettingParentPass || loadingDetails || !editForm.parent_email}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              {resettingParentPass ? "hourglass_empty" : "lock_reset"}
            </span>
            {resettingParentPass
              ? vi ? "Đang cấp lại..." : "Resetting..."
              : vi ? "Cấp lại Mật khẩu Phụ huynh" : "Reset Parent Password"}
          </button>
          {resetParentPassResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-1">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                {vi ? "Mật khẩu tạm thời mới" : "New temporary password"}
              </p>
              <code className="font-mono font-black text-lg text-green-800 bg-white px-3 py-1 rounded border border-green-200 block tracking-widest">
                {resetParentPassResult.newTempPassword}
              </code>
              <p className="text-[11px] text-green-600">
                {vi
                  ? "Vui lòng cung cấp cho phụ huynh ngay. Họ sẽ bị yêu cầu đổi mật khẩu."
                  : "Share with parent immediately. They must change it on next login."}
              </p>
            </div>
          )}
        </div>
      </BaseModal>

      {/* Modal thông tin tài khoản Phụ huynh mới */}
      <BaseModal
        isOpen={!!provisionedParent}
        onClose={() => setProvisionedParent(null)}
        title={vi ? "Cấp Tài Khoản Phụ Huynh" : "Parent Account Provisioned"}
        footer={
          <button
            onClick={() => setProvisionedParent(null)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:shadow-lg transition-all active:scale-95"
          >
            {vi ? "Đóng" : "Close"}
          </button>
        }
      >
        {provisionedParent && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              {vi
                ? "Tài khoản cho Phụ huynh đã được tạo tự động thành công. Vui lòng cung cấp thông tin đăng nhập bên dưới cho Phụ huynh:"
                : "Parent portal account created successfully. Please share the credentials below with the parent:"}
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100 font-mono text-sm relative">
              <div>
                <span className="text-xs text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">Email / Phone</span>
                <span className="text-on-surface font-bold">{provisionedParent.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">{vi ? "Mật khẩu tạm thời" : "Temporary password"}</span>
                <span className="text-primary font-black text-lg bg-primary/5 px-2 py-0.5 rounded border border-primary/20">{provisionedParent.tempPassword}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">warning</span>
              <p className="text-xs text-amber-800 leading-relaxed font-semibold font-sans">
                {vi
                  ? "Mật khẩu này là tạm thời. Phụ huynh sẽ được yêu cầu đổi mật khẩu mới ngay trong lần đăng nhập đầu tiên."
                  : "This password is temporary. The parent will be forced to change it on their first login."}
              </p>
            </div>
          </div>
        )}
      </BaseModal>
    </>
  );
}
