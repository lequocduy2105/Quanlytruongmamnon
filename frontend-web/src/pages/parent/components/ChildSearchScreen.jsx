import React, { useState } from "react";
import api from "../../../api/axiosClient";
import { useToast } from "../../../components/Toast";

export default function ChildSearchScreen({ onFound, vi }) {
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    class_name: "",
  });
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim() || !form.date_of_birth || !form.class_name.trim()) {
      setError(
        vi
          ? "Vui lòng điền đầy đủ tên, ngày sinh và lớp học."
          : "Please fill in full name, date of birth and class."
      );
      return;
    }
    setSearching(true);
    try {
      const res = await api.post("/parent/link-child", {
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        class_name: form.class_name.trim(),
      });
      if (res.data?.success && res.data?.student) {
        toast({ message: vi ? "Tìm thấy hồ sơ học sinh!" : "Student record found!" });
        onFound(res.data.student);
      } else {
        setError(
          vi
            ? "Không tìm thấy học sinh khớp thông tin. Vui lòng kiểm tra lại."
            : "No student found. Please verify."
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        (vi ? "Không thể tìm kiếm. Vui lòng thử lại." : "Search failed. Please try again.")
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center -mt-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              child_care
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary font-headline">
            {vi ? "Tìm Hồ Sơ Con" : "Find Your Child"}
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            {vi
              ? "Nhập thông tin để xem hồ sơ học tập, sức khoẻ và đánh giá của con bạn."
              : "Enter your child's details to view records."}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">badge</span>
              {vi ? "Họ và tên học sinh *" : "Full Name *"}
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder={vi ? "Ví dụ: Nguyễn Văn An" : "E.g. Nguyen Van An"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">cake</span>
              {vi ? "Ngày sinh *" : "Date of Birth *"}
            </label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] mr-1 align-middle">class</span>
              {vi ? "Tên lớp học *" : "Class Name *"}
            </label>
            <input
              type="text"
              value={form.class_name}
              onChange={(e) => setForm((p) => ({ ...p, class_name: e.target.value }))}
              placeholder={vi ? "Ví dụ: Lớp Bướm Vui" : "E.g. Lop Buom Vui"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">error</span>
              <p className="text-sm text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {searching ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {vi ? "Đang tìm kiếm..." : "Searching..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">search</span>
                {vi ? "Tìm Hồ Sơ Con" : "Find Child's Record"}
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            {vi
              ? "🔒 Thông tin chỉ hiển thị khi khớp chính xác tên, ngày sinh và lớp học của con bạn."
              : "🔒 Records are only shown when the details match exactly."}
          </p>
        </div>
      </div>
    </div>
  );
}
