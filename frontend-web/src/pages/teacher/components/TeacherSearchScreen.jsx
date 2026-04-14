import React, { useState } from "react";
import api from "../../../api/axiosClient";
import { useToast } from "../../../components/Toast";

/**
 * TeacherSearchScreen — Gatekeeper cho Teacher Portal
 *
 * Giáo viên nhập tên của mình.
 * Hệ thống tìm trong DB theo tên (không cần userId link).
 * Nếu khớp → cho vào dashboard với lớp phụ trách của giáo viên đó.
 *
 * Lưu ý: không yêu cầu userId vì admin có thể thêm giáo viên mới
 * mà chưa link user_id trong bảng teachers.
 */
export default function TeacherSearchScreen({ onFound, vi }) {
  const [inputName, setInputName] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [matchedTeachers, setMatchedTeachers] = useState([]); // nhiều kết quả trùng tên
  const toast = useToast();

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setMatchedTeachers([]);

    const trimmed = inputName.trim();
    if (!trimmed) {
      setError(
        vi
          ? "Vui lòng nhập họ và tên của bạn."
          : "Please enter your full name."
      );
      return;
    }

    setSearching(true);
    try {
      // Lấy toàn bộ danh sách giáo viên (public trong phạm vi TEACHER role)
      const res = await api.get("/academic/teachers");
      const allTeachers = res.data || [];

      // Lọc theo tên (không phân biệt hoa thường, có dấu)
      const matches = allTeachers.filter(
        (t) => normalize(t.full_name) === normalize(trimmed)
      );

      if (matches.length === 0) {
        setError(
          vi
            ? `Không tìm thấy giáo viên tên "${trimmed}" trong hệ thống. Vui lòng kiểm tra lại tên hoặc liên hệ quản trị viên.`
            : `No teacher named "${trimmed}" found. Please check the name or contact admin.`
        );
        return;
      }

      if (matches.length === 1) {
        // Chỉ có 1 kết quả → vào luôn
        _enter(matches[0]);
      } else {
        // Nhiều giáo viên trùng tên → cho chọn lớp
        setMatchedTeachers(matches);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (vi
          ? "Không thể tìm kiếm. Vui lòng thử lại."
          : "Search failed. Please try again.");
      setError(msg);
    } finally {
      setSearching(false);
    }
  };

  const _enter = (teacher) => {
    toast({
      message: vi
        ? `Xin chào, ${teacher.full_name}! 👋`
        : `Welcome, ${teacher.full_name}! 👋`,
    });
    onFound(teacher);
  };

  return (
    <div className="w-full h-full flex items-center justify-center py-16">
      <div className="w-full max-w-md">
        {/* Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-5xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              badge
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary font-headline">
            {vi ? "Xác Nhận Danh Tính" : "Teacher Login"}
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            {vi
              ? "Nhập họ và tên của bạn để truy cập trang giáo viên."
              : "Enter your full name to access the teacher portal."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-5">
          {/* Nếu có nhiều kết quả trùng tên → chọn lớp */}
          {matchedTeachers.length > 1 ? (
            <>
              <p className="text-sm font-semibold text-slate-600 text-center">
                {vi
                  ? "Có nhiều giáo viên cùng tên. Vui lòng chọn lớp của bạn:"
                  : "Multiple teachers found. Please select your class:"}
              </p>
              <div className="space-y-2">
                {matchedTeachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => _enter(t)}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-base shrink-0">
                      {t.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">
                        {t.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t.classroom?.name ||
                          t.specializations ||
                          (vi ? "Chưa phân lớp" : "No class assigned")}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary ml-auto text-[18px]">
                      arrow_forward_ios
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setMatchedTeachers([]);
                  setInputName("");
                }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                ← {vi ? "Nhập lại tên" : "Try again"}
              </button>
            </>
          ) : (
            <>
              {/* Input tên */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <span className="material-symbols-outlined text-[14px] mr-1 align-middle">
                    person
                  </span>
                  {vi ? "Họ và tên của bạn *" : "Your Full Name *"}
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                  placeholder={
                    vi ? "VD: Trần Ngọc Ánh" : "E.g. Tran Ngoc Anh"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  autoFocus
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">
                    error
                  </span>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSearch}
                disabled={searching}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {searching ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    {vi ? "Đang tìm kiếm..." : "Searching..."}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      login
                    </span>
                    {vi ? "Vào Trang Giáo Viên" : "Enter Teacher Portal"}
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                {vi
                  ? "🔒 Chỉ giáo viên có hồ sơ trong hệ thống mới được truy cập."
                  : "🔒 Access is only granted to teachers registered in the system."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
