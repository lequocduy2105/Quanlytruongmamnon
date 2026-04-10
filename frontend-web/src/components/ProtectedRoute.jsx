import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
};

/**
 * Wraps a route requiring authentication and a specific role.
 * - If not authenticated → redirect to /login
 * - If authenticated but wrong role → redirect to own home
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homeRoute = ROLE_HOME[user.role] || "/login";
    return <Navigate to={homeRoute} replace />;
  }

  return children;
}
