import React, { useState, useEffect } from "react";
import api from "../api/axiosClient";

/**
 * ChildLookupModal — Hiện khi phụ huynh chưa liên kết học sinh.
 * Phụ huynh nhập: Tên con, Ngày sinh, Lớp học
 * → Hệ thống tìm + gắn vào tài khoản → Mở khoá dashboard.
 */
export default function ChildLookupModal({ onLinked }) {
  const [step, setStep] = useState("form"); // 'form' | 'loading' | 'success' | 'error'
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    class_name: "",
  });
  const [classes, setClasses] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Load danh sách lớp từ API
  useEffect(() => {
    api
      .get("/academic/classes")
      .then((res) => {
        setClasses(res.data || []);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.date_of_birth || !form.class_name) {
      setErrorMsg("Vui lòng điền đầy đủ tất cả thông tin.");
      return;
    }
    setErrorMsg("");
    setStep("loading");
    try {
      const res = await api.post("/parent/link-child", {
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        class_name: form.class_name,
      });
      if (res.data?.success) {
        setResult(res.data.student);
        setStep("success");
      } else {
        setErrorMsg(res.data?.message || "Không tìm thấy học sinh phù hợp.");
        setStep("form");
      }
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || "Lỗi kết nối. Vui lòng thử lại.",
      );
      setStep("form");
    }
  };

  const handleContinue = () => {
    onLinked(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-lg" />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden">
        {/* Top Color Bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary to-secondary" />

        <div className="p-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-500 ${
                step === "success"
                  ? "bg-secondary scale-110"
                  : "bg-primary-container"
              }`}
            >
              <span
                className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {step === "success" ? "child_care" : "family_restroom"}
              </span>
            </div>

            {step === "success" ? (
              <>
                <h2 className="text-2xl font-extrabold text-secondary font-headline mb-1">
                  Liên Kết Thành Công!
                </h2>
                <p className="text-slate-500 text-sm">
                  Tài khoản đã được kết nối với hồ sơ của con.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-primary font-headline mb-1">
                  Xác Nhận Thông Tin Con
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Nhập thông tin của con để kết nối tài khoản với hồ sơ học sinh
                  tại trường.
                </p>
              </>
            )}
          </div>

          {/* SUCCESS STATE */}
          {step === "success" && result && (
            <div className="space-y-5">
              <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-2xl font-black shrink-0">
                  {result.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-lg text-on-surface font-headline">
                    {result.full_name}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary">
                      school
                    </span>
                    Lớp {result.classroom?.class_name || "Chưa rõ"}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    Đã liên kết
                  </span>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-full font-bold font-headline shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-base flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
                Vào Dashboard Của Con
              </button>
            </div>
          )}

          {/* FORM STATE */}
          {(step === "form" || step === "loading") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên học sinh */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Họ và tên của con
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    person
                  </span>
                  <input
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="VD: Nguyễn Văn An"
                    disabled={step === "loading"}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Ngày sinh của con
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    cake
                  </span>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    disabled={step === "loading"}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              {/* Lớp học */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Lớp học của con
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    school
                  </span>
                  <select
                    name="class_name"
                    value={form.class_name}
                    onChange={handleChange}
                    disabled={step === "loading"}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 disabled:opacity-50 transition-all bg-white appearance-none"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.class_name || c.name}>
                        {c.class_name || c.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-start gap-2 bg-error/5 border border-error/20 text-error rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    error
                  </span>
                  <p className="text-sm font-semibold leading-relaxed">
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={step === "loading"}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-full font-bold font-headline shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all text-base flex items-center justify-center gap-2 mt-2"
              >
                {step === "loading" ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">
                      progress_activity
                    </span>
                    Đang tìm kiếm...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      search
                    </span>
                    Tìm Và Liên Kết Hồ Sơ Con
                  </>
                )}
              </button>

              {/* Helper note */}
              <p className="text-center text-xs text-slate-400 mt-2 leading-relaxed">
                <span className="material-symbols-outlined text-[13px] align-middle mr-0.5">
                  info
                </span>
                Thông tin phải khớp chính xác với hồ sơ học sinh tại trường.
                Liên hệ giáo viên nếu cần hỗ trợ.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
