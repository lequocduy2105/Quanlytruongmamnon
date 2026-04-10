import React, { createContext, useContext, useState, useCallback } from "react";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from localStorage on page reload
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const userId = localStorage.getItem("user_id");
    if (token && role) return { token, role, userId };
    return null;
  });

  const login = useCallback(async (email, password) => {
    const response = await axiosClient.post("/login", { email, password });
    const { access_token, role, userId } = response.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_id", userId);

    setUser({ token: access_token, role, userId });
    return role; // Return role so caller can redirect
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user?.token);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy consumption
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
