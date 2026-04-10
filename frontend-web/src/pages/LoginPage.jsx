import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
};

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@school.com", role: "ADMIN" },
  { label: "Teacher", email: "teacher@school.com", role: "TEACHER" },
  { label: "Parent", email: "parent@school.com", role: "PARENT" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const role = await login(form.email, form.password);
      navigate(ROLE_HOME[role] || "/admin/dashboard", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || "Email hoặc mật khẩu không đúng.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: "password123" });
    setError("");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
            <span
              className="material-symbols-outlined text-white text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              diamond
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary font-headline tracking-tight">
            The Atelier
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Kindergarten Quality & Health Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-on-surface font-headline mb-6">
            Đăng nhập vào hệ thống
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  mail
                </span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  lock
                </span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-error-container/50 border border-error-container text-error text-sm font-medium px-4 py-3 rounded-xl">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold font-headline text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">
                    login
                  </span>
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-4">
              TÀI KHOẢN DEMO (Mật khẩu: password123)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(({ label, email, role }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(email)}
                  className="py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all text-center"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          © 2024 The Atelier Kindergarten. All rights reserved.
        </p>
      </div>
    </div>
  );
}
