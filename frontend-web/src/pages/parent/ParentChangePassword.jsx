import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useLang } from "../../contexts/LangContext";
import { useToast } from "../../components/Toast";

export default function ParentChangePassword() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const toast = useToast();
  const vi = lang === "vi";

  // Access context from layout wrapper if needed
  const outletCtx = useOutletContext() ?? {};
  const { activeStudent } = outletCtx;

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError(vi ? "Vui lòng nhập đầy đủ các trường." : "Please fill in all fields.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError(vi ? "Mật khẩu mới phải có ít nhất 6 ký tự." : "New password must be at least 6 characters.");
      return;
    }

    if (form.oldPassword === form.newPassword) {
      setError(vi ? "Mật khẩu mới không được trùng với mật khẩu cũ." : "New password cannot match old password.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(vi ? "Xác nhận mật khẩu mới không trùng khớp." : "Confirm password does not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.post("/auth/change-password-first-time", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      if (response.data && response.data.success) {
        toast({
          message: vi 
            ? "Đổi mật khẩu thành công! Chào mừng bạn đến với hệ thống." 
            : "Password changed successfully! Welcome to the system.",
          type: "success",
        });

        // Clear mustChangePassword flag on client side
        localStorage.setItem("mustChangePassword", "false");

        // Redirect to dashboard
        navigate("/parent/dashboard", { replace: true });
      } else {
        setError(response.data.error || (vi ? "Thay đổi mật khẩu thất bại." : "Change password failed."));
      }
    } catch (err) {
      console.error("Change password error:", err);
      const msg = err?.response?.data?.message || (vi ? "Đã xảy ra lỗi hệ thống." : "A system error occurred.");
      setError(msg);
      toast({
        message: msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-slate-500 font-medium mt-1">
          {vi 
            ? "Đây là lần đầu bạn đăng nhập tài khoản Phụ huynh. Vui lòng thay đổi mật khẩu tạm thời để tiếp tục sử dụng hệ thống." 
            : "This is your first login to Parent Portal. Please change your temporary password to continue."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Old Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {vi ? "Mật khẩu tạm thời" : "Temporary Password"}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              lock_open
            </span>
            <input
              name="oldPassword"
              type="password"
              value={form.oldPassword}
              onChange={handleChange}
              placeholder={vi ? "Nhập mật khẩu tạm thời được cấp" : "Enter temporary password"}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {vi ? "Mật khẩu mới" : "New Password"}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              lock
            </span>
            <input
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              placeholder={vi ? "Tối thiểu 6 ký tự" : "Minimum 6 characters"}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {vi ? "Xác nhận mật khẩu mới" : "Confirm New Password"}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              key
            </span>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder={vi ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-bold font-headline text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {vi ? "Đang xử lý..." : "Processing..."}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">
                published_with_changes
              </span>
              {vi ? "Xác nhận đổi mật khẩu" : "Update Password"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
